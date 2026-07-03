# get-data-extc

Bun monorepo for crawling ExamTopics questions and running practice exams.

## Structure

- `apps/crawler-cli` — crawl links and fetch questions
- `apps/web` — Next.js practice exam site
- `packages/sdk` — shared crawl/parse/exam SDK

## Quick start

```powershell
bun install
bun run crawl:links   # requires BASE_URL
bun run crawl:questions
bun run dev:web
```

## SDK usage example

```ts
import { loadQuestions, generateExam, scoreExam } from '@get-data-extc/sdk';

const questions = await loadQuestions('gh-300');
const exam = generateExam({
    examCode: 'gh-300',
    questions,
    questionCount: 10,
    seed: 'demo-seed',
});
const result = scoreExam(exam, {
    examId: exam.id,
    answers: exam.questions.map((question) => ({
        questionId: question.id,
        selectedAnswerIndex: 0,
    })),
});
```

## Scripts

- `bun run crawl:links`
- `bun run crawl:questions`
- `bun run dev:web`
- `bun test`
- `bun run coverage`
- `bun run typecheck`
