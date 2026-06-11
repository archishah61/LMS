/* eslint-disable react/no-unknown-property */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useCreateAssignmentCompletionMutation } from '../../services/Assignment/assignmentCompletionApi';
import { useCreateAssignmentResponseMutation } from '../../services/Assignment/assignmentResponseApi';
import { addCompletion } from '../../features/Assignment/assignmentCompletionSlice';
import { addResponse } from '../../features/Assignment/assignmentResponseSlice';
import { getStudentToken } from "../../services/CookieService";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RegularAssignment from './Assignments/RegularAssignment';
import MatchingQuestions from './Assignments/MatchingQuestions';
import TrueFalseQuestions from './Assignments/TrueFalseQuestions';
import FillInTheBlanksQuestions from './Assignments/FillInTheBlanksQuestions';
import ParagraphWritingQuestions from './Assignments/ParagraphWritingQuestions';

export default function DisplayAssignmentContent({ assignmentData, userId, refreshAssignment }) {
    const dispatch = useDispatch();
    const { access_token } = getStudentToken();
    const [showPreview, setShowPreview] = useState(false);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [blanksAnswers, setBlanksAnswers] = useState({});
    const [blanksSubmitted, setBlanksSubmitted] = useState(false);
    const [blanksScores, setBlanksScores] = useState({});
    const [matchingAnswers, setMatchingAnswers] = useState({});
    const [matchingScores, setMatchingScores] = useState({});
    const [matchingSubmitted, setMatchingSubmitted] = useState(false);
    const [completionId, setCompletionId] = useState(null);
    const [individualScores, setIndividualScores] = useState({});
    const [paragraphAnswers, setParagraphAnswers] = useState({});
    const [startTime, setStartTime] = useState(null);
    const [backspaceCount, setBackspaceCount] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(0);
    const [typingEfficiency, setTypingEfficiency] = useState(0);
    const [spellingErrors, setSpellingErrors] = useState([]);
    const [paragraphComplete, setParagraphComplete] = useState(false);

    const [createAssignmentCompletion] = useCreateAssignmentCompletionMutation();
    const [createAssignmentResponse] = useCreateAssignmentResponseMutation();

    const paragraphRef = useRef(null);

    useEffect(() => {
        if (assignmentData.ParagraphWritings && assignmentData.ParagraphWritings.length > 0) {
            const paragraphId = assignmentData.ParagraphWritings[0].id;
            const originalWordCount = assignmentData.ParagraphWritings[0].paragraph.split(' ').length;
            const typedText = paragraphAnswers[paragraphId] || '';
            const typedWordCount = typedText.trim() ? typedText.split(' ').length : 0;
            setParagraphComplete(typedWordCount >= originalWordCount);
        }
    }, [paragraphAnswers, assignmentData.ParagraphWritings]);

    useEffect(() => {
        if (isSubmitted && assignmentData.category === "paragraph_writing") {
            const endTime = new Date();
            const timeTaken = (endTime - startTime) / 1000;
            const wordsTyped = paragraphAnswers[assignmentData.ParagraphWritings[0].id]?.split(' ').length || 0;
            const typingSpeedWPM = (wordsTyped / timeTaken) * 60;
            setTypingSpeed(typingSpeedWPM);

            const errors = findSpellingErrors(assignmentData.ParagraphWritings[0].paragraph, paragraphAnswers[assignmentData.ParagraphWritings[0].id]);
            setSpellingErrors(errors);

            const totalCharacters = assignmentData.ParagraphWritings[0].paragraph.length;
            const typedText = paragraphAnswers[assignmentData.ParagraphWritings[0].id] || '';
            const mistakeCount = errors.length;
            const totalPenalty = backspaceCount + (mistakeCount * 5);
            const efficiency = Math.max(0, ((totalCharacters - totalPenalty) / totalCharacters) * 100);
            setTypingEfficiency(efficiency > 0 ? efficiency : 0);
        }
    }, [isSubmitted]);

    const isSubmitDisabled = () => {
        const allRequiredQuestionsAnswered =
            Object.keys(userAnswers).length === assignmentData.TrueFalseQuestions.length &&
            Object.keys(matchingAnswers).length === assignmentData.MatchingQuestions.length &&
            Object.keys(blanksAnswers).length === assignmentData.FillTheBlanksQuestions.length &&
            Object.keys(paragraphAnswers).length === assignmentData.ParagraphWritings.length;

        const allBlanksAnswered = assignmentData.FillTheBlanksQuestions.every(question => {
            return blanksAnswers[question.id] && blanksAnswers[question.id].every(answer => answer.trim() !== '');
        });

        if (assignmentData.ParagraphWritings && assignmentData.ParagraphWritings.length > 0) {
            return !allRequiredQuestionsAnswered || !allBlanksAnswered || !paragraphComplete;
        }

        return !allRequiredQuestionsAnswered || !allBlanksAnswered;
    };

    const findSpellingErrors = (original, typed) => {
        const originalWords = original.split(' ');
        const typedWords = typed.split(' ');
        const errors = [];

        originalWords.forEach((word, index) => {
            if (typedWords[index] && typedWords[index] !== word) {
                errors.push({
                    original: word,
                    typed: typedWords[index]
                });
            }
        });

        if (typedWords.length > originalWords.length) {
            for (let i = originalWords.length; i < typedWords.length; i++) {
                errors.push({
                    original: '(none)',
                    typed: typedWords[i]
                });
            }
        }

        return errors;
    }

    const handleAnswerChange = (questionId, value) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: value  // ✅ directly store the boolean
        }));
    };

    const calculateParagraphWritingScore = () => {
        if (assignmentData.category !== "paragraph_writing") return 0;

        const maxScore = assignmentData.max_score || 100;

        const totalWrongWords = spellingErrors.length;  // already calculated
        const totalBackspaces = backspaceCount;

        const penaltyPerWrongWord = 2;    // you can adjust this
        const penaltyPerBackspace = 0.5 // you can adjust this

        const totalPenalty = (totalWrongWords * penaltyPerWrongWord) + (totalBackspaces * penaltyPerBackspace);

        const rawScore = maxScore - totalPenalty;

        // Don't allow negative scores
        return Math.max(0, Math.round(rawScore));
    };


    const calculateTrueFalseScore = () => {
        if (!assignmentData.TrueFalseQuestions || assignmentData.TrueFalseQuestions.length === 0) return 0;
        if (isNaN(assignmentData.max_score) || assignmentData.max_score <= 0) return 0;

        const totalQuestions = assignmentData.TrueFalseQuestions.length;
        const pointsPerQuestion = assignmentData.max_score / totalQuestions;

        let correctAnswers = 0;
        assignmentData.TrueFalseQuestions.forEach(question => {
            if (userAnswers[question.id] === question.correct_answer) {
                correctAnswers++;
            }
        });

        const score = Math.round((correctAnswers * pointsPerQuestion) * 10) / 10;
        setIndividualScores(prev => ({ ...prev, trueFalse: score }));
        return score;
    };

    const calculateMatchingScore = () => {
        if (!assignmentData.MatchingQuestions || assignmentData.MatchingQuestions.length === 0) return 0;
        if (isNaN(assignmentData.max_score) || assignmentData.max_score <= 0) return 0;
    
        let totalCorrectMatches = 0;
        let totalMatches = 0;
    
        const newScores = {};
    
        assignmentData.MatchingQuestions.forEach(question => {
            const userAnswer = matchingAnswers[question.id] || {};
            const correctAnswers = {};
    
            question.MatchingOptions.forEach(option => {
                correctAnswers[option.option_text] = option.match_text;
            });
    
            let correctMatchCount = 0;
            const questionTotalMatches = question.MatchingOptions.length;
    
            Object.keys(correctAnswers).forEach(optionText => {
                if (userAnswer[optionText] === correctAnswers[optionText]) {
                    correctMatchCount++;
                }
            });
    
            totalCorrectMatches += correctMatchCount;
            totalMatches += questionTotalMatches;
    
            newScores[question.id] = {
                correctMatches: correctMatchCount,
                totalMatches: questionTotalMatches,
                correctAnswers
            };
        });
    
        setMatchingScores(newScores);
        setMatchingSubmitted(true);
    
        const pointsPerMatch = assignmentData.max_score / totalMatches;
        const totalScore = Math.round((totalCorrectMatches * pointsPerMatch) * 10) / 10;
    
        setIndividualScores(prev => ({ ...prev, matching: totalScore }));
    
        return totalScore;
    };
    

    const calculateBlanksScore = () => {
        if (!assignmentData.FillTheBlanksQuestions || assignmentData.FillTheBlanksQuestions.length === 0) return 0;
        if (isNaN(assignmentData.max_score) || assignmentData.max_score <= 0) return 0;

        const newScores = {};
        let totalCorrect = 0;

        assignmentData.FillTheBlanksQuestions.forEach(question => {
            const userAnswers = blanksAnswers[question.id] || [];
            let isCorrect = true;

            userAnswers.forEach((answer, index) => {
                const correctAnswer = question.answers[index].toLowerCase();
                if (answer.toLowerCase() !== correctAnswer) {
                    isCorrect = false;
                }
            });

            newScores[question.id] = {
                isCorrect,
                correctAnswer: question.answers.join(', ') // Joining all correct answers for display
            };

            if (isCorrect) totalCorrect++;
        });

        setBlanksScores(newScores);
        setBlanksSubmitted(true);

        const totalQuestions = assignmentData.FillTheBlanksQuestions.length;
        const pointsPerQuestion = assignmentData.max_score / totalQuestions;
        const score = Math.round((totalCorrect * pointsPerQuestion) * 10) / 10;
        setIndividualScores(prev => ({ ...prev, fillInTheBlanks: score }));
        return score;
    };

    const handleSubmit = () => {
        const trueFalseScore = calculateTrueFalseScore();
        const matchingScore = calculateMatchingScore();
        const blanksScore = calculateBlanksScore();
        const paragraphWritingScore = calculateParagraphWritingScore();

        const finalScore = trueFalseScore + matchingScore + blanksScore + paragraphWritingScore;

        // Map matching answers correctly
        const mappedMatchingAnswers = {};
        Object.keys(matchingAnswers).forEach(questionId => {
            const answers = matchingAnswers[questionId];
            mappedMatchingAnswers[questionId] = Object.entries(answers).map(([optionText, matchText]) => ({
                optionText,
                matchText
            }));
        });

        storeAssignmentData(finalScore, mappedMatchingAnswers);
        setScore(finalScore);
        setIsSubmitted(true);

        toast.success('Assignment submitted successfully!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
            style: {
                borderRadius: '8px',
                fontWeight: '500',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            },
            progressStyle: {
                background: 'rgba(255, 255, 255, 0.7)'
            },
            icon: '🎓'
        });
    };

    const storeAssignmentData = (finalScore, mappedMatchingAnswers) => {
        const passingScore = assignmentData.max_score * 0.5;
        const isPassed = finalScore >= passingScore;

        const assignmentCompletionData = {
            userId,
            assignmentId: assignmentData.id,
            isCompleted: true,   // ✅ true if passed, false if failed
            status: isPassed ? 'Completed' : 'Incomplete',  // ✅ Passed or Failed
            score: finalScore,
            updated_by: userId,
            created_by: userId,
            individualScores
        };


        const storeAssignmentCompletion = async () => {
            try {
                const response = await createAssignmentCompletion({
                    completionData: assignmentCompletionData,
                    access_token
                }).unwrap();

                dispatch(addCompletion(response));
                return response.id;
            } catch (error) {
                console.error("Error storing assignment completion:", error);
                throw error;
            }
        };

        storeAssignmentCompletion()
            .then((id) => {
                setCompletionId(id);

                const assignmentAnswersData = [];

                assignmentData.TrueFalseQuestions.forEach(question => {
                    assignmentAnswersData.push({
                        assignmentCompletionId: id,
                        questionId: question.id,
                        selectedAnswer: userAnswers[question.id],
                        updated_by: userId,
                        created_by: userId
                    });
                });

                Object.keys(mappedMatchingAnswers).forEach(questionId => {
                    const questionAnswers = mappedMatchingAnswers[questionId];
                    questionAnswers.forEach(({ optionText, matchText }) => {
                        assignmentAnswersData.push({
                            assignmentCompletionId: id,
                            questionId: questionId,
                            selectedAnswer: `${optionText}-${matchText}`,
                            updated_by: userId,
                            created_by: userId
                        });
                    });
                });

                Object.keys(blanksAnswers).forEach(questionId => {
                    assignmentAnswersData.push({
                        assignmentCompletionId: id,
                        questionId: questionId,
                        selectedAnswer: blanksAnswers[questionId].join(', '),
                        updated_by: userId,
                        created_by: userId
                    });
                });

                Object.keys(paragraphAnswers).forEach(questionId => {
                    assignmentAnswersData.push({
                        assignmentCompletionId: id,
                        questionId: questionId,
                        selectedAnswer: paragraphAnswers[questionId],
                        updated_by: userId,
                        created_by: userId
                    });
                });

                createAssignmentResponse({ responseData: assignmentAnswersData, access_token })
                    .unwrap()
                    .then((response) => {
                        // response.forEach((answer) => dispatch(addResponse(answer)));
                    })
                    .catch((error) => {
                        console.error("Error storing assignment answers:", error);
                    });
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    };

    const renderDescription = () => {
        return (
            <div className="assignment-description mb-6 prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: assignmentData.description }} />
            </div>
        );
    };

    return (
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-100 shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl">
            <ToastContainer />
            <div className="bg-white bg-opacity-90 p-6 border-b border-blue-100 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 rounded-full opacity-30"></div>
                <div className="absolute right-20 -bottom-10 w-32 h-32 bg-blue-50 rounded-full opacity-40"></div>

                <h2 className="text-2xl font-bold text-gray-800 relative animate-fadeIn">
                    {assignmentData.title}
                </h2>

                <div className="flex flex-wrap gap-4 items-center mt-3 text-sm text-gray-600 relative animate-slideRight">
                    <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 transition-all duration-300 hover:bg-blue-100 hover:shadow-sm">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="ml-1 font-medium">{new Date(assignmentData.due_date).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 transition-all duration-300 hover:bg-blue-100 hover:shadow-sm">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="ml-1 font-medium">{assignmentData.max_score} points</span>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 animate-fadeIn">
                <div className="transition-all duration-500 transform hover:scale-102">
                    {renderDescription()}
                </div>

                <div className="my-6 animate-slideUp">
                    {assignmentData.category === "regular" && <RegularAssignment assignmentData={assignmentData} showPreview={showPreview} setShowPreview={setShowPreview} />}
                    {assignmentData.category === "true_false" && <TrueFalseQuestions assignmentData={assignmentData} userAnswers={userAnswers} handleAnswerChange={handleAnswerChange} isSubmitted={isSubmitted} />}
                    {assignmentData.category === "matching" && <MatchingQuestions assignmentData={assignmentData} matchingAnswers={matchingAnswers} setMatchingAnswers={setMatchingAnswers} matchingSubmitted={matchingSubmitted} matchingScores={matchingScores} />}
                    {assignmentData.category === "fill_in_the_blanks" && <FillInTheBlanksQuestions assignmentData={assignmentData} blanksAnswers={blanksAnswers} setBlanksAnswers={setBlanksAnswers} blanksSubmitted={blanksSubmitted} blanksScores={blanksScores} />}
                    {assignmentData.category === "paragraph_writing" && <ParagraphWritingQuestions assignmentData={assignmentData} paragraphAnswers={paragraphAnswers} setParagraphAnswers={setParagraphAnswers} startTime={startTime} setStartTime={setStartTime} backspaceCount={backspaceCount} setBackspaceCount={setBackspaceCount} isSubmitted={isSubmitted} />}
                </div>

                <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn">
                    {isSubmitted ? (
                        <div className="flex items-center animate-scaleIn">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-center shadow-md">
                                <div className="bg-blue-100 p-2 rounded-full mr-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-blue-700">Your Score</h4>
                                    <p className="text-blue-600 text-2xl font-bold">{score} / {assignmentData.max_score} points</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className={`px-6 py-3 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center transition-all duration-300 transform hover:translate-y-1 shadow-md ${isSubmitDisabled()
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500'
                                }`}
                            disabled={isSubmitDisabled()}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                            </svg>
                            Submit Answers
                        </button>
                    )}
                    <div className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100 transition-all duration-300 hover:bg-gray-100">
                        {!isSubmitted && (
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                                <strong>{Object.keys(userAnswers).length + Object.keys(matchingAnswers).length + Object.keys(blanksAnswers).length + Object.keys(paragraphAnswers).length}</strong> &nbsp;of&nbsp; <strong>{assignmentData.TrueFalseQuestions.length + assignmentData.MatchingQuestions.length + assignmentData.FillTheBlanksQuestions.length + assignmentData.ParagraphWritings.length}</strong>&nbsp;questions answered
                            </span>
                        )}
                        {!isSubmitted && assignmentData.ParagraphWritings && assignmentData.ParagraphWritings.length > 0 && !paragraphComplete && (
                            <div className="mt-2 text-amber-600 flex items-center animate-pulse">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                Please complete the paragraph before submitting.
                            </div>
                        )}
                    </div>
                </div>

                {isSubmitted && assignmentData.category === "paragraph_writing" && (
                    <div className="mt-6 bg-white rounded-lg border border-blue-100 p-6 shadow-sm animate-slideUp">
                        <h4 className="font-semibold text-gray-700 flex items-center mb-3">
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            Typing Metrics
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg transition-all duration-300 hover:bg-blue-100 hover:shadow-sm">
                                <p className="text-gray-500 text-sm">Typing Speed</p>
                                <p className="text-gray-800 text-lg font-bold">{typingSpeed.toFixed(2)} WPM</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg transition-all duration-300 hover:bg-blue-100 hover:shadow-sm">
                                <p className="text-gray-500 text-sm">Typing Efficiency</p>
                                <p className="text-gray-800 text-lg font-bold">{typingEfficiency.toFixed(2)}%</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg transition-all duration-300 hover:bg-blue-100 hover:shadow-sm">
                                <p className="text-gray-500 text-sm">Backspace Count</p>
                                <p className="text-gray-800 text-lg font-bold">{backspaceCount}</p>
                            </div>
                        </div>

                        <h4 className="font-semibold text-gray-700 flex items-center mt-6 mb-3">
                            <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            Spelling Errors
                        </h4>
                        {spellingErrors.length > 0 ? (
                            <ul className="bg-red-50 rounded-lg p-4 border border-red-100">
                                {spellingErrors.map((error, index) => (
                                    <li key={index} className="mb-2 last:mb-0 text-gray-700 flex items-start">
                                        <svg className="w-4 h-4 text-red-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                        <span>
                                            Typed: <span className="font-medium text-red-600">{error.typed}</span> |
                                            Correct: <span className="font-medium text-green-600">{error.original}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-green-600 flex items-center bg-green-50 p-3 rounded-lg border border-green-100">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                                </svg>
                                No spelling errors found!
                            </p>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @keyframes slideRight {
                    from { transform: translateX(-20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                @keyframes scaleIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.6; }
                    100% { opacity: 1; }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.8s ease-out forwards;
                }

                .animate-slideUp {
                    animation: slideUp 0.6s ease-out forwards;
                }

                .animate-slideRight {
                    animation: slideRight 0.6s ease-out forwards;
                }

                .animate-scaleIn {
                    animation: scaleIn 0.5s ease-out forwards;
                }

                .animate-pulse {
                    animation: pulse 2s infinite;
                }

                .hover:scale-102:hover {
                    transform: scale(1.02);
                }
            `}</style>
        </div>
    );
}
