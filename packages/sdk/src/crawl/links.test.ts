import * as cheerio from 'cheerio';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
    addLinksUntilMax,
    compareLinks,
    crawlPages,
    fetchPageData,
    getDiscussionCount,
    getLinks,
    getLinkSortKey,
    getIntEnv,
    getNextEmptyPageCount,
    getPageUrl,
    getRequiredUrlEnv,
    hasReachedMaxLinks,
    normalizeLink,
    saveLinks,
} from './links';
import { getExamCodeEnv, getLinksFilePath, normalizeExamCode } from '../lib/exam';
import { readJsonFile } from '../lib/json-file';

const originalBaseUrl = process.env.BASE_URL;
const originalStartPage = process.env.START_PAGE;
const originalEndPage = process.env.END_PAGE;
const originalMaxLinks = process.env.MAX_LINKS;
const originalDataDir = process.env.DATA_DIR;
let tempDir = '';

beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'get-data-extc-crawl-'));
    process.env.DATA_DIR = tempDir;
});

afterEach(async () => {
    process.env.BASE_URL = originalBaseUrl;
    process.env.START_PAGE = originalStartPage;
    process.env.END_PAGE = originalEndPage;
    process.env.MAX_LINKS = originalMaxLinks;

    if (originalDataDir === undefined) {
        delete process.env.DATA_DIR;
    } else {
        process.env.DATA_DIR = originalDataDir;
    }

    await rm(tempDir, { force: true, recursive: true });
});

describe('crawl link helpers', () => {
    test('builds page URLs and normalizes relative links', () => {
        expect(getPageUrl(2, 'https://example.test/discussions/')).toBe('https://example.test/discussions/2/');
        expect(normalizeLink('/view/one/', 'https://example.test/discussions/')).toBe('https://example.test/view/one/');
    });

    test('tracks empty page count and max link count', () => {
        expect(getNextEmptyPageCount(1, 0)).toBe(2);
        expect(getNextEmptyPageCount(1, 3)).toBe(0);

        const links = new Set<string>(['a']);
        expect(hasReachedMaxLinks(links, 2)).toBe(false);
        addLinksUntilMax(links, ['b', 'c'], 2);
        expect([...links]).toEqual(['a', 'b']);
        expect(hasReachedMaxLinks(links, 2)).toBe(true);
    });

    test('extracts and sorts discussion links by topic and question number', () => {
        const $ = cheerio.load(`
            <div class="dicussion-title-container"><h2><a href="/view/1-exam-gh-300-topic-2-question-1-discussion/">match</a></h2></div>
            <div class="dicussion-title-container"><h2><a href="/view/not-a-match/">skip</a></h2></div>
            <div class="dicussion-title-container"><h2><a href="/view/2-exam-gh-300-topic-1-question-3-discussion/">match</a></h2></div>
        `);

        expect(getDiscussionCount($)).toBe(3);
        expect(getLinks($)).toEqual([
            '/view/1-exam-gh-300-topic-2-question-1-discussion/',
            '/view/2-exam-gh-300-topic-1-question-3-discussion/',
        ]);
        expect(getLinkSortKey('/view/1-exam-gh-300-topic-2-question-1-discussion/')).toEqual({
            examCode: 'gh-300',
            topicNumber: 2,
            questionNumber: 1,
        });
        expect(getLinkSortKey('/view/not-a-match/')).toBeNull();
        expect(compareLinks(
            '/view/1-exam-gh-300-topic-2-question-1-discussion/',
            '/view/2-exam-gh-300-topic-1-question-3-discussion/',
        )).toBeGreaterThan(0);
    });

    test('filters discussion links by configured exam code', () => {
        const $ = cheerio.load(`
            <div class="dicussion-title-container"><h2><a href="/view/1-exam-gh-300-topic-1-question-1-discussion/">skip</a></h2></div>
            <div class="dicussion-title-container"><h2><a href="/view/2-exam-az-900-topic-1-question-2-discussion/">match</a></h2></div>
        `);

        expect(getLinks($, 'az-900')).toEqual([
            '/view/2-exam-az-900-topic-1-question-2-discussion/',
        ]);
    });

    test('normalizes exam codes and builds exam-specific links file paths', () => {
        process.env.DATA_DIR = 'data';

        expect(normalizeExamCode(' GH-300 ')).toBe('gh-300');
        expect(() => normalizeExamCode(' ')).toThrow('Exam code must not be empty.');
        expect(getLinksFilePath('AZ-900')).toBe(join('data', 'az-900', 'links.json'));
    });

    test('reads and validates BASE_URL from the environment', () => {
        process.env.BASE_URL = 'https://example.test/discussions';
        expect(getRequiredUrlEnv('BASE_URL')).toBe('https://example.test/discussions/');

        process.env.BASE_URL = '';
        expect(() => getRequiredUrlEnv('BASE_URL')).toThrow('Missing required environment variable: BASE_URL');

        process.env.BASE_URL = 'not a url';
        expect(() => getRequiredUrlEnv('BASE_URL')).toThrow('Invalid URL in environment variable BASE_URL: not a url');
    });

    test('reads integer crawl settings from the environment with defaults', () => {
        delete process.env.START_PAGE;
        delete process.env.END_PAGE;
        delete process.env.MAX_LINKS;
        expect(getIntEnv('START_PAGE', 1, 1)).toBe(1);
        expect(getIntEnv('END_PAGE', 600, 1)).toBe(600);
        expect(getIntEnv('MAX_LINKS', 113, 0)).toBe(113);

        process.env.START_PAGE = ' 5 ';
        process.env.END_PAGE = '10';
        process.env.MAX_LINKS = '0';
        expect(getIntEnv('START_PAGE', 1, 1)).toBe(5);
        expect(getIntEnv('END_PAGE', 600, 1)).toBe(10);
        expect(getIntEnv('MAX_LINKS', 113, 0)).toBe(0);

        process.env.START_PAGE = '';
        expect(getIntEnv('START_PAGE', 1, 1)).toBe(1);

        process.env.START_PAGE = 'abc';
        expect(() => getIntEnv('START_PAGE', 1, 1)).toThrow('Invalid integer in environment variable START_PAGE: abc');

        process.env.START_PAGE = '0';
        expect(() => getIntEnv('START_PAGE', 1, 1)).toThrow('Invalid integer in environment variable START_PAGE: 0');
    });

    test('reads exam code from the environment with a default fallback', () => {
        delete process.env.EXAM_CODE;
        expect(getExamCodeEnv('EXAM_CODE')).toBe('gh-300');

        process.env.EXAM_CODE = ' AZ-900 ';
        expect(getExamCodeEnv('EXAM_CODE')).toBe('az-900');
    });
});

