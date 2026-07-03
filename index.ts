import * as cheerio from 'cheerio';
import { readFile, writeFile } from 'node:fs/promises';

const LINKS_FILE = 'links.json';
const BASE_URL = getRequiredUrlEnv('BASE_URL');
const START_PAGE = 1;
const END_PAGE = 10;
const REQUEST_TIMEOUT_MS = 30000;
const DELAY_BETWEEN_PAGES_MS = 2000;
const MAX_RETRIES = 2;
const EMPTY_PAGE_LIMIT = 2;
const LINK_KEYWORD = 'gh-300';

async function crawlPages(startPage: number, endPage: number) {
    const collectedLinks = new Set<string>();
    let emptyPages = 0;

    for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
        const url = getPageUrl(pageNumber);
        console.log(`Fetching page ${pageNumber}: ${url}`);

        const html = await fetchHtmlWithRetry(url);

        if (isCloudflareChallenge(html)) {
            throw new Error(`Cloudflare challenge detected at ${url}`);
        }

        const $ = cheerio.load(html);
        const discussionCount = getDiscussionCount($);
        const links = getLinks($).map(normalizeLink);

        if (discussionCount === 0) {
            emptyPages++;

            if (emptyPages >= EMPTY_PAGE_LIMIT) {
                console.log(`Stopped after ${EMPTY_PAGE_LIMIT} empty pages.`);
                break;
            }
        } else {
            emptyPages = 0;
        }

        for (const link of links) {
            collectedLinks.add(link);
        }

        if (pageNumber < endPage) {
            await delay(DELAY_BETWEEN_PAGES_MS);
        }
    }

    const links = [...collectedLinks];
    await saveLinks(links);

    return links;
}

function getPageUrl(pageNumber: number) {
    return new URL(`${pageNumber}/`, BASE_URL).toString();
}

async function fetchHtmlWithRetry(url: string) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
        try {
            return await fetchHtml(url);
        } catch (error) {
            lastError = error;

            if (attempt > MAX_RETRIES) break;

            const retryDelay = DELAY_BETWEEN_PAGES_MS * attempt;
            console.log(`Retrying ${url} after error: ${getErrorMessage(error)}`);
            await delay(retryDelay);
        }
    }

    throw lastError;
}

async function fetchHtml(url: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        return await response.text();
    } finally {
        clearTimeout(timeout);
    }
}

async function saveLinks(links: string[]) {
    if (links.length === 0) return;

    let existingLinks: string[] = [];

    try {
        const content = await readFile(LINKS_FILE, 'utf-8');
        existingLinks = JSON.parse(content);
    } catch {
        existingLinks = [];
    }

    const uniqueLinks = [...new Set([...existingLinks, ...links])];
    await writeFile(LINKS_FILE, JSON.stringify(uniqueLinks, null, 2));
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

function isCloudflareChallenge(html: string) {
    const lowerHtml = html.toLowerCase();

    return lowerHtml.includes('just a moment')
        || lowerHtml.includes('cf-chl')
        || lowerHtml.includes('checking your browser')
        || lowerHtml.includes('verify you are human')
        || lowerHtml.includes('cf-browser-verification');
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;

    try {
        return JSON.stringify(error);
    } catch {
        return 'Unknown error';
    }
}

crawlPages(START_PAGE, END_PAGE).then(console.log).catch((error) => {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
});