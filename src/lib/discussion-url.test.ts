import { describe, expect, test } from 'bun:test';
import { isDiscussionLinkForExam, parseDiscussionUrlMetadata } from './discussion-url';

describe('discussion URL helpers', () => {
    test('parses exam code, topic number, and question number from relative links', () => {
        expect(parseDiscussionUrlMetadata('/view/12-exam-gh-300-topic-2-question-34-discussion/')).toEqual({
            examCode: 'gh-300',
            topicNumber: 2,
            questionNumber: 34,
        });
    });

    test('parses metadata from absolute links with query strings', () => {
        expect(parseDiscussionUrlMetadata('https://example.test/view/5-exam-AZ-900-topic-1-question-2-discussion/?tab=comments')).toEqual({
            examCode: 'az-900',
            topicNumber: 1,
            questionNumber: 2,
        });
    });

    test('returns null for non-discussion links', () => {
        expect(parseDiscussionUrlMetadata('/view/not-a-match/')).toBeNull();
    });

    test('matches links by normalized exam code', () => {
        expect(isDiscussionLinkForExam('/view/1-exam-GH-300-topic-1-question-1-discussion/', 'gh-300')).toBe(true);
        expect(isDiscussionLinkForExam('/view/1-exam-gh-300-topic-1-question-1-discussion/', 'az-900')).toBe(false);
    });
});