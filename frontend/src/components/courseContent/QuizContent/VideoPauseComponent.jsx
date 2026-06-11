/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaArrowRight, FaArrowUp, FaArrowDown, FaBars, FaTv } from "react-icons/fa";
import { useGetQuizByQuizIdQuery } from "../../../services/Course_Management/quizApi";
import { getStudentToken } from "../../../services/CookieService";
import { motion, AnimatePresence } from "framer-motion";
import SpeakingQuestion from "./SpeakingQuestion";
import DragDropQuestion from "./DragDropQuestion";
import { useEvaluateAnswerMutation } from "../../../services/AIServices";

function CompleteSentenceQuestion({
  question,
  selectedAnswers,
  handleCompleteSentenceInput,
}) {
  const parts = question.question.split("_____");
  const numBlanks = parts.length - 1;
  const correctWords = Array.isArray(question.correct_word)
    ? question.correct_word
    : Array(numBlanks).fill(question.correct_word || "");
  const hints = Array.isArray(question.hint)
    ? question.hint
    : Array(numBlanks).fill(question.hint || "");

  // Store refs for every input field
  const inputRefs = useRef({});

  const focusNext = (currentKey) => {
    const keys = Object.keys(inputRefs.current);
    const currentIndex = keys.indexOf(currentKey);
    if (currentIndex !== -1 && currentIndex < keys.length - 1) {
      const nextKey = keys[currentIndex + 1];
      inputRefs.current[nextKey]?.focus();
    }
  };

  const focusPrev = (currentKey) => {
    const keys = Object.keys(inputRefs.current);
    const currentIndex = keys.indexOf(currentKey);
    if (currentIndex > 0) {
      const prevKey = keys[currentIndex - 1];
      inputRefs.current[prevKey]?.focus();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg text-slate-800 font-medium">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="break-words">{part}</span>
            {index < numBlanks && (
              <div className="inline-flex flex-row items-center gap-1 flex-wrap">
                {[...Array(correctWords[index].length)].map((_, letterIndex) => {
                  const hintChar = hints[index][letterIndex] || "";
                  const key = `${question.id}_${index}_${letterIndex}`;

                  return (
                    <input
                      key={key}
                      ref={(el) => (inputRefs.current[key] = el)}
                      type="text"
                      maxLength={1}
                      value={hintChar || selectedAnswers[key] || ""}
                      onChange={(e) => {
                        handleCompleteSentenceInput(
                          question.id,
                          index,
                          letterIndex,
                          e.target.value
                        );
                        if (e.target.value && !hintChar) {
                          focusNext(key); // 👈 move to next input
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !e.target.value) {
                          focusPrev(key); // 👈 move back if empty
                        }
                      }}
                      disabled={!!hintChar}
                      className={`w-7 h-7 sm:w-8 sm:h-8 text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-medium ${hintChar ? "bg-gray-100 text-gray-500" : "bg-white"
                        }`}
                    />
                  );
                })}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ArrangeOrderQuestion({
  question,
  selectedAnswers = {},
  handleAnswerSelect = () => { },
}) {
  const [items, setItems] = useState([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const dragAllowed = useRef(false);

  useEffect(() => {
    // Load saved answers if any, otherwise shuffle default sentences
    const saved = selectedAnswers?.[question.id];
    if (Array.isArray(saved) && saved.length > 0) {
      setItems(saved);
    } else {
      const sentences = Array.isArray(question.sentences) ? question.sentences : [];
      const shuffled = [...sentences].sort(() => Math.random() - 0.5);
      setItems(shuffled);
    }
  }, [question.id, question.sentences]);

  // Sync with parent whenever items change
  useEffect(() => {
    if (items.length > 0) {
      handleAnswerSelect(question.id, items);
    }
  }, [items]);

  const onDragStart = (e, index) => {
    if (!dragAllowed.current) {
      e.preventDefault();
      return;
    }
    setDraggedItemIndex(index);
    dragAllowed.current = false;
  };

  const onDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const onDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

    const updated = [...items];
    const [moved] = updated.splice(draggedItemIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setItems(updated);
    setDraggedItemIndex(null);
  };

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setItems(updated);
  };

  return (
    <div className="w-full">
      <div className="space-y-3 sm:space-y-4">
        {items.map((sentence, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, index)}
            className={`flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-2 bg-white border border-slate-200 rounded-xl shadow-sm transition-all ${draggedItemIndex === index ? 'opacity-50 ring-2 ring-blue-200' : ''
              }`}
          >
            {/* Drag Handle */}
            <div
              className="text-slate-400 cursor-grab active:cursor-grabbing p-1 flex-shrink-0"
              onMouseDown={() => { dragAllowed.current = true; }}
              onMouseUp={() => { dragAllowed.current = false; }}
              onTouchStart={() => { dragAllowed.current = true; }}
              onTouchEnd={() => { dragAllowed.current = false; }}
            >
              <FaBars className="w-3 h-3 sm:w-3 sm:h-3" />
            </div>

            {/* Text */}
            <div className="flex-1 text-slate-800 font-medium text-sm sm:text-base break-words">
              {sentence}
            </div>

            {/* Reorder Arrows */}
            <div className="flex gap-1 sm:gap-2 border-l pl-2 sm:pl-3 border-slate-100 flex-shrink-0">
              <button
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Move Up"
              >
                <FaArrowUp className="w-3 h-3 sm:w-3 sm:h-3" />
              </button>
              <button
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                title="Move Down"
              >
                <FaArrowDown className="w-3 h-3 sm:w-3 sm:h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BestOptionQuestion = ({ question, handleAnswerSelect, selectedAnswers = {} }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({});
  const containerRefs = useRef([]); // refs per blank for outside-click checks
  const dropdownRef = useRef(null); // ref for the portaled dropdown content

  // parse blanked_words safely
  const getParsedBlankedWords = () => {
    if (!question || !question.blanked_words) return [];
    if (typeof question.blanked_words === "string") {
      try {
        return JSON.parse(question.blanked_words);
      } catch (err) {
        console.error("Error parsing blanked_words JSON:", err);
        return [];
      }
    }
    return question.blanked_words;
  };

  // stable shuffled options per blank (memoized)
  const shuffledOptions = useMemo(() => {
    const blankedWords = getParsedBlankedWords();
    if (!blankedWords || blankedWords.length === 0) return {};
    const out = {};
    blankedWords.forEach((bw, idx) => {
      const arr = Array.isArray(bw.options) ? [...bw.options] : [];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      out[idx] = arr;
    });
    return out;
    // only re-run when the raw data changes
  }, [question?.blanked_words]);

  // passage parts same as your logic
  const passageParts = useMemo(() => {
    if (!question?.passage || typeof question.passage !== "string") return [];
    const parts = [];
    let currentIndex = 0;
    let blankCount = 0;
    const regex = /____/g;
    let match;
    while ((match = regex.exec(question.passage)) !== null) {
      if (match.index > currentIndex) {
        parts.push({ type: "text", content: question.passage.substring(currentIndex, match.index) });
      }
      blankCount++;
      parts.push({ type: "blank", number: blankCount });
      currentIndex = match.index + 4;
    }
    if (currentIndex < question.passage.length) {
      parts.push({ type: "text", content: question.passage.substring(currentIndex) });
    }
    return parts;
  }, [question?.passage]);


  // outside click: close dropdown if click outside currently open container
  useEffect(() => {
    function handleDocDown(e) {
      if (openDropdown === null) return;
      const el = containerRefs.current[openDropdown];
      // Close only if click is OUTSIDE the button container AND (if draggable exists) OUTSIDE the dropdown content
      if (el && !el.contains(e.target)) {
        if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
          return;
        }
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleDocDown);
    document.addEventListener("touchstart", handleDocDown);
    return () => {
      document.removeEventListener("mousedown", handleDocDown);
      document.removeEventListener("touchstart", handleDocDown);
    };
  }, [openDropdown]);

  if (!question) return <div>Loading question...</div>;


  const toggleDropdown = (index) => {
    if (openDropdown === index) {
      setOpenDropdown(null);
    } else {
      const el = containerRefs.current[index];
      if (el) {
        const rect = el.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom,
          left: rect.left,
          width: rect.width
        });
        setOpenDropdown(index);
      }
    }
  };

  const selectOption = (e, blankIndex, option) => {
    e.preventDefault();
    e.stopPropagation();
    handleAnswerSelect(`${question.id}_${blankIndex}`, option);
    // After user selects, close the dropdown (you asked it should stay open until they pick)
    setOpenDropdown(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-4">
        {/* Left: Passage */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full p-0"
        >

          <div className="py-0">
            <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
              {passageParts.map((part, idx) =>
                part.type === "text" ? (
                  <span key={idx} className="text-gray-600 break-words">{part.content}</span>
                ) : (
                  <motion.span
                    key={idx}
                    initial={{ backgroundColor: "#f0f0f0" }}
                    animate={{
                      backgroundColor: selectedAnswers[`${question.id}_${part.number - 1}`] ? "#e6f7ff" : "#f0f0f0",
                    }}
                    transition={{ duration: 0.2 }}
                    className="inline-block px-2 sm:px-3 py-1 border border-gray-300 rounded-md min-w-8 sm:min-w-10 text-center font-medium text-sm sm:text-base mx-1"
                    style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                  >
                    {part.number}
                  </motion.span>
                )
              )}
            </p>
          </div>
        </motion.div>

        {/* Right: Question + Dropdowns */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-2 sm:gap-y-4"
        >
          {getParsedBlankedWords().map((blankedWord, blankIndex) => {
            const selectedKey = `${question.id}_${blankIndex}`;
            const isOpen = openDropdown === blankIndex;
            // ensure there's a ref slot for this index
            return (
              <motion.div
                key={blankIndex}
                className=""
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.06 * blankIndex }}
              >
                {/* container is relative and overflow-visible so absolute dropdown won't be clipped */}
                <div
                  ref={(el) => (containerRefs.current[blankIndex] = el)}
                  className="relative flex flex-col overflow-visible"
                >
                  {/* Header button toggles dropdown */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown(blankIndex);
                    }}
                    className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2 border rounded-lg transition-all duration-200 w-full ${selectedAnswers[selectedKey] ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-white"}`}
                  >
                    <span className={`flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 text-xs sm:text-sm rounded-full ${selectedAnswers[selectedKey] ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"} font-medium flex-shrink-0`}>
                      {blankIndex + 1}
                    </span>

                    <span className={`flex-grow mx-2 sm:mx-4 text-left text-sm sm:text-base truncate ${selectedAnswers[selectedKey] ? "font-medium text-blue-700" : "text-gray-500"}`}>
                      {selectedAnswers[selectedKey] || "Select a word"}
                    </span>

                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.16 }} className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16" className="sm:w-5 sm:h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.span>
                  </button>

                  {/* Dropdown (absolute, stops propagation). Notice onClick stopPropagation */}
                  {isOpen && shuffledOptions[blankIndex] && createPortal(
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.14 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "fixed",
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width,
                        zIndex: 9999
                      }}
                      className="mt-1 border border-gray-300 rounded-lg bg-white shadow-lg overflow-hidden"
                    >
                      {shuffledOptions[blankIndex].map((option, optIndex) => {
                        const isSelected = selectedAnswers[selectedKey] === option;
                        return (
                          <div
                            key={optIndex}
                            onClick={(e) => selectOption(e, blankIndex, option)}
                            onMouseDown={(e) => e.preventDefault()} // prevent focus blur on some browsers
                            className={`p-2 sm:p-3 cursor-pointer transition-colors duration-150 text-sm sm:text-base ${optIndex < shuffledOptions[blankIndex].length - 1 ? "border-b border-gray-100" : ""} ${isSelected ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-50"}`}
                          >
                            {option}
                          </div>
                        );
                      })}
                    </motion.div>,
                    document.body
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div >
  );
};

const VideoPauseComponent = forwardRef(function VideoPauseComponent({
  videoUrl,
  questionIds,
  currQuestion,
  stamps,
  questions,
  quizId,
  onComplete,
  onScoreInit,
  onScoreChange,
  speakingCheck,
  setSpeakingCheck,
  setSelectedAnswers,
  selectedAnswers,
  onStampStatusChange
}, ref) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [check, setCheck] = useState({ speakerCheck: false, micCheck: false, flag: false });
  const [currentStampIndex, setCurrentStampIndex] = useState(-1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const videoRef = useRef(null);
  const { access_token } = getStudentToken();
  const { data: quizData, isLoading: quizLoading } = useGetQuizByQuizIdQuery(
    { id: quizId, access_token },
    { skip: !quizId }
  );

  const [answeredStamps, setAnsweredStamps] = useState(new Set());
  const [videoEnded, setVideoEnded] = useState(false);

  // Merge questions with full data from quizData
  const mergedQuestions = useMemo(() => {
    if (!quizData || !questions) return [];

    const keys = [
      "QuizQuestions",
      "ArrangeOrderQuestions",
      "CompleteSentenceQuestions",
      "DragDropQuestions",
      "RealWordQuestions",
      "BestOptionQuestions",
      "AudioPauseQuestions",
      "AudioToScriptQuestions",
      "ImageToScriptQuestions",
      "QuizPreDefinedQuestions",
      "SpeakingQuestions",
      "SummarizePassageQuestions",
      "TextedBasedQuizTexts",
      "VideoPauseQuestions",
      "VideoToScriptQuestions",
    ];

    // Collect all questions
    const flatQuestions = keys.reduce((acc, key) => {
      const arr = quizData[key];
      if (Array.isArray(arr)) {
        if (key === "TextedBasedQuizTexts") {
          return [
            ...acc,
            ...arr.flatMap((text) => [
              ...(text.FillInBlankQuestions || []).map((q) => ({
                ...q,
                id: `fill_${q.id}`,
                type: "fill_in_the_blank",
                quiz_id: quizId,
                question_text: text.text,
              })),
              ...(text.MultipleChoiceQuestions || []).map((q) => ({
                ...q,
                id: `multi_${q.id}`,
                type: "multiple_choice",
                quiz_id: quizId,
                question_text: text.text,
              })),
              ...(text.TrueFalseQuestions || []).map((q) => ({
                ...q,
                id: `true_false_${q.id}`,
                type: "true_false",
                quiz_id: quizId,
                question_text: text.text,
              })),
            ]),
          ];
        } else if (key === "QuizPreDefinedQuestions") {
          return [
            ...acc,
            ...arr.map((preDefQues) => {
              const questionData = preDefQues.PreDefinedQuestion;
              return {
                id: `pre_${questionData.id}`,
                quiz_id: quizId,
                question_text: questionData.question_text,
                question_img: questionData.question_img,
                question_type: questionData.question_type,
                marks: questionData.marks,
                sequence_no: questionData.sequence_no,
                QuizOptions: questionData.PreDefinedOptions.map((option) => ({
                  id: `pre_opt_${option.id}`,
                  question_id: `pre_${questionData.id}`,
                  option_text: option.option_text,
                  option_img: option.option_img,
                  is_correct: option.is_correct,
                })),
                type: questionData.question_type,
              };
            }),
          ];
        } else if (key === "CompleteSentenceQuestions") {
          return [
            ...acc,
            ...arr.map((q, idx) => {
              const options = q.options || [];
              const correct_word = options.map((opt) => opt.correct_word);
              const hint = options.map((opt) => opt.hint);
              return {
                ...q,
                id: `complete_sentence_${q.id}`,
                type: "complete the sentance",
                quiz_id: quizId,
                question: q.question,
                correct_word,
                hint,
                marks: q.marks || 1,
                sequence_no: 6000 + idx,
              };
            }),
          ];
        } else if (key === "DragDropQuestions") {
          return [
            ...acc,
            ...arr.map((q, idx) => ({
              id: `dragdrop_${q.id}`,
              quiz_id: quizId,
              type: "drag_drop",
              prompt: q.prompt || "",
              options: q.options || [],
              blanks: q.blanks || [],
              marks: q.marks || 1,
              sequence_no: 8000 + idx,
            })),
          ];
        } else if (key === "ArrangeOrderQuestions") {
          return [
            ...acc,
            ...arr.map((q, idx) => ({
              id: `arrangeorder_${q.id}`,
              quiz_id: quizId,
              type: "arrange_order",
              question_type: "arrange_order",
              arrangeorder_prompt: q.arrangeorder_prompt || "",
              sentences: q.sentences || [],
              correct_order: q.correct_order || [],
              marks: q.marks || 1,
              sequence_no: 7000 + idx,
            })),
          ];
        }
        return [...acc, ...arr];
      }
      return acc;
    }, []);

    return questions.map((q) => {
      const fullData = flatQuestions.find((qd) => {
        // Handle numeric vs prefixed string IDs
        if (typeof qd.id === "string" && qd.id.includes("_")) {
          const numericId = parseInt(qd.id.split("_").pop(), 10);
          return q.question_id === numericId;
        }
        return q.question_id === qd.id || q.question_id === qd.question_id;
      });
      return fullData ? { ...q, ...fullData } : q;
    });

  }, [quizData, questions, quizId]);

  const [evaluateAnswer, { data, isLoading, error }] = useEvaluateAnswerMutation();

  const handleCheckAnswer = async (questionText, correctAnswer, userAnswer, type) => {
    try {
      // FIXED: Removed invalid/incomplete 'subm' line (caused ReferenceError crash during evaluation)

      const formData = new FormData();

      formData.append("question_text", questionText);
      formData.append("correct_answer_script", correctAnswer);
      if (type !== "speaking") {
        formData.append("user_answer_script", userAnswer);
      }
      formData.append("question_type", type);

      // append audio file
      if (userAnswer instanceof File) {
        // already a File
        formData.append("speakingAudio", userAnswer);
      } else if (userAnswer?.audioBlob instanceof Blob) {
        // convert Blob -> File
        const file = new File([userAnswer.audioBlob], userAnswer.filename || "speaking_answer.wav", {
          type: userAnswer.audioBlob.type || "audio/wav",
        });
        formData.append("speakingAudio", file);
      }

      const result = await evaluateAnswer({ data: formData, access_token }).unwrap();

      return result;
    } catch (err) {
      console.error("Error evaluating:", err);
      return null
    }
  };

  // Initialize pause score in parent on mount
  useEffect(() => {
    if (currQuestion?.id && typeof currQuestion?.marks === "number") {
      onScoreInit && onScoreInit(currQuestion.id, currQuestion.marks);
    }
  }, [currQuestion?.id, currQuestion?.marks]);

  // Get the current question based on timestamp and question index
  const getCurrentQuestion = () => {
    if (currentStampIndex >= 0 && currentStampIndex < questionIds.length) {
      const questionId = questionIds[currentStampIndex][currentQuestionIndex];
      return mergedQuestions.find((q) => q.question_id === questionId || q.id === questionId);
    }
    return null;
  };

  const currentQuestion = getCurrentQuestion();

  // Handle video time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let debounceTimeout;
    const handleTimeUpdate = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        setCurrentTime(video.currentTime);
        const newStampIndex = stamps.findIndex(
          (stamp) =>
            video.currentTime >= stamp &&
            video.currentTime < (stamps[stamps.indexOf(stamp) + 1] || Infinity)
        );
        if (newStampIndex >= 0 && newStampIndex !== currentStampIndex) {
          setCurrentStampIndex(newStampIndex);
          setCurrentQuestionIndex(0);
          setShowQuestion(true);
          setIsPlaying(false);
          video.pause();
          setPauseTime(video.currentTime);
        }
      }, 100); // Adjust debounce delay as needed
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      clearTimeout(debounceTimeout);
    };
  }, [stamps, currentStampIndex]);

  // Handle answer selection
  const handleAnswerSelect = (questionId, value, indexOrIsMulti = false) => {
    // Only normalize if it's an object with known property keys (like MCQ options)
    // Avoid over-normalizing arrays (arrangeOrder) or plain maps (dragDrop)
    let normalizedValue = value;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const idKey = (value.id ?? value.value ?? value.option_id ?? value.optionId ?? value.option_text ?? value.label);
      if (idKey !== undefined) {
        normalizedValue = idKey;
      }
    }

    if (currentQuestion.type === "speaking") {
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: normalizedValue, // value is { audioBlob, audioUrl, filename, duration, type }
      }));
    } else if (currentQuestion.type === "realword") {
      const key = `${questionId}_${indexOrIsMulti}`;
      setSelectedAnswers((prev) => ({
        ...prev,
        [key]: normalizedValue,
      }));
    } else {
      const isMulti = indexOrIsMulti;
      setSelectedAnswers((prev) => {
        const currentQuestionObj = mergedQuestions.find((q) => q.id === questionId || q.question_id === questionId);
        const correctOptions = currentQuestionObj?.QuizOptions?.filter((opt) => opt.is_correct) || [];
        const isMultiSelect = correctOptions.length > 1;

        if (isMultiSelect && isMulti) {
          const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
          if (current.includes(normalizedValue)) {
            return { ...prev, [questionId]: current.filter((v) => v !== normalizedValue) };
          } else {
            return { ...prev, [questionId]: [...current, normalizedValue] };
          }
        }
        return { ...prev, [questionId]: normalizedValue };
      });
    }
  };


  const handleCompleteSentenceInput = useCallback((questionId, blankIndex, letterIndex, value) => {
    const letterKey = `${questionId}_${blankIndex}_${letterIndex}`;
    setSelectedAnswers((prev) => ({
      ...prev,
      [letterKey]: value,
    }));
  }, []);

  const handleNext = async () => {
    // Evaluate current question correctness and deduct marks if wrong
    try {
      if (currentQuestion) {
        let isCorrect = false;
        const q = currentQuestion;
        console.log("question ", q)
        if (q.type === "fill_in_the_blank") {
          const userAnswer = (selectedAnswers[q.id] || "").trim().toLowerCase();
          let correctAnswer = "";
          if (q.correct_answer) correctAnswer = (q.correct_answer || "").trim().toLowerCase();
          else if (q.correctAnswer) correctAnswer = (q.correctAnswer || "").trim().toLowerCase();
          else if (q.answer) correctAnswer = (q.answer || "").trim().toLowerCase();
          isCorrect = userAnswer === correctAnswer;
        } else if (q.type === "true_false") {
          const userAnswer = selectedAnswers[q.id] === "True";
          let correctAnswerBool = false;
          if (q.correct_answer !== undefined) correctAnswerBool = Boolean(q.correct_answer);
          else if (q.correctAnswer !== undefined) correctAnswerBool = Boolean(q.correctAnswer);
          else if (q.is_true !== undefined) correctAnswerBool = Boolean(q.is_true);
          isCorrect = userAnswer === correctAnswerBool;
        } else if (q.type === "mcq" || q.type === "multiple_choice") {
          const userAnswer = selectedAnswers[q.id];
          const correctOptions = q.QuizOptions?.filter(opt => opt.is_correct).map(o => o.id) || [];
          const isMultiSelect = correctOptions.length > 1;
          if (isMultiSelect) {
            const ua = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
            const ca = [...correctOptions].sort();
            isCorrect = ua.length === ca.length && ua.every((v, i) => v === ca[i]);
          } else {
            isCorrect = correctOptions.includes(userAnswer);
          }
        } else if (q.type === "arrange_order") {
          const userOrder = selectedAnswers[q.id] || [];
          // isCorrect = JSON.stringify(userOrder) === JSON.stringify(q.correct_order || []);
          isCorrect =
            userOrder.length === q.sentences.length &&
            userOrder.every((sentence, index) => sentence === q.sentences[index]);
        } else if (q.type === "complete the sentance" || q.type === "complete_sentence") {
          const parts = (q.question || "").split("_____");
          const numBlanks = parts.length - 1;
          const correctWords = Array.isArray(q.correct_word) ? q.correct_word.slice() : Array(numBlanks).fill(q.correct_word || "");
          const hints = Array.isArray(q.hint) ? q.hint.slice() : Array(numBlanks).fill(q.hint || "");
          let allBlanksCorrect = true;
          for (let b = 0; b < numBlanks; b++) {
            const cw = correctWords[b] || "";
            const hint = hints[b] || "";
            let userWord = "";
            for (let li = 0; li < cw.length; li++) {
              if (li < hint.length) userWord += hint[li];
              else {
                const key = `${q.id}_${b}_${li}`;
                userWord += (selectedAnswers[key] || "").trim();
              }
            }
            if (userWord.trim().toLowerCase() !== (cw || "").trim().toLowerCase()) {
              allBlanksCorrect = false;
              break;
            }
          }
          isCorrect = allBlanksCorrect;
        } else if (q.type === "bestoption" || q.type === "best_option") {
          let blankedWords = q.blanked_words;
          if (typeof blankedWords === 'string') {
            try { blankedWords = JSON.parse(blankedWords); } catch { blankedWords = []; }
          }
          let allCorrect = true;
          blankedWords?.forEach((bw, idx) => {
            const ua = (selectedAnswers[`${q.id}_${idx}`] || "").toLowerCase();
            if (ua !== (bw.word || "").toLowerCase()) allCorrect = false;
          });
          isCorrect = allCorrect;
        } else if (q.type === "realword") {
          const key = `${q.id}_${currentWordIndex}`;
          const ua = selectedAnswers[key];
          // Try to infer correctness if available
          const correct = Array.isArray(q.correct_answers) ? q.correct_answers[currentWordIndex] : undefined;
          isCorrect = correct ? ua === correct : ua !== undefined; // if no correct data, assume answered
        } else if (q.type === "drag_drop") {
          const userAnswers = selectedAnswers[q.id] || {};
          const blanks = Array.isArray(q.blanks) ? q.blanks : [];
          let allCorrect = true;
          blanks.forEach(blank => {
            const pos = blank.position;
            const correct = blank.correct;
            if (userAnswers[pos] !== correct) allCorrect = false;
          });
          isCorrect = allCorrect;
        } else if (q.type === "speaking") {
          const result = await handleCheckAnswer(q.question_text, q.speaking_answer, selectedAnswers[q.id], q.type)

          console.log("speakingResult ", result);
          if (result?.similarity >= 70) {
            isCorrect = true;
          }
        } else if (q.type === "summarizepassage" || q.type === "summary_passage") {
          const result = await handleCheckAnswer(q.question_text, q.summary, selectedAnswers[q.id], "summary_passage")

          if (result?.similarity >= 70) {
            isCorrect = true;
          }
        } else if (q.type === "audio_script" || q.type === "video_script" || q.type === "image_script") {
          console.log("selectedAnswers ", selectedAnswers);

          // Defer complex AI-evaluated or unsupported types: do not deduct here
          isCorrect = true;
        }

        if (!isCorrect) {
          const deduct = Number(q.marks || 1);
          if (currQuestion?.id && onScoreChange) {
            // We do not know current parent score, parent maintains; we just signal new deduction by sending a negative step
            // For idempotency, parent expects absolute newScore; we cannot read it here, so we send a deduction marker and parent will append
            onScoreChange(currQuestion.id, undefined, { subId: q.id, marks: deduct });
          }
        }
      }
    } catch (e) {
      // fail-safe: do not deduct
      console.error('Pause scoring error:', e);
    }

    // Mark this stamp as answered
    setAnsweredStamps(prev => new Set(prev).add(currentStampIndex));

    // Case 1: More questions remain at the same timestamp
    if (
      currentStampIndex < questionIds.length &&
      currentQuestionIndex < questionIds[currentStampIndex].length - 1
    ) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowQuestion(true);
      return;
    }

    // Case 2: All questions for this stamp are done → resume video
    setShowQuestion(false);
    setCurrentQuestionIndex(0);
    setCurrentWordIndex(0); // reset for realword type

    const resumeTime = stamps[currentStampIndex] + 1; // resume just after this stamp
    //  videoRef.current.currentTime = currentTime;
    videoRef.current.currentTime = pauseTime;
    setIsPlaying(true);
    videoRef.current
      .play()
      .catch((error) => console.error("Video play failed:", error));
  };


  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((error) => console.error("Video play failed:", error));
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMute = () => {
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Check if the Next button should be disabled
  const isNextButtonDisabled = () => {
    if (!currentQuestion) return true;
    const selected = selectedAnswers[currentQuestion.id || currentQuestion.question_id];
    const correctOptions = currentQuestion?.QuizOptions?.filter((opt) => opt.is_correct) || [];
    const isMultiSelect = correctOptions.length > 1;

    if (currentQuestion.type === "fill_in_the_blank") {
      return !selected || selected.trim() === "";
    }
    if (currentQuestion.type === "true_false" || currentQuestion.type === "multiple_choice" || currentQuestion.type === "mcq") {
      return isMultiSelect ? !selected || selected.length === 0 : !selected;
    }
    if (currentQuestion.type === "complete the sentance") {
      const numBlanks = currentQuestion.correct_word?.length || 0;
      let allFilled = true;
      for (let blankIndex = 0; blankIndex < numBlanks; blankIndex++) {
        const correctWord = currentQuestion.correct_word[blankIndex] || "";
        const hint = currentQuestion.hint[blankIndex] || "";
        for (let letterIndex = hint.length; letterIndex < correctWord.length; letterIndex++) {
          const key = `${currentQuestion.id}_${blankIndex}_${letterIndex}`;
          if (!selectedAnswers[key] || selectedAnswers[key].trim() === "") {
            allFilled = false;
            break;
          }
        }
        if (!allFilled) break;
      }
      return !allFilled;
    }
    if (currentQuestion.type === "speaking") {
      return !selectedAnswers[currentQuestion.id];
    }
    if (currentQuestion.type === "arrange_order") {
      return !selected || selected.length === 0;
    }
    if (currentQuestion.type === "realword") {
      // Check if all words have been answered
      const words = currentQuestion.words || [];
      for (let i = 0; i < words.length; i++) {
        const key = `${currentQuestion.id}_${i}`;
        if (selectedAnswers[key] === undefined) {
          return true;
        }
      }
      return false;
    }
    if (currentQuestion.type === "bestoption") {
      let blankedWords = currentQuestion.blanked_words;
      if (typeof blankedWords === "string") {
        try {
          blankedWords = JSON.parse(blankedWords);
        } catch (error) {
          console.error("Error parsing blanked_words JSON:", error);
          blankedWords = [];
        }
      }
      for (let i = 0; i < blankedWords.length; i++) {
        const key = `${currentQuestion.id}_${i}`;
        if (!selectedAnswers[key]) {
          return true;
        }
      }
      return false;
    }
    if (currentQuestion.type === "drag_drop") {
      const filledBlanks = selectedAnswers[currentQuestion.id] || {};
      return Object.keys(filledBlanks).length < currentQuestion.blanks.length;
    }
    return !selected;
  };

  // Determine if this is the last stamp
  const isLastStamp = currentStampIndex >= 0 && currentStampIndex === stamps.length - 1 &&
    currentQuestionIndex >= (questionIds[currentStampIndex]?.length || 1) - 1;

  // Expose handleNext and isNextButtonDisabled to parent via ref
  useImperativeHandle(ref, () => ({
    handleNext,
    isNextButtonDisabled,
    showQuestion,
    isLastStamp,
    videoEnded,
  }), [showQuestion, currentStampIndex, stamps.length, currentQuestionIndex, questionIds, selectedAnswers, videoEnded]);

  // Report stamp status to parent whenever it changes
  useEffect(() => {
    if (onStampStatusChange) {
      onStampStatusChange({
        showQuestion,
        isLastStamp,
        isNextDisabled: isNextButtonDisabled(),
        videoEnded,
      });
    }
  }, [showQuestion, currentStampIndex, stamps.length, currentQuestionIndex, questionIds, selectedAnswers, videoEnded]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
      {/* LEFT: Video Player */}
      <div className="w-full lg:w-1/2 relative pt-4 sm:pt-6">
        <video
          ref={videoRef}
          autoPlay={true}
          src={videoUrl}
          className="w-full h-[240px] sm:h-[280px] md:h-[320px] lg:h-[360px] rounded-xl object-cover"
          onEnded={() => {
            setVideoEnded(true);
            // Check if all stamps have been answered
            const allStampsAnswered = stamps.every((_, index) => answeredStamps.has(index));
            if (allStampsAnswered) {
              onComplete();
            } else {
              // If not all stamps answered, seek to the last unanswered stamp
              const unansweredStamps = stamps.findIndex((_, index) => !answeredStamps.has(index));
              if (unansweredStamps !== -1) {
                videoRef.current.currentTime = stamps[unansweredStamps];
                setIsPlaying(true);
                videoRef.current.play().catch(error => console.error("Video play failed:", error));
              }
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
        />
        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Single row with play button, progress bar, and time */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2 sm:gap-3 rounded-b-xl">
            <button
              onClick={togglePlayPause}
              disabled={showQuestion}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors flex-shrink-0 ${showQuestion
                ? "bg-white/10 text-white/50 cursor-not-allowed"
                : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              title={showQuestion ? "Answer the question to continue" : (isPlaying ? "Pause" : "Play")}
            >
              {isPlaying ? (
                <FaPause size={12} className="sm:w-3.5 sm:h-3.5" />
              ) : (
                <FaPlay size={12} className="sm:w-3.5 sm:h-3.5" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors flex-shrink-0"
            >
              {isMuted ? <FaVolumeMute size={12} className="sm:w-3.5 sm:h-3.5" /> : <FaVolumeUp size={12} className="sm:w-3.5 sm:h-3.5" />}
            </button>

            {/* Progress Bar */}
            <div className="relative flex-1 h-1 sm:h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Time Display */}
            <div className="text-xs font-medium text-white/90 flex-shrink-0">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </div>
          </div>
        </div>
        {(() => {
          return null;
        })()}
      </div>

      {/* RIGHT: Question Display */}
      <div className="w-full lg:w-1/2">
        {!showQuestion && (
          <div className="w-full h-[200px] sm:h-[240px] md:h-[280px] lg:h-[360px] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 sm:mb-4">
              <FaTv className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            {(() => {
              const nextStamp = stamps.find(s => s > currentTime + 0.5);
              if (nextStamp) {
                return (
                  <>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">Keep Watching!</h3>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">
                      Next question appearing soon
                    </p>
                  </>
                );
              } else {
                return (
                  <>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">Great Job!</h3>
                    <p className="text-sm sm:text-base text-slate-500">You've completed all questions.</p>
                  </>
                );
              }
            })()}
          </div>
        )}

        {showQuestion && currentQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-3 sm:p-4 lg:p-6 flex flex-col"
            style={{ height: "calc(100vh - 200px)", maxHeight: "500px" }}
          >

            {currentQuestion.type !== "drag_drop" && currentQuestion.type !== "summarizepassage" && <div className="mb-3 sm:mb-4 flex-shrink-0">
              <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-slate-800 break-words">
                {currentQuestion.type === "realword"
                  ? "Identify which words are correct and which are fake:"
                  : currentQuestion.type === "bestoption"
                    ? "Select the best option for each missing word."
                    : (currentQuestion.question_text ||
                      currentQuestion.arrangeorder_prompt ||
                      currentQuestion.prompt ||
                      currentQuestion.summarize_passage_text ||
                      "Question")}
              </h3>
            </div>}

            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1 sm:pr-2">
              {/* Render Question Based on Type */}
              {currentQuestion.type === "fill_in_the_blank" && (
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-slate-800 text-base sm:text-lg font-semibold leading-relaxed break-words">
                    {currentQuestion.text || currentQuestion.question_text}
                  </p>
                  <input
                    type="text"
                    className="w-full p-3 sm:p-4 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-slate-800 placeholder:text-slate-400 text-sm sm:text-base"
                    value={selectedAnswers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here"
                  />
                </div>
              )}

              {currentQuestion.type === "multiple_choice" && (
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-slate-800 text-sm sm:text-base lg:text-lg font-semibold leading-relaxed break-words">
                    {currentQuestion.text || currentQuestion.question_text}
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {currentQuestion.options?.map((option, index) => {
                      const isMultiSelect = (currentQuestion.QuizOptions?.filter((opt) => opt.is_correct) || []).length > 1;
                      const isSelected = Array.isArray(selectedAnswers[currentQuestion.id])
                        ? selectedAnswers[currentQuestion.id].includes(option)
                        : selectedAnswers[currentQuestion.id] === option;
                      return (
                        <div
                          key={index}
                          className={`p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                            ? "border-blue-400 bg-slate-50"
                            : "border-slate-200 bg-white"
                            }`}
                          onClick={() => handleAnswerSelect(currentQuestion.id, option, isMultiSelect)}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full border-2 mr-2 sm:mr-3 transition-all duration-200 ${isSelected ? "border-blue-500" : "border-slate-300"
                                }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <span className="text-slate-700 text-sm sm:text-base break-words">
                              {option}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentQuestion.type === "true_false" && (
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-slate-800 text-sm sm:text-base lg:text-lg font-semibold leading-relaxed break-words">
                    {currentQuestion.text || currentQuestion.question_text}
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    {["True", "False"].map((option) => (
                      <div
                        key={option}
                        className={`p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedAnswers[currentQuestion.id] === option
                          ? "border-blue-400 bg-slate-50"
                          : "border-slate-200 bg-white"
                          }`}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full border-2 mr-2 sm:mr-3 transition-all duration-200 ${selectedAnswers[currentQuestion.id] === option
                              ? "border-blue-500"
                              : "border-slate-300"
                              }`}
                          >
                            {selectedAnswers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <span className="text-slate-700 text-sm sm:text-base">
                            {option}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.type === "realword" && (
                <div>
                  {currentQuestion.words?.map((word, wordIndex) => {
                    const selectedValue = selectedAnswers[`${currentQuestion.id}_${wordIndex}`];
                    return (
                      <div
                        key={wordIndex}
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-3 border-b border-slate-100 last:border-0 gap-2 sm:gap-0"
                      >
                        <span className="text-slate-800 font-medium text-base sm:text-lg break-words">
                          {word}
                        </span>
                        <div className="flex gap-2 sm:gap-2">
                          <button
                            onClick={() => handleAnswerSelect(currentQuestion.id, "yes", wordIndex)}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${selectedValue === "yes"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-white text-slate-500 border border-slate-200"
                              }`}
                          >
                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center ${selectedValue === "yes" ? "border-emerald-500" : "border-slate-300"
                              }`}>
                              {selectedValue === "yes" && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full"></div>
                              )}
                            </div>
                            Correct
                          </button>
                          <button
                            onClick={() => handleAnswerSelect(currentQuestion.id, "no", wordIndex)}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${selectedValue === "no"
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-white text-slate-500 border border-slate-200"
                              }`}
                          >
                            <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center ${selectedValue === "no" ? "border-rose-500" : "border-slate-300"
                              }`}>
                              {selectedValue === "no" && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full"></div>
                              )}
                            </div>
                            Fake
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}


              {currentQuestion.type === "complete the sentance" && (
                <CompleteSentenceQuestion
                  question={currentQuestion}
                  selectedAnswers={selectedAnswers}
                  handleCompleteSentenceInput={handleCompleteSentenceInput}
                />
              )}

              {currentQuestion.type === "arrange_order" && (
                <ArrangeOrderQuestion
                  question={currentQuestion}
                  selectedAnswers={selectedAnswers}
                  handleAnswerSelect={handleAnswerSelect}
                />
              )}

              {currentQuestion.type === "bestoption" && (
                <BestOptionQuestion
                  question={currentQuestion}
                  handleAnswerSelect={handleAnswerSelect}
                  selectedAnswers={selectedAnswers}
                />
              )}

              {currentQuestion.type === "summarizepassage" && (
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-slate-700 mb-1 sm:mb-2 font-medium text-sm sm:text-base">
                    Write a summary for the given passage:
                  </p>
                  <div className="p-0">
                    <p className="text-slate-800 text-sm sm:text-base font-medium whitespace-pre-line break-words">
                      {currentQuestion.summary}
                    </p>
                  </div>
                  <textarea
                    className="p-3 sm:p-4 border border-slate-300 rounded-xl w-full transition-all duration-300 outline-none shadow-sm min-h-[120px] sm:min-h-[150px] text-slate-800 text-sm sm:text-base"
                    value={selectedAnswers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                    placeholder="Write your summary here..."
                  />
                </div>
              )}

              {currentQuestion.type === "speaking" && (
                <SpeakingQuestion
                  currentQuestion={currentQuestion}
                  handleAnswerSelect={handleAnswerSelect}
                  selectedAnswers={selectedAnswers}
                  check={speakingCheck}
                  setCheck={setSpeakingCheck}
                  isPauseQuestion={true}
                />
              )}

              {currentQuestion.type === "drag_drop" && (
                <DragDropQuestion
                  currentQuestion={currentQuestion}
                  handleAnswerSelect={handleAnswerSelect}
                  selectedAnswers={selectedAnswers}
                />
              )}



              {(currentQuestion.type === "audio_script" ||
                currentQuestion.type === "video_script" ||
                currentQuestion.type === "image_script") && (
                  <div className="p-3 sm:p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg text-amber-800 text-sm sm:text-base">
                    <p>Question type &quot;{currentQuestion.type}&quot; is not supported in video pause mode.</p>
                  </div>
                )}

              {currentQuestion.QuizOptions && !["fill_in_the_blank", "true_false", "multiple_choice", "realword", "complete the sentance", "arrange_order", "bestoption"].includes(currentQuestion.type) && (
                <div className="space-y-2 sm:space-y-3">
                  {currentQuestion.QuizOptions.map((option) => {
                    const isMultiSelect = (currentQuestion.QuizOptions?.filter((opt) => opt.is_correct) || []).length > 1;
                    const selected = Array.isArray(selectedAnswers[currentQuestion.id])
                      ? selectedAnswers[currentQuestion.id].includes(option.id)
                      : selectedAnswers[currentQuestion.id] === option.id;
                    return (
                      <div
                        key={option.id}
                        className={`p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selected
                          ? "border-blue-400 bg-slate-50"
                          : "border-slate-200 bg-white"
                          }`}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option.id, isMultiSelect)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full border-2 mr-2 sm:mr-3 transition-all duration-200 ${selected ? "border-blue-500" : "border-slate-300"
                              }`}
                          >
                            {selected && (
                              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <span className="text-slate-700 text-sm sm:text-base break-words">
                            {option.option_text}
                          </span>
                        </div>
                        {option.option_img && option.option_img.trim() !== "" && option.option_img !== "null" && (
                          <div className="ml-6 sm:ml-8 mt-2 sm:mt-3">
                            <img
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_img || "/placeholder.png"}`}
                              alt="Option illustration"
                              className="rounded-lg shadow-md max-h-24 sm:max-h-32 w-auto"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
            {/* Continue button - now handled by bottom bar on all screen sizes */}
            <div className="hidden">
              <button
                onClick={handleNext}
                disabled={isNextButtonDisabled()}
                className={`py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl transition-all duration-300 flex items-center text-sm sm:text-base ${isNextButtonDisabled()
                  ? "bg-blue-300 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white "
                  }`}
              >
                Continue
                <FaArrowRight className="ml-2 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </motion.div>
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
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.5s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
});

export default VideoPauseComponent;