export type { Answer, Question, QuestionComment } from './types';

export {
    DEFAULT_EXAM_CODE,
    getDataDir,
    getExamCodeEnv,
    getExamDataFilePath,
    getLinksFilePath,
    getQuestionsFilePath,
    normalizeExamCode,
} from './lib/exam';

export { getErrorMessage } from './lib/errors';
export { parseDiscussionUrlMetadata, isDiscussionLinkForExam } from './lib/discussion-url';
export type { DiscussionUrlMetadata } from './lib/discussion-url';
export { parseQuestion } from './lib/parse-question';
export { fetchHtml, fetchHtmlWithRetry, isCloudflareChallenge, delay } from './lib/http';
export { readJsonFile, writeJsonFile, writeJsonFileAtomic } from './lib/json-file';
export { normalizeText, getDirectText } from './lib/text';

export {
    crawlPages,
    fetchPageData,
    saveLinks,
    compareLinks,
    getLinks,
    getDiscussionCount,
    getPageUrl,
    getRequiredUrlEnv,
    getIntEnv,
    DEFAULT_START_PAGE,
    DEFAULT_END_PAGE,
    DEFAULT_MAX_LINKS,
    getNextEmptyPageCount,
    addLinksUntilMax,
    hasReachedMaxLinks,
    normalizeLink,
    getLinkSortKey,
} from './crawl/links';
export type { CrawlPagesOptions } from './crawl/links';

export { fetchQuestions, fetchQuestion, readLinks } from './crawl/questions';
export type { FetchQuestionsOptions } from './crawl/questions';

export { isQuestion, validateQuestions } from './data/validate';
export { loadQuestions, listExamCodes, examHasQuestions } from './data/load';

export type {
    Exam,
    ClientExam,
    ExamQuestion,
    ExamAnswerKey,
    ExamSubmission,
    ExamSubmissionAnswer,
    ExamResult,
    ExamQuestionResult,
    GenerateExamOptions,
} from './exam/types';

export { generateExam, toClientExam } from './exam/generate';
export { scoreExam } from './exam/score';
export { createSeededRandom, shuffleWithSeed, pickWithSeed } from './exam/random';
