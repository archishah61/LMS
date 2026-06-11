/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import parse, { domToReact } from 'html-react-parser';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import VideoPlayer from '../../ui/VideoPlayer';
import { FileText } from 'lucide-react';

export default function DisplayVideoContentDup({
    detailedTopicData,
    handleMarkTopicCompleted,
    isNavbarHidden,
    isTopicCompleted
}) {

    const descriptionScrollRef = React.useRef(null);

    // Scroll to top when video content changes
    useEffect(() => {
        window.scrollTo(0, 0);
        // Also reset the description sidebar scroll
        if (descriptionScrollRef.current) {
            descriptionScrollRef.current.scrollTop = 0;
        }
    }, [detailedTopicData?.topic?.id]);

    // console.log("detailedTopicData",detailedTopicData)
    const [copiedKey, setCopiedKey] = React.useState(null);
    const [fullScreenCode, setFullScreenCode] = React.useState(null);
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
                                className={
                                    hasLists
                                        ? "my-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm block"
                                        : "float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
                                }
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
                                    key={key}
                                    src={fileUrl || "/placeholder.svg"}
                                    alt={tagObj.tag}
                                    className={
                                        hasLists
                                            ? "my-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm block"
                                            : "float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
                                    }
                                />
                                <p className="mt-2 text-[10px] md:text-xs font-mono text-black">{tagObj.tag?.replace(/#/g, "")}</p>
                            </div>
                        )
                    }
                    return (
                        <button
                            key={key}
                            onClick={() => window.open(fileUrl, "_blank", "noopener")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-colors mr-2 mb-2"
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
                                className="text-blue-600 underline hover:text-blue-700"
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
                                className={
                                    hasLists
                                        ? "my-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm block"
                                        : "float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
                                }
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
    
    // Function to extract YouTube video ID from URL
    const getYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Function to render video based on type
    const renderVideo = () => {
        const videoDetails = detailedTopicData?.topic?.videoDetails?.[0];
        if (!videoDetails) {
            return (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No video content available</p>
                </div>
            );
        }

        if (videoDetails.video_type === 'youtube') {
            const videoId = getYouTubeVideoId(videoDetails.url);
            if (videoId) {
                return (
                    <iframe
                        className="w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                );
            } else {
                return (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Invalid YouTube URL</p>
                    </div>
                );
            }
        } else if (videoDetails.video_type === 'internal') {
            return (
                <VideoPlayer
                    fileUrl={`${mediaBase}${videoDetails.url}`}
                    onComplete={handleMarkTopicCompleted}
                    isEmbedded={false}
                    isTopicCompleted={isTopicCompleted}
                    onPlayStateChange={(state) => {
                        // bubble up as a DOM event so CourseContentDup can listen without changing many components
                        window.dispatchEvent(new CustomEvent('VIDEO_PLAY_STATE_CHANGE', { detail: { state } }));
                    }}
                />
            );
        }
    };

    return (
        <div className={`lg:mb-16`}>
            <div className=" mx-auto">
                {/* 65/35 Grid Layout - Responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-[60%_38%] h-auto gap-8 lg:gap-10 lg:h-[70vh]">
                    {/* Left Side - Video */}
                    <div className="lg:m-0 w-full">
                        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
                            {renderVideo()}
                        </div>
                    </div>
                    {/* Right Side - Description */}
                    <div className="pb-0 md:pb-4 h-auto overflow-hidden mb-12 sm:mb-16 lg:mb-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            About this Video
                        </h3>
                        <div
                            ref={descriptionScrollRef}
                            className="overflow-y-auto lg:max-h-[calc(100%-3.5rem)] scrollbar-hide"
                        >
                            {processDescriptionWithTags(detailedTopicData?.topic?.description)}
                        </div>
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