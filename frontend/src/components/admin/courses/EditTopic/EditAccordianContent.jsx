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

export default function EditAccordianContent({
  formData,
  accordianPreviews,
  setAccordianPreviews,
  handleAccordionChange,
  addAccordionSection,
  removeAccordionSection,
  setFormData,
  completionTypes,
  codeLanguages,
  getLanguageExtension,
}) {

  const secondsToDecimalMinutes = (seconds) =>
    Number((Math.max(0, Number(seconds) || 0) / 60).toFixed(2));

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

  const [videoType, setVideoType] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ 0: true }); // Default first section open

  useEffect(() => {
    formData.accordianSections.forEach((section, sectionIndex) => {
      const needsDuration = section.accordianCompletionType === "audio" && !section.accordianAudioDuration;
      if (!needsDuration || !section.accordianAudioUrl) return;

      const sourceUrl = /^https?:\/\//i.test(section.accordianAudioUrl)
        ? section.accordianAudioUrl
        : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${section.accordianAudioUrl}`;

      const el = document.createElement("audio");
      el.preload = "metadata";
      el.src = sourceUrl;

      const onLoaded = () => {
        const sec = Number.isFinite(el.duration) ? el.duration : 0;
        const minutes = secondsToDecimalMinutes(sec);
        handleAccordionChange(sectionIndex, "accordianAudioDuration", minutes);
        cleanup();
      };

      const onError = () => cleanup();

      const cleanup = () => {
        el.removeEventListener("loadedmetadata", onLoaded);
        el.removeEventListener("error", onError);
        el.src = "";
      };

      el.addEventListener("loadedmetadata", onLoaded);
      el.addEventListener("error", onError);
    });
  }, [formData.accordianSections, handleAccordionChange]);

  const toggleSection = (sectionIndex) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  const handleFilePreview = (e, index, fieldName) => {
    const file = e.target.files[0];
    handleAccordionChange(index, fieldName, file); // Call parent function

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAccordianPreviews((prev) => ({
        ...prev,
        [`${fieldName}-${index}`]: previewUrl,
      }));

      // Update the mediaUrl array to include the new file
      setFormData((prev) => {
        const updatedFormData = { ...prev };
        const existingMediaUrl = updatedFormData.accordianSections[index].mediaUrl || [];

        // Check if the fieldName corresponds to a specific file type
        let fileType = "";
        if (fieldName === "videoUrl") {
          fileType = "video";
        } else if (fieldName === "audioUrl") {
          fileType = "audio";
        } else if (fieldName === "fileUrl") {
          fileType = "document";
        }

        // Add the new file to the mediaUrl array
        updatedFormData.accordianSections[index].mediaUrl = [
          // keep only other fileTypes
          ...existingMediaUrl.filter((m) => m.fileType !== fileType),
          {
            fileType,
            url: file,
            isExisting: false,
          },
        ];

        return updatedFormData;
      });
    }
  };


  const handleRemoveFile = (index, fieldName) => {
    handleAccordionChange(index, fieldName, null);
    setAccordianPreviews((prev) => {
      const updatedPreviews = { ...prev };
      delete updatedPreviews[`${fieldName}-${index}`];
      return updatedPreviews;
    });
    const fileInput = document.getElementById(`${fieldName}-input-${index}`);
    if (fileInput) {
      fileInput.value = "";
    }
    // If the fieldName is related to a YouTube video, update the mediaUrl array
    if (fieldName === 'videoUrl') {
      const updatedSections = [...formData.accordianSections];
      updatedSections[index].mediaUrl = updatedSections[index].mediaUrl.filter(
        (media) => media.fileType !== 'youtube'
      );
      setFormData((prev) => ({
        ...prev,
        accordianSections: updatedSections,
      }));
    }
  };


  const handleAccordionAudioFileChange = (e, sectionIndex) => {
    const file = e.target?.files?.[0] || null;

    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAccordianPreviews((prev) => ({
        ...prev,
        [`accordianAudioUrl-${sectionIndex}`]: previewUrl,
      }));

      const el = document.createElement("audio");
      el.preload = "metadata";
      el.src = previewUrl;

      const onLoaded = () => {
        const sec = Number.isFinite(el.duration) ? el.duration : 0;
        const minutes = secondsToDecimalMinutes(sec);
        handleAccordionChange(sectionIndex, "accordianAudioFile", file);
        handleAccordionChange(sectionIndex, "accordianAudioDuration", minutes);
        cleanup();
      };

      const onError = () => {
        handleAccordionChange(sectionIndex, "accordianAudioFile", file);
        cleanup();
      };

      const cleanup = () => {
        el.removeEventListener("loadedmetadata", onLoaded);
        el.removeEventListener("error", onError);
        el.src = "";
      };

      el.addEventListener("loadedmetadata", onLoaded);
      el.addEventListener("error", onError);
    } else {
      // Clear the audio file
      handleAccordionChange(sectionIndex, "accordianAudioFile", null);
      handleAccordionChange(sectionIndex, "accordianAudioDuration", 0);

      // Clear preview
      setAccordianPreviews((prev) => {
        const updatedPreviews = { ...prev };
        delete updatedPreviews[`accordianAudioUrl-${sectionIndex}`];
        return updatedPreviews;
      });
    }
  };

  const extractYouTubeId = (url) => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const hasValidYoutube = (mediaUrl) =>
    Array.isArray(mediaUrl) &&
    mediaUrl.some((m) => m.fileType === "youtube" && extractYouTubeId(m.url));

  // Handle tag changes for a specific section
  const handleTagChange = (e, sectionIndex, tagIndex, field) => {
    const updatedSections = [...formData.accordianSections];

    if (!updatedSections[sectionIndex].tags) {
      updatedSections[sectionIndex].tags = [];
    }

    if (field === "tagFile") {
      updatedSections[sectionIndex].tags[tagIndex] = {
        ...updatedSections[sectionIndex].tags[tagIndex],
        [field]: e.target.files[0],
      };
    } else {
      updatedSections[sectionIndex].tags[tagIndex] = {
        ...updatedSections[sectionIndex].tags[tagIndex],
        [field]: e.target.value,
      };
    }

    setFormData((prev) => ({
      ...prev,
      accordianSections: updatedSections,
    }));
  };

  // Add a new tag to a section
  const addTag = (sectionIndex) => {
    const updatedSections = [...formData.accordianSections];

    if (!updatedSections[sectionIndex].tags) {
      updatedSections[sectionIndex].tags = [];
    }

    updatedSections[sectionIndex].tags.push({
      tagName: "",
      tagFile: null,
    });

    setFormData((prev) => ({
      ...prev,
      accordianSections: updatedSections,
    }));
  };

  // Remove a tag from a section
  const removeTag = (sectionIndex, tagIndex) => {
    const updatedSections = [...formData.accordianSections];
    updatedSections[sectionIndex].tags = updatedSections[
      sectionIndex
    ].tags.filter((_, i) => i !== tagIndex);

    setFormData((prev) => ({
      ...prev,
      accordianSections: updatedSections,
    }));
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 bg-white rounded-lg shadow mt-4 md:mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-800">
            Accordion Sections*
          </h2>
          <span className="bg-lightGreen text-forestGreen text-sm font-medium px-2.5 py-0.5 rounded-full">
            {formData.accordianSections.length}
          </span>
        </div>
        <button
          type="button"
          onClick={addAccordionSection}
          className="bg-leafGreen text-white px-2 md:px-4 py-2 rounded-md   flex items-center gap-2 transition duration-200"
        >
          <Plus className="w-4 h-4" />
          <p className="hidden md:block">Add Section</p>
        </button>
      </div>

      {formData.accordianSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-white rounded-lg">
          {/* Accordion Header - Always visible */}
          <div
            className="py-2 md:p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection(sectionIndex)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-lightGreen text-forestGreen w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                {sectionIndex + 1}
              </div>
              <h3 className="text-md md:text-lg font-semibold text-gray-800">
                <span className="hidden sm:inline">
                  Section {sectionIndex + 1}:{" "}
                </span>{" "}
                {section.title || "Untitled"}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {formData?.accordianSections?.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAccordionSection(sectionIndex);
                  }}
                  className="text-red-500 hover:text-red-600 flex items-center gap-1 transition duration-200"
                >
                  <Trash className="w-4 h-4" />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              )}
              {expandedSections[sectionIndex] ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>

          {/* Accordion Content - Toggleable */}
          {expandedSections[sectionIndex] && (
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
                    handleAccordionChange(sectionIndex, "title", e.target.value)
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
                    handleAccordionChange(sectionIndex, "body", content)
                  }
                />
              </div>

              {/* Completion Type Selection */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Type*
                </label>
                <select
                  name="accordianCompletionType"
                  value={section.accordianCompletionType || "audio"}
                  onChange={(e) => {
                    handleAccordionChange(
                      sectionIndex,
                      "accordianCompletionType",
                      e.target.value
                    );
                    setAccordianPreviews((prev) => {
                      const updatedPreviews = { ...prev };
                      delete updatedPreviews[
                        `accordianAudioUrl-${sectionIndex}`
                      ];
                      return updatedPreviews;
                    });

                    const fileInput = document.getElementById(
                      `accordianAudioUrl-input-${sectionIndex}`
                    );
                    if (fileInput) {
                      fileInput.value = "";
                    }

                    if (e.target.value === "timer") {
                      handleAccordionChange(sectionIndex, "accordianAudioDuration", 0);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                  required
                >
                  {completionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Rendering based on Completion Type */}
              {section.accordianCompletionType === "audio" ? (
                <div>
                  {/* Audio Upload/Text-to-Speech Section - Using TextToAudioConverter */}
                  <TextToAudioConverter
                    handleFileChange={(e) =>
                      handleAccordionAudioFileChange(e, sectionIndex)
                    }
                    audioPreview={
                      accordianPreviews[`accordianAudioUrl-${sectionIndex}`]
                    }
                    setAudioPreview={(previewUrl) => {
                      setAccordianPreviews((prev) => ({
                        ...prev,
                        [`accordianAudioUrl-${sectionIndex}`]: previewUrl,
                      }));
                    }}
                    fieldName={`accordionAudioFile-${sectionIndex}`}
                    isExistingFile={
                      section.accordianAudioUrl && !section.accordianAudioFile
                    }
                    existingFileUrl={
                      section.accordianAudioUrl
                        ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${section.accordianAudioUrl
                        }`
                        : null
                    }
                  />

                  <div className="bg-gray-50 md:p-4 rounded-lg mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)*
                    </label>
                    <input
                      type="number"
                      name="accordianAudioDuration"
                      min="0"
                      step="0.01"
                      value={section.accordianAudioDuration ?? 0}
                      onChange={(e) =>
                        handleAccordionChange(
                          sectionIndex,
                          "accordianAudioDuration",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                      placeholder="Auto-filled when audio is selected or generated"
                      required
                      disabled
                    />
                    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
                      <p className="font-mono text-xs text-slate-700">
                        mm:ss {decimalMinutesToMmSs(section.accordianAudioDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(section.accordianAudioDuration || 0)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">stored value uses decimal minutes; use hh:mm:ss for readability (hh hours, mm minutes, ss seconds).</p>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      *This field is disabled because the audio duration is auto-captured.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 md:p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Time (in minutes)*
                  </label>
                  <input
                    type="number"
                    name="accordianCompletionTime"
                    value={section.accordianCompletionTime || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value > 0) {
                        handleAccordionChange(
                          sectionIndex,
                          "accordianCompletionTime",
                          value
                        );
                      } else if (e.target.value === "") {
                        handleAccordionChange(
                          sectionIndex,
                          "accordianCompletionTime",
                          ""
                        );
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

              {/* Code Language Selection */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code Language
                </label>
                <select
                  value={section.codeLanguage || ""}
                  onChange={(e) =>
                    handleAccordionChange(
                      sectionIndex,
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
                      handleAccordionChange(sectionIndex, "code", value)
                    }
                    className="border rounded p-2"
                  />
                </div>
              )}
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
                          onClick={() => removeTag(sectionIndex, tagIndex)}
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
                                sectionIndex,
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
                              id={`tag-file-${sectionIndex}-${tagIndex}`}
                              onChange={(e) =>
                                handleTagChange(
                                  e,
                                  sectionIndex,
                                  tagIndex,
                                  "tagFile"
                                )
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor={`tag-file-${sectionIndex}-${tagIndex}`}
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
                  onClick={() => addTag(sectionIndex)}
                  className="flex items-center gap-2 text-forestGreen hover:text-forestGreen transition duration-200 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Tag
                </button>
              </div> */}
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
                    onClick={() => {
                      if (
                        Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "video" && media.isExisting
                        )
                      ) {
                        setFormData((prev) => {
                          const updatedFormData = { ...prev };
                          // Find the video media item
                          const mediaIndex = updatedFormData.accordianSections[
                            sectionIndex
                          ].mediaUrl.findIndex(
                            (item) =>
                              item.fileType === "video" &&
                              item.isExisting === true
                          );

                          if (mediaIndex !== -1) {
                            // Create a new array without the item
                            updatedFormData.accordianSections[
                              sectionIndex
                            ].mediaUrl = updatedFormData.accordianSections[
                              sectionIndex
                            ].mediaUrl.filter(
                              (_, index) => index !== mediaIndex
                            );
                          }

                          return updatedFormData;
                        });
                      } else {
                        handleAccordionChange(
                          sectionIndex,
                          "showVideo",
                          !section.showVideo
                        );
                      }
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition duration-200 shadow-sm w-full ${section.showVideo ||
                      (Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "video" && media.isExisting
                        ))
                      ? "bg-lightGreen text-forestGreen border border-leafGreen/50"
                      : "bg-lightGreen text-forestGreen hover:bg-lightGreen"
                      }`}
                    disabled={
                      (section.showVideo &&
                        accordianPreviews[`videoUrl-${sectionIndex}`]) ||
                      (Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "video" && media.isExisting
                        ))
                    }
                  >
                    <Video className="w-5 h-5" />
                    <span>
                      {section.showVideo ||
                        (Array.isArray(section.mediaUrl) &&
                          section.mediaUrl.some(
                            (media) =>
                              media.fileType === "video" && media.isExisting
                          ))
                        ? "Video"
                        : "Add Video"}
                    </span>
                  </button>

                  {/* Audio Button - with same safeguards */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "audio" && media.isExisting
                        )
                      ) {
                        setFormData((prev) => {
                          const updatedFormData = { ...prev };
                          // Find the audio media item
                          const mediaIndex = updatedFormData.accordianSections[
                            sectionIndex
                          ].mediaUrl.findIndex(
                            (item) =>
                              item.fileType === "audio" &&
                              item.isExisting === true
                          );

                          if (mediaIndex !== -1) {
                            // Create a new array without the item
                            updatedFormData.accordianSections[
                              sectionIndex
                            ].mediaUrl = updatedFormData.accordianSections[
                              sectionIndex
                            ].mediaUrl.filter(
                              (_, index) => index !== mediaIndex
                            );
                          }

                          return updatedFormData;
                        });
                      } else {
                        handleAccordionChange(
                          sectionIndex,
                          "showAudio",
                          !section.showAudio
                        );
                      }
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition duration-200 shadow-sm w-full ${section.showAudio ||
                      (Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "audio" && media.isExisting
                        ))
                      ? "bg-lightGreen text-forestGreen border border-leafGreen/50"
                      : "bg-lightGreen text-forestGreen hover:bg-lightGreen"
                      }`}
                    disabled={
                      (section.showAudio &&
                        accordianPreviews[`audioUrl-${sectionIndex}`]) ||
                      (Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "audio" && media.isExisting
                        ))
                    }
                  >
                    <Music className="w-5 h-5" />
                    <span>
                      {section.showAudio ||
                        (Array.isArray(section.mediaUrl) &&
                          section.mediaUrl.some(
                            (media) =>
                              media.fileType === "audio" && media.isExisting
                          ))
                        ? "Audio"
                        : "Add Audio"}
                    </span>
                  </button>

                  {/* File Button - with same safeguards */}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "document" && media.isExisting
                        )
                      ) {
                        setFormData((prev) => {
                          const updatedFormData = { ...prev };
                          // Find the file media item
                          const mediaIndex = updatedFormData.accordianSections[
                            sectionIndex
                          ].mediaUrl.findIndex(
                            (item) =>
                              item.fileType === "document" &&
                              item.isExisting === true
                          );

                          if (mediaIndex !== -1) {
                            // Create a new array without the item
                            updatedFormData.accordianSections[
                              sectionIndex
                            ].mediaUrl = updatedFormData.accordianSections[
                              sectionIndex
                            ].mediaUrl.filter(
                              (_, index) => index !== mediaIndex
                            );
                          }

                          return updatedFormData;
                        });
                      } else {
                        handleAccordionChange(
                          sectionIndex,
                          "showFile",
                          !section.showFile
                        );
                      }
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition duration-200 shadow-sm w-full ${section.showFile ||
                      (Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "document" && media.isExisting
                        ))
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    disabled={
                      (section.showFile &&
                        accordianPreviews[`fileUrl-${sectionIndex}`]) ||
                      (Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "document" && media.isExisting
                        ))
                    }
                  >
                    <FileText className="w-5 h-5" />
                    <span>
                      {section.showFile ||
                        (Array.isArray(section.mediaUrl) &&
                          section.mediaUrl.some(
                            (media) =>
                              media.fileType === "document" && media.isExisting
                          ))
                        ? "Document"
                        : "Add File"}
                    </span>
                  </button>
                </div>

                {/* Video Upload Section - with safeguards */}
                {(section.showVideo ||
                  (Array.isArray(section.mediaUrl) &&
                    (section.mediaUrl.some(
                      (media) => media.fileType === "video" && media.isExisting
                    ) ||
                      hasValidYoutube(section.mediaUrl)))) && (
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
                            if (
                              Array.isArray(section.mediaUrl) &&
                              section.mediaUrl.some(
                                (media) =>
                                  (media.fileType === "video" &&
                                    media.isExisting) ||
                                  media.fileType === "youtube"
                              )
                            ) {
                              setFormData((prev) => {
                                const updatedFormData = { ...prev };
                                // Remove the video or YouTube item
                                updatedFormData.accordianSections[
                                  sectionIndex
                                ].mediaUrl = updatedFormData.accordianSections[
                                  sectionIndex
                                ].mediaUrl.filter(
                                  (item) =>
                                    !(
                                      (item.fileType === "video" &&
                                        item.isExisting) ||
                                      item.fileType === "youtube"
                                    )
                                );
                                return updatedFormData;
                              });
                            } else {
                              handleRemoveFile(sectionIndex, "videoUrl");
                              handleAccordionChange(
                                sectionIndex,
                                "showVideo",
                                false
                              );
                            }
                          }}
                          className="text-red-500 hover:text-red-600 p-1 rounded transition duration-200"
                          title="Remove video attachment"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {accordianPreviews[`videoUrl-${sectionIndex}`] ? (
                        <div className="flex flex-col items-center">
                          <div className="relative w-full max-w-md">
                            <video
                              src={accordianPreviews[`videoUrl-${sectionIndex}`]}
                              controls
                              className="w-full rounded-lg border border-leafGreen/30 shadow-md object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFile(sectionIndex, "videoUrl")
                              }
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                              title="Remove video"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ) : Array.isArray(section.mediaUrl) &&
                        (section.mediaUrl.some(
                          (media) =>
                            media.fileType === "video" && media.isExisting
                        ) ||
                          hasValidYoutube(section.mediaUrl)) ? (
                        <div className="flex flex-col items-center">
                          <div className="relative w-full max-w-md">
                            {hasValidYoutube(section.mediaUrl) ? (
                              <div className="grid grid-cols-1 sm:min-h-[315px]">
                                <iframe
                                  src={`https://www.youtube.com/embed/${extractYouTubeId(
                                    (
                                      section.mediaUrl.find(
                                        (m) => m.fileType === "youtube"
                                      ) || {}
                                    ).url || ""
                                  )}`}
                                  title="YouTube video player"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="w-full h-full rounded-lg shadow-md"
                                ></iframe>
                              </div>
                            ) : (
                              <video
                                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${Array.isArray(section.mediaUrl)
                                  ? section.mediaUrl.find(
                                    (item) => item.fileType === "video"
                                  )?.url || ""
                                  : ""
                                  }`}
                                controls
                                className="w-full rounded-lg border border-leafGreen/30 shadow-md object-cover"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => {
                                  const updatedFormData = { ...prev };
                                  // Remove the video or YouTube item
                                  updatedFormData.accordianSections[
                                    sectionIndex
                                  ].mediaUrl = updatedFormData.accordianSections[
                                    sectionIndex
                                  ].mediaUrl.filter(
                                    (item) =>
                                      !(
                                        (item.fileType === "video" &&
                                          item.isExisting) ||
                                        item.fileType === "youtube"
                                      )
                                  );
                                  updatedFormData.accordianSections[
                                    sectionIndex
                                  ].showVideo = true;
                                  return updatedFormData;
                                });
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                              title="Remove video"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="videoType"
                                value="internal"
                                onChange={() => setVideoType("internal")}
                                className="form-radio accent-leafGreen text-forestGreen"
                              />
                              <span className="text-gray-700">
                                Internal Video
                              </span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="videoType"
                                value="youtube"
                                onChange={() => setVideoType("youtube")}
                                className="form-radio accent-leafGreen text-forestGreen"
                              />
                              <span className="text-gray-700">YouTube Video</span>
                            </label>
                          </div>

                          {videoType === "internal" ? (
                            <>
                              <input
                                id={`videoUrl-input-${sectionIndex}`}
                                type="file"
                                accept="video/*"
                                onChange={(e) =>
                                  handleFilePreview(e, sectionIndex, "videoUrl")
                                }
                                className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                              />
                              <p className="text-xs text-gray-500">
                                Upload video file (.mp4, .webm, etc.)
                              </p>
                            </>
                          ) : (
                            <>
                              <input
                                id={`youtubeUrl-input-${sectionIndex}`}
                                type="text"
                                placeholder="Enter YouTube video URL"
                                onChange={(e) => {
                                  const youtubeUrl = e.target.value;
                                  setFormData((prev) => {
                                    const updatedFormData = { ...prev };
                                    const existingMediaUrl =
                                      updatedFormData.accordianSections[
                                        sectionIndex
                                      ].mediaUrl || [];

                                    // Check if a YouTube video already exists in the mediaUrl array
                                    const youtubeIndex =
                                      existingMediaUrl.findIndex(
                                        (media) => media.fileType === "youtube"
                                      );

                                    if (youtubeIndex !== -1) {
                                      // Update the existing YouTube video URL
                                      updatedFormData.accordianSections[
                                        sectionIndex
                                      ].mediaUrl[youtubeIndex].url = youtubeUrl;
                                    } else {
                                      // Add the new YouTube video to the mediaUrl array
                                      updatedFormData.accordianSections[
                                        sectionIndex
                                      ].mediaUrl = [
                                          ...existingMediaUrl,
                                          {
                                            fileType: "youtube",
                                            url: youtubeUrl,
                                            isExisting: true,
                                          },
                                        ];
                                    }

                                    return updatedFormData;
                                  });
                                }}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm"
                              />

                              <p className="text-xs text-gray-500">
                                Enter the URL of the YouTube video.
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {/* Audio Upload Section - with safeguards */}
                {(section.showAudio ||
                  (Array.isArray(section.mediaUrl) &&
                    section.mediaUrl.some(
                      (media) => media.fileType === "audio" && media.isExisting
                    ))) && (
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
                            if (
                              Array.isArray(section.mediaUrl) &&
                              section.mediaUrl.some(
                                (media) =>
                                  media.fileType === "audio" && media.isExisting
                              )
                            ) {
                              setFormData((prev) => {
                                const updatedFormData = { ...prev };
                                // Remove the audio item
                                updatedFormData.accordianSections[
                                  sectionIndex
                                ].mediaUrl = updatedFormData.accordianSections[
                                  sectionIndex
                                ].mediaUrl.filter(
                                  (item) =>
                                    !(
                                      item.fileType === "audio" && item.isExisting
                                    )
                                );
                                return updatedFormData;
                              });
                            } else {
                              handleRemoveFile(sectionIndex, "audioUrl");
                              handleAccordionChange(
                                sectionIndex,
                                "showAudio",
                                false
                              );
                            }
                          }}
                          className="text-red-500 hover:text-red-600 p-1 rounded transition duration-200"
                          title="Remove audio attachment"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {accordianPreviews[`audioUrl-${sectionIndex}`] ? (
                        <div className="flex flex-col items-center">
                          <div className="relative w-full">
                            <audio
                              src={accordianPreviews[`audioUrl-${sectionIndex}`]}
                              controls
                              className="w-full rounded-lg border border-leafGreen/30 shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFile(sectionIndex, "audioUrl")
                              }
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
                              title="Remove audio"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "audio" && media.isExisting
                        ) ? (
                        <div className="flex flex-col items-center">
                          <div className="relative w-full">
                            <audio
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${Array.isArray(section.mediaUrl)
                                ? section.mediaUrl.find(
                                  (item) => item.fileType === "audio"
                                )?.url || ""
                                : ""
                                }`}
                              controls
                              className="w-full rounded-lg border border-leafGreen/30 shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => {
                                  const updatedFormData = { ...prev };
                                  // Remove the audio item
                                  updatedFormData.accordianSections[
                                    sectionIndex
                                  ].mediaUrl = updatedFormData.accordianSections[
                                    sectionIndex
                                  ].mediaUrl.filter(
                                    (item) => !(item.fileType === "audio")
                                  );
                                  updatedFormData.accordianSections[
                                    sectionIndex
                                  ].showAudio = true;
                                  return updatedFormData;
                                });
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
                              title="Remove audio"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <input
                            id={`audioUrl-input-${sectionIndex}`}
                            type="file"
                            accept="audio/*"
                            onChange={(e) =>
                              handleFilePreview(e, sectionIndex, "audioUrl")
                            }
                            className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                          />
                          <p className="text-xs text-gray-500">
                            Upload audio file (.mp3, .wav, etc.)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                {/* File Upload Section - with safeguards */}
                {(section.showFile ||
                  (Array.isArray(section.mediaUrl) &&
                    section.mediaUrl.some(
                      (media) =>
                        media.fileType === "document" && media.isExisting
                    ))) && (
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
                            if (
                              Array.isArray(section.mediaUrl) &&
                              section.mediaUrl.some(
                                (media) =>
                                  media.fileType === "document" &&
                                  media.isExisting
                              )
                            ) {
                              setFormData((prev) => {
                                const updatedFormData = { ...prev };
                                // Remove the file item
                                updatedFormData.accordianSections[
                                  sectionIndex
                                ].mediaUrl = updatedFormData.accordianSections[
                                  sectionIndex
                                ].mediaUrl.filter(
                                  (item) =>
                                    !(
                                      item.fileType === "document" &&
                                      item.isExisting
                                    )
                                );
                                return updatedFormData;
                              });
                            } else {
                              handleRemoveFile(sectionIndex, "fileUrl");
                              handleAccordionChange(
                                sectionIndex,
                                "showFile",
                                false
                              );
                            }
                          }}
                          className="text-red-500 hover:text-red-600 p-1 rounded transition duration-200"
                          title="Remove document attachment"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {accordianPreviews[`fileUrl-${sectionIndex}`] ? (
                        <div className="mt-3 flex items-center">
                          <div className="relative bg-white p-3 rounded-lg border border-gray-200 w-full flex items-center justify-between">
                            <a
                              href={accordianPreviews[`fileUrl-${sectionIndex}`]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 flex items-center gap-2 transition duration-200"
                            >
                              <FileText className="w-4 h-4" />
                              {formData.accordianSections[sectionIndex].url
                                ?.name || "View Document"}
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveFile(sectionIndex, "fileUrl")
                              }
                              className="text-red-500 hover:text-red-600 transition duration-200"
                              title="Remove document"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : Array.isArray(section.mediaUrl) &&
                        section.mediaUrl.some(
                          (media) =>
                            media.fileType === "document" && media.isExisting
                        ) ? (
                        <div className="mt-3 flex items-center">
                          <div className="relative bg-white p-3 rounded-lg border border-gray-200 w-full flex items-center justify-between">
                            <a
                              href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${section.mediaUrl.find(
                                (media) =>
                                  media.fileType === "document" &&
                                  media.isExisting
                              ).url
                                }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 flex items-center gap-2 transition duration-200"
                            >
                              <FileText className="w-4 h-4" />
                              {formData.accordianSections[sectionIndex].url
                                ?.name || "View Document"}
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => {
                                  const updatedFormData = { ...prev };
                                  // Remove the audio item
                                  updatedFormData.accordianSections[
                                    sectionIndex
                                  ].mediaUrl = updatedFormData.accordianSections[
                                    sectionIndex
                                  ].mediaUrl.filter(
                                    (item) => !(item.fileType === "document")
                                  );
                                  updatedFormData.accordianSections[
                                    sectionIndex
                                  ].showFile = true;
                                  return updatedFormData;
                                });
                              }}
                              className="text-red-500 hover:text-red-600 transition duration-200"
                              title="Remove document"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <input
                            id={`fileUrl-input-${sectionIndex}`}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) =>
                              handleFilePreview(e, sectionIndex, "fileUrl")
                            }
                            className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                          />
                          <p className="text-xs text-gray-500">
                            Upload document file (.pdf, .doc, .docx, .txt)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
