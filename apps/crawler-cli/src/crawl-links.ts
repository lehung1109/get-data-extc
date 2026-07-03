import {
    DEFAULT_END_PAGE,
    DEFAULT_MAX_LINKS,
    DEFAULT_START_PAGE,
    crawlPages,
    getErrorMessage,
    getExamCodeEnv,
    getIntEnv,
    getRequiredUrlEnv,
} from '@get-data-extc/sdk';

if (import.meta.main) {
    crawlPages({
        baseUrl: getRequiredUrlEnv('BASE_URL'),
        examCode: getExamCodeEnv('EXAM_CODE'),
        startPage: getIntEnv('START_PAGE', DEFAULT_START_PAGE, 1),
        endPage: getIntEnv('END_PAGE', DEFAULT_END_PAGE, 1),
        maxLinks: getIntEnv('MAX_LINKS', DEFAULT_MAX_LINKS, 0),
    }).catch((error) => {
        console.error(getErrorMessage(error));
        process.exitCode = 1;
    });
}