describe('fetchPageData', () => {
    test('fetches a page and returns normalized matching links', async () => {
        const html = `
            <div class="dicussion-title-container"><h2><a href="/view/1-exam-gh-300-topic-1-question-1-discussion/">one</a></h2></div>
            <div class="dicussion-title-container"><h2><a href="/view/not-target-exam/">two</a></h2></div>
        `;

        await expect(fetchPageData(
            1,
            'https://example.test/discussions/',
            async () => html,
            { log: () => undefined },
        )).resolves.toEqual({
            discussionCount: 2,
            links: ['https://example.test/view/1-exam-gh-300-topic-1-question-1-discussion/'],
        });
    });

    test('rejects Cloudflare challenge pages', async () => {
        await expect(fetchPageData(
            1,
            'https://example.test/discussions/',
            async () => '<title>Just a moment...</title>',
            { log: () => undefined },
        )).rejects.toThrow(
            'Cloudflare challenge detected at https://example.test/discussions/1/',
        );
    });
});

describe('saveLinks', () => {
    test('deduplicates, sorts, and limits links before writing JSON', async () => {
        const filePath = join(tempDir, 'links.json');

        await saveLinks([
            'https://example.test/view/1-exam-gh-300-topic-2-question-1-discussion/',
            'https://example.test/view/2-exam-gh-300-topic-1-question-2-discussion/',
            'https://example.test/view/3-exam-gh-300-topic-1-question-1-discussion/',
            'https://example.test/view/3-exam-gh-300-topic-1-question-1-discussion/',
        ], filePath, 3);

        await expect(readJsonFile(filePath)).resolves.toEqual([
            'https://example.test/view/3-exam-gh-300-topic-1-question-1-discussion/',
            'https://example.test/view/2-exam-gh-300-topic-1-question-2-discussion/',
            'https://example.test/view/1-exam-gh-300-topic-2-question-1-discussion/',
        ]);
    });
});

