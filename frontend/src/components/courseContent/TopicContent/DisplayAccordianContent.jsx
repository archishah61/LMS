/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import AudioPlayerMini from "../../ui/audioPlayermini";
import AudioPlayer2 from "../../ui/audioPlayer2";
import VideoPlayer from "../../ui/VideoPlayer";
import parse, { domToReact } from "html-react-parser";
import { useSummarizePassageMutation } from "../../../services/Ai/summarizeApi";
import ContentSummary from "./ContentSummary";
import { useCreateSummaryMutation, useGetSummariesByAccordionIdQuery } from "../../../services/Ai/summaryApi";
import { useCreateBulletPointMutation } from "../../../services/Ai/bulletPointApi";
import { useCreateFlashCardMutation } from "../../../services/Ai/flashCardApi";
import ContentTimer from "./ContentTimer";

export default function DisplayAccordianContent({
  topicData,
  handleTopicEnd,
  completedTopics,
  access_token,
  userId,
  topics,
  handleTopicClick,
  assignmentData,
  handleShowAssignments,
  quizData,
  handleShowQuiz,
}) {
  const [openAccordion, setOpenAccordion] = useState(0);
  const [activeTab, setActiveTab] = useState("content");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCompleted, setIsCompleted] = useState(completedTopics[topicData.id] || false);
  const [copied, setCopied] = useState(false);
  const [completedAccordions, setCompletedAccordions] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [hasSummary, setHasSummary] = useState(false);

  const { title, description, Accordions, TopicTags } = topicData;

  const { data: existingSummaries, isLoading: isLoadingSummaries, refetch } = useGetSummariesByAccordionIdQuery(
    {
      topic_id: topicData.id,
      accordion_id: 1,
      access_token,
    },
    {
      pollingInterval: 30000,
    }
  );

  useEffect(() => {
    if (existingSummaries && existingSummaries.length > 0) {
      const userSummary = existingSummaries[0];
      if (userSummary) {
        setHasSummary(true);
        setSummaryData({
          summary: userSummary.summary,
          bullet_points: userSummary.bullet_points.map(bp => bp.bullet_point),
          flash_cards: userSummary.flash_cards.map(fc => ({
            question: fc.question,
            answer: fc.answer,
          })),
        });
      } else {
        setHasSummary(false);
        setSummaryData(null);
      }
    } else {
      setHasSummary(false);
      setSummaryData(null);
    }
  }, [existingSummaries]);

  useEffect(() => {
    const checkAllCompleted = () => {
      // Check for accordions that have any completion requirement (audio or timer)
      const accordionsWithCompletion = Accordions?.filter((acc) =>
        acc.audio_url || (acc.completion_type === "timer" && acc.completion_time)
      ) || [];

      if (accordionsWithCompletion.length === 0) return;

      const allCompleted = accordionsWithCompletion.every((acc) => completedAccordions[acc.id]);
      if (allCompleted && !isCompleted) {
        handleTopicEnd(topicData.id, topicData.module_id);
        setIsCompleted(true);
      }
    };

    checkAllCompleted();
  }, [completedAccordions, Accordions, handleTopicEnd, topicData.id, topicData.module_id, isCompleted]);

  const toggleAccordion = (index) => {
    if (openAccordion === index) {
      setActiveTab("content");
    } else {
      setOpenAccordion(index);
      setActiveTab("content");
      setCurrentSlide(0);
    }
  };

  const handleAudioComplete = (accordionId) => {
    setCompletedAccordions((prev) => ({ ...prev, [accordionId]: true }));
  };

  const createMarkup = (html) => {
    return getProcessedDescription(html);
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "document":
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "audio":
        return (
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case "video":
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case "image":
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const renderAttachmentPreview = (attachment) => {
    const { fileUrl, fileType } = attachment;
    switch (fileType) {
      case "video":
        return (
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-md">
            <VideoPlayer fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl}`}/>
          </div>
        );
      case "youtube":
        return (
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-md">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${extractYouTubeId(fileUrl)}?controls=0&disablekb=1&modestbranding=1&fs=0`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen title="YouTube video player"></iframe>
          </div>
        );
      case "audio":
        return <AudioPlayer2 fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl}`} />;
      case "document":
        return (
          <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center shadow-sm">
            <svg className="w-16 h-16 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-base text-gray-700 mb-4">PDF Document</p>
            <a href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${fileUrl}`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out">Open Document</a>
          </div>
        );
      case "image":
        return (
          <div className="w-full flex justify-center">
            <img src={fileUrl} alt="Attachment" className="max-w-full h-auto rounded-lg shadow-md" />
          </div>
        );
      default:
        return (
          <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center shadow-sm">
            <p className="text-base text-gray-700 mb-4">Preview not available</p>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out">Download File</a>
          </div>
        );
    }
  };

  const isAccordionCompleted = (accordion) => {
    return completedAccordions[accordion.id] === true;
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
              className="max-w-full h-auto rounded-lg shadow-md mx-auto"
            />
          );
        case "video":
          return (
            <div className="w-full aspect-video">
              <VideoPlayer
                fileUrl={fileUrl}
              />
            </div>
          );
        case "audio":
          return (
            <audio controls className="w-full mt-4">
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
                height="600"
                title={matchedTag?.tag || "PDF Viewer"}
                className="border-none rounded-lg shadow-md"
              />
            );
          }
          // For images
          else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
            return (
              <img
                src={fileUrl}
                alt={matchedTag.tag}
                className="w-full max-w-3xl mx-auto rounded-lg shadow-md"
              />
            );
          }
          // For other file types, show a download link
          else {
            return (
              <div className="file-download max-w-md mx-auto bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 hover:bg-gray-50 transition duration-300 ease-in-out rounded-lg p-3"
                >
                  {/* File Icon */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 text-blue-600 text-2xl">
                    📄
                  </div>
 
                  {/* File Info */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Click to view/download</p>
                    <p className="font-semibold text-gray-800 truncate">
                      {matchedTag.tag.replace(/^#|#$/g, '')}
                    </p>
                  </div>
 
                  {/* Download Button */}
                  <div className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition duration-300 ease-in-out">
                    Download
                  </div>
                </a>
              </div>
            );
          }

        case "code":
          // For code tags, don't create a URL - use the code content directly
          return (
            <div
              className="code-tag-container bg-gray-900 rounded-lg overflow-hidden shadow-md my-6"
              style={{
                maxHeight: "600px",
                overflow: "auto",
              }}
            >
              <div className="code-header flex justify-between items-center px-4 py-2 bg-gray-800">
                <div className="language-badge bg-gray-700 text-gray-300 px-3 py-1 rounded-md text-sm font-medium">
                  {matchedTag.code_language || "javascript"}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(matchedTag.tag_file_path);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`px-3 py-1 rounded-md text-sm transition duration-300 ease-in-out ${copied ? "bg-green-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <SyntaxHighlighter
                language={matchedTag.code_language || "javascript"}
                style={dracula}
                customStyle={{ margin: 0, padding: "1rem" }}
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
          // Create a wrapped version of the tag component with proper styling
          const tagComponent = createTagComponent(matchedTag);
          parts.push(
            <div key={`tag-${tag}`} className="my-6 max-w-4xl mx-auto">
              {tagComponent}
            </div>
          );
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

                // Process each tag in the paragraph
                let processedContent = content;
                let components = [];

                // For a standalone tag (just the tag and nothing else)
                if (content.match(/^(#[^#\s]+#)$/)) {
                  const matchedTag = topicData.TopicTags?.find((t) => t.tag === content);
                  if (matchedTag) {
                    // Return the tag component with paragraph styling preserved
                    const tagComponent = createTagComponent(matchedTag);
                    return (
                      <div className={`my-4 ${domNode.attribs?.style?.includes('text-align: center') ? 'text-center' : 'text-left'}`}>
                        {tagComponent}
                      </div>
                    );
                  }
                }

                // For mixed content (text with one or more tags)
                const processedTextContent = processTextWithTags(content);
                if (React.isValidElement(processedTextContent)) {
                  return (
                    <p className={`my-4 text-base leading-relaxed text-gray-700 ${domNode.attribs?.style?.includes('text-align: center') ? 'text-center' : 'text-left'}`}>
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

  const [summarizePassage, { data, error, isLoading }] = useSummarizePassageMutation();
  const [createSummary] = useCreateSummaryMutation();
  const [createBulletPoint] = useCreateBulletPointMutation();
  const [createFlashCard] = useCreateFlashCardMutation();

  const viewSummary = () => {
    if (summaryData) {
      setShowSummary(true);
    }
  };

  const summarizeAllAccordions = async () => {
    if (!Accordions || Accordions.length === 0) return;

    try {
      const allBodies = Accordions.map(accordion => accordion.body).join('\n\n');
      const result = await summarizePassage({ passage: allBodies, access_token }).unwrap();

      const summaryData = {
        topic_id: topicData.id,
        summary: result.summary,
        general_material_desc_id: null,
        general_material_pdf_id: null,
        accordion_id: 1,
        multi_slide_general_desc_id: null,
        multi_slide_general_pdf_id: null,
        multi_slide_accordion_id: null,
        user_id: access_token.userId
      };

      const response = await createSummary({ summaryData, access_token }).unwrap();

      const bulletPointData = {
        summary_id: response.id,
        bullet_point: result.bullet_points,
      };

      await createBulletPoint({ bulletPointData, access_token }).unwrap();

      const flashCardData = {
        summary_id: response.id,
        flash_cards: result.flash_cards,
      };

      await createFlashCard({ flashCardData, access_token }).unwrap();

      // Refetch the summaries to ensure the latest data is displayed
      await refetch();

      setSummaryData({
        summary: result.summary,
        bullet_points: result.bullet_points,
        flash_cards: result.flash_cards,
      });
      setShowSummary(true);
      setHasSummary(true);
    } catch (error) {
      console.error('Error summarizing all accordion bodies:', error);
    }
  };

  if (showSummary && summaryData) {
    return <ContentSummary summaryData={summaryData} onBack={() => setShowSummary(false)} />;
  }

  return (
    <div className="max-w-8xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-8">
        {description && (
          <div className="mt-4 text-gray-700 prose prose-lg max-w-none">
            {createMarkup(description)}
          </div>
        )}
      </div>

      {Accordions && Accordions.length > 0 && (
        <div className="px-8 pb-4">
          {(() => {
            // Get accordions that have completion requirements
            const accordionsWithCompletion = Accordions.filter((acc) =>
              acc.audio_url || (acc.completion_type === "timer" && acc.completion_time)
            );
            const completedAccordionsCount = accordionsWithCompletion.filter(isAccordionCompleted).length;
            const totalAccordionsWithCompletion = accordionsWithCompletion.length;

            return (
              <>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${totalAccordionsWithCompletion > 0 ? (completedAccordionsCount / totalAccordionsWithCompletion) * 100 : 0}%` }}></div>
                </div>
                <div className="text-right text-sm text-gray-600 mt-2">
                  {completedAccordionsCount}/{totalAccordionsWithCompletion} completed
                </div>
              </>
            );
          })()}
        </div>
      )}

      <div className="p-8 space-y-6">
        {!hasSummary ? (
          <button
            onClick={summarizeAllAccordions}
            disabled={isLoading || isLoadingSummaries}
            className={`px-6 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center shadow-md hover:shadow-lg ${(isLoading || isLoadingSummaries) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
              }`}
          >
            {(isLoading || isLoadingSummaries) ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Get Summary
              </>
            )}
          </button>
        ) : (
          <button
            onClick={viewSummary}
            className="px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Summary
          </button>
        )}

        {Accordions && Accordions.length > 0 ? (
          <div className="space-y-6">
            {Accordions.map((accordion, index) => (
              <div key={accordion.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out">
                <button className={`w-full text-left p-6 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${openAccordion === index ? "bg-blue-50" : isAccordionCompleted(accordion) ? "bg-green-50" : "bg-gray-50"}`} onClick={() => toggleAccordion(index)}>
                  <div className="flex items-center">
                    {isAccordionCompleted(accordion) && (
                      <span className="mr-3 flex-shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                    <h3 className="text-xl font-semibold text-gray-800">{accordion.title}</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    {accordion.AccordionAttachments && accordion.AccordionAttachments.length > 0 && (
                      <span className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {accordion.AccordionAttachments.length}
                      </span>
                    )}
                    {accordion.audio_url && (
                      <span className="flex items-center text-sm text-purple-600">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.728-2.728" />
                        </svg>
                      </span>
                    )}
                    {accordion.completion_type === "timer" && accordion.completion_time && (
                      <span className="flex items-center text-sm text-orange-600">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {accordion.completion_time}:00
                      </span>
                    )}
                    <svg className={`h-6 w-6 transform transition-transform duration-300 ease-in-out ${openAccordion === index ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {openAccordion === index && (
                  <div className="border-t border-gray-200">
                    {accordion.AccordionAttachments && accordion.AccordionAttachments.length > 0 && (
                      <div className="bg-gray-50 px-6 border-b border-gray-200">
                        <div className="flex space-x-8">
                          <button className={`py-4 px-2 border-b-2 font-semibold text-base ${activeTab === "content" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 transition duration-300"}`} onClick={() => setActiveTab("content")}>Content</button>
                          <button className={`py-4 px-2 border-b-2 font-semibold text-base ${activeTab === "attachments" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 transition duration-300"}`} onClick={() => { setActiveTab("attachments"); setCurrentSlide(0); }}>Attachments ({accordion.AccordionAttachments.length})</button>
                        </div>
                      </div>
                    )}

                    {activeTab === "content" && (
                      <div className="p-6 bg-white">
                        <div className="accordion-content prose prose-lg max-w-none text-gray-700 leading-relaxed">
                          {getProcessedDescription(accordion.body)}
                        </div>
                        
                        {accordion.code && (
                          <div className="relative bg-gray-900 p-4 rounded-lg mt-8 shadow-md">
                            <button onClick={() => { navigator.clipboard.writeText(accordion.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-sm transition duration-300 ease-in-out ${copied ? "bg-green-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"}`}>
                              {copied ? "✔ Copied!" : "Copy"}
                            </button>
                            <SyntaxHighlighter language={accordion.codeLanguage || "javascript"} style={dracula}>{accordion.code}</SyntaxHighlighter>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "attachments" && accordion.AccordionAttachments && accordion.AccordionAttachments.length > 0 && (
                      <div className="p-6 bg-white">
                        <div className="relative max-w-4xl mx-auto">
                          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                              <div className="flex items-center">
                                {getFileIcon(accordion.AccordionAttachments[currentSlide].fileType)}
                                <span className="ml-3 font-semibold text-gray-800">
                                  {accordion.AccordionAttachments[currentSlide].fileType.charAt(0).toUpperCase() + accordion.AccordionAttachments[currentSlide].fileType.slice(1)} - {currentSlide + 1} of {accordion.AccordionAttachments.length}
                                </span>
                              </div>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const pdfUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${accordion.AccordionAttachments[currentSlide].fileUrl}`;
                                  window.open(pdfUrl, '_blank'); // Open in a new tab
                                }}
                                className="text-blue-600 hover:text-blue-800 text-base flex items-center transition duration-300 ease-in-out"
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                              </a>

                            </div>
                            <div className="p-6">
                              {renderAttachmentPreview(accordion.AccordionAttachments[currentSlide])}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-6">
                            <button onClick={() => setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))} disabled={currentSlide === 0} className={`p-3 rounded-full transition duration-300 ease-in-out ${currentSlide === 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"}`}>
                              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>

                            <div className="flex space-x-3">
                              {accordion.AccordionAttachments.map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-3 h-3 rounded-full transition duration-300 ease-in-out ${currentSlide === idx ? "bg-blue-600 scale-125" : "bg-gray-300 hover:bg-gray-400"}`} aria-label={`Go to slide ${idx + 1}`} />
                              ))}
                            </div>

                            <button onClick={() => setCurrentSlide((prev) => (prev < accordion.AccordionAttachments.length - 1 ? prev + 1 : prev))} disabled={currentSlide === accordion.AccordionAttachments.length - 1} className={`p-3 rounded-full transition duration-300 ease-in-out ${currentSlide === accordion.AccordionAttachments.length - 1 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50"}`}>
                              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timer or Audio completion logic */}
                    {accordion.completion_type === "timer" && accordion.completion_time && !isAccordionCompleted(accordion) && (
                      <ContentTimer
                        topicId={topicData.id}
                        moduleId={topicData.module_id}
                        completionTime={accordion.completion_time * 60} // Convert minutes to seconds
                        onCompletion={() => handleAudioComplete(accordion.id)}
                        isCompleted={isAccordionCompleted(accordion)}
                        userId={userId}
                      />
                    )}
                    {accordion.completion_type === "audio" && accordion.audio_url && (
                      <AudioPlayerMini
                        fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${accordion.audio_url}`}
                        onComplete={() => handleAudioComplete(accordion.id)}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 text-lg">No accordion content available</div>
        )}
      </div>
    </div>
  );
}