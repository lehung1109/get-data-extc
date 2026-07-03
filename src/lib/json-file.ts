import { readFile, rename, writeFile } from 'node:fs/promises';

export async function readJsonFile<T>(filePath: string) {
    const content = await readFile(filePath, 'utf8');

    return JSON.parse(content) as T;
}

export async function writeJsonFile(filePath: string, data: unknown) {
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function writeJsonFileAtomic(filePath: string, data: unknown) {
    const tempFilePath = `${filePath}.tmp`;

    await writeJsonFile(tempFilePath, data);
    await rename(tempFilePath, filePath);
}