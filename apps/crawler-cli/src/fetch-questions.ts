import {
    fetchQuestions,
    getErrorMessage,
    getExamCodeEnv,
} from '@get-data-extc/sdk';

if (import.meta.main) {
    fetchQuestions({ examCode: getExamCodeEnv('EXAM_CODE') }).catch((error) => {
        console.error(getErrorMessage(error));
        process.exitCode = 1;
    });
}
