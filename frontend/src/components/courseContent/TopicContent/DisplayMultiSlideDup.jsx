/* eslint-disable react-hooks/exhaustive-deps */
"use client"

/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { ChevronLeft, ChevronRight, Clock, FileText, Code, Download, ChevronUp, ChevronDown } from "lucide-react"
import parse, { domToReact } from "html-react-parser"
import { useEffect, useRef, useState } from "react"
import Draggable from "react-draggable"
import AudioPlayer from "../../ui/audioPlayer"
import { useCreateSlideProgressRecordsForTopicMutation, useGetSlideStatusByTopicIdQuery, useTrackStudentTimeSpentOnTopicMutation, useUpdateSlideCompletionStatusMutation } from "../../../services/progressTracking/newProgressTrackingApi"
import VideoPlayer from "../../ui/VideoPlayer"
import { useSummarizePassageMutation } from "../../../services/Ai/summarizeApi"
import { useCreateSummaryMutation, useGetSummariesByMultiSlideAccordionIdQuery, useGetSummariesByMultiSlideGeneralDescIdQuery } from "../../../services/Ai/summaryApi"
import { useCreateBulletPointMutation } from "../../../services/Ai/bulletPointApi"
import { useCreateFlashCardMutation } from "../../../services/Ai/flashCardApi"
import ContentSummary from "./ContentSummary"
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';

