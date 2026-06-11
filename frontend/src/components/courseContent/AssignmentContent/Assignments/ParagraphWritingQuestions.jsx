/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import React, { useState, useRef } from 'react';
import { FaPenNib } from 'react-icons/fa';

const ParagraphWritingQuestions = ({ assignmentData, paragraphAnswers, setParagraphAnswers, startTime, setStartTime, backspaceCount, setBackspaceCount, isSubmitted }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [showMobileStats, setShowMobileStats] = useState({});
    const [completionTime, setCompletionTime] = useState(null);

    const toggleMobileStats = (id) => {
        setShowMobileStats(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (!assignmentData.ParagraphWritings || assignmentData.ParagraphWritings.length === 0) {
        return null;
    }

    const handleParagraphChange = (questionId, value) => {
        setParagraphAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace') {
            setBackspaceCount(prev => prev + 1);
        }
    };

    const handleFocus = () => {
        if (!startTime) {
            setStartTime(new Date());
        }
    };

    const [now, setNow] = useState(new Date());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        const allComplete = assignmentData.ParagraphWritings?.every(paragraph => {
            const paragraphId = paragraph.id;
            const originalText = stripHtmlTags(paragraph.paragraph || '').trim().replace(/\s+/g, ' ');
            const typedText = paragraphAnswers[paragraphId] || '';
            const cleanTypedText = typedText.trim().replace(/\s+/g, ' ');
            const originalWords = originalText ? originalText.split(/\s+/) : [];
            const typedWords = cleanTypedText ? cleanTypedText.split(/\s+/) : [];
            const originalWordCount = originalWords.length;
            const typedWordCount = typedWords.length;

            return originalWordCount > 0 && typedWordCount >= originalWordCount;
        });

        if (allComplete && !completionTime && startTime) {
            // All paragraphs are complete - freeze the timer
            setCompletionTime(new Date());
        } else if (!allComplete && completionTime) {
            // User deleted some text - reset completion time so timer resumes
            setCompletionTime(null);
        }
    }, [paragraphAnswers, assignmentData.ParagraphWritings, startTime, completionTime]);

    const stripHtmlTags = (htmlString) => {
        if (!htmlString) return '';

        // Create a temporary div element to parse HTML and get text content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return tempDiv.textContent || tempDiv.innerText || '';
    };

    // Update your validateWords function
    const validateWords = (originalText, typedText) => {
        // Strip HTML tags from original text for comparison
        const cleanOriginalText = stripHtmlTags(originalText).trim().replace(/\s+/g, ' ');
        const cleanTypedText = typedText.trim().replace(/\s+/g, ' ');

        const originalWords = cleanOriginalText.split(/\s+/);
        const typedWords = cleanTypedText.split(/\s+/);

        return typedWords.map((word, index) => {
            if (index >= originalWords.length) {
                return { word, isCorrect: false };
            }

            const isCorrect = word.toLowerCase() === originalWords[index].toLowerCase();
            return { word, isCorrect };
        });
    };

    const calculateWPM = (wordCount, startTimeVal) => {
        if (!startTimeVal || wordCount === 0) return 0;

        const endTime = completionTime || new Date();
        const elapsedMinutes = (endTime - startTimeVal) / 60000;
        return Math.round(wordCount / elapsedMinutes);
    };

    const renderFilePreview = () => {
        if (!assignmentData.file) return null;

        const fileName = assignmentData.file.split("/").pop();
        const fileExtension = fileName.split(".").pop().toLowerCase();
        const fileUrl = assignmentData.file;

        if (["jpg", "jpeg", "png", "gif", "svg"].includes(fileExtension)) {
            return (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center">
                        <svg
                            className="w-5 h-5 text-gray-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <span className="text-gray-600 font-medium">{fileName}</span>
                    </div>
                    <div className="bg-gray-100 p-4 flex justify-center">
                        <img
                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl || "/placeholder.png"}`}
                            alt="Assignment preview"
                            className="max-w-full h-auto max-h-96 object-contain shadow-md rounded"
                        />
                    </div>
                </div>
            );
        }

        if (fileExtension === "pdf") {
            return (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center">
                        <svg
                            className="w-5 h-5 text-gray-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                        </svg>
                        <span className="text-gray-600 font-medium">{fileName}</span>
                    </div>
                    <iframe
                        src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl}#view=FitH`}
                        title="PDF Preview"
                        className="w-full h-96 border-none"
                    />
                </div>
            );
        }

        if (["txt", "md", "html", "css", "js", "jsx", "json"].includes(fileExtension)) {
            return (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center">
                        <svg
                            className="w-5 h-5 text-gray-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <span className="text-gray-600 font-medium">{fileName}</span>
                    </div>
                    <div className="bg-gray-50 p-4 overflow-auto max-h-96 font-mono text-sm">
                        <div className="bg-white rounded shadow-sm p-4">
                            <p className="text-gray-500 mb-2">Text file preview:</p>
                            <div className="bg-gray-100 p-3 rounded">
                                <p className="text-gray-600">
                                    Content preview requires API implementation.
                                </p>
                                <p className="text-gray-600 mt-1">
                                    The complete file can be viewed after download.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center">
                    <svg
                        className="w-5 h-5 text-gray-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <span className="text-gray-600 font-medium">{fileName}</span>
                </div>
                <div className="p-5 bg-gray-50">
                    <div className="flex items-center justify-center p-6 bg-yellow-50 rounded-lg">
                        <svg
                            className="w-6 h-6 text-yellow-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="text-yellow-700 font-medium">
                            Preview not available for this file type ({fileExtension}). Please
                            download to view.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const getFileIcon = (fileExtension) => {
        switch (fileExtension) {
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "svg":
                return (
                    <svg
                        className="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                );
            case "pdf":
                return (
                    <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                );
            case "doc":
            case "docx":
                return (
                    <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                );
            case "xls":
            case "xlsx":
                return (
                    <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                );
            default:
                return (
                    <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.585a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                    </svg>
                );
        }
    };

    return (
        <div className='h-full flex flex-col overflow-y-auto custom-scrollbar px-1'>
            {assignmentData.file && (
                <div className="bg-white rounded-lg mt-8 md:rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden mb-4 md:mb-8 w-full mx-auto">
                    <div className="p-3 md:p-4 w-full">
                        <div className="flex items-center mb-4 md:mb-6 w-full">
                            {getFileIcon(assignmentData.file.split(".").pop().toLowerCase())}
                            <div className="ml-3 md:ml-5 flex-1 min-w-0 max-w-full">
                                <div className="flex items-center flex-wrap gap-2 md:gap-3 w-full">
                                    <span className="text-gray-900 font-bold text-base md:text-xl truncate max-w-full">
                                        {assignmentData.file.split("/").pop()}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200/50 flex-shrink-0">
                                        {assignmentData.file.split(".").pop().toLowerCase().toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-xs md:text-sm mt-1 truncate">Reference material for the questions below</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full">
                            <a
                                href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${assignmentData.file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-3 py-2 md:px-2 md:py-1 bg-forestGreen text-white rounded-lg md:rounded-xl hover:bg-leafGreen transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2 shadow-lg hover:shadow-xl text-sm md:text-base flex-1 sm:flex-none text-center min-w-0"
                            >
                                <svg
                                    className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                                <span className="truncate">Download File</span>
                            </a>
                            <button
                                className="inline-flex items-center justify-center px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 rounded-lg md:rounded-xl hover:from-gray-200 hover:to-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 shadow-sm hover:shadow-md text-sm md:text-base border border-gray-200/50 flex-1 sm:flex-none text-center min-w-0"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <svg
                                    className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0 transition-transform duration-200"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ transform: showPreview ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                                <span className="truncate">{showPreview ? "Hide Preview" : "Show Preview"}</span>
                            </button>
                        </div>
                    </div>
                    {showPreview && (
                        <div className="border-t border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-slate-50/50 overflow-hidden w-full">
                            <div className="p-3 md:p-4 w-full">
                                {renderFilePreview()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 md:mt-6 mb-4 gap-4 px-1">
                <h2 className="text-lg md:text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <FaPenNib className="w-4 h-4 md:w-5 md:h-5 text-slate-800" />
                    Paragraph Writing Assignment
                </h2>
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="text-[10px] sm:text-sm font-medium text-slate-600 bg-slate-50 px-2 py-1 md:px-3 md:py-1.5 rounded-md border border-slate-200">
                        Marks: <span className="text-slate-900 font-bold">{assignmentData.max_score || 0}</span>
                    </div>
                    <div className="text-[10px] sm:text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-1 md:px-3 md:py-1.5 rounded-md border border-emerald-100">
                        Passing Score: <span className="font-bold">{assignmentData.passing_score || 0}</span>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0 space-y-6 md:space-y-8">
                {assignmentData.ParagraphWritings.map((paragraph, index) => {
                    const paragraphId = paragraph.id;
                    const originalText = stripHtmlTags(paragraph.paragraph || '').trim().replace(/\s+/g, ' ');
                    const typedText = paragraphAnswers[paragraphId] || '';
                    const cleanTypedText = typedText.trim().replace(/\s+/g, ' ');
                    const originalWords = originalText ? originalText.split(/\s+/) : [];
                    const typedWords = cleanTypedText ? cleanTypedText.split(/\s+/) : [];
                    const originalWordCount = originalWords.length;
                    const typedWordCount = typedWords.length;

                    const validatedWords = validateWords(originalText, typedText);
                    const isComplete =
                        originalWordCount > 0 &&
                        typedWordCount >= originalWordCount;
                    const correctWords = validatedWords.filter(w => w.isCorrect).length;
                    const accuracy = typedWordCount > 0 ? Math.round((correctWords / typedWordCount) * 100) : 0;
                    const wpm = calculateWPM(typedWordCount, startTime);

                    const progress = Math.min(Math.round((typedWordCount / originalWordCount) * 100), 100);

                    return (
                        <div key={paragraph.id} className="transition-all duration-300 flex-1 flex flex-col min-h-0 mt-4">
                            <div className="mb-1">
                                <div className="flex items-center gap-3 mb-2 md:mb-2">
                                    {isComplete && (
                                        <span className="ml-auto bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium flex items-center">
                                            <svg className="w-3 h-3 md:w-4 md:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            Complete
                                        </span>
                                    )}
                                </div>

                                {/* Mobile Stats Toggle Button */}
                                <div className="sm:hidden flex justify-between items-center bg-white p-2 rounded-t-lg border border-slate-200 border-b-0 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Performance Stats</span>
                                    </div>
                                    <button
                                        onClick={() => toggleMobileStats(paragraph.id)}
                                        className="flex items-center gap-1 px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-indigo-600 transition-all shadow-sm"
                                    >
                                        <svg
                                            className={`w-3 h-3 transition-transform duration-300 ${showMobileStats[paragraph.id] ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        {showMobileStats[paragraph.id] ? "HIDE" : "SHOW"}
                                    </button>
                                </div>

                                {/* Stats Row - Toggleable on Mobile, Always visible on SM+ */}
                                <div className={`${showMobileStats[paragraph.id] ? 'grid' : 'hidden sm:grid'} grid-cols-2 sm:grid-cols-5 w-full items-center bg-slate-50/50 sm:bg-white py-2 mb-1 sm:rounded-t-lg border border-slate-200 border-b-0 shadow-sm transition-all duration-300`}>
                                    <div className="text-center text-[10px] sm:text-xs md:text-sm font-medium text-slate-500 border-r border-slate-100 py-1">
                                        PROGRESS: <span className="text-slate-900 font-bold block sm:inline">{progress}%</span>
                                    </div>
                                    <div className="text-center text-[10px] sm:text-xs md:text-sm font-medium text-slate-500 sm:border-r border-slate-100 py-1">
                                        WORDS: <span className="text-slate-900 font-bold block sm:inline">{typedWordCount}/{originalWordCount}</span>
                                    </div>
                                    <div className="text-center text-[10px] sm:text-xs md:text-sm font-medium text-slate-500 border-r border-slate-100 py-1 border-t sm:border-t-0">
                                        ACCURACY: <span className="text-slate-900 font-bold block sm:inline">{accuracy}%</span>
                                    </div>
                                    <div className="text-center text-[10px] sm:text-xs md:text-sm font-medium text-slate-500 sm:border-r border-slate-100 py-1 border-t sm:border-t-0">
                                        SPEED: <span className="text-slate-900 font-bold block sm:inline">{wpm} WPM</span>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 text-center text-[10px] sm:text-xs md:text-sm font-medium text-slate-500 py-1 border-t sm:border-t-0">
                                        CORRECT: <span className="text-slate-900 font-bold block sm:inline">{correctWords}/{typedWordCount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Scroll Window - Fixed Height + Auto Scroll */}
                            <div className="relative bg-gray-50 rounded-lg shadow-inner border border-gray-200 h-[45vh] md:h-[55vh] overflow-y-auto custom-scrollbar">
                                <div className="min-h-full relative">
                                    {/* Grid Lines Background */}
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            backgroundImage: 'linear-gradient(transparent 31px, #e5e7eb 31px)',
                                            backgroundSize: '100% 32px',
                                        }}
                                    ></div>

                                    {/* CSS Grid Stack for Content Alignment */}
                                    <div className="grid grid-cols-1 relative z-0">
                                        {/* 1. Reference Text (Visible, pushes height) */}
                                        <div
                                            className="col-start-1 row-start-1 px-4 md:px-6 py-2 md:py-3 font-mono text-gray-300 leading-8 whitespace-pre-wrap text-sm md:text-base break-words pointer-events-none"
                                            style={{ lineHeight: '32px' }}
                                            dangerouslySetInnerHTML={{ __html: originalText }}
                                        />

                                        {/* 2. Ghost Input (Invisible, pushes height if input is longer than reference) */}
                                        <div
                                            className="col-start-1 row-start-1 px-4 md:px-6 py-2 md:py-3 font-mono leading-8 whitespace-pre-wrap text-sm md:text-base break-words invisible pointer-events-none"
                                            style={{ lineHeight: '32px' }}
                                        >
                                            {typedText}
                                            {/* Add a zero-width space to force height on empty newlines if needed */}
                                            {typedText.endsWith('\n') && <br />}
                                        </div>

                                        {/* 3. Validation Overlay (Visible Colors, Absolute/Stacked) */}
                                        <div
                                            className="col-start-1 row-start-1 px-4 md:px-6 py-2 md:py-3 font-mono leading-8 whitespace-pre-wrap text-sm md:text-base break-words pointer-events-none"
                                            style={{ lineHeight: '32px' }}
                                        >
                                            {validatedWords.length > 0 && (
                                                <span>
                                                    {validatedWords.map((item, i) => (
                                                        <span
                                                            key={i}
                                                            className={`${item.isCorrect
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                } transition-colors duration-300`}
                                                        >
                                                            {item.word}{i < validatedWords.length - 1 ? ' ' : ''}
                                                        </span>
                                                    ))}
                                                </span>
                                            )}
                                        </div>

                                        {/* 4. Textarea (Input, Transparent, Fits Cell) */}
                                        <textarea
                                            className="col-start-1 row-start-1 w-full h-full px-4 md:px-6 py-2 md:py-3 bg-transparent font-mono text-transparent caret-indigo-600 leading-8 outline-none resize-none text-sm md:text-base break-words overflow-hidden"
                                            style={{
                                                lineHeight: '32px',
                                                caretColor: '#4f46e5',
                                            }}
                                            value={paragraphAnswers[paragraphId] || ''}
                                            onChange={(e) => handleParagraphChange(paragraphId, e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            onFocus={handleFocus}
                                            disabled={isSubmitted}
                                            spellCheck={false}
                                            aria-label={`Type paragraph ${index + 1}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* <div className="mt-3 md:mt-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                <div className="text-xs md:text-sm text-gray-600">
                                    {!isComplete && (
                                        <span className="flex items-center">
                                            <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                                            </svg>
                                            Continue typing to complete
                                        </span>
                                    )}
                                </div>
                            </div> */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ParagraphWritingQuestions; 