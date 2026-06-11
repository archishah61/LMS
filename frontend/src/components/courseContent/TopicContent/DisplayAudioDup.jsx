/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState , useEffect} from "react";
import parse, { domToReact } from "html-react-parser";
import SyntaxHighlighter from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function DisplayAudioDup({ detailedTopicData, handleMarkTopicCompleted }) {
    const [copiedKey, setCopiedKey] = useState(null);
    const [fullScreenCode, setFullScreenCode] = useState(null);
    const descriptionScrollRef = React.useRef(null);

    // Scroll to top when audio content changes
    useEffect(() => {
        window.scrollTo(0, 0);
        // Also reset the description sidebar scroll
        if (descriptionScrollRef.current) {
            descriptionScrollRef.current.scrollTop = 0;
        }
    }, [detailedTopicData?.topic?.id]);

    if (!detailedTopicData) return null;

    const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || "";
    const { description, audioDetails } = detailedTopicData.topic || {};
    const audio = audioDetails?.[0];

    const hasImage = audio?.image_url;

    // === DESCRIPTION PARSER ===
    const processDescriptionWithTags = (html) => {
        if (!html) return null;
        if (/<!?DOCTYPE|<html/i.test(html)) {
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch?.[1]) html = bodyMatch[1];
            html = html.replace(/<head[\s\S]*?<\/head>/i, "");
        }

        const hasLists = /<(ul|ol)[^>]*>/i.test(html);
        const tagRegex = /#[^#\s]+#/g;
        const topicTags = Array.isArray(detailedTopicData.topic.TopicTags)
            ? detailedTopicData.topic.TopicTags
            : [];
        const grouped = topicTags.reduce((acc, t) => {
            if (!t?.tag) return acc;
            acc[t.tag] = acc[t.tag] ? [...acc[t.tag], t] : [t];
            return acc;
        }, {});
        const occurrenceTracker = {};
        const isImageExt = (p) => /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(p || "");

        const createTagElement = (tagObj, key) => {
            if (!tagObj)
                return (
                    <span key={key} className="inline-flex items-center px-2 py-1 text-xs md:text-sm rounded bg-gray-100 text-gray-500">
                        #missing-tag#
                    </span>
                );
            const fileUrl = `${mediaBase}${tagObj.tag_file_path || "/placeholder.png"}`;

            switch (tagObj.tag_file_type) {
                case "image":
                    return (
                        <div key={key} className="my-4 block mx-auto max-w-full text-center">
                            <div className="relative group inline-block">
                                <img
                                    src={fileUrl || "/placeholder.svg"}
                                    alt={tagObj.tag}
                                    className="max-w-auto h-auto max-h-52 md:max-h-[280px] lg:max-h-[250px] rounded-lg border border-gray-200 object-contain shadow-sm block mx-auto"
                                />
                                <p className="mt-2 text-[10px] md:text-xs font-mono text-black text-center">{tagObj.tag?.replace(/#/g, "")}</p>
                            </div>
                        </div>
                    );
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
                                            navigator.clipboard.writeText(tagObj.tag_file_path || "");
                                            setCopiedKey(key);
                                            setTimeout(() => setCopiedKey(null), 1500);
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
                                >
                                    {tagObj.tag_file_path || ""}
                                </SyntaxHighlighter>
                            </div>
                            <div className="bg-gray-800 px-4 py-1 border-t border-gray-700 text-center">
                                <p className="text-[10px] md:text-xs font-mono text-white">{tagObj.tag?.replace(/#/g, "")}</p>
                            </div>
                        </div>
                    );
                default:
                    if (isImageExt(tagObj.tag_file_path)) {
                        return (
                            <div key={key} className="my-4 block mx-auto max-w-full text-center">
                                <div className="relative group inline-block">
                                    <img
                                        src={fileUrl || "/placeholder.svg"}
                                        alt={tagObj.tag}
                                        className="max-w-auto h-auto max-h-56 md:max-h-[300px] lg:max-h-[350px] rounded-lg border border-gray-200 object-contain shadow-sm block mx-auto"
                                    />
                                    <p className="mt-2 text-[10px] md:text-xs font-mono text-black text-center">{tagObj.tag?.replace(/#/g, "")}</p>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <button
                            key={key}
                            onClick={() => window.open(fileUrl, "_blank", "noopener")}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm md:text-base rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200 font-medium transition-all hover:shadow-md mr-2 mb-2"
                        >
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            View File
                        </button>
                    );
            }
        };

        const options = {
            replace: (node) => {
                if (node.type === "tag") {
                    const { name, children, attribs = {} } = node;
                    const commonText = "text-gray-800 leading-relaxed";

                    if (name === "p") {
                        return (
                            <p className={`mb-4 md:mb-5 ${commonText} text-base md:text-lg`}>
                                {domToReact(children, options)}
                            </p>
                        );
                    }
                    if (name === "h1") {
                        return (
                            <h1 className="mt-8 mb-4 md:mt-10 md:mb-6 text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                                {domToReact(children, options)}
                            </h1>
                        );
                    }
                    if (name === "h2") {
                        return (
                            <h2 className="mt-6 mb-3 md:mt-8 md:mb-4 text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                {domToReact(children, options)}
                            </h2>
                        );
                    }
                    if (name === "h3") {
                        return (
                            <h3 className="mt-5 mb-3 md:mt-6 md:mb-4 text-xl md:text-2xl font-semibold text-gray-900">
                                {domToReact(children, options)}
                            </h3>
                        );
                    }
                    if (name === "h4") {
                        return (
                            <h4 className="mt-4 mb-2 md:mt-5 md:mb-3 text-lg md:text-xl font-semibold text-gray-900">
                                {domToReact(children, options)}
                            </h4>
                        );
                    }
                    if (name === "ul") {
                        return (
                            <ul className="my-4 md:my-5 space-y-2 pl-6 list-none">
                                {domToReact(children, options)}
                            </ul>
                        );
                    }
                    if (name === "ol") {
                        return (
                            <ol className="my-4 md:my-5 space-y-2 pl-6 list-decimal marker:text-blue-600 marker:font-semibold">
                                {domToReact(children, options)}
                            </ol>
                        );
                    }
                    if (name === "li") {
                        return (
                            <li className={`${commonText} text-base md:text-lg relative pl-6 before:content-['•'] before:absolute before:left-0 before:text-blue-600 before:font-bold before:text-xl`}>
                                {domToReact(children, options)}
                            </li>
                        );
                    }
                    if (name === "a") {
                        const href = attribs.href || "#";
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline decoration-2 underline-offset-2 hover:text-blue-700 hover:decoration-blue-700 transition-colors font-medium"
                            >
                                {domToReact(children, options)}
                            </a>
                        );
                    }
                    if (name === "strong" || name === "b") {
                        return (
                            <strong className="font-bold text-gray-900">
                                {domToReact(children, options)}
                            </strong>
                        );
                    }
                    if (name === "em" || name === "i") {
                        return (
                            <em className="italic text-gray-700">
                                {domToReact(children, options)}
                            </em>
                        );
                    }
                    if (name === "blockquote") {
                        return (
                            <blockquote className="border-l-4 border-blue-500 pl-4 md:pl-6 py-2 md:py-3 italic text-gray-700 bg-blue-50 rounded-r-lg my-4 md:my-5">
                                {domToReact(children, options)}
                            </blockquote>
                        );
                    }
                    if (name === "pre") {
                        return (
                            <pre className="my-6 md:my-8 rounded-lg bg-gray-900 text-gray-100 p-4 md:p-6 overflow-x-auto text-sm md:text-base border border-gray-700 shadow-sm">
                                {domToReact(children, options)}
                            </pre>
                        );
                    }
                    if (name === "code") {
                        return (
                            <code className="px-2 py-0.5 rounded bg-gray-100 text-pink-600 font-mono text-sm border border-gray-200">
                                {domToReact(children, options)}
                            </code>
                        );
                    }
                    if (name === "table") {
                        return (
                            <div className="my-6 md:my-8 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                <table className="w-full border-collapse text-sm md:text-base">
                                    {domToReact(children, options)}
                                </table>
                            </div>
                        );
                    }
                    if (name === "thead") {
                        return (
                            <thead className="bg-gray-50 border-b border-gray-200">
                                {domToReact(children, options)}
                            </thead>
                        );
                    }
                    if (name === "th") {
                        return (
                            <th className="px-4 py-3 md:px-6 md:py-4 text-left font-semibold text-gray-900">
                                {domToReact(children, options)}
                            </th>
                        );
                    }
                    if (name === "td") {
                        return (
                            <td className="border-b border-gray-100 px-4 py-3 md:px-6 md:py-4 text-gray-800">
                                {domToReact(children, options)}
                            </td>
                        );
                    }
                    if (name === "hr") {
                        return <hr className="my-8 md:my-10 border-t border-gray-200" />;
                    }
                    if (name === "img") {
                        const src = attribs ? attribs.src || "/placeholder.svg" : "/placeholder.svg";
                        const alt = attribs ? attribs.alt || "image" : "image";
                        return (
                            <div className="my-6 md:my-8 block mx-auto max-w-full text-center clear-both">
                                <img
                                    src={src}
                                    alt={alt}
                                    className="max-w-auto h-auto max-h-56 md:max-h-[300px] lg:max-h-[350px] rounded-lg border border-gray-200 object-contain shadow-sm block mx-auto"
                                />
                            </div>
                        );
                    }
                }

                if (node.type !== "text") return undefined;
                const text = node.data;
                const matches = [...text.matchAll(tagRegex)];
                if (!matches.length) return undefined;
                const parts = [];
                let cursor = 0;
                matches.forEach((m) => {
                    const match = m[0];
                    const offset = m.index;
                    if (offset > cursor) parts.push(text.slice(cursor, offset));
                    occurrenceTracker[match] = (occurrenceTracker[match] || 0) + 1;
                    const list = grouped[match] || [];
                    const tagObj = list[occurrenceTracker[match] - 1] || list[0];
                    parts.push(
                        createTagElement(tagObj, `${match}-${occurrenceTracker[match]}`) || match
                    );
                    cursor = offset + match.length;
                });
                if (cursor < text.length) parts.push(text.slice(cursor));
                return (
                    <>
                        {parts.map((p, i) =>
                            typeof p === "string" ? <span key={i}>{p}</span> : p
                        )}
                    </>
                );
            },
        };

        return parse(html, options);
    };

    return (
        <div className="">
            <div className="mx-auto">
                {hasImage ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Image Section */}
                        <div className="w-full lg:sticky lg:top-8">
                            <div className="relative w-full h-[400px] rounded-lg overflow-hidden shadow-md bg-gray-900">
                                {/* Darkened Background */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center grayscale"
                                    style={{
                                        backgroundImage: `url(${mediaBase}${audio.image_url || "/placeholder.png"})`
                                    }}
                                />
                                {/* Main Image */}
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <img
                                        src={`${mediaBase}${audio.image_url || "/placeholder.png"}`}
                                        alt="Audio Thumbnail"
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="w-full">
                            <div
                                ref={descriptionScrollRef}
                                className="bg-white rounded-lg p-6 md:p-8 max-h-[600px] overflow-y-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                            >
                                <div className="prose prose-base max-w-none">
                                    {description && processDescriptionWithTags(description)}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        <div
                            ref={descriptionScrollRef}
                            className="bg-white rounded-lg max-h-[600px] overflow-y-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            <div className="prose prose-base max-w-none">
                                {description && processDescriptionWithTags(description)}
                            </div>
                        </div>
                    </div>
                )}
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