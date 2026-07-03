import { getQuestionsFilePath } from '../lib/exam';
import { readJsonFile } from '../lib/json-file';
import type { Question } from '../types';
import { validateQuestions } from './validate';

export async function loadQuestions(examCode: string, questionsFile?: string): Promise<Question[]> {
    const filePath = questionsFile ?? getQuestionsFilePath(examCode);
    const data = await readJsonFile<unknown>(filePath);

    return validateQuestions(data);
}

export async function listExamCodes(dataDir?: string): Promise<string[]> {
    const { readdir } = await import('node:fs/promises');
    const baseDir = dataDir ?? (process.env.DATA_DIR?.trim() || 'data');

    try {
        const entries = await readdir(baseDir, { withFileTypes: true });

        return entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort();
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }

        throw error;
    }
}

export async function examHasQuestions(examCode: string): Promise<boolean> {
    const { access } = await import('node:fs/promises');
    const filePath = getQuestionsFilePath(examCode);

    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}
