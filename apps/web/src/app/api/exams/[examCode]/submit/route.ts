import { NextResponse } from 'next/server';
import { loadQuestions, reconstructExam, scoreExam, type ExamSubmission } from '@get-data-extc/sdk';
import { ensureDataDir } from '@/lib/config';
import { getOverSelectedQuestionId } from './route-helpers';

type RouteContext = {
    params: Promise<{ examCode: string }>;
};

export async function POST(request: Request, context: RouteContext) {
    ensureDataDir();

    const { examCode } = await context.params;
    const payload = await request.json() as ExamSubmission;

    if (!payload.seed || !Number.isInteger(payload.questionCount) || payload.questionCount < 1) {
        return NextResponse.json({ error: 'Invalid exam submission payload.' }, { status: 400 });
    }

    try {
        const questions = await loadQuestions(examCode);
        const exam = reconstructExam(examCode, questions, payload);

        if (exam.questions.length !== payload.questionCount) {
            return NextResponse.json({ error: 'Question count does not match exam.' }, { status: 400 });
        }

        if (exam.examCode !== examCode) {
            return NextResponse.json({ error: 'Exam code does not match session.' }, { status: 400 });
        }

        const maxSelectionsByQuestionId = new Map(
            exam.questions.map((question) => [question.id, question.maxSelectableAnswers]),
        );
        const overSelectedQuestionId = getOverSelectedQuestionId(payload, maxSelectionsByQuestionId);

        if (overSelectedQuestionId) {
            return NextResponse.json(
                { error: `Too many answers selected for question ${overSelectedQuestionId}.` },
                { status: 400 },
            );
        }

        const result = scoreExam(exam, payload);

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to score exam.';

        return NextResponse.json({ error: message }, { status: 400 });
    }
}
