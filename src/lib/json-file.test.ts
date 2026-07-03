import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { readJsonFile, writeJsonFile, writeJsonFileAtomic } from './json-file';

let tempDir = '';

beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'get-data-extc-json-'));
});

afterEach(async () => {
    await rm(tempDir, { force: true, recursive: true });
});

describe('json-file helpers', () => {
    test('writes formatted JSON and reads it back', async () => {
        const filePath = join(tempDir, 'data.json');

        await writeJsonFile(filePath, [{ name: 'alpha' }]);

        expect(await readFile(filePath, 'utf8')).toBe('[\n  {\n    "name": "alpha"\n  }\n]\n');
        await expect(readJsonFile(filePath)).resolves.toEqual([{ name: 'alpha' }]);
    });

    test('writes JSON atomically and removes the temporary file', async () => {
        const filePath = join(tempDir, 'atomic.json');

        await writeJsonFileAtomic(filePath, { ok: true });

        await expect(readJsonFile(filePath)).resolves.toEqual({ ok: true });
        await expect(readFile(`${filePath}.tmp`, 'utf8')).rejects.toThrow();
    });
});