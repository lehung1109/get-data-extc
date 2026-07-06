import Link from 'next/link';
import { examHasQuestions, listExamCodes, loadQuestions } from '@get-data-extc/sdk';
import { ensureDataDir } from '@/lib/config';

export default async function HomePage() {
    ensureDataDir();

    const examCodes = await listExamCodes();
    const exams = await Promise.all(examCodes.map(async (examCode) => {
        const hasQuestions = await examHasQuestions(examCode);
        const questionCount = hasQuestions ? (await loadQuestions(examCode)).length : 0;

        return { examCode, hasQuestions, questionCount };
    }));

    const availableExams = exams.filter((exam) => exam.hasQuestions);

    return (
        <section>
            <h1 className="text-2xl font-semibold">Practice Exams</h1>
            <p className="mt-2 text-slate-600">Select an exam code to generate a practice test from local question data.</p>

            {availableExams.length === 0 ? (
                <p className="mt-4">
                    No exams with questions.json were found. Run the crawler first to populate <code>data/&lt;examCode&gt;/questions.json</code>.
                </p>
            ) : (
                <ul className="mt-6 grid list-none gap-4 p-0">
                    {availableExams.map((exam) => (
                        <li key={exam.examCode} className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong>{exam.examCode}</strong>
                            <div className="text-slate-600">{exam.questionCount} questions available</div>
                            <Link href={`/exam/${exam.examCode}`} className="text-blue-600 hover:underline">
                                Configure exam
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
