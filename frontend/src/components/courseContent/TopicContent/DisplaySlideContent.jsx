/* eslint-disable no-case-declarations */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import {
  useLazyCheckSlideCompletionQuery,
  useHandleTopicSlideCompletionMutation,
  useGetTopicSlidesQuery,
  useGetSlideContentQuery,
} from "../../../services/Learning_Progress/progressTrackingApi";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Copy,
  Check,
  Book,
  Video,
  FileText,
  Headphones,
  Layers,
  Info,
} from "lucide-react";
import he from "he";
import AudioPlayer from "../../ui/audioPlayer";
import AudioPlayer2 from "../../ui/audioPlayer2";
import VideoPlayer from "../../ui/VideoPlayer";
import parse, { domToReact } from "html-react-parser";
import ContentTimer from "./ContentTimer";
import PdfExtractor from "./PdfExtractor";
import { useSummarizePassageMutation } from "../../../services/Ai/summarizeApi";
import ContentSummary from "./ContentSummary";
import { useCreateSummaryMutation, useGetSummariesByMultiSlideGeneralDescIdQuery, useGetSummariesByMultiSlideGeneralPdfIdQuery, useGetSummariesByMultiSlideAccordionIdQuery } from "../../../services/Ai/summaryApi";
import { useCreateBulletPointMutation } from "../../../services/Ai/bulletPointApi";
import { useCreateFlashCardMutation } from "../../../services/Ai/flashCardApi";
import * as mammoth from 'mammoth';

