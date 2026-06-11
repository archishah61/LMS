/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { Editor } from "@tinymce/tinymce-react";
import {
  Video,
  Music,
  FileText,
  Trash,
  Plus,
  Tag,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";

export default function EditSlideAccordianContent({
  slide,
  slideIndex,
  handleSlideAccordionChange,
  handleSlideAccordionFileChange,
  addSlideAccordionSection,
  removeSlideAccordionSection,
  setFormData,
  completionTypes,
  codeLanguages,
  getLanguageExtension,
}) {
  const [previews, setPreviews] = useState({});
  const [expandedSections, setExpandedSections] = useState({ 0: true }); // Default first section open
  const [videoType, setVideoType] = useState(null);
  const [accordianPreviews, setAccordianPreviews] = useState({});

  const toggleSection = (sectionIndex) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  useEffect(() => {
    // Initialize previews and show flags for existing media URLs
    if (slide.accordianSections) {
      const newPreviews = {};
      const updatedSections = [...slide.accordianSections];
      let needsUpdate = false;

      slide.accordianSections.forEach((section, accordianIndex) => {
        if (section.mediaUrl && Array.isArray(section.mediaUrl)) {
          section.mediaUrl.forEach((media) => {
            if (media.url && media.fileType) {
              // Create a preview URL for existing media
              const baseUrl = import.meta.env.VITE_BACKEND_MEDIA_URL || '';
              const fullUrl = media.url.startsWith('http')
                ? media.url
                : `${baseUrl}${media.url}`;

              newPreviews[`${media.fileType === "document" ? "file" : media.fileType}Url-${slideIndex}-${accordianIndex}`] = fullUrl;

              // Set the corresponding show flag to true based on fileType
              if ((media.fileType === 'video' || media.fileType === 'youtube') && !updatedSections[accordianIndex].showVideo) {
                updatedSections[accordianIndex].showVideo = true;
                updatedSections[accordianIndex].videoType = media.videoType || media.fileType || 'internal'; // Default to internal if not specified
                needsUpdate = true;
              } else if (media.fileType === 'audio' && !updatedSections[accordianIndex].showAudio) {
                updatedSections[accordianIndex].showAudio = true;
                needsUpdate = true;
              } else if ((media.fileType === 'file' || media.fileType === 'document') && !updatedSections[accordianIndex].showFile) {
                updatedSections[accordianIndex].showFile = true;
                needsUpdate = true;
              }
            }
          });
        }
      });

      // Update formData if show flags were changed
      if (needsUpdate) {
        setFormData((prev) => {
          const updatedSlides = [...prev.slides];
          updatedSlides[slideIndex] = {
            ...updatedSlides[slideIndex],
            accordianSections: updatedSections,
          };
          return { ...prev, slides: updatedSlides };
        });
      }

      setAccordianPreviews(prev => ({
        ...prev,
        ...newPreviews
      }));
    }
  }, [slide, slideIndex, setFormData]);

  const handleFilePreview = (e, accordianIndex, fieldName) => {
    const file = e.target.files[0];
    handleSlideAccordionFileChange(slideIndex, accordianIndex, fieldName, file); // Call parent function

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({
        ...prev,
        [`${fieldName}-${accordianIndex}`]: previewUrl,
      }));
    }
  };

  const handleAccordianFilePreview = (
    slideIndex,
    accordianIndex,
    fieldName,
    file
  ) => {
    handleSlideAccordionFileChange(slideIndex, accordianIndex, fieldName, file);
    if (!file) {
      setAccordianPreviews((prev) => ({
        ...prev,
        [`${fieldName}-${slideIndex}-${accordianIndex}`]: null,
      }));
      const fileInput = document.getElementById(
        `${fieldName}-input-${slideIndex}-${accordianIndex}`
      );
      if (fileInput) {
        fileInput.value = null; // Reset the file input value
      }
    } else {
      const previewUrl = URL.createObjectURL(file);
      setAccordianPreviews((prev) => ({
        ...prev,
        [`${fieldName}-${slideIndex}-${accordianIndex}`]: previewUrl,
      }));
    }
  };

  const extractYouTubeId = (url) => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    if (!url) return null; // Return null if URL is empty or undefined
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Helper to know if we already have a VALID youtube video (complete URL with extractable id)
  const hasValidYoutube = (mediaUrl) =>
    Array.isArray(mediaUrl) &&
    mediaUrl.some(
      (m) => m.fileType === "youtube" && extractYouTubeId(m.url)
    );

  const handleRemoveFile = (accordianIndex, fieldName) => {
    handleSlideAccordionFileChange(slideIndex, accordianIndex, fieldName, null);
    setPreviews((prev) => {
      const updatedPreviews = { ...prev };
      delete updatedPreviews[`${fieldName}-${accordianIndex}`];
      return updatedPreviews;
    });

    const fileInput = document.getElementById(
      `${fieldName}-input-${accordianIndex}`
    );
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Handle tag changes for a specific section
  const handleTagChange = (e, accordianIndex, tagIndex, field) => {
    const updatedSections = [...slide.accordianSections];

    if (!updatedSections[accordianIndex].tags) {
      updatedSections[accordianIndex].tags = [];
    }

    if (field === "tagFile") {
      updatedSections[accordianIndex].tags[tagIndex] = {
        ...updatedSections[accordianIndex].tags[tagIndex],
        [field]: e.target.files[0],
      };
    } else {
      updatedSections[accordianIndex].tags[tagIndex] = {
        ...updatedSections[accordianIndex].tags[tagIndex],
        [field]: e.target.value,
      };
    }

    setFormData((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        accordianSections: updatedSections,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  // Add a new tag to a section
  const addTag = (accordianIndex) => {
    const updatedSections = [...slide.accordianSections];

    if (!updatedSections[accordianIndex].tags) {
      updatedSections[accordianIndex].tags = [];
    }

    updatedSections[accordianIndex].tags.push({
      tagName: "",
      tagFile: null,
    });

    setFormData((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        accordianSections: updatedSections,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  // Remove a tag from a section
  const removeTag = (accordianIndex, tagIndex) => {
    const updatedSections = [...slide.accordianSections];
    updatedSections[accordianIndex].tags = updatedSections[
      accordianIndex
    ].tags.filter((_, i) => i !== tagIndex);

    setFormData((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        accordianSections: updatedSections,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 bg-white">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-800">
            Accordion Sections*
          </h2>
          <span className="bg-lightGreen text-forestGreen text-sm font-medium px-2.5 py-0.5 rounded-full">
            {slide.accordianSections.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => addSlideAccordionSection(slideIndex)}
          className="bg-leafGreen text-white p-2 md:px-4 md:py-2 rounded-md   flex items-center gap-2 transition duration-200"
        >
          <Plus className="w-4 h-4" />
          <p className="hidden md:block">Add Section</p>
        </button>
      </div>

      {slide.accordianSections.map((section, accordianIndex) => (
        <div key={accordianIndex} className="bg-white rounded-lg shadow">
          {/* Accordion Header - Always visible */}
          <div
            className="py-2 md:p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection(accordianIndex)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-lightGreen text-md md:text-lg text-forestGreen w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold">
                {accordianIndex + 1}
              </div>
              <h3 className="text-md md:text-lg font-semibold text-gray-800">
                Section {accordianIndex + 1}: {section.title || "Untitled"}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {slide?.accordianSections?.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlideAccordionSection(slideIndex, accordianIndex);
                  }}
                  className="text-red-500 hover:text-red-600 flex items-center gap-1 transition duration-200"
                >
                  <Trash className="w-4 h-4" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              )}
              {expandedSections[accordianIndex] ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>

          {/* Accordion Content - Toggleable */}
          {expandedSections[accordianIndex] && (
            <div className="md:p-6 space-y-4 md:space-y-6 mt-4">
              {/* Section Title */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title*
                </label>
                <input
                  type="text"
                  placeholder="Enter section title"
                  value={section.title}
                  onChange={(e) =>
                    handleSlideAccordionChange(
                      slideIndex,
                      accordianIndex,
                      "title",
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 mb-2 border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300"
                  required
                />
              </div>
              {/* Section Content */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Content*
                </label>
                <Editor
                  apiKey={import.meta.env.VITE_TINYMCE_API}
                  value={section.body}
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
                    handleSlideAccordionChange(
                      slideIndex,
                      accordianIndex,
                      "body",
                      content
                    )
                  }
                />
              </div>

              {/* Code Language Selection */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code Language
                </label>
                <select
                  value={section.codeLanguage || ""}
                  onChange={(e) =>
                    handleSlideAccordionChange(
                      slideIndex,
                      accordianIndex,
                      "codeLanguage",
                      e.target.value
                    )
                  }
                  className="w-full p-2 border rounded focus:ring-leafGreen focus:border-leafGreen"
                >
                  <option value="">Select Code Language</option>
                  {codeLanguages.map((cl) => (
                    <option key={cl.value} value={cl.value}>
                      {cl.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Code Editor */}
              {section.codeLanguage && (
                <div className="bg-gray-50 md:p-4 rounded-lg grid grid-cols-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code Editor
                  </label>
                  <CodeMirror
                    value={section.code || ""}
                    height="200px"
                    extensions={[getLanguageExtension(section.codeLanguage)]}
                    onChange={(value) =>
                      handleSlideAccordionChange(
                        slideIndex,
                        accordianIndex,
                        "code",
                        value
                      )
                    }
                    className="border rounded p-2"
                  />
                </div>
              )}

              {/* Attachments Section */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-800 mb-4">
                  Attachments
                </h4>

                {/* Attachment Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {/* Video Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleSlideAccordionFileChange(
                        slideIndex,
                        accordianIndex,
                        "showVideo",
                        !section.showVideo
                      )
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition duration-200 shadow-sm w-full ${section.showVideo
                      ? "bg-lightGreen text-forestGreen border border-leafGreen/50"
                      : "bg-lightGreen text-forestGreen hover:bg-lightGreen"
                      }`}
                    disabled={
                      section.showVideo &&
                      accordianPreviews[
                      `videoUrl-${slideIndex}-${accordianIndex}`
                      ]
                    }
                  >
                    <Video className="w-5 h-5" />
                    <span>{section.showVideo ? "Video" : "Add Video"}</span>
                  </button>

                  {/* Audio Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleSlideAccordionFileChange(
                        slideIndex,
                        accordianIndex,
                        "showAudio",
                        !section.showAudio
                      )
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition duration-200 shadow-sm w-full ${section.showAudio
                      ? "bg-lightGreen text-forestGreen border border-leafGreen/50"
                      : "bg-lightGreen text-forestGreen hover:bg-lightGreen"
                      }`}
                    disabled={
                      section.showAudio &&
                      accordianPreviews[
                      `audioUrl-${slideIndex}-${accordianIndex}`
                      ]
                    }
                  >
                    <Music className="w-5 h-5" />
                    <span>{section.showAudio ? "Audio" : "Add Audio"}</span>
                  </button>

                  {/* File Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleSlideAccordionFileChange(
                        slideIndex,
                        accordianIndex,
                        "showFile",
                        !section.showFile
                      )
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition duration-200 shadow-sm w-full ${section.showFile
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    disabled={
                      section.showFile &&
                      accordianPreviews[
                      `fileUrl-${slideIndex}-${accordianIndex}`
                      ]
                    }
                  >
                    <FileText className="w-5 h-5" />
                    <span>
                      {section.showFile ? "Document" : "Add File"}
                    </span>
                  </button>
                </div>

                {/* Video Upload */}
                {section.showVideo && (
                  <div className="mt-4 p-4 rounded-lg bg-white border border-leafGreen/30 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-forestGreen" />
                        <h5 className="font-medium text-gray-800">
                          Video Attachment
                        </h5>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleAccordianFilePreview(
                            slideIndex,
                            accordianIndex,
                            "videoUrl",
                            null
                          );
                          handleAccordianFilePreview(
                            slideIndex,
                            accordianIndex,
                            "youtubeUrl",
                            null
                          );
                          handleSlideAccordionFileChange(
                            slideIndex,
                            accordianIndex,
                            "showVideo",
                            false
                          );
                        }}
                        className="text-red-500 hover:text-red-600 p-1 rounded transition duration-200"
                        title="Remove video attachment"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Video Type Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Type*
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`internal-video-${slideIndex}-${accordianIndex}`}
                            checked={section.videoType === "internal"}
                            onChange={() =>
                              handleSlideAccordionFileChange(
                                slideIndex,
                                accordianIndex,
                                "videoType",
                                "internal"
                              )
                            }
                            className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
                          />
                          <label
                            htmlFor={`internal-video-${slideIndex}-${accordianIndex}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            Internal Video
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`youtube-video-${slideIndex}-${accordianIndex}`}
                            checked={section.videoType === "youtube"}
                            onChange={() =>
                              handleSlideAccordionFileChange(
                                slideIndex,
                                accordianIndex,
                                "videoType",
                                "youtube"
                              )
                            }
                            className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
                          />
                          <label
                            htmlFor={`youtube-video-${slideIndex}-${accordianIndex}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            YouTube Video
                          </label>
                        </div>
                      </div>
                    </div>

                    {!accordianPreviews[
                      `videoUrl-${slideIndex}-${accordianIndex}`
                    ] & !accordianPreviews[
                    `youtubeUrl-${slideIndex}-${accordianIndex}`
                    ] ? (
                      <div className="flex flex-col space-y-2">
                        {section.videoType === "internal" ? (
                          <input
                            id={`videoUrl-input-${slideIndex}-${accordianIndex}`}
                            type="file"
                            accept="video/*"
                            onChange={(e) =>
                              handleAccordianFilePreview(
                                slideIndex,
                                accordianIndex,
                                "videoUrl",
                                e.target.files[0]
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                          />
                        ) : (
                          <input
                            type="text"
                            value={section.mediaUrl.find(m => m.fileType === "youtube")?.url || accordianPreviews[`youtubeUrl-${slideIndex}-${accordianIndex}`] || ""}
                            onChange={(e) => {
                              handleSlideAccordionFileChange(
                                slideIndex,
                                accordianIndex,
                                "youtubeUrl",
                                e.target.value
                              );
                            }}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                            placeholder="Enter YouTube video URL"
                          />
                        )}
                        <p className="text-xs text-gray-500">
                          {section.videoType === "internal"
                            ? "Upload video file (.mp4, .webm, etc.)"
                            : "Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=...)"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="grid grid-cols-1 sm:min-h-[315px] relative">
                          {section.videoType === "internal" ? (
                            <video
                              src={
                                accordianPreviews[
                                `videoUrl-${slideIndex}-${accordianIndex}`
                                ]
                              }
                              controls
                              className="w-full rounded-lg border border-leafGreen/30 shadow-md object-cover"
                            />
                          ) : (
                            <iframe
                              src={`https://www.youtube.com/embed/${extractYouTubeId(accordianPreviews[`youtubeUrl-${slideIndex}-${accordianIndex}`])}`}
                              className="w-full h-full rounded-lg border border-leafGreen/30 shadow-md aspect-video"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              handleAccordianFilePreview(
                                slideIndex,
                                accordianIndex,
                                "youtubeUrl",
                                null
                              )
                              handleAccordianFilePreview(
                                slideIndex,
                                accordianIndex,
                                "videoUrl",
                                null
                              )
                            }
                            }
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                            title="Remove video"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Audio Upload */}
                {section.showAudio && (
                  <div className="mt-4 p-4 rounded-lg bg-white border border-leafGreen/30 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-leafGreen" />
                        <h5 className="font-medium text-gray-800">
                          Audio Attachment
                        </h5>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleAccordianFilePreview(
                            slideIndex,
                            accordianIndex,
                            "audioUrl",
                            null
                          );
                          handleSlideAccordionFileChange(
                            slideIndex,
                            accordianIndex,
                            "showAudio",
                            false
                          );
                        }}
                        className="text-red-500 hover:text-red-600 p-1 rounded transition duration-200"
                        title="Remove audio attachment"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {!accordianPreviews[
                      `audioUrl-${slideIndex}-${accordianIndex}`
                    ] ? (
                      <div className="flex flex-col space-y-2">
                        <input
                          id={`audioUrl-input-${slideIndex}-${accordianIndex}`}
                          type="file"
                          accept="audio/*"
                          onChange={(e) =>
                            handleAccordianFilePreview(
                              slideIndex,
                              accordianIndex,
                              "audioUrl",
                              e.target.files[0]
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                        />
                        <p className="text-xs text-gray-500">
                          Upload audio file (.mp3, .wav, etc.)
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="relative w-full">
                          <audio
                            src={
                              accordianPreviews[
                              `audioUrl-${slideIndex}-${accordianIndex}`
                              ]
                            }
                            controls
                            className="w-full rounded-lg border border-leafGreen/30 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleAccordianFilePreview(
                                slideIndex,
                                accordianIndex,
                                "audioUrl",
                                null
                              )
                            }
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
                            title="Remove audio"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* File Upload */}
                {section.showFile && (
                  <div className="mt-4 p-4 rounded-lg bg-white border border-green-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <h5 className="font-medium text-gray-800">
                          Document Attachment
                        </h5>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleAccordianFilePreview(
                            slideIndex,
                            accordianIndex,
                            "fileUrl",
                            null
                          );
                          handleSlideAccordionFileChange(
                            slideIndex,
                            accordianIndex,
                            "showFile",
                            false
                          );
                        }}
                        className="text-red-500 hover:text-red-600 p-1 rounded transition duration-200"
                        title="Remove document attachment"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {!accordianPreviews[
                      `fileUrl-${slideIndex}-${accordianIndex}`
                    ] ? (
                      <div className="flex flex-col space-y-2">
                        <input
                          id={`fileUrl-input-${slideIndex}-${accordianIndex}`}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) =>
                            handleAccordianFilePreview(
                              slideIndex,
                              accordianIndex,
                              "fileUrl",
                              e.target.files[0]
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                        />
                        <p className="text-xs text-gray-500">
                          Upload document file (.pdf, .doc, .docx, .txt)
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center">
                        <div className="relative bg-white p-3 rounded-lg border border-gray-200 w-full flex items-center justify-between">
                          <a
                            href={
                              accordianPreviews[
                              `fileUrl-${slideIndex}-${accordianIndex}`
                              ]
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 flex items-center gap-2 transition duration-200"
                          >
                            <FileText className="w-4 h-4" />
                            {section.fileUrl?.name || "View Document"}
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              handleAccordianFilePreview(
                                slideIndex,
                                accordianIndex,
                                "fileUrl",
                                null
                              )
                            }
                            className="text-red-500 hover:text-red-600 transition duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags Section */}
              {/* <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-forestGreen" />
                  <h4 className="text-md font-medium text-gray-800">Tags</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  {section.tags?.map((tag, tagIndex) => (
                    <div
                      key={tagIndex}
                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-600">
                          Tag {tagIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTag(accordianIndex, tagIndex)}
                          className="text-red-500 hover:text-red-600 p-1 rounded-full transition duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Tag Name
                          </label>
                          <input
                            type="text"
                            value={tag.tagName || ""}
                            onChange={(e) =>
                              handleTagChange(
                                e,
                                accordianIndex,
                                tagIndex,
                                "tagName"
                              )
                            }
                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                            placeholder="Enter tag name"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Attachment
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              id={`tag-file-${accordianIndex}-${tagIndex}`}
                              onChange={(e) =>
                                handleTagChange(
                                  e,
                                  accordianIndex,
                                  tagIndex,
                                  "tagFile"
                                )
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor={`tag-file-${accordianIndex}-${tagIndex}`}
                              className="flex items-center justify-between w-full p-2 bg-white border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm text-gray-500 transition duration-200"
                            >
                              <span className="truncate">
                                {tag.tagFile ? tag.tagFile.name : "Choose file"}
                              </span>
                              <FileText className="w-4 h-4 ml-2 text-leafGreen" />
                            </label>
                          </div>
                          {tag.tagFile && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {tag.tagFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addTag(accordianIndex)}
                  className="flex items-center gap-2 text-forestGreen hover:text-forestGreen transition duration-200 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Tag
                </button>
              </div> */}
              {/* Attachments Section */}
            </div>
          )}
        </div>
      ))
      }
    </div >
  );
}
