import { describe, expect, test } from 'bun:test';
import type { ExamSubmission } from '@get-data-extc/sdk';
import { getOverSelectedQuestionId } from './route-helpers';

describe('getOverSelectedQuestionId', () => {
    test('returns null when all selections are within limits', () => {
        const payload: ExamSubmission = {
            examId: 'exam-1',
            seed: 'seed',
            questionCount: 2,
            answers: [
                { questionId: '1-1', selectedAnswerIndices: [0] },
                { questionId: '1-2', selectedAnswerIndices: [0, 1] },
            ],
        };
        const maxSelectionsByQuestionId = new Map<string, number>([
            ['1-1', 1],
            ['1-2', 2],
        ]);

        expect(getOverSelectedQuestionId(payload, maxSelectionsByQuestionId)).toBeNull();
    });

    test('returns question id when a selection exceeds its limit', () => {
        const payload: ExamSubmission = {
            examId: 'exam-1',
            seed: 'seed',
            questionCount: 1,
            answers: [{ questionId: '1-1', selectedAnswerIndices: [0, 1, 2] }],
        };
        const maxSelectionsByQuestionId = new Map<string, number>([['1-1', 2]]);

        expect(getOverSelectedQuestionId(payload, maxSelectionsByQuestionId)).toBe('1-1');
    });
});
