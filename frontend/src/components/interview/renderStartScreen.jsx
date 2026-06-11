import {
  ClipboardList,
  TrendingUp,
  Target,
  CheckCircle,
  Lightbulb,
  ArrowLeft,
  PlayCircle,
  History,
  Calendar,
  ChevronRight,
  Settings,
  Mic,
  Award,
  Zap
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import InterviewPDFGenerator from "./InterviewPDFGenerator";

const scrollClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const RenderStartScreen = ({
  evaluationData,
  handleViewDetails,
  handleCloseDetails,
  selectedEvaluationId,
  navigate,
  setIsModalOpen,
  attemptsData,
  attemptsLoading,
  settingsData,
  refetch,
}) => {
  const [timer, setTimer] = useState("");
  const [isHistoryView, setIsHistoryView] = useState(!!selectedEvaluationId);
  const [viewMode, setViewMode] = useState("workspace"); // "workspace" or "journey"
  const journeyScrollRef = useRef(null);
  const workspaceScrollRef = useRef(null);

  useEffect(() => {
    if (selectedEvaluationId) {
      setIsHistoryView(true);
    }
  }, [selectedEvaluationId]);

  useEffect(() => {
    journeyScrollRef.current?.scrollTo({ top: 0 });
    workspaceScrollRef.current?.scrollTo({ top: 0 });
  }, [viewMode]);

  const dailyLimit = settingsData?.limit || settingsData?.data?.limit || 3;

  useEffect(() => {
    if (attemptsData?.count >= dailyLimit && attemptsData?.firstAttempt) {
      const calculate = () => {
        const first = new Date(attemptsData.firstAttempt);
        const now = new Date();
        const diff = 24 * 60 * 60 * 1000 - (now - first);
        if (diff > 0) {
          const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
          const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
          const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
          setTimer(`${hours}:${minutes}:${seconds}`);
        } else {
          setTimer('00:00:00');
        }
      };

      calculate();
      const interval = setInterval(calculate, 1000);
      return () => clearInterval(interval);
    }
  }, [attemptsData]);

  const selectedEvaluation = evaluationData?.interviewEvaluations?.find(
    (evalItem) => evalItem.id === selectedEvaluationId
  );
  const selectedEvaluationResult = selectedEvaluation
    ? evaluationData?.interviewEvaluationResults?.find(
      (resultItem) => resultItem.interviewEvaluationId === selectedEvaluationId
    )
    : null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-primary/5 text-primary';
    if (score >= 60) return 'bg-primary/5 text-primary/70';
    return 'bg-slate-50 text-slate-500';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return { text: `Score: ${score}`, color: 'bg-primary/10 text-primary' };
    if (score > 0) return { text: `Score: ${score}`, color: 'bg-primary/5 text-primary/80' };
    return { text: `Score: ${score}`, color: 'bg-slate-100 text-slate-500' };
  };

  const isLocked = attemptsData?.count >= dailyLimit;

  const isTabSwitchForcedZero = (selectedEvaluationResult) => {
    if (!selectedEvaluationResult) return false;
    const msg = (selectedEvaluationResult.overallAssessment || '').toLowerCase();
    return (
      selectedEvaluationResult.overallScore === 0 &&
      (msg.includes('tab') || msg.includes('switch') || msg.includes('moved to another tab'))
    );
  };

  const handleBackClick = () => {
    if (isHistoryView) {
      if (selectedEvaluationId) {
        handleCloseDetails();
      } else {
        setIsHistoryView(false);
      }
    } else {
      navigate("/");
    }
  };

  if (attemptsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-[10px] font-black text-primary animate-pulse tracking-widest uppercase">Initializing...</div>
      </div>
    );
  }

  // AI Text Formatter Component
  const FormattedAIContent = ({ text, type = "default" }) => {
    if (!text) return null;

    // Detect sections or bullet points from AI output
    // The user mentioned patterns like ** _ ** or bullets for readability
    const lines = text.split('\n').filter(line => line.trim() !== '');

    const colorClasses = {
      default: "text-slate-500",
      primary: "text-primary/90",
      tip: "text-amber-900/80",
      benchmark: "text-emerald-900/80"
    };

    return (
      <div className="space-y-4">
        {lines.map((line, idx) => {
          // Check for bullet patterns (*, -, or the user's mentioned ** _)
          const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('•') || line.trim().startsWith('** _');
          const cleanLine = isBullet
            ? line.trim().replace(/^[*•-]\s*/, '').replace(/^\*\*\s*_\s*/, '')
            : line.trim();

          return (
            <div key={idx} className={`${isBullet ? 'flex gap-3' : ''}`}>
              {isBullet && (
                <div className={`mt-2 w-1 h-1 rounded-full ${type === 'tip' ? 'bg-amber-800' : type === 'benchmark' ? 'bg-emerald-800' : 'bg-primary'} shrink-0 opacity-60`} />
              )}
              <p className={`text-sm leading-relaxed tracking-tight ${colorClasses[type]}`}>
                {cleanLine.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <span key={i} className="font-bold text-slate-700">
                        {part.slice(2, -2)}
                      </span>
                    );
                  }
                  return part;
                })}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  // Dual Pane History View Mode
  if (isHistoryView) {

    return (
      <div className={`h-screen bg-[#FDFDFF] flex flex-col overflow-hidden text-slate-900`}>
        {/* Navigation Bar */}
        <div className="h-16 border-b border-slate-100 bg-white flex items-center shrink-0 z-20">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              {/* <button
                onClick={handleBackClick}
                className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button> */}
              {/* <div className="h-6 w-[1px] bg-slate-200 hidden md:block" /> */}
              <div>
                <h1 className="text-[15px] font-bold tracking-tight text-slate-900 uppercase">Performance Portal</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">Interview Analytics</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex bg-slate-50 p-1 rounded-lg border border-slate-100 mr-2">
                <button
                  onClick={() => setViewMode("workspace")}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${viewMode === 'workspace' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Workspace
                </button>
                <button
                  onClick={() => setViewMode("journey")}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider ${viewMode === 'journey' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Journey
                </button>
              </div>
              <button
                onClick={handleBackClick}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white text-[11px] font-bold rounded-md shadow-sm uppercase tracking-widest"
              >
                <ArrowLeft className="w-4 h-4" />{selectedEvaluationId ? "Return to List" : "Back"}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Workspace Mode (Split View) */}
        {viewMode === "workspace" ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Sessions List */}
            <div className={`w-full md:w-[350px] bg-white border-r border-slate-100 flex flex-col shrink-0 ${selectedEvaluationId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-6 pb-2">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Historical Records</h2>
              </div>
              <div className={`flex-1 overflow-y-auto px-4 pb-6 space-y-2 ${scrollClass}`}>
                {evaluationData?.interviewEvaluations?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                    <History className="w-10 h-10 mb-4 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No history available</p>
                  </div>
                ) : (
                  [...evaluationData.interviewEvaluations].reverse().map((interview) => {
                    const matchingResult = evaluationData.interviewEvaluationResults?.find(r => r.interviewEvaluationId === interview.id);
                    const isSelected = interview.id === selectedEvaluationId;
                    const date = new Date(interview.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                    const time = new Date(interview.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

                    return (
                      <button
                        key={interview.id}
                        onClick={() => handleViewDetails(interview.id)}
                        className={`w-full text-left p-2 rounded-lg border transition-all duration-200 group relative overflow-hidden ${isSelected ? 'shadow-sm border-2 border-primary' : 'border-slate-100 hover:border-primary/30 hover:shadow-sm'}`}
                      >
                        <div className="flex justify-between items-start mb-2 relative z-10">
                          <h4 className={`text-[13px] font-bold leading-tight line-clamp-1 flex-1 text-slate-800`}>
                            {interview.role}
                          </h4>
                          {matchingResult && (
                            <span className={`text-[14px] font-black ml-2 text-primary`}>
                              {matchingResult.overallScore}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 relative z-10">
                          <span className={`text-[9px] font-bold uppercase tracking-wider text-slate-400`}>{date}</span>
                          <div className={`h-1 w-1 rounded-full bg-slate-200`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider text-slate-400`}>{time}</span>
                          <div className={`h-1 w-1 rounded-full bg-slate-200 hidden sm:block`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider text-slate-400`}>10 Questions</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Detail View */}
            <div
              ref={workspaceScrollRef}
              className={`flex-1 overflow-y-auto ${scrollClass} ${selectedEvaluationId ? 'block' : 'hidden md:block'}`}
            >
              {selectedEvaluation && selectedEvaluationResult ? (
                <div className="container mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* Security Violation Check */}
                  {isTabSwitchForcedZero(selectedEvaluationResult) ? (
                    <div className="p-8 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-rose-50 rounded-md flex items-center justify-center mb-6 text-rose-500">
                        <Zap className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Security Protocol Violation</h3>
                      <p className="text-sm text-slate-500 max-w-sm leading-relaxed font-bold uppercase tracking-wider text-[10px]">Evaluation Voided Due to Integrity Breach (Tab Switching Detected)</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary Header Card */}
                      <div className="overflow-hidden">
                        <div className="py-4 flex flex-col md:flex-row gap-8 items-start">
                          {/* <div className="relative group shrink-0"> */}
                          {/* <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all duration-500 opacity-60" /> */}
                          {/* <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white rounded-full border-[6px] border-[#F0FBF6] flex flex-col items-center justify-center shadow-lg">
                              <span className="text-2xl md:text-4xl font-black text-primary leading-none">{selectedEvaluationResult.overallScore}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global Score</span>
                            </div> */}
                          {/* </div> */}

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              <span className="text-[11px] font-black text-primary uppercase tracking-widest">Executive Summary</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Performance Intelligence</h2>
                              <div className="flex flex-col items-end gap-1">
                                {!isTabSwitchForcedZero(selectedEvaluationResult) && (
                                  <>
                                    <InterviewPDFGenerator
                                      evaluation={selectedEvaluationResult}
                                      role={selectedEvaluation.role}
                                      category={selectedEvaluation.category}
                                      date={new Date(selectedEvaluation.created_at).toLocaleDateString()}
                                      fullDateTime={new Date(selectedEvaluation.created_at).toLocaleString()}
                                      evaluation_result_id={selectedEvaluationResult.id}
                                      onDownloadSuccess={refetch}
                                    />
                                    {selectedEvaluationResult.downloaded_dates?.length > 0 && (
                                      <span className="text-[9px] font-bold text-slate-400 capitalize">
                                        Last Downloaded: {selectedEvaluationResult.downloaded_dates[selectedEvaluationResult.downloaded_dates.length - 1]}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            <FormattedAIContent text={selectedEvaluationResult.overallAssessment} type="default" />
                          </div>
                        </div>
                      </div>

                      {/* Question Feed */}
                      <div className="space-y-6">
                        <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] pt-2">Detailed Analysis</h3>
                        {selectedEvaluationResult.questionEvaluations.map((qEval, index) => (
                          <div key={index} className="bg-white rounded-lg border border-slate-100 shadow-sm">
                            <div className="p-6">
                              <div className="flex justify-between items-center mb-4 pb-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-[12px] font-bold text-slate-900">
                                    {index + 1}
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">{qEval.question}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F0FBF6] text-primary rounded-full text-[12px] font-black border border-primary/10">
                                  Score: {qEval.score || 0}%
                                </div>
                              </div>

                              {/* <h4 className="text-[16px] font-bold text-slate-900 mb-8 leading-snug">
                                {qEval.question}
                              </h4> */}

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* User Response */}
                                <div className="relative">
                                  <div className="absolute -top-5 left-4 px-2 bg-white text-[10px] font-black text-primary uppercase tracking-widest z-10">Your Delivery</div>
                                  <div className="h-full py-2 px-6 rounded-md bg-slate-50/50 border border-slate-100 text-slate-700 text-[14px] leading-relaxed">
                                    {qEval.userAnswer}
                                  </div>
                                </div>

                                {/* AI Benchmark */}
                                <div className="relative">
                                  <div className="absolute -top-5 left-4 px-2 bg-white text-[10px] font-black text-emerald-600 uppercase tracking-widest z-10">Strategic Benchmark</div>
                                  <div className="h-full py-2 px-6 rounded-md bg-emerald-50/20 border border-emerald-100/50 shadow-sm">
                                    <FormattedAIContent text={qEval.originalAnswer} type="benchmark" />
                                  </div>
                                </div>
                              </div>

                              {qEval.suggestedFeedback && (
                                <div className="mt-6 flex gap-4 p-5 bg-amber-50/30 rounded-xl border border-amber-100/50">
                                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                    <Lightbulb className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest my-1.5">Actionable Insight</p>
                                    <FormattedAIContent text={qEval.suggestedFeedback} type="tip" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="p-6 bg-white rounded-full border border-slate-100 shadow-sm animate-bounce-in">
                    <ClipboardList className="w-12 h-12 text-slate-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">Ready for insights</p>
                    <p className="text-sm font-bold text-slate-400">Select an interview session to begin analysis.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Journey Mode (Modern Narrative Feed) */
          <div
            ref={journeyScrollRef}
            className={`flex-1 bg-[#F9FAFB] overflow-y-auto p-4 md:p-8 ${scrollClass}`}
          >
            <div className="container mx-auto space-y-12 pb-20">
              {selectedEvaluation && selectedEvaluationResult ? (
                <>
                  {/* Security Violation Check (Journey Version) */}
                  {isTabSwitchForcedZero(selectedEvaluationResult) ? (
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 flex flex-col items-center text-center shadow-sm py-20">
                      <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center mb-8 text-rose-500 shadow-inner">
                        <Zap className="w-12 h-12 fill-rose-500/20" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">INTEGRITY ALERT</h3>
                      <p className="text-sm text-slate-400 max-w-md leading-relaxed font-bold uppercase tracking-widest">Multiple environmental shifts detected. This session report has been restricted for security compliance.</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-colors"
                      >
                        Return to Portal
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Hero Journey Header */}
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-black uppercase tracking-widest">
                          <Target className="w-4 h-4" /> Comprehensive Growth Report
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                          {selectedEvaluation.role}
                        </h1>
                        <div className="flex items-center justify-center gap-6 pt-4">
                          <div className="text-center">
                            <div className="text-2xl font-black text-primary">{selectedEvaluationResult.overallScore}%</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proficiency</div>
                          </div>
                          <div className="w-[1px] h-10 bg-slate-200" />
                          <div className="text-center">
                            <div className="text-2xl font-black text-slate-900">{selectedEvaluationResult.questionEvaluations.length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Situations</div>
                          </div>
                          <div className="w-[1px] h-10 bg-slate-200" />
                          <div className="text-center">
                            <div className="text-2xl font-black text-slate-900">
                              {new Date(selectedEvaluation.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Date</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2 pt-8">
                          {!isTabSwitchForcedZero(selectedEvaluationResult) && (
                            <>
                              <InterviewPDFGenerator
                                evaluation={selectedEvaluationResult}
                                role={selectedEvaluation.role}
                                category={selectedEvaluation.category}
                                date={new Date(selectedEvaluation.created_at).toLocaleDateString()}
                                fullDateTime={new Date(selectedEvaluation.created_at).toLocaleString()}
                                evaluation_result_id={selectedEvaluationResult.id}
                                onDownloadSuccess={refetch}
                              />
                              {selectedEvaluationResult.downloaded_dates?.length > 0 && (
                                <span className="text-[10px] font-bold text-slate-400 capitalize tracking-wider">
                                  Last Downloaded: {selectedEvaluationResult.downloaded_dates[selectedEvaluationResult.downloaded_dates.length - 1]}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Narrative Block */}
                      <div className="bg-white p-8 md:p-12 rounded-lg border border-slate-100 shadow-sm relative overflow-hidden">
                        {/* <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" /> */}
                        <div className="relative z-10">
                          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <TrendingUp className="w-6 h-6 text-primary" /> The Big Picture
                          </h2>
                          <div className="border-l-4 border-primary/20 pl-8">
                            <FormattedAIContent text={selectedEvaluationResult.overallAssessment} />
                          </div>
                        </div>
                      </div>

                      {/* Vertical Timeline Feed */}
                      <div className="space-y-16 pt-10">
                        {selectedEvaluationResult.questionEvaluations.map((qEval, index) => (
                          <div key={index} className="relative group">
                            {index !== selectedEvaluationResult.questionEvaluations.length - 1 && (
                              <div className="absolute left-[20px] top-10 bottom-[-64px] w-[2px] bg-slate-100 group-hover:bg-primary/20 transition-colors" />
                            )}
                            <div className="flex gap-8">
                              <div className="w-[42px] h-[42px] rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[14px] font-black text-slate-600 shrink-0 relative z-10 group-hover:border-primary group-hover:text-primary transition-all">
                                {index + 1}
                              </div>
                              <div className="flex-1 space-y-6">
                                <h4 className="text-xl font-bold text-slate-900 leading-tight">
                                  {qEval.question}
                                </h4>

                                <div className="grid md:grid-cols-2 gap-8">
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Response Artifact</label>
                                    <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-slate-50">
                                      {qEval.userAnswer}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Ideal Trajectory</label>
                                    <div className="text-sm text-slate-600 leading-relaxed">
                                      <FormattedAIContent text={qEval.originalAnswer} />
                                    </div>
                                  </div>
                                </div>

                                {qEval.suggestedFeedback && (
                                  <div className="p-6 rounded-lg border border-slate-200 flex gap-5 items-center bg-amber-50/50">
                                    {/* <div className="p-3 bg-white rounded-2xl shadow-sm">
                                      <Lightbulb className="w-6 h-6 text-amber-500" />
                                    </div> */}
                                    <div>
                                      <p className="text-sm font-black text-amber-700 uppercase tracking-widest mb-1">Growth Catalyst</p>
                                      <FormattedAIContent text={qEval.suggestedFeedback} type="tip" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-20 pb-10 text-center">
                        <button
                          onClick={() => journeyScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="p-4 bg-white rounded-full border border-slate-100 shadow-sm text-slate-400 hover:text-primary transition-colors"
                        >
                          <ArrowLeft className="w-6 h-6 rotate-90" />
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center">
                  <p className="text-slate-400 font-bold">Please select a session from the Workspace view first.</p>
                  <button onClick={() => setViewMode('workspace')} className="mt-4 text-primary font-black text-xs uppercase tracking-widest underline decoration-2 underline-offset-4">Go to Workspace</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard View
  return (
    <div className={`h-screen bg-white flex flex-col overflow-hidden text-slate-800 ${scrollClass}`}>
      {/* Header */}
      <div className="px-6 py-3 md:px-8 border-b border-slate-200 bg-white shrink-0">
        <div className="container mx-auto w-full flex justify-between items-center">
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 leading-none uppercase tracking-widest">Interview Coach</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-1">Interactive Preparation Hub</p>
          </div>
          <div className="flex gap-2">
            {evaluationData?.interviewEvaluations?.length > 0 && (
              <button
                onClick={() => setIsHistoryView(true)}
                className="flex items-center gap-1.5 text-primary text-[11px] font-black bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95"
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-slate-600 text-[11px] font-black bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto py-4 px-6 ${scrollClass}`}>
        <div className={`container mx-auto w-full ${isLocked ? 'h-full flex items-center justify-center' : 'flex flex-col gap-5'}`}>

          {isLocked ? (
            <div className="bg-white rounded-lg p-10 shadow-sm border border-slate-100 flex flex-col items-center max-w-md w-full mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-6">
                <Zap className="w-6 h-6 fill-primary/10" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">Daily Cap Reached</h2>
              <p className="text-[10px] text-slate-400 font-bold mb-8 uppercase tracking-widest leading-relaxed max-w-[280px]">
                You have maximized your preparation for today. The recharge cycle is active.
              </p>

              <div className="flex gap-4 mb-10">
                {(timer || "00:00:00").split(':').map((unit, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{unit}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                      {i === 0 ? 'Hrs' : i === 1 ? 'Min' : 'Sec'}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-primary text-white rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return Home</span>
              </button>
            </div>
          ) : (
            <>
              {/* Top Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 shrink-0">
                <div className="md:col-span-8 bg-primary rounded-lg p-6 lg:p-7 flex flex-col justify-center text-white shadow-lg shadow-primary/10 relative overflow-hidden group">
                  <div className="relative z-10">
                    <h2 className="text-2xl lg:text-3xl font-black tracking-tight mb-2">Master your next<br />big interview.</h2>
                    <p className="text-white/80 text-sm font-bold leading-relaxed mb-6 max-w-sm">
                      Custom tailored mock sessions with real-time feedback and expert analysis.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-white text-primary px-4 py-2 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-md"
                    >
                      <PlayCircle className="w-4 h-4" /> Start Practice
                    </button>
                  </div>
                  <ClipboardList className="absolute right-6 bottom-4 w-28 h-28 text-white/70 -rotate-12 hidden lg:block" />
                </div>

                <div className="md:col-span-4 bg-white rounded-lg p-5 flex flex-col justify-between border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-colors" />

                  <div className="relative z-10 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Daily Resources</p>

                    <div className="mb-4">
                      {dailyLimit <= 10 ? (
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          {[...Array(dailyLimit)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-6 h-1.5 rounded-full transition-all duration-300 ${i < dailyLimit - (attemptsData?.count || 0)
                                ? 'bg-primary shadow-[0_0_8px_rgba(0,187,110,0.4)]'
                                : 'bg-slate-100'
                                }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="px-4">
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                            <div
                              className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,187,110,0.3)]"
                              style={{
                                width: `${Math.max(0, Math.min(100, (1 - (attemptsData?.count || 0) / dailyLimit) * 100))}%`
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-1.5 px-0.5">
                            <span className="text-[9px] font-bold text-slate-400">{dailyLimit - (attemptsData?.count || 0)} Remaining</span>
                            <span className="text-[9px] font-bold text-slate-400">Total {dailyLimit}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-3xl font-black text-black leading-none">{attemptsData?.count || 0}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Used Today</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 relative z-10">
                    <div className="flex items-center gap-2 text-primary/80">
                      <Zap className="w-3 h-3 fill-primary/20" />
                      <p className="text-[9px] font-bold uppercase tracking-tight italic">Recommended: Up to {dailyLimit} {dailyLimit === 1 ? 'Session' : 'Sessions'} / Day</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

                <div className="md:col-span-4 flex flex-col gap-5">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-2">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Coaching Tip</span>
                    </div>
                    <p className="text-blue-800/80 text-[11px] font-bold leading-relaxed">
                      Use the STAR method (Situation, Task, Action, Result) for behavioral questions to provide structured, high-impact answers.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-lg p-5 shadow-sm flex-1">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Common Scenarios</p>
                    <div className="space-y-3">
                      {[
                        "The Self Introduction",
                        "Navigating Conflicts",
                        "Strengths & Potential",
                        "Career Motivations"
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-default group">
                          <div className="w-2 h-2 bg-primary/30 rounded-full" />
                          <span className="text-xs font-bold text-slate-700 leading-none">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-8 bg-white border border-slate-100 rounded-lg p-6 lg:p-8 shadow-sm flex flex-col justify-between">
                  <div className="mb-8 text-center lg:text-left">
                    <h3 className="text-lg font-bold text-slate-900 leading-none mb-1.5">How It Works</h3>
                    <p className="text-xs text-slate-500 font-bold tracking-tight">Master your next interview in three easy steps.</p>
                  </div>

                  <div className="flex-1 flex flex-col lg:flex-row gap-8 relative items-center pt-2">
                    <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] border-t-2 border-dashed border-slate-300 pointer-events-none" />

                    {[
                      {
                        num: "01",
                        icon: <Settings className="w-4 h-4" />,
                        title: "Configure",
                        desc: "Personalize your target role.",
                        details: ["Industry selection", "Role definition"]
                      },
                      {
                        num: "02",
                        icon: <Mic className="w-4 h-4" />,
                        title: "Practice",
                        desc: "Engage in AI-powered interaction.",
                        details: ["Voice recording", "Real-time prompts"]
                      },
                      {
                        num: "03",
                        icon: <Award className="w-4 h-4" />,
                        title: "Refine",
                        desc: "Get deep performance insights.",
                        details: ["Instant grading", "Expert feedback"]
                      }
                    ].map((step, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center text-center gap-4 lg:gap-5 relative z-10 group">
                        <div className="relative">
                          <div className="w-12 h-12 bg-white border-2 border-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-xs shadow-sm shadow-primary/5 transition-all group-hover:scale-110">
                            {step.icon}
                          </div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">
                            {step.num}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-extrabold text-primary uppercase tracking-widest">{step.title}</p>
                          <p className="text-[12px] text-slate-500 font-bold leading-tight mb-2 max-w-[150px]">{step.desc}</p>
                          <div className="hidden lg:flex flex-col items-center gap-1.5 pt-1">
                            {step.details.map((detail, dIdx) => (
                              <div key={dIdx} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                                <div className="w-1 h-1 bg-primary/30 rounded-full" />
                                {detail}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenderStartScreen;