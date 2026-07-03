'use client';

import { useState } from 'react';
import type { ClientExam, ExamResult } from '@get-data-extc/sdk';

type ExamFormProps = {
    exam: ClientExam;
};

export function ExamForm({ exam }: ExamFormProps) {
    const [result, setResult] = useState<ExamResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const answers = exam.questions.map((question) => {
            const rawValue = formData.get(question.id);
            const selectedAnswerIndex = typeof rawValue === 'string' && rawValue !== ''
                ? Number.parseInt(rawValue, 10)
                : null;

            return {
                questionId: question.id,
                selectedAnswerIndex: Number.isInteger(selectedAnswerIndex) ? selectedAnswerIndex : null,
            };
        });

        try {
            const response = await fetch(`/api/exams/${exam.examCode}/submit`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    examId: exam.id,
                    answers,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to submit exam.');
            }

            setResult(await response.json());
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Failed to submit exam.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (result) {
        return (
            <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                <h2>Result</h2>
                <p>
                    Score: <strong>{result.score}</strong> / {result.total} ({result.percentage}%)
                </p>
                <ol>
                    {result.details.map((detail) => (
                        <li key={detail.questionId} style={{ marginBottom: '0.5rem' }}>
                            Question {detail.questionId}: {detail.correct ? 'Correct' : 'Incorrect'}
                        </li>
                    ))}
                </ol>
            </section>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
            {exam.questions.map((question, index) => (
                <fieldset key={question.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                    <legend>
                        Question {index + 1} (topic {question.topicNumber}, question {question.questionNumber})
                    </legend>
                    <p>{question.title}</p>
                    {question.answers.map((answer, answerIndex) => (
                        <label key={`${question.id}-${answerIndex}`} style={{ display: 'block', marginBottom: '0.5rem' }}>
                            <input type="radio" name={question.id} value={answerIndex} />
                            {' '}
                            {answer.text}
                        </label>
                    ))}
                </fieldset>
            ))}

            {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

            <button type="submit" disabled={isSubmitting} style={{ width: 'fit-content', padding: '0.75rem 1rem' }}>
                {isSubmitting ? 'Submitting...' : 'Submit exam'}
            </button>
        </form>
    );
}
