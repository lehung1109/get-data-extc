'use client';

import type { ExamAnswerKey, ExamQuestion, ExamQuestionResult } from '@get-data-extc/sdk';

type ExamQuestionCardProps = {
    question: ExamQuestion;
    index: number;
    answerKey: ExamAnswerKey | undefined;
    selectedAnswerIndices?: number[];
    showAnswer: boolean;
    showComments: boolean;
    onToggleAnswer?: () => void;
    onToggleComments?: () => void;
    readOnly?: boolean;
    result?: ExamQuestionResult;
};

function getAnswerHighlightClass(
    answerIndex: number,
    correctAnswerIndices: number[],
    selectedAnswerIndices: number[],
    showAnswer: boolean,
): string {
    const base = 'mb-2 block rounded-md border p-2';
    const isCorrect = correctAnswerIndices.includes(answerIndex);
    const isSelected = selectedAnswerIndices.includes(answerIndex);

    if (showAnswer && isCorrect) {
        return `${base} border-green-500 bg-green-50`;
    }

    if (showAnswer && isSelected && !isCorrect) {
        return `${base} border-red-500 bg-red-50`;
    }

    return base;
}

export function ExamQuestionCard({
    question,
    index,
    answerKey,
    selectedAnswerIndices = [],
    showAnswer,
    showComments,
    onToggleAnswer,
    onToggleComments,
    readOnly = false,
    result,
}: ExamQuestionCardProps) {
    const correctAnswerIndices = answerKey?.correctAnswerIndices ?? result?.correctAnswerIndices ?? [];
    const effectiveSelected = result?.selectedAnswerIndices ?? selectedAnswerIndices;

    return (
        <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
            <legend className="flex flex-wrap items-center gap-2 px-1">
                <span>
                    Question {index + 1} (topic {question.topicNumber}, question {question.questionNumber})
                </span>
                {result ? (
                    <span
                        className={
                            result.correct
                                ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                                : 'rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800'
                        }
                    >
                        {result.correct ? 'Correct' : 'Incorrect'}
                    </span>
                ) : null}
            </legend>

            <p className="mt-2">{question.title}</p>

            {question.url ? (
                <p className="mt-1 text-sm">
                    <a href={question.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        View on ExamTopics
                    </a>
                </p>
            ) : null}

            {question.allowsMultipleAnswers ? (
                <p className="mt-1 text-sm text-slate-600">Select multiple answers</p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
                {onToggleAnswer ? (
                    <button
                        type="button"
                        onClick={onToggleAnswer}
                        className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
                    >
                        {showAnswer ? 'Hide answer' : 'Show answer'}
                    </button>
                ) : null}
                {onToggleComments && question.comments.length > 0 ? (
                    <button
                        type="button"
                        onClick={onToggleComments}
                        className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
                    >
                        {showComments ? 'Hide comments' : `Show comments (${question.comments.length})`}
                    </button>
                ) : null}
            </div>

            <div className="mt-3">
                {question.answers.map((answer, answerIndex) => (
                    <label
                        key={`${question.id}-${answerIndex}`}
                        className={getAnswerHighlightClass(
                            answerIndex,
                            correctAnswerIndices,
                            effectiveSelected,
                            showAnswer,
                        )}
                    >
                        <input
                            type={question.allowsMultipleAnswers ? 'checkbox' : 'radio'}
                            name={question.id}
                            value={answerIndex}
                            disabled={readOnly}
                            defaultChecked={effectiveSelected.includes(answerIndex)}
                            className="mr-2"
                        />
                        {answer.text}
                    </label>
                ))}
            </div>

            {showComments && question.comments.length > 0 ? (
                <ul className="mt-4 grid gap-3 border-t border-slate-200 pt-4">
                    {question.comments.map((comment, commentIndex) => (
                        <li key={`${question.id}-comment-${commentIndex}`} className="rounded-md bg-slate-50 p-3 text-sm">
                            <div className="font-medium text-slate-800">{comment.author}</div>
                            {comment.date ? <div className="text-slate-500">{comment.date}</div> : null}
                            {comment.commentSelectedAnswer ? (
                                <div className="mt-1 text-slate-600">{comment.commentSelectedAnswer}</div>
                            ) : null}
                            <p className="mt-2 whitespace-pre-wrap text-slate-700">{comment.commentContent}</p>
                        </li>
                    ))}
                </ul>
            ) : null}
        </fieldset>
    );
}
