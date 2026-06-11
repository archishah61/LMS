/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from "react";
import parse, { domToReact } from 'html-react-parser';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCreateAccordianProgressRecordsForTopicMutation, useGetAccordianStatusByTopicIdQuery, useTrackStudentTimeSpentOnTopicMutation, useUpdateAccrodianCompletionStatusMutation } from "../../../services/progressTracking/newProgressTrackingApi";

export default function DisplayAccordionDup({
    detailedTopicData,
    accordianStatusData,
    openIndex,
    setOpenIndex,
    userId,
    courseId,
    currentModule,
    currentSession,
    access_token,
    onAudioChange,
    onTimerChange,
    setCurrentAccordionId
}) {
    // First accordion open by default
    const [copiedKey, setCopiedKey] = useState(null);
    const [fullScreenCode, setFullScreenCode] = useState(null);

    const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || "";

    const [timeSpent, setTimeSpent] = useState(0);
    const [prevAccordionId, setPrevAccordionId] = useState(null);

    const [trackStudentTimeSpentOnTopic] = useTrackStudentTimeSpentOnTopicMutation();

    const [updateAccordionStatus] = useUpdateAccrodianCompletionStatusMutation();
    const [createAccordianProgressRecordsForTopic] = useCreateAccordianProgressRecordsForTopicMutation();

    // Scroll to top when accordion content changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [detailedTopicData?.topic?.id]);

    useEffect(() => {
        if (!detailedTopicData?.topic?.accordianDetails) return;

        detailedTopicData?.topic?.accordianDetails?.forEach((acc, index) => {
            createAccordianProgressRecordsForTopic({
                userId,
                courseId,
                sessionId: currentSession?.id,
                moduleId: currentModule?.id,
                topicId: detailedTopicData?.topic?.id,
                accordianId: acc.id,   // ✅ store accordianId
                timeSpent: 0,
                timer_time: 0,
                access_token,
                completion_status: index === 0 ? "in_progress" : "not_started", // ✅ first one in_progress
            });
        });
    }, [
        detailedTopicData,
        userId,
        courseId,
        currentSession?.id,
        currentModule?.id,
        access_token,
        createAccordianProgressRecordsForTopic
    ]);

    useEffect(() => {
        if (openIndex === null) return;

        const currentAccordionId = detailedTopicData?.topic?.accordianDetails?.[openIndex]?.id;
        if (!currentAccordionId) return;

        // reset timer when accordion changes
        setTimeSpent(0);

        let interval = null;

        const startTimer = () => {
            if (!interval) {
                interval = setInterval(() => {
                    setTimeSpent((t) => {
                        const newTime = t + 1; return newTime;
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

        // pause/resume on tab change
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopTimer();
            } else {
                startTimer();
            }
        };

        // start immediately
        startTimer();

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            stopTimer();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [openIndex, detailedTopicData]);


    // ⏱️ API call when accordion changes
    useEffect(() => {

        const statusObj = accordianStatusData?.accordianStatus?.find(
            (s) => s.accordian_id === prevAccordionId
        );

        if (prevAccordionId && openIndex !== null) {
            const currentAccordionId = detailedTopicData?.topic?.accordianDetails?.[openIndex]?.id;

            if (currentAccordionId && prevAccordionId !== currentAccordionId) {
                trackStudentTimeSpentOnTopic({
                    userId,
                    courseId,
                    sessionId: currentSession.id,
                    moduleId: currentModule.id,
                    topicId: detailedTopicData.topic.id,
                    accordianId: prevAccordionId,
                    slideId: null, // since this is accordion, not slide
                    timeSpent: timeSpent,
                    timer_time: 0,
                    access_token,
                    completion_status: null,
                    finalize_first_completion: statusObj.status === "completed" || false,
                });
            }
        } else if (prevAccordionId) {
            const lastAccordianId = detailedTopicData.topic.accordianDetails?.at(-1)?.id;

            if (lastAccordianId && lastAccordianId === prevAccordionId) {

                trackStudentTimeSpentOnTopic({
                    userId,
                    courseId,
                    sessionId: currentSession.id,
                    moduleId: currentModule.id,
                    topicId: detailedTopicData.topic.id,
                    accordianId: prevAccordionId,
                    slideId: null, // since this is accordion, not slide
                    timeSpent: timeSpent,
                    timer_time: 0,
                    access_token,
                    completion_status: null,
                    finalize_first_completion: statusObj.status === "completed" || false,
                });
            }
        }

        if (openIndex !== null) {
            const newAccordionId = detailedTopicData?.topic?.accordianDetails?.[openIndex]?.id;
            setPrevAccordionId(newAccordionId);
        }
    }, [openIndex]);

    useEffect(() => {
        if (openIndex === 0 && detailedTopicData?.topic?.accordianDetails?.[0]) {
            const firstAcc = detailedTopicData.topic.accordianDetails[0];

            setCurrentAccordionId?.(firstAcc?.id || null);
            setPrevAccordionId(firstAcc?.id || null);

            // Audio
            if (firstAcc?.audio_url || firstAcc?.audioUrl) {
                onAudioChange?.(`${mediaBase}${firstAcc.audio_url || firstAcc.audioUrl}`);
            } else {
                onAudioChange?.(null);
            }

            // Timer - only show if completion_type is 'timer'
            if (firstAcc?.completion_type === 'timer' && firstAcc?.completion_time) {
                onTimerChange?.(firstAcc.completion_time);
            } else {
                onTimerChange?.(null);
            }
        }
    }, [detailedTopicData, openIndex]);

    const handleToggle = (idx) => {
        const newIndex = openIndex === idx ? null : idx;
        setOpenIndex(newIndex);

        if (newIndex !== null) {
            const acc = detailedTopicData?.topic?.accordianDetails?.[newIndex];
            setCurrentAccordionId(acc?.id || null);

            // Handle Audio
            if (acc?.audio_url || acc?.audioUrl) {
                onAudioChange?.(`${mediaBase}${acc.audio_url || acc.audioUrl}`);
            } else {
                onAudioChange?.(null);
            }

            // Handle Timer - only show if completion_type is 'timer'
            if (acc?.completion_type === 'timer' && acc?.completion_time) {
                onTimerChange?.(acc.completion_time);
            } else {
                onTimerChange?.(null);
            }

        } else {
            onAudioChange?.(null);
            onTimerChange?.(null);
        }
    };



    const processDescriptionWithTags = (html) => {
        if (!html) return null

        // Trim full-document wrappers
        if (/<!?DOCTYPE|<html/i.test(html)) {
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
            if (bodyMatch?.[1]) html = bodyMatch[1]
            html = html.replace(/<head[\s\S]*?<\/head>/i, "")
        }

        const hasLists = /<(ul|ol)[^>]*>/i.test(html)

        const tagRegex = /#[^#\s]+#/g
        const topicTags = Array.isArray(detailedTopicData?.topic?.TopicTags) ? detailedTopicData.topic.TopicTags : []
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
                    }
                    return (
                        <button
                            key={key}
                            onClick={() => window.open(fileUrl, "_blank", "noopener")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium mr-2 mb-2"
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
                        return <p className={`mb-3 leading-relaxed ${commonText}`}>{domToReact(children, options)}</p>
                    }
                    if (name === "h1") {
                        return <h1 className="mt-4 mb-3 text-2xl font-semibold text-gray-900">{domToReact(children, options)}</h1>
                    }
                    if (name === "h2") {
                        return <h2 className="mt-4 mb-2 text-xl font-semibold text-gray-900">{domToReact(children, options)}</h2>
                    }
                    if (name === "h3") {
                        return <h3 className="mt-3 mb-2 text-lg font-semibold text-gray-900">{domToReact(children, options)}</h3>
                    }
                    if (name === "ul") {
                        return <ul className="my-3 list-disc pl-5 space-y-2">{domToReact(children, options)}</ul>
                    }
                    if (name === "ol") {
                        return <ol className="my-3 list-decimal pl-5 space-y-2">{domToReact(children, options)}</ol>
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
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-3">
                                {domToReact(children, options)}
                            </blockquote>
                        )
                    }
                    if (name === "pre") {
                        return (
                            <pre className="my-4 rounded-lg bg-gray-900 text-gray-100 p-4 overflow-auto text-xs">
                                {domToReact(children, options)}
                            </pre>
                        )
                    }
                    if (name === "code") {
                        return (
                            <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">{domToReact(children, options)}</code>
                        )
                    }
                    if (name === "table") {
                        return (
                            <div className="my-4 overflow-auto">
                                <table className="w-full border-collapse text-sm">{domToReact(children, options)}</table>
                            </div>
                        )
                    }
                    if (name === "th") {
                        return (
                            <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-900">
                                {domToReact(children, options)}
                            </th>
                        )
                    }
                    if (name === "td") {
                        return (
                            <td className="border border-gray-200 px-3 py-2 align-top text-gray-800">
                                {domToReact(children, options)}
                            </td>
                        )
                    }
                    if (name === "img") {
                        const src = attribs.src || "/placeholder.svg"
                        const alt = attribs.alt || "image"
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



    return (
        <div className="w-full sm:w-full ml-0 mb-12 pb-12 space-y-2 sm:space-y-3 md:space-y-5 lg:space-y-6">
            {detailedTopicData?.topic?.accordianDetails?.map((item, idx) => {
                // Get status from API data
                const statusObj = accordianStatusData?.accordianStatus?.find(
                    (s) => s.accordian_id === item.id
                );
                const status = statusObj?.status || "not_started";
                const isLocked = status === "not_started";

                return (
                    <div
                        key={idx}
                        className={`group relative rounded-lg border border-gray-200/70 bg-white/70 backdrop-blur-sm shadow-sm transition ${openIndex === idx ? 'ring-1 ring-primary/30 overflow-visible' : 'overflow-hidden'} ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {/* Accent bar */}
                        <div className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out
                         ${openIndex === idx
                                ? 'w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-lg'
                                : 'w-1 bg-gradient-to-b from-gray-300 to-gray-200 rounded-l-md'
                            }`}>
                            {/* Inner glow effect */}
                            {openIndex === idx && (
                                <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 blur-sm"></div>
                            )}
                        </div>

                        {/* Header */}
                        <button
                            onClick={() => {
                                if (isLocked) return;
                                if (openIndex !== idx) {
                                    handleToggle(idx);
                                } else {
                                    handleToggle(idx);
                                    setCurrentAccordionId(null);
                                }
                            }}
                            aria-expanded={openIndex === idx}
                            aria-controls={`accordion-panel-${idx}`}
                            className={`w-full pl-3 pr-2 py-3 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 transition ${openIndex === idx ? 'bg-white/60' : 'bg-white/30'}`}
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
                                <span className={`text-[10px] md:text-xs font-medium px-1.5 py-0.5 rounded-full border ${isLocked ? 'border-gray-300 text-gray-400 bg-gray-50' : openIndex === idx ? 'border-emerald-300 text-emerald-600 bg-emerald-50' : 'border-amber-300 text-amber-600 bg-amber-50'}`}>
                                    {isLocked ? 'Locked' : openIndex === idx ? 'Open' : 'Ready'}
                                </span>
                                {openIndex === idx ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                )}
                            </div>
                        </button>

                        {/* Body (Collapsible) */}
                        {openIndex === idx && !isLocked && (
                            <div
                                id={`accordion-panel-${idx}`}
                                className="px-3 md:px-4 pb-3 pt-1.5 space-y-4 md:space-y-5 animate-in fade-in slide-in-from-top-2 duration-200 relative overflow-visible"
                            >
                                {/* Body */}
                                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed break-words">
                                    {processDescriptionWithTags(item.body || "")}
                                    <div className="clear-both" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

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
        </div>
    );
}