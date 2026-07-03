import * as cheerio from 'cheerio';
import { getErrorMessage } from './lib/errors';
import { delay, fetchHtmlWithRetry, isCloudflareChallenge } from './lib/http';
import { writeJsonFile } from './lib/json-file';

const LINKS_FILE = 'links.json';
const BASE_URL = getRequiredUrlEnv('BASE_URL');
const START_PAGE = 1;
const END_PAGE = 600;
const DELAY_BETWEEN_PAGES_MS = 2000;
const EMPTY_PAGE_LIMIT = 2;
const MAX_LINKS = 113;
const LINK_KEYWORD = 'gh-300';
const LINK_SORT_KEY_PATTERN = /(?:^|\/)\d+-exam-gh-300-topic-(\d+)-question-(\d+)-discussion\/?$/;

async function crawlPages(startPage: number, endPage: number) {
    await resetLinksFile();

    const collectedLinks = new Set<string>();
    let emptyPages = 0;

    for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
        if (hasReachedMaxLinks(collectedLinks)) {
            logMaxLinksReached();
            break;
        }

        const { discussionCount, links } = await fetchPageData(pageNumber);
        emptyPages = getNextEmptyPageCount(emptyPages, discussionCount);

        if (emptyPages >= EMPTY_PAGE_LIMIT) {
            console.log(`Stopped after ${EMPTY_PAGE_LIMIT} empty pages.`);
            break;
        }

        addLinksUntilMax(collectedLinks, links);

        if (hasReachedMaxLinks(collectedLinks)) {
            logMaxLinksReached();
            break;
        }

        if (pageNumber < endPage) {
            await delay(DELAY_BETWEEN_PAGES_MS);
        }
    }

    const links = [...collectedLinks];
    await saveLinks(links);
    console.log(`Total links collected: ${links.length}`);

    return links;
}

async function fetchPageData(pageNumber: number) {
    const url = getPageUrl(pageNumber);
    console.log(`Fetching page ${pageNumber}: ${url}`);

    const html = await fetchHtmlWithRetry(url);

    if (isCloudflareChallenge(html)) {
        throw new Error(`Cloudflare challenge detected at ${url}`);
    }

    const $ = cheerio.load(html);
    const links = getLinks($).map(normalizeLink);

    logPageLinks(pageNumber, links);

    return {
        discussionCount: getDiscussionCount($),
        links,
    };
}

function logPageLinks(pageNumber: number, links: string[]) {
    console.log(`Found ${links.length} matching links on page ${pageNumber}.`);

    for (const link of links) {
        console.log(link);
    }
}

function getNextEmptyPageCount(emptyPages: number, discussionCount: number) {
    return discussionCount === 0 ? emptyPages + 1 : 0;
}

function addLinksUntilMax(collectedLinks: Set<string>, links: string[]) {
    for (const link of links) {
        if (hasReachedMaxLinks(collectedLinks)) break;

        collectedLinks.add(link);
    }
}

function hasReachedMaxLinks(collectedLinks: Set<string>) {
    return collectedLinks.size >= MAX_LINKS;
}

function logMaxLinksReached() {
    console.log(`Reached max links (${MAX_LINKS}).`);
}

async function resetLinksFile() {
    await saveLinks([]);
}

function getPageUrl(pageNumber: number) {
    return new URL(`${pageNumber}/`, BASE_URL).toString();
}

async function saveLinks(links: string[]) {
    const uniqueLinks = [...new Set(links)].slice(0, MAX_LINKS);
    const sortedLinks = [...uniqueLinks];
    sortedLinks.sort(compareLinks);

    await writeJsonFile(LINKS_FILE, sortedLinks);
}

function compareLinks(firstLink: string, secondLink: string) {
    const firstKey = getLinkSortKey(firstLink);
    const secondKey = getLinkSortKey(secondLink);

    if (!firstKey && !secondKey) return 0;
    if (!firstKey) return 1;
    if (!secondKey) return -1;

    return firstKey.topicNumber - secondKey.topicNumber
        || firstKey.questionNumber - secondKey.questionNumber;
}

function getLinkSortKey(link: string) {
    const match = LINK_SORT_KEY_PATTERN.exec(link);

    if (!match) return null;

    return {
        topicNumber: Number(match[1]),
        questionNumber: Number(match[2]),
    };
}

const getLinks = ($: cheerio.CheerioAPI) => {
    return $('.dicussion-title-container > h2 > a')
                .map((_, el) => $(el).attr('href'))
                .get()
                .filter((href) => href?.toLowerCase().includes(LINK_KEYWORD));
}

function getDiscussionCount($: cheerio.CheerioAPI) {
    return $('.dicussion-title-container > h2 > a').length;
}

function normalizeLink(link: string) {
    return new URL(link, BASE_URL).toString();
}

function getRequiredUrlEnv(name: string) {
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

crawlPages(START_PAGE, END_PAGE).catch((error) => {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
});