function CountdownTimer({ seconds = 60, onComplete }) {
    const [timeLeft, setTimeLeft] = useState(seconds)

    useEffect(() => {
        if (timeLeft <= 0) {
            if (onComplete) onComplete()   // 🔥 trigger callback
            return
        }

        const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
        return () => clearInterval(timer)
    }, [timeLeft, onComplete])

    const formatTime = (s) => {
        const mins = Math.floor(s / 60)
        const secs = s % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const progress = ((seconds - timeLeft) / seconds) * 100

    return (
        <div className="relative">
            <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                    <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-blue-900">Time Remaining</span>
                        <span className="text-lg font-bold text-blue-900 tabular-nums">
                            {timeLeft > 0 ? formatTime(timeLeft) : "Complete!"}
                        </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function SimpleCodeBlock({ code, language = "javascript" }) {
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative my-4 sm:my-6 border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 shadow-lg clear-both sm:w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-800 px-3 py-2 sm:px-4 sm:py-3 border-b border-slate-700">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Code className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-slate-400" />
                    <span className="text-slate-300 text-xs sm:text-sm font-medium capitalize truncate">
                        {language}
                    </span>
                </div>
                <button
                    onClick={copyCode}
                    className={`text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg font-medium transition-all ml-2 flex-shrink-0 ${copied
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-700 text-slate-200"
                        }`}
                >
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>

            {/* Code Container */}
            <div className="w-full overflow-x-auto">
                <pre className="min-w-full p-4 sm:p-6 text-xs sm:text-sm text-slate-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}

export default function EnhancedDisplayMultiSlideDup({
    slides,
    isLoading,
    isError,
    activeSlideId,
    setActiveSlideId,
    slideContent,
    userId,
    access_token,
    courseId,
    currentModule,
    currentSession,
    currentTopic,
    handleMarkTopicCompleted,
    handleSlideComplete,          // ✅ new prop for slide completion
    openAccordionId,               // ✅ new
    setOpenAccordionId,           // ✅ new
    setOpenId,                    // ✅ new
    openId,
    existingAccordionSummaries,
    isTopicCompleted
}) {
    const [copiedKey, setCopiedKey] = useState(null)
    const [fullScreenCode, setFullScreenCode] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [hasSummary, setHasSummary] = useState(false)

    const currentSlideRef = useRef(slideContent);

    // Scroll to top when slide changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeSlideId]);

    useEffect(() => {
        currentSlideRef.current = slideContent;
    }, [slideContent]);

    useEffect(() => {
        if (slideContent?.slide?.accordianDetails?.length > 0) {
            const defaultOpenId = slideContent?.slide?.accordianDetails[0]?.id;
            setOpenId(defaultOpenId);
            setOpenAccordionId(defaultOpenId);
        }
    }, [slideContent?.slide?.id]);

    const toggleItem = (id) => {
        const newId = openId === id ? null : id;
        setOpenId(newId);
        setOpenAccordionId(newId); // ✅ sync with parent
    };

    const { data: slidesStatusData } = useGetSlideStatusByTopicIdQuery({
        userId,
        topicId: currentTopic?.id,
        access_token,
    });

    const [createSlideProgressRecordsForTopic] = useCreateSlideProgressRecordsForTopicMutation();
    const [updateSlideStatus] = useUpdateSlideCompletionStatusMutation();
    const [timeSpent, setTimeSpent] = useState(0);
    const [prevSlideId, setPrevSlideId] = useState(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const initializedSlideProgressRef = useRef(new Set());

    const [trackStudentTimeSpentOnTopic] = useTrackStudentTimeSpentOnTopicMutation();


    const [summarizePassage, { data, error, isLoadingSummary }] = useSummarizePassageMutation();
    const [createSummary] = useCreateSummaryMutation();
    const [createBulletPoint] = useCreateBulletPointMutation();
    const [createFlashCard] = useCreateFlashCardMutation();

    const activeGeneralDescId = slideContent?.slide?.generalDetails?.[0]?.id || null;

    const { data: existingGeneralDescSummaries, isLoading: isLoadingGeneralDescSummaries } = useGetSummariesByMultiSlideGeneralDescIdQuery({
        topic_id: currentTopic?.id,
        multi_slide_general_desc_id: activeGeneralDescId,
        access_token,
    }, { skip: !currentTopic?.id || !activeGeneralDescId });

    // Timer effect
    useEffect(() => {
        if (!activeSlideId) return;

        // ⏱ reset to 0 whenever slide changes
        setTimeSpent(0);

        let interval = null;

        const startTimer = () => {
            if (!interval) {
                interval = setInterval(() => {
                    setTimeSpent((t) => {
                        const newTime = t + 1;
                        return newTime;
                    });
                }, 1000);
            }
        };

        const stopTimer = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopTimer();
            } else {
                startTimer();
            }
        };

        // Start fresh timer when slide changes
        startTimer();

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            stopTimer();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [activeSlideId]);

    // API call when slide changes
    useEffect(() => {
        if (!prevSlideId || prevSlideId === activeSlideId) {
            if (!prevSlideId) setPrevSlideId(activeSlideId || null);
            return
        };

        // ✅ Check if prevSlideId belongs to current topic slides
        const isValidSlide = Array.isArray(slides?.slides) && (slides?.slides || []).some(
            (slide) => slide.id === prevSlideId
        );

        if (!isValidSlide) {
            // Still update prevSlideId to avoid stale state
            setPrevSlideId(activeSlideId);
            return;
        }

        // 🚀 Send timeSpent for the previous slide
        trackStudentTimeSpentOnTopic({
            userId,
            courseId,
            sessionId: currentSession?.id,
            moduleId: currentModule?.id,
            topicId: currentTopic?.id,
            accordianId: null, // pass if you have accordian_id
            slideId: prevSlideId,
            timeSpent: timeSpent,
            timer_time: 0, // if needed
            access_token,
            completion_status: null,
            include_in_first_completion: true,
            finalize_first_completion: true,
        });

        // Update prevSlideId
        setPrevSlideId(activeSlideId);
    }, [activeSlideId]);

    useEffect(() => {
        if (!slides?.slides?.length || slides?.topicData?.id !== currentTopic?.id) return;
        if (isTopicCompleted) return;

        // Only set the first slide as active if there is no active slide
        if (!activeSlideId) {
            setActiveSlideId(slides.slides[0].id);
        }
        if (!prevSlideId) {
            setPrevSlideId(slides.slides[0].id);
        }

        const initKey = [
            userId,
            courseId,
            currentSession?.id ?? "null",
            currentModule?.id ?? "null",
            currentTopic?.id ?? "null",
        ].join(":");

        if (initializedSlideProgressRef.current.has(initKey)) return;
        initializedSlideProgressRef.current.add(initKey);

        slides.slides.forEach((acc, index) => {
            createSlideProgressRecordsForTopic({
                userId,
                courseId,
                sessionId: currentSession?.id,
                moduleId: currentModule?.id,
                topicId: currentTopic?.id,
                slideId: acc.id,
                timeSpent: 0,
                timer_time: 0,
                access_token,
                completion_status: index === 0 ? "in_progress" : "not_started",
            });
        });
    }, [slides, userId, courseId, currentSession?.id, currentModule?.id, access_token, setActiveSlideId, activeSlideId, isTopicCompleted]);


    const handleSlideCompleteLocal = async (slideId) => {
        const finalSlideId = currentSlideRef.current?.slide?.id || slideId;
        // Use the passed handleSlideComplete callback from parent
        if (typeof handleSlideComplete === "function") {
            handleSlideComplete(finalSlideId);
        } else {
            // Fallback to original logic if no callback provided
            const response = await updateSlideStatus({
                userId,
                topicId: currentTopic.id,
                slideId: finalSlideId,
                completionStatus: "completed",
                access_token,
            }).unwrap();

            // find current slide index
            const currentIndex = slides.slides.findIndex(s => s.id === finalSlideId);
            const isLastSlide = currentIndex === slides.slides.length - 1;

            if (isLastSlide) {
                setActiveSlideId(null);
                // ✅ Last slide, mark topic as completed
                if (typeof handleMarkTopicCompleted === "function") {
                    handleMarkTopicCompleted(currentTopic.id);
                }
            } else {
                // ✅ Go to next slide
                const nextSlideId = response?.next_slide_id || slides.slides[currentIndex + 1]?.id;
                if (nextSlideId) {
                    setActiveSlideId(nextSlideId);
                    const nextItem = slides.slides.find(acc => acc.id === nextSlideId);
                    if (nextItem) setOpenId(nextItem.id);
                }
            }
        }
    };

    useEffect(() => {
        if (slideContent) {
            let hasExistingSummary = false;
            let existingSummary = null;

            switch (slideContent.slide.type) {
                case "general":
                    if (existingGeneralDescSummaries && existingGeneralDescSummaries.length > 0) {
                        hasExistingSummary = true;
                        existingSummary = existingGeneralDescSummaries[0];
                    }
                    break;
                case "accordian":
                    if (existingAccordionSummaries && existingAccordionSummaries.length > 0) {
                        hasExistingSummary = true;
                        existingSummary = existingAccordionSummaries[0];
                    }
                    break;
                default:
                    break;
            }

            if (hasExistingSummary && existingSummary) {
                setHasSummary(true);
                setSummaryData({
                    summary: existingSummary.summary,
                    bullet_points: existingSummary.bullet_points.map(bp => bp.bullet_point),
                    flash_cards: existingSummary.flash_cards.map(fc => ({
                        question: fc.question,
                        answer: fc.answer,
                    })),
                });
            } else {
                setHasSummary(false);
                setSummaryData(null);
            }
        }
    }, [slideContent, existingGeneralDescSummaries, existingAccordionSummaries]);

    const cleanHtmlContent = (html) => {
        if (!html) return '';

        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove script and style elements
        const scripts = tempDiv.getElementsByTagName('script');
        const styles = tempDiv.getElementsByTagName('style');
        while (scripts.length > 0) scripts[0].remove();
        while (styles.length > 0) styles[0].remove();

        // Get text content and clean it
        let text = tempDiv.textContent || tempDiv.innerText;

        // Remove extra whitespace and normalize spaces
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    };



    const summarizeGeneralDescription = async (description) => {
        try {
            setIsSummaryLoading(true);
            if (!description) return;

            // Clean the HTML content before sending
            const cleanText = cleanHtmlContent(description);

            const result = await summarizePassage({ passage: cleanText, access_token }).unwrap();

            // Prepare the summary data
            const summaryData = {
                topic_id: currentTopic.id,
                summary: result.summary,
                general_material_desc_id: null,
                general_material_pdf_id: null,
                accordion_id: null,
                multi_slide_general_desc_id: activeGeneralDescId,
                multi_slide_general_pdf_id: null,
                multi_slide_accordion_id: null,
            };

            const response = await createSummary({ summaryData, access_token }).unwrap();

            const bulletPointData = {
                summary_id: response.id,
                bullet_point: result.bullet_points,
            }

            await createBulletPoint({ bulletPointData, access_token }).unwrap();

            const flashCardData = {
                summary_id: response.id,
                flash_cards: result.flash_cards,
            }

            await createFlashCard({ flashCardData, access_token }).unwrap();
            setSummaryData(result);
            setShowSummary(true);
        } finally {
            setIsSummaryLoading(false);
        }
    };


    if (isLoading)
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="animate-spin w-12 h-12 border-3 border-slate-200 border-t-blue-600 rounded-full"></div>
                        <div className="absolute inset-0 animate-pulse">
                            <div
                                className="w-12 h-12 border-3 border-transparent border-t-blue-400 rounded-full animate-spin"
                                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                            ></div>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-700 font-semibold text-lg">Loading slides...</p>
                        <p className="text-slate-500 text-sm mt-1">Please wait while we prepare your content</p>
                    </div>
                </div>
            </div>
        )

    if (isError)
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center p-8 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-200 shadow-lg max-w-md">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-red-900 font-bold text-xl mb-2">Unable to Load Slides</h3>
                    <p className="text-red-700 mb-4">We encountered an issue while loading your presentation content.</p>
                    <button className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        )

    if (!slides?.slides?.length)
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center p-8 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200 shadow-lg max-w-md">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <FileText className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-xl mb-2">No Slides Available</h3>
                    <p className="text-slate-600 mb-4">Upload your presentation content to get started with your slides.</p>
                    <button className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg transition-colors">
                        Upload Slides
                    </button>
                </div>
            </div>
        )

    const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || ""

    const currentSlideIndex = slides.slides.findIndex((slide) => slide.id === activeSlideId)
    const currentSlide = slides.slides[currentSlideIndex]
    const activeIndex = currentSlideIndex !== -1 ? currentSlideIndex : 0
    const displaySlide = currentSlide || slides.slides[0]

    const goToPrevious = () => {
        if (activeIndex > 0) {
            setActiveSlideId(slides.slides[activeIndex - 1].id)
        }
    }

    const goToNext = () => {
        if (activeIndex < slides.slides.length - 1) {
            setActiveSlideId(slides.slides[activeIndex + 1].id)
        }
    }

    const nextSlide = slides.slides[activeIndex + 1];
    const nextSlideStatus = slidesStatusData?.slideStatus?.find(
        (s) => s.slide_id === nextSlide?.id
    )?.status;

    const processDescriptionWithTags = (html) => {
        if (!html) return null

        // Determine slide type for conditional styling
        const isGeneral = slideContent?.slide?.type === 'general';

        // Trim full-document wrappers
        if (/<!?DOCTYPE|<html/i.test(html)) {
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
            if (bodyMatch?.[1]) html = bodyMatch[1]
            html = html.replace(/<head[\s\S]*?<\/head>/i, "")
        }

        const hasLists = /<(ul|ol)[^>]*>/i.test(html)

        const tagRegex = /#[^#\s]+#/g
        const topicTags = Array.isArray(slideContent.slide.TopicTags) ? slideContent.slide.TopicTags : []
        const grouped = topicTags.reduce((acc, t) => {
            if (!t?.tag) return acc
            acc[t.tag] = acc[t.tag] ? [...acc[t.tag], t] : [t]
            return acc
        }, {})
        const occurrenceTracker = {}
        const isImageExt = (p) => /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(p || "")

        const createTagElement = (tagObj, key) => {
            if (!tagObj)
                return (
                    <span key={key} className="text-gray-400">
                        #missing-tag#
                    </span>
                )
            const fileUrl = `${mediaBase}${tagObj.tag_file_path || "/placeholder.png"}`
            switch (tagObj.tag_file_type) {
                case "image":
                    if (isGeneral) {
                        return (
                            <div key={key} className="my-4 block mx-auto max-w-full text-center">
                                <div className="relative group inline-block">
                                    <img
                                        src={fileUrl || "/placeholder.svg"}
                                        alt={tagObj.tag}
                                        className="h-auto max-h-56 md:max-h-[300px] lg:max-h-[350px] rounded-lg border border-gray-200 object-contain shadow-sm"
                                    />
                                    <p className="mt-2 text-[10px] md:text-xs font-mono text-black">{tagObj.tag?.replace(/#/g, "")}</p>
                                </div>
                            </div>
                        )
                    }
                    return (
                        <div key={key} className="my-4 block mx-auto max-w-full text-center">
                            <img
                                src={fileUrl || "/placeholder.svg"}
                                alt={tagObj.tag}
                                className="max-w-full lg:max-w-xl max-h-[400px] w-auto rounded-lg border object-contain shadow-sm block mx-auto"
                            />
                            <p className="mt-2 text-[10px] md:text-xs font-mono text-black">{tagObj.tag?.replace(/#/g, "")}</p>
                        </div>
                    )
                case "code":
                    if (isGeneral) {
                        return (
                            <div
                                key={key}
                                className="relative my-4 mx-auto w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-900 shadow-sm clear-both"
                            >
                                <div className="flex items-center justify-between px-4 py-2 md:px-6 md:py-3 bg-gray-800 border-b border-gray-700">
                                    <span className="text-xs md:text-sm font-medium text-gray-300">
                                        {tagObj.code_language || "code"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setFullScreenCode({ code: tagObj.tag_file_path || "", language: tagObj.code_language || "javascript" })}
                                            className="text-[10px] md:text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-md font-medium transition-all bg-gray-700 text-gray-100 hover:bg-gray-600 flex items-center gap-1"
                                        >
                                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                            <span className="hidden sm:inline">Fullscreen</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(tagObj.tag_file_path || "")
                                                setCopiedKey(key)
                                                setTimeout(() => setCopiedKey(null), 1500)
                                            }}
                                            className={`text-[10px] md:text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-md font-medium transition-all ${copiedKey === key ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-100 hover:bg-gray-600"}`}
                                        >
                                            {copiedKey === key ? "✓ Copied" : "Copy"}
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-auto max-h-[400px] code-scrollbar">
                                    <SyntaxHighlighter
                                        language={tagObj.code_language || "javascript"}
                                        style={dracula}
                                        customStyle={{
                                            margin: 0,
                                            padding: "1rem 1.5rem",
                                            fontSize: "14px",
                                            background: "transparent",
                                        }}
                                        wrapLongLines={true}
                                        wrapLines={true}
                                        lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                                        codeTagProps={{ style: { wordBreak: 'break-word', whiteSpace: 'pre-wrap' } }}
                                    >
                                        {tagObj.tag_file_path || ""}
                                    </SyntaxHighlighter>
                                </div>
                                <div className="bg-gray-800 px-4 py-1 border-t border-gray-700 text-center">
                                    <p className="text-[10px] md:text-xs font-mono text-white">{tagObj.tag?.replace(/#/g, "")}</p>
                                </div>
                            </div>
                        )
                    }
                    return (
                        <div
                            key={key}
                            className="relative my-4 mx-auto w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-900 shadow-sm clear-both"
                        >
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                                <span className="text-xs md:text-sm font-medium text-gray-300">
                                    {tagObj.code_language || "code"}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFullScreenCode({ code: tagObj.tag_file_path || "", language: tagObj.code_language || "javascript" })}
                                        className="text-[10px] md:text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-md font-medium transition-all bg-gray-700 text-gray-100 hover:bg-gray-600 flex items-center gap-1"
                                    >
                                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                        <span className="hidden sm:inline">Fullscreen</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(tagObj.tag_file_path || "")
                                            setCopiedKey(key)
                                            setTimeout(() => setCopiedKey(null), 1500)
                                        }}
                                        className={`text-[10px] md:text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-md font-medium transition-all ${copiedKey === key ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-100 hover:bg-gray-600"}`}
                                    >
                                        {copiedKey === key ? "✓ Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-auto max-h-[400px] code-scrollbar">
                                <SyntaxHighlighter
                                    language={tagObj.code_language || "javascript"}
                                    style={dracula}
                                    customStyle={{ margin: 0, padding: "1rem 1.5rem", fontSize: "14px", background: "transparent" }}
                                    wrapLongLines={true}
                                >
                                    {tagObj.tag_file_path || ""}
                                </SyntaxHighlighter>
                            </div>
                            <div className="bg-gray-800 px-4 py-1 border-t border-gray-700 text-center">
                                <p className="text-[10px] md:text-xs font-mono text-white">{tagObj.tag?.replace(/#/g, "")}</p>
                            </div>
                        </div>
                    )
                default:
                    if (isImageExt(tagObj.tag_file_path)) {
                        if (isGeneral) {
                            return (
                                <div key={key} className="my-4 block mx-auto max-w-full text-center">
                                    <div className="relative group inline-block">
                                        <img
                                            src={fileUrl || "/placeholder.svg"}
                                            alt={tagObj.tag}
                                            className="max-w-auto h-auto max-h-56 md:max-h-[300px] lg:max-h-[350px] rounded-lg border border-gray-200 object-contain shadow-sm"
                                        />
                                        <p className="mt-2 text-[10px] md:text-xs font-mono text-black">{tagObj.tag?.replace(/#/g, "")}</p>
                                    </div>
                                </div>
                            )
                        }
                        return (
                            <div key={key} className="my-4 block mx-auto max-w-full text-center">
                                <img
                                    src={fileUrl || "/placeholder.svg"}
                                    alt={tagObj.tag}
                                    className="my-4 max-w-full lg:max-w-xl max-h-[400px] w-auto rounded-lg border object-contain shadow-sm block mx-auto"
                                />
                                <p className="mt-2 text-[10px] md:text-xs font-mono text-black">{tagObj.tag?.replace(/#/g, "")}</p>
                            </div>
                        )
                    }
                    if (isGeneral) {
                        return (
                            <button
                                key={key}
                                onClick={() => window.open(fileUrl, "_blank", "noopener")}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium transition-all shadow-sm active:scale-95 mr-2 mb-2"
                            >
                                <FileText className="w-4 h-4" />
                                View File
                            </button>
                        )
                    }
                    return (
                        <button
                            key={key}
                            onClick={() => window.open(fileUrl, "_blank", "noopener")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium transition-colors mr-2 mb-2"
                        >
                            View File
                        </button>
                    )
            }
        }

        // Add element-level styling so TinyMCE HTML (lists, headings, links, etc.) renders properly.
        const options = {
            replace: (node) => {
                // Style HTML element tags
                if (node.type === "tag") {
                    const { name, children, attribs = {} } = node
                    const commonText = "text-gray-800"

                    if (name === "p") {
                        return <p className={`mb-3 leading-relaxed ${isGeneral ? 'text-base md:text-base mb-4' : ''} ${commonText}`}>{domToReact(children, options)}</p>
                    }
                    if (name === "h1") {
                        return <h1 className={`${isGeneral ? 'mt-6 mb-4 text-2xl sm:text-3xl md:text-3xl' : 'mt-4 mb-3 text-2xl'} font-semibold text-gray-900`}>{domToReact(children, options)}</h1>
                    }
                    if (name === "h2") {
                        return <h2 className={`${isGeneral ? 'mt-5 mb-3 text-xl sm:text-2xl md:text-2xl' : 'mt-4 mb-2 text-xl'} font-semibold text-gray-900`}>{domToReact(children, options)}</h2>
                    }
                    if (name === "h3") {
                        return <h3 className={`${isGeneral ? 'mt-4 mb-3 text-lg sm:text-xl md:text-xl' : 'mt-3 mb-2 text-lg'} font-semibold text-gray-900`}>{domToReact(children, options)}</h3>
                    }
                    if (name === "ul") {
                        return <ul className={`my-3 list-disc pl-5 space-y-2 ${isGeneral ? 'my-4 space-y-2.5 text-base md:text-base' : ''}`}>{domToReact(children, options)}</ul>
                    }
                    if (name === "ol") {
                        return <ol className={`my-3 list-decimal pl-5 space-y-2 ${isGeneral ? 'my-4 space-y-2.5 text-base md:text-base' : ''}`}>{domToReact(children, options)}</ol>
                    }
                    if (name === "li") {
                        return <li className={`${commonText}`}>{domToReact(children, options)}</li>
                    }
                    if (name === "a") {
                        const href = attribs.href || "#"
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                                {domToReact(children, options)}
                            </a>
                        )
                    }
                    if (name === "blockquote") {
                        return (
                            <blockquote className={`${isGeneral ? 'border-l-4 border-blue-500 pl-4 pr-2 py-2 bg-gray-50 rounded-r-lg my-4' : 'border-l-4 border-gray-300 pl-4 my-3'} italic text-gray-700`}>
                                {domToReact(children, options)}
                            </blockquote>
                        )
                    }
                    if (name === "pre") {
                        if (isGeneral) {
                            return (
                                <div className="my-4 overflow-x-auto">
                                    <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-sm md:text-sm min-w-full">
                                        {domToReact(children, options)}
                                    </pre>
                                </div>
                            )
                        }
                        return (
                            <pre className="my-4 rounded-lg bg-gray-900 text-gray-100 p-4 overflow-auto text-xs">
                                {domToReact(children, options)}
                            </pre>
                        )
                    }
                    if (name === "code") {
                        if (isGeneral) {
                            return (
                                <code className="px-2 py-0.5 rounded bg-gray-100 text-red-600 text-sm md:text-sm font-mono border border-gray-200">
                                    {domToReact(children, options)}
                                </code>
                            )
                        }
                        return (
                            <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">{domToReact(children, options)}</code>
                        )
                    }
                    if (name === "table") {
                        const className = isGeneral ? "my-4 overflow-x-auto -mx-2 sm:mx-0 md:mx-0" : "my-4 overflow-auto";
                        return (
                            <div className={className}>
                                <table className="w-full border-collapse text-sm">{domToReact(children, options)}</table>
                            </div>
                        )
                    }
                    if (name === "th") {
                        const className = isGeneral
                            ? "border border-gray-200 bg-gray-100 px-3 py-2.5 md:px-4 md:py-3 text-left font-semibold text-gray-900"
                            : "border border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-900";
                        return (
                            <th className={className}>
                                {domToReact(children, options)}
                            </th>
                        )
                    }
                    if (name === "td") {
                        const className = isGeneral
                            ? "border border-gray-200 px-3 py-2.5 md:px-4 md:py-3 align-top text-gray-800 bg-white"
                            : "border border-gray-200 px-3 py-2 align-top text-gray-800";
                        return (
                            <td className={className}>
                                {domToReact(children, options)}
                            </td>
                        )
                    }
                    if (name === "img") {
                        const src = attribs.src || "/placeholder.svg"
                        const alt = attribs.alt || "image"
                        if (isGeneral) {
                            return (
                                <div className="my-6 md:my-8 block mx-auto max-w-full text-center clear-both">
                                    <img
                                        src={src || "/placeholder.svg"}
                                        alt={alt}
                                        className="max-w-auto h-auto max-h-56 md:max-h-[300px] lg:max-h-[350px] rounded-lg border border-gray-200 object-contain shadow-sm inline-block"
                                    />
                                </div>
                            )
                        }
                        return (
                            <img
                                src={src || "/placeholder.svg"}
                                alt={alt}
                                className="my-4 max-w-full lg:max-w-xl max-h-[400px] w-auto rounded-lg border object-contain shadow-sm block mx-auto"
                            />
                        )
                    }
                }

                // Existing tag token replacement against text nodes
                if (node.type !== "text") return undefined
                const text = node.data
                const matches = [...text.matchAll(tagRegex)]
                if (!matches.length) return undefined
                const parts = []
                let cursor = 0
                matches.forEach((m) => {
                    const match = m[0]
                    const offset = m.index
                    if (offset > cursor) parts.push(text.slice(cursor, offset))
                    occurrenceTracker[match] = (occurrenceTracker[match] || 0) + 1
                    const list = grouped[match] || []
                    const tagObj = list[occurrenceTracker[match] - 1] || list[0]
                    parts.push(createTagElement(tagObj, `${match}-${occurrenceTracker[match]}`) || match)
                    cursor = offset + match.length
                })
                if (cursor < text.length) parts.push(text.slice(cursor))
                return <>{parts.map((p, i) => (typeof p === "string" ? <span key={i}>{p}</span> : p))}</>
            },
        }

        return parse(html, options)
    }

    if (showSummary && summaryData) {
        return <ContentSummary summaryData={summaryData} onBack={() => setShowSummary(false)} />;
    }

    return (
        <div className="">
            {slideContent?.slide?.type === "video" ? (
                <div>
                    <div className="mx-auto">
                        {/* 65/35 Grid Layout - Responsive */}
                        <div className="grid grid-cols-1 lg:grid-cols-[60%_38%] h-auto gap-8 lg:gap-10 lg:h-[70vh]">
                            {/* Left Side - Video */}
                            <div className="lg:m-0 w-full">
                                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                                    {slideContent.slide.videoDetails?.type === "youtube" ? (
                                        <iframe
                                            className="w-full h-full rounded-lg"
                                            src={slideContent.slide.videoDetails.url.replace("youtu.be/", "www.youtube.com/embed/")}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <VideoPlayer
                                            fileUrl={`${mediaBase}${slideContent.slide.videoDetails?.url}`}
                                            onComplete={() => handleSlideCompleteLocal(activeSlideId || slideContent?.slide?.id)}
                                            isEmbedded={false}
                                            onPlayStateChange={(state) => {
                                                // bubble up as a DOM event so CourseContentDup can listen without changing many components
                                                window.dispatchEvent(new CustomEvent('VIDEO_PLAY_STATE_CHANGE', { detail: { state } }));
                                            }}
                                            isTopicCompleted={isTopicCompleted}
                                        />
                                    )}
                                </div>
                            </div>
                            {/* Right Side - Description */}
                            <div className="pb-0 md:pb-4 h-auto overflow-hidden mb-12 sm:mb-16 lg:mb-0">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl sm:text-xl md:text-2xl font-bold text-gray-900">
                                        {slideContent?.slide?.title}
                                    </h2>
                                </h3>
                                {slideContent?.slide?.description ? (
                                    <div
                                        className="overflow-y-auto lg:max-h-[calc(100%-3.5rem)] scrollbar-hide"
                                    >
                                        {processDescriptionWithTags(slideContent.slide.description)}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic">
                                        No description available for this slide.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                scrollbar-width: none;
                -ms-overflow-style: none;
            }
        `}</style>
                </div>

            )
                : slideContent?.slide?.type === "accordian" ? (
                    <div className="w-full sm:w-full mb-24 md:mb-16 ml-0 sm:mx-auto space-y-2 sm:space-y-3 md:space-y-5 lg:space-y-6">
                        <div className="bg-white rounded-md">
                            <h1 className="text-xl sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                                {slideContent?.slide?.title}
                            </h1>
                            {slideContent?.slide?.description && (
                                <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 mt-2 leading-relaxed">
                                    {processDescriptionWithTags(slideContent.slide.description)}
                                </div>
                            )}
                        </div>

                        {/* {slideContent?.slide?.completion_type === "timer" && (
                            <div className="flex justify-center mb-6 md:mb-8 px-4">
                                <CountdownTimer
                                    seconds={slideContent?.slide?.completion_time || 60}
                                    onComplete={() => handleSlideCompleteLocal(slideContent.slide.id)}
                                />
                            </div>
                        )} */}
                        {slideContent?.slide?.accordianDetails?.map((item, idx) => {
                            const isOpen = openId === item.id
                            const status = "in_progress" // Assume no locking for slide accordions
                            const isLocked = status === "not_started";

                            return (
                                <div
                                    key={idx}
                                    className={`group relative rounded-lg border border-gray-200/70 bg-white/70 backdrop-blur-sm shadow-sm transition ${isOpen ? 'ring-1 ring-primary/30 overflow-visible' : 'overflow-hidden'} ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {/* Accent bar */}
                                    <div className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out
                                     ${isOpen
                                            ? 'w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-lg'
                                            : 'w-1 bg-gradient-to-b from-gray-300 to-gray-200 rounded-l-md'
                                        }`}>
                                        {/* Inner glow effect */}
                                        {isOpen && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 blur-sm"></div>
                                        )}
                                    </div>

                                    {/* Header */}
                                    <button
                                        onClick={() => {
                                            if (isLocked) return;
                                            if (openId !== item.id) {
                                                toggleItem(item.id);
                                            } else {
                                                toggleItem(item.id);
                                            }
                                        }}
                                        aria-expanded={isOpen}
                                        aria-controls={`accordion-panel-${idx}`}
                                        className={`w-full pl-3 pr-2 py-3 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 transition ${isOpen ? 'bg-white/60' : 'bg-white/30'}`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-[10px] md:text-xs font-semibold tracking-wider uppercase text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <h3 className="text-sm md:text-base font-semibold text-gray-800 truncate">
                                                {item.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <span className={`text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded-full border ${isLocked ? 'border-gray-300 text-gray-400 bg-gray-50' : isOpen ? 'border-emerald-300 text-emerald-600 bg-emerald-50' : 'border-amber-300 text-amber-600 bg-amber-50'}`}>
                                                {isLocked ? 'Locked' : isOpen ? 'Open' : 'Ready'}
                                            </span>
                                            {isOpen ? (
                                                <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Body (Collapsible) */}
                                    {isOpen && !isLocked && (
                                        <div
                                            id={`accordion-panel-${idx}`}
                                            className="px-3 md:px-4 pb-3 pt-1.5 space-y-4 md:space-y-5 animate-in fade-in slide-in-from-top-2 duration-200 relative overflow-visible"
                                        >
                                            {/* Body */}
                                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed break-words">
                                                {processDescriptionWithTags(item.body || "")}
                                                <div className="w-full overflow-x-auto">
                                                    {item.code && <SimpleCodeBlock code={item.code} language={item.codeLanguage || "text"} />}
                                                </div>
                                                <div className="clear-both" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : slideContent?.slide?.type === "general" ? (
                    <div className="min-h-screen to-white">
                        <div className="mx-auto pb-24 sm:pb-16 lg:pb-16">

                            {/* Title Card */}
                            <div className="bg-white rounded-md">
                                <h1 className="text-xl sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                                    {slideContent?.slide?.title}
                                </h1>
                            </div>

                            {/* Content Card */}
                            <div className="bg-white rounded-md mt-4">
                                <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
                                    {slideContent?.slide?.description ? (
                                        processDescriptionWithTags(slideContent.slide.description)
                                    ) : (
                                        <p className="text-gray-500 italic">No content available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                About this slide
                            </h3>
                            <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                {slideContent?.slide?.description ? (
                                    <div className="prose prose-slate max-w-none">
                                        {processDescriptionWithTags(slideContent.slide.description)}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic">No description available for this slide.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {/* Fullscreen Code Modal */}
            {fullScreenCode && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="bg-gray-900 w-full max-w-5xl h-[90vh] rounded-xl flex flex-col shadow-2xl border border-gray-700">
                        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-gray-800 border-b border-gray-700 rounded-t-xl">
                            <span className="text-sm md:text-base font-semibold text-gray-200">
                                {fullScreenCode.language || "code"}
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(fullScreenCode.code || "")
                                        setCopiedKey('fullscreen')
                                        setTimeout(() => setCopiedKey(null), 1500)
                                    }}
                                    className={`text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-all ${copiedKey === 'fullscreen' ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-100 hover:bg-gray-600"}`}
                                >
                                    {copiedKey === 'fullscreen' ? "✓ Copied" : "Copy"}
                                </button>
                                <button
                                    onClick={() => setFullScreenCode(null)}
                                    className="text-gray-400 hover:text-white transition-colors p-1"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-2 md:p-4 bg-[#282a36]">
                            <SyntaxHighlighter
                                language={fullScreenCode.language || "javascript"}
                                style={dracula}
                                customStyle={{
                                    margin: 0,
                                    background: "transparent",
                                    fontSize: "15px",
                                }}
                                wrapLongLines={true}
                                wrapLines={true}
                                lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                                codeTagProps={{ style: { wordBreak: 'break-word', whiteSpace: 'pre-wrap' } }}
                            >
                                {fullScreenCode.code || ""}
                            </SyntaxHighlighter>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}