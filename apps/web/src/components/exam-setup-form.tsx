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
                <Link href="/" className="text-blue-600 hover:underline">Back to exams</Link>
            </p>
            <h1 className="text-2xl font-semibold">Exam: {examCode}</h1>
            <p className="text-slate-600">{maxQuestions} questions available</p>

            {invalidCount !== undefined ? (
                <p className="text-red-700">
                    Invalid question count. Enter a number between 1 and {maxQuestions}.
                </p>
            ) : null}

            <form
                method="GET"
                action={`/exam/${examCode}`}
                className="mt-4 grid max-w-xs gap-4 rounded-lg border border-slate-200 bg-white p-4"
            >
                <label className="grid gap-2">
                    Number of questions
                    <input
                        type="number"
                        name="count"
                        min={1}
                        max={maxQuestions}
                        defaultValue={defaultCount}
                        required
                        className="rounded-md border border-slate-300 p-2"
                    />
                </label>

                <button
                    type="submit"
                    className="w-fit rounded-md bg-slate-900 px-4 py-3 text-white"
                >
                    Start exam
                </button>
            </form>
        </section>
    );
}
