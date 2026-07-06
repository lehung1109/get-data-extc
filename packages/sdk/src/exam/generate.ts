import type { Question } from '../types';
import { pickWithSeed } from './random';
import type { ClientExam, Exam, ExamAnswerKey, ExamQuestion, GenerateExamOptions } from './types';

function getQuestionId(question: Question) {
    return `${question.topicNumber}-${question.questionNumber}`;
}

function toExamQuestion(question: Question, seed: string): { examQuestion: ExamQuestion; answerKey: ExamAnswerKey } {
    const answersWithIndex = question.answers.map((answer, index) => ({
        text: answer.text,
        isCorrect: answer.isCorrect,
        originalIndex: index,
    }));

    const shuffled = pickWithSeed(answersWithIndex, answersWithIndex.length, `${seed}:${getQuestionId(question)}`);
    const correctAnswerIndices = shuffled
        .map((answer, index) => (answer.isCorrect ? index : -1))
        .filter((index) => index >= 0);

    if (correctAnswerIndices.length === 0) {
        throw new Error(`Question ${getQuestionId(question)} has no correct answer.`);
    }

    return {
        examQuestion: {
            id: getQuestionId(question),
            topicNumber: question.topicNumber,
            questionNumber: question.questionNumber,
            title: question.title,
            allowsMultipleAnswers: correctAnswerIndices.length > 1,
            answers: shuffled.map(({ text }) => ({ text })),
        },
        answerKey: {
            questionId: getQuestionId(question),
            correctAnswerIndices,
        },
    };
}

export function generateExam(options: GenerateExamOptions): Exam {
    const {
        examCode,
        questions,
        questionCount,
        seed = `${examCode}-${Date.now()}`,
        examId = `exam-${seed}`,
    } = options;

    const pool = questions.filter((question) => question.examCode === examCode);

    if (pool.length === 0) {
        throw new Error(`No questions found for exam code: ${examCode}`);
    }

    const selected = pickWithSeed(pool, questionCount, seed);
    const built = selected.map((question) => toExamQuestion(question, seed));

    return {
        id: examId,
        examCode,
        seed,
        questions: built.map(({ examQuestion }) => examQuestion),
        answerKey: built.map(({ answerKey }) => answerKey),
    };
}

export function toClientExam(exam: Exam): ClientExam {
    return {
        id: exam.id,
        examCode: exam.examCode,
        seed: exam.seed,
        questions: exam.questions,
    };
}
