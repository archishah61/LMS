// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGetPredefinedQuestionsByQuizIdQuery } from "../../../services/Masters/quizPreDefinedQuestionsApi";
import { useGetPreDefinedQuestionsQuery } from "../../../services/Masters/predefinedQuestionAPI"; // Fetch all questions at once
import { Loader2 } from "lucide-react";
import PermissionWrapper from "../../../context/PermissionWrapper";

const QuizPredefinedQuestions = () => {
    const { quizId } = useParams();

    // Fetch predefined question mappings by quiz ID
    const { data: mappingsData, isLoading: isMappingsLoading } = useGetPredefinedQuestionsByQuizIdQuery(quizId);

    // Fetch all predefined questions (instead of fetching one by one)
    const { data: allPredefinedQuestions, isLoading: isQuestionsLoading } = useGetPreDefinedQuestionsQuery();

    const [predefinedQuestions, setPredefinedQuestions] = useState([]);

    useEffect(() => {
        if (mappingsData && mappingsData.data.length > 0 && allPredefinedQuestions) {
            // Extract assigned question IDs
            const assignedIds = mappingsData.data.map((mapping) => mapping.pre_defined_question_id);

            // Filter out the full question details
            const assignedQuestions = allPredefinedQuestions.filter((q) => assignedIds.includes(q.id));

            setPredefinedQuestions(assignedQuestions);
        }
    }, [mappingsData, allPredefinedQuestions]);

    return (
        <div className="max-w-full mt-7 mx-auto">
            <PermissionWrapper section="Quiz Predefined Questions&Predefined Questions">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Predefined Questions for Quiz {quizId}</h2>

            {/* {/ Loading State /} */}
            {isMappingsLoading || isQuestionsLoading ? (
                <div className="flex justify-center items-center h-32">
                    <Loader2 className="animate-spin text-leafGreen" size={36} />
                    <p className="ml-2 text-gray-700">Loading predefined questions...</p>
                </div>
            ) : predefinedQuestions.length > 0 ? (
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className=" bg-lightGreen">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Question
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Marks
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {predefinedQuestions.map((question) => (
                                <tr key={question.id} className="hover: hover:bg-lightGreen/50 transition-all duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{question.question_text}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.question_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{question.marks || "N/A"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white shadow-lg rounded-xl p-8 text-center border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl mb-8">
                    <p className="text-gray-500">No predefined questions assigned to this quiz.</p>
                </div>
            )}
            </PermissionWrapper>
        </div>
    );
};

export default QuizPredefinedQuestions;
