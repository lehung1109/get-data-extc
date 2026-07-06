import type { Exam, ExamResult, ExamSubmission } from './types';

function answerIndicesMatch(selected: number[], correct: number[]): boolean {
    if (selected.length !== correct.length) {
        return false;
    }

    const sortedSelected = [...selected].sort((left, right) => left - right);
    const sortedCorrect = [...correct].sort((left, right) => left - right);

    return sortedSelected.every((value, index) => value === sortedCorrect[index]);
}

export function scoreExam(exam: Exam, submission: ExamSubmission): ExamResult {
    if (submission.examId !== exam.id) {
        throw new Error('Submission examId does not match exam.');
    }

    const answerKeyByQuestionId = new Map(
        exam.answerKey.map((entry) => [entry.questionId, entry.correctAnswerIndices]),
    );

    const details = exam.questions.map((question) => {
        const correctAnswerIndices = answerKeyByQuestionId.get(question.id);

        if (correctAnswerIndices === undefined) {
            throw new Error(`Missing answer key for question ${question.id}.`);
        }

        const submitted = submission.answers.find((answer) => answer.questionId === question.id);
        const selectedAnswerIndices = submitted?.selectedAnswerIndices ?? [];
        const correct = answerIndicesMatch(selectedAnswerIndices, correctAnswerIndices);

        return {
            questionId: question.id,
            correct,
            selectedAnswerIndices,
            correctAnswerIndices,
        };
    });

    const score = details.filter((detail) => detail.correct).length;
    const total = details.length;

    return {
        examId: exam.id,
        score,
        total,
        percentage: total === 0 ? 0 : Math.round((score / total) * 100),
        details,
    };
}
