import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'bun:test';
import {
    getDataDir,
    getExamCodeEnv,
    getExamDataFilePath,
    getLinksFilePath,
    getQuestionsFilePath,
    normalizeExamCode,
} from './exam';

const originalExamCode = process.env.EXAM_CODE;
const originalDataDir = process.env.DATA_DIR;

afterEach(() => {
    process.env.EXAM_CODE = originalExamCode;

    if (originalDataDir === undefined) {
        delete process.env.DATA_DIR;
    } else {
        process.env.DATA_DIR = originalDataDir;
    }
});

describe('exam helpers', () => {
    test('normalizes exam codes', () => {
        expect(normalizeExamCode(' GH-300 ')).toBe('gh-300');
        expect(normalizeExamCode('az-900')).toBe('az-900');
    });

    test('rejects empty exam codes', () => {
        expect(() => normalizeExamCode(' ')).toThrow('Exam code must not be empty.');
    });

    test('reads exam code from the environment with a fallback', () => {
        delete process.env.EXAM_CODE;
        expect(getExamCodeEnv('EXAM_CODE')).toBe('gh-300');
        expect(getExamCodeEnv('EXAM_CODE', 'AZ-900')).toBe('az-900');

        process.env.EXAM_CODE = ' SC-300 ';
        expect(getExamCodeEnv('EXAM_CODE')).toBe('sc-300');
    });

    test('builds exam-scoped data file paths', () => {
        process.env.DATA_DIR = 'data';

        expect(getExamDataFilePath('GH-300', 'custom.json')).toBe(join('data', 'gh-300', 'custom.json'));
        expect(getLinksFilePath('AZ-900')).toBe(join('data', 'az-900', 'links.json'));
        expect(getQuestionsFilePath('SC-300')).toBe(join('data', 'sc-300', 'questions.json'));
    });

    test('getDataDir uses DATA_DIR when set explicitly', () => {
        process.env.DATA_DIR = '/custom/data';
        expect(getDataDir()).toBe('/custom/data');
    });
});