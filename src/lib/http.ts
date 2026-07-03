import { getErrorMessage } from './errors';

type FetchHtmlOptions = {
    timeoutMs?: number;
    retryCount?: number;
    retryDelayMs?: number;
    headers?: HeadersInit;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY_MS = 2000;
const DEFAULT_HEADERS = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

export async function fetchHtmlWithRetry(url: string, options: FetchHtmlOptions = {}) {
    let lastError: unknown;
    const retryCount = options.retryCount ?? DEFAULT_RETRY_COUNT;
    const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

    for (let attempt = 1; attempt <= retryCount + 1; attempt++) {
        try {
            return await fetchHtml(url, options);
        } catch (error) {
            lastError = error;

            if (attempt > retryCount) break;

            const retryDelay = retryDelayMs * attempt;
            console.log(`Retrying ${url} after error: ${getErrorMessage(error)}`);
            await delay(retryDelay);
        }
    }

    throw lastError;
}

export async function fetchHtml(url: string, options: FetchHtmlOptions = {}) {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: options.headers ?? DEFAULT_HEADERS,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        return await response.text();
    } finally {
        clearTimeout(timeout);
    }
}

export function isCloudflareChallenge(html: string) {
    const lowerHtml = html.toLowerCase();

    return lowerHtml.includes('just a moment')
        || lowerHtml.includes('cf-chl')
        || lowerHtml.includes('checking your browser')
        || lowerHtml.includes('verify you are human')
        || lowerHtml.includes('cf-browser-verification');
}

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}