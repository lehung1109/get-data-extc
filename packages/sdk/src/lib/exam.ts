import { join } from 'node:path';

export function getDataDir() {
    return process.env.DATA_DIR?.trim() || 'data';
}
const LINKS_FILE = 'links.json';
const QUESTIONS_FILE = 'questions.json';

export const DEFAULT_EXAM_CODE = 'gh-300';

export function normalizeExamCode(examCode: string) {
    const normalizedExamCode = examCode.trim().toLowerCase();

    if (!normalizedExamCode) {
        throw new Error('Exam code must not be empty.');
    }

    return normalizedExamCode;
}

export function getExamCodeEnv(name: string, fallback = DEFAULT_EXAM_CODE) {
    return normalizeExamCode(process.env[name] ?? fallback);
}

export function getExamDataFilePath(examCode: string, fileName: string) {
    return join(getDataDir(), normalizeExamCode(examCode), fileName);
}

export function getLinksFilePath(examCode = DEFAULT_EXAM_CODE) {
    return getExamDataFilePath(examCode, LINKS_FILE);
}

export function getQuestionsFilePath(examCode = DEFAULT_EXAM_CODE) {
    return getExamDataFilePath(examCode, QUESTIONS_FILE);
}