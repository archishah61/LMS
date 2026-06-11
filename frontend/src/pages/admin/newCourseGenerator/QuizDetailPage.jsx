import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Timer,
  Target,
  FileQuestion,
  Award,
  ListTree
} from "lucide-react";

// ─── Collapsible Section ─────────────────────────────────────────────────────

const Section = ({ title, defaultOpen = true, count, children, rightContent }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-amber-100 dark:border-amber-900/30 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-amber-900 dark:text-amber-100 tracking-wide">
            {title}
            {count != null && (
              <span className="ml-2 text-[12px] font-normal text-amber-600 dark:text-amber-400">
                ({count})
              </span>
            )}
          </span>
          {rightContent}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="px-5 py-4 bg-white dark:bg-gray-950 border-t border-amber-100 dark:border-amber-900/30">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Question Renderer ────────────────────────────────────────────────────────

const QuestionCard = ({ question, index }) => {
  let derivedAnswer = question.answer;
  if (!derivedAnswer) {
    if (question.options && Array.isArray(question.options)) {
      const correctOptions = question.options.filter(opt => typeof opt === "object" && opt !== null && opt.isCorrect);
      if (correctOptions.length > 0) derivedAnswer = correctOptions;
    } else if (question.correctWord) {
      derivedAnswer = question.correctWord;
    } else if (question.blanks && Array.isArray(question.blanks)) {
      derivedAnswer = question.blanks.map((b, i) => `Blank ${i + 1}: ${b.correctAnswer}`);
    } else if (question.correctAnswers && question.words) {
      derivedAnswer = question.words.map((w, i) => `${w} - ${question.correctAnswers[i] ? 'True' : 'False'}`);
    } else if (question.expectedSummary) {
      derivedAnswer = question.expectedSummary;
    } else if (question.blankedWords && Array.isArray(question.blankedWords)) {
      derivedAnswer = question.blankedWords.map((b, i) => `Blank ${i + 1}: ${b.correct}`);
    } else if (question.correctOrder && question.sentences) {
      derivedAnswer = question.correctOrder.map(idx => question.sentences[idx]);
    } else if (question.script) {
      derivedAnswer = question.script;
    }
  }

  // Utility for parsing options or answers that might be arrays
  const renderList = (items, isOptions = false) => {
    if (!items || !Array.isArray(items) || items.length === 0) return null;
    return (
      <ul className="list-none space-y-1.5 mt-2">
        {items.map((item, i) => {
          const content = typeof item === "object" && item !== null ? item.text || item.value || JSON.stringify(item) : item;

          let isCorrect = false;
          if (isOptions) {
            if (typeof item === "object" && item !== null && item.isCorrect) {
              isCorrect = true;
            } else if (derivedAnswer) {
              if (Array.isArray(derivedAnswer)) {
                isCorrect = derivedAnswer.some(ans => {
                  const ansContent = typeof ans === "object" && ans !== null ? ans.text || ans.value : ans;
                  return ansContent === content;
                });
              } else {
                const ansContent = typeof derivedAnswer === "object" && derivedAnswer !== null ? derivedAnswer.text || derivedAnswer.value : derivedAnswer;
                isCorrect = ansContent === content;
              }
            }
          }

          if (!isOptions) {
            return (
              <li key={i} className="text-[13px] text-gray-700 dark:text-gray-300 list-disc ml-5">
                {content}
              </li>
            );
          }

          return (
            <li key={i} className={`flex items-start gap-2 text-[13px] ${isCorrect ? 'text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1.5 rounded border border-emerald-100 dark:border-emerald-900/30 -ml-2' : 'text-gray-700 dark:text-gray-300 py-1.5'}`}>
              <div className="mt-0.5 flex-shrink-0">
                {isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 ml-1.5 mt-1" />
                )}
              </div>
              <span className="leading-relaxed">{content}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderAnswer = (answer) => {
    if (Array.isArray(answer)) {
      return renderList(answer, false);
    }
    const content = typeof answer === "object" && answer !== null ? answer.text || answer.value || JSON.stringify(answer) : answer;
    return (
      <p className="text-[13px] text-gray-800 dark:text-gray-200 mt-1 font-medium">
        {content}
      </p>
    );
  };

  return (
    <div className="flex flex-col space-y-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[12px] font-bold">
            {index + 1}
          </span>
          <div className="space-y-1">
            <h4 className="text-[14px] font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
              {question.questionText || question.prompt || question.passage || "Question"}
            </h4>
            {question.difficulty && (
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-sm">
                {question.difficulty}
              </span>
            )}
          </div>
        </div>
        <span className="flex-shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
          {question.type.replace(/_/g, " ")}
        </span>
      </div>

      <div className="pl-10 space-y-3">
        {/* Video / Audio Pause Description */}
        {(question.videoDescription || question.audioDescription || question.imageDescription || question.videotoscript_script || question.audiotoscript_script) && (
          <div className="bg-amber-50/30 dark:bg-amber-900/5 shadow-sm p-3.5 rounded-xl border border-amber-100/50 dark:border-amber-900/20">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-2 px-1">
              {question.type === "video_pause" ? "Video Timeline & Script" : (question.type === "image_to_script" || question.type === "imagetoscript") ? "Image Description & Script" : "Audio Timeline & Script"}
            </span>
            <div className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed pl-3 border-l-2 border-amber-400/50 italic bg-white/50 dark:bg-gray-800/50 p-2.5 rounded-r-lg">
              {question.videoDescription || question.audioDescription || question.imageDescription || question.videotoscript_script || question.audiotoscript_script}
            </div>
            {((question.stamps && question.stamps.length > 0) || (question.video_pause_stamps && question.video_pause_stamps.length > 0) || (question.audio_pause_stamps && question.audio_pause_stamps.length > 0)) && (
              <div className="flex items-center gap-2 mt-3 pl-1">
                <Timer className="w-4 h-4 text-amber-600 dark:text-amber-500"/>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full shadow-sm">
                  PAUSE & ASK AT: {
                    (question.stamps || question.video_pause_stamps || question.audio_pause_stamps).map(s => {
                      if (typeof s === "number") {
                        const mins = Math.floor(s / 60);
                        const secs = (s % 60).toString().padStart(2, '0');
                        return `${mins}:${secs}`;
                      }
                      return s;
                    }).join(", ")
                  }
                </span>
              </div>
            )}
          </div>
        )}

        {/* MCQ / Multi Select Options */}
        {question.options && question.options.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Options
            </span>
            {renderList(question.options, true)}
          </div>
        )}

        {/* Best Option / Fill in the Blanks with Options */}
        {question.blankedWords && question.blankedWords.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md space-y-3">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Blank Options
            </span>
            <div className="space-y-3">
              {question.blankedWords.map((bw, idx) => (
                <div key={idx} className="space-y-1.5 pb-2 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                  <span className="text-[12px] font-medium text-gray-600 dark:text-gray-400">
                    Blank {idx + 1} Options:
                  </span>
                  <ul className="flex flex-wrap gap-2">
                    {bw.options?.map((opt, optIdx) => {
                      const isCorrect = opt === bw.correct;
                      return (
                        <li key={optIdx} className={`px-2.5 py-1 text-[12px] rounded-md border ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-medium' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'}`}>
                          {opt}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Answers */}
        {question.type !== "bestoption" && derivedAnswer && (
          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-md border border-emerald-100 dark:border-emerald-900/30">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
              Correct Answer(s)
            </span>
            {renderAnswer(derivedAnswer)}
          </div>
        )}

        {/* Explanation */}
        {question.explanation && (
          <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-900/30">
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
              Explanation
            </span>
            <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed mt-1">
              {question.explanation}
            </p>
          </div>
        )}

        {/* Multiple Pause Point Questions */}
        {question.pauses && Array.isArray(question.pauses) && question.pauses.length > 0 && (
          <div className="space-y-6">
            {question.pauses.map((pause, pIdx) => (
              <div key={pIdx} className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1" />
                  <span className="text-[10px] font-extrabold text-amber-600/60 dark:text-amber-500/60 uppercase tracking-[0.2em] whitespace-nowrap bg-amber-50/50 dark:bg-amber-900/10 px-3 py-1 rounded-full border border-amber-100/30 dark:border-amber-900/20">
                    PAUSE POINT {pIdx + 1} ({
                      typeof pause.timestamp === 'number'
                        ? `${Math.floor(pause.timestamp / 60)}:${(pause.timestamp % 60).toString().padStart(2, '0')}`
                        : pause.timestamp
                    })
                  </span>
                  <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1 border-dashed" />
                </div>
                <div>
                  <QuestionCard question={pause.question} index={index} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fallback Inner question for Single Pause (Legacy or old AI format) */}
        {!question.pauses && question.question && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-center gap-3 mb-4">
               <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1" />
               <span className="text-[10px] font-extrabold text-amber-600/60 dark:text-amber-500/60 uppercase tracking-[0.2em] whitespace-nowrap bg-amber-50/50 dark:bg-amber-900/10 px-3 py-1 rounded-full border border-amber-100/30 dark:border-amber-900/20">
                 PAUSE POINT QUESTION
               </span>
               <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1 border-dashed" />
             </div>
             <div>
               <QuestionCard question={question.question} index={index} />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

function QuizDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quiz } = location.state || {};

  console.log("quiz", quiz)

  // ── Empty state ──────────────────────────────────────────────────────
  if (!quiz) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-5 max-w-sm">
          <FileQuestion className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
              No quiz selected
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Go back and select a quiz from the generated course structure.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const hasQuestions = quiz.questions && quiz.questions.length > 0;

  // Group questions by type for better visualization
  const groupedQuestions = hasQuestions
    ? quiz.questions.reduce((acc, q) => {
      const t = q.type || "other";
      if (!acc[t]) acc[t] = [];
      acc[t].push(q);
      return acc;
    }, {})
    : {};

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
              {quiz.quizTitle || "Module Quiz"}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded-md">
              <Target className="w-3.5 h-3.5" />
              {quiz.passingMarks || 60}% to pass
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded-md">
              <Award className="w-3.5 h-3.5" />
              {quiz.maxAttempts || 3} Attempts
            </span>
            <span className="flex items-center gap-1 text-[12px] font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/40">
              <Clock className="w-3.5 h-3.5" />
              {quiz.durationMinutes || 15} min
            </span>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <h3 className="text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Questions</h3>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{hasQuestions ? quiz.questions.length : 0}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <h3 className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">Passing Score</h3>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{quiz.passingMarks || 60}%</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
            <h3 className="text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">Time Limit</h3>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{quiz.durationMinutes || 15}m</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <h3 className="text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">Question Types</h3>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{hasQuestions ? Object.keys(groupedQuestions).length : 0}</p>
          </div>
        </div>

        {/* Questions Display */}
        {hasQuestions ? (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
              Quiz Questions
            </h2>

            {/* Render Grouped by Types for Better Organization */}
            <div className="space-y-5">
              {Object.entries(groupedQuestions).map(([type, typeQuestions], idx) => (
                <Section
                  key={idx}
                  title={type.replace(/_/g, " ").toUpperCase()}
                  count={typeQuestions.length}
                  defaultOpen={true}
                >
                  <div className="space-y-4">
                    {typeQuestions.map((q, qIdx) => (
                      <QuestionCard key={qIdx} question={q} index={quiz.questions.indexOf(q)} />
                    ))}
                  </div>
                </Section>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <ListTree className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-600 dark:text-gray-400">
              No questions found for this quiz.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              The AI might not have generated any questions, or this module doesn't include a detailed quiz yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default QuizDetailPage;
