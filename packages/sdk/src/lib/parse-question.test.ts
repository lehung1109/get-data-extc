import { describe, expect, test } from 'bun:test';
import { parseQuestion } from './parse-question';

const firstQuestionUrl = 'https://example.test/view/1-exam-gh-300-topic-2-question-1-discussion/';
const secondQuestionUrl = 'https://example.test/view/2-exam-az-900-topic-1-question-2-discussion/';

describe('parseQuestion', () => {
    test('parses title, direct answer text, correct answer, and comments', () => {
        const html = `
            <article>
                <p class="card-text">
                    Which option should be selected?
                </p>
                <div class="multi-choice-item">
                    A. First answer
                    <span class="badge">ignored badge</span>
                </div>
                <div class="multi-choice-item correct-hidden">
                    B. Correct answer
                    <span>ignored nested text</span>
                </div>
                <section class="comment-container">
                    <span class="comment-username">
                        alice
                        <span class="rank">ignored rank</span>
                    </span>
                    <time class="comment-date" title="2026-07-03 09:30 UTC">today</time>
                    <div class="comment-selected-answers">
                        Selected Answer: B
                    </div>
                    <div class="comment-content">
                        The direct evidence points to B.
                    </div>
                </section>
            </article>
        `;

        expect(parseQuestion(firstQuestionUrl, html)).toEqual({
            examCode: 'gh-300',
            topicNumber: 2,
            questionNumber: 1,
            url: firstQuestionUrl,
            title: 'Which option should be selected?',
            answers: [
                {
                    text: 'A. First answer',
                    isCorrect: false,
                },
                {
                    text: 'B. Correct answer',
                    isCorrect: true,
                },
            ],
            comments: [
                {
                    author: 'alice',
                    date: '2026-07-03 09:30 UTC',
                    commentSelectedAnswer: 'Selected Answer: B',
                    commentContent: 'The direct evidence points to B.',
                },
            ],
        });
    });

    test('uses null date and empty comments when optional comment fields are missing', () => {
        const html = `
            <p class="card-text">Question without full comment metadata</p>
            <div class="multi-choice-item">A. Only answer</div>
            <section class="comment-container">
                <span class="comment-username">bob</span>
                <div class="comment-content">Looks right.</div>
            </section>
        `;

        expect(parseQuestion(secondQuestionUrl, html)).toEqual({
            examCode: 'az-900',
            topicNumber: 1,
            questionNumber: 2,
            url: secondQuestionUrl,
            title: 'Question without full comment metadata',
            answers: [
                {
                    text: 'A. Only answer',
                    isCorrect: false,
                },
            ],
            comments: [
                {
                    author: 'bob',
                    date: null,
                    commentSelectedAnswer: '',
                    commentContent: 'Looks right.',
                },
            ],
        });
    });

    test('rejects URLs that are not ExamTopics discussion URLs', () => {
        expect(() => parseQuestion('https://example.test/question-1', '<p class="card-text">Question?</p>'))
            .toThrow('URL is not an ExamTopics discussion URL: https://example.test/question-1');
    });
});