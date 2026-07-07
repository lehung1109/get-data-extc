'use client';

import { useState } from 'react';
import type { ClientExam, ExamResult } from '@get-data-extc/sdk';
import { ExamQuestionCard } from '@/components/exam-question-card';

type ExamFormProps = Readonly<{
    exam: ClientExam;
}>;

function parseSelectedAnswerIndices(formData: FormData, questionId: string, allowsMultipleAnswers: boolean): number[] {
    const rawValues = allowsMultipleAnswers
        ? formData.getAll(questionId)
        : [formData.get(questionId)];

    return rawValues
        .filter((value): value is string => typeof value === 'string' && value !== '')
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value));
}

export function ExamForm({ exam }: ExamFormProps) {
    const [result, setResult] = useState<ExamResult | null>(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(() => new Set());
    const [revealedComments, setRevealedComments] = useState<Set<string>>(() => new Set());

    function toggleRevealed(set: Set<string>, questionId: string): Set<string> {
        const next = new Set(set);

        if (next.has(questionId)) {
            next.delete(questionId);
        } else {
            next.add(questionId);
        }

        return next;
    }

    async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const answers = exam.questions.map((question) => ({
            questionId: question.id,
            selectedAnswerIndices: parseSelectedAnswerIndices(
                formData,
                question.id,
                question.allowsMultipleAnswers,
            ),
        }));

        try {
            const response = await fetch(`/api/exams/${exam.examCode}/submit`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    examId: exam.id,
                    seed: exam.seed,
                    questionCount: exam.questions.length,
                    answers,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to submit exam.');
            }

            const nextResult: ExamResult = await response.json();
            setResult(nextResult);
            setIsResultModalOpen(true);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Failed to submit exam.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (result) {
        const resultByQuestionId = new Map(result.details.map((detail) => [detail.questionId, detail]));
        const answerKeyByQuestionId = new Map(exam.answerKey.map((entry) => [entry.questionId, entry]));

        return (
            <section className="mt-6 grid gap-6">
                {isResultModalOpen ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <dialog
                            open
                            aria-labelledby="exam-result-title"
                            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                        >
                            <h2 id="exam-result-title" className="text-2xl font-bold text-slate-900">
                                Exam Result
                            </h2>
                            <p className="mt-3 text-lg text-slate-700">
                                Score: <strong>{result.score}</strong> / {result.total}
                            </p>
                            <p className="mt-1 text-3xl font-semibold text-slate-900">{result.percentage}%</p>
                            <button
                                type="button"
                                className="mt-5 w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                                onClick={() => {
                                    setIsResultModalOpen(false);
                                }}
                            >
                                View reviewed questions
                            </button>
                        </dialog>
                    </div>
                ) : null}

                {exam.questions.map((question, index) => {
                    const detail = resultByQuestionId.get(question.id);

                    return (
                        <ExamQuestionCard
                            key={question.id}
                            question={question}
                            index={index}
                            answerKey={answerKeyByQuestionId.get(question.id)}
                            showAnswer
                            showComments={revealedComments.has(question.id)}
                            onToggleComments={() => {
                                setRevealedComments((current) => toggleRevealed(current, question.id));
                            }}
                            readOnly
                            result={detail}
                        />
                    );
                })}
            </section>
        );
    }

    const answerKeyByQuestionId = new Map(exam.answerKey.map((entry) => [entry.questionId, entry]));

    return (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-6">
            {exam.questions.map((question, index) => (
                <ExamQuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    answerKey={answerKeyByQuestionId.get(question.id)}
                    showAnswer={revealedAnswers.has(question.id)}
                    showComments={revealedComments.has(question.id)}
                    onToggleAnswer={() => {
                        setRevealedAnswers((current) => toggleRevealed(current, question.id));
                    }}
                    onToggleComments={() => {
                        setRevealedComments((current) => toggleRevealed(current, question.id));
                    }}
                />
            ))}

            {error ? <p className="text-red-700">{error}</p> : null}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-fit rounded-md bg-slate-900 px-4 py-3 text-white disabled:opacity-50"
            >
                {isSubmitting ? 'Submitting...' : 'Submit exam'}
            </button>
        </form>
    );
}
