/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
"use client"

import React, { useEffect, useState } from "react"
import parse from "html-react-parser"
// Using cjs style path for style to match other components (avoids mixed module format issues in some bundlers)
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism"
import AudioPlayer from "../../ui/audioPlayer2"
import ContentTimer from "./ContentTimer"
import PdfExtractor from "./PdfExtractor"
import ContentSummary from "./ContentSummary"
import { useSummarizePassageMutation } from "../../../services/Ai/summarizeApi"
import { useCreateSummaryMutation, useGetSummariesByGeneralMaterialDescIdQuery } from "../../../services/Ai/summaryApi"
import { useCreateBulletPointMutation } from "../../../services/Ai/bulletPointApi"
import { useCreateFlashCardMutation } from "../../../services/Ai/flashCardApi"

export default function DisplayGeneralContent({
  topicData,
  handleTopicEnd,
  completedTopics,
  contentChanged,
  setContentChanged,
  userId,
  access_token,
}) {
  const { title, description, GeneralMaterial, TopicTags = [] } = topicData
  const [isCompleted, setIsCompleted] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const [hasSummary, setHasSummary] = useState(false)
  const [timerPosition, setTimerPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const [summarizePassage, { isLoading: isSummarizing }] = useSummarizePassageMutation()
  const [createSummary] = useCreateSummaryMutation()
  const [createBulletPoint] = useCreateBulletPointMutation()
  const [createFlashCard] = useCreateFlashCardMutation()
  const { data: existingSummaries, isLoading: isLoadingSummaries } = useGetSummariesByGeneralMaterialDescIdQuery({
    topic_id: topicData.id,
    general_material_desc_id: 1,
    access_token,
  })

  useEffect(() => {
    setIsCompleted(!!completedTopics[topicData.id])
    setShowAudioPlayer(GeneralMaterial?.completion_type === "audio")
    setShowTimer(GeneralMaterial?.completion_type === "timer")
  }, [completedTopics, topicData.id, GeneralMaterial])

  useEffect(() => {
    if (existingSummaries?.length) {
      const s = existingSummaries[0]
      setHasSummary(true)
      setSummaryData({
        summary: s.summary,
        bullet_points: s.bullet_points?.map((bp) => bp.bullet_point) || [],
        flash_cards: s.flash_cards?.map((fc) => ({ question: fc.question, answer: fc.answer })) || [],
      })
    } else {
      setHasSummary(false)
      setSummaryData(null)
    }
  }, [existingSummaries])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleTimerMouseMove)
      document.addEventListener("mouseup", handleTimerMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleTimerMouseMove)
        document.removeEventListener("mouseup", handleTimerMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || ""
  // Resolve URL for materials: if already absolute (http/https) keep as-is, otherwise prefix media base
  const resolveMaterialUrl = (u) => (u && /^https?:\/\//i.test(u) ? u : `${mediaBase}${u || "/placeholder.png"}`)

  const cleanHtmlContent = (html) => {
    if (!html) return ""
    const temp = document.createElement("div")
    temp.innerHTML = html
    temp.querySelectorAll("script,style").forEach((n) => n.remove())
    return (temp.textContent || "").replace(/\s+/g, " ").trim()
  }

  const createTagElement = (tagObj, uniqueKey) => {
    if (!tagObj) return null
    const fileUrl = `${mediaBase}${tagObj.tag_file_path || "/placeholder.png"}`
    const isImageExt = (p) => /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(p || "")
    switch (tagObj.tag_file_type) {
      case "image":
        return (
          <img
            src={fileUrl || "/placeholder.svg"}
            alt={tagObj.tag}
            className="float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
          />
        )
      case "code":
        return (
          <div className="relative my-4 border rounded-xl overflow-hidden bg-gray-900 shadow-lg clear-both">
            <button
              onClick={() => {
                navigator.clipboard.writeText(tagObj.tag_file_path || "")
                setCopiedKey(uniqueKey)
                setTimeout(() => setCopiedKey(null), 1500)
              }}
              className={`absolute top-3 right-3 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${copiedKey === uniqueKey ? "bg-green-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}
            >
              {copiedKey === uniqueKey ? "Copied" : "Copy"}
            </button>
            <SyntaxHighlighter
              language={tagObj.code_language || "javascript"}
              style={dracula}
              customStyle={{ margin: 0, padding: "1.5rem" }}
            >
              {tagObj.tag_file_path || ""}
            </SyntaxHighlighter>
          </div>
        )
      default:
        if (isImageExt(tagObj.tag_file_path)) {
          return (
            <img
              src={fileUrl || "/placeholder.svg"}
              alt={tagObj.tag}
              className="float-left mr-4 mb-4 max-w-xs max-h-64 w-auto rounded-lg border object-contain shadow-sm"
            />
          )
        }
        return (
          <button
            onClick={() => window.open(fileUrl, "_blank", "noopener")}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-colors"
          >
            Open File
          </button>
        )
    }
  }

  const processDescriptionWithTags = (html) => {
    if (!html) return null
    if (/<!?DOCTYPE|<html/i.test(html)) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch?.[1]) html = bodyMatch[1]
      html = html.replace(/<head[\s\S]*?<\/head>/i, "")
    }
    const tagRegex = /#[^#\s]+#/g
    // Ensure TopicTags is always an array (API may send null)
    const safeTags = Array.isArray(TopicTags) ? TopicTags : []
    const grouped = safeTags.reduce((acc, t) => {
      if (!t?.tag) return acc
      acc[t.tag] = acc[t.tag] ? [...acc[t.tag], t] : [t]
      return acc
    }, {})
    const occurrenceTracker = {}

    return parse(html, {
      replace: (node) => {
        if (node.type !== "text") return undefined
        const text = node.data
        const matches = [...text.matchAll(tagRegex)]
        if (!matches.length) return undefined
        const parts = []
        let cursor = 0
        matches.forEach((m) => {
          const match = m[0],
            offset = m.index
          if (offset > cursor) parts.push(text.slice(cursor, offset))
          occurrenceTracker[match] = (occurrenceTracker[match] || 0) + 1
          const list = grouped[match] || []
          const tagObj = list[occurrenceTracker[match] - 1] || list[0]
          parts.push(createTagElement(tagObj, `${match}-${occurrenceTracker[match]}`) || match)
          cursor = offset + match.length
        })
        if (cursor < text.length) parts.push(text.slice(cursor))
        return (
          <>
            {parts.map((p, i) =>
              typeof p === "string" ? <span key={i}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>,
            )}
          </>
        )
      },
    })
  }

  const handleTopicCompletion = (topicId, moduleId) => {
    handleTopicEnd(topicId, moduleId)
    setIsCompleted(true)
  }

  const summarizeDescription = async () => {
    if (!GeneralMaterial?.description || isSummarizing) return
    try {
      const cleanText = cleanHtmlContent(GeneralMaterial.description)
      if (!cleanText) return
      const result = await summarizePassage({ passage: cleanText, access_token }).unwrap()
      const summaryPayload = {
        topic_id: topicData.id,
        summary: result.summary,
        general_material_desc_id: 1,
        general_material_pdf_id: null,
        accordion_id: null,
        multi_slide_general_desc_id: null,
        multi_slide_general_pdf_id: null,
        multi_slide_accordion_id: null,
      }
      const saved = await createSummary({ summaryData: summaryPayload, access_token }).unwrap()
      await createBulletPoint({
        bulletPointData: { summary_id: saved.id, bullet_point: result.bullet_points },
        access_token,
      }).unwrap()
      await createFlashCard({
        flashCardData: { summary_id: saved.id, flash_cards: result.flash_cards },
        access_token,
      }).unwrap()
      setSummaryData({ summary: result.summary, bullet_points: result.bullet_points, flash_cards: result.flash_cards })
      setHasSummary(true)
      setShowSummary(true)
    } catch (e) {
      console.error("Summary generation failed", e)
    }
  }

  const handleTimerMouseDown = (e) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleTimerMouseMove = (e) => {
    if (!isDragging) return

    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    // Keep timer within viewport bounds
    const maxX = window.innerWidth - 400 // Approximate timer width
    const maxY = window.innerHeight - 100 // Approximate timer height

    setTimerPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleTimerMouseUp = () => {
    setIsDragging(false)
  }

  if (showSummary && summaryData)
    return <ContentSummary summaryData={summaryData} onBack={() => setShowSummary(false)} />

  return (
    <div className="w-full relative min-h-screen">
      <div className="max-w-8xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3 space-y-6">
            {description && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-900">Topic Overview</h3>
                </div>
                <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                  {processDescriptionWithTags(description)}
                  {/* <div dangerouslySetInnerHTML={{ __html: description }} /> */}

                </div>
              </section>
            )}

            {GeneralMaterial?.description && (
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-900">Material Notes</h3>
                </div>
                <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed overflow-hidden">
                  {processDescriptionWithTags(GeneralMaterial.description)}
                  {/* <div dangerouslySetInnerHTML={{ __html: GeneralMaterial.description }} /> */}

                  <div className="clear-both"></div>
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 sticky top-6">
              {GeneralMaterial && (
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {GeneralMaterial.material_type === "pdf"
                          ? "📄"
                          : GeneralMaterial.material_type === "image"
                            ? "🖼️"
                            : GeneralMaterial.material_type === "video"
                              ? "🎥"
                              : GeneralMaterial.material_type === "link"
                                ? "🔗"
                                : "📝"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-gray-900 leading-tight">
                          {GeneralMaterial.title || title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1 capitalize font-semibold">
                          {GeneralMaterial.material_type}
                        </p>
                      </div>
                    </div>

                    {GeneralMaterial?.material_type === "image" && (
                      <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-center">
                          <img
                            src={resolveMaterialUrl(GeneralMaterial.url)}
                            alt={GeneralMaterial.title || "Material image"}
                            className="max-h-[600px] w-auto rounded-xl border object-contain shadow-lg"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {GeneralMaterial.material_type !== "image" && (
                          <a
                            href={resolveMaterialUrl(GeneralMaterial.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg text-center"
                          >
                            {GeneralMaterial.material_type === 'link' ? 'Open Link' : 'View Content'}
                          </a>
                        )}

                        {GeneralMaterial.material_type !== 'link' && (
                          <a
                            href={resolveMaterialUrl(GeneralMaterial.url)}
                            {...(GeneralMaterial.material_type !== 'image' ? { download: true } : {})}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 transition-all shadow-md hover:shadow-lg text-center ${GeneralMaterial.material_type === "image" ? "col-span-2" : ""}`}
                          >
                            Download
                          </a>
                        )}
                      </div>

                      {!hasSummary ? (
                        <button
                          onClick={summarizeDescription}
                          disabled={isSummarizing || isLoadingSummaries}
                          className="w-full px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 disabled:opacity-60 transition-all shadow-md hover:shadow-lg"
                        >
                          {isSummarizing || isLoadingSummaries ? "Generating…" : "Generate Summary"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowSummary(true)}
                          className="w-full px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
                        >
                          View Summary
                        </button>
                      )}

                      {GeneralMaterial.material_type === "pdf" && (
                        <div className="w-full">
                          <PdfExtractor
                            topicId={topicData.id}
                            general_flag={true}
                            pdfPath={`${mediaBase}${GeneralMaterial.url}`}
                            materialUrl={GeneralMaterial.url}
                            access_token={access_token}
                            onSummaryGenerated={(data) => {
                              setSummaryData(data)
                              setShowSummary(true)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {GeneralMaterial?.code && (
                <section className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">Code Example</h3>
                  </div>
                  <div className="relative border rounded-xl bg-gray-900 overflow-hidden shadow-lg">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(GeneralMaterial.code)
                        setCopiedKey("main-code")
                        setTimeout(() => setCopiedKey(null), 1500)
                      }}
                      className={`absolute top-3 right-3 text-xs px-3 py-1.5 rounded-lg font-medium transition-all z-10 ${copiedKey === "main-code" ? "bg-green-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}
                    >
                      {copiedKey === "main-code" ? "Copied" : "Copy"}
                    </button>
                    <SyntaxHighlighter
                      language={GeneralMaterial.codeLanguage || "javascript"}
                      style={dracula}
                      customStyle={{ margin: 0, padding: "1.5rem" }}
                    >
                      {GeneralMaterial.code}
                    </SyntaxHighlighter>
                  </div>
                </section>
              )}

              {isCompleted && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl shadow-lg">
                      ✓
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-emerald-900">Topic Completed!</h4>
                      <p className="text-sm text-emerald-700 mt-1">Great job! You can now move to the next topic.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAudioPlayer && GeneralMaterial?.audio_url && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto">
            <AudioPlayer
              fileUrl={`${mediaBase}${GeneralMaterial.audio_url}`}
              onComplete={() => handleTopicEnd(topicData.id, topicData.module_id)}
            />
          </div>
        </div>
      )}

      {showTimer && !isCompleted && GeneralMaterial?.completion_time && (
        <div
          className="fixed bg-white border shadow-lg rounded-xl p-4 z-50 cursor-move select-none"
          style={{
            left: `${timerPosition.x}px`,
            top: `${timerPosition.y}px`,
            minWidth: "350px",
          }}
          onMouseDown={handleTimerMouseDown}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600 ml-2">Timer</span>
          </div>
          <ContentTimer
            topicId={topicData.id}
            moduleId={topicData.module_id}
            completionTime={GeneralMaterial.completion_time * 60}
            onCompletion={handleTopicCompletion}
            isCompleted={isCompleted}
            contentChanged={contentChanged}
            setContentChanged={setContentChanged}
            userId={userId}
            access_token={access_token}
          />
        </div>
      )}
    </div>
  )
}

export { DisplayGeneralContent }
