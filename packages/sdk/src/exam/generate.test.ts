import { describe, expect, test } from 'bun:test';
import type { Question } from '../types';
import { generateExam, toClientExam } from './generate';
import { pickWithSeed, shuffleWithSeed } from './random';
import { scoreExam } from './score';

const sampleQuestions: Question[] = [
    {
        url: 'https://example.test/1',
        examCode: 'gh-300',
        topicNumber: 1,
        questionNumber: 1,
        title: 'Question 1',
        answers: [
            { text: 'A', isCorrect: false },
            { text: 'B', isCorrect: true },
        ],
        comments: [],
    },
    {
        url: 'https://example.test/2',
        examCode: 'gh-300',
        topicNumber: 1,
        questionNumber: 2,
        title: 'Question 2',
        answers: [
            { text: 'C', isCorrect: true },
            { text: 'D', isCorrect: false },
        ],
        comments: [],
    },
    {
        url: 'https://example.test/3',
        examCode: 'gh-300',
        topicNumber: 2,
        questionNumber: 1,
        title: 'Question 3',
        answers: [
            { text: 'E', isCorrect: false },
            { text: 'F', isCorrect: true },
        ],
        comments: [],
    },
];

describe('exam random helpers', () => {
    test('shuffleWithSeed is deterministic for the same seed', () => {
        const items = [1, 2, 3, 4, 5];
        expect(shuffleWithSeed(items, 'seed-a')).toEqual(shuffleWithSeed(items, 'seed-a'));
        expect(shuffleWithSeed(items, 'seed-a')).not.toEqual(shuffleWithSeed(items, 'seed-b'));
    });

    test('pickWithSeed selects the requested count', () => {
        expect(pickWithSeed(sampleQuestions, 2, 'seed')).toHaveLength(2);
        expect(() => pickWithSeed(sampleQuestions, 5, 'seed')).toThrow('Cannot pick 5 questions from a pool of 3.');
    });
});

describe('generateExam', () => {
    test('creates a deterministic exam for the same seed', () => {
        const first = generateExam({
            examCode: 'gh-300',
            questions: sampleQuestions,
            questionCount: 2,
            seed: 'fixed-seed',
            examId: 'exam-1',
        });
        const second = generateExam({
            examCode: 'gh-300',
            questions: sampleQuestions,
            questionCount: 2,
            seed: 'fixed-seed',
            examId: 'exam-1',
        });

        expect(first).toEqual(second);
        expect(first.questions).toHaveLength(2);
        expect(toClientExam(first)).not.toHaveProperty('answerKey');
    });

    test('rejects empty pools for an exam code', () => {
        expect(() => generateExam({
            examCode: 'az-900',
            questions: sampleQuestions,
            questionCount: 1,
            seed: 'seed',
        })).toThrow('No questions found for exam code: az-900');
    });
});

describe('scoreExam', () => {
    test('scores submissions against the answer key', () => {
        const exam = generateExam({
            examCode: 'gh-300',
            questions: sampleQuestions,
            questionCount: 2,
            seed: 'score-seed',
            examId: 'exam-score',
        });

        const result = scoreExam(exam, {
            examId: exam.id,
            answers: exam.questions.map((question) => {
                const key = exam.answerKey.find((entry) => entry.questionId === question.id);

                return {
                    questionId: question.id,
                    selectedAnswerIndex: key?.correctAnswerIndex ?? null,
                };
            }),
        });

        expect(result.score).toBe(2);
        expect(result.total).toBe(2);
        expect(result.percentage).toBe(100);
    });

    test('rejects mismatched exam ids', () => {
        const exam = generateExam({
            examCode: 'gh-300',
            questions: sampleQuestions,
            questionCount: 1,
            seed: 'seed',
            examId: 'exam-a',
        });

        expect(() => scoreExam(exam, {
            examId: 'exam-b',
            answers: [],
        })).toThrow('Submission examId does not match exam.');
    });
});
