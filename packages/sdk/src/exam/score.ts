import type { Exam, ExamResult, ExamSubmission } from './types';

export function scoreExam(exam: Exam, submission: ExamSubmission): ExamResult {
    if (submission.examId !== exam.id) {
        throw new Error('Submission examId does not match exam.');
    }

    const answerKeyByQuestionId = new Map(
        exam.answerKey.map((entry) => [entry.questionId, entry.correctAnswerIndex]),
    );

    const details = exam.questions.map((question) => {
        const correctAnswerIndex = answerKeyByQuestionId.get(question.id);

        if (correctAnswerIndex === undefined) {
            throw new Error(`Missing answer key for question ${question.id}.`);
        }

        const submitted = submission.answers.find((answer) => answer.questionId === question.id);
        const selectedAnswerIndex = submitted?.selectedAnswerIndex ?? null;
        const correct = selectedAnswerIndex === correctAnswerIndex;

        return {
            questionId: question.id,
            correct,
            selectedAnswerIndex,
            correctAnswerIndex,
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
