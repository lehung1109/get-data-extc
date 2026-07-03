import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ExamTopics Practice Exams',
    description: 'Practice exams generated from crawled ExamTopics question data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f8fafc', color: '#0f172a' }}>
                <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
                    {children}
                </main>
            </body>
        </html>
    );
}
