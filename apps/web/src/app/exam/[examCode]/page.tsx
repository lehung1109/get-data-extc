import Link from 'next/link';
import { enrichClientExam, generateExam, loadQuestions } from '@get-data-extc/sdk';
import { DEFAULT_QUESTION_COUNT, ensureDataDir } from '@/lib/config';
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

    const clientExam = enrichClientExam(exam, questions);

    return (
        <section>
            <p>
                <Link href="/" className="text-blue-600 hover:underline">Back to exams</Link>
                {' · '}
                <Link href={`/exam/${examCode}`} className="text-blue-600 hover:underline">Change question count</Link>
            </p>
            <h1 className="text-2xl font-semibold">Exam: {examCode}</h1>
            <p className="text-slate-600">{clientExam.questions.length} questions · seed {clientExam.seed}</p>
            <ExamForm exam={clientExam} />
        </section>
    );
}
