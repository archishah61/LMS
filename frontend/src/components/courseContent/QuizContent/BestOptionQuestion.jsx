import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BestOptionQuestion = ({ question, handleAnswerSelect, selectedAnswers }) => {
    // State for shuffled options
    const [shuffledOptions, setShuffledOptions] = useState({});
    // State for dropdown visibility
    const [openDropdown, setOpenDropdown] = useState(null);

    // Helper function to get parsed blanked words
    const getParsedBlankedWords = () => {
        if (!question || !question.blanked_words) return [];

        if (typeof question.blanked_words === 'string') {
            try {
                return JSON.parse(question.blanked_words);
            } catch (error) {
                console.error('Error parsing blanked_words JSON:', error);
                return [];
            }
        }

        return question.blanked_words;
    };

    useEffect(() => {
        if (!question || !question.blanked_words) return;

        const shuffleArray = (array) => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };

        const blankedWords = getParsedBlankedWords();
        if (blankedWords.length === 0) return;

        // Create shuffled options only once when component mounts
        const options = {};
        blankedWords.forEach((blankedWord, index) => {
            // Use the options array from the new structure
            if (blankedWord.options && Array.isArray(blankedWord.options)) {
                options[index] = shuffleArray([...blankedWord.options]);
            }
        });
        setShuffledOptions(options);
    }, [question]);

    if (!question) return <div className="p-4 text-center">Loading question...</div>;

    // Split the passage to insert the blanks with numbers
    const passageParts = [];
    let currentIndex = 0;
    let blankCount = 0;

    // Find all blanks (____) in the passage
    const regex = /____/g;
    let match;

    while ((match = regex.exec(question.passage)) !== null) {
        // Add text before the blank
        if (match.index > currentIndex) {
            passageParts.push({
                type: 'text',
                content: question.passage.substring(currentIndex, match.index)
            });
        }

        // Add the blank
        blankCount++;
        passageParts.push({
            type: 'blank',
            number: blankCount
        });

        currentIndex = match.index + 4; // 4 is the length of ____
    }

    // Add any remaining text after the last blank
    if (currentIndex < question.passage.length) {
        passageParts.push({
            type: 'text',
            content: question.passage.substring(currentIndex)
        });
    }

    const toggleDropdown = (index) => {
        if (openDropdown === index) {
            setOpenDropdown(null);
        } else {
            setOpenDropdown(index);
        }
    };

    const selectOption = (blankIndex, option) => {
        handleAnswerSelect(question.id + "_" + blankIndex, option);
        setOpenDropdown(null);
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-4 mt-4 sm:mt-8 md:mt-12">
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
                {/* Left side - Passage */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="md:w-1/2 bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-md"
                >
                    <div className="text-gray-500 uppercase text-xs sm:text-sm font-medium mb-2 sm:mb-4 pb-1 sm:pb-2 border-b">
                        PASSAGE
                    </div>

                    <div className="sm:py-2 md:py-4 overflow-x-auto">
                        <p className="text-gray-800 text-sm sm:text-base" style={{ lineHeight: '2.2 sm:2.5' }}>
                            {passageParts.map((part, index) => (
                                part.type === 'text' ? (
                                    <span key={index} className="text-gray-600">{part.content}</span>
                                ) : (
                                    <motion.span
                                        key={index}
                                        initial={{ backgroundColor: "#f0f0f0" }}
                                        animate={{
                                            backgroundColor: selectedAnswers[question.id + "_" + (part.number - 1)]
                                                ? "#e6f7ff"
                                                : "#f0f0f0"
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`inline-flex items-center justify-center px-1.5 sm:px-2 border rounded-md text-center font-medium text-xs sm:text-sm ${
                                            selectedAnswers[question.id + "_" + (part.number - 1)]
                                                ? "border-blue-300 text-blue-700"
                                                : "border-gray-300"
                                        }`}
                                        style={{
                                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                            verticalAlign: "middle",
                                            lineHeight: 1,
                                            height: "24px sm:28px md:32px",
                                            minWidth: "24px sm:28px md:32px",
                                            margin: "0 2px"
                                        }}
                                    >
                                        {selectedAnswers[question.id + "_" + (part.number - 1)] || part.number}
                                    </motion.span>
                                )
                            ))}
                        </p>
                    </div>
                </motion.div>

                {/* Right side - Question and options */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="md:w-1/2"
                >
                    {getParsedBlankedWords().map((blankedWord, blankIndex) => (
                        <motion.div
                            key={blankIndex}
                            className="mb-3 sm:mb-4 md:mb-6"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 * blankIndex }}
                        >
                            <div className="relative">
                                <motion.div
                                    whileHover={{ boxShadow: "0 2px 4px sm:0 4px 6px rgba(0,0,0,0.1)" }}
                                    className={`flex items-center justify-between p-3 sm:p-4 ${
                                        selectedAnswers[question.id + "_" + blankIndex]
                                            ? "border-blue-300 bg-blue-50"
                                            : "border-gray-300 bg-white"
                                    } border rounded-lg cursor-pointer transition-all duration-200`}
                                    onClick={() => toggleDropdown(blankIndex)}
                                >
                                    <span className={`flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full text-xs sm:text-sm ${
                                        selectedAnswers[question.id + "_" + blankIndex]
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-200 text-gray-700"
                                    } font-medium transition-colors duration-200`}>
                                        {blankedWord.position || blankIndex + 1}
                                    </span>
                                    <span className={`flex-grow mx-2 sm:mx-3 md:mx-4 text-sm sm:text-base ${
                                        selectedAnswers[question.id + "_" + blankIndex]
                                            ? "font-medium text-blue-700"
                                            : "text-gray-400"
                                    }`}>
                                        {selectedAnswers[question.id + "_" + blankIndex] || "Select a word"}
                                    </span>
                                    <motion.svg
                                        animate={{ rotate: openDropdown === blankIndex ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </motion.svg>
                                </motion.div>

                                <AnimatePresence>
                                    {openDropdown === blankIndex && shuffledOptions[blankIndex] && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: "auto" }}
                                            exit={{ opacity: 0, y: -10, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute z-50 w-full mt-1 border border-gray-300 rounded-lg bg-white shadow-lg overflow-hidden"
                                        >
                                            {shuffledOptions[blankIndex].map((option, optIndex) => (
                                                <motion.div
                                                    key={optIndex}
                                                    whileHover={{ backgroundColor: "#f3f4f6" }}
                                                    className={`p-2 sm:p-3 text-sm sm:text-base ${
                                                        optIndex < shuffledOptions[blankIndex].length - 1 ? 'border-b border-gray-100' : ''
                                                    } ${
                                                        selectedAnswers[question.id + "_" + blankIndex] === option
                                                            ? 'bg-blue-50 text-blue-600 font-medium'
                                                            : ''
                                                    } cursor-pointer transition-colors duration-150`}
                                                    onClick={() => selectOption(blankIndex, option)}
                                                >
                                                    {option}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default BestOptionQuestion;