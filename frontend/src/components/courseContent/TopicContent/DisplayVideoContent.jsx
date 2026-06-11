/* eslint-disable react/prop-types */
"use client"
import { useEffect, useState } from "react"
import parse, { domToReact } from "html-react-parser"
import VideoPlayer from "../../ui/VideoPlayer"
import AudioPlayer from "../../ui/audioPlayer"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism"

// Clean rewritten component with inline tag rendering (images, code blocks, file buttons)
export default function DisplayVideoContent({ topicData, handleTopicEnd, completedTopics }) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)
  const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || ""
  useEffect(() => {
    setIsCompleted(!!completedTopics[topicData.id])
  }, [completedTopics, topicData.id])

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
    const topicTags = Array.isArray(topicData.TopicTags) ? topicData.TopicTags : []
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
          )
        case "code":
          return (
            <div
              key={key}
              className="relative my-4 border rounded-xl overflow-hidden bg-gray-900 shadow not-prose clear-both"
            >
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tagObj.tag_file_path || "")
                  setCopiedKey(key)
                  setTimeout(() => setCopiedKey(null), 1500)
                }}
                className={`absolute top-2 right-2 text-[11px] px-2 py-1 rounded-md font-medium transition-all ${copiedKey === key ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-100 hover:bg-gray-600"
                  }`}
              >
                {copiedKey === key ? "Copied" : "Copy"}
              </button>
              <SyntaxHighlighter
                language={tagObj.code_language || "javascript"}
                style={dracula}
                customStyle={{ margin: 0, padding: "1rem", fontSize: "13px" }}
              >
                {tagObj.tag_file_path || ""}
              </SyntaxHighlighter>
            </div>
          )
        default:
          if (isImageExt(tagObj.tag_file_path)) {
            return (
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

  return (
    <div className="mx-auto bg-white">
      {topicData?.content_type === "video" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="md:col-span-1 lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {topicData.Video?.url ? (
                <>
                  {topicData.Video.video_type === "internal" ? (
                    <VideoPlayer
                      fileUrl={`${mediaBase}${topicData.Video?.url}`}
                      onComplete={() => handleTopicEnd(topicData.id, topicData.module_id)}
                      isEmbedded={false}
                    />
                  ) : topicData.Video.video_type === "youtube" ? (
                    <div className="w-full">
                      <div className="relative bg-black rounded-t-xl overflow-hidden" style={{ paddingTop: "56.25%" }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${(() => {
                            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
                            const match = topicData.Video.url.match(regExp)
                            return match && match[2].length === 11 ? match[2] : ""
                          })()}?autoplay=0&controls=1&rel=0`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="YouTube video player"
                        ></iframe>
                      </div>
                      <div className="p-6 bg-white border-t border-gray-100">
                        <button
                          onClick={() => handleTopicEnd(topicData.id, topicData.module_id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg text-sm transition-all"
                        >
                          Mark as Completed
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="relative bg-gray-50 rounded-xl overflow-hidden" style={{ paddingTop: "56.25%" }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Video not available</h3>
                    <p className="text-gray-500 text-center text-sm max-w-sm leading-relaxed">
                      The video content is currently unavailable.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {topicData.description && (
            <div className="md:col-span-1 lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                </div>
                <div className="p-6 h-full">
                  <div
                    className="max-w-none text-sm leading-relaxed text-gray-800 overflow-auto"
                    style={{ maxHeight: "60vh" }}
                  >
                    {processDescriptionWithTags(topicData.description)}
                    {/* <div dangerouslySetInnerHTML={{ __html: topicData.description }} /> */}

                    <div className="clear-both" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="md:col-span-1 lg:col-span-2">
            {/* Balance audio vs. description: give the audio card a consistent visual height and center the player.
                This does not change any logic/props; purely layout/styling for better 40:60 composition. */}
            <div
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm p-6 h-full flex items-center justify-center"
              style={{ minHeight: "60vh" }}
            >
              {topicData.Audio?.url ? (
                <AudioPlayer
                  fileUrl={`${mediaBase}${topicData.Audio.url}`}
                  onComplete={() => handleTopicEnd(topicData.id, topicData.module_id)}
                />
              ) : (
                <div className="text-center text-gray-500 text-sm">Audio not available</div>
              )}
            </div>
          </div>

          {topicData.description && (
            <div className="md:col-span-1 lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                </div>
                <div className="p-6 h-full">
                  <div
                    className="max-w-none text-sm leading-relaxed text-gray-800 overflow-auto"
                    style={{ maxHeight: "60vh" }}
                  >
                    {processDescriptionWithTags(topicData.description)}
                    {/* <div dangerouslySetInnerHTML={{ __html: topicData.description }} /> */}

                    <div className="clear-both" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {isCompleted && (
        <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm text-white text-lg">
                ✓
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-emerald-900">Topic Completed</h3>
              <p className="text-emerald-700 mt-1 text-sm leading-relaxed">
                You've successfully completed this topic and can move on to the next one.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
