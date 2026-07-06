import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'ExamTopics Practice Exams',
    description: 'Practice exams generated from crawled ExamTopics question data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="m-0 bg-slate-50 font-sans text-slate-900">
                <main className="mx-auto max-w-3xl px-4 py-8">
                    {children}
                </main>
            </body>
        </html>
    );
}
