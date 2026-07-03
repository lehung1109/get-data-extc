# AGENTS.md

## Project Overview

This project is a Bun + TypeScript crawler/parser for ExamTopics discussion pages.

- `src/crawl-links.ts` crawls discussion listing pages and writes `links.json`.
- `src/fetch-questions.ts` reads `links.json`.
- `src/fetch-questions.ts` fetches discussion pages and parses question data.
- `src/fetch-questions.ts` writes `questions.json` incrementally.
- `src/lib/parse-question.ts` is the pure HTML parser for one question page.
- `src/lib/http.ts`, `src/lib/json-file.ts`, `src/lib/text.ts`, and
- `src/lib/errors.ts` contain shared helpers.
- `links.json` is crawler input for question fetching.
- `questions.json` is generated output and is purged at the start of `crawl:questions`.

## Commands

Use Bun for all project tasks.

```powershell
bun run crawl:links
bun run crawl:questions
bun test
bun run coverage
bunx tsc --noEmit
```

Notes:

- `bun run crawl:links` requires the `BASE_URL` environment variable.
- `bun run crawl:questions` fetches live URLs from `links.json`.
- `bun run crawl:questions` purges `questions.json` first.
- It rewrites `questions.json` after each successful question.
- Do not run live crawler commands casually during code changes.
- Prefer unit tests and dependency injection.

## Data Contracts

`links.json` must be a JSON array of strings.

`questions.json` is a JSON array of question objects:

```ts
type Question = {
    url: string;
    title: string;
    answers: {
        text: string;
        isCorrect: boolean;
    }[];
    comments: {
        author: string;
        date: string | null;
        commentSelectedAnswer: string;
        commentContent: string;
    }[];
};
```

Parsing rules:

- `title`: first `.card-text` text content.
- `answers`: one item per `.multi-choice-item`.
- answer `text`: direct text nodes only from `.multi-choice-item`.
- answer `text`: ignore nested element text.
- answer `isCorrect`: true when the `.multi-choice-item` has class `correct-hidden`.
- `comments`: one item per `.comment-container`.
- `author`: direct text nodes only from `.comment-username`.
- `date`: `title` attribute from `.comment-date`, or `null`.
- `commentSelectedAnswer`: full text content from `.comment-selected-answers`.
- `commentContent`: full text content from `.comment-content`.

Normalize scraped text with `normalizeText()` so whitespace is collapsed and trimmed.

## Coding Standards

- Keep TypeScript strict-compatible.
- Validate TypeScript edits with `bunx tsc --noEmit`.
- Prefer small, pure helpers for parsing, sorting, validation, and text normalization.
- Keep runner files import-safe with `if (import.meta.main)` guards.
- Do not put network or filesystem side effects in module top-level code.
- Use dependency injection in tests instead of live network calls.
- Reuse existing helpers from `src/lib/*` before adding new utilities.
- Write generated JSON with `JSON.stringify(data, null, 2)`.
- Use `writeJsonFile()` or `writeJsonFileAtomic()` for trailing newlines.
- Preserve the current indentation style: 4 spaces in TypeScript files.

## Testing Standards

- Use Bun's built-in test runner: `bun test`.
- Keep unit tests near the source they cover, using `*.test.ts`.
- Do not test against live ExamTopics pages.
- Use small HTML fixtures for parser tests.
- Use temp directories/files for JSON file tests.
- Mock or inject fetch behavior for HTTP/crawler tests.
- Run `bun test` after meaningful logic changes.
- Run `bunx tsc --noEmit` after meaningful logic changes.
- Run `bun run coverage` after meaningful logic changes.

Coverage is expected to stay high. Current project shape has coverage-focused
tests for:

- `src/crawl-links.ts`
- `src/fetch-questions.ts`
- all shared modules in `src/lib/*`

Remaining uncovered production lines are mostly CLI-only `import.meta.main`
catch blocks. Do not overfit tests just to cover those unless there is a real
behavior change.

## Safety Notes

- `questions.json` is generated and can be overwritten by `bun run crawl:questions`.
- `links.json` can be overwritten by `bun run crawl:links`.
- Avoid destructive git commands unless explicitly requested.
- Do not revert unrelated user changes in this workspace.
