import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  Sparkles,
  CheckCircle2,
  User,
  Lightbulb,
  AlertCircle
} from "lucide-react";
import InterviewPDFGenerator from "./InterviewPDFGenerator";

const scrollClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const renderEvaluationScreen = ({ evaluation, navigate, resetState, forcedZeroByTabSwitch, role, category, evaluation_result_id, onDownloadSuccess }) => {
  const parseFormatting = (text, isMetaAnalysis = false) => {
    if (!text) return null;

    const lines = text.split('\n');
    const parsed = [];
    let currentList = [];

    const processText = (str) => {
      const parts = str.split(/(\*\*.*?\*\*|__.*?__)/g);
      return parts.map((part, i) => {
        if ((part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
          (part.startsWith('__') && part.endsWith('__') && part.length >= 4)) {
          return <strong key={i} className={isMetaAnalysis ? "font-bold text-slate-900" : "font-bold text-slate-800"}>{part.substring(2, part.length - 2)}</strong>;
        }
        return part.replace(/\*\*/g, '').replace(/__/g, '').replace(/~~/g, '');
      });
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      if (/^[-_*~]+$/.test(line)) {
        line = '';
      }

      if (!line) {
        if (currentList.length > 0) {
          parsed.push(<div key={`ul-${i}`} className="space-y-3 mb-4 mt-2">{currentList}</div>);
          currentList = [];
        }
        continue;
      }

      const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
      if (headerMatch) {
        if (currentList.length > 0) {
          parsed.push(<div key={`ul-${i}`} className="space-y-3 mb-4 mt-2">{currentList}</div>);
          currentList = [];
        }
        parsed.push(<h4 key={`h-${i}`} className="text-slate-900 font-extrabold mt-4 mb-2 text-[14px] uppercase tracking-wide">{processText(headerMatch[2])}</h4>);
        continue;
      }

      const boldHeaderMatch = line.match(/^(?:\*\*|__)(.+?)(?:\*\*|__):?$/);
      if (boldHeaderMatch) {
        if (currentList.length > 0) {
          parsed.push(<div key={`ul-${i}`} className="space-y-3 mb-4 mt-2">{currentList}</div>);
          currentList = [];
        }
        const label = boldHeaderMatch[1].trim();
        parsed.push(<h4 key={`bh-${i}`} className="text-slate-900 font-bold mt-5 mb-3 text-[14px]">{processText(label)}</h4>);
        continue;
      }

      const bulletMatch = line.match(/^(\*|-|\d+\.)\s+(.*)/);
      if (bulletMatch) {
        currentList.push(
          <div key={`li-${i}`} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 bg-[#00BB6E] text-white rounded-full w-4 h-4 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <div className={isMetaAnalysis ? "text-slate-700 text-[13px] leading-relaxed" : "text-slate-600 text-[13px] leading-relaxed"}>
              {processText(bulletMatch[2])}
            </div>
          </div>
        );
        continue;
      }

      if (currentList.length > 0) {
        parsed.push(<div key={`ul-${i}`} className="space-y-3 mb-4 mt-2">{currentList}</div>);
        currentList = [];
      }

      parsed.push(<p key={`p-${i}`} className={`mb-3 last:mb-0 ${isMetaAnalysis ? 'text-slate-700 text-[13px] leading-relaxed' : 'text-slate-600 text-[13px] leading-relaxed'}`}>{processText(line)}</p>);
    }

    if (currentList.length > 0) {
      parsed.push(<div key={`ul-end`} className="space-y-3 mt-2">{currentList}</div>);
    }

    return parsed;
  };

  const overallScore = Math.ceil(evaluation.overallScore);

  return (
    <div className={`h-screen bg-white flex flex-col overflow-y-auto ${scrollClass}`}>
      {/* Top Bar */}
      <header className="w-full border-b border-slate-200/50 shrink-0">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center max-w-6xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#00BB6E] rounded-md flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-[#00BB6E] tracking-tight">Interview Evaluation</span>
          </div>
          <div className="flex items-center gap-4">
            {!forcedZeroByTabSwitch && (
              <div className="flex flex-col items-end gap-1">
                <InterviewPDFGenerator
                  evaluation={evaluation}
                  role={role || "Interview"}
                  category={category || "Mock Session"}
                  date={new Date().toLocaleDateString()}
                  fullDateTime={new Date().toLocaleString()}
                  evaluation_result_id={evaluation_result_id}
                  onDownloadSuccess={onDownloadSuccess}
                />
                {evaluation.downloaded_dates?.length > 0 && (
                  <span className="text-[9px] font-bold text-slate-400 capitalize">
                    Last Downloaded: {evaluation.downloaded_dates[evaluation.downloaded_dates.length - 1]}
                  </span>
                )}
              </div>
            )}
            <button
              onClick={resetState}
              className="text-[#00BB6E] hover:opacity-80 flex items-center gap-2 text-sm font-bold transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">

        {/* Tab Switch Warning */}
        {forcedZeroByTabSwitch && (
          <div className="mb-8 bg-white border border-rose-200 p-6 rounded-xl flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">Academic Integrity Notice: Session invalidated due to background activity detection.</p>
          </div>
        )}

        {/* Hero Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Executive Evaluation</h1>
            <p className="text-slate-500 text-[13px] font-medium">Detailed assessment of your leadership interview performance.</p>
          </div>
          <div className="shrink-0 flex flex-col items-center justify-center">
            <div
              className="relative w-20 h-20 flex items-center justify-center rounded-full"
              style={{ background: `conic-gradient(#00BB6E ${overallScore}%, #f1f5f9 0)` }}
            >
              <div className="absolute inset-0 m-[6px] bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 leading-none">{overallScore}</span>
                <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meta Analysis */}
        <div className="bg-[#00BB6E]/5 rounded-xl p-8 md:p-10 mb-12 border border-[#00BB6E]/10">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5 text-[#00BB6E]" />
                <h3 className="font-extrabold text-slate-900 text-[16px]">Performance Meta-Analysis</h3>
              </div>
              <div className="text-[13px] text-slate-700 font-medium">
                {parseFormatting(evaluation.overallAssessment, true)}
              </div>
            </div>

            {/* Note / Dynamic Block */}
            <div className="bg-white rounded-xl p-6 border border-[#00BB6E]/10 h-max shadow-sm">
              <span className="text-[9px] font-bold tracking-widest uppercase text-[#00BB6E] block mb-3">Goal Focus</span>
              <p className="text-[13px] text-slate-700 font-medium leading-relaxed">
                Apply the specific structural strategies outlined in your question breakdown to project confidence and articulate deep tactical insight in future rounds.
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown Header */}
        {!forcedZeroByTabSwitch && (
          <>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Question Breakdown</h2>

            <div className="space-y-8 mb-12">
              {evaluation.questionEvaluations.map((qEval, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  {/* Card Head */}
                  <div className="p-8 md:p-10">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase mb-3 block">Question {index + 1}</span>
                    <h3 className="text-lg font-bold text-slate-900 mb-8 leading-relaxed">"{qEval.question}"</h3>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* User Response */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Your Response</span>
                        </div>
                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg text-[13px] text-slate-600 font-medium leading-relaxed grow">
                          {qEval.userAnswer}
                        </div>
                      </div>

                      {/* Model Answer */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                          <CheckCircle2 className="w-4 h-4 text-[#00BB6E]" />
                          <span className="text-[10px] font-extrabold text-[#00BB6E] tracking-widest uppercase">Model Answer</span>
                        </div>
                        <div className="p-5 bg-[#00BB6E]/5 border border-[#00BB6E]/10 rounded-lg text-[13px] text-slate-700 font-medium leading-relaxed grow">
                          {qEval.originalAnswer}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Section */}
                  {(qEval.feedback || qEval.suggestedImprovement) && (
                    <div className="bg-[#00BB6E]/[0.03] p-8 md:px-10 md:py-8 border-t border-[#00BB6E]/10 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-[#00BB6E]" />
                        <span className="text-[10px] font-extrabold text-[#00BB6E] tracking-widest uppercase">Coach Strategy & Tips</span>
                      </div>
                      <div className="text-[13px] text-slate-600 italic leading-relaxed pl-6">
                        {parseFormatting(qEval.feedback + "\n\n" + qEval.suggestedImprovement)}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default renderEvaluationScreen;