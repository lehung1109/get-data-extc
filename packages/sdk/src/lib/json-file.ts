import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function readJsonFile<T>(filePath: string) {
    const content = await readFile(filePath, 'utf8');

    return JSON.parse(content) as T;
}

export async function readJsonFileIfExists<T>(filePath: string, fallback: T): Promise<T> {
    try {
        return await readJsonFile<T>(filePath);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return fallback;
        }

        throw error;
    }
}

export async function writeJsonFile(filePath: string, data: unknown) {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function writeJsonFileAtomic(filePath: string, data: unknown) {
    const tempFilePath = `${filePath}.tmp`;

    await writeJsonFile(tempFilePath, data);
    await rename(tempFilePath, filePath);
}