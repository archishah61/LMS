/* eslint-disable react/prop-types */

import { Editor } from "@tinymce/tinymce-react";
import { useState, useEffect } from "react";
import TextToAudioConverter from "../../AIServices/TextToAudioConverter"; // Import the new component

export default function GeneralContent({
  formData,
  handleChange,
  handleFileChange,
  setFormData
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

  // Material types (enum mapping to backend tbl_materials.material_type)
  const materialTypes = [
    { value: "pdf", label: "PDF Document" },
    { value: "link", label: "External Link" },
    { value: "document", label: "Document" },
    { value: "image", label: "Image" },
    { value: "other", label: "Other" },
  ];

  const completionTypes = [
    { value: "audio", label: "Audio" },
    { value: "timer", label: "Timer" },
  ];

  // Deprecated single material preview replaced by per-row preview map
  const [preview, setPreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  
  // Ensure material links open correctly by resolving relative URLs against backend media base
  const resolveMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (/^https?:\/\//i.test(url)) return url; // already absolute
    const base = import.meta.env.VITE_BACKEND_MEDIA_URL || '';
    if (!base) return url.startsWith('/') ? url : `/${url}`;
    const baseTrim = base.endsWith('/') ? base.slice(0, -1) : base;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseTrim}${path}`;
  };

  useEffect(() => {
    // Clean up previous URL to prevent memory leaks
    if (audioPreview && audioPreview.startsWith('blob:')) {
      URL.revokeObjectURL(audioPreview);
    }

    if (formData.generalAudioFile instanceof File) {
      // Create a URL for the File object so it can be played
      const previewUrl = URL.createObjectURL(formData.generalAudioFile);
      setAudioPreview(previewUrl);
      
      const el = document.createElement('audio');
      el.preload = 'metadata';
      el.src = previewUrl;
      const onLoaded = () => {
        const sec = Number.isFinite(el.duration) ? el.duration : 0;
        const minutes = secondsToDecimalMinutes(sec);
        handleChange({ target: { name: 'generalAudioDuration', value: minutes } });
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

    } else if (typeof formData.generalAudioFile === 'string' && formData.generalAudioFile) {
      // If it's already a URL string (existing file from database)
      setAudioPreview(formData.generalAudioFile);
      
      const el = document.createElement('audio');
      el.preload = 'metadata';
      el.src = formData.generalAudioFile;
      const onLoaded = () => {
        const sec = Number.isFinite(el.duration) ? el.duration : 0;
        const minutes = secondsToDecimalMinutes(sec);
        handleChange({ target: { name: 'generalAudioDuration', value: minutes } });
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

    } else {
      // No audio file
      setAudioPreview(null);
    }

    // Cleanup function to revoke URL when component unmounts or audioFile changes
    return () => {
      if (audioPreview && audioPreview.startsWith('blob:')) {
        URL.revokeObjectURL(audioPreview);
      }
    };
  }, [formData.generalAudioFile]); // Remove audioPreview from dependency array to avoid infinite loops

  // File type restrictions based on material type
  const getAcceptedFileTypes = (materialType) => {
    switch (materialType) {
      case "pdf":
        return "application/pdf";
      case "document":
        return ".doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.xls,.xlsx,.html,.text";
      case "image":
        return "image/*";
      case "other":
        return ".zip,.json,.xml,.csv,.mp4,.mp3,.wav,.exe,.apk,.7z,.tar,.gz";
      default:
        return "";
    }
  };

  // General materials array helpers ----------------------------------------
  // Ensure formData has generalMaterials array
  if (!Array.isArray(formData.generalMaterials)) {
    setFormData((prev) => ({ ...prev, generalMaterials: [] }));
  }

  const addMaterialRow = () => {
    setFormData((prev) => ({
      ...prev,
      generalMaterials: [
        ...(prev.generalMaterials || []),
        { id: null, material_type: "", link: "", file: null, existing_file: null, previewUrl: null },
      ],
    }));
  };

  const updateMaterialRow = (index, key, value) => {
    setFormData((prev) => {
      const list = [...(prev.generalMaterials || [])];
      list[index] = { ...list[index], [key]: value };
      // Clear file/link if type changes
      if (key === "material_type") {
        list[index].file = null;
        list[index].link = "";
        list[index].existing_file = null;
        list[index].previewUrl = null;
      }
      return { ...prev, generalMaterials: list };
    });
  };

  const removeMaterialRow = (index) => {
    setFormData((prev) => {
      const list = [...(prev.generalMaterials || [])];
      list.splice(index, 1);
      return { ...prev, generalMaterials: list };
    });
  };

  const handleMaterialFile = (index, file) => {
    if (!file) return;
    // Basic validation by type
    const row = formData.generalMaterials[index];
    if (!row.material_type) {
      alert("Select material type first");
      return;
    }
    const valid = validateFileType(file.type, file.name, row.material_type);
    if (!valid) {
      alert(`Invalid file for ${row.material_type}`);
      return;
    }
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setFormData((prev) => {
      const list = [...prev.generalMaterials];
      list[index] = { ...list[index], file, existing_file: null, previewUrl };
      return { ...prev, generalMaterials: list };
    });
  };

  // Deprecated single file handler removed (multi-material rows handle own files now)

  const validateFileType = (fileType, fileName, materialType) => {
    switch (materialType) {
      case "pdf":
        return fileType === "application/pdf";
      case "document": {
        const validMimeTypes = [
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/rtf",
          "text/rtf",
          "application/vnd.oasis.opendocument.text",
          "text/plain",
          "text/html",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        if (validMimeTypes.includes(fileType)) {
          return true;
        }

        const extension = fileName.split(".").pop().toLowerCase();
        const validExtensions = [
          "doc",
          "docx",
          "txt",
          "rtf",
          "odt",
          "ppt",
          "pptx",
          "xls",
          "xlsx",
          "html",
          "text",
        ];
        return validExtensions.includes(extension);
      }
      case "image":
        return fileType.startsWith("image/");
      case "other":
        return true;
      default:
        return false;
    }
  };

  const removeFile = (field) => {
    const clearEvent = { target: { files: [], value: null } };
    if (field === "general-audio-upload") {
      setAudioPreview(null);
      handleFileChange(clearEvent, "generalAudioFile");
    }
  };

  // Removed effect tied to single materialType

  const handleEditorChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      generalDescription: content,
    }));
  };

  const handleCodeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      code: value,
    }));
  };

  const handleLanguageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      codeLanguage: e.target.value,
    }));
  };

  const handleCompletionTimeChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setFormData((prev) => ({
        ...prev,
        generalCompletionTime: value,
      }));
    } else if (e.target.value === "") {
      setFormData((prev) => ({
        ...prev,
        generalCompletionTime: "",
      }));
    }
  };

  const handleCompletionTypeChange = (e) => {
    const updatedFormData = { ...formData };
    updatedFormData.generalCompletionType = e.target.value;

    if (e.target.value === "audio") {
      updatedFormData.generalCompletionTime = 1;
      updatedFormData.generalAudioDuration = Number(updatedFormData.generalAudioDuration) || 0;
    } else if (e.target.value === "timer") {
      updatedFormData.generalAudioFile = null;
      updatedFormData.generalAudioDuration = 0;
      if (audioPreview) {
        setAudioPreview(null);
      }
    }
    setFormData(updatedFormData);
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        General Content
      </h2>

      {/* Title Input */}
      <div className="bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title*
        </label>
        <input
          type="text"
          name="generalTitle"
          value={formData.generalTitle || ""}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
          placeholder="Enter title"
          required
        />
      </div>

      {/* Description Editor */}
      <div className="bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description*
        </label>
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API}
          value={formData.generalDescription}
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
          onEditorChange={handleEditorChange}
        />
      </div>

      {/* Completion Type Selection */}
      <div className="bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Completion Type*
        </label>
        <select
          name="completion_type"
          value={formData.generalCompletionType || "audio"}
          onChange={handleCompletionTypeChange}
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

      {/* Audio Upload/Text-to-Speech Section - REPLACED */}
      {formData.generalCompletionType === "audio" ? (
        <TextToAudioConverter
          handleFileChange={handleFileChange}
          audioPreview={audioPreview}
          setAudioPreview={setAudioPreview}
          fieldName="generalAudioFile" // Explicitly pass the field name
          isExistingFile={audioPreview !== null}
          existingFileUrl={typeof formData.generalAudioFile === 'string' ? formData.generalAudioFile : null}
        />
      ) : (
        <div className="bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Completion Time (in minutes)*
          </label>
          <input
            type="number"
            name="generalCompletionTime"
            value={formData.generalCompletionTime || ""}
            onChange={handleCompletionTimeChange}
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

      {formData.generalCompletionType === "audio" && (
        <div className="bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)*
          </label>
          <input
            type="number"
            name="generalAudioDuration"
            min="0"
            step="0.01"
            value={formData.generalAudioDuration ?? 0}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
            placeholder="Auto-filled when audio is selected or generated"
            required
            disabled
          />
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
            <p className="font-mono text-xs text-slate-700">
              mm:ss {decimalMinutesToMmSs(formData.generalAudioDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(formData.generalAudioDuration || 0)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">stored value uses decimal minutes; use hh:mm:ss for readability (hh hours, mm minutes, ss seconds).</p>
          </div>
          <p className="mt-2 text-sm text-gray-500">*This field is disabled because the audio duration is auto-captured.</p>
        </div>
      )}
    </div>
  );
}
