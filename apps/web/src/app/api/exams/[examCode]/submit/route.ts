import { NextResponse } from 'next/server';
import { scoreExam, type ExamSubmission } from '@get-data-extc/sdk';
import { ensureDataDir } from '@/lib/config';
import { getStoredExam, removeExam } from '@/lib/exam-store';

type RouteContext = {
    params: Promise<{ examCode: string }>;
};

export async function POST(request: Request, context: RouteContext) {
    ensureDataDir();

    const { examCode } = await context.params;
    const payload = await request.json() as ExamSubmission;
    const exam = getStoredExam(payload.examId);

    if (!exam) {
        return NextResponse.json({ error: 'Exam session not found or expired.' }, { status: 404 });
    }

    if (exam.examCode !== examCode) {
        return NextResponse.json({ error: 'Exam code does not match session.' }, { status: 400 });
    }

    try {
        const result = scoreExam(exam, payload);
        removeExam(exam.id);

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to score exam.';

        return NextResponse.json({ error: message }, { status: 400 });
    }
}
