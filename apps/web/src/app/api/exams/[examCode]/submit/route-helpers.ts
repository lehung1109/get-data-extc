import type { ExamSubmission } from '@get-data-extc/sdk';

export function getOverSelectedQuestionId(payload: ExamSubmission, maxSelectionsByQuestionId: Map<string, number>): string | null {
    const overSelectedAnswer = payload.answers.find((answer) => {
        const maxSelectableAnswers = maxSelectionsByQuestionId.get(answer.questionId);

        if (typeof maxSelectableAnswers !== 'number') {
            return false;
        }

        return answer.selectedAnswerIndices.length > maxSelectableAnswers;
    });

    return overSelectedAnswer?.questionId ?? null;
}
