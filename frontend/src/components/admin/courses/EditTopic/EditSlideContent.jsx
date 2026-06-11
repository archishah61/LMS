/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Trash2,
  MoveUp,
  MoveDown,
  Tag,
  X,
  Upload,
  Paperclip,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { sql } from "@codemirror/lang-sql";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { php } from "@codemirror/lang-php";
import { go } from "@codemirror/lang-go";
import { rust } from "@codemirror/lang-rust";
import { markdown } from "@codemirror/lang-markdown";
import TextToAudioConverter from "../../AIServices/TextToAudioConverter";

// Utility function to extract YouTube video ID
const extractYouTubeId = (url) => {
  if (!url) return null;

  // Match YouTube URL patterns
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  // Return the ID if found
  return match && match[2].length === 11 ? match[2] : null;
};

const EditSlideContent = ({
  slides,
  slidePreviews,
  setSlidePreviews,
  updateSlides,
  contentTypes,
  renderSlideContentForm,
  handleSlideFileChange,
  addSlideMaterialRow,
  updateSlideMaterialRow,
  removeSlideMaterialRow,
  handleSlideMaterialFileChange,
  materialTypes,
  codeLanguages,
  getLanguageExtension,
  getAcceptType
}) => {

  // Track which slides are expanded
  const [expandedSlides, setExpandedSlides] = useState(
    slides.map((_, index) => index === 0) // Initially expand only the first slide
  );

  // Update expandedSlides when slides change
  useEffect(() => {
    if (expandedSlides.length !== slides.length) {
      setExpandedSlides(slides.map((_, index) => index === 0));
    }
  }, [slides.length]);

  // Add this useEffect after the existing expandedSlides useEffect
  useEffect(() => {
    // Ensure all slides have proper sequence numbers when component loads
    if (slides && slides.length > 0) {
      const needsSequencing = slides.some(
        (slide) => slide.sequence_no === undefined
      );
      if (needsSequencing) {
        const sequencedSlides = slides.map((slide, index) => ({
          ...slide,
          sequence_no: slide.sequence_no || index + 1,
        }));
        updateSlides(sequencedSlides);
      }
    }
  }, [slides]);

  const completionTypes = [
    { value: "audio", label: "Audio" },
    { value: "timer", label: "Timer" },
  ];

  const normalizeLocalMinuteSecondString = (rawValue) => {
    if (rawValue === undefined || rawValue === null || rawValue === "") return "0.00";

    const valueAsString = String(rawValue).trim();

    if (valueAsString.includes(":")) {
      const [mPart, sPart] = valueAsString.split(":");
      const mm = parseInt(mPart, 10);
      const ss = parseInt(sPart, 10);
      if (Number.isFinite(mm) && Number.isFinite(ss) && ss >= 0 && ss <= 59) {
        return (mm + ss / 60).toFixed(2);
      }
    }

    const parsed = parseFloat(valueAsString);
    if (!Number.isFinite(parsed) || parsed < 0) return "0.00";
    return parsed.toFixed(2);
  };

  const decimalMinutesToMmSs = (minutes) => {
    const totalSeconds = Math.round((Number(minutes) || 0) * 60);
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const decimalMinutesToHhMmSs = (minutes) => {
    const totalSeconds = Math.round((Number(minutes) || 0) * 60);
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const toggleSlide = (index) => {
    const newExpandedSlides = [...expandedSlides];
    newExpandedSlides[index] = !newExpandedSlides[index];
    setExpandedSlides(newExpandedSlides);
  };

  const handleSlideChange = (index, field, value) => {
    const updatedSlides = [...slides];
    if (field === "slideCompletionType") {
      if (value === "audio") {
        updatedSlides[index].slideCompletionTime = 0;
      } else if (value === "timer") {
        updatedSlides[index].slideAudioFile = null;
        updatedSlides[index].audioDuration = "";
        setSlidePreviews((prev) => {
          const updatedPreviews = { ...prev };
          delete updatedPreviews[`slideAudioFile-${index}`];
          return updatedPreviews;
        });
      }
    }
    updatedSlides[index][field] = value;
    updateSlides(updatedSlides);
  };

  // Handle audio file change for TextToAudioConverter
  const handleSlideAudioFileChange = (index, event, fieldName) => {
    const file = event.target.files[0];
    handleSlideFileChange(index, fieldName, file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setSlidePreviews((prev) => ({
        ...prev,
        [`${fieldName}-${index}`]: previewUrl,
      }));
    } else {
      handleSlideChange(index, "audioDuration", "");
      // Clear preview when file is removed
      setSlidePreviews((prev) => {
        const updatedPreviews = { ...prev };
        delete updatedPreviews[`${fieldName}-${index}`];
        return updatedPreviews;
      });
    }
  };

  // Set audio preview for TextToAudioConverter
  const setSlideAudioPreviewForConverter =
    (index, fieldName) => (previewUrl) => {
      setSlidePreviews((prev) => ({
        ...prev,
        [`${fieldName}-${index}`]: previewUrl,
      }));
    };

  const handleSlideEditorChange = (index, content) => {
    const updatedSlides = [...slides];
    updatedSlides[index].description = content;
    updateSlides(updatedSlides);
  };

  const handleVideoTypeChange = (index, type) => {
    const updatedSlides = [...slides];

    // Don't allow changing video type for existing slides (ones with an id)
    if (updatedSlides[index].id) {
      console.warn("Cannot change video type for existing slides");
      return;
    }

    if (type === "internal") {
      updatedSlides[index].videoType = "internal";
      updatedSlides[index].videoUrl = "";
      // Reset YouTube-related data
    } else {
      updatedSlides[index].videoType = "youtube";
      updatedSlides[index].videoFile = null;
      // Clear video file preview when switching to YouTube
      setSlidePreviews((prev) => {
        const updated = { ...prev };
        delete updated[`videoPreview-${index}`];
        return updated;
      });
    }
    updateSlides(updatedSlides);
  };

  const handleSlideContentTypeChange = (index, value) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      content_type: value,
      videoFile: null,
      videoType: "internal", // Default video type
      videoUrl: "", // For YouTube videos
      videoDuration: "",
      audioFile: null,
      audioDuration: "",
      accordianSections: [
        {
          title: "",
          body: "",
          mediaUrl: [],
        },
      ],
      generalFile: null,
      materialType: "",
      externalLink: "",
      tags: [{ tagName: "", tagFile: null }],
    };
    updateSlides(updatedSlides);
  };

  const addSlide = () => {
    updateSlides([
      ...slides,
      {
        title: "",
        description: "",
        content_type: "",
        videoFile: null,
        videoType: "internal", // Default video type
        videoUrl: "", // For YouTube videos
        slideCompletionType: "audio",
        slideCompletionTime: 0,
        slideAudioFile: null,
        videoDuration: "",
        audioFile: null,
        audioDuration: "",
        accordianSections: [
          {
            title: "",
            body: "",
            mediaUrl: [],
          },
        ],
        generalFile: null,
        materialType: "",
        externalLink: "",
        generalCodeLanguage: "",
        generalCode: "",
        slide_extra_duration: "0",
        tags: [{ tagName: "", tagFile: null }],
        sequence_no: slides.length + 1,
      },
    ]);
  };

  const removeSlide = (index) => {
    if (slides.length > 1) {
      const updatedSlides = slides.filter((_, i) => i !== index);

      // Re-sequence remaining slides
      updatedSlides.forEach((slide, idx) => {
        slide.sequence_no = idx + 1;
      });

      updateSlides(updatedSlides);
    }
  };

  const moveSlide = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === slides.length - 1)
    ) {
      return;
    }

    const updatedSlides = [...slides];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    [updatedSlides[index], updatedSlides[newIndex]] = [
      updatedSlides[newIndex],
      updatedSlides[index],
    ];

    // Update sequence numbers after moving
    updatedSlides.forEach((slide, idx) => {
      slide.sequence_no = idx + 1;
    });

    updateSlides(updatedSlides);
  };

  const handleTagChange = (slideIndex, tagIndex, field, value) => {
    const updatedSlides = [...slides];
    const updatedTags = [...updatedSlides[slideIndex].tags];
    updatedTags[tagIndex] = {
      ...updatedTags[tagIndex],
      [field]:
        field === "tagFile" ? value : value.target ? value.target.value : value,
    };
    updatedSlides[slideIndex].tags = updatedTags;
    updateSlides(updatedSlides);
  };

  const addTag = (slideIndex) => {
    const updatedSlides = [...slides];
    if (!updatedSlides[slideIndex].tags) {
      updatedSlides[slideIndex].tags = [];
    }
    updatedSlides[slideIndex].tags.push({ tagName: "", tagFile: null });
    updateSlides(updatedSlides);
  };

  const removeTag = (slideIndex, tagIndex) => {
    const updatedSlides = [...slides];
    updatedSlides[slideIndex].tags = updatedSlides[slideIndex].tags.filter(
      (_, i) => i !== tagIndex
    );
    updateSlides(updatedSlides);
  };

  // Pass this to parent component to use in renderSlideContentForm
  const handleYouTubeVideoChange = (index, url) => {
    // Allow changing the YouTube URL even for existing slides
    // We're just updating the URL, not switching video types
    handleSlideChange(index, "videoUrl", url);
  };

  // const addSlideMaterialRow = (slideIndex) => {

  //   setFormData((prev) => {
  //     const updatedSlides = [...prev.slides];
  //     updatedSlides[slideIndex] = {
  //       ...updatedSlides[slideIndex],
  //       materials: [
  //         ...(updatedSlides[slideIndex].materials || []),
  //         { material_type: "", link: "", file: null, code: "", codeLanguage: "" },
  //       ],
  //     };
  //     return { ...prev, slides: updatedSlides };
  //   });
  // };

  // const updateSlideMaterialRow = (slideIndex, materialIndex, key, value) => {
  //   setFormData((prev) => {
  //     const updatedSlides = [...prev.slides];
  //     const updatedMaterials = [...(updatedSlides[slideIndex].materials || [])];
  //     updatedMaterials[materialIndex] = {
  //       ...updatedMaterials[materialIndex],
  //       [key]: value,
  //     };
  //     updatedSlides[slideIndex] = {
  //       ...updatedSlides[slideIndex],
  //       materials: updatedMaterials,
  //     };
  //     return { ...prev, slides: updatedSlides };
  //   });
  // };

  // const removeSlideMaterialRow = (slideIndex, materialIndex) => {
  //   setFormData((prev) => {
  //     const updatedSlides = [...prev.slides];
  //     const updatedMaterials = (updatedSlides[slideIndex].materials || []).filter(
  //       (_, i) => i !== materialIndex
  //     );
  //     updatedSlides[slideIndex] = {
  //       ...updatedSlides[slideIndex],
  //       materials: updatedMaterials,
  //     };
  //     return { ...prev, slides: updatedSlides };
  //   });
  // };

  // const handleSlideMaterialFileChange = (slideIndex, materialIndex, file) => {
  //   if (!file) return;
  //   setFormData((prev) => {
  //     const updatedSlides = [...prev.slides];
  //     const updatedMaterials = [...(updatedSlides[slideIndex].materials || [])];
  //     updatedMaterials[materialIndex] = {
  //       ...updatedMaterials[materialIndex],
  //       file,
  //     };
  //     updatedSlides[slideIndex] = {
  //       ...updatedSlides[slideIndex],
  //       materials: updatedMaterials,
  //     };
  //     return { ...prev, slides: updatedSlides };
  //   });
  // };

  return (
    <div className="space-y-4 md:space-y-6 p-4 bg-white rounded-lg shadow mt-4 md:mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-800">Slides</h2>
          <span className="bg-lightGreen text-forestGreen text-sm font-medium px-2.5 py-0.5 rounded-full">
            {slides.length}
          </span>
        </div>
      </div>

      {slides.map((slide, index) => (
        <div key={index} className="rounded-lg bg-white overflow-hidden">
          {/* Slide header - always visible */}
          <div
            className="py-2 md:p-4 border-b flex justify-between items-center border border-gray-200 shadow-md cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSlide(index)}
          >
            <div className="flex items-center">
              {expandedSlides[index] ? (
                <ChevronDown className="w-5 h-5 text-gray-700 mr-2" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-700 mr-2" />
              )}
              <div className="md:flex items-center">
                <h4 className="text-lg font-medium text-gray-900">
                  <span className="hidden sm:inline">Slide</span> {index + 1}: {slide.title || "Untitled"}
                </h4>
                <span className="ml-3 text-sm text-gray-500">
                  {slide.content_type
                    ? `(${slide.content_type
                      .charAt(0)
                      .toUpperCase()}${slide.content_type.slice(1)})`
                    : "(No content type selected)"}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSlide(index, "up");
                }}
                disabled={index === 0}
                className={`p-1 rounded ${index === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-leafGreen hover:text-forestGreen"
                  }`}
              >
                <MoveUp className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveSlide(index, "down");
                }}
                disabled={index === slides.length - 1}
                className={`p-1 rounded ${index === slides.length - 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-leafGreen hover:text-forestGreen"
                  }`}
              >
                <MoveDown className="w-5 h-5" />
              </button>
              {slides.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlide(index);
                  }}
                  className="p-1 text-red-500 hover:text-red-700 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Slide content - toggleable */}
          {expandedSlides[index] && (
            <div className="md:p-6 space-y-4 md:space-y-6 mt-4">
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type*
                </label>
                <select
                  value={slide.content_type}
                  onChange={(e) =>
                    handleSlideContentTypeChange(index, e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                >
                  <option value="">Select Content Type</option>
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slide Title*
                </label>
                <input
                  type="text"
                  required
                  value={slide.title}
                  onChange={(e) =>
                    handleSlideChange(index, "title", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                  placeholder="Enter slide title"
                />
              </div>

              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slide Description
                </label>
                <Editor
                  apiKey={import.meta.env.VITE_TINYMCE_API}
                  value={slide.description}
                  init={{
                    height: 250,
                    menubar: true,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "charmap",
                      "print",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "paste",
                      "help",
                      "wordcount",
                      "emoticons",
                      "hr",
                      "nonbreaking",
                    ],
                    toolbar:
                      "undo redo | formatselect | bold italic underline | " +
                      "alignleft aligncenter alignright alignjustify | " +
                      "bullist numlist outdent indent | removeformat | help",
                    content_style:
                      "body { font-family:Arial,Helvetica,sans-serif; font-size:14px }",
                  }}
                  onEditorChange={(content) =>
                    handleSlideEditorChange(index, content)
                  }
                />
              </div>

              {(slide.content_type === "accordian" ||
                slide.content_type === "general") && (
                  <>
                    {/* Completion Type Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Completion Type*
                      </label>
                      <select
                        name="slideCompletionType"
                        value={
                          slide.content_type === "video"
                            ? "video"
                            : slide.slideCompletionType || "audio"
                        }
                        onChange={(e) => {
                          let value = e.target.value;
                          // If content_type is video, always set completionType to video
                          if (slide.content_type === "video") {
                            value = "video";
                          }
                          handleSlideChange(index, "slideCompletionType", value);
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                        required={slide.content_type === "accordian"}
                      >
                        {completionTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Conditional Rendering based on Completion Type */}
                    {slide.slideCompletionType === "audio" ? (
                      <div>
                        {/* Audio Upload/Text-to-Speech Section - Using TextToAudioConverter */}
                        <TextToAudioConverter
                          handleFileChange={(event, fieldName) =>
                            handleSlideAudioFileChange(
                              index,
                              event,
                              "slideAudioFile"
                            )
                          }
                          audioPreview={
                            slidePreviews[`slideAudioFile-${index}`] ||
                            `${import.meta.env.VITE_BACKEND_MEDIA_URL}${slide.slideAudioUrl
                            }`
                          }
                          setAudioPreview={setSlideAudioPreviewForConverter(
                            index,
                            "slideAudioFile"
                          )}
                          fieldName={`slideAudioFile-${index}`}
                          isExistingFile={
                            slide.slideAudioUrl && !slide.slideAudioFile
                          }
                          existingFileUrl={
                            slide.slideAudioUrl
                              ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${slide.slideAudioUrl
                              }`
                              : null
                          }
                        />
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Completion Time (in minutes)*
                        </label>
                        <input
                          type="number"
                          name="slideCompletionTime"
                          value={slide.slideCompletionTime || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value > 0) {
                              handleSlideChange(
                                index,
                                "slideCompletionTime",
                                value
                              );
                            } else if (e.target.value === "") {
                              handleSlideChange(index, "slideCompletionTime", "");
                            }
                          }}
                          min="1"
                          className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                          placeholder="Enter time in minutes"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Time required to mark this content as completed
                        </p>
                      </div>
                    )}

                    <div className="rounded-xl border border-amber-200  from-amber-50 to-orange-50 p-4 mt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <h4 className="text-sm font-semibold text-amber-900">Slide Duration Summary</h4>
                        <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full w-fit">
                          Slide + Extra = Total
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg border border-amber-200 p-3">
                          <label className="block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-2">
                            Slide Duration (min)
                          </label>
                          <input
                            type="text"
                            value={(() => {
                              const slideBaseRaw =
                                slide.slideCompletionType === "timer"
                                  ? (slide.slideCompletionTime || slide.slide_duration || 0)
                                  : (slide.audioDuration || slide.slide_duration || 0);
                              return normalizeLocalMinuteSecondString(slideBaseRaw);
                            })()}
                            readOnly
                            className="w-full p-2 border border-slate-200 bg-slate-50 rounded text-slate-600 cursor-not-allowed font-medium"
                          />
                        </div>

                        <div className="bg-white rounded-lg border border-amber-200 p-3">
                          <label className="block text-xs font-semibold tracking-wide uppercase text-amber-800 mb-2">
                            Extra Duration (min)
                          </label>
                          <input
                            type="number"
                            name="slide_extra_duration"
                            min="0"
                            step="0.01"
                            value={slide.slide_extra_duration || "0"}
                            onChange={(e) =>
                              handleSlideChange(
                                index,
                                "slide_extra_duration",
                                e.target.value
                              )
                            }
                            onBlur={(e) =>
                              handleSlideChange(
                                index,
                                "slide_extra_duration",
                                normalizeLocalMinuteSecondString(e.target.value)
                              )
                            }
                            className="w-full p-2 border border-amber-300 rounded focus:ring-amber-500 focus:border-amber-500"
                            placeholder="e.g. 1.50"
                          />
                          <p className="text-xs text-slate-500 mt-1">Optional additional time for this slide</p>
                        </div>

                        <div className="bg-white rounded-lg border border-green-200 p-3">
                          <label className="block text-xs font-semibold tracking-wide uppercase text-green-700 mb-2">
                            Total Duration (min)
                          </label>
                          <input
                            type="text"
                            value={(() => {
                              const slideBaseRaw =
                                slide.slideCompletionType === "timer"
                                  ? (slide.slideCompletionTime || slide.slide_duration || 0)
                                  : (slide.audioDuration || slide.slide_duration || 0);
                              const base = parseFloat(normalizeLocalMinuteSecondString(slideBaseRaw));
                              const normalizedExtra = parseFloat(
                                normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)
                              );
                              return isNaN(base + normalizedExtra)
                                ? "0.00"
                                : (base + normalizedExtra).toFixed(2);
                            })()}
                            readOnly
                            className="w-full p-2 border border-green-200 bg-green-50 rounded text-green-700 cursor-not-allowed font-semibold"
                          />
                        </div>
                      </div>
                      <div className="mt-3 rounded-md border border-amber-200 bg-white/70 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-amber-800">clock equivalents</p>
                        <p className="font-mono text-xs text-amber-900">
                          slide {decimalMinutesToMmSs(parseFloat(normalizeLocalMinuteSecondString(slide.slideCompletionType === "timer" ? (slide.slideCompletionTime || slide.slide_duration || 0) : (slide.audioDuration || slide.slide_duration || 0))))} • {decimalMinutesToHhMmSs(parseFloat(normalizeLocalMinuteSecondString(slide.slideCompletionType === "timer" ? (slide.slideCompletionTime || slide.slide_duration || 0) : (slide.audioDuration || slide.slide_duration || 0))))}
                        </p>
                        <p className="font-mono text-xs text-amber-900">
                          extra {decimalMinutesToMmSs(parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)))} • {decimalMinutesToHhMmSs(parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)))}
                        </p>
                        <p className="font-mono text-xs text-amber-900">
                          total {decimalMinutesToMmSs((parseFloat(normalizeLocalMinuteSecondString(slide.slideCompletionType === "timer" ? (slide.slideCompletionTime || slide.slide_duration || 0) : (slide.audioDuration || slide.slide_duration || 0))) || 0) + (parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)) || 0))} • {decimalMinutesToHhMmSs((parseFloat(normalizeLocalMinuteSecondString(slide.slideCompletionType === "timer" ? (slide.slideCompletionTime || slide.slide_duration || 0) : (slide.audioDuration || slide.slide_duration || 0))) || 0) + (parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)) || 0))}
                        </p>
                      </div>
                      <p className="mt-3 text-xs text-amber-800 font-medium">
                        Per slide only. Whole topic final duration is shown in the Topic Duration Summary above the form.
                      </p>
                    </div>
                  </>
                )}

              {/* Materials Section for Slide */}
              <div className="w-full bg-gray-50 mt-4">
                <div className="bg-white w-full">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Materials
                    </label>
                    <button
                      type="button"
                      onClick={() => addSlideMaterialRow(index)}
                      className="px-3 py-1 text-xs bg-leafGreen text-white rounded  "
                    >
                      Add Material
                    </button>
                  </div>
                  {/* Empty State */}
                  {!slide.materials || slide.materials.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">
                        No materials added yet
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Click "Add Material" to get started
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 mt-4">
                      {slide.materials.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="group relative flex flex-col rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-2 p-3 border-b border-gray-100">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-lightGreen text-forestGreen">
                                  M{mIdx + 1}
                                </span>

                                <div className="flex justify-between items-center sm:items-start sm:justify-start sm:flex-row gap-1">
                                  <select
                                    value={m.material_type}
                                    onChange={(e) =>
                                      updateSlideMaterialRow(
                                        index,
                                        mIdx,
                                        "material_type",
                                        e.target.value
                                      )
                                    }
                                    className="w-full sm:w-auto bg-white border border-gray-300 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                                  >
                                    <option value="">Type</option>
                                    {materialTypes.map((t) => (
                                      <option key={t.value} value={t.value}>
                                        {t.label}
                                      </option>
                                    ))}
                                  </select>
                                  {m.material_type === "code" && (
                                    <select
                                      value={m.codeLanguage || "python"}
                                      onChange={(e) =>
                                        updateSlideMaterialRow(
                                          index,
                                          mIdx,
                                          "codeLanguage",
                                          e.target.value
                                        )
                                      }
                                      className="w-full sm:w-auto bg-white border border-gray-300 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                                    >
                                      <option value="">Select Language</option>
                                      {codeLanguages.map((lang) => (
                                        <option
                                          key={lang.value}
                                          value={lang.value}
                                        >
                                          {lang.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                              {m.material_type === "link" && (
                                <div className="mt-2">
                                  <input
                                    type="url"
                                    value={m.link || ""}
                                    onChange={(e) =>
                                      updateSlideMaterialRow(
                                        index,
                                        mIdx,
                                        "link",
                                        e.target.value
                                      )
                                    }
                                    placeholder="https://link"
                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                onClick={() =>
                                  removeSlideMaterialRow(index, mIdx)
                                }
                                className="p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="p-3 space-y-3">
                            {m.material_type === "code" && (
                              <div className="border border-gray-200 rounded-lg overflow-hidden grid grid-cols-1">
                                <CodeMirror
                                  value={m.code || ""}
                                  height="200px"
                                  extensions={[
                                    getLanguageExtension(
                                      m.codeLanguage || "python"
                                    ),
                                  ]}
                                  onChange={(value) =>
                                    updateSlideMaterialRow(
                                      index,
                                      mIdx,
                                      "code",
                                      value
                                    )
                                  }
                                  theme="light"
                                  className="text-xs"
                                />
                              </div>
                            )}
                            {m.material_type &&
                              !["link", "code", ""].includes(
                                m.material_type
                              ) && (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
                                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <label className="cursor-pointer text-xs font-medium text-forestGreen hover:text-forestGreen">
                                    Upload {m.material_type}
                                    <input
                                      type="file"
                                      onChange={(e) =>
                                        handleSlideMaterialFileChange(
                                          index,
                                          mIdx,
                                          e.target.files[0]
                                        )
                                      }
                                      className="hidden"
                                      accept={getAcceptType(m.material_type)}
                                    />
                                  </label>
                                  <p className="mt-1 text-[10px] text-gray-500">
                                    {m.material_type === "pdf" && "PDF only"}
                                    {m.material_type === "image" &&
                                      "Images up to 10MB"}
                                    {m.material_type === "document" &&
                                      "DOC/PPT/XLS/TXT/PDF"}
                                  </p>
                                </div>
                              )}
                            {(m.file || m.link) && (
                              <div className="rounded-md bg-gray-50 p-2 border border-gray-200 flex items-center gap-2">
                                {m.material_type === "image" &&
                                  (m.file || m.link) ? (
                                  <img
                                    src={
                                      m.file
                                        ? URL.createObjectURL(m.file)
                                        : `${import.meta.env
                                          .VITE_BACKEND_MEDIA_URL
                                        }${m.link || "/placeholder.png"}`
                                    }
                                    className="h-10 w-10 object-cover rounded-md shadow-sm"
                                    alt="preview"
                                  />
                                ) : (
                                  <div className="h-10 w-10 flex items-center justify-center rounded-md bg-white border">
                                    <Upload className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium text-gray-700 truncate">
                                    {m.file ? m.file.name : m.link}
                                  </p>
                                  <a
                                    href={
                                      m.file
                                        ? URL.createObjectURL(m.file)
                                        : `${import.meta.env
                                          .VITE_BACKEND_MEDIA_URL
                                        }${m.link}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-forestGreen hover:text-forestGreen underline"
                                  >
                                    Open
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {slide.content_type && slide.content_type !== "general" && (
                <div className="mt-6">
                  {renderSlideContentForm(slide, index)}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end items-center">
        <button
          type="button"
          onClick={addSlide}
          className="flex items-center px-4 py-2 bg-leafGreen text-white rounded-lg   transition-all duration-200"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Slide
        </button>
      </div>
    </div>
  );
};

export default EditSlideContent;
