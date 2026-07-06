import Link from 'next/link';
import { generateExam, loadQuestions, toClientExam } from '@get-data-extc/sdk';
import { DEFAULT_QUESTION_COUNT, ensureDataDir } from '@/lib/config';
import { storeExam } from '@/lib/exam-store';
import { ExamForm } from '@/components/exam-form';
import { ExamSetupForm } from '@/components/exam-setup-form';

type ExamPageProps = {
    params: Promise<{ examCode: string }>;
    searchParams: Promise<{ count?: string }>;
};

export default async function ExamPage({ params, searchParams }: ExamPageProps) {
    ensureDataDir();

    const { examCode } = await params;
    const { count } = await searchParams;
    const questions = await loadQuestions(examCode);
    const parsedCount = count ? Number.parseInt(count, 10) : NaN;
    const isValidCount =
        Number.isInteger(parsedCount) &&
        parsedCount >= 1 &&
        parsedCount <= questions.length;

    if (!isValidCount) {
        return (
            <ExamSetupForm
                examCode={examCode}
                maxQuestions={questions.length}
                defaultCount={Math.min(DEFAULT_QUESTION_COUNT, questions.length)}
                invalidCount={count}
            />
        );
    }

    const seed = `${examCode}-${Date.now()}`;
    const exam = generateExam({
        examCode,
        questions,
        questionCount: parsedCount,
        seed,
    });

    storeExam(exam);

    const clientExam = toClientExam(exam);

    return (
        <section>
            <p>
                <Link href="/">Back to exams</Link>
                {' · '}
                <Link href={`/exam/${examCode}`}>Change question count</Link>
            </p>
            <h1>Exam: {examCode}</h1>
            <p>{clientExam.questions.length} questions · seed {clientExam.seed}</p>
            <ExamForm exam={clientExam} />
        </section>
    );
}
