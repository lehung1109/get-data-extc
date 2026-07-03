import type { Answer, Question, QuestionComment } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAnswer(value: unknown): value is Answer {
    return isRecord(value)
        && typeof value.text === 'string'
        && typeof value.isCorrect === 'boolean';
}

function isQuestionComment(value: unknown): value is QuestionComment {
    return isRecord(value)
        && typeof value.author === 'string'
        && (typeof value.date === 'string' || value.date === null)
        && typeof value.commentSelectedAnswer === 'string'
        && typeof value.commentContent === 'string';
}

export function isQuestion(value: unknown): value is Question {
    return isRecord(value)
        && typeof value.url === 'string'
        && typeof value.examCode === 'string'
        && typeof value.topicNumber === 'number'
        && typeof value.questionNumber === 'number'
        && typeof value.title === 'string'
        && Array.isArray(value.answers)
        && value.answers.every(isAnswer)
        && Array.isArray(value.comments)
        && value.comments.every(isQuestionComment);
}

export function validateQuestions(value: unknown): Question[] {
    if (!Array.isArray(value)) {
        throw new Error('questions.json must be a JSON array.');
    }

    const questions: Question[] = [];

    for (const [index, item] of value.entries()) {
        if (!isQuestion(item)) {
            throw new Error(`Invalid question at index ${index}.`);
        }

        questions.push(item);
    }

    return questions;
}
