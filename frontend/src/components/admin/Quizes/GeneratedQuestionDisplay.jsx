/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from 'react';
import { useGetTextBasedQuizTextByIdQuery } from '../../../services/Course_Management/textBasedQuizTextApi';
import PermissionWrapper from "../../../context/PermissionWrapper";
import { getAdminToken } from '../../../services/CookieService';

export default function GeneratedQuestionDisplay({ quizId }) {
    const { access_token } = getAdminToken();
    const {
        data: fetchedTextBasedQuestions,
        refetch: refetchTextBasedQuestions,
        isLoading,
        error
    } = useGetTextBasedQuizTextByIdQuery({ id: quizId, access_token });



    if (isLoading) {
        return <div className="p-4 text-center">Loading questions...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">Error loading questions: {error.message}</div>;
    }

    if (!fetchedTextBasedQuestions || fetchedTextBasedQuestions.length === 0) {
        return <div className="p-4 text-center">No questions available for this quiz.</div>;
    }

    // We're assuming the first item is the one we want to display
    const quizData = fetchedTextBasedQuestions[0];
    return (
        <PermissionWrapper section="Fill-in-the-Blank Generated|Multiple Choice Generated|True/False Generated">
            <div className="space-y-3">

                <h2 className="text-lg font-semibold">Generated Question:</h2>

                <PermissionWrapper section="Fill-in-the-Blank Generated" action="view">
                    {/* Fill in the Blank Questions */}
                    {quizData.FillInBlankQuestions && quizData.FillInBlankQuestions.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg">Fill in the Blank Questions</h3>
                            {quizData.FillInBlankQuestions.map((question) => (
                                <div key={question.id} className="bg-white p-4 rounded-lg border">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-medium text-slate-800">{question.text}</p>
                                        <span className="text-sm font-semibold bg-lightGreen text-forestGreen px-2 py-1 rounded">
                                            {question.marks} Marks
                                        </span>
                                    </div>
                                    <div className="flex items-center mt-2">
                                        <span className="font-semibold mr-2">Correct Answer:</span>
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{question.correctAnswer}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PermissionWrapper>

                {/* Multiple Choice Questions */}
                <PermissionWrapper section="Multiple Choice Generated" action="view">
                    {quizData.MultipleChoiceQuestions && quizData.MultipleChoiceQuestions.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg">Multiple Choice Questions</h3>
                            {quizData.MultipleChoiceQuestions.map((question) => (
                                <div key={question.id} className="bg-white p-4 rounded-lg border">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-medium text-slate-800">{question.text}</p>
                                        <span className="text-sm font-semibold bg-lightGreen text-forestGreen px-2 py-1 rounded">
                                            {question.marks} Marks
                                        </span>
                                    </div>
                                    <div className="space-y-2 mt-3">
                                        <p className="font-semibold">Options:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {question.options.map((option, index) => (
                                                <li key={index} className={option === question.correctAnswer ? "text-green-600 font-medium" : ""}>
                                                    {option}
                                                    {option === question.correctAnswer && <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded">✓ Correct</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PermissionWrapper>

                {/* True/False Questions */}
                <PermissionWrapper section="True/False Generated" action="view">
                    {quizData.TrueFalseQuestions && quizData.TrueFalseQuestions.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg">True/False Questions</h3>
                            {quizData.TrueFalseQuestions.map((question) => (
                                <div key={question.id} className="bg-white p-4 rounded-lg border">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-medium text-slate-800">{question.text}</p>
                                        <span className="text-sm font-semibold bg-lightGreen text-forestGreen px-2 py-1 rounded">
                                            {question.marks} Marks
                                        </span>
                                    </div>
                                    <div className="flex items-center mt-2">
                                        <span className="font-semibold mr-2">Correct Answer:</span>
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                            {question.correctAnswer ? "True" : "False"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </PermissionWrapper>
            </div>
        </PermissionWrapper>
    );
}