/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { Editor } from "@tinymce/tinymce-react";
import {
  Video,
  Music,
  FileText,
  Trash,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import TextToAudioConverter from "../../AIServices/TextToAudioConverter"; // Import the TextToAudioConverter component

export default function AccordianContent({
  formData,
  handleAccordianChange,
  addAccordianSection,
  removeAccordianSection,
  setFormData,
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
  const [previews, setPreviews] = useState({});
  const [codeLanguage, setCodeLanguage] = useState({});
  const [expandedSections, setExpandedSections] = useState({ 0: true }); // Default first section open
  const [videoTypes, setVideoTypes] = useState({}); // State to manage video types for each section
  const [audioPreviews, setAudioPreviews] = useState({}); // State to manage audio previews for each section

  useEffect(() => {
    // Clean up previous URLs to prevent memory leaks
    Object.values(audioPreviews).forEach((previewUrl) => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    })

    // Create new preview URLs for accordion audio files
    const newPreviews = {}

    formData.accordianSections.forEach((section, sectionIndex) => {
      if (section.accordianAudioFile instanceof File) {
        const previewUrl = URL.createObjectURL(section.accordianAudioFile)
        newPreviews[sectionIndex] = previewUrl
      } else if (typeof section.accordianAudioFile === "string" && section.accordianAudioFile) {
        newPreviews[sectionIndex] = section.accordianAudioFile

        if (section.accordianCompletionType === "audio" && !section.accordianAudioDuration) {
          const el = document.createElement('audio');
          el.preload = 'metadata';
          el.src = section.accordianAudioFile;
          const onLoaded = () => {
            const sec = Number.isFinite(el.duration) ? el.duration : 0;
            const minutes = secondsToDecimalMinutes(sec);
            setFormData(prev => {
              const updated = [...prev.accordianSections];
              updated[sectionIndex] = { ...updated[sectionIndex], accordianAudioDuration: minutes };
              return { ...prev, accordianSections: updated };
            });
            cleanup();
          };
          const onError = () => cleanup();
          const cleanup = () => {
            el.removeEventListener('loadedmetadata', onLoaded);
            el.removeEventListener('error', onError);
            el.src = '';
          };
          el.addEventListener('loadedmetadata', onLoaded);
          el.addEventListener('error', onError);
        }
      }
    })

    setAudioPreviews(newPreviews)

    return () => {
      Object.values(newPreviews).forEach((previewUrl) => {
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl)
        }
      })
    }
  }, [formData.accordianSections.map(s => s.accordianAudioFile).join(',')])

  const completionTypes = [
    { value: "audio", label: "Audio" },
    { value: "timer", label: "Timer" },
  ];

  const toggleSection = (sectionIndex) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  const handleVideoTypeChange = (sectionIndex, type) => {
    setVideoTypes((prev) => ({
      ...prev,
      [sectionIndex]: type,
    }));

    // Clear the video preview and file input when switching types
    if (type === "youtube") {
      handleRemoveFile(sectionIndex, "videoUrl");
      handleAccordianChange(sectionIndex, "videoUrl", "");
    } else if (type === "internal") {
      handleRemoveFile(sectionIndex, "videoUrl");
      handleAccordianChange(sectionIndex, "youtubeUrl", "");
    }
  };

  const handleFilePreview = (e, index, fieldName) => {
    const file = e.target.files[0];
    handleAccordianChange(index, fieldName, file); // Call parent function

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({
        ...prev,
        [`${fieldName}-${index}`]: previewUrl,
      }));
    }
  };

  const handleRemoveFile = (index, fieldName) => {
    handleAccordianChange(index, fieldName, null);
    setPreviews((prev) => {
      const updatedPreviews = { ...prev };
      delete updatedPreviews[`${fieldName}-${index}`];
      return updatedPreviews;
    });

    const fileInput = document.getElementById(`${fieldName}-input-${index}`);
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Handle audio file change for completion audio using TextToAudioConverter pattern
  const handleCompletionAudioFileChange = (e, sectionIndex, fieldName) => {
    const file =
      e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAudioPreviews((prev) => ({
        ...prev,
        [sectionIndex]: previewUrl,
      }));

      const el = document.createElement('audio');
      el.preload = 'metadata';
      el.src = previewUrl;
      const onLoaded = () => {
        const sec = Number.isFinite(el.duration) ? el.duration : 0;
        const minutes = secondsToDecimalMinutes(sec);

        setFormData((prev) => {
          const updated = [...prev.accordianSections];
          updated[sectionIndex] = {
            ...updated[sectionIndex],
            [fieldName]: file,
            accordianAudioDuration: minutes
          };
          return { ...prev, accordianSections: updated };
        });
        cleanup();
      };
      const onError = () => {
        setFormData((prev) => {
          const updated = [...prev.accordianSections];
          updated[sectionIndex] = {
            ...updated[sectionIndex],
            [fieldName]: file
          };
          return { ...prev, accordianSections: updated };
        });
        cleanup();
      };
      const cleanup = () => {
        el.removeEventListener('loadedmetadata', onLoaded);
        el.removeEventListener('error', onError);
        el.src = '';
      };
      el.addEventListener('loadedmetadata', onLoaded);
      el.addEventListener('error', onError);
    } else {
      setFormData((prev) => {
        const updated = [...prev.accordianSections];
        updated[sectionIndex] = {
          ...updated[sectionIndex],
          [fieldName]: null,
          accordianAudioDuration: 0
        };
        return { ...prev, accordianSections: updated };
      });
      setAudioPreviews((prev) => {
        const updated = { ...prev };
        delete updated[sectionIndex];
        return updated;
      });
    }
  };

  // Set audio preview for completion audio
  const setCompletionAudioPreview = (sectionIndex, previewUrl) => {
    setAudioPreviews((prev) => ({
      ...prev,
      [sectionIndex]: previewUrl,
    }));
  };

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

  // Handle change for completion type in accordion sections
  const handleCompletionTypeChange = (e, sectionIndex) => {
    const newType = e.target.value;
    setFormData((prev) => {
      const updatedSections = prev.accordianSections.map((sec, i) => {
        if (i !== sectionIndex) return sec;
        if (newType === "audio") {
          return { ...sec, accordianCompletionType: newType, accordianCompletionTime: 1, accordianAudioDuration: Number(sec.accordianAudioDuration) || 0 };
        } else if (newType === "timer") {
          return { ...sec, accordianCompletionType: newType, accordianAudioFile: null, accordianAudioDuration: 0 };
        }
        return { ...sec, accordianCompletionType: newType };
      });
      return { ...prev, accordianSections: updatedSections };
    });
    if (newType === "timer") {
      setAudioPreviews((prev) => {
        const updated = { ...prev };
        delete updated[sectionIndex];
        return updated;
      });
    }
  };

  // Handle change for completion time in accordion sections
  const handleCompletionTimeChange = (e, sectionIndex) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setFormData((prev) => {
        const updatedSections = prev.accordianSections.map((sec, i) =>
          i === sectionIndex ? { ...sec, accordianCompletionTime: value } : sec
        );
        return { ...prev, accordianSections: updatedSections };
      });
    } else if (e.target.value === "") {
      setFormData((prev) => {
        const updatedSections = prev.accordianSections.map((sec, i) =>
          i === sectionIndex ? { ...sec, accordianCompletionTime: "" } : sec
        );
        return { ...prev, accordianSections: updatedSections };
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-md md:text-xl font-semibold text-gray-800">
            Accordion Sections*
          </h2>
          <span className="bg-lightGreen text-forestGreen text-sm font-medium px-2.5 py-0.5 rounded-full">
            {formData.accordianSections.length}
          </span>
        </div>
        <button
          type="button"
          onClick={addAccordianSection}
          className="bg-leafGreen text-white px-2 md:px-4 py-2 rounded-md   flex items-center gap-2 transition duration-200"
        >
          <Plus className="w-4 h-4" />
          <p className="hidden md:block">Add Section</p>
        </button>
      </div>

      {formData.accordianSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-white rounded-lg shadow">
          {/* Accordion Header - Always visible */}
          <div
            className="py-2 md:p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection(sectionIndex)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-lightGreen text-md md:text-lg text-forestGreen w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-semibold">
                {sectionIndex + 1}
              </div>
              <h3 className="text-md md:text-lg font-semibold text-gray-800">
                Section {sectionIndex + 1}: {section.title || "Untitled"}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {formData?.accordianSections?.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAccordianSection(sectionIndex);
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
                    handleAccordianChange(sectionIndex, "title", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
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
                    handleAccordianChange(sectionIndex, "body", content)
                  }
                />
              </div>

              {/* Completion Type Selection */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Type*
                </label>
                <select
                  name="completion_type"
                  value={
                    formData.accordianSections[sectionIndex]
                      .accordianCompletionType || "audio"
                  }
                  onChange={(e) => handleCompletionTypeChange(e, sectionIndex)}
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
              {formData.accordianSections[sectionIndex]
                .accordianCompletionType === "audio" ? (
                <div>
                  <TextToAudioConverter
                    keyId={`${sectionIndex}-upload`}
                    handleFileChange={(e, fieldName) =>
                      handleCompletionAudioFileChange(
                        e,
                        sectionIndex,
                        "accordianAudioFile"
                      )
                    }
                    audioPreview={audioPreviews[sectionIndex] || null}
                    setAudioPreview={(previewUrl) =>
                      setCompletionAudioPreview(sectionIndex, previewUrl)
                    }
                    isExistingFile={audioPreviews[sectionIndex] !== null}
                    fieldName="accordianAudioFile"
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
                      value={formData.accordianSections[sectionIndex]?.accordianAudioDuration ?? 0}
                      onChange={(e) => handleAccordianChange(sectionIndex, "accordianAudioDuration", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                      placeholder="Auto-filled when audio is selected or generated"
                      required
                      disabled
                    />
                    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
                      <p className="font-mono text-xs text-slate-700">
                        mm:ss {decimalMinutesToMmSs(formData.accordianSections[sectionIndex]?.accordianAudioDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(formData.accordianSections[sectionIndex]?.accordianAudioDuration || 0)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">stored value uses decimal minutes; use hh:mm:ss for readability (hh hours, mm minutes, ss seconds).</p>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">*This field is disabled because the audio duration is auto-captured.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 md:p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Time (in minutes)*
                  </label>
                  <input
                    type="number"
                    name="completion_time"
                    value={
                      formData.accordianSections[sectionIndex]
                        .accordianCompletionTime || ""
                    }
                    onChange={(e) =>
                      handleCompletionTimeChange(e, sectionIndex)
                    }
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

              {/* Programming Language Selection */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Programming Language
                </label>
                <select
                  value={section.codeLanguage || ""}
                  onChange={(e) =>
                    handleAccordianChange(
                      sectionIndex,
                      "codeLanguage",
                      e.target.value
                    )
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                >
                  <option value="">Select Language</option>
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
                      handleAccordianChange(sectionIndex, "code", value)
                    }
                    className="border rounded shadow-sm"
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
                      handleAccordianChange(
                        sectionIndex,
                        "showVideo",
                        !section.showVideo
                      )
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition duration-200 shadow-sm w-full ${section.showVideo
                      ? "bg-lightGreen text-forestGreen border border-leafGreen/50"
                      : "bg-lightGreen text-forestGreen hover:bg-lightGreen"
                      }`}
                    disabled={
                      section.showVideo && previews[`videoUrl-${sectionIndex}`]
                    }
                  >
                    <Video className="w-5 h-5" />
                    <span>{section.showVideo ? "Video" : "Add Video"}</span>
                  </button>

                  {/* Audio Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAccordianChange(
                        sectionIndex,
                        "showAudio",
                        !section.showAudio
                      )
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition duration-200 shadow-sm w-full ${section.showAudio
                      ? "bg-lightGreen text-forestGreen border border-leafGreen/50"
                      : "bg-lightGreen text-forestGreen hover:bg-lightGreen"
                      }`}
                    disabled={
                      section.showAudio && previews[`audioUrl-${sectionIndex}`]
                    }
                  >
                    <Music className="w-5 h-5" />
                    <span>{section.showAudio ? "Audio" : "Add Audio"}</span>
                  </button>

                  {/* File Button */}
                  <button
                    type="button"
                    onClick={() =>
                      handleAccordianChange(
                        sectionIndex,
                        "showFile",
                        !section.showFile
                      )
                    }
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md transition duration-200 shadow-sm w-full ${section.showFile
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    disabled={
                      section.showFile && previews[`fileUrl-${sectionIndex}`]
                    }
                  >
                    <FileText className="w-5 h-5" />
                    <span>{section.showFile ? "Document" : "Add File"}</span>
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
                          handleRemoveFile(sectionIndex, "videoUrl");
                          handleAccordianChange(
                            sectionIndex,
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
                    <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Type*
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`internal-video-${sectionIndex}`}
                            checked={videoTypes[sectionIndex] === "internal"}
                            onChange={() =>
                              handleVideoTypeChange(sectionIndex, "internal")
                            }
                            className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
                          />
                          <label
                            htmlFor={`internal-video-${sectionIndex}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            Internal Video
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`youtube-video-${sectionIndex}`}
                            checked={videoTypes[sectionIndex] === "youtube"}
                            onChange={() =>
                              handleVideoTypeChange(sectionIndex, "youtube")
                            }
                            className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
                          />
                          <label
                            htmlFor={`youtube-video-${sectionIndex}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            YouTube Video
                          </label>
                        </div>
                      </div>
                    </div>

                    {videoTypes[sectionIndex] === "internal" &&
                      !previews[`videoUrl-${sectionIndex}`] ? (
                      <div className="flex flex-col space-y-2">
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
                      </div>
                    ) : videoTypes[sectionIndex] === "youtube" ? (
                      <div className="flex flex-col space-y-2">
                        <input
                          type="text"
                          placeholder="Enter YouTube video link"
                          value={
                            formData.accordianSections[sectionIndex]
                              ?.youtubeUrl || ""
                          }
                          onChange={(e) => {
                            const updatedSections = [
                              ...formData.accordianSections,
                            ];
                            updatedSections[sectionIndex] = {
                              ...updatedSections[sectionIndex],
                              youtubeUrl: e.target.value,
                            };
                            setFormData({
                              ...formData,
                              accordianSections: updatedSections,
                            });
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                        />
                        <p className="text-xs text-gray-500">
                          Enter the full YouTube video URL
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="relative w-full max-w-md">
                          <video
                            src={previews[`videoUrl-${sectionIndex}`]}
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
                          handleRemoveFile(sectionIndex, "audioUrl");
                          handleAccordianChange(
                            sectionIndex,
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

                    {!previews[`audioUrl-${sectionIndex}`] ? (
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
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="relative w-full">
                          <audio
                            src={previews[`audioUrl-${sectionIndex}`]}
                            controls
                            className="w-full rounded-lg border border-leafGreen/30 shadow-md"
                          />
                          {/* This button has been repositioned for better alignment */}
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
                          handleRemoveFile(sectionIndex, "fileUrl");
                          handleAccordianChange(
                            sectionIndex,
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

                    {!previews[`fileUrl-${sectionIndex}`] ? (
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
                    ) : (
                      <div className="mt-3 flex items-center">
                        <div className="relative bg-white p-3 rounded-lg border border-gray-200 w-full flex items-center justify-between">
                          <a
                            href={previews[`fileUrl-${sectionIndex}`]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 flex items-center gap-2 transition duration-200"
                          >
                            <FileText className="w-4 h-4" />
                            {formData.accordianSections[sectionIndex].fileUrl
                              ?.name || "View Document"}
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveFile(sectionIndex, "fileUrl")
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
