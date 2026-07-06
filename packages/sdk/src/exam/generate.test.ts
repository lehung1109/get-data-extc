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

const multiSelectQuestion: Question = {
    url: 'https://example.test/multi',
    examCode: 'gh-300',
    topicNumber: 1,
    questionNumber: 8,
    title: 'Choose two answers',
    answers: [
        { text: 'A', isCorrect: true },
        { text: 'B', isCorrect: true },
        { text: 'C', isCorrect: false },
        { text: 'D', isCorrect: false },
    ],
    comments: [],
};

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

    test('marks multi-select questions and stores all correct answer indices', () => {
        const exam = generateExam({
            examCode: 'gh-300',
            questions: [multiSelectQuestion],
            questionCount: 1,
            seed: 'multi-seed',
            examId: 'exam-multi',
        });

        const question = exam.questions[0];
        const answerKey = exam.answerKey[0];

        expect(question?.allowsMultipleAnswers).toBe(true);
        expect(answerKey?.correctAnswerIndices).toHaveLength(2);
        expect(answerKey?.correctAnswerIndices.every((index) => question?.answers[index])).toBe(true);
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
                    selectedAnswerIndices: key?.correctAnswerIndices ?? [],
                };
            }),
        });

        expect(result.score).toBe(2);
        expect(result.total).toBe(2);
        expect(result.percentage).toBe(100);
    });

    test('scores multi-select questions only when all correct answers are selected', () => {
        const exam = generateExam({
            examCode: 'gh-300',
            questions: [multiSelectQuestion],
            questionCount: 1,
            seed: 'multi-score-seed',
            examId: 'exam-multi-score',
        });

        const answerKey = exam.answerKey[0]?.correctAnswerIndices ?? [];

        const perfectResult = scoreExam(exam, {
            examId: exam.id,
            answers: [{
                questionId: exam.questions[0]?.id ?? '',
                selectedAnswerIndices: answerKey,
            }],
        });
        expect(perfectResult.score).toBe(1);

        const partialResult = scoreExam(exam, {
            examId: exam.id,
            answers: [{
                questionId: exam.questions[0]?.id ?? '',
                selectedAnswerIndices: answerKey.slice(0, 1),
            }],
        });
        expect(partialResult.score).toBe(0);

        const extraResult = scoreExam(exam, {
            examId: exam.id,
            answers: [{
                questionId: exam.questions[0]?.id ?? '',
                selectedAnswerIndices: [...answerKey, (answerKey[0] ?? 0) + 1],
            }],
        });
        expect(extraResult.score).toBe(0);
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
