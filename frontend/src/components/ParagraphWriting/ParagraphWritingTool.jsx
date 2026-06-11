import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    useGenerateParagraphMutation,
    useAnalyzePerformanceMutation,
    useSaveParagraphPracticeMutation,
    useGetParagraphHistoryQuery
} from '../../services/Ai/paragraphApi';
import { getStudentToken } from '../../services/CookieService';
import PrimaryLoader from '../ui/PrimaryLoader';
import { toast } from 'react-hot-toast';
import {
    Trophy, RotateCcw, Zap, Target, Keyboard, BarChart3,
    ChevronRight, Sparkles, AlertCircle, Clock, CheckCircle2, BrainCircuit, Award, Activity, ArrowRight,
    History, X, Star,
    Trash2
} from 'lucide-react';
import { useGetFeatureStatusByNameQuery } from "../../services/Masters/featureStatusAPI";
import ComingSoonModal from "../modal/ComingSoonModal";
import DefaultSEOMeta from '../../context/DefaultSEOMeta';


/* ─────────────────────────────────────────
   SPINNER COMPONENT
───────────────────────────────────────── */
const Spinner = ({ size = 14, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`animate-spin ${className}`}
    >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

/* ─────────────────────────────────────────
   SPACEBAR HINT COMPONENT
───────────────────────────────────────── */
const SpacebarHint = ({ visible }) => (
    <>
        <style>{`
            @keyframes spaceFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
            }
            @keyframes spacePulseRing {
                0% { box-shadow: 0 0 0 0 rgba(0,187,110,0.35); }
                70% { box-shadow: 0 0 0 10px rgba(0,187,110,0); }
                100% { box-shadow: 0 0 0 0 rgba(0,187,110,0); }
            }
            @keyframes spaceKeyPress {
                0%, 100% { transform: translateY(0); box-shadow: 0 4px 0 #009D5C, 0 6px 14px rgba(0,187,110,0.25); }
                50% { transform: translateY(2px); box-shadow: 0 2px 0 #009D5C, 0 2px 6px rgba(0,187,110,0.15); }
            }
            @keyframes spaceHintFadeIn {
                0% { opacity: 0; transform: translateY(10px) scale(0.96); }
                100% { opacity: 1; transform: translateY(0px) scale(1); }
            }
            @keyframes spaceHintFadeOut {
                0% { opacity: 1; transform: translateY(0px) scale(1); }
                100% { opacity: 0; transform: translateY(6px) scale(0.97); }
            }
            .space-hint-visible {
                animation: spaceHintFadeIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .space-hint-hidden {
                animation: spaceHintFadeOut 0.18s ease-in forwards;
            }
            .space-key-bounce {
                animation: spaceKeyPress 1.1s ease-in-out infinite, spaceFloat 2s ease-in-out infinite;
            }
            .space-ring-pulse {
                animation: spacePulseRing 1.4s ease-out infinite;
            }
        `}</style>

        <div className={`flex flex-col items-center gap-3 ${visible ? 'space-hint-visible' : 'space-hint-hidden pointer-events-none'}`}>
            {/* Label with dots */}
            <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-extrabold text-forestGreen uppercase tracking-[0.2em]">
                    Press Space to continue
                </span>
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
            </div>

            {/* The key itself */}
            <div
                className="space-ring-pulse rounded-xl inline-block"
                style={{ borderRadius: 10 }}
            >
                <div
                    className="space-key-bounce relative flex items-center justify-center bg-white border-2 border-primary rounded-xl select-none overflow-hidden"
                    style={{
                        paddingLeft: 40,
                        paddingRight: 40,
                        paddingTop: 10,
                        paddingBottom: 10,
                        minWidth: 150,
                        boxShadow: '0 4px 0 #009D5C, 0 6px 14px rgba(0,187,110,0.25)',
                    }}
                >
                    {/* Shine strip */}
                    <div
                        className="absolute top-1.5 left-4 right-4 h-px rounded-full opacity-50"
                        style={{ background: 'linear-gradient(90deg, transparent, #00BB6E, transparent)' }}
                    />
                    <span className="text-forestGreen font-black text-[11px] tracking-[0.25em] uppercase">
                        Space
                    </span>
                </div>
            </div>
        </div>
    </>
);

// Removed local history helpers for backend integration


/* ─────────────────────────────────────────
   DIFFICULTY CONFIG
───────────────────────────────────────── */
const DIFFICULTIES = [
    {
        id: 'basic',
        label: 'Beginner',
        range: '20–30 words',
        desc: 'Simple vocabulary. Perfect for building rhythm and warm-up.',
        Icon: Zap,
        accentClass: 'text-emerald-600',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        dotColor: '#10b981',
    },
    {
        id: 'intermediate',
        label: 'Professional',
        range: '60–70 words',
        desc: 'Complex sentence structures. Challenge your speed and pacing.',
        Icon: Target,
        accentClass: 'text-blue-600',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200',
        dotColor: '#3b82f6',
    },
    {
        id: 'difficult',
        label: 'Expert',
        range: '100+ words',
        desc: 'Abstract topics and advanced phrasing. Elite endurance test.',
        Icon: Trophy,
        accentClass: 'text-violet-600',
        bgClass: 'bg-violet-50',
        borderClass: 'border-violet-200',
        dotColor: '#7c3aed',
    },
];

const HistoryDrawer = ({ onClose, history = [] }) => {
    const diffDot = { basic: '#10b981', intermediate: '#3b82f6', difficult: '#7c3aed' };

    return (
        <>
            <style>{`
                @keyframes sidebarSlideIn {
                    from { transform: translateX(100%); opacity: 0.6; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                .history-sidebar {
                    animation: sidebarSlideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
            `}</style>
            {/* Backdrop */}

            <div
                className="fixed inset-0 z-50"
                style={{ background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(3px)' }}
                onClick={onClose}
            />

            {/* Sidebar panel */}
            <div
                className="history-sidebar fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col"
                style={{ width: '100%', maxWidth: 420 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-forestGreen/10 flex items-center justify-center">
                            <History size={17} className="text-forestGreen" />
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 text-base block leading-tight">Session History</span>
                            <span className="text-[11px] text-gray-400 font-medium">{history.length} session{history.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Clear All removed for backend integration - can be added later if needed */}

                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                            <X size={17} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Session list */}
                <div className="overflow-y-auto flex-1 px-4 py-4 space-y-2">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                <Clock size={28} className="text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-400 font-semibold">No sessions yet.</p>
                            <p className="text-xs text-gray-300 mt-1.5">Complete a session to see your history here.</p>
                        </div>
                    ) : history.map((item, i) => (
                        <div
                            key={i}
                            className="group relative flex items-start gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all"
                        >
                            {/* Difficulty dot */}
                            <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                                style={{ background: diffDot[item.difficulty] || '#6b7280' }}
                            />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: diffDot[item.difficulty] }}>
                                        {item.difficulty}
                                    </span>
                                    <span className="text-gray-300 text-xs">·</span>
                                    <span className="text-[10px] text-gray-400">
                                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium leading-snug line-clamp-2">{item.paragraph}</p>

                                {/* Stats grid */}
                                <div className="grid grid-cols-3 gap-x-3 gap-y-2.5 mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex flex-col items-center bg-forestGreen/5 rounded-xl py-2 px-1">
                                        <div className="text-sm font-black text-forestGreen font-mono">{Math.round(item.wpm)}</div>
                                        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">WPM</div>
                                    </div>
                                    <div className="flex flex-col items-center bg-blue-50 rounded-xl py-2 px-1">
                                        <div className="text-sm font-black text-blue-500 font-mono">{parseFloat(item.accuracy).toFixed(1)}%</div>
                                        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Accuracy</div>
                                    </div>
                                    <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2 px-1">
                                        <div className="text-sm font-black text-gray-600 font-mono">{parseFloat(item.time_taken).toFixed(1)}s</div>
                                        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Time</div>
                                    </div>
                                    <div className="flex flex-col items-center bg-red-50 rounded-xl py-2 px-1">
                                        <div className="text-sm font-black text-red-500 font-mono">{item.wrong_words ?? 0}</div>
                                        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Errors</div>
                                    </div>
                                    <div className="flex flex-col items-center bg-orange-50 rounded-xl py-2 px-1">
                                        <div className="text-sm font-black text-orange-500 font-mono">{item.backspace_count ?? 0}</div>
                                        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Backspace</div>
                                    </div>
                                    <div className="flex flex-col items-center bg-violet-50 rounded-xl py-2 px-1">
                                        <div className="text-sm font-black text-violet-500 font-mono">{item.last_word_speed ?? '—'}</div>
                                        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Word Spd</div>
                                    </div>
                                </div>
                            </div>


                            {/* Delete button removed for backend simplification */}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};


/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const ParagraphWritingTool = () => {
    // Feature status query - no authentication required
    const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
        useGetFeatureStatusByNameQuery(
            { name: "paragraph_ai" }
        )

    const [stage, setStage] = useState('landing');
    const [difficulty, setDifficulty] = useState('');
    const [paragraph, setParagraph] = useState('');
    const [userInput, setUserInput] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [backspaceCount, setBackspaceCount] = useState(0);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [liveWpm, setLiveWpm] = useState(0);
    const [wordStartTime, setWordStartTime] = useState(null);
    const [lastWordSpeed, setLastWordSpeed] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    const { access_token } = getStudentToken();

    // Fetch history from backend
    const { data: historyRes, refetch: refetchHistory } = useGetParagraphHistoryQuery(access_token);
    const historyData = useMemo(() => historyRes?.data || [], [historyRes]);
    const historyLen = historyData.length;


    // Per-button loading states
    const [loadingDifficulty, setLoadingDifficulty] = useState(null);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isChangingLevel, setIsChangingLevel] = useState(false);
    const [isNewChallenge, setIsNewChallenge] = useState(false);
    const [isViewingReport, setIsViewingReport] = useState(false);
    const [sessionSaved, setSessionSaved] = useState(false);

    const inputRef = useRef(null);


    const [generateParagraph, { isLoading: isGenerating }] = useGenerateParagraphMutation();
    const [analyzePerformance, { isLoading: isAnalyzing }] = useAnalyzePerformanceMutation();
    const [saveParagraphPractice, { isLoading: isSaving }] = useSaveParagraphPracticeMutation();


    // True when the next character to type is a space
    const isAtSpace = !!(paragraph && userInput.length < paragraph.length && paragraph[userInput.length] === ' ');

    useEffect(() => {
        if (stage === 'typing' && paragraph && inputRef.current) inputRef.current.focus();
    }, [stage, paragraph]);

    useEffect(() => {
        if (paragraph && userInput.length === paragraph.length) {
            setEndTime(Date.now());
            setStage('completion');
        }
    }, [userInput, paragraph]);

    useEffect(() => {
        let iv;
        if (startTime && !endTime && stage === 'typing') {
            iv = setInterval(() => {
                const mins = (Date.now() - startTime) / 60000;
                if (mins > 0 && userInput.length > 0)
                    setLiveWpm(Math.round((userInput.length / 5) / mins));
            }, 500);
        }
        return () => clearInterval(iv);
    }, [startTime, endTime, stage, userInput.length]);

    const liveErrors = useMemo(() => {
        if (!paragraph || !userInput) return 0;
        const pWords = paragraph.split(' ');
        let errors = 0;
        let pCharIdx = 0;

        for (let i = 0; i < pWords.length; i++) {
            const word = pWords[i];
            const wordLen = word.length;
            let wordHasError = false;

            // Check characters in the current word range
            for (let j = 0; j < wordLen; j++) {
                const globalIdx = pCharIdx + j;
                if (globalIdx < userInput.length) {
                    if (userInput[globalIdx] !== word[j]) {
                        wordHasError = true;
                        break;
                    }
                }
            }

            // Check the space after the word (if it exists in the paragraph)
            const spaceIdx = pCharIdx + wordLen;
            if (!wordHasError && spaceIdx < paragraph.length && paragraph[spaceIdx] === ' ') {
                if (spaceIdx < userInput.length && userInput[spaceIdx] !== ' ') {
                    wordHasError = true;
                }
            }

            if (wordHasError) errors++;
            pCharIdx += wordLen + 1; // Advance to start of next word
        }
        return errors;
    }, [paragraph, userInput]);

    const resetMetrics = () => {
        setUserInput('');
        setStartTime(null);
        setEndTime(null);
        setWordStartTime(null);
        setLastWordSpeed(0);
        setBackspaceCount(0);
        setAiAnalysis(null);
        setLiveWpm(0);
        setSessionSaved(false);
    };

    const handleStart = async (sel, setLoader) => {
        setDifficulty(sel);
        resetMetrics();
        if (setLoader) setLoader(true);
        try {
            const res = await generateParagraph({ difficulty: sel, access_token }).unwrap();
            if (res?.data?.paragraph) {
                setParagraph(res.data.paragraph);
                setStage('typing');
            }
        } catch {
            toast.error('Generation failed. Please check your API quota.');
        } finally {
            if (setLoader) setLoader(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Backspace') setBackspaceCount(p => p + 1);
    };

    const handleChange = (e) => {
        const v = e.target.value;
        const now = Date.now();
        if (!startTime && v.length > 0) {
            setStartTime(now);
            setWordStartTime(now);
        }
        if (v.length > userInput.length) {
            const lastChar = v[v.length - 1];
            const isWordEnd = lastChar === ' ' || v.length === paragraph.length;
            if (isWordEnd && wordStartTime) {
                const wordElapsedMins = (now - wordStartTime) / 60000;
                const lastSpaceIndex = v.lastIndexOf(' ', v.length - 2);
                const currentWord = v.slice(lastSpaceIndex + 1).trim();
                if (currentWord.length > 0 && wordElapsedMins > 0) {
                    const wSpeed = Math.round((currentWord.length / 5) / wordElapsedMins);
                    setLastWordSpeed(wSpeed);
                }
                setWordStartTime(now);
            }
        }
        if (v.length <= paragraph.length) setUserInput(v);
    };

    const calcResults = useMemo(() => {
        if (!startTime || !endTime) return null;
        const secs = (endTime - startTime) / 1000;
        const mins = secs / 60;
        const wpm = Math.round((paragraph.length / 5) / mins);

        let correct = 0;
        for (let i = 0; i < paragraph.length; i++) {
            if (userInput[i] === paragraph[i]) correct++;
        }

        // More representative accuracy calculation:
        // Subtract word-based errors and penalize backspaces to reflect typing effort
        const totalTyped = userInput.length + (backspaceCount * 0.8); // Backspaces count as effort
        const rawAccuracy = (correct / totalTyped) * 100;
        const accuracy = Math.max(0, Math.min(100, rawAccuracy)).toFixed(1);

        const wrongWords = liveErrors;
        const netWpm = Math.max(0, Math.round(wpm - (wrongWords / mins))).toFixed(0);

        return { wpm, accuracy, timeTaken: secs.toFixed(1), wrongWords, netWpm, backspaceCount, lastWordSpeed };
    }, [startTime, endTime, paragraph, userInput, liveErrors, backspaceCount, lastWordSpeed]);

    useEffect(() => {
        const persistSession = async () => {
            if (stage === 'completion' && calcResults && !sessionSaved) {
                try {
                    const sessionData = {
                        difficulty,
                        paragraph,
                        wpm: calcResults.wpm,
                        accuracy: calcResults.accuracy,
                        timeTaken: calcResults.timeTaken,
                        wrongWords: calcResults.wrongWords,
                        backspaceCount: calcResults.backspaceCount,
                        lastWordSpeed: calcResults.lastWordSpeed
                    };
                    const res = await saveParagraphPractice({ sessionData, access_token }).unwrap();
                    if (res?.success) {
                        setCurrentSessionId(res.data.id);
                        setSessionSaved(true);
                        refetchHistory();
                    }
                } catch (error) {
                    console.error("Failed to save session to backend", error);
                    toast.error("Cloud sync failed. Session saved locally.");
                    // Fallback to local if needed, but for now we just log it
                }
            }
        };
        persistSession();
    }, [stage, calcResults, sessionSaved, difficulty, paragraph, access_token, saveParagraphPractice]);


    const handleGetAnalysis = async () => {
        if (aiAnalysis || !calcResults) return;
        try {
            const res = await analyzePerformance({
                metrics: { ...calcResults, originalParagraph: paragraph, difficulty },
                access_token,
                sessionId: currentSessionId
            }).unwrap();
            setAiAnalysis(res.data.analysis);
            refetchHistory();
        } catch {
            toast.error('AI analysis failed. Check your quota.');
        }
    };


    const renderText = () => paragraph.split('').map((char, i) => {
        let cls = 'text-gray-300';
        if (i < userInput.length)
            cls = userInput[i] === char ? 'text-forestGreen font-semibold' : 'text-red-500 bg-red-50 rounded';
        else if (i === userInput.length)
            cls = 'text-gray-900 bg-lightGreen rounded border-b-2 border-primary';

        const isSpace = char === ' ';

        return (
            <span
                key={i}
                className={`font-mono text-xl md:text-2xl transition-colors duration-75 ${cls} ${isSpace ? 'mx-0.5' : 'mx-[1px]'}`}
            >
                {char}
            </span>
        );
    });


    // Then update all instances where HistoryDrawer is used to pass the callback:
    showHistory && (
        <HistoryDrawer
            onClose={() => setShowHistory(false)}
            history={historyData}
        />
    )


    // Show coming soon page if feature is inactive - this check happens FIRST
    if (featureData?.is_active === 0) {
        return <ComingSoonModal featureData={featureData} />;
    }

    // Show loading state for feature data
    if (featureDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <PrimaryLoader />
                </div>
            </div>
        )
    }

    // Show error state for feature data
    if (featureDataError) {
        return (
            <div className="text-red-500 text-center p-4 bg-red-50 min-h-screen flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
                    <p>Error loading feature status: {featureDataError?.toString()}</p>
                </div>
            </div>
        )
    }

    /* ══════════════════════════════════
       STAGE: LANDING
    ══════════════════════════════════ */
    if (stage === 'landing') return (
        <>
            <DefaultSEOMeta />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                .ptool * { font-family: 'Plus Jakarta Sans', sans-serif; }
            `}</style>
            <div className="ptool min-h-[88vh] bg-white flex flex-col items-center justify-center px-5 py-16">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <div className="inline-flex items-center gap-2 bg-lightGreen border border-primary/20 text-forestGreen rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6">
                        <BrainCircuit size={13} /> AI-Powered Typing Mastery
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-secondaryForestGreen leading-tight tracking-tight mb-4">
                        Master the <span className="text-leafGreen">Art</span> of Typing
                    </h1>
                    <p className="text-secondaryForestGreen text-base md:text-lg font-medium leading-relaxed">
                        Elevate your skills with AI-generated challenges. Get deep analysis on speed, accuracy, and rhythm.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl mb-8">
                    {DIFFICULTIES.map((d) => {
                        const Icon = d.Icon;
                        const isLoading = loadingDifficulty === d.id;
                        return (
                            <button
                                key={d.id}
                                onClick={async () => {
                                    setLoadingDifficulty(d.id);
                                    await handleStart(d.id, () => { });
                                    setLoadingDifficulty(null);
                                }}
                                disabled={loadingDifficulty !== null}
                                className="group text-left bg-white border-2 border-gray-100 rounded-2xl p-7 hover:border-primary hover:shadow-lg transition-all duration-200 hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                            >
                                <div className={`w-11 h-11 rounded-xl ${d.bgClass} border ${d.borderClass} flex items-center justify-center mb-5`}>
                                    {isLoading ? <Spinner size={18} className={d.accentClass} /> : <Icon size={20} className={d.accentClass} />}
                                </div>
                                <div className="text-secondaryForestGreen font-bold text-lg mb-1">{d.label}</div>
                                <div className={`text-xs font-semibold mb-3 ${d.accentClass}`}>{d.range}</div>
                                <p className="text-secondaryForestGreen text-sm leading-relaxed mb-6">{d.desc}</p>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                                    {isLoading
                                        ? <span className="flex items-center gap-2 text-forestGreen/60"><Spinner size={13} /> Generating…</span>
                                        : <>Start Training <ArrowRight size={15} /></>
                                    }
                                </div>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-secondaryForestGreen hover:border-forestGreen hover:text-forestGreen shadow-sm transition-all"
                >
                    <History size={15} />
                    View History
                    {historyLen > 0 && (
                        <span className="bg-forestGreen text-white text-xs font-bold px-2 py-0.5 rounded-full">{historyLen}</span>
                    )}
                </button>

                {showHistory && <HistoryDrawer onClose={() => setShowHistory(false)} history={historyData} />}
            </div>
        </>
    );

    /* ══════════════════════════════════
       STAGE: TYPING
    ══════════════════════════════════ */
    if (stage === 'typing') return (
        <>
            <DefaultSEOMeta />
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .ptool * { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
            <div className="ptool min-h-screen bg-white py-10 px-4 md:px-8">
                <div className="max-w-5xl mx-auto">

                    {/* Top bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setStage('landing')}
                                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary transition-colors shadow-sm"
                            >
                                <RotateCcw size={17} />
                            </button>
                            <div>
                                <h2 className="font-extrabold text-gray-900 text-xl leading-tight">Live Session</h2>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                        {difficulty} level active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Live Stats Pill */}
                        <div className="flex items-stretch bg-white border border-primary/10 rounded-2xl shadow-sm divide-x divide-gray-100 overflow-hidden">
                            {[
                                { label: 'Progress', val: `${Math.round((userInput.length / (paragraph.length || 1)) * 100)}%`, color: 'text-gray-900' },
                                { label: 'Total WPM', val: liveWpm, color: 'text-forestGreen' },
                                { label: 'Word Speed', val: lastWordSpeed, color: 'text-blue-500' },
                                { label: 'Errors', val: liveErrors, color: 'text-red-500' },
                                { label: 'Backspace', val: backspaceCount, color: 'text-orange-500' },
                            ].map((s, i) => (
                                <div key={i} className="flex flex-col items-center justify-center px-4 py-4 min-w-[70px]">
                                    <span className={`text-xl font-black font-mono tabular-nums ${s.color}`}>{s.val}</span>
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Typing Area */}
                    {isGenerating ? (
                        <div className="bg-white border border-gray-100 rounded-3xl p-20 flex flex-col items-center shadow-sm">
                            <PrimaryLoader />
                            <p className="text-gray-400 text-sm font-semibold mt-5 animate-pulse">Generating your paragraph…</p>
                        </div>
                    ) : (
                        <>
                            <div className="relative bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <textarea
                                    ref={inputRef}
                                    value={userInput}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className="absolute inset-0 w-full h-full opacity-0 z-10 resize-none cursor-text"
                                    autoFocus
                                    spellCheck="false"
                                    autoComplete="off"
                                />
                                <div className="leading-[2] select-none min-h-[180px] text-lg">
                                    {renderText()}
                                </div>
                            </div>

                            {/* Spacebar hint — fixed height so layout doesn't jump */}
                            <div className="mt-4 flex items-center justify-center" style={{ minHeight: 80 }}>
                                <SpacebarHint visible={isAtSpace} />
                            </div>

                            {/* Bottom Controls */}
                            <div className="mt-1 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-xl font-bold text-gray-800">{userInput.length}</span>
                                        <span className="text-[11px] uppercase tracking-widest text-gray-400 font-medium">/ {paragraph.length} chars</span>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200" />
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-xl font-bold text-gray-800">{backspaceCount}</span>
                                        <span className="text-[11px] uppercase tracking-widest text-gray-400 font-medium">backspaces</span>
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        setIsRegenerating(true);
                                        resetMetrics();
                                        await handleStart(difficulty, () => { });
                                        setIsRegenerating(false);
                                    }}
                                    disabled={isRegenerating}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lightGreen hover:bg-forestGreen hover:text-white text-forestGreen font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed min-w-[130px] justify-center"
                                >
                                    {isRegenerating
                                        ? <><Spinner size={13} /> Generating…</>
                                        : <><RotateCcw size={13} /> Regenerate</>
                                    }
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );

    /* ══════════════════════════════════
       STAGE: COMPLETION
    ══════════════════════════════════ */
    if (stage === 'completion') {
        return (
            <>
                <DefaultSEOMeta />
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .ptool * { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
                <div className="ptool min-h-[88vh] bg-white flex items-center justify-center px-5 py-16">
                    <div className="max-w-lg w-full text-center">
                        <div className="w-20 h-20 bg-lightGreen rounded-2xl flex items-center justify-center mx-auto mb-7 border border-primary/20">
                            <CheckCircle2 size={38} className="text-primary" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Session Complete!</h2>
                        <p className="text-gray-500 font-medium leading-relaxed mb-10">
                            You've finished the <span className="text-forestGreen font-bold capitalize">{difficulty}</span> challenge. Ready to see your AI-powered performance report?
                        </p>

                        {calcResults && (
                            <div className="flex flex-wrap justify-center gap-3 mb-10">
                                {[
                                    { label: 'Total WPM', val: calcResults.wpm, color: 'text-forestGreen' },
                                    { label: 'Word Speed', val: calcResults.lastWordSpeed, color: 'text-blue-500' },
                                    { label: 'Errors', val: calcResults.wrongWords, color: 'text-red-600' },
                                    { label: 'Accuracy', val: `${calcResults.accuracy}%`, color: 'text-indigo-600' },
                                    { label: 'Time', val: `${calcResults.timeTaken}s`, color: 'text-orange-500' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-white border border-primary/10 rounded-xl py-4 min-w-[100px] flex-1">
                                        <div className={`text-2xl font-black font-mono ${s.color}`}>{s.val}</div>
                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={async () => {
                                setIsViewingReport(true);

                                // Generate analysis before navigating
                                if (!aiAnalysis && calcResults) {
                                    try {
                                        const res = await analyzePerformance({
                                            metrics: { ...calcResults, originalParagraph: paragraph, difficulty },
                                            access_token,
                                            sessionId: currentSessionId
                                        }).unwrap();
                                        setAiAnalysis(res.data.analysis);
                                        refetchHistory();
                                    } catch (error) {
                                        toast.error('AI analysis failed. Check your quota.');
                                    }
                                }


                                // Navigate to results
                                setStage('results');
                                setIsViewingReport(false);
                            }}
                            disabled={isViewingReport}
                            className="w-full py-4 bg-forestGreen text-white rounded-2xl font-bold text-base hover:bg-forestGreen/90 hover:shadow-lg transition-all flex items-center justify-center gap-3 group mb-3 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isViewingReport
                                ? <><Spinner size={18} className="text-white" /> Generating Report…</>
                                : <>View Full Report <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                            }
                        </button>

                        <button
                            onClick={() => { resetMetrics(); setStage('landing'); }}
                            className="w-full py-3 text-gray-400 text-sm font-semibold hover:text-gray-600 transition-colors"
                        >
                            Discard & start over
                        </button>
                    </div>
                </div>
            </>
        );
    }

    /* ══════════════════════════════════
       STAGE: RESULTS
    ══════════════════════════════════ */
    if (stage === 'results' && calcResults) {
        const r = calcResults;
        return (
            <>
                <DefaultSEOMeta />
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); .ptool * { font-family: 'Plus Jakarta Sans', sans-serif; }`}</style>
                <div className="ptool min-h-screen bg-white py-12 px-4 md:px-8">
                    <div className="max-w-6xl mx-auto">

                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Session Report</span>
                                </div>
                                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Performance Analysis</h2>
                            </div>
                            <button
                                onClick={() => setShowHistory(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:border-forestGreen hover:text-forestGreen transition-colors shadow-sm"
                            >
                                <History size={14} /> History
                                {historyLen > 0 && (
                                    <span className="bg-forestGreen/10 text-forestGreen text-xs font-bold px-1.5 py-0.5 rounded-full">{historyLen}</span>
                                )}
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 items-start">

                            {/* LEFT: Score Card */}
                            <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
                                <div className="bg-white border border-primary/10 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-3xl" />
                                    <div className="w-14 h-14 bg-lightGreen border border-primary/20 rounded-2xl flex items-center justify-center mb-6">
                                        <Award size={26} className="text-primary" />
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Net WPM</div>
                                    <div className="text-5xl font-black text-gray-900 font-mono mb-1">{r.netWpm}</div>
                                    <div className="text-xs text-gray-400 font-medium">words per minute</div>

                                    <div className="mt-4 space-y-2">
                                        {[
                                            { label: 'Total Speed', val: `${r.wpm} wpm`, Icon: Activity, color: 'text-forestGreen bg-forestGreen/8' },
                                            { label: 'Per Word', val: `${r.lastWordSpeed} wpm`, Icon: Zap, color: 'text-blue-600 bg-blue-50' },
                                            { label: 'Wrong Words', val: r.wrongWords, Icon: AlertCircle, color: 'text-red-600 bg-red-50' },
                                            { label: 'Accuracy', val: `${r.accuracy}%`, Icon: Target, color: 'text-indigo-600 bg-indigo-50' },
                                            { label: 'Time Taken', val: `${r.timeTaken}s`, Icon: Clock, color: 'text-orange-500 bg-orange-50' },
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}>
                                                        <s.Icon size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-gray-500">{s.label}</span>
                                                </div>
                                                <span className="text-xs font-black text-gray-900 font-mono">{s.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-forestGreen rounded-3xl p-7 text-white shadow-sm">
                                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-5">Error Metrics</div>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Wrong Words', val: r.wrongWords, Icon: AlertCircle, iconColor: 'text-red-400' },
                                            { label: 'Backspaces Used', val: r.backspaceCount, Icon: Keyboard, iconColor: 'text-yellow-400' },
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/8 rounded-xl flex items-center justify-center">
                                                    <s.Icon size={15} className={s.iconColor} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                                                    <div className="text-lg font-black">{s.val}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: AI Analysis */}
                            <div className="flex-1 min-w-0">
                                <div className="bg-white border border-primary/10 rounded-3xl p-8 md:p-10 shadow-sm">

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-lightGreen rounded-xl flex items-center justify-center">
                                                <BrainCircuit size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-gray-900 text-base">AI Analysis Engine</h3>
                                                <p className="text-xs text-gray-400 font-medium">Powered by Gemini</p>
                                            </div>
                                        </div>
                                        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 bg-lightGreen text-forestGreen border border-primary/20 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">
                                            <Sparkles size={11} /> Gemini Flash
                                        </span>
                                    </div>

                                    {!aiAnalysis ? (
                                        <div className="flex flex-col items-center py-14 text-center bg-lightGreen rounded-2xl border border-dashed border-primary/20">
                                            <div className="w-14 h-14 bg-white rounded-full border border-primary/15 flex items-center justify-center mb-5 shadow-sm">
                                                <Activity size={24} className="text-primary" />
                                            </div>
                                            <p className="text-gray-600 font-semibold text-base mb-2">Ready for your deep dive?</p>
                                            <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
                                                Our AI will analyze your rhythm, accuracy patterns, and give personalized improvement tips.
                                            </p>
                                            <button
                                                onClick={handleGetAnalysis}
                                                disabled={isAnalyzing}
                                                className="flex items-center gap-3 px-8 py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-forestGreen hover:shadow-lg transition-all disabled:opacity-60 shadow-sm group min-w-[180px] justify-center"
                                            >
                                                {isAnalyzing
                                                    ? <><Spinner size={16} className="text-white" /> Analyzing…</>
                                                    : <><BarChart3 size={17} /> Generate Report <ChevronRight size={17} className="group-hover:translate-x-1 transition-transform" /></>
                                                }
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {aiAnalysis.summary && (
                                                <div className="p-6 bg-lightGreen border border-primary/20 rounded-2xl relative overflow-hidden">
                                                    <div className="absolute top-3 right-3 opacity-10"><Sparkles size={40} className="text-primary" /></div>
                                                    <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Summary</div>
                                                    <p className="text-gray-700 font-medium leading-relaxed">{aiAnalysis.summary}</p>
                                                    {aiAnalysis.verdict && (
                                                        <div className="mt-4 inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                                            <Star size={11} fill="currentColor" /> {aiAnalysis.verdict}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {(aiAnalysis.strengths?.length > 0 || aiAnalysis.weaknesses?.length > 0) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    {aiAnalysis.strengths?.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-6 h-6 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center">
                                                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Strengths</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {aiAnalysis.strengths.map((s, i) => (
                                                                    <div key={i} className="flex gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-emerald-200 hover:bg-white transition-all">
                                                                        <span className="text-emerald-400 font-black text-xs opacity-60 mt-0.5">#{i + 1}</span>
                                                                        <p className="text-gray-600 text-sm font-medium leading-relaxed">{s}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {aiAnalysis.weaknesses?.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-6 h-6 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-center">
                                                                    <AlertCircle size={13} className="text-orange-500" />
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Areas to Improve</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {aiAnalysis.weaknesses.map((w, i) => (
                                                                    <div key={i} className="flex gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-white transition-all">
                                                                        <span className="text-orange-400 font-black text-xs opacity-60 mt-0.5">#{i + 1}</span>
                                                                        <p className="text-gray-600 text-sm font-medium leading-relaxed">{w}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {aiAnalysis.pro_tips?.length > 0 && (
                                                <div className="bg-forestGreen rounded-2xl p-7 text-white">
                                                    <div className="flex items-center gap-2 mb-6">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Training Protocol</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                        {aiAnalysis.pro_tips.map((tip, i) => (
                                                            <div key={i}>
                                                                <div className="text-2xl font-black text-primary/60 mb-2 font-mono">0{i + 1}</div>
                                                                <p className="text-gray-300 text-sm font-medium leading-relaxed">{tip}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {typeof aiAnalysis === 'string' && (
                                                <div className="p-6 bg-lightGreen border border-primary/20 rounded-2xl">
                                                    <p className="text-gray-700 font-medium leading-relaxed text-sm">{aiAnalysis}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-5">
                                    <button
                                        onClick={async () => {
                                            setIsChangingLevel(true);
                                            resetMetrics();
                                            await new Promise(r => setTimeout(r, 300));
                                            setStage('landing');
                                            setIsChangingLevel(false);
                                        }}
                                        disabled={isChangingLevel || isNewChallenge}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-primary hover:text-primary transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isChangingLevel
                                            ? <><Spinner size={14} /> Leaving…</>
                                            : <><RotateCcw size={15} className="group-hover:rotate-[-90deg] transition-transform" /> Change Level</>
                                        }
                                    </button>

                                    <button
                                        onClick={async () => {
                                            setIsNewChallenge(true);
                                            resetMetrics();
                                            await handleStart(difficulty, () => { });
                                            setIsNewChallenge(false);
                                        }}
                                        disabled={isNewChallenge || isChangingLevel}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-forestGreen hover:shadow-md transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isNewChallenge
                                            ? <><Spinner size={14} className="text-white" /> Generating…</>
                                            : <>New Challenge <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" /></>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {showHistory && <HistoryDrawer onClose={() => setShowHistory(false)} history={historyData} />}
            </>
        );
    }

    return null;
};

export default ParagraphWritingTool;