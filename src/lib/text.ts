import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export function normalizeText(value: string) {
    return value.replace(/\s+/g, ' ').trim();
}

export function getDirectText($: cheerio.CheerioAPI, element: AnyNode | undefined) {
    if (!element) return '';

    return normalizeText(
        $(element)
            .contents()
            .filter((_, node) => node.type === 'text')
            .map((_, node) => 'data' in node ? node.data : '')
            .get()
            .join(' '),
    );
}