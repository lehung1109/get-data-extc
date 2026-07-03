import * as cheerio from 'cheerio';
import { describe, expect, test } from 'bun:test';
import { getDirectText, normalizeText } from './text';

describe('normalizeText', () => {
    test('trims and collapses whitespace', () => {
        expect(normalizeText('  first\n\t second   third  ')).toBe('first second third');
    });
});

describe('getDirectText', () => {
    test('returns only direct text nodes and ignores nested elements', () => {
        const $ = cheerio.load(`
            <div class="multi-choice-item">
                A. Keep this text
                <span>ignore this nested text</span>
                and this tail text
            </div>
        `);

        expect(getDirectText($, $('.multi-choice-item').get(0))).toBe('A. Keep this text and this tail text');
    });
});