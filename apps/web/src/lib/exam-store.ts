import type { Exam } from '@get-data-extc/sdk';

const examSessions = new Map<string, Exam>();

export function storeExam(exam: Exam) {
    examSessions.set(exam.id, exam);
}

export function getStoredExam(examId: string) {
    return examSessions.get(examId);
}

export function removeExam(examId: string) {
    examSessions.delete(examId);
}
