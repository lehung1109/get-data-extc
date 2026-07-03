import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { fetchQuestion, fetchQuestions, readLinks } from './fetch-questions';
import type { Question } from './types';

const questionUrl = 'https://example.test/view/1-exam-gh-300-topic-1-question-1-discussion/';

const originalFetch = globalThis.fetch;
let tempDir = '';

beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'get-data-extc-questions-'));
});

afterEach(async () => {
    globalThis.fetch = originalFetch;
    await rm(tempDir, { force: true, recursive: true });
});

function mockFetch(fetchFn: () => Promise<Response>) {
    async function mockedFetch() {
        return fetchFn();
    }

    mockedFetch.preconnect = () => undefined;
    globalThis.fetch = mockedFetch;
}

describe('readLinks', () => {
    test('reads a JSON array of links', async () => {
        const linksFile = join(tempDir, 'links.json');
        await writeFile(linksFile, JSON.stringify(['https://example.test/one']));

        await expect(readLinks(linksFile)).resolves.toEqual(['https://example.test/one']);
    });

    test('rejects non-string link data', async () => {
        const linksFile = join(tempDir, 'links.json');
        await writeFile(linksFile, JSON.stringify(['https://example.test/one', 123]));

        await expect(readLinks(linksFile)).rejects.toThrow(`${linksFile} must be a JSON array of strings.`);
    });
});

describe('fetchQuestion', () => {
    test('fetches HTML and parses one question', async () => {
        mockFetch(async () => new Response(`
            <p class="card-text">Question?</p>
            <div class="multi-choice-item correct-hidden">A. Answer</div>
        `));

        await expect(fetchQuestion(questionUrl)).resolves.toMatchObject({
            examCode: 'gh-300',
            topicNumber: 1,
            questionNumber: 1,
            url: questionUrl,
            title: 'Question?',
            answers: [
                {
                    text: 'A. Answer',
                    isCorrect: true,
                },
            ],
        });
    });

    test('rejects Cloudflare challenge pages', async () => {
        mockFetch(async () => new Response('<title>Just a moment...</title>'));

        await expect(fetchQuestion('https://example.test/question')).rejects.toThrow('Cloudflare challenge detected.');
    });
});

describe('fetchQuestions', () => {
    test('purges output, saves successful questions, and skips failed links', async () => {
        const linksFile = join(tempDir, 'links.json');
        const questionsFile = join(tempDir, 'questions.json');
        const question: Question = {
            url: 'https://example.test/ok',
            examCode: 'gh-300',
            topicNumber: 1,
            questionNumber: 1,
            title: 'Saved question',
            answers: [],
            comments: [],
        };

        await writeFile(linksFile, JSON.stringify(['https://example.test/ok', 'https://example.test/fail']));

        const questions = await fetchQuestions({
            linksFile,
            questionsFile,
            delayBetweenQuestionsMs: 0,
            fetchQuestionFn: async (url) => {
                if (url.endsWith('/fail')) throw new Error('fetch failed');

                return question;
            },
            logger: {
                error: () => undefined,
                log: () => undefined,
            },
        });

        expect(questions).toEqual([question]);
        expect(JSON.parse(await readFile(questionsFile, 'utf8'))).toEqual([question]);
    });

    test('waits between successful links when a delay is configured', async () => {
        const linksFile = join(tempDir, 'links.json');
        const questionsFile = join(tempDir, 'questions.json');
        const question: Question = {
            url: 'https://example.test/ok',
            examCode: 'gh-300',
            topicNumber: 1,
            questionNumber: 1,
            title: 'Saved question',
            answers: [],
            comments: [],
        };

        await writeFile(linksFile, JSON.stringify(['https://example.test/one', 'https://example.test/two']));

        const questions = await fetchQuestions({
            linksFile,
            questionsFile,
            delayBetweenQuestionsMs: 1,
            fetchQuestionFn: async (url) => ({
                ...question,
                url,
            }),
            logger: {
                error: () => undefined,
                log: () => undefined,
            },
        });

        expect(questions.map(({ url }) => url)).toEqual(['https://example.test/one', 'https://example.test/two']);
    });
});