const DocxHtmlViewer = ({ url }) => {
  const [html, setHtml] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndConvertDocx = async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtml(result.value);
      } catch (err) {
        setError('Failed to load or convert document');
      }
    };

    fetchAndConvertDocx();
  }, [url]);

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        {error}
      </div>
    );
  }

  if (!html) {
    return (
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
        Loading document...
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6 2h7l5 5v15a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
          </svg>
          <span className="ml-2 font-medium text-gray-700">Document (DOCX)</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Open Original
        </a>
      </div>
      <div className="prose max-w-none bg-white p-4 rounded border border-gray-200 [&_img]:max-w-full [&_img]:h-auto [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:p-2 [&_th]:bg-gray-100 [&_td]:border [&_td]:p-2">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};

export default function DisplaySlideContent({
  moduleId,
  topicId,
  topicData,
  handleTopicEnd,
  userId,
  access_token,
  contentChanged,
  setContentChanged,
  handleTopicClick,
  topics,
  assignmentData,
  quizData,
  handleShowAssignments,
  handleShowQuiz,
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [completedSlides, setCompletedSlides] = useState(new Set());
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [sortedSlides, setSortedSlides] = useState([]);
  const [copiedAccordion, setCopiedAccordion] = useState(null);
  const [copiedGeneral, setCopiedGeneral] = useState(null);
  const [copied, setCopied] = useState(false);
  const [completedAccordions, setCompletedAccordions] = useState(new Set());
  const [slideCompleted, setSlideCompleted] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const [copiedKey, setCopiedKey] = useState(null)

  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [hasSummary, setHasSummary] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || ""

  // New state for slide navigation
  const [selectedSlideId, setSelectedSlideId] = useState(null);

  // Pause any playing HTMLAudioElements and reset on slide change so UI icons reflect stopped state
  useEffect(() => {
    if (!selectedSlideId) return;
    const audios = document.querySelectorAll('audio');
    audios.forEach(a => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch (_) { /* ignore */ }
    });
  }, [selectedSlideId]);

  // Fetch slides for the topic
  const { data: slides = [], isLoading: slidesLoading } = useGetTopicSlidesQuery(topicId, { skip: !topicId });

  // Set the first slide as selected when slides load
  useEffect(() => {
    if (slides && slides.length > 0) {
      setSelectedSlideId(slides[0].id);
      setSortedSlides(slides);
    }
  }, [slides, topicId]);

  // Fetch content for the selected slide
  const { data: slideContent, isLoading: slideContentLoading } = useGetSlideContentQuery(selectedSlideId, { skip: !selectedSlideId });

  const [checkSlideCompletion, { data: slideCompletionData, isLoading: checkSlideCompletionLoading }] =
    useLazyCheckSlideCompletionQuery();

  const [handleTopicSlideCompletion] = useHandleTopicSlideCompletionMutation();

  // Check completion status when topic changes
  useEffect(() => {
    if (topicId) {
      checkSlideCompletion({ userId, topicId });
    }
  }, [topicId, userId, checkSlideCompletion]);

  // Update completed slides when completion data changes
  useEffect(() => {
    if (slideCompletionData?.completedSlides) {
      const completedSlidesSet = new Set(slideCompletionData.completedSlides);
      setCompletedSlides(completedSlidesSet);
    }
  }, [slideCompletionData]);

  // Update slide completion status when selected slide changes
  useEffect(() => {
    setSlideCompleted(completedSlides.has(selectedSlideId));
  }, [selectedSlideId, completedSlides]);

  const handleMarkAsCompleted = async () => {
    try {
      // Mark current slide as completed
      await handleTopicSlideCompletion({
        userId,
        topicId,
        slideId: selectedSlideId,
      });

      // Update local state with the newly completed slide
      const updatedCompletedSlides = new Set([...completedSlides, selectedSlideId]);
      setCompletedSlides(updatedCompletedSlides);
      setSlideCompleted(true);

      // Check if all slides are completed
      if (updatedCompletedSlides.size === slides.length) {
        // If all slides are completed, mark the topic as completed
        if (handleTopicEnd) {
          await handleTopicEnd(topicId, moduleId, selectedSlideId);
        }
      } else {
        // If not all slides are completed, move to next slide
        const currentIndex = slides.findIndex(slide => slide.id === selectedSlideId);
        if (currentIndex < slides.length - 1) {
          const nextSlide = slides[currentIndex + 1];
          setSelectedSlideId(nextSlide.id);
          setActiveSlide(currentIndex + 1);
          setSlideCompleted(false);
        }
      }
    } catch (error) {
      console.error("Error marking slide as completed:", error);
    }
  };

  // Navigation handlers
  const goToSlide = (slideId) => {
    const index = slides.findIndex(slide => slide.id === slideId);
    if (index !== -1) {
      setSelectedSlideId(slideId);
      setActiveSlide(index);
      setSlideCompleted(completedSlides.has(slideId));
    }
  };

  const goToNextSlide = () => {
    if (!slides || slides.length === 0 || !selectedSlideId) return;
    const idx = slides.findIndex((s) => s.id === selectedSlideId);
    if (idx !== -1 && idx < slides.length - 1) {
      const nextSlide = slides[idx + 1];
      setSelectedSlideId(nextSlide.id);
      setActiveSlide(idx + 1);
      setSlideCompleted(completedSlides.has(nextSlide.id));
    }
  };

  const goToPrevSlide = () => {
    if (!slides || slides.length === 0 || !selectedSlideId) return;
    const idx = slides.findIndex((s) => s.id === selectedSlideId);
    if (idx > 0) {
      const prevSlide = slides[idx - 1];
      setSelectedSlideId(prevSlide.id);
      setActiveSlide(idx - 1);
      setSlideCompleted(completedSlides.has(prevSlide.id));
    }
  };

  // Render slide navigation
  const renderSlideNav = () => (
    <div className="flex gap-2 mb-4">
      {slides.map((slide, idx) => (
        <button
          key={slide.id}
          className={`px-3 py-1 rounded ${slide.id === selectedSlideId ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          onClick={() => goToSlide(slide.id)}
        >
          {slide.title || `Slide ${idx + 1}`}
        </button>
      ))}
    </div>
  );

  const handleAccordionCompletion = (accordionId) => {
    setCompletedAccordions((prev) => {
      const newSet = new Set(prev);
      newSet.add(accordionId);
      return newSet;
    });

    const slideAccordions =
      sortedSlides[activeSlide]?.MultiSlideAccordions || [];
    const allCompleted = slideAccordions.every(
      (acc) => completedAccordions.has(acc.id) || acc.id === accordionId
    );

    if (allCompleted) {
      handleMarkAsCompleted();
    }
  };

  const getProcessedDescription = (description) => {
    if (!description) {
      return null;
    }

    // Check if description contains <html> tags and sanitize if needed
    let sanitizedDescription = description;
    if (description.includes("<html>") || description.includes("<html ")) {
      const bodyMatch = description.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        sanitizedDescription = bodyMatch[1];
      } else {
        sanitizedDescription = description
          .replace(/<html[^>]*>|<\/html>/gi, "")
          .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
          .replace(/<body[^>]*>|<\/body>/gi, "");
      }
    }

    // Helper function to create tag component
    const createTagComponent = (matchedTag) => {
      // Only create a file URL for non-code tags
      const fileUrl = matchedTag.tag_file_type !== "code"
        ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${matchedTag.tag_file_path || "/placeholder.png"}`
        : null;
      switch (matchedTag.tag_file_type) {
        case "image":
          return (
            <img
              src={fileUrl}
              alt={matchedTag.tag}
              style={{ width: "50%" }}
            />
          );
        case "video":
          return (
            <VideoPlayer
              fileUrl={fileUrl}
            />
          );
        case "audio":
          return (
            <audio controls style={{ width: "100%" }}>
              <source src={fileUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          );
        case "other":
          const fileExtension = fileUrl.split('.').pop().toLowerCase();

          // For PDFs, use iframe
          if (fileExtension === 'pdf') {
            return (
              <iframe
                src={fileUrl}
                width="100%"
                height="500px"
                title={matchedTag?.tag || "PDF Viewer"}
                style={{ border: "none" }}
              />
            );
          }
          // For images
          else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
            return (
              <img
                src={fileUrl}
                alt={matchedTag.tag}
                style={{ width: "100%", maxWidth: "800px" }}
              />
            );
          }
          // For other file types, show a download link
          else {
            return (
              <div className="file-download max-w-sm">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-white hover:bg-gray-50"
                >
                  {/* File Icon */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-md bg-blue-100 text-blue-600 text-2xl">
                    📄
                  </div>

                  {/* File Info */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Click to view/download</p>
                    <p className="font-medium text-gray-800 truncate">
                      {matchedTag.tag.replace(/^#|#$/g, '')}
                    </p>
                  </div>

                  {/* Download Button */}
                  <div className="px-3 py-1 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200">
                    Download
                  </div>
                </a>
              </div>
            );
          }

        case "code":
          // For code tags, use the code content directly
          return (
            <div
              className="code-tag-container"
              style={{
                backgroundColor: "#f5f5f5",
                padding: "10px",
                borderRadius: "4px",
                margin: "10px 0",
                border: "1px solid #ddd",
                overflow: "auto",
                maxHeight: "500px",
                width: "100%",
                display: "block"
              }}
            >
              <div className="code-header" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="language-badge" style={{ backgroundColor: "#e2e8f0", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                  {matchedTag.code_language || "javascript"}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(matchedTag.tag_file_path);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    padding: "2px 8px",
                    backgroundColor: copied ? "#10B981" : "#4B5563",
                    color: "white",
                    borderRadius: "4px",
                    fontSize: "12px",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <SyntaxHighlighter
                language={matchedTag.code_language || "javascript"}
                style={dracula}
                customStyle={{ margin: 0 }}
              >
                {matchedTag.tag_file_path}
              </SyntaxHighlighter>
            </div>
          );
        default:
          return <span>{matchedTag.tag}</span>;
      }
    };

    // Helper function to process text content and replace tags
    const processTextWithTags = (text) => {
      if (!text || typeof text !== 'string') return text;

      // Find all tags in the text
      const tagRegex = /#[^#\s]+#/g;
      const tags = text.match(tagRegex);

      // Early return if no tags found
      if (!tags) return text;


      // Split text by tags and create mixed content
      const parts = [];
      let lastIndex = 0;

      tags.forEach(tag => {
        const tagIndex = text.indexOf(tag, lastIndex);

        // Add text before tag
        if (tagIndex > lastIndex) {
          const beforeText = text.substring(lastIndex, tagIndex);
          if (beforeText.trim()) {
            parts.push(beforeText);
          }
        }

        // Find matching tag data
        const matchedTag = topicData.TopicTags?.find((t) => t.tag === tag);
        if (matchedTag) {

          // Since we're now displaying tags globally above slides,
          // we'll just show a reference to the tag, not the actual content
          parts.push(
            <span key={`tag-ref-${tag}`} className="tag-reference px-2 py-1 bg-blue-100 text-blue-800 rounded mx-1">
              {tag}
            </span>
          );

          // Commented out the original implementation that would create the actual tag component
          /*
          // Create a wrapped version of the tag component with proper styling
          const tagComponent = createTagComponent(matchedTag);
          parts.push(
            <div key={`tag-${tag}`} className="tag-component-wrapper my-4">
              {tagComponent}
            </div>
          );
          */
        } else {
          parts.push(tag); // Keep original tag if no match found
        }

        lastIndex = tagIndex + tag.length;
      });

      // Add remaining text after last tag
      if (lastIndex < text.length) {
        const remainingText = text.substring(lastIndex);
        if (remainingText.trim()) {
          parts.push(remainingText);
        }
      }


      // Always return the array of parts wrapped in a fragment for consistent rendering
      return parts.length > 0 ? (
        <React.Fragment>
          {parts.map((part, idx) => {
            return typeof part === 'string' ? (
              <span key={`text-${idx}`}>{part}</span>
            ) : (
              <React.Fragment key={`component-${idx}`}>{part}</React.Fragment>
            )
          })}
        </React.Fragment>
      ) : text;
    };

    return parse(sanitizedDescription, {
      replace: (domNode) => {
        // Remove any remaining html tags
        if (
          domNode.type === "tag" &&
          (domNode.name === "html" ||
            domNode.name === "head" ||
            domNode.name === "body")
        ) {
          return domNode.children ? domToReact(domNode.children) : null;
        }

        // Handle text nodes that might contain tags
        if (domNode.type === "text") {
          const processedContent = processTextWithTags(domNode.data);

          // Always return processed content - it will be properly wrapped by our improved processTextWithTags function
          if (React.isValidElement(processedContent)) {
            return processedContent;
          }

          // Otherwise let html-react-parser handle it normally
          return undefined;
        }

        // Handle paragraph tags
        if (domNode.type === "tag" && domNode.name === "p") {
          // Check if paragraph contains only a tag or text with tag
          if (domNode.children && domNode.children.length > 0) {
            // Handle text nodes with tags within paragraphs
            const textNode = domNode.children[0];
            if (textNode && textNode.type === "text") {
              const content = textNode.data.trim();

              // Check if it contains any tags
              const tagRegex = /#[^#\s]+#/g;
              const tags = content.match(tagRegex);

              if (tags && tags.length > 0) {

                // For a standalone tag (just the tag and nothing else)
                if (content.match(/^(#[^#\s]+#)$/)) {
                  const matchedTag = topicData.TopicTags?.find((t) => t.tag === content);
                  if (matchedTag) {
                    // Return the tag component with paragraph styling preserved
                    const tagComponent = createTagComponent(matchedTag);
                    return (
                      <div style={{
                        textAlign: domNode.attribs?.style?.includes('text-align: center') ? 'center' : 'left',
                        margin: '1em 0'
                      }}>
                        {tagComponent}
                      </div>
                    );
                  }
                }

                // For mixed content (text with one or more tags)
                const processedTextContent = processTextWithTags(content);
                if (React.isValidElement(processedTextContent)) {
                  return (
                    <p style={{
                      textAlign: domNode.attribs?.style?.includes('text-align: center') ? 'center' : 'left',
                      margin: '1em 0'
                    }}>
                      {processedTextContent}
                    </p>
                  );
                }
              }
            }
          }

          // For paragraphs with no tags or complex content, process normally
          // The text nodes within will be handled by the text node handler
          return undefined;
        }

        // Handle other tag types that might contain text with tags
        if (domNode.type === "tag" && ["div", "span", "h1", "h2", "h3", "h4", "h5", "h6", "li"].includes(domNode.name)) {
          // Let the parser handle these normally, text nodes within will be processed
          return undefined;
        }

        return undefined;
      },
    });
  };

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
    const safeTags = Array.isArray(topicData.TopicTags) ? topicData.TopicTags : []
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

  const [summarizePassage, { data, error, isLoadingSummary }] = useSummarizePassageMutation();
  const [createSummary] = useCreateSummaryMutation();
  const [createBulletPoint] = useCreateBulletPointMutation();
  const [createFlashCard] = useCreateFlashCardMutation();



  // Function to clean HTML content and extract only text
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


  const summarizeAllAccordionBodies = async () => {
    try {
      setIsLoading(true);

      const accordions = slideContent?.MultiSlideAccordions || [];

      if (accordions.length === 0) return;

      const allBodies = accordions.map(accordion => accordion.body).join('\n\n');

      const result = await summarizePassage({ passage: allBodies, access_token }).unwrap();

      // Prepare the summary data
      const summaryData = {
        topic_id: topicId,
        summary: result.summary,
        general_material_desc_id: null,
        general_material_pdf_id: null,
        accordion_id: null,
        multi_slide_general_desc_id: null,
        multi_slide_general_pdf_id: null,
        multi_slide_accordion_id: 1,
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
      setIsLoading(false);
    }
  };

  const summarizeGeneralDescription = async (description) => {
    try {
      setIsLoading(true);
      if (!description) return;

      // Clean the HTML content before sending
      const cleanText = cleanHtmlContent(description);

      const result = await summarizePassage({ passage: cleanText, access_token }).unwrap();

      // Prepare the summary data
      const summaryData = {
        topic_id: topicId,
        summary: result.summary,
        general_material_desc_id: null,
        general_material_pdf_id: null,
        accordion_id: null,
        multi_slide_general_desc_id: 1,
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (topicId && topicId.MultiSlides) {
      const sorted = [...topicId.MultiSlides].sort((a, b) => a.id - b.id);
      setSortedSlides(sorted);

      checkSlideCompletion({ userId, topicId: topicId.id });
    }
  }, [topicId, checkSlideCompletion, userId]);

  useEffect(() => {
    if (slideCompletionData && slideCompletionData.completedSlides) {
      const completedSlidesSet = new Set(slideCompletionData.completedSlides);
      setCompletedSlides(completedSlidesSet);
    }
  }, [slideCompletionData, sortedSlides]);

  useEffect(() => {

    setSlideCompleted(completedSlides.has(sortedSlides[activeSlide]?.id));
  }, [activeSlide, completedSlides, sortedSlides]);

  const renderVideo = (video) => {
    if (!video || !video.url) return null;

    switch (video.type) {
      case "internal":
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
              <VideoPlayer
                fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${video.url
                  }`}
                onComplete={() => handleMarkAsCompleted()}
              />
            </div>
          </div>
        );
      case "youtube":
        return (
          <div className="max-w-3xl mx-auto space-y-8 h-full ">
            <iframe
              className="relative top-0 left-0 w-full h-96 "
              src={`https://www.youtube.com/embed/${extractYouTubeId(
                video.url
              )}?controls=0&disablekb=1&modestbranding=1&fs=0`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="YouTube video player"
            ></iframe>

            <div className="realtive flex justify-end">
              <button
                onClick={() => handleMarkAsCompleted()}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        );
    }
  };

  const renderAudio = (audio) => {
    if (!audio || !audio.url) return null;

    return (
      <div className="mt-4 p-4 flex items-center justify-center bg-gray-50 rounded-lg h-[450px]">
        <AudioPlayer
          key={`${selectedSlideId || ''}-${audio.url}`}
          fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${audio.url}`}
          onComplete={handleMarkAsCompleted}
          autoPlay={false}
        />
      </div>
    );
  };

  // const renderDocument = (document) => {
  //   if (!document || !document.url) return null;

  //   const getDocumentType = (url) => {
  //     const extension = url.split(".").pop().toLowerCase();
  //     if (["pdf"].includes(extension)) return "pdf";
  //     if (["docx"].includes(extension)) return "docx";
  //     if (["png", "jpg", "jpeg", "gif"].includes(extension)) return "image";
  //     if (["txt"].includes(extension)) return "text";
  //     if (url.startsWith("http://") || url.startsWith("https://")) return "link";
  //     return "unknown";
  //   };

  //   const documentType = getDocumentType(document.url);
  //   const documentUrl = document.url.startsWith("http") ? document.url : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${document.url}`;

  //   switch (documentType) {
  //     case "pdf":
  //       return (
  //         <div className="mt-4 p-4 bg-gray-50 rounded-lg">
  //           <div className="flex items-center justify-between">
  //             <div className="flex items-center">
  //               <svg
  //                 className="w-8 h-8 text-red-500"
  //                 fill="currentColor"
  //                 viewBox="0 0 20 20"
  //                 xmlns="http://www.w3.org/2000/svg"
  //               >
  //                 <path
  //                   fillRule="evenodd"
  //                   d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
  //                   clipRule="evenodd"
  //                 />
  //               </svg>
  //               <span className="ml-2 font-medium">Document</span>
  //             </div>
  //             <a
  //               href={documentUrl}
  //               target="_blank"
  //               rel="noreferrer"
  //               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
  //             >
  //               Open
  //             </a>
  //           </div>
  //           <div className="mt-4">
  //             <iframe
  //               src={documentUrl}
  //               type="application/pdf"
  //               width="100%"
  //               height="500px"
  //               style={{ border: "none" }}
  //               title="PDF Preview"
  //             ></iframe>
  //           </div>
  //         </div>
  //       );
  //     case "image":
  //       return (
  //         <div className="mt-4 p-4 bg-gray-50 rounded-lg">
  //           <img
  //             src={documentUrl}
  //             alt="Document Preview"
  //             className="w-full h-auto"
  //           />
  //         </div>
  //       );
  //     case "text":
  //       return (
  //         <div className="mt-4 p-4 bg-gray-50 rounded-lg">
  //           <iframe src={documentUrl} width="100%" height="400px"></iframe>
  //         </div>
  //       );
  //     case "link":
  //       return (
  //         <div className="mt-4 p-4 bg-gray-50 rounded-lg">
  //           <a
  //             href={documentUrl}
  //             target="_blank"
  //             rel="noreferrer"
  //             className="text-blue-600 hover:text-blue-800"
  //           >
  //             {documentUrl}
  //           </a>
  //         </div>
  //       );
  //     case "docx":
  //       return <DocxHtmlViewer url={documentUrl} />;

  //     default:
  //       return (
  //         <div className="mt-4 p-4 bg-gray-50 rounded-lg">
  //           <p>Preview not available for this document type.</p>
  //         </div>
  //       );
  //   }
  // };

  const renderDocument = (document) => {
    if (!document || !document.url) return null;

    const getDocumentType = (url) => {
      const extension = url.split(".").pop().toLowerCase();
      if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) return "image";
      return "other";
    };

    const documentType = getDocumentType(document.url);
    const documentUrl = document.url.startsWith("http")
      ? document.url
      : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${document.url || "/placeholder.png"}`;

    if (documentType === "image") {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <img
            src={documentUrl}
            alt="Document Preview"
            className="w-full h-auto rounded-lg shadow"
          />
        </div>
      );
    }

    // For all non-image types → return nothing
    return null;
  };


  const extractYouTubeId = (url) => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const renderAccordion = (accordion, index) => {
    if (!accordion) return null;

    const isActive = activeAccordion === index;
    const isCompleted = completedAccordions.has(accordion.id);

    const renderAttachment = (attachment) => {
      if (!attachment || !attachment.fileUrl) return null;

      switch (attachment.fileType) {
        case "video":
          return (
            <div className="mt-3">
              <VideoPlayer
                fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.fileUrl}`}
              />
            </div>
          );
        case "youtube":
          return (
            <div className="max-w-3xl mx-auto space-y-8 max-h-7xl">
              <iframe
                className="relative w-full h-96"
                src={`https://www.youtube.com/embed/${extractYouTubeId(
                  attachment.fileUrl
                )}?controls=0&disablekb=1&modestbranding=1&fs=0`}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="YouTube video player"
              ></iframe>
            </div>
          );
        case "audio":
          return (
            <div className="mt-3">
              <AudioPlayer2
                fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.fileUrl}`}
                onComplete={() => handleAccordionCompletion(accordion.id)}
              />
            </div>
          );
        case "document":
          return (
            <div className="mt-3 flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-2">Document</span>
              </div>
              <a
                href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${attachment.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
              >
                Open
              </a>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div
        key={accordion.id}
        className={`mb-3 border rounded-lg overflow-hidden ${isCompleted ? "border-green-500" : "border-gray-200"}`}
      >
        <button
          className={`w-full flex justify-between items-center p-4 text-left font-medium ${isActive
            ? "bg-blue-50 text-blue-700"
            : isCompleted
              ? "bg-green-50 text-green-700"
              : "bg-white"
            }`}
          onClick={() => setActiveAccordion(isActive ? null : index)}
        >
          <div className="flex items-center">
            {isCompleted && (
              <svg
                className="w-5 h-5 mr-2 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{accordion.title}</span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${isActive ? "transform rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>
        {isActive && (
          <div className="p-4 bg-white border-t border-gray-200 relative">
            <div
              className="overflow-y-auto max-h-80"
              style={{ maxHeight: "400px" }}
            >
              <div>{getProcessedDescription(accordion.body)}</div>
              {accordion.code && (
                <div className="relative bg-gray-900 p-4 rounded-lg mt-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(accordion.code);
                      setCopiedAccordion(index);
                      setTimeout(() => setCopiedAccordion(null), 2000);
                    }}
                    className={`absolute top-2 right-2 px-3 py-1 rounded text-sm transition ${copiedAccordion === index
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                  >
                    {copiedAccordion === index ? "✔ Copied!" : "Copy"}
                  </button>
                  <SyntaxHighlighter
                    language={accordion.codeLanguage || "javascript"}
                    style={dracula}
                  >
                    {accordion.code}
                  </SyntaxHighlighter>
                </div>
              )}
              {accordion.MultiSlideAccordionAttachments &&
                accordion.MultiSlideAccordionAttachments.map(
                  (attachment, idx) => (
                    <div key={idx}>{renderAttachment(attachment)}</div>
                  )
                )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSlideContent = () => {
    if (slideContentLoading) return <div>Loading slide content...</div>;
    if (!slideContent) return <div>No slide content found.</div>;

    switch (slideContent.type) {
      case "video":
        return (
          slideContent.MultiSlideVideos &&
          slideContent.MultiSlideVideos.map((video, idx) => (
            <div key={idx}>{renderVideo(video)}</div>
          ))
        );
      case "audio":
        return (
          slideContent.MultiSlideAudios &&
          slideContent.MultiSlideAudios.map((audio, idx) => (
            <div key={idx}>{renderAudio(audio)}</div>
          ))
        );
      case "general":
        return (
          slideContent.MultiSlideGenerals &&
          slideContent.MultiSlideGenerals.map((doc, idx) => {
            // Get the description from the correct location
            // Get description from slide content only
            // Since we're now showing tags globally, we don't need to prioritize the topic description
            const description = doc.description || slideContent.description;

            return (
              <div key={idx} className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800">
                  {doc.title}
                </h3>
                <div
                  className="overflow-y-auto max-h-80"
                  style={{ maxHeight: "400px" }}
                >
                  <div className="processed-content">
                    {/* {getProcessedDescription(topicData.description)} */}
                    {/* {processDescriptionWithTags(topicData.description)} */}
                    <h3 className="text-lg font-semibold text-gray-800">Code Example</h3>
                  </div>
                  {doc.code && (
                    <div className="relative bg-gray-900 p-4 rounded-lg mt-4">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(doc.code);

                          setCopiedGeneral(idx);
                          setTimeout(() => setCopiedGeneral(null), 2000);
                        }}
                        className={`absolute top-2 right-2 px-3 py-1 rounded text-sm transition ${copiedGeneral === idx
                          ? "bg-green-600 text-white"
                          : "bg-gray-700 text-white hover:bg-gray-600"
                          }`}
                      >
                        {copiedGeneral === idx ? "✔ Copied!" : "Copy"}
                      </button>
                      <SyntaxHighlighter
                        language={doc.codeLanguage || "javascript"}
                        style={dracula}
                      >
                        {doc.code}
                      </SyntaxHighlighter>
                    </div>
                  )}

                  <div className="mt-10 flex flex-wrap gap-2">
                    {doc.url && (
                      <>
                        <a
                          href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${doc.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center shadow-md hover:shadow-lg"
                        >
                          <svg
                            className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Open
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const pdfUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${doc.url}`;
                            window.open(pdfUrl, '_blank'); // Open in a new tab
                          }} download
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 flex items-center shadow-sm hover:shadow-md"
                        >
                          <svg
                            className="w-5 h-5 mr-2 transition-transform duration-300 hover:translate-y-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download
                        </a>
                      </>
                    )}

                    {doc.url && doc.url.toLowerCase().endsWith('.pdf') && (
                      <PdfExtractor
                        topicId={topicId}
                        general_flag={true}
                        pdfPath={doc.url}
                        materialUrl={doc.url}
                        access_token={access_token}
                        ms_gen_flag={1}
                        onSummaryGenerated={(data) => {
                          setSummaryData(data);
                          setShowSummary(true);
                        }}
                      />
                    )}

                    {description && (
                      !hasSummary ? (
                        <button
                          onClick={() => summarizeGeneralDescription(description)}
                          disabled={isLoading || isLoadingGeneralDescSummaries}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {(isLoading || isLoadingGeneralDescSummaries) ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Summarize Description
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowSummary(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center shadow-md hover:shadow-lg"
                        >
                          <svg
                            className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          View Description Summary
                        </button>
                      )
                    )}
                  </div>

                  {renderDocument(doc)}
                </div>
              </div>
            );
          })
        );
      case "accordian":
        const accordions = slideContent.MultiSlideAccordions || [];
        const allAccordionsComplete =
          accordions.length > 0 &&
          accordions.every((acc) => completedAccordions.has(acc.id));

        return (
          <>
            <div className="relative top-[-80px]">
              {!hasSummary ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    summarizeAllAccordionBodies();
                  }}
                  disabled={isLoading || isLoadingAccordionSummaries}
                  className="absolute top-0 right-0 px-4 py-2 my-5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isLoading || isLoadingAccordionSummaries) ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Summarizing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2 transition-transform duration-300 hover:translate-y-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Summarize
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setShowSummary(true)}
                  className="absolute top-0 right-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  <svg
                    className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Summary
                </button>
              )}
            </div>
            {accordions.map((accordion, idx) => renderAccordion(accordion, idx))}
          </>
        );
      default:
        return (
          <div className="p-4 bg-yellow-50 text-yellow-700 rounded">
            Unknown content type
          </div>
        );
    }
  };

  const getSlideTypeIcon = (type) => {
    switch (type) {
      case "video":
        return <Video size={18} className="text-indigo-500" />;
      case "audio":
        return <Headphones size={18} className="text-emerald-500" />;
      case "general":
        return <FileText size={18} className="text-blue-500" />;
      case "accordian":
        return <Layers size={18} className="text-purple-500" />;
      default:
        return null;
    }
  };

  // Add summary queries
  const { data: existingGeneralDescSummaries, isLoading: isLoadingGeneralDescSummaries } = useGetSummariesByMultiSlideGeneralDescIdQuery({
    topic_id: topicId,
    multi_slide_general_desc_id: 1,
    access_token,
  }, { skip: !topicId });

  const { data: existingGeneralPdfSummaries, isLoading: isLoadingGeneralPdfSummaries } = useGetSummariesByMultiSlideGeneralPdfIdQuery({
    topic_id: topicId,
    multi_slide_general_pdf_id: 1,
    access_token,
  }, { skip: !topicId });

  const { data: existingAccordionSummaries, isLoading: isLoadingAccordionSummaries } = useGetSummariesByMultiSlideAccordionIdQuery({
    topic_id: topicId,
    multi_slide_accordion_id: 1,
    access_token,
  }, { skip: !topicId });

  // Check for existing summaries when content changes
  useEffect(() => {
    if (slideContent) {
      let hasExistingSummary = false;
      let existingSummary = null;

      switch (slideContent.type) {
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

  if (slidesLoading) {
    return <div className="p-4 text-center">Loading slides...</div>;
  }

  if (showSummary && summaryData) {
    return <ContentSummary summaryData={summaryData} onBack={() => setShowSummary(false)} />;
  }

  // Function to render global topic tags
  const renderGlobalTopicTags = () => {
    if (!topicData?.TopicTags || topicData.TopicTags.length === 0) return null;

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Topic Resources</h3>
        <div className="flex flex-wrap gap-4">
          {/* {topicData.TopicTags.map((tag, idx) => {
            // Create a file URL for non-code tags
            const fileUrl = tag.tag_file_type !== "code"
              ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${tag.tag_file_path}`
              : null;

            // Based on tag type, render appropriate component
            switch (tag.tag_file_type) {
              case "image":
                return (
                  <div key={idx} className="resource-item">
                    <div className="resource-label mb-2">{tag.tag}</div>
                    <img
                      src={fileUrl}
                      alt={tag.tag}
                      className="max-w-xs rounded shadow-sm"
                      style={{ maxHeight: "150px" }}
                    />
                  </div>
                );
              case "video":
                return (
                  <div key={idx} className="resource-item">
                    <div className="resource-label mb-2">{tag.tag}</div>
                    <VideoPlayer
                      fileUrl={fileUrl}
                      width="300px"
                      height="180px"
                    />
                  </div>
                );
              case "audio":
                return (
                  <div key={idx} className="resource-item">
                    <div className="resource-label mb-2">{tag.tag}</div>
                    <audio controls className="w-full max-w-xs">
                      <source src={fileUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                );
              case "code":
                return (
                  <div key={idx} className="resource-item w-full">
                    <div className="resource-label mb-2">{tag.tag}</div>
                    <div
                      className="code-tag-container"
                      style={{
                        backgroundColor: "#f5f5f5",
                        padding: "10px",
                        borderRadius: "4px",
                        margin: "10px 0",
                        border: "1px solid #ddd",
                        overflow: "auto",
                        maxHeight: "200px",
                        width: "100%"
                      }}
                    >
                      <div className="code-header" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="language-badge" style={{ backgroundColor: "#e2e8f0", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                          {tag.code_language || "javascript"}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tag.tag_file_path);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          style={{
                            padding: "2px 8px",
                            backgroundColor: copied ? "#10B981" : "#4B5563",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "12px",
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          {copied ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        language={tag.code_language || "javascript"}
                        style={dracula}
                        customStyle={{ margin: 0 }}
                      >
                        {tag.tag_file_path}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                );
              case "other":
                const fileExtension = fileUrl.split('.').pop().toLowerCase();
                if (fileExtension === 'pdf') {
                  return (
                    <div key={idx} className="resource-item w-full">
                      <div className="resource-label mb-2">{tag.tag}</div>
                      <iframe
                        src={fileUrl}
                        width="100%"
                        height="300px"
                        title={tag.tag || "PDF Viewer"}
                        style={{ border: "none" }}
                      />
                    </div>
                  );
                } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
                  return (
                    <div key={idx} className="resource-item">
                      <div className="resource-label mb-2">{tag.tag}</div>
                      <img
                        src={fileUrl}
                        alt={tag.tag}
                        className="max-w-xs rounded shadow-sm"
                        style={{ maxHeight: "150px" }}
                      />
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="resource-item">
                      <div className="resource-label mb-2">{tag.tag}</div>
                      <div className="file-download">
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="download-link flex items-center p-2 bg-gray-100 rounded hover:bg-gray-200">
                          <div className="file-icon mr-2">📄</div>
                          <div>Click to view/download</div>
                        </a>
                      </div>
                    </div>
                  );
                }
              default:
                return (
                  <div key={idx} className="resource-item">
                    <span>{tag.tag}</span>
                  </div>
                );
            }
          })} */}

          <div
            className="text-sm text-gray-600 bg-gray-50 p-3 rounded"
            dangerouslySetInnerHTML={{ __html: topicData.description }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-8xl mx-auto w-full overflow-x-hidden">

      {/* Render global topic tags section above slides */}
      {renderGlobalTopicTags()}

      {/* <div className="mb-6 relative">
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{
              width: `${(completedSlides.size / sortedSlides.length) * 100}%`,
            }}
          ></div>
        </div>
      </div> */}

      <div className="flex items-center slide-nav-wrapper">
        <button
          onClick={goToPrevSlide}
          disabled={activeSlide === 0}
          className={`flex items-center px-3 sm:px-5 py-2.5 rounded-lg font-medium transition-all ${activeSlide === 0
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          <SkipBack size={18} className="mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>

        <div className="flex-1 relative mx-2 sm:mx-4 min-w-0">
          <div className="relative">
            <div
              className="flex gap-2 sm:gap-4 py-2 overflow-x-auto scrollbar-hide"
              style={{ scrollBehavior: "smooth" }}
            >
              {slides.map((slide, index) => {
                const isCompleted = completedSlides.has(slide.id);
                const isActive = slide.id === selectedSlideId;
                const isClickable =
                  isCompleted ||
                  isActive ||
                  (index === activeSlide + 1 &&
                    completedSlides.has(slides[activeSlide].id)) ||
                  (index > activeSlide &&
                    Array.from({ length: index }).every((_, i) =>
                      completedSlides.has(slides[i].id)
                    ));

                return (
                  <button
                    key={slide.id}
                    onClick={() => {
                      if (isClickable) {
                        goToSlide(slide.id);
                        setActiveSlide(index);
                        setActiveAccordion(null);
                      }
                    }}
                    disabled={!isClickable}
                    className={`flex items-center justify-center flex-shrink-0 min-w-[100px] sm:min-w-[140px] md:min-w-[160px] px-3 sm:px-4 py-3 transition-all duration-200 border-b-2 ${isActive
                      ? "border-indigo-600 text-indigo-600 font-semibold"
                      : "border-transparent"
                      } ${isCompleted
                        ? "text-green-700 hover:text-green-800"
                        : isClickable
                          ? "text-gray-700 hover:text-gray-900"
                          : "text-gray-400 opacity-60 cursor-not-allowed"
                      }`}
                  >
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {isCompleted ? (
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="flex-shrink-0">
                          {getSlideTypeIcon(slide.type)}
                        </div>
                      )}
                      <span className="font-medium text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px] sm:max-w-[80px] md:max-w-[100px]">
                        {slide.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Gradient edges only (chevron buttons removed per request) */}
            {slides.length > 3 && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
              </>
            )}
          </div>
        </div>

        {(!slideCompleted || activeSlide < slides.length - 1) && (
          <button
            onClick={goToNextSlide}
            disabled={activeSlide === slides.length - 1 || !slideCompleted}
            className={`flex items-center px-3 sm:px-5 py-2.5 rounded-lg font-medium transition-all ${activeSlide === slides.length - 1 || !slideCompleted
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">Next</span>
            <SkipForward size={18} className="ml-1 sm:ml-2" />
          </button>
        )}
      </div>

      <div className="mb-8">
        <div className="p-6 transition-all">
          <div className="flex items-center mb-4">
            {getSlideTypeIcon(slideContent?.type)}
            <h2 className="text-xl font-semibold text-gray-800 ml-2">
              {slideContent?.title}
            </h2>

            {/* Info icon with hover tooltip */}
            <div className="relative ml-2 group">
              <Info
                size={20}
                className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              />

              {/* Tooltip that appears on hover */}
              <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                <div dangerouslySetInnerHTML={{ __html: topicData.description }} />
                {/* Arrow pointing down */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-6">
            {/* Left side (slide content) */}
            <div
              className={
                slideContent?.type === "general"
                  ? "flex-[1] min-h-[600px] flex flex-col"   // shrink
                  : "flex-[2] min-h-[600px] flex flex-col"   // default
              }
            >
              <div className="flex-1">{renderSlideContent()}</div>

              {slideContent?.completion_type === "audio" &&
                slideContent?.audio_url && (
                  <div className="sticky bottom-0 left-0 right-0 z-20">
                    <AudioPlayer2
                      fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${slideContent.audio_url}`}
                      onComplete={handleMarkAsCompleted}
                    />
                  </div>
                )}

              {!slideCompleted &&
                slideContent?.completion_type === "timer" &&
                slideContent?.completion_time && (
                  <ContentTimer
                    key={selectedSlideId}
                    topicId={topicId}
                    moduleId={slideContent.module_id}
                    completionTime={slideContent.completion_time * 60}
                    onCompletion={handleMarkAsCompleted}
                    isCompleted={slideCompleted}
                    access_token={access_token}
                    userId={userId}
                    slideId={selectedSlideId}
                    contentChanged={contentChanged}
                    setContentChanged={setContentChanged}
                    activeSlide={activeSlide}
                    setActiveSlide={setActiveSlide}
                  />
                )}
            </div>

            {/* Right side (description) */}
            <div
              className={
                slideContent?.type === "general"
                  ? "flex-[2] h-[500px] p-4 overflow-y-auto bg-white shadow-md border-2 text-gray-700 rounded-lg" // expand
                  : "flex-[1] h-[500px] p-4 overflow-y-auto bg-white shadow-md border-2 text-gray-700 rounded-lg" // default
              }
            >
              {/* {getProcessedDescription(slideContent?.description)} */}
              {processDescriptionWithTags(slideContent?.description)}
              {/* <div dangerouslySetInnerHTML={{ __html: slideContent?.description }} /> */}
            </div>
          </div>

          <div className="-mt-14">
            {slideCompleted && (
              <div className="py-3 px-4 justify-center bg-green-50 text-green-800 rounded-lg border border-green-100 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                <span className="font-medium">
                  {completedSlides.size === slides.length
                    ? "All slides completed! Click the navigation button above to continue to the next section."
                    : "Slide Completed"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Local style overrides for default slider arrows & unwanted pseudo icons */}
      <style>{`
        /* Remove default slick slider arrow pseudo-elements if slick classes are present */
        .slide-nav-wrapper .slick-prev:before, 
        .slide-nav-wrapper .slick-next:before { content: '' !important; }
        /* Also neutralize any direct text content that might render arrows */
        .slide-nav-wrapper .slick-prev, 
        .slide-nav-wrapper .slick-next { 
          font-size: 0 !important; 
          color: transparent !important; 
          text-shadow: none !important; 
        }
        /* Ensure our custom navigation buttons don't inherit unexpected pseudo content */
        .slide-nav-wrapper button::before, 
        .slide-nav-wrapper button::after { content: none !important; }
        /* Prevent internal nav area from creating a page-level horizontal scrollbar */
        .slide-nav-wrapper { overflow: hidden; }
        /* The scrolling list itself can still scroll horizontally */
        .slide-nav-wrapper .overflow-x-auto { overscroll-behavior-inline: contain; }
        /* Safety: remove any margin/padding that could push layout width */
        .slide-nav-wrapper .slick-slider { margin: 0 !important; }
      `}</style>
    </div>
  );
}