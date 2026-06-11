/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import parse, { domToReact } from 'html-react-parser';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import AudioPlayer from "../../ui/audioPlayer";
import { FileText } from "lucide-react";

export default function DisplayGeneralDup({ detailedTopicData, handleMarkTopicCompleted }) {
    const [copiedKey, setCopiedKey] = useState(null);
    const [contentHeight, setContentHeight] = useState('auto');
    const contentRef = useRef(null);
    const [fullScreenCode, setFullScreenCode] = useState(null);

    // Scroll to top when general content changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [detailedTopicData?.topic?.id]);

    // console.log("detailedTopicData",detailedTopicData)
    useEffect(() => {
        // Calculate if content actually needs scrolling
        const checkContentHeight = () => {
            if (contentRef.current) {
                const contentHeight = contentRef.current.scrollHeight;
                const containerHeight = contentRef.current.clientHeight;
                const viewportHeight = window.innerHeight;

                // If content is shorter than viewport, set height to auto
                // If content is taller than viewport, use min-h-screen
                if (contentHeight < viewportHeight - 100) { // 100px buffer
                    setContentHeight('auto');
                } else {
                    setContentHeight('min-h-screen');
                }
            }
        };

        checkContentHeight();
        window.addEventListener('resize', checkContentHeight);

        // Re-check after content is fully loaded
        const timer = setTimeout(checkContentHeight, 100);

        return () => {
            window.removeEventListener('resize', checkContentHeight);
            clearTimeout(timer);
        };
    }, [detailedTopicData]);

    if (!detailedTopicData?.topic?.generalDetails?.length) return null;
    const general = detailedTopicData.topic.generalDetails[0];
    const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || "";

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
        const topicTags = Array.isArray(detailedTopicData.topic.TopicTags) ? detailedTopicData.topic.TopicTags : []
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
                    <span key={key} className="inline-flex items-center px-2 py-1 text-xs md:text-sm rounded bg-gray-100 text-gray-500">
                        #missing-tag#
                    </span>
                )
            const fileUrl = `${mediaBase}${tagObj.tag_file_path || "/placeholder.png"}`
            switch (tagObj.tag_file_type) {
                case "image":
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
                case "code":
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
                                        className={`
                                            text-[10px] md:text-xs px-2 py-1 md:px-3 md:py-1.5 rounded-md font-medium transition-all
                                            ${copiedKey === key
                                                ? "bg-emerald-600 text-white"
                                                : "bg-gray-700 text-gray-100 hover:bg-gray-600"
                                            }
                                        `}
                                    >
                                        {copiedKey === key ? "✓ Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>

                            {/* Code content with SyntaxHighlighter */}
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
                default:
                    if (isImageExt(tagObj.tag_file_path)) {
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
                        <button
                            key={key}
                            onClick={() => window.open(fileUrl, "_blank", "noopener")}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-all shadow-sm active:scale-95 mr-2 mb-2"
                        >
                            <FileText className="w-4 h-4" />
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
                        return <p className={`mb-4 leading-relaxed text-base md:text-base ${commonText}`}>{domToReact(children, options)}</p>
                    }
                    if (name === "h1") {
                        return <h1 className="mt-6 mb-4 text-2xl sm:text-3xl md:text-3xl font-bold text-gray-900 leading-tight">{domToReact(children, options)}</h1>
                    }
                    if (name === "h2") {
                        return <h2 className="mt-5 mb-3 text-xl sm:text-2xl md:text-2xl font-semibold text-gray-900 leading-tight">{domToReact(children, options)}</h2>
                    }
                    if (name === "h3") {
                        return <h3 className="mt-4 mb-3 text-lg sm:text-xl md:text-xl font-semibold text-gray-900">{domToReact(children, options)}</h3>
                    }
                    if (name === "ul") {
                        return <ul className="my-4 list-disc pl-5 space-y-2.5 text-base md:text-base">{domToReact(children, options)}</ul>
                    }
                    if (name === "ol") {
                        return <ol className="my-4 list-decimal pl-5 space-y-2.5 text-base md:text-base">{domToReact(children, options)}</ol>
                    }
                    if (name === "li") {
                        return <li className={`${commonText} leading-relaxed`}>{domToReact(children, options)}</li>
                    }
                    if (name === "a") {
                        const href = attribs.href || "#"
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-700 font-medium break-words"
                            >
                                {domToReact(children, options)}
                            </a>
                        )
                    }
                    if (name === "blockquote") {
                        return (
                            <blockquote className="border-l-4 border-blue-500 pl-4 pr-2 py-2 italic text-gray-700 my-4 bg-gray-50 rounded-r-lg">
                                {domToReact(children, options)}
                            </blockquote>
                        )
                    }
                    if (name === "pre") {
                        return (
                            <div className="my-4 overflow-x-auto">
                                <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 text-sm md:text-sm min-w-full">
                                    {domToReact(children, options)}
                                </pre>
                            </div>
                        )
                    }
                    if (name === "code") {
                        return (
                            <code className="px-2 py-0.5 rounded bg-gray-100 text-red-600 text-sm md:text-sm font-mono border border-gray-200">
                                {domToReact(children, options)}
                            </code>
                        )
                    }
                    if (name === "table") {
                        return (
                            <div className="my-4 overflow-x-auto -mx-2 sm:mx-0 md:mx-0">
                                <table className="min-w-full border-collapse text-sm md:text-sm border border-gray-200 rounded-lg overflow-hidden">
                                    {domToReact(children, options)}
                                </table>
                            </div>
                        )
                    }
                    if (name === "th") {
                        return (
                            <th className="border border-gray-200 bg-gray-100 px-3 py-2.5 md:px-4 md:py-3 text-left font-semibold text-gray-900">
                                {domToReact(children, options)}
                            </th>
                        )
                    }
                    if (name === "td") {
                        return (
                            <td className="border border-gray-200 px-3 py-2.5 md:px-4 md:py-3 align-top text-gray-800 bg-white">
                                {domToReact(children, options)}
                            </td>
                        )
                    }
                    if (name === "img") {
                        const src = attribs.src || "/placeholder.svg"
                        const alt = attribs.alt || "image"
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
        <div
            ref={contentRef}
            className={`${contentHeight}`}
        >
            <div className="mx-auto pb-24 sm:pb-16 lg:pb-16">
                {/* Title Card */}
                <div className="bg-white rounded-md">
                    <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                        {general.title}
                    </h1>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-md mt-4">
                    <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
                        {general.description ? processDescriptionWithTags(general.description) : (
                            <p className="text-gray-500 italic">No content available</p>
                        )}
                    </div>
                </div>
            </div>

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