describe('crawlPages', () => {
    test('stops before fetching when maxLinks has already been reached', async () => {
        let fetchCalls = 0;
        const logs: string[] = [];

        const links = await crawlPages({
            baseUrl: 'https://example.test/discussions/',
            maxLinks: 0,
            fetchPageDataFn: async () => {
                fetchCalls += 1;

                return {
                    discussionCount: 1,
                    links: ['link-1'],
                };
            },
            saveLinksFn: async () => undefined,
            logger: {
                log: (message) => logs.push(message),
            },
        });

        expect(fetchCalls).toBe(0);
        expect(links).toEqual([]);
        expect(logs).toContain('Reached max links (0).');
    });

    test('continues to the next page when no stop condition is met', async () => {
        const visitedPages: number[] = [];
        const saved: string[][] = [];

        const links = await crawlPages({
            baseUrl: 'https://example.test/discussions/',
            startPage: 1,
            endPage: 2,
            delayBetweenPagesMs: 0,
            maxLinks: 5,
            fetchPageDataFn: async (pageNumber) => {
                visitedPages.push(pageNumber);

                return {
                    discussionCount: 1,
                    links: [`link-${pageNumber}`],
                };
            },
            saveLinksFn: async (nextLinks) => {
                saved.push([...nextLinks]);
            },
            logger: {
                log: () => undefined,
            },
        });

        expect(visitedPages).toEqual([1, 2]);
        expect(links).toEqual(['link-1', 'link-2']);
        expect(saved).toEqual([['link-1'], ['link-1', 'link-2']]);
    });

    test('collects links until maxLinks is reached', async () => {
        const saved: string[][] = [];
        const logs: string[] = [];

        const links = await crawlPages({
            baseUrl: 'https://example.test/discussions/',
            startPage: 1,
            endPage: 3,
            delayBetweenPagesMs: 0,
            maxLinks: 2,
            fetchPageDataFn: async (pageNumber) => ({
                discussionCount: 1,
                links: [`link-${pageNumber}-a`, `link-${pageNumber}-b`],
            }),
            saveLinksFn: async (nextLinks) => {
                saved.push([...nextLinks]);
            },
            logger: {
                log: (message) => logs.push(message),
            },
        });

        expect(links).toEqual(['link-1-a', 'link-1-b']);
        expect(saved).toEqual([['link-1-a', 'link-1-b']]);
        expect(logs).toContain('Reached max links (2).');
        expect(logs).toContain('Total links collected: 2');
    });

    test('stops after the empty page limit is reached', async () => {
        const links = await crawlPages({
            baseUrl: 'https://example.test/discussions/',
            startPage: 1,
            endPage: 3,
            emptyPageLimit: 1,
            fetchPageDataFn: async () => ({
                discussionCount: 0,
                links: [],
            }),
            saveLinksFn: async () => undefined,
            logger: {
                log: () => undefined,
            },
        });

        expect(links).toEqual([]);
    });

    test('preserves existing links when crawling new pages', async () => {
        const linksFile = getLinksFilePath('gh-300');
        await mkdir(join(tempDir, 'gh-300'), { recursive: true });
        await writeFile(linksFile, JSON.stringify(['existing-link']));

        const links = await crawlPages({
            baseUrl: 'https://example.test/discussions/',
            examCode: 'gh-300',
            startPage: 1,
            endPage: 1,
            delayBetweenPagesMs: 0,
            maxLinks: 5,
            fetchPageDataFn: async () => ({
                discussionCount: 1,
                links: ['new-link'],
            }),
            logger: {
                log: () => undefined,
            },
        });

        expect(links).toEqual(['existing-link', 'new-link']);
        await expect(readJsonFile(linksFile)).resolves.toEqual(['existing-link', 'new-link']);
    });
});