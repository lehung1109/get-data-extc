import Link from 'next/link';

type ExamSetupFormProps = {
    examCode: string;
    maxQuestions: number;
    defaultCount: number;
    invalidCount?: string;
};

export function ExamSetupForm({ examCode, maxQuestions, defaultCount, invalidCount }: ExamSetupFormProps) {
    return (
        <section>
            <p>
                <Link href="/">Back to exams</Link>
            </p>
            <h1>Exam: {examCode}</h1>
            <p>{maxQuestions} questions available</p>

            {invalidCount !== undefined ? (
                <p style={{ color: '#b91c1c' }}>
                    Invalid question count. Enter a number between 1 and {maxQuestions}.
                </p>
            ) : null}

            <form
                method="GET"
                action={`/exam/${examCode}`}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', display: 'grid', gap: '1rem', maxWidth: 320 }}
            >
                <label style={{ display: 'grid', gap: '0.5rem' }}>
                    Number of questions
                    <input
                        type="number"
                        name="count"
                        min={1}
                        max={maxQuestions}
                        defaultValue={defaultCount}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                </label>

                <button type="submit" style={{ width: 'fit-content', padding: '0.75rem 1rem' }}>
                    Start exam
                </button>
            </form>
        </section>
    );
}
