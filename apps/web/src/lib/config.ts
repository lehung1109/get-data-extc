import { join } from 'node:path';

export function ensureDataDir() {
    if (!process.env.DATA_DIR) {
        process.env.DATA_DIR = join(process.cwd(), '../../data');
    }
}

export const DEFAULT_QUESTION_COUNT = 10;
