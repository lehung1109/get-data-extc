import { afterEach, describe, expect, test } from 'bun:test';
import { delay, fetchHtml, fetchHtmlWithRetry, isCloudflareChallenge } from './http';

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

function mockFetch(fetchFn: () => Promise<Response>) {
    async function mockedFetch() {
        return fetchFn();
    }

    mockedFetch.preconnect = () => undefined;
    globalThis.fetch = mockedFetch;
}

describe('fetchHtml', () => {
    test('returns the response body when fetch succeeds', async () => {
        mockFetch(async () => new Response('<html>ok</html>'));

        await expect(fetchHtml('https://example.test')).resolves.toBe('<html>ok</html>');
    });

    test('throws for non-ok HTTP responses', async () => {
        mockFetch(async () => new Response('', {
            status: 404,
            statusText: 'Not Found',
        }));

        await expect(fetchHtml('https://example.test/missing')).rejects.toThrow('HTTP 404 Not Found');
    });
});

describe('fetchHtmlWithRetry', () => {
    test('retries and returns the later successful response', async () => {
        let calls = 0;

        mockFetch(async () => {
            calls += 1;

            if (calls === 1) {
                throw new Error('temporary failure');
            }

            return new Response('ok after retry');
        });

        await expect(fetchHtmlWithRetry('https://example.test', {
            retryCount: 1,
            retryDelayMs: 0,
        })).resolves.toBe('ok after retry');
        expect(calls).toBe(2);
    });

    test('throws the last error after retries are exhausted', async () => {
        mockFetch(async () => {
            throw new Error('still failing');
        });

        await expect(fetchHtmlWithRetry('https://example.test', {
            retryCount: 1,
            retryDelayMs: 0,
        })).rejects.toThrow('still failing');
    });
});

describe('isCloudflareChallenge', () => {
    test('detects known Cloudflare challenge markers', () => {
        expect(isCloudflareChallenge('<title>Just a moment...</title>')).toBe(true);
        expect(isCloudflareChallenge('<script src="/cdn-cgi/challenge-platform/cf-chl.js"></script>')).toBe(true);
        expect(isCloudflareChallenge('Checking your browser before accessing')).toBe(true);
        expect(isCloudflareChallenge('Verify you are human')).toBe(true);
        expect(isCloudflareChallenge('cf-browser-verification')).toBe(true);
    });

    test('returns false for normal HTML', () => {
        expect(isCloudflareChallenge('<main>Question content</main>')).toBe(false);
    });
});

describe('delay', () => {
    test('resolves after the requested delay', async () => {
        await expect(delay(0)).resolves.toBeUndefined();
    });
});