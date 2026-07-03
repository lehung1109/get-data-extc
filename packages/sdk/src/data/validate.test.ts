import { describe, expect, test } from 'bun:test';
import type { Question } from '../types';
import { isQuestion, validateQuestions } from './validate';

const validQuestion: Question = {
    url: 'https://example.test/view/1-exam-gh-300-topic-1-question-1-discussion/',
    examCode: 'gh-300',
    topicNumber: 1,
    questionNumber: 1,
    title: 'Title',
    answers: [{ text: 'A', isCorrect: true }],
    comments: [{
        author: 'user',
        date: null,
        commentSelectedAnswer: 'A',
        commentContent: 'content',
    }],
};

describe('validateQuestions', () => {
    test('accepts valid question arrays', () => {
        expect(validateQuestions([validQuestion])).toEqual([validQuestion]);
        expect(isQuestion(validQuestion)).toBe(true);
    });

    test('rejects non-array input', () => {
        expect(() => validateQuestions({})).toThrow('questions.json must be a JSON array.');
    });

    test('rejects invalid question entries', () => {
        expect(() => validateQuestions([{ ...validQuestion, title: 1 }])).toThrow('Invalid question at index 0.');
    });
});
