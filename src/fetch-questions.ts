import * as cheerio from 'cheerio';
import { getErrorMessage } from './lib/errors';
import { delay, fetchHtmlWithRetry, isCloudflareChallenge } from './lib/http';
import { readJsonFile, writeJsonFile, writeJsonFileAtomic } from './lib/json-file';
import { getDirectText, normalizeText } from './lib/text';
import type { Answer, Question, QuestionComment } from './types';

const LINKS_FILE = 'links.json';
const QUESTIONS_FILE = 'questions.json';
const DELAY_BETWEEN_QUESTIONS_MS = 2000;

async function fetchQuestions() {
    const links = await readLinks();
    const questions: Question[] = [];

    await writeJsonFile(QUESTIONS_FILE, questions);

    for (const [index, link] of links.entries()) {
        console.log(`Fetching question ${index + 1}/${links.length}: ${link}`);

        try {
            const question = await fetchQuestion(link);
            questions.push(question);
            await writeJsonFileAtomic(QUESTIONS_FILE, questions);
            console.log(`Saved question ${questions.length}: ${question.title}`);
        } catch (error) {
            console.error(`Failed to fetch ${link}: ${getErrorMessage(error)}`);
        }

        if (index < links.length - 1) {
            await delay(DELAY_BETWEEN_QUESTIONS_MS);
        }
    }

    console.log(`Total questions saved: ${questions.length}`);
}

async function readLinks() {
    const links = await readJsonFile<unknown>(LINKS_FILE);

    if (!Array.isArray(links) || links.some((link) => typeof link !== 'string')) {
        throw new Error(`${LINKS_FILE} must be a JSON array of strings.`);
    }

    return links;
}

async function fetchQuestion(url: string) {
    const html = await fetchHtmlWithRetry(url);

    if (isCloudflareChallenge(html)) {
        throw new Error('Cloudflare challenge detected.');
    }

    return parseQuestion(url, html);
}

function parseQuestion(url: string, html: string): Question {
    const $ = cheerio.load(html);

    return {
        url,
        title: normalizeText($('.card-text').first().text()),
        answers: parseAnswers($),
        comments: parseComments($),
    };
}

function parseAnswers($: cheerio.CheerioAPI): Answer[] {
    return $('.multi-choice-item')
        .map((_, element) => ({
            text: getDirectText($, element),
            isCorrect: $(element).hasClass('correct-hidden'),
        }))
        .get();
}

function parseComments($: cheerio.CheerioAPI): QuestionComment[] {
    return $('.comment-container')
        .map((_, element) => {
            const comment = $(element);
            const username = comment.find('.comment-username').first();

            return {
                author: getDirectText($, username.get(0)),
                date: comment.find('.comment-date').first().attr('title') ?? null,
                commentSelectedAnswer: normalizeText(comment.find('.comment-selected-answers').text()),
                commentContent: normalizeText(comment.find('.comment-content').text()),
            };
        })
        .get();
}

fetchQuestions().catch((error) => {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
});