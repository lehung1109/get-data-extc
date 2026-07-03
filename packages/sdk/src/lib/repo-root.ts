import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR_NAME = 'data';

function isMonorepoRoot(dir: string): boolean {
    const packageJsonPath = join(dir, 'package.json');
    const bunLockPath = join(dir, 'bun.lock');

    if (!existsSync(packageJsonPath) || !existsSync(bunLockPath)) {
        return false;
    }

    try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { workspaces?: unknown };
        return Array.isArray(packageJson.workspaces) && packageJson.workspaces.length > 0;
    } catch {
        return false;
    }
}

export function findMonorepoRoot(startDir: string = process.cwd()): string | null {
    let current = resolve(startDir);

    while (true) {
        if (isMonorepoRoot(current)) {
            return current;
        }

        const parent = dirname(current);
        if (parent === current) {
            return null;
        }

        current = parent;
    }
}

function getRepoRootFromSdkLocation(): string | null {
    const sdkLibDir =
        typeof import.meta.dir === 'string' ? import.meta.dir : dirname(fileURLToPath(import.meta.url));
    const repoRoot = resolve(sdkLibDir, '../../..');
    return isMonorepoRoot(repoRoot) ? repoRoot : null;
}

export function resolveDefaultDataDir(cwd: string = process.cwd()): string {
    const repoRoot = findMonorepoRoot(cwd) ?? getRepoRootFromSdkLocation();
    if (repoRoot) {
        return join(repoRoot, DATA_DIR_NAME);
    }

    return DATA_DIR_NAME;
}
