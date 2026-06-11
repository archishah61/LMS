/* eslint-disable react/prop-types */

import React, { useState, useEffect } from 'react';
import { FaPencilAlt } from "react-icons/fa";

const FillInTheBlanksQuestions = ({ assignmentData, blanksAnswers, setBlanksAnswers, blanksSubmitted, blanksScores }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [localAnswers, setLocalAnswers] = useState({});

    // Track the current assignment ID to isolate state
    const currentAssignmentId = assignmentData?.id;

    useEffect(() => {
        // Reset local state when assignment changes
        setLocalAnswers({});

        // Only load answers for the current assignment's questions
        if (currentAssignmentId && blanksAnswers) {
            const filteredAnswers = {};

            // Create a set of question IDs for quick lookup
            const validQuestionIds = new Set(
                assignmentData.FillTheBlanksQuestions?.map(q => q.id) || []
            );

            // Only include answers for questions in this assignment
            Object.keys(blanksAnswers).forEach(questionId => {
                if (validQuestionIds.has(parseInt(questionId)) || validQuestionIds.has(questionId)) {
                    filteredAnswers[questionId] = blanksAnswers[questionId];
                }
            });

            setLocalAnswers(filteredAnswers);
        }
    }, [currentAssignmentId, blanksAnswers, assignmentData.FillTheBlanksQuestions]);

    if (!assignmentData.FillTheBlanksQuestions || assignmentData.FillTheBlanksQuestions.length === 0) {
        return null;
    }

    const handleBlankChange = (questionId, blankIndex, value) => {
        // Create a new object to avoid reference issues
        const newAnswers = { ...blanksAnswers };

        // Initialize array for this question if needed
        if (!newAnswers[questionId]) {
            newAnswers[questionId] = [];

            // Record the first time this question is being answered
            if (typeof assignmentData.recordQuestionTime === 'function') {
                const timestamp = new Date().toLocaleString();
                assignmentData.recordQuestionTime(questionId, timestamp);
            }
        }

        // Set the value for this blank index
        newAnswers[questionId][blankIndex] = value;

        // Also update local state for immediate display
        const newLocalAnswers = { ...localAnswers };
        if (!newLocalAnswers[questionId]) {
            newLocalAnswers[questionId] = [];
        }
        newLocalAnswers[questionId][blankIndex] = value;
        setLocalAnswers(newLocalAnswers);

        // Update the answers state in parent
        setBlanksAnswers(newAnswers);
    };

    const decodeHtml = (htmlString) => {
        if (!htmlString) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return tempDiv.textContent || tempDiv.innerText || '';
    };

    const processQuestionText = (questionText) => {
        const cleanedText = questionText.replace(/(<html>|<head>|<\/head>|<body>|<\/body>|<\/html>)/g, '');
        const parts = cleanedText.split('_____');
        const cleanParts = parts.map(part => decodeHtml(part));
        return cleanParts;
    };

    const getAnswerResult = (question) => {
        if (!blanksSubmitted || !blanksScores[question.id]) return null;
        const isCorrect = blanksScores[question.id].isCorrect;
        const correctAnswer = blanksScores[question.id].correctAnswer;

        return (
            <div className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl border-2 ${isCorrect ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'}`}>
                <div className="flex items-start sm:items-center">
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0 mt-0.5 sm:mt-0 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        {isCorrect ? (
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={`font-semibold text-sm sm:text-base ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {isCorrect ? 'Correct!' : 'Incorrect!'}
                        </span>
                        {!isCorrect && (
                            <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                The correct answer is <strong className="break-words">{correctAnswer}</strong>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderFilePreview = () => {
        if (!assignmentData.file) return null;
        const fileName = assignmentData.file.split("/").pop();
        const fileExtension = fileName.split(".").pop().toLowerCase();
        const fileUrl = assignmentData.file;

        if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(fileExtension)) {
            return (
                <div className="border-2 border-dashed border-gray-200 rounded-lg xs:rounded-xl sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 w-full max-w-full">
                    <div className="p-2 xs:p-2.5 sm:p-3">
                        <div className="relative w-full max-w-full mx-auto overflow-hidden">
                            <img
                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl || "/placeholder.png"}`}
                                alt="Assignment preview"
                                className="w-full h-auto max-h-32 xs:max-h-40 sm:max-h-48 md:max-h-56 object-contain rounded-lg xs:rounded-xl shadow-lg border border-gray-200/50 mx-auto"
                                style={{ maxWidth: '100%', width: 'auto', height: 'auto' }}
                                loading="lazy"
                            />
                            <div className="absolute inset-0 rounded-lg xs:rounded-xl bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            );
        }

        if (fileExtension === "pdf") {
            return (
                <div className="border-2 border-dashed border-gray-200 rounded-lg xs:rounded-xl sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 w-full max-w-full">
                    <div className="p-2 xs:p-2.5 sm:p-3">
                        <div className="relative w-full overflow-hidden" style={{ paddingBottom: '50%' }}>
                            <iframe
                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl}#view=FitH`}
                                title="PDF Preview"
                                className="absolute top-0 left-0 w-full h-full border-none rounded-lg xs:rounded-xl shadow-lg"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (["txt", "md", "html", "css", "js", "jsx", "json", "xml", "yaml", "yml"].includes(fileExtension)) {
            return (
                <div className="border-2 border-dashed border-gray-200 rounded-lg xs:rounded-xl sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 w-full max-w-full">
                    <div className="p-2 xs:p-2.5 sm:p-3">
                        <div className="bg-white rounded-lg xs:rounded-xl shadow-sm border border-gray-200/50 p-2 xs:p-2.5 sm:p-3 md:p-4 w-full max-w-full overflow-x-auto">
                            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2 mb-1 xs:mb-1.5 sm:mb-2 md:mb-3">
                                <div className="w-3 h-3 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-1.5 h-1.5 xs:w-1.5 xs:h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-gray-600 font-medium text-xs xs:text-xs sm:text-sm md:text-base">Text File Preview</p>
                            </div>
                            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-1.5 xs:p-2 sm:p-2.5 md:p-3 rounded-lg border border-gray-200/50 w-full">
                                <p className="text-gray-600 text-xs xs:text-xs sm:text-sm md:text-base break-words leading-relaxed">
                                    Content preview requires API implementation.
                                </p>
                                <p className="text-gray-600 mt-1 xs:mt-1.5 text-xs xs:text-xs sm:text-sm md:text-base break-words leading-relaxed">
                                    The complete file can be viewed after download.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="border-2 border-dashed border-gray-200 rounded-lg xs:rounded-xl sm:rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 w-full max-w-full">
                <div className="p-2 xs:p-2.5 sm:p-3 md:p-4">
                    <div className="flex items-center justify-center p-3 xs:p-3.5 sm:p-4 md:p-5 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg xs:rounded-xl border border-amber-200/50 w-full">
                        <div className="text-center max-w-full">
                            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-lg xs:rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 xs:mb-1.5 sm:mb-2 md:mb-3 shadow-sm">
                                <svg className="w-3 h-3 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-amber-800 font-semibold text-xs xs:text-sm sm:text-sm md:text-base break-words">
                                Preview not available
                            </p>
                            <p className="text-amber-700 mt-0.5 xs:mt-1 sm:mt-1.5 text-[10px] xs:text-xs sm:text-xs md:text-sm break-words max-w-[200px] xs:max-w-[250px] sm:max-w-[300px] mx-auto">
                                File type ({fileExtension}) cannot be previewed. Please download to view.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const getFileIcon = (fileExtension) => {
        const iconClasses = "w-12 h-12 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0";
        const iconSizes = "w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7";

        switch (fileExtension) {
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "svg":
                return (
                    <div className={`${iconClasses} bg-gradient-to-br from-blue-50 to-indigo-100`}>
                        <svg className={`${iconSizes} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                );
            case "pdf":
                return (
                    <div className={`${iconClasses} bg-gradient-to-br from-red-50 to-pink-100`}>
                        <svg className={`${iconSizes} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                );
            case "doc":
            case "docx":
                return (
                    <div className={`${iconClasses} bg-gradient-to-br from-blue-50 to-cyan-100`}>
                        <svg className={`${iconSizes} text-blue-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414-5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                );
            case "xls":
            case "xlsx":
                return (
                    <div className={`${iconClasses} bg-gradient-to-br from-green-50 to-emerald-100`}>
                        <svg className={`${iconSizes} text-green-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className={`${iconClasses} bg-gradient-to-br from-gray-50 to-slate-100`}>
                        <svg className={`${iconSizes} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.585a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div className="mt-4 sm:mt-6 px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <FaPencilAlt className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 break-words">Fill in the Blanks</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="px-2 sm:px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap">
                        Marks: {assignmentData.max_score}
                    </div>
                    <div className="px-2 sm:px-3 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-xs sm:text-sm font-medium text-emerald-700 whitespace-nowrap">
                        Passing: {assignmentData.passing_score}
                    </div>
                </div>
            </div>

            {assignmentData.file && (
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-4 sm:mb-6 w-full">
                    <div className="p-3 xs:p-4 sm:p-4 md:p-4 w-full">
                        <div className="flex items-start gap-2 xs:gap-3 sm:gap-3 md:gap-5 mb-3 xs:mb-4 sm:mb-4 md:mb-6 w-full">
                            {getFileIcon(assignmentData.file.split(".").pop().toLowerCase())}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col xs:flex-row xs:items-start sm:items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3">
                                    <span className="text-gray-900 font-bold text-sm xs:text-base sm:text-base md:text-xl break-all xs:break-all sm:truncate max-w-full leading-tight xs:leading-snug sm:leading-normal">
                                        {assignmentData.file.split("/").pop()}
                                    </span>
                                    <span className="inline-flex items-center px-1.5 xs:px-2 sm:px-2 md:px-3 py-0.5 rounded-full text-[10px] xs:text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200/50 w-fit flex-shrink-0">
                                        {assignmentData.file.split(".").pop().toLowerCase().toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-[10px] xs:text-xs sm:text-xs md:text-sm mt-0.5 xs:mt-1 sm:mt-1 truncate max-w-full">
                                    Reference material for the questions below
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col xs:flex-row gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 w-full">
                            <a
                                href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${assignmentData.file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 xs:px-3.5 sm:px-3 md:px-4 py-2.5 xs:py-2.5 sm:py-2 bg-forestGreen text-white rounded-lg hover:bg-leafGreen transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2 shadow-lg hover:shadow-xl text-xs xs:text-sm sm:text-sm md:text-base flex-1 xs:flex-none min-w-0 group"
                            >
                                <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 xs:mr-2 sm:mr-2 flex-shrink-0 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="truncate font-medium text-[11px] xs:text-xs sm:text-sm md:text-base">
                                    Download File
                                </span>
                            </a>

                            <button
                                className="inline-flex items-center justify-center px-3 xs:px-3.5 sm:px-3 md:px-4 py-2.5 xs:py-2.5 sm:py-2 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 rounded-lg hover:from-gray-200 hover:to-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 shadow-sm hover:shadow-md text-xs xs:text-sm sm:text-sm md:text-base border border-gray-200/50 flex-1 xs:flex-none min-w-0 group"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <svg
                                    className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 xs:mr-2 sm:mr-2 flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ transform: showPreview ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <span className="truncate font-medium text-[11px] xs:text-xs sm:text-sm md:text-base">
                                    {showPreview ? "Hide Preview" : "Show Preview"}
                                </span>
                            </button>
                        </div>
                    </div>

                    {showPreview && (
                        <div className="border-t border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-slate-50/50">
                            <div className="p-3 xs:p-3.5 sm:p-4 w-full">
                                {renderFilePreview()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4 sm:space-y-5 md:space-y-6 pt-4 sm:pt-5 md:pt-6">
                {assignmentData.FillTheBlanksQuestions.map((question, index) => {
                    const parts = processQuestionText(question.question_text);
                    return (
                        <div key={question.id} className="mb-4 sm:mb-5 md:mb-6 last:mb-0">
                            <div className="flex items-start space-x-2 sm:space-x-3 md:space-x-4">
                                <span className="flex-shrink-0 font-bold text-base sm:text-lg text-gray-800 mt-0.5">
                                    {index + 1}.
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-900 mb-3 sm:mb-4">
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                                            {parts.map((part, partIndex) => (
                                                <React.Fragment key={partIndex}>
                                                    <span className="whitespace-pre-wrap break-words">{part}</span>
                                                    {partIndex < parts.length - 1 && (
                                                        <div className="inline-flex items-center my-1">
                                                            <input
                                                                type="text"
                                                                className={`
                                                                    inline-block min-w-[80px] sm:min-w-[100px] md:min-w-[120px] 
                                                                    max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] 
                                                                    h-7 xs:h-8 px-1.5 xs:px-2 py-1 
                                                                    border-b-2 border-dashed bg-transparent 
                                                                    text-xs xs:text-sm font-medium text-center
                                                                    transition-all duration-200 
                                                                    focus:outline-none focus:bg-gray-50
                                                                    ${blanksSubmitted
                                                                        ? (blanksScores[question.id]?.isCorrect
                                                                            ? "border-green-500 text-green-800 bg-green-50"
                                                                            : "border-red-500 text-red-800 bg-red-50")
                                                                        : "border-gray-400 text-gray-900 hover:border-gray-600 focus:border-gray-800"
                                                                    }
                                                                `}
                                                                value={localAnswers[question.id]?.[partIndex] || ''}
                                                                onChange={(e) => handleBlankChange(question.id, partIndex, e.target.value)}
                                                                disabled={blanksSubmitted}
                                                                style={{
                                                                    width: `${Math.max(80, (localAnswers[question.id]?.[partIndex] || '').length * 10 + 30)}px`
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                    {getAnswerResult(question)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FillInTheBlanksQuestions;
