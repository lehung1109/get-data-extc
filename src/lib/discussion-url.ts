const DISCUSSION_URL_PATTERN = /(?:^|\/)\d+-exam-([a-z0-9-]+)-topic-(\d+)-question-(\d+)-discussion\/?$/i;

export type DiscussionUrlMetadata = {
    examCode: string;
    topicNumber: number;
    questionNumber: number;
};

export function parseDiscussionUrlMetadata(link: string): DiscussionUrlMetadata | null {
    const match = DISCUSSION_URL_PATTERN.exec(getPathname(link));

    if (!match) return null;

    return {
        examCode: match[1].toLowerCase(),
        topicNumber: Number(match[2]),
        questionNumber: Number(match[3]),
    };
}

export function isDiscussionLinkForExam(link: string, examCode: string) {
    return parseDiscussionUrlMetadata(link)?.examCode === examCode.toLowerCase();
}

function getPathname(link: string) {
    try {
        return new URL(link).pathname;
    } catch {
        return link.split(/[?#]/, 1)[0];
    }
}