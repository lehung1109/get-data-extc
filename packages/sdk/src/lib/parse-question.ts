import * as cheerio from 'cheerio';
import { parseDiscussionUrlMetadata } from './discussion-url';
import { getDirectText, normalizeText } from './text';
import type { Answer, Question, QuestionComment } from '../types';

export function parseQuestion(url: string, html: string): Question {
    const metadata = parseDiscussionUrlMetadata(url);

    if (!metadata) {
        throw new Error(`URL is not an ExamTopics discussion URL: ${url}`);
    }

    const $ = cheerio.load(html);

    return {
        ...metadata,
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