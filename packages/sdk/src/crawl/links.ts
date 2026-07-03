import * as cheerio from 'cheerio';
import { getErrorMessage } from '../lib/errors';
import { isDiscussionLinkForExam, parseDiscussionUrlMetadata } from '../lib/discussion-url';
import { DEFAULT_EXAM_CODE, getLinksFilePath, normalizeExamCode } from '../lib/exam';
import { delay, fetchHtmlWithRetry, isCloudflareChallenge } from '../lib/http';
import { writeJsonFileAtomic } from '../lib/json-file';

export const DEFAULT_START_PAGE = 1;
export const DEFAULT_END_PAGE = 600;
const DELAY_BETWEEN_PAGES_MS = 2000;
const EMPTY_PAGE_LIMIT = 2;
export const DEFAULT_MAX_LINKS = 113;

type PageData = {
    discussionCount: number;
    links: string[];
};

type HtmlFetcher = (url: string) => Promise<string>;

export type CrawlPagesOptions = {
    baseUrl: string;
    examCode?: string;
    startPage?: number;
    endPage?: number;
    delayBetweenPagesMs?: number;
    emptyPageLimit?: number;
    maxLinks?: number;
    fetchPageDataFn?: (pageNumber: number, baseUrl: string, examCode: string) => Promise<PageData>;
    saveLinksFn?: (links: string[]) => Promise<void>;
    logger?: Pick<Console, 'log'>;
};

export async function crawlPages(options: CrawlPagesOptions) {
    const examCode = normalizeExamCode(options.examCode ?? DEFAULT_EXAM_CODE);
    const startPage = options.startPage ?? DEFAULT_START_PAGE;
    const endPage = options.endPage ?? DEFAULT_END_PAGE;
    const delayBetweenPagesMs = options.delayBetweenPagesMs ?? DELAY_BETWEEN_PAGES_MS;
    const emptyPageLimit = options.emptyPageLimit ?? EMPTY_PAGE_LIMIT;
    const maxLinks = options.maxLinks ?? DEFAULT_MAX_LINKS;
    const logger = options.logger ?? console;
    const fetchPageDataFn = options.fetchPageDataFn
        ?? ((pageNumber, baseUrl, nextExamCode) => fetchPageData(
            pageNumber,
            baseUrl,
            fetchHtmlWithRetry,
            logger,
            nextExamCode,
        ));
    const saveLinksFn = options.saveLinksFn ?? ((links) => saveLinks(links, getLinksFilePath(examCode), maxLinks));

    await saveLinksFn([]);

    const collectedLinks = new Set<string>();
    let emptyPages = 0;

    for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
        if (hasReachedMaxLinks(collectedLinks, maxLinks)) {
            logMaxLinksReached(maxLinks, logger);
            break;
        }

        const { discussionCount, links } = await fetchPageDataFn(pageNumber, options.baseUrl, examCode);
        emptyPages = getNextEmptyPageCount(emptyPages, discussionCount);

        if (emptyPages >= emptyPageLimit) {
            logger.log(`Stopped after ${emptyPageLimit} empty pages.`);
            break;
        }

        const previousLinkCount = collectedLinks.size;
        addLinksUntilMax(collectedLinks, links, maxLinks);

        if (collectedLinks.size > previousLinkCount) {
            await saveLinksFn([...collectedLinks]);
        }

        if (hasReachedMaxLinks(collectedLinks, maxLinks)) {
            logMaxLinksReached(maxLinks, logger);
            break;
        }

        if (pageNumber < endPage) {
            await delay(delayBetweenPagesMs);
        }
    }

    const links = [...collectedLinks];
    logger.log(`Total links collected: ${links.length}`);

    return links;
}

