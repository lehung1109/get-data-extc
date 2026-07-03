import { getErrorMessage } from '../lib/errors';
import {
    DEFAULT_EXAM_CODE,
    getLinksFilePath,
    getQuestionsFilePath,
    normalizeExamCode,
} from '../lib/exam';
import { delay, fetchHtmlWithRetry, isCloudflareChallenge } from '../lib/http';
import { readJsonFile, readJsonFileIfExists, writeJsonFileAtomic } from '../lib/json-file';
import { parseQuestion } from '../lib/parse-question';
import { validateQuestions } from '../data/validate';
import type { Question } from '../types';

const DELAY_BETWEEN_QUESTIONS_MS = 2000;

export type FetchQuestionsOptions = {
    examCode?: string;
    linksFile?: string;
    questionsFile?: string;
    delayBetweenQuestionsMs?: number;
    fetchQuestionFn?: (url: string) => Promise<Question>;
    logger?: Pick<Console, 'error' | 'log'>;
};

export async function fetchQuestions(options: FetchQuestionsOptions = {}) {
    const examCode = normalizeExamCode(options.examCode ?? DEFAULT_EXAM_CODE);
    const linksFile = options.linksFile ?? getLinksFilePath(examCode);
    const questionsFile = options.questionsFile ?? getQuestionsFilePath(examCode);
    const delayBetweenQuestionsMs = options.delayBetweenQuestionsMs ?? DELAY_BETWEEN_QUESTIONS_MS;
    const fetchQuestionFn = options.fetchQuestionFn ?? fetchQuestion;
    const logger = options.logger ?? console;

    const links = await readLinks(linksFile);
    const questions = await loadExistingQuestions(questionsFile);
    const existingUrls = new Set(questions.map((question) => question.url));
    const linksToFetch = links.filter((link) => !existingUrls.has(link));

    if (questions.length > 0) {
        logger.log(`Loaded ${questions.length} existing questions.`);
    }

    const skippedCount = links.length - linksToFetch.length;

    if (skippedCount > 0) {
        logger.log(`Skipping ${skippedCount} links already fetched.`);
    }

    for (const [index, link] of linksToFetch.entries()) {
        logger.log(`Fetching question ${index + 1}/${linksToFetch.length}: ${link}`);

        try {
            const question = await fetchQuestionFn(link);
            questions.push(question);
            await writeJsonFileAtomic(questionsFile, questions);
            logger.log(`Saved question ${questions.length}: ${question.title}`);
        } catch (error) {
            logger.error(`Failed to fetch ${link}: ${getErrorMessage(error)}`);
        }

        if (index < linksToFetch.length - 1 && delayBetweenQuestionsMs > 0) {
            await delay(delayBetweenQuestionsMs);
        }
    }

    logger.log(`Total questions saved: ${questions.length}`);

    return questions;
}

export async function loadExistingQuestions(filePath = getQuestionsFilePath()) {
    const data = await readJsonFileIfExists<unknown>(filePath, []);

    return validateQuestions(data);
}

export async function readLinks(filePath = getLinksFilePath()) {
    const links = await readJsonFile<unknown>(filePath);

    if (!Array.isArray(links) || links.some((link) => typeof link !== 'string')) {
        throw new Error(`${filePath} must be a JSON array of strings.`);
    }

    return links;
}

export async function fetchQuestion(url: string) {
    const html = await fetchHtmlWithRetry(url);

    if (isCloudflareChallenge(html)) {
        throw new Error('Cloudflare challenge detected.');
    }

    return parseQuestion(url, html);
}
