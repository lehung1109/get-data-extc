# AGENTS.md

## Project Overview

This project is a Bun monorepo for crawling ExamTopics discussion pages and serving practice exams.

### Workspace layout

- `apps/crawler-cli` — CLI entrypoints for crawling links and fetching questions.
- `apps/web` — Next.js app that consumes `questions.json` and runs practice exams.
- `packages/sdk` — shared SDK (crawl, parse, data validation, exam generation/scoring).
- `data/<examCode>/links.json` — crawler input for question fetching.
- `data/<examCode>/questions.json` — generated question output.

### SDK modules

- `packages/sdk/src/crawl/links.ts` — crawl discussion listing pages.
- `packages/sdk/src/crawl/questions.ts` — fetch and persist questions.
- `packages/sdk/src/lib/parse-question.ts` — pure HTML parser for one question page.
- `packages/sdk/src/data/validate.ts` — runtime validation for `questions.json`.
- `packages/sdk/src/exam/generate.ts` — deterministic exam generation.
- `packages/sdk/src/exam/score.ts` — exam scoring.

## Commands

Use Bun for all project tasks from the repository root.

```powershell
bun run crawl:links
bun run crawl:questions
bun run dev:web
bun test
bun run coverage
bun run typecheck
```

Notes:

- `bun run crawl:links` requires the `BASE_URL` environment variable.
- Crawler commands use `EXAM_CODE` when provided; default is `gh-300`.
- `DATA_DIR` defaults to `data` at the repository root; the web app sets `../../data` relative to `apps/web`.
- `bun run crawl:questions` purges `data/<examCode>/questions.json` first.
- Do not run live crawler commands casually during code changes.
- Prefer unit tests and dependency injection.

## Data Contracts

`data/<examCode>/links.json` must be a JSON array of strings.

`data/<examCode>/questions.json` is a JSON array of question objects:

```ts
type Question = {
    url: string;
    examCode: string;
    topicNumber: number;
    questionNumber: number;
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
- answer `isCorrect`: true when the `.multi-choice-item` has class `correct-hidden`.
- `comments`: one item per `.comment-container`.

Normalize scraped text with `normalizeText()` so whitespace is collapsed and trimmed.

## Coding Standards

- Keep TypeScript strict-compatible.
- Validate TypeScript edits with `bun run typecheck`.
- Prefer small, pure helpers for parsing, sorting, validation, and text normalization.
- Keep runner files import-safe with `if (import.meta.main)` guards.
- Do not put network or filesystem side effects in module top-level code.
- Use dependency injection in tests instead of live network calls.
- Reuse existing helpers from `packages/sdk` before adding new utilities.
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
- Run `bun run typecheck` after meaningful logic changes.
- Run `bun run coverage` after meaningful logic changes.

## Safety Notes

- `data/<examCode>/questions.json` is generated and can be overwritten by `bun run crawl:questions`.
- `data/<examCode>/links.json` can be overwritten by `bun run crawl:links`.
- Avoid destructive git commands unless explicitly requested.
- Do not revert unrelated user changes in this workspace.
