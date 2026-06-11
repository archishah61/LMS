/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { FaArrowRight, FaHeadphones } from "react-icons/fa";
import { useGetQuizByQuizIdQuery } from "../../../services/Course_Management/quizApi";
import { getStudentToken } from "../../../services/CookieService";
import { motion, AnimatePresence } from "framer-motion";
import AudioPlayerForPause from "../../ui/audioPausePlayer";
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
                      className={`w-7 h-7 sm:w-8 sm:h-8 text-center border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg font-medium mx-1 ${hintChar ? "bg-gray-100 text-gray-500" : "bg-white"
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
  const questionKey = question?.id;
  const [originalItems, setOriginalItems] = useState([]);
  const [items, setItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromLeft, setDraggedFromLeft] = useState(false);

  // Initialize and shuffle items
  useEffect(() => {
    const sentences = Array.isArray(question.sentences) ? question.sentences : [];
    // Shuffle the sentences
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    setOriginalItems(shuffled);

    // Load saved answers if any
    const saved = selectedAnswers?.[questionKey];
    if (Array.isArray(saved)) {
      setItems(saved);
    } else {
      setItems([]);
    }
  }, [questionKey, question.sentences]);

  // Sync with parent
  useEffect(() => {
    if (questionKey !== undefined && questionKey !== null) {
      handleAnswerSelect(questionKey, items);
    }
  }, [items, questionKey]);

  const onDragStartLeft = (e, sentence) => {
    setDraggedItem(sentence);
    setDraggedFromLeft(true);
  };

  const onDragStartRight = (e, index) => {
    setDraggedItem(items[index]);
    setDraggedFromLeft(false);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnRight = (e, position) => {
    e.preventDefault();
    if (draggedItem === null) return;

    if (draggedFromLeft) {
      // Add from left to right
      if (!items.includes(draggedItem)) {
        const updated = [...items];
        if (position === null) updated.push(draggedItem);
        else updated.splice(position, 0, draggedItem);
        setItems(updated);
      }
    } else {
      // Rearrange inside right box
      const currentIndex = items.indexOf(draggedItem);
      if (currentIndex !== -1) {
        const updated = [...items];
        const [moved] = updated.splice(currentIndex, 1);
        if (position === null) updated.push(moved);
        else updated.splice(position, 0, moved);
        setItems(updated);
      }
    }

    setDraggedItem(null);
  };

  const addToRight = (sentence) => {
    if (!items.includes(sentence)) {
      const updated = [...items, sentence];
      setItems(updated);
    }
  };

  const moveItem = (from, to) => {
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setItems(updated);
  };

  const removeItemAt = (pos) => {
    const updated = [...items];
    updated.splice(pos, 1);
    setItems(updated);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
      {/* LEFT: Available Items */}
      <div className="flex-1 space-y-2 sm:space-y-3">
        <h3 className="text-slate-600 font-semibold text-xs sm:text-sm uppercase tracking-wide">
          Available Sentences
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {originalItems.map((sentence, idx) => {
            const used = items.includes(sentence);
            return (
              <div
                key={`left-${idx}`}
                draggable={!used}
                onDragStart={(e) => !used && onDragStartLeft(e, sentence)}
                className={`group p-3 sm:p-4 border rounded-xl transition-all ${used
                  ? "bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed"
                  : "bg-white border-slate-200 shadow-sm hover:shadow-md cursor-move hover:border-blue-300"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-medium text-sm sm:text-base ${used ? "text-gray-500" : "text-slate-800"
                      } break-words pr-2`}
                  >
                    {sentence}
                  </span>
                  {used ? (
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">(Used)</span>
                  ) : (
                    <button
                      onClick={() => addToRight(sentence)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 sm:w-6 sm:h-6 text-blue-500 hover:text-blue-700 transition-opacity flex items-center justify-center flex-shrink-0"
                      title="Add to arrangement"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MIDDLE: Arrow */}
      <div className="flex items-center justify-center lg:flex-col lg:justify-center">
        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full shadow-md">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 transform rotate-90 md:rotate-0 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      </div>

      {/* RIGHT: Arranged Area */}
      <div className="flex-1 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-600 font-semibold text-xs sm:text-sm uppercase tracking-wide">
            Your Arrangement ({items.length}/{originalItems.length})
          </h3>
          {items.length > 0 && (
            <button
              onClick={() => setItems([])}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 sm:px-3 py-1 rounded-md hover:bg-red-50"
            >
              Clear All
            </button>
          )}
        </div>

        <div
          onDragOver={onDragOver}
          onDrop={(e) => handleDropOnRight(e, null)}
          className="space-y-2 sm:space-y-3 min-h-[200px] p-3 sm:p-4 rounded-xl border-2 border-dashed transition-colors border-slate-300 bg-gray-50"
        >
          {items.length === 0 && (
            <div className="text-center py-6 sm:py-8">
              <p className="text-slate-500 font-medium text-sm sm:text-base">
                Drag sentences here to arrange them
              </p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Drop zone for your sentence arrangement
              </p>
            </div>
          )}

          {items.map((sentence, position) => (
            <div
              key={`arranged-${position}`}
              draggable
              onDragStart={(e) => onDragStartRight(e, position)}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.stopPropagation();
                handleDropOnRight(e, position);
              }}
              className="group p-3 sm:p-4 border rounded-xl bg-white shadow-sm transition-all relative border-slate-200 hover:shadow-md cursor-move hover:border-blue-300"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <span className="text-xs sm:text-sm font-bold text-blue-700">
                    {position + 1}
                  </span>
                </div>

                <span className="font-medium text-slate-800 flex-1 text-sm sm:text-base break-words">
                  {sentence}
                </span>

                <div className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => position > 0 && moveItem(position, position - 1)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 sm:w-6 sm:h-6 text-blue-500 hover:text-blue-700 transition-opacity flex items-center justify-center"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() =>
                      position < items.length - 1 &&
                      moveItem(position, position + 1)
                    }
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 sm:w-6 sm:h-6 text-blue-500 hover:text-blue-700 transition-opacity flex items-center justify-center"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeItemAt(position)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 sm:w-6 sm:h-6 text-blue-500 hover:text-blue-700 transition-opacity flex items-center justify-center"
                    title="Move back"
                  >
                    ←
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const BestOptionQuestion = ({ question, handleAnswerSelect, selectedAnswers = {} }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const containerRefs = useRef([]); // refs per blank for outside-click checks

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
      if (el && !el.contains(e.target)) {
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
    setOpenDropdown((prev) => (prev === index ? null : index));
  };

  const selectOption = (e, blankIndex, option) => {
    e.preventDefault();
    e.stopPropagation();
    handleAnswerSelect(`${question.id}_${blankIndex}`, option);
    // After user selects, close the dropdown (you asked it should stay open until they pick)
    setOpenDropdown(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex md:flex-row flex-col gap-4 sm:gap-8">
        {/* Left: Passage */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="md:w-1/2 bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-md"
        >
          <div className="text-gray-500 uppercase text-xs sm:text-sm font-medium sm:mb-4 pb-2 border-b">PASSAGE</div>
          <div className="py-2 sm:py-4">
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
          className="md:w-1/2"
        >
          {/* <div className="text-base sm:text-xl font-semibold mb-6 text-gray-800">Select the best option for each missing word.</div> */}

          {getParsedBlankedWords().map((blankedWord, blankIndex) => {
            const selectedKey = `${question.id}_${blankIndex}`;
            const isOpen = openDropdown === blankIndex;
            // ensure there's a ref slot for this index
            return (
              <motion.div
                key={blankIndex}
                className="mb-4 sm:mb-6"
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
                    className={`flex items-center justify-between p-3 sm:p-4 border rounded-lg transition-all duration-200 w-full ${selectedAnswers[selectedKey] ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-white"}`}
                  >
                    <span className={`flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-full text-sm sm:text-base ${selectedAnswers[selectedKey] ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"} font-medium flex-shrink-0`}>
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
                  <AnimatePresence>
                    {isOpen && shuffledOptions[blankIndex] && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.14 }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-full left-0 z-50 w-full mt-2 border border-gray-300 rounded-lg bg-white shadow-lg overflow-hidden"
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};


const AudioPauseComponent = forwardRef(function AudioPauseComponent({
  audioUrl,
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
  onStampStatusChange,
}, ref) {
  // State management
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  // const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentStampIndex, setCurrentStampIndex] = useState(-1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [check, setCheck] = useState({ speakerCheck: false, micCheck: false, flag: false });
  const [answeredStamps, setAnsweredStamps] = useState(new Set());
  const [audioEnded, setAudioEnded] = useState(false);

  // Refs
  const audioPlayerRef = useRef(null);
  const { access_token } = getStudentToken();
  const { data: quizData, isLoading: quizLoading, isError, error } = useGetQuizByQuizIdQuery(
    { id: quizId, access_token },
    { skip: !quizId }
  );
  // Merge questions with full data from quizData
  const mergedQuestions = useMemo(() => {
    if (!questions) return [];
    if (!quizData) return questions;
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
                type: "complete_sentence",
                quiz_id: quizId,
                question: q.question,
                correct_word,
                hint,
                marks: q.marks || 1,
                sequence_no: 6000 + idx,
              };
            }),
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
        } else if (key === "SpeakingQuestions") {
          return [
            ...acc,
            ...arr.map((q) => ({
              ...q,
              id: `speaking_${q.id}`,
              type: "speaking",
              quiz_id: quizId,
              question_text: q.speaking_question,
              question_img: q.question_img,
              marks: q.marks || 1,
              sequence_no: q.sequence_no || 8000,
            })),
          ];
        }

        return [...acc, ...arr];
      }
      return acc;
    }, []);
    const merged = questions.map((q) => {
      const fullData = flatQuestions.find((qd) => {
        if (typeof qd.id === "string" && qd.id.includes("_")) {
          const numericId = parseInt(qd.id.split("_").pop(), 10);
          return q.question_id === numericId;
        }
        return q.question_id === qd.id || q.question_id === qd.question_id;
      });
      return fullData ? { ...q, ...fullData } : q;
    });
    return merged;
  }, [quizData, questions, quizId]);

  const [evaluateAnswer, { data, isLoading, error: evolutionError }] = useEvaluateAnswerMutation();

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

  // Get the current question based on timestamp and question index
  const getCurrentQuestion = () => {
    if (currentStampIndex >= 0 && currentStampIndex < questionIds.length) {
      const questionId = questionIds[currentStampIndex][currentQuestionIndex];
      const found = mergedQuestions.find((q) => {
        return q.question_id === questionId || q.id === questionId;
      });
      if (!found) {
        console.log('question not found for id', questionId);
      }
      return found;
    }
    return null;
  };
  const currentQuestion = getCurrentQuestion();

  // Initialize pause score in parent on mount
  useEffect(() => {
    if (currQuestion?.id && typeof currQuestion?.marks === "number") {
      onScoreInit && onScoreInit(currQuestion.id, currQuestion.marks);
    }
  }, [currQuestion?.id, currQuestion?.marks]);
  // Handle stamp reached
  const handleStampReached = (stampIndex) => {
    if (stampIndex !== currentStampIndex) {
      setCurrentStampIndex(stampIndex);
      setCurrentQuestionIndex(0);
      setShowQuestion(true);
      setIsPlaying(false);
      setPauseTime(audioPlayerRef.current.getCurrentTime()); // Store the pause time
      audioPlayerRef.current.pause();
    }
  };

  // Handle time update
  const handleTimeUpdate = (currentTime) => {
    setCurrentTime(currentTime);
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioEnded(true);
    // Check if all stamps have been answered
    const allStampsAnswered = stamps.every((_, index) => answeredStamps.has(index));
    if (allStampsAnswered) {
      onComplete && onComplete();
    } else {
      // If not all stamps answered, seek to the last unanswered stamp
      const unansweredStamps = stamps.findIndex((_, index) => !answeredStamps.has(index));
      if (unansweredStamps !== -1) {
        audioPlayerRef.current.seek(stamps[unansweredStamps]);
        setIsPlaying(true);
        audioPlayerRef.current.play();
      }
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, value, indexOrIsMulti = false) => {
    let normalizedValue = value;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const extractedValue = value.id ?? value.value ?? value.option_id ?? value.optionId ?? value.option_text ?? value.label;
      if (extractedValue !== undefined) {
        normalizedValue = extractedValue;
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
  // Handle next question or resume audio
  const handleNext = async () => {
    // Evaluate current question correctness and deduct marks if wrong
    try {
      if (currentQuestion) {
        let isCorrect = false;
        const q = currentQuestion;
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
          const questionKey = q.id ?? q.question_id;
          const fallbackQuestionKey = q.question_id ?? q.id;
          const userOrder = selectedAnswers[questionKey] || selectedAnswers[fallbackQuestionKey] || [];
          isCorrect =
            userOrder.length === q.sentences.length &&
            userOrder.every((sentence, index) => sentence === q.sentences[index]);
        } else if (q.type === "complete_sentence") {
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
          let allCorrect = true;
          q.words.forEach((_, idx) => {
            const key = `${q.id}_${idx}`;
            const ua = selectedAnswers[key];
            const correct = Array.isArray(q.correct_answers) ? q.correct_answers[idx] : undefined;
            const wordCorrect = correct ? ua === correct : ua !== undefined;
            if (!wordCorrect) allCorrect = false;
          });
          isCorrect = allCorrect;
        } else if (q.type === "speaking") {
          const result = await handleCheckAnswer(q.question_text, q.speaking_answer, selectedAnswers[q.id], q.type)

          if (result?.similarity >= 70) {
            isCorrect = true;
          }
        } else if (q.type === "summarizepassage" || q.type === "summary_passage") {
          const result = await handleCheckAnswer(q.question_text, q.summary, selectedAnswers[q.id], "summary_passage")

          if (result?.similarity >= 70) {
            isCorrect = true;
          }
        } else if (q.type === "audio_script" || q.type === "video_script" || q.type === "image_script") {
          // Defer complex AI-evaluated or unsupported types: do not deduct here
          isCorrect = true;
        }

        if (!isCorrect) {
          const deduct = Number(q.marks || 1);
          if (currQuestion?.id && onScoreChange) {
            onScoreChange(currQuestion.id, undefined, { subId: q.id, marks: deduct });
          }
        }
      }
    } catch (e) {
      console.error('Pause scoring error:', e);
    }

    // Mark this stamp as answered
    setAnsweredStamps(prev => new Set(prev).add(currentStampIndex));


    if (currentStampIndex < questionIds.length && currentQuestionIndex < questionIds[currentStampIndex].length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowQuestion(true);
      return;
    }
    setShowQuestion(false);
    setCurrentQuestionIndex(0);
    setCurrentWordIndex(0);
    audioPlayerRef.current.seek(pauseTime); // Resume from the stored pause time
    audioPlayerRef.current.play();
    setIsPlaying(true);
  };

  // Check if the Next button should be disabled
  const isNextButtonDisabled = () => {
    if (!currentQuestion) return true;
    const questionKey = currentQuestion.id ?? currentQuestion.question_id;
    const fallbackQuestionKey = currentQuestion.question_id ?? currentQuestion.id;
    const selected = selectedAnswers[questionKey] ?? selectedAnswers[fallbackQuestionKey];
    const correctOptions = currentQuestion?.QuizOptions?.filter((opt) => opt.is_correct) || [];
    const isMultiSelect = correctOptions.length > 1;
    if (currentQuestion.type === "fill_in_the_blank") {
      return !selected || selected.trim() === "";
    }
    if (currentQuestion.type === "true_false" || currentQuestion.type === "multiple_choice" || currentQuestion.type === "mcq") {
      return isMultiSelect ? !selected || selected.length === 0 : !selected;
    }
    if (currentQuestion.type === "complete_sentence") {
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
    if (currentQuestion.type === "arrange_order") {
      return !selected || selected.length === 0;
    }
    if (currentQuestion.type === "drag_drop") {
      const filledBlanks = selectedAnswers[currentQuestion.id] || {};
      return Object.keys(filledBlanks).length < currentQuestion.blanks.length;
    }
    if (currentQuestion.type === "realword") {
      return currentQuestion.words.some((_, index) => {
        const key = `${currentQuestion.id}_${index}`;
        return selectedAnswers[key] === undefined;
      });
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
      for (let i = 0; i < blankedWords?.length; i++) {
        const key = `${currentQuestion.id}_${i}`;
        if (!selectedAnswers[key]) {
          return true;
        }
      }
      return false;
    }
    if (currentQuestion.type === "summarizepassage") {
      return !selectedAnswers[currentQuestion.id] || selectedAnswers[currentQuestion.id].trim() === "";
    }
    if (currentQuestion.type === "speaking") {
      return !selectedAnswers[currentQuestion.id];
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
    audioEnded,
  }), [showQuestion, currentStampIndex, stamps.length, currentQuestionIndex, questionIds, selectedAnswers, audioEnded]);

  // Report stamp status to parent whenever it changes
  useEffect(() => {
    if (onStampStatusChange) {
      onStampStatusChange({
        showQuestion,
        isLastStamp,
        isNextDisabled: isNextButtonDisabled(),
        audioEnded,
      });
    }
  }, [showQuestion, currentStampIndex, stamps.length, currentQuestionIndex, questionIds, selectedAnswers, audioEnded]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Audio Player */}
      <div className="fixed bottom-[72px] bg-white border-t border-gray-200 md:border-none md:bg-none md:bottom-2 left-1/2 -translate-x-1/2 w-full md:w-[480px] lg:w-[700px] z-50 px-2 sm:px-4 md:px-0">
        <AudioPlayerForPause
          ref={audioPlayerRef}
          fileUrl={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          stamps={stamps}
          onStampReached={handleStampReached}
          autoPlay={true}
          fullWidth
          disabled={showQuestion}
        />
      </div>
      {/* Placeholder when no question */}
      {!showQuestion && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center min-h-[300px] sm:min-h-[400px]">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <FaHeadphones className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">Keep Listening!</h3>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            Next question appearing soon
          </p>
        </div>
      )}

      {/* Question Display */}
      {showQuestion && (
        <>
          {quizLoading ? (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gray-50 rounded-lg border border-blue-100">
              <p className="text-sm sm:text-base">Loading question...</p>
            </div>
          ) : isError ? (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm sm:text-base">Error loading quiz: {error?.message || 'Unknown error'}</p>
            </div>
          ) : currentQuestion ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-4 sm:mt-6 max-w-6xl mx-auto"
            >
              {!["drag_drop", "realword", "summarizepassage", "bestoption"].includes(currentQuestion.type) && <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-slate-800 break-words">
                  {currentQuestion.question_text ||
                    currentQuestion.arrangeorder_prompt ||
                    currentQuestion.prompt ||
                    currentQuestion.summarize_passage_text ||
                    "Question"}
                </h3>
              </div>}
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
                    {currentQuestion.QuizOptions?.map((option, index) => {
                      const isMultiSelect = (currentQuestion.QuizOptions?.filter((opt) => opt.is_correct) || []).length > 1;
                      const isSelected = Array.isArray(selectedAnswers[currentQuestion.id])
                        ? selectedAnswers[currentQuestion.id].includes(option.id)
                        : selectedAnswers[currentQuestion.id] === option.id;
                      return (
                        <div
                          key={index}
                          className={`p-3 sm:p-4 border rounded-xl cursor-pointer duration-300 ${isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-slate-200"
                            }`}
                          onClick={() => handleAnswerSelect(currentQuestion.id, option.id, isMultiSelect)}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full border mr-3 sm:mr-4 ${isSelected ? "border-blue-600 bg-blue-600 scale-110" : "border-slate-300"
                                }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className={`${isSelected ? "text-slate-900 font-medium" : "text-slate-700"} text-sm sm:text-base break-words`}>
                              {option.option_text}
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
                        className={`p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-300 transform hover:translate-x-1 ${selectedAnswers[currentQuestion.id] === option
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full border mr-3 sm:mr-4 transition-all duration-300 ${selectedAnswers[currentQuestion.id] === option
                              ? "border-blue-600 bg-blue-600 scale-110"
                              : "border-slate-300"
                              }`}
                          >
                            {selectedAnswers[currentQuestion.id] === option && (
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-scaleIn"></div>
                            )}
                          </div>
                          <span
                            className={`${selectedAnswers[currentQuestion.id] === option
                              ? "text-slate-900 font-medium"
                              : "text-slate-700"} text-sm sm:text-base`}
                          >
                            {option}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {currentQuestion.type === "realword" && (
                <div className="space-y-3 sm:space-y-4 mb-14">
                  <p className="text-slate-800 text-sm sm:text-base lg:text-lg font-semibold leading-relaxed">
                    Select the appropriate category for each item listed below.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {currentQuestion.words.map((word, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-slate-200 rounded-xl bg-white gap-3 sm:gap-4">
                        <span className="text-base sm:text-lg font-medium text-slate-800 break-words">{word}</span>
                        <div className="flex gap-2 sm:gap-2">
                          <button
                            onClick={() => handleAnswerSelect(currentQuestion.id, "yes", index)}
                            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border font-medium transition-all text-xs sm:text-sm ${selectedAnswers[`${currentQuestion.id}_${index}`] === "yes"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                          >
                            <span className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center ${selectedAnswers[`${currentQuestion.id}_${index}`] === "yes" ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                              }`}>
                              {selectedAnswers[`${currentQuestion.id}_${index}`] === "yes" && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />}
                            </span>
                            Correct
                          </button>
                          <button
                            onClick={() => handleAnswerSelect(currentQuestion.id, "no", index)}
                            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border font-medium transition-all text-xs sm:text-sm ${selectedAnswers[`${currentQuestion.id}_${index}`] === "no"
                              ? "bg-rose-50 border-rose-500 text-rose-700"
                              : "border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                          >
                            <span className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center ${selectedAnswers[`${currentQuestion.id}_${index}`] === "no" ? "border-rose-500 bg-rose-500" : "border-slate-300"
                              }`}>
                              {selectedAnswers[`${currentQuestion.id}_${index}`] === "no" ? <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" /> : null}
                            </span>
                            Fake
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {currentQuestion.type === "complete_sentence" && (
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
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-slate-800 text-sm sm:text-base lg:text-lg font-semibold leading-relaxed">
                    Select the best option for each missing word.
                  </p>
                  <BestOptionQuestion
                    question={currentQuestion}
                    handleAnswerSelect={handleAnswerSelect}
                    selectedAnswers={selectedAnswers}
                  />
                </div>
              )}
              {currentQuestion.type === "summarizepassage" && (
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-slate-700 mb-1 sm:mb-2 font-medium text-sm sm:text-base">
                    Write a summary for the given passage:
                  </p>
                  <div className="p-3 sm:p-4">
                    <p className="text-slate-800 text-base sm:text-lg font-medium whitespace-pre-line break-words">
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

              {currentQuestion.QuizOptions && !["fill_in_the_blank", "true_false", "multiple_choice", "realword", "complete_sentence", "arrange_order", "bestoption"].includes(currentQuestion.type) && (
                <div className="space-y-2 sm:space-y-3 max-w-2xl">
                  {currentQuestion.QuizOptions.map((option) => {
                    const isMultiSelect = (currentQuestion.QuizOptions?.filter((opt) => opt.is_correct) || []).length > 1;
                    const selected = Array.isArray(selectedAnswers[currentQuestion.id])
                      ? selectedAnswers[currentQuestion.id].includes(option.id)
                      : selectedAnswers[currentQuestion.id] === option.id;
                    return (
                      <div
                        key={option.id}
                        className={`p-3 sm:p-4 border rounded-xl cursor-pointer ${selected
                          ? "border-blue-500 bg-blue-50 "
                          : "border-slate-200 "
                          }`}
                        onClick={() => handleAnswerSelect(currentQuestion.id, option.id, isMultiSelect)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full border-2 mr-3 sm:mr-4 ${selected ? "border-blue-600 bg-white" : "border-slate-300 bg-white"
                              }`}
                          >
                            {selected && (
                              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <span className={`${selected ? "text-slate-900 font-medium" : "text-slate-700"} text-sm sm:text-base break-words`}>
                            {option.option_text}
                          </span>
                        </div>
                        {option.option_img && option.option_img.trim() !== "" && option.option_img !== "null" && (
                          <div className="ml-7 sm:ml-10 mt-2 sm:mt-3">
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
              {/* Continue button - now handled by bottom bar on all screen sizes */}
              <div className="hidden">
                <button
                  onClick={handleNext}
                  disabled={isNextButtonDisabled()}
                  className={`py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl transition-all duration-300 flex items-center text-sm sm:text-base ${isNextButtonDisabled()
                    ? "bg-blue-300 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:translate-x-1 shadow-md hover:shadow-lg"
                    }`}
                >
                  Continue
                  <FaArrowRight className="ml-2 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-sm sm:text-base">Question not found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
});
export default AudioPauseComponent;