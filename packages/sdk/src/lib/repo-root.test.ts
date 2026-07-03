import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, test } from 'bun:test';
import { findMonorepoRoot, resolveDefaultDataDir } from './repo-root';

const REPO_ROOT = resolve(import.meta.dir, '../../../..');
const CRAWLER_CLI_CWD = join(REPO_ROOT, 'apps', 'crawler-cli');

describe('repo-root helpers', () => {
    test('findMonorepoRoot from repo root', () => {
        expect(findMonorepoRoot(REPO_ROOT)).toBe(REPO_ROOT);
    });

    test('findMonorepoRoot from apps/crawler-cli cwd', () => {
        expect(findMonorepoRoot(CRAWLER_CLI_CWD)).toBe(REPO_ROOT);
    });

    test('resolveDefaultDataDir from apps/crawler-cli resolves to repo data/', () => {
        expect(resolveDefaultDataDir(CRAWLER_CLI_CWD)).toBe(join(REPO_ROOT, 'data'));
    });

    test('falls back to data when monorepo root not found', async () => {
        const tempDir = await mkdtemp(join(tmpdir(), 'get-data-extc-repo-'));

        try {
            expect(findMonorepoRoot(tempDir)).toBeNull();
            expect(resolveDefaultDataDir(tempDir)).toBe('data');
        } finally {
            await rm(tempDir, { force: true, recursive: true });
        }
    });
});
