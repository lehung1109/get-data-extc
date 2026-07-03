import Link from 'next/link';
import { generateExam, loadQuestions, toClientExam } from '@get-data-extc/sdk';
import { DEFAULT_QUESTION_COUNT, ensureDataDir } from '@/lib/config';
import { storeExam } from '@/lib/exam-store';
import { ExamForm } from '@/components/exam-form';

type ExamPageProps = {
    params: Promise<{ examCode: string }>;
    searchParams: Promise<{ count?: string }>;
};

export default async function ExamPage({ params, searchParams }: ExamPageProps) {
    ensureDataDir();

    const { examCode } = await params;
    const { count } = await searchParams;
    const questions = await loadQuestions(examCode);
    const questionCount = Math.min(
        Number.parseInt(count ?? String(DEFAULT_QUESTION_COUNT), 10) || DEFAULT_QUESTION_COUNT,
        questions.length,
    );
    const seed = `${examCode}-${Date.now()}`;
    const exam = generateExam({
        examCode,
        questions,
        questionCount,
        seed,
    });

    storeExam(exam);

    const clientExam = toClientExam(exam);

    return (
        <section>
            <p>
                <Link href="/">Back to exams</Link>
            </p>
            <h1>Exam: {examCode}</h1>
            <p>{clientExam.questions.length} questions · seed {clientExam.seed}</p>
            <ExamForm exam={clientExam} />
        </section>
    );
}
