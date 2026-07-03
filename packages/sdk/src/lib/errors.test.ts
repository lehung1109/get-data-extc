import { describe, expect, test } from 'bun:test';
import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
    test('returns an Error message', () => {
        expect(getErrorMessage(new Error('boom'))).toBe('boom');
    });

    test('returns a string error as-is', () => {
        expect(getErrorMessage('plain failure')).toBe('plain failure');
    });

    test('stringifies object errors', () => {
        expect(getErrorMessage({ code: 'E_TEST' })).toBe('{"code":"E_TEST"}');
    });

    test('falls back when an error cannot be stringified', () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        expect(getErrorMessage(circular)).toBe('Unknown error');
    });
});