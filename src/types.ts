export type Answer = {
    text: string;
    isCorrect: boolean;
};

export type QuestionComment = {
    author: string;
    date: string | null;
    commentSelectedAnswer: string;
    commentContent: string;
};

export type Question = {
    url: string;
    title: string;
    answers: Answer[];
    comments: QuestionComment[];
};