export async function fetchPageData(
    pageNumber: number,
    baseUrl: string,
    fetchHtmlFn: HtmlFetcher = fetchHtmlWithRetry,
    logger: Pick<Console, 'log'> = console,
    examCode = DEFAULT_EXAM_CODE,
) {
    const url = getPageUrl(pageNumber, baseUrl);
    logger.log(`Fetching page ${pageNumber}: ${url}`);

    const html = await fetchHtmlFn(url);

    if (isCloudflareChallenge(html)) {
        throw new Error(`Cloudflare challenge detected at ${url}`);
    }

    const $ = cheerio.load(html);
    const links = getLinks($, examCode).map((link) => normalizeLink(link, baseUrl));

    logPageLinks(pageNumber, links, logger);

    return {
        discussionCount: getDiscussionCount($),
        links,
    };
}

function logPageLinks(pageNumber: number, links: string[], logger: Pick<Console, 'log'> = console) {
    logger.log(`Found ${links.length} matching links on page ${pageNumber}.`);

    for (const link of links) {
        logger.log(link);
    }
}

export function getNextEmptyPageCount(emptyPages: number, discussionCount: number) {
    return discussionCount === 0 ? emptyPages + 1 : 0;
}

export function addLinksUntilMax(collectedLinks: Set<string>, links: string[], maxLinks = DEFAULT_MAX_LINKS) {
    for (const link of links) {
        if (hasReachedMaxLinks(collectedLinks, maxLinks)) break;

        collectedLinks.add(link);
    }
}

export function hasReachedMaxLinks(collectedLinks: Set<string>, maxLinks = DEFAULT_MAX_LINKS) {
    return collectedLinks.size >= maxLinks;
}

function logMaxLinksReached(maxLinks: number, logger: Pick<Console, 'log'>) {
    logger.log(`Reached max links (${maxLinks}).`);
}

export function getPageUrl(pageNumber: number, baseUrl: string) {
    return new URL(`${pageNumber}/`, baseUrl).toString();
}

export async function saveLinks(links: string[], filePath = getLinksFilePath(), maxLinks = DEFAULT_MAX_LINKS) {
    const uniqueLinks = [...new Set(links)].slice(0, maxLinks);
    const sortedLinks = [...uniqueLinks];
    sortedLinks.sort(compareLinks);

    await writeJsonFileAtomic(filePath, sortedLinks);
}

export function compareLinks(firstLink: string, secondLink: string) {
    const firstKey = getLinkSortKey(firstLink);
    const secondKey = getLinkSortKey(secondLink);

    if (!firstKey && !secondKey) return 0;
    if (!firstKey) return 1;
    if (!secondKey) return -1;

    return firstKey.examCode.localeCompare(secondKey.examCode)
        || firstKey.topicNumber - secondKey.topicNumber
        || firstKey.questionNumber - secondKey.questionNumber;
}

export function getLinkSortKey(link: string) {
    return parseDiscussionUrlMetadata(link);
}

export const getLinks = ($: cheerio.CheerioAPI, examCode = DEFAULT_EXAM_CODE) => {
    return $('.dicussion-title-container > h2 > a')
                .map((_, el) => $(el).attr('href'))
                .get()
                .filter((href) => isDiscussionLinkForExam(href, examCode));
};

export function getDiscussionCount($: cheerio.CheerioAPI) {
    return $('.dicussion-title-container > h2 > a').length;
}

export function normalizeLink(link: string, baseUrl: string) {
    return new URL(link, baseUrl).toString();
}

export function getIntEnv(name: string, fallback: number, min = 0) {
    const raw = process.env[name]?.trim();

    if (!raw) {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isInteger(value) || value < min) {
        throw new Error(`Invalid integer in environment variable ${name}: ${raw}`);
    }

    return value;
}

export function getRequiredUrlEnv(name: string) {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    try {
        const url = new URL(value);

        if (!url.pathname.endsWith('/')) {
            url.pathname = `${url.pathname}/`;
        }

        return url.toString();
    } catch {
        throw new Error(`Invalid URL in environment variable ${name}: ${value}`);
    }
}
