import {
    crawlPages,
    getErrorMessage,
    getExamCodeEnv,
    getRequiredUrlEnv,
} from '@get-data-extc/sdk';

if (import.meta.main) {
    crawlPages({
        baseUrl: getRequiredUrlEnv('BASE_URL'),
        examCode: getExamCodeEnv('EXAM_CODE'),
    }).catch((error) => {
        console.error(getErrorMessage(error));
        process.exitCode = 1;
    });
}
