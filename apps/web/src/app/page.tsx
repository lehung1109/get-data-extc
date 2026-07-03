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
            <h1>Practice Exams</h1>
            <p>Select an exam code to generate a practice test from local question data.</p>

            {availableExams.length === 0 ? (
                <p>No exams with questions.json were found. Run the crawler first to populate <code>data/&lt;examCode&gt;/questions.json</code>.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
                    {availableExams.map((exam) => (
                        <li key={exam.examCode} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
                            <strong>{exam.examCode}</strong>
                            <div>{exam.questionCount} questions available</div>
                            <Link href={`/exam/${exam.examCode}`} style={{ color: '#2563eb' }}>
                                Start practice exam
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
