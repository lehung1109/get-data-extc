import { getErrorMessage } from './lib/errors';
import { delay, fetchHtmlWithRetry, isCloudflareChallenge } from './lib/http';
import { readJsonFile, writeJsonFile, writeJsonFileAtomic } from './lib/json-file';
import { parseQuestion } from './lib/parse-question';
import type { Question } from './types';

const LINKS_FILE = 'links.json';
const QUESTIONS_FILE = 'questions.json';
const DELAY_BETWEEN_QUESTIONS_MS = 2000;

type FetchQuestionsOptions = {
    linksFile?: string;
    questionsFile?: string;
    delayBetweenQuestionsMs?: number;
    fetchQuestionFn?: (url: string) => Promise<Question>;
    logger?: Pick<Console, 'error' | 'log'>;
};

export async function fetchQuestions(options: FetchQuestionsOptions = {}) {
    const linksFile = options.linksFile ?? LINKS_FILE;
    const questionsFile = options.questionsFile ?? QUESTIONS_FILE;
    const delayBetweenQuestionsMs = options.delayBetweenQuestionsMs ?? DELAY_BETWEEN_QUESTIONS_MS;
    const fetchQuestionFn = options.fetchQuestionFn ?? fetchQuestion;
    const logger = options.logger ?? console;

    const links = await readLinks(linksFile);
    const questions: Question[] = [];

    await writeJsonFile(questionsFile, questions);

    for (const [index, link] of links.entries()) {
        logger.log(`Fetching question ${index + 1}/${links.length}: ${link}`);

        try {
            const question = await fetchQuestionFn(link);
            questions.push(question);
            await writeJsonFileAtomic(questionsFile, questions);
            logger.log(`Saved question ${questions.length}: ${question.title}`);
        } catch (error) {
            logger.error(`Failed to fetch ${link}: ${getErrorMessage(error)}`);
        }

        if (index < links.length - 1 && delayBetweenQuestionsMs > 0) {
            await delay(delayBetweenQuestionsMs);
        }
    }

    logger.log(`Total questions saved: ${questions.length}`);

    return questions;
}

export async function readLinks(filePath = LINKS_FILE) {
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

if (import.meta.main) {
    fetchQuestions().catch((error) => {
        console.error(getErrorMessage(error));
        process.exitCode = 1;
    });
}