"use client"

import { memo } from "react"
import { Play, Volume2, HelpCircle, FileText, Presentation } from "lucide-react"
import AudioPreview from "./AudioPreview"

// Custom Accordion Component
const CustomAccordion = memo(({ id, title, children, accordionState, toggleAccordion }) => {
  const isOpen = accordionState[id]

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleAccordion(id)}
        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <span className="text-sm font-medium">{title}</span>
        <div className={`transform transition-transform ${isOpen ? "rotate-90" : ""}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
      {isOpen && <div className="p-2 md:px-4 md:py-3 bg-white border-t border-gray-200">{children}</div>}
    </div>
  )
})

CustomAccordion.displayName = "CustomAccordion"

const TopicContent = memo(({ topic, accordionState, toggleAccordion }) => {
  const contentType = topic.type || topic.content_type

  // Helper function to check if content has audio file
  const hasAudioFile = (content) => {
    return content && content.audio_file && content.audio_file.data
  }

  // Video Content
  if (contentType === "video" && topic.video) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-red-500" />
            <span className="font-medium">Video Content</span>
            <span className="px-2 py-0.5 text-xs border border-gray-300 rounded-full">{topic.video.video_type}</span>
          </div>
          <div className="pl-6 space-y-1 text-sm">
            <p>
              <strong>URL:</strong> {topic.video.url}
            </p>
            <p>
              <strong>Duration:</strong> {topic.video.duration_minutes} minutes
            </p>
            <p>
              <strong>Video ID:</strong> {topic.video.id}
            </p>
          </div>
        </div>
        {hasAudioFile(topic.video) && <AudioPreview audioFile={topic.video.audio_file} title="Video Audio Track" />}
      </div>
    )
  }

  // Audio Content
  if (contentType === "audio" && topic.audio) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Audio Content</span>
          </div>
          <div className="pl-6 space-y-1 text-sm">
            <p>
              <strong>URL:</strong> {topic.audio.url}
            </p>
            <p>
              <strong>Duration:</strong> {topic.audio.duration_minutes} minutes
            </p>
            <p>
              <strong>Audio ID:</strong> {topic.audio.id}
            </p>
          </div>
        </div>
        {hasAudioFile(topic.audio) && <AudioPreview audioFile={topic.audio.audio_file} title="Audio Content" />}
      </div>
    )
  }

  // Accordion Content
  if (contentType === "accordion" && topic.accordions) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-green-500" />
            <span className="font-medium">FAQ Content</span>
          </div>
          <div className="pl-6 space-y-4">
            {topic.accordions.map((accordion) => (
              <div key={accordion.id} className="space-y-3">
                <CustomAccordion
                  id={`faq-${accordion.id}`}
                  title={accordion.title}
                  accordionState={accordionState}
                  toggleAccordion={toggleAccordion}
                >
                  <div className="space-y-3">
                    <p className="text-sm">{accordion.body}</p>
                    {accordion.code && (
                      <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-xs text-gray-600 mb-2">Code ({accordion.codeLanguage}):</p>
                        <pre className="text-xs overflow-x-auto">
                          <code>{accordion.code}</code>
                        </pre>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>ID: {accordion.id}</span>
                      <span>Topic ID: {accordion.topic_id}</span>
                      <span>Completion: {accordion.accordianCompletionType}</span>
                      {accordion.accordianCompletionTime && <span>Time: {accordion.accordianCompletionTime}s</span>}
                    </div>
                  </div>
                </CustomAccordion>
                {accordion.accordianCompletionType === "audio" && hasAudioFile(accordion) && (
                  <AudioPreview audioFile={accordion.audio_file} title={`Audio for: ${accordion.title}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // General Content
  if (contentType === "general" && topic.general_material) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="font-medium">General Material</span>
            <span className="px-2 py-0.5 text-xs border border-gray-300 rounded-full">
              {topic.general_material.material_type}
            </span>
          </div>
          <div className="pl-6 space-y-2">
            <p className="text-sm">
              <strong>Title:</strong> {topic.general_material.title}
            </p>
            <p className="text-sm">
              <strong>URL:</strong> {topic.general_material.url}
            </p>
            <p className="text-sm text-gray-600">{topic.general_material.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>ID: {topic.general_material.id}</span>
              <span>Topic ID: {topic.general_material.topic_id}</span>
              <span>Completion: {topic.general_material.completion_type}</span>
              {topic.general_material.completion_time && <span>Time: {topic.general_material.completion_time}s</span>}
            </div>
            {topic.general_material.code && (
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-xs text-gray-600 mb-2">Code ({topic.general_material.codeLanguage}):</p>
                <pre className="text-xs overflow-x-auto">
                  <code>{topic.general_material.code}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
        {topic.general_material.completion_type === "audio" && hasAudioFile(topic.general_material) && (
          <AudioPreview audioFile={topic.general_material.audio_file} title="General Material Audio" />
        )}
      </div>
    )
  }

  if (contentType === "slide" && (topic.slides || topic.multi_slides)) {
    const slides = topic.slides || topic.multi_slides

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Presentation className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Slide Presentation</span>
          </div>
          <div className="md:pl-6 space-y-4">
            {slides.map((slide, index) => (
              <div key={slide.slide_number || slide.id || index} className="space-y-3">
                <CustomAccordion
                  id={`slide-${slide.slide_number || slide.id || index}`}
                  title={`Slide ${slide.slide_number || index + 1}: ${slide.title}`}
                  accordionState={accordionState}
                  toggleAccordion={toggleAccordion}
                >
                  <div className="space-y-2 md:space-y-4">
                    <p className="text-sm">{slide.description || slide.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="px-2 py-0.5 border border-gray-300 rounded-full">
                        {slide.type || slide.content_type}
                      </span>
                      {slide.slide_number && <span>Slide: {slide.slide_number}</span>}
                      {slide.id && <span>ID: {slide.id}</span>}
                      {slide.topic_id && <span>Topic ID: {slide.topic_id}</span>}
                      {slide.slideCompletionType && <span>Completion: {slide.slideCompletionType}</span>}
                      {slide.slideCompletionTime && <span>Time: {slide.slideCompletionTime}s</span>}
                    </div>

                    {/* Nested content sections */}
                    {slide.materialType && (
                      <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">General Material</p>
                        <div className="space-y-1 text-xs">
                          {slide.url && (
                            <p>
                              <strong>URL:</strong> {slide.url}
                            </p>
                          )}
                          <p>
                            <strong>Material Type:</strong> {slide.materialType}
                          </p>
                        </div>
                        {slide.code && (
                          <div className="bg-white p-2 rounded mt-2">
                            <p className="text-xs text-gray-600 mb-1">Code ({slide.codeLanguage}):</p>
                            <pre className="text-xs overflow-x-auto">
                              <code>{slide.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {slide.video && (
                      <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">Video Content</p>
                        <div className="space-y-1 text-xs">
                          <p>
                            <strong>Video URL:</strong> {slide.video.videoUrl}
                          </p>
                          <p>
                            <strong>Video Type:</strong> {slide.video.videoType}
                          </p>
                          <p>
                            <strong>Duration:</strong> {slide.video.videoDuration} minutes
                          </p>
                        </div>
                      </div>
                    )}

                    {slide.audio && (
                      <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">Audio Content</p>
                        <div className="space-y-1 text-xs">
                          <p>
                            <strong>Audio URL:</strong> {slide.audio.audioUrl}
                          </p>
                          <p>
                            <strong>Duration:</strong> {slide.audio.audioDuration} minutes
                          </p>
                        </div>
                      </div>
                    )}

                    {slide.accordianSections && slide.accordianSections.length > 0 && (
                      <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">Accordion Sections</p>
                        {slide.accordianSections.map((accordionSection) => (
                          <div key={accordionSection.id} className="bg-white p-2 rounded mb-2">
                            <p className="text-sm font-medium">{accordionSection.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{accordionSection.body}</p>
                            {accordionSection.code && (
                              <div className="bg-gray-50 p-2 rounded mt-2">
                                <p className="text-xs text-gray-600 mb-1">Code ({accordionSection.codeLanguage}):</p>
                                <pre className="text-xs overflow-x-auto">
                                  <code>{accordionSection.code}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CustomAccordion>

                {/* Audio previews for slide content */}
                {slide.slideCompletionType === "audio" && hasAudioFile(slide) && (
                  <AudioPreview audioFile={slide.audio_file} title={`Audio for Slide: ${slide.title}`} />
                )}

                {slide.audio && hasAudioFile(slide.audio) && (
                  <AudioPreview audioFile={slide.audio.audio_file} title="Slide Audio Content" />
                )}

                {slide && hasAudioFile(slide) && (
                  <AudioPreview audioFile={slide.audio_file} title="General Material Audio" />
                )}

                {slide.accordianSections &&
                  slide.accordianSections.map(
                    (accordionSection) =>
                      hasAudioFile(accordionSection) && (
                        <AudioPreview
                          key={`audio-${accordionSection.id}`}
                          audioFile={accordionSection.audio_file}
                          title={`Accordion Audio: ${accordionSection.title}`}
                        />
                      ),
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return <p className="text-sm text-gray-500">No content available for this topic.</p>
})

TopicContent.displayName = "TopicContent"

export default TopicContent
