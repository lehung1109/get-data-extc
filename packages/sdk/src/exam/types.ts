export type ExamAnswerOption = {
    text: string;
};

export type ExamQuestion = {
    id: string;
    topicNumber: number;
    questionNumber: number;
    title: string;
    allowsMultipleAnswers: boolean;
    answers: ExamAnswerOption[];
};

export type ExamAnswerKey = {
    questionId: string;
    correctAnswerIndices: number[];
};

export type Exam = {
    id: string;
    examCode: string;
    seed: string;
    questions: ExamQuestion[];
    answerKey: ExamAnswerKey[];
};

export type ExamSubmissionAnswer = {
    questionId: string;
    selectedAnswerIndices: number[];
};

export type ExamSubmission = {
    examId: string;
    answers: ExamSubmissionAnswer[];
};

export type ExamQuestionResult = {
    questionId: string;
    correct: boolean;
    selectedAnswerIndices: number[];
    correctAnswerIndices: number[];
};

export type ExamResult = {
    examId: string;
    score: number;
    total: number;
    percentage: number;
    details: ExamQuestionResult[];
};

export type GenerateExamOptions = {
    examCode: string;
    questions: import('../types').Question[];
    questionCount: number;
    seed?: string;
    examId?: string;
};

export type ClientExam = Pick<Exam, 'id' | 'examCode' | 'seed' | 'questions'>;
