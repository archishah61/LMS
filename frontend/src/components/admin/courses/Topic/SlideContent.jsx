/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
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
  ChevronUp,
  Trash,
} from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import { Video, Music, FileText } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import TextToAudioConverter from "../../AIServices/TextToAudioConverter";
import toast from "react-hot-toast";

const SlideContent = ({ formData, handleChange, handleFileChange, isValidMaterialFile, codeLanguages, getLanguageExtension, getAcceptType, normalizeMinuteSecondString }) => {
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

    if (typeof normalizeMinuteSecondString === "function") {
      return normalizeMinuteSecondString(valueAsString);
    }

    const parsed = parseFloat(valueAsString);
    if (!Number.isFinite(parsed) || parsed < 0) return "0.00";
    return parsed.toFixed(2);
  };
  const secondsToDecimalMinutes = (totalSeconds) =>
    Number((Math.max(0, Number(totalSeconds) || 0) / 60).toFixed(2));

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

  // Helper: compute media duration from a URL using HTML5 media element
  const computeDurationFromUrl = (url, type = "video") =>
    new Promise((resolve, reject) => {
      try {
        const el = document.createElement(type === "audio" ? "audio" : "video");
        el.preload = "metadata";
        const onLoaded = () => {
          const dur = el.duration;
          const val = secondsToDecimalMinutes(dur);
          cleanup();
          resolve(val);
        };
        const onError = () => {
          cleanup();
          resolve(undefined);
        };
        const cleanup = () => {
          el.removeEventListener("loadedmetadata", onLoaded);
          el.removeEventListener("error", onError);
          // Revoke only blob URLs we created elsewhere; safe no-op for http(s)
        };
        el.addEventListener("loadedmetadata", onLoaded);
        el.addEventListener("error", onError);
        el.src = url;
      } catch (e) {
        resolve(undefined);
      }
    });

  // YouTube API loader (singleton)
  const ytApiPromiseRef = useRef(null);
  const ensureYouTubeAPI = () => {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (ytApiPromiseRef.current) return ytApiPromiseRef.current;
    ytApiPromiseRef.current = new Promise((resolve) => {
      const scriptId = "youtube-iframe-api";
      if (!document.getElementById(scriptId)) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.id = scriptId;
        document.body.appendChild(tag);
      }
      const check = () => {
        if (window.YT && window.YT.Player) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
    return ytApiPromiseRef.current;
  };

  const getYouTubeIdFromUrl = (url) => {
    if (!url) return null;
    try {
      // Support both youtube.com/watch?v= and youtu.be/<id>
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.replace("/", "").split("/")[0] || null;
      }
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      // Fallback simple split
      if (url.includes("v=")) return url.split("v=")[1].split("&")[0];
    } catch (e) {
      // ignore
    }
    return null;
  };

  const computeYouTubeDuration = async (videoUrl) => {
    const id = getYouTubeIdFromUrl(videoUrl);
    if (!id) return undefined;
    await ensureYouTubeAPI();
    return new Promise((resolve) => {
      try {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.width = "1px";
        container.style.height = "1px";
        document.body.appendChild(container);

        const player = new window.YT.Player(container, {
          videoId: id,
          events: {
            onReady: () => {
              // getDuration is reliable after ready
              const dur = Math.floor(player.getDuration() || 0);
              const val = secondsToDecimalMinutes(dur);
              try {
                player.destroy();
              } catch { }
              container.remove();
              resolve(val);
            },
            onError: () => {
              try {
                player.destroy();
              } catch { }
              container.remove();
              resolve(undefined);
            },
          },
        });
      } catch {
        resolve(undefined);
      }
    });
  };

  const [audioPreview, setAudioPreview] = useState({});
  // Track previous File objects per slide to avoid regenerating blob URLs
  const prevFilesRef = useRef({
    audioFile: {},
    slideAudioFile: {},
  });
  const [slides, setSlides] = useState(
    formData.slides || [
      {
        title: "",
        description: "",
        content_type: "general",
        videoFile: null,
        slideCompletionType: "audio",
        slideCompletionTime: 1,
        slideAudioFile: null,
        videoDuration: "",
        audioFile: null,
        audioDuration: "",
        accordianSections: [
          {
            title: "",
            body: "",
            mediaUrl: [],
            videoFile: null,
            generalTitle: "",
            generalDescription: "",
            videoUrl: "",
          },
        ],
        // materials may be null or an array; leave as null by default
        materials: null,
        generalFile: null,
        materialType: "",
        externalLink: "",
        tags: [{ tagName: "", tagFile: null }],
        sequence_no: 1,
      },
    ]
  );

  useEffect(() => {
    setSlides(formData.slides);

    // For each slide, update preview URLs only if file changed; avoid regen to prevent blinking
    formData.slides.forEach((slide, slideIndex) => {
      // slideCompletion audio (slideAudioFile)
      const slideAudioKey = `slideAudioFile-${slideIndex}`;
      const newSlideAudio = slide.slideAudioFile;
      const prevSlideAudio = prevFilesRef.current.slideAudioFile[slideIndex];
      if (newSlideAudio instanceof File) {
        // New File object: create a blob URL (only when file changed)
        if (prevSlideAudio !== newSlideAudio) {
          const oldUrl = audioPreview[slideAudioKey];
          if (oldUrl && typeof oldUrl === 'string' && oldUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(oldUrl); } catch { }
          }
          const url = URL.createObjectURL(newSlideAudio);
          setAudioPreview((prev) => ({ ...prev, [slideAudioKey]: url }));
          prevFilesRef.current.slideAudioFile[slideIndex] = newSlideAudio;
        }
      } else if (typeof newSlideAudio === 'string' && newSlideAudio) {
        // Stored string path/URL from backend: resolve to full URL and set
        const resolved = resolveMediaUrl(newSlideAudio);
        if (audioPreview[slideAudioKey] !== resolved) {
          setAudioPreview((prev) => ({ ...prev, [slideAudioKey]: resolved }));
        }
        prevFilesRef.current.slideAudioFile[slideIndex] = undefined;
      } else {
        // Removed or null: revoke blob if we created one and delete preview key
        const oldUrl = audioPreview[slideAudioKey];
        if (oldUrl && typeof oldUrl === 'string' && oldUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(oldUrl); } catch { }
        }
        setAudioPreview((prev) => {
          if (!(slideAudioKey in prev)) return prev;
          const { [slideAudioKey]: _, ...rest } = prev;
          return rest;
        });
        prevFilesRef.current.slideAudioFile[slideIndex] = undefined;
      }

      // slide content audio (audioFile)
      const audioKey = `audioFile-${slideIndex}`;
      const newAudio = slide.audioFile;
      const prevAudio = prevFilesRef.current.audioFile[slideIndex];
      if (newAudio instanceof File) {
        if (prevAudio !== newAudio) {
          const oldUrl = audioPreview[audioKey];
          if (oldUrl && oldUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(oldUrl); } catch { }
          }
          const url = URL.createObjectURL(newAudio);
          setAudioPreview((prev) => ({ ...prev, [audioKey]: url }));
          prevFilesRef.current.audioFile[slideIndex] = newAudio;
        }
      } else if (typeof newAudio === 'string' && newAudio) {
        if (audioPreview[audioKey] !== newAudio) {
          setAudioPreview((prev) => ({ ...prev, [audioKey]: newAudio }));
        }
        prevFilesRef.current.audioFile[slideIndex] = undefined;
      } else {
        const oldUrl = audioPreview[audioKey];
        if (oldUrl && oldUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(oldUrl); } catch { }
        }
        setAudioPreview((prev) => {
          if (!(audioKey in prev)) return prev;
          const { [audioKey]: _, ...rest } = prev;
          return rest;
        });
        prevFilesRef.current.audioFile[slideIndex] = undefined;
      }
    });

    // Cleanup on unmount: revoke any blob URLs
    return () => {
      Object.values(audioPreview).forEach((url) => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          try { URL.revokeObjectURL(url); } catch { }
        }
      });
    };
  }, [formData.slides]);

  // Add this useEffect after your existing useEffect for slides
  useEffect(() => {
    if (formData.slides && formData.slides.length > 0) {
      // Ensure all slides have proper sequence numbers
      const sequencedSlides = formData.slides.map((slide, index) => ({
        ...slide,
        sequence_no: slide.sequence_no || index + 1,
        // Keep materials as-is (allow null/empty)
        materials: Array.isArray(slide.materials) ? slide.materials : null,
      }));
      setSlides(sequencedSlides);
    }
  }, [formData.slides]);

  // Track which slides are expanded
  const [expandedSlides, setExpandedSlides] = useState(
    slides.map((_, index) => index === 0) // Initially expand only the first slide
  );
  const [expandedSections, setExpandedSections] = useState({ 0: true }); // Default first section open

  const contentTypes = [
    { value: "video", label: "Video" },
    // { value: "audio", label: "Audio" }, // uncomment to add Slide Type Audio
    { value: "accordian", label: "Accordian" },
    { value: "general", label: "General" },
  ];

  const materialTypes = [
    { value: "pdf", label: "PDF Document" },
    { value: "link", label: "External Link" },
    { value: "document", label: "Document" },
    { value: "image", label: "Image" },
    { value: "code", label: "Code" },
    { value: "other", label: "Other" },
  ];

  const completionTypes = [
    { value: "audio", label: "Audio" },
    { value: "timer", label: "Timer" },
  ];

  const [previews, setPreviews] = useState({});

  const restoreSlidePreviews = (slideIndex) => {
    const slide = slides?.[slideIndex];
    if (!slide) return;

    const slideAudioKey = `slideAudioFile-${slideIndex}`;
    const contentAudioKey = `audioFile-${slideIndex}`;
    const videoKey = `videoFile-${slideIndex}`;

    if (!audioPreview[slideAudioKey]) {
      if (slide.slideAudioFile instanceof File) {
        const url = URL.createObjectURL(slide.slideAudioFile);
        setAudioPreview((prev) => ({ ...prev, [slideAudioKey]: url }));
        prevFilesRef.current.slideAudioFile[slideIndex] = slide.slideAudioFile;
      } else if (typeof slide.slideAudioFile === "string" && slide.slideAudioFile) {
        setAudioPreview((prev) => ({
          ...prev,
          [slideAudioKey]: resolveMediaUrl(slide.slideAudioFile),
        }));
      }
    }

    if (!audioPreview[contentAudioKey]) {
      if (slide.audioFile instanceof File) {
        const url = URL.createObjectURL(slide.audioFile);
        setAudioPreview((prev) => ({ ...prev, [contentAudioKey]: url }));
        prevFilesRef.current.audioFile[slideIndex] = slide.audioFile;
      } else if (typeof slide.audioFile === "string" && slide.audioFile) {
        setAudioPreview((prev) => ({
          ...prev,
          [contentAudioKey]: resolveMediaUrl(slide.audioFile),
        }));
      }
    }

    if (!previews[videoKey]) {
      if (slide.videoFile instanceof File) {
        const url = URL.createObjectURL(slide.videoFile);
        setPreviews((prev) => ({ ...prev, [videoKey]: url }));
      } else if (typeof slide.videoFile === "string" && slide.videoFile) {
        setPreviews((prev) => ({
          ...prev,
          [videoKey]: resolveMediaUrl(slide.videoFile),
        }));
      }
    }
  };

  const toggleSlide = (index) => {
    const newExpandedSlides = [...expandedSlides];
    const willExpand = !newExpandedSlides[index];
    newExpandedSlides[index] = !newExpandedSlides[index];
    setExpandedSlides(newExpandedSlides);

    if (willExpand) {
      restoreSlidePreviews(index);
    }
  };

  // Materials handlers (per-slide)
  const addSlideMaterialRow = (slideIndex) => {
    const updated = [...slides];
    if (!Array.isArray(updated[slideIndex].materials)) {
      updated[slideIndex].materials = [];
    }
    updated[slideIndex].materials.push({
      material_type: "",
      link: "",
      file: null,
      code: "",
      codeLanguage: "",
    });
    updateSlides(updated);
  };

  const updateSlideMaterialRow = (slideIndex, index, key, value) => {
    const updated = [...slides];
    if (!Array.isArray(updated[slideIndex].materials)) updated[slideIndex].materials = [];
    const list = [...updated[slideIndex].materials];
    list[index] = { ...list[index], [key]: value };
    if (key === "material_type") {
      list[index].file = null;
      list[index].link = "";
      list[index].code = "";
      list[index].codeLanguage = "";
    }
    updated[slideIndex].materials = list;
    updateSlides(updated);
  };

  const removeSlideMaterialRow = (slideIndex, index) => {
    const updated = [...slides];
    if (!Array.isArray(updated[slideIndex].materials)) return;
    const list = [...updated[slideIndex].materials];
    list.splice(index, 1);
    updated[slideIndex].materials = list;
    updateSlides(updated);
  };

  const handleSlideMaterialFile = (slideIndex, index, file) => {
    if (!file) return;
    const updated = [...slides];
    if (!Array.isArray(updated[slideIndex].materials)) updated[slideIndex].materials = [];
    const list = [...updated[slideIndex].materials];

    if (!isValidMaterialFile(file, list[index]?.material_type)) {
      toast.error(`Invalid file for type: ${list[index]?.material_type}`);
      return prev;
    }

    list[index] = { ...list[index], file };
    updated[slideIndex].materials = list;
    updateSlides(updated);
  };

  const handleFilePreview = (index, fieldName, file) => {
    handleSlideFileChange(index, fieldName, file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({
        ...prev,
        [`${fieldName}-${index}`]: previewUrl,
      }));

      // Auto-capture durations for media files
      if (fieldName === "videoFile") {
        // Compute video duration (mm.ss)
        computeDurationFromUrl(previewUrl, "video").then((val) => {
          if (val !== undefined) {
            handleSlideChange(index, "videoDuration", String(val));
          }
        });
      }
    }
  };

  const handleAudioChange = (index, fieldName, file) => {
    handleSlideFileChange(index, fieldName, file);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAudioPreview((prev) => ({
        ...prev,
        [`${fieldName}-${index}`]: previewUrl,
      }));

      // Auto-capture duration for audio files
      computeDurationFromUrl(previewUrl, "audio").then((val) => {
        if (val !== undefined) {
          handleSlideChange(index, "audioDuration", String(val));
        }
      });
    }
  };

  const [accordianPreviews, setAccordianPreviews] = useState({});

  // Resolve a stored media URL to a fully qualified URL using backend media base
  const resolveMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (/^https?:\/\//i.test(url)) return url;
    const base = import.meta.env.VITE_BACKEND_MEDIA_URL || '';
    if (!base) return url.startsWith('/') ? url : `/${url}`;
    const baseTrim = base.endsWith('/') ? base.slice(0, -1) : base;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseTrim}${path}`;
  };

  const handleAccordianFilePreview = (
    slideIndex,
    accordianIndex,
    fieldName,
    file
  ) => {
    handleAccordianChange(slideIndex, accordianIndex, fieldName, file);
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

  const updateSlides = (newSlides) => {
    setSlides(newSlides);

    handleChange({ target: { name: "slides", value: newSlides } });
  };

  const handleSlideChange = (index, field, value) => {
    const updatedSlides = [...slides];

    if (field === "slideCompletionType" && value === "audio") {
      updatedSlides[index].slideCompletionTime = 0;
    } else if (field === "slideCompletionType" && value === "timer") {
      updatedSlides[index].slideAudioFile = null;
      updatedSlides[index].audioDuration = "";
      if (audioPreview[`slideAudioFile-${index}`]) {
        setAudioPreview((prev) => {
          const updatedAudioPreview = { ...prev };
          delete updatedAudioPreview[`slideAudioFile-${index}`];
          return updatedAudioPreview;
        });
      }
    }

    if (["codeLanguage", "code"].includes(field)) {
      updatedSlides[index][field] = value;
    } else {
      updatedSlides[index][field] = value;
    }

    updateSlides(updatedSlides);
  };

  const handleSlideContentTypeChange = (index, value) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = {
      ...updatedSlides[index],
      content_type: value,
      videoType: "internal", // default video type
      videoUrl: "", // for YouTube
      videoFile: null,
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
      // materials left as-is (allow null/empty)
      materials: updatedSlides[index].materials || null,
      generalFile: null,
      materialType: "",
      externalLink: "",
      tags: [{ tagName: "", tagFile: null }],
    };
    updateSlides(updatedSlides);
  };

  const handleSlideFileChange = (index, fieldName, file) => {
    const updatedSlides = [...slides];
    updatedSlides[index][fieldName] = file;
    updateSlides(updatedSlides);
  };

  const handleSlideEditorChange = (index, content) => {
    const updatedSlides = [...slides];
    updatedSlides[index].description = content;
    updateSlides(updatedSlides);
  };

  const handleAccordianChange = (slideIndex, accordianIndex, field, value) => {
    const updatedSlides = [...slides];
    const newSections = [...updatedSlides[slideIndex].accordianSections];
    const currentSection = { ...newSections[accordianIndex] };

    if (["title", "body", "codeLanguage", "code"].includes(field)) {
      currentSection[field] = value;
    } else if (
      field === "showVideo" ||
      field === "showAudio" ||
      field === "showFile"
    ) {
      currentSection[field] = value;
    } else if (
      field === "videoUrl" ||
      field === "audioUrl" ||
      field === "fileUrl"
    ) {
      if (field === "videoUrl" && currentSection.videoType === "youtube") {
        currentSection.videoUrl = value;
        // Update preview for YouTube URL
        if (value && value.includes("youtube.com/watch?v=")) {
          setAccordianPreviews((prev) => ({
            ...prev,
            [`videoUrl-${slideIndex}-${accordianIndex}`]: value,
          }));
        } else {
          setAccordianPreviews((prev) => {
            const updated = { ...prev };
            delete updated[`videoUrl-${slideIndex}-${accordianIndex}`];
            return updated;
          });
        }
      } else {
        const mediaType = field.replace("Url", "Media");
        const mediaUrl = value;
        if (mediaUrl) {
          const fileType =
            field === "videoUrl"
              ? "video"
              : field === "audioUrl"
                ? "audio"
                : "document";

          currentSection.mediaUrl.push({ url: mediaUrl, fileType });
        }
      }
    } else if (field === "videoType") {
      currentSection.videoType = value;
      // Reset video URL when changing video type
      currentSection.videoUrl = "";
      setAccordianPreviews((prev) => {
        const updated = { ...prev };
        delete updated[`videoUrl-${slideIndex}-${accordianIndex}`];
        return updated;
      });
    }

    newSections[accordianIndex] = currentSection;
    updatedSlides[slideIndex].accordianSections = newSections;
    updateSlides(updatedSlides);
  };

  const addAccordianSection = (slideIndex) => {
    const updatedSlides = [...slides];
    updatedSlides[slideIndex].accordianSections.push({
      title: "",
      body: "",
      mediaUrl: [],
    });
    updateSlides(updatedSlides);
  };

  const removeAccordianSection = (slideIndex, accordianIndex) => {
    const updatedSlides = [...slides];
    updatedSlides[slideIndex].accordianSections = updatedSlides[
      slideIndex
    ].accordianSections.filter((_, i) => i !== accordianIndex);
    updateSlides(updatedSlides);
  };

  const addSlide = () => {
    updateSlides([
      ...slides,
      {
        title: "",
        description: "",
        content_type: "general",
        videoFile: null,
        slideCompletionType: "audio",
        slideCompletionTime: 1,
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
        // new slides start with no materials by default
        materials: null,
        generalFile: null,
        materialType: "",
        externalLink: "",
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

      setPreviews((prev) => {
        const updatedPreviews = { ...prev };
        Object.keys(prev).forEach((key) => {
          if (
            key.startsWith(`videoFile-${index}`) ||
            key.startsWith(`audioFile-${index}`)
          ) {
            delete updatedPreviews[key];
          }
        });
        return updatedPreviews;
      });
      setAccordianPreviews((prev) => {
        const updatedAccordianPreviews = { ...prev };
        Object.keys(prev).forEach((key) => {
          if (
            key.startsWith(`videoUrl-${index}`) ||
            key.startsWith(`audioUrl-${index}`)
          ) {
            delete updatedAccordianPreviews[key];
          }
        });
        return updatedAccordianPreviews;
      });
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
    const newTags = [...updatedSlides[slideIndex].tags];
    newTags[tagIndex] = {
      ...newTags[tagIndex],
      [field]: field === "tagFile" ? value : value.target.value,
    };
    updatedSlides[slideIndex].tags = newTags;
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

  const renderVideoContent = (slideIndex) => {
    const slide = slides[slideIndex];

    const handleVideoTypeChange = (type) => {
      if (type === "internal") {
        handleSlideChange(slideIndex, "videoType", "internal");
        handleSlideChange(slideIndex, "videoUrl", "");
        handleSlideFileChange(slideIndex, "videoFile", null); // Optional: reset YouTube-related data
      } else {
        handleSlideChange(slideIndex, "videoType", "youtube");
        handleSlideFileChange(slideIndex, "videoFile", null);
        setPreviews((prev) => {
          const updated = { ...prev };
          delete updated[`videoFile-${slideIndex}`];
          return updated;
        });
        // If there's already a URL, try to compute duration
        const currentUrl = slides[slideIndex]?.videoUrl;
        if (currentUrl) {
          computeYouTubeDuration(currentUrl).then((val) => {
            if (val !== undefined) {
              handleSlideChange(slideIndex, "videoDuration", String(val));
            }
          });
        }
      }
    };

    const removeVideo = () => {
      handleSlideFileChange(slideIndex, "videoFile", null);
      setPreviews((prev) => {
        const updated = { ...prev };
        delete updated[`videoFile-${slideIndex}`];
        return updated;
      });
      document.getElementById(`video-upload-${slideIndex}`).value = "";
    };

    return (
      <div className="space-y-4 md:space-y-6 md:p-4 bg-white md:rounded-lg md:shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Video Content
        </h2>

        {/* Video Type Selection */}
        <div className="bg-gray-50 md:p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video Type*
          </label>
          <div className="flex flex-col md:flex-row items-start md:space-x-4">
            <div className="flex items-center">
              <input
                type="radio"
                id={`internal-video-${slideIndex}`}
                checked={slide.videoType === "internal"}
                onChange={() => handleVideoTypeChange("internal")}
                className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
              />
              <label
                htmlFor={`internal-video-${slideIndex}`}
                className="ml-2 text-sm text-gray-700"
              >
                Internal Video
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id={`youtube-video-${slideIndex}`}
                checked={slide.videoType === "youtube"}
                onChange={() => handleVideoTypeChange("youtube")}
                className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
              />
              <label
                htmlFor={`youtube-video-${slideIndex}`}
                className="ml-2 text-sm text-gray-700"
              >
                YouTube Video
              </label>
            </div>
          </div>
        </div>

        {/* Conditional Video Inputs */}
        {slide.videoType === "internal" && (
          <div className="bg-gray-50 md:p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File*
            </label>
            <input
              id={`video-upload-${slideIndex}`}
              type="file"
              accept="video/*"
              onChange={(e) =>
                handleFilePreview(slideIndex, "videoFile", e.target.files[0])
              }
              className="w-full p-2 border border-gray-300 rounded"
              required={
                !(
                  slide.videoFile instanceof File ||
                  (typeof slide.videoFile === "string" && slide.videoFile) ||
                  previews[`videoFile-${slideIndex}`]
                )
              }
            />
            {previews[`videoFile-${slideIndex}`] && (
              <div className="mt-3">
                <video
                  src={previews[`videoFile-${slideIndex}`]}
                  controls
                  className="w-full rounded-lg border border-leafGreen/30"
                  onLoadedMetadata={(e) => {
                    const dur = e.currentTarget.duration;
                    const val = secondsToDecimalMinutes(dur);
                    if (!isNaN(val)) {
                      handleSlideChange(slideIndex, "videoDuration", String(val));
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="mt-2 text-sm text-red-600 hover:underline"
                >
                  Remove video
                </button>
              </div>
            )}
          </div>
        )}

        {slide.videoType === "youtube" && (
          <>
            <div className="bg-gray-50 md:p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Video Link*
              </label>
              <input
                type="text"
                value={slide.videoUrl || ""}
                onChange={(e) => {
                  const url = e.target.value;
                  handleSlideChange(slideIndex, "videoUrl", url);
                  // Auto-capture duration for YouTube links
                  if (url) {
                    computeYouTubeDuration(url).then((val) => {
                      if (val !== undefined) {
                        handleSlideChange(slideIndex, "videoDuration", String(val));
                      }
                    });
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter YouTube video URL"
                required
              />
            </div>
            {slide.videoUrl && (() => {
              const ytId = getYouTubeIdFromUrl(slide.videoUrl);
              const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : null;
              return embedUrl ? (
                <div className="grid grid-cols-1 sm:min-h-[315px]">
                  <iframe
                    src={embedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full rounded-lg shadow-md"
                  />
                </div>
              ) : null;
            })()}
          </>
        )}

        {/* Duration */}
        <div className="bg-gray-50 md:p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)*
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={slide.videoDuration}
            onChange={(e) =>
              handleSlideChange(slideIndex, "videoDuration", e.target.value)
            }
            className="w-full p-2 border border-gray-300 rounded"
            required
            disabled
          />
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
            <p className="font-mono text-xs text-slate-700">
              mm:ss {decimalMinutesToMmSs(slide.videoDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(slide.videoDuration || 0)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">stored value uses decimal minutes; use hh:mm:ss for readability (hh hours, mm minutes, ss seconds).</p>
          </div>
          <p className="mt-2 text-sm text-gray-500">*This field is disabled because the video duration is auto-captured.</p>
        </div>

        <div className="rounded-xl border border-amber-200  from-amber-50 to-orange-50 p-4 mt-3">
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
                value={normalizeLocalMinuteSecondString(slide.videoDuration || 0)}
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
                value={slide.videoType === "youtube" ? "0.00" : slide.slide_extra_duration || "0"}
                disabled={slide.videoType === "youtube"}
                onChange={(e) =>
                  handleSlideChange(slideIndex, "slide_extra_duration", e.target.value)
                }
                onBlur={(e) =>
                  handleSlideChange(
                    slideIndex,
                    "slide_extra_duration",
                    normalizeLocalMinuteSecondString(e.target.value)
                  )
                }
                className="w-full p-2 border border-amber-300 rounded focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                placeholder="e.g. 1.50"
              />
              <p className="text-xs text-slate-500 mt-1">
                {slide.videoType === "youtube"
                  ? "Disabled for YouTube videos."
                  : "Optional additional time for this slide"}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-green-200 p-3">
              <label className="block text-xs font-semibold tracking-wide uppercase text-green-700 mb-2">
                Total Duration (min)
              </label>
              <input
                type="text"
                value={(() => {
                  const base = parseFloat(normalizeLocalMinuteSecondString(slide.videoDuration || 0));
                  const extra = slide.videoType === "youtube"
                    ? 0
                    : parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0));
                  return isNaN(base + extra) ? "0.00" : (base + extra).toFixed(2);
                })()}
                readOnly
                className="w-full p-2 border border-green-200 bg-green-50 rounded text-green-700 cursor-not-allowed font-semibold"
              />
            </div>
          </div>
          <div className="mt-3 rounded-md border border-amber-200 bg-white/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-amber-800">clock equivalents</p>
            <p className="font-mono text-xs text-amber-900">
              slide {decimalMinutesToMmSs(parseFloat(normalizeLocalMinuteSecondString(slide.videoDuration || 0)))} • {decimalMinutesToHhMmSs(parseFloat(normalizeLocalMinuteSecondString(slide.videoDuration || 0)))}
            </p>
            <p className="font-mono text-xs text-amber-900">
              extra {decimalMinutesToMmSs(slide.videoType === "youtube" ? 0 : parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)))} • {decimalMinutesToHhMmSs(slide.videoType === "youtube" ? 0 : parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)))}
            </p>
            <p className="font-mono text-xs text-amber-900">
              total {decimalMinutesToMmSs((parseFloat(normalizeLocalMinuteSecondString(slide.videoDuration || 0)) || 0) + (slide.videoType === "youtube" ? 0 : (parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)) || 0)))} • {decimalMinutesToHhMmSs((parseFloat(normalizeLocalMinuteSecondString(slide.videoDuration || 0)) || 0) + (slide.videoType === "youtube" ? 0 : (parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)) || 0)))}
            </p>
          </div>
          <p className="mt-3 text-xs text-amber-800 font-medium">
            Per slide only. Whole topic final duration is shown in the Topic Duration Summary above the form.
          </p>
        </div>
      </div>
    );
  };

  const renderAudioContent = (index) => {
    const handleSlideAudioFileChange = (e, fieldName) => {
      handleSlideFileChange(index, "audioFile", e.target.files[0]);
    };

    const handleSlideAudioPreview = (previewUrl) => {
      setAudioPreview((prev) => ({
        ...prev,
        [`audioFile-${index}`]: previewUrl,
      }));
    };

    return (
      <div className="space-y-6">
        <TextToAudioConverter
          handleFileChange={handleSlideAudioFileChange}
          audioPreview={audioPreview[`audioFile-${index}`]}
          setAudioPreview={handleSlideAudioPreview}
          isExistingFile={typeof slides[index]?.audioFile === 'string'}
          fieldName={`audioFile-${index}`}
        />

        {audioPreview[`audioFile-${index}`] ? (
          <audio
            key={audioPreview[`audioFile-${index}`]}
            src={audioPreview[`audioFile-${index}`]}
            preload="metadata"
            onLoadedMetadata={(e) => {
              const dur = e.currentTarget.duration;
              const val = secondsToDecimalMinutes(dur);
              if (!isNaN(val)) {
                // Only update if different to avoid render loop
                if (String(slides[index]?.audioDuration || '') !== String(val)) {
                  handleSlideChange(index, "audioDuration", String(val));
                }
              }
            }}
            className="hidden"
          />
        ) : null}

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)*
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={slides[index].audioDuration || ""}
            onChange={(e) =>
              handleSlideChange(index, "audioDuration", e.target.value)
            }
            className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
            placeholder="Enter duration in minutes"
            required
            disabled
          />
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
            <p className="font-mono text-xs text-slate-700">
              mm:ss {decimalMinutesToMmSs(slides[index].audioDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(slides[index].audioDuration || 0)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">stored value uses decimal minutes; use hh:mm:ss for readability (hh hours, mm minutes, ss seconds).</p>
          </div>
          <p className="mt-2 text-sm text-gray-500">*This field is disabled because the audio duration is auto-captured.</p>
        </div>
      </div>
    );
  };

  const renderAccordianContent = (slideIndex) => {
    const slide = slides[slideIndex];

    const toggleSection = (sectionIndex) => {
      setExpandedSections((prev) => ({
        ...prev,
        [sectionIndex]: !prev[sectionIndex],
      }));
    };

    return (
      <div className="space-y-4 md:space-y-6 bg-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Accordion Sections*
            </h2>
            <span className="bg-lightGreen text-forestGreen text-sm font-medium px-2.5 py-0.5 rounded-full">
              {slide.accordianSections?.length || 0}
            </span>
          </div>
          <button
            type="button"
            onClick={() => addAccordianSection(slideIndex)}
            className="bg-leafGreen text-white p-2 md:px-4 md:py-2 rounded-md   flex items-center gap-2 transition duration-200"
          >
            <Plus className="w-4 h-4" />
            <p className="hidden md:block">Add Section</p>
          </button>
        </div>

        {slide.accordianSections &&
          slide.accordianSections.length > 0 &&
          slide.accordianSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white">
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
                  {slide?.accordianSections?.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAccordianSection(slideIndex, sectionIndex);
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
                        handleAccordianChange(
                          slideIndex,
                          sectionIndex,
                          "title",
                          e.target.value
                        )
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
                        handleAccordianChange(
                          slideIndex,
                          sectionIndex,
                          "body",
                          content
                        )
                      }
                    />
                  </div>

                  {/* Programming Language Selection */}
                  <div className="bg-gray-50 md:p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programming Language
                    </label>
                    <select
                      value={section.codeLanguage || ""}
                      onChange={(e) =>
                        handleAccordianChange(
                          slideIndex,
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
                          handleAccordianChange(
                            slideIndex,
                            sectionIndex,
                            "code",
                            value
                          )
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
                            slideIndex,
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
                          section.showVideo &&
                          accordianPreviews[
                          `videoUrl-${slideIndex}-${sectionIndex}`
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
                          handleAccordianChange(
                            slideIndex,
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
                          section.showAudio &&
                          accordianPreviews[
                          `audioUrl-${slideIndex}-${sectionIndex}`
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
                          handleAccordianChange(
                            slideIndex,
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
                          section.showFile &&
                          accordianPreviews[
                          `fileUrl-${slideIndex}-${sectionIndex}`
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
                                sectionIndex,
                                "videoUrl",
                                null
                              );
                              handleAccordianChange(
                                slideIndex,
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
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Video Type*
                          </label>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id={`internal-video-${slideIndex}-${sectionIndex}`}
                                checked={section.videoType === "internal"}
                                onChange={() =>
                                  handleAccordianChange(
                                    slideIndex,
                                    sectionIndex,
                                    "videoType",
                                    "internal"
                                  )
                                }
                                className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
                              />
                              <label
                                htmlFor={`internal-video-${slideIndex}-${sectionIndex}`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                Internal Video
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id={`youtube-video-${slideIndex}-${sectionIndex}`}
                                checked={section.videoType === "youtube"}
                                onChange={() =>
                                  handleAccordianChange(
                                    slideIndex,
                                    sectionIndex,
                                    "videoType",
                                    "youtube"
                                  )
                                }
                                className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
                              />
                              <label
                                htmlFor={`youtube-video-${slideIndex}-${sectionIndex}`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                YouTube Video
                              </label>
                            </div>
                          </div>
                        </div>

                        {!accordianPreviews[
                          `videoUrl-${slideIndex}-${sectionIndex}`
                        ] ? (
                          <div className="flex flex-col space-y-2">
                            {section.videoType === "internal" ? (
                              <input
                                id={`videoUrl-input-${slideIndex}-${sectionIndex}`}
                                type="file"
                                accept="video/*"
                                onChange={(e) =>
                                  handleAccordianFilePreview(
                                    slideIndex,
                                    sectionIndex,
                                    "videoUrl",
                                    e.target.files[0]
                                  )
                                }
                                className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                              />
                            ) : (
                              <input
                                type="text"
                                value={section.videoUrl || ""}
                                onChange={(e) => {
                                  handleAccordianChange(
                                    slideIndex,
                                    sectionIndex,
                                    "videoUrl",
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
                            <div className="grid grid-cols-1 sm:min-h-[315px]">
                              {section.videoType === "internal" ? (
                                <video
                                  src={
                                    accordianPreviews[
                                    `videoUrl-${slideIndex}-${sectionIndex}`
                                    ]
                                  }
                                  controls
                                  className="w-full rounded-lg border border-leafGreen/30 shadow-md object-cover"
                                />
                              ) : (
                                <iframe
                                  src={`https://www.youtube.com/embed/${section.videoUrl.split("v=")[1]
                                    }`}
                                  className="w-full h-full rounded-lg border border-leafGreen/30 shadow-md aspect-video"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleAccordianFilePreview(
                                    slideIndex,
                                    sectionIndex,
                                    "videoUrl",
                                    null
                                  )
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
                                sectionIndex,
                                "audioUrl",
                                null
                              );
                              handleAccordianChange(
                                slideIndex,
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

                        {!accordianPreviews[
                          `audioUrl-${slideIndex}-${sectionIndex}`
                        ] ? (
                          <div className="flex flex-col space-y-2">
                            <input
                              id={`audioUrl-input-${slideIndex}-${sectionIndex}`}
                              type="file"
                              accept="audio/*"
                              onChange={(e) =>
                                handleAccordianFilePreview(
                                  slideIndex,
                                  sectionIndex,
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
                                  `audioUrl-${slideIndex}-${sectionIndex}`
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
                                    sectionIndex,
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
                                sectionIndex,
                                "fileUrl",
                                null
                              );
                              handleAccordianChange(
                                slideIndex,
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

                        {!accordianPreviews[
                          `fileUrl-${slideIndex}-${sectionIndex}`
                        ] ? (
                          <div className="flex flex-col space-y-2">
                            <input
                              id={`fileUrl-input-${slideIndex}-${sectionIndex}`}
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={(e) =>
                                handleAccordianFilePreview(
                                  slideIndex,
                                  sectionIndex,
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
                                  `fileUrl-${slideIndex}-${sectionIndex}`
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
                                    sectionIndex,
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

                  {/* Tags Section - if needed */}
                  {/* This would be implemented based on whether your slide sections support tags */}
                </div>
              )}
            </div>
          ))}
      </div>
    );
  };

  const renderGeneralContent = (slideIndex) => {
    const slide = slides[slideIndex];

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

    // Validate if file type matches selected material type
    const validateFileType = (fileType, fileName, materialType) => {
      switch (materialType) {
        case "pdf":
          return fileType === "application/pdf";
        case "document": {
          // First check MIME types
          const validMimeTypes = [
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "application/rtf", // .rtf
            "text/rtf", // .rtf (alternative)
            "application/vnd.oasis.opendocument.text", // .odt
            "text/plain", // .txt
            "text/html", // .html
            "application/vnd.ms-powerpoint", // .ppt
            "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
            "application/vnd.ms-excel", // .xls
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
          ];

          // If MIME type is valid, return true
          if (validMimeTypes.includes(fileType)) {
            return true;
          }

          // If MIME type check failed, check file extension
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

    // Enhanced file handler with validation
    const handleFilePreviewWithValidation = (slideIndex, field, file) => {
      // Check if file matches the selected material type
      if (file) {
        const fileType = file.type;
        const fileName = file.name;
        const validFileType = validateFileType(
          fileType,
          fileName,
          slide.materialType
        );

        if (!validFileType) {
          alert(`Please upload a valid file for ${slide.materialType} type.`);
          return;
        }

        handleFilePreview(slideIndex, field, file);
      }
    };

    // Function to remove file
    const removeFile = (slideIndex, field) => {
      // Create a new event-like object to simulate clearing the file input
      if (field === "generalFile") {
        handleSlideChange(slideIndex, field, null);
        setPreviews((prev) => {
          const updatedPreviews = { ...prev };
          delete updatedPreviews[`generalFile-${slideIndex}`];
          return updatedPreviews;
        });
        // Reset the file input
        const fileInput = document.getElementById(
          `general-file-upload-${slideIndex}`
        );
        if (fileInput) fileInput.value = "";
      }
    };

    // Initialize materials array if missing
    if (!Array.isArray(slide.materials)) {
      slide.materials = [];
    }

    const addSlideMaterial = () => {
      const updated = [...slides];
      updated[slideIndex] = {
        ...slide,
        materials: [
          ...(slide.materials || []),
          { id: null, material_type: "", link: "", file: null, existing_file: null, previewUrl: null }
        ]
      };
      updateSlides(updated);
    };

    const updateSlideMaterial = (mIndex, key, value) => {
      const updated = [...slides];
      const materials = [...(slide.materials || [])];
      materials[mIndex] = { ...materials[mIndex], [key]: value };
      if (key === 'material_type') {
        materials[mIndex].file = null;
        materials[mIndex].link = '';
        materials[mIndex].existing_file = null;
        materials[mIndex].previewUrl = null;
      }
      updated[slideIndex] = { ...slide, materials };
      updateSlides(updated);
    };

    const removeSlideMaterial = (mIndex) => {
      const updated = [...slides];
      const materials = [...(slide.materials || [])];
      materials.splice(mIndex, 1);
      updated[slideIndex] = { ...slide, materials };
      updateSlides(updated);
    };

    const handleSlideMaterialFile = (mIndex, file) => {
      if (!file) return;
      const row = slide.materials[mIndex];
      if (!row.material_type) {
        alert('Select material type first');
        return;
      }
      const valid = validateFileType(file.type, file.name, row.material_type);
      if (!valid) {
        alert(`Invalid file for ${row.material_type}`);
        return;
      }
      const updated = [...slides];
      const materials = [...slide.materials];
      materials[mIndex] = { ...materials[mIndex], file, existing_file: null, previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null };
      updated[slideIndex] = { ...slide, materials };
      updateSlides(updated);
    };

    return (
      <div className="space-y-6 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          General Content
        </h2>
        {/* Slide General Materials Schema:
            slides[slideIndex].materials = [
              { material_type, link?, file? }
            ]
            Submission:
              Each file row appended as slide_general[slideIndex][materialIndex]
              JSON embedded into processedSlide.materials array before stringify
              Backend SP loops and inserts rows for slide general.
        */}

        {/* Multi materials section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Materials (Optional)
            </label>
            <button
              type="button"
              onClick={addSlideMaterial}
              className="px-3 py-1 text-sm bg-leafGreen text-white rounded  "
            >
              Add Material
            </button>
          </div>
          {(!slide.materials || slide.materials.length === 0) && (
            <p className="text-xs text-gray-500">
              No materials added for this slide general.
            </p>
          )}
          <div className="space-y-4">
            {slide.materials &&
              slide.materials.map((m, mIndex) => (
                <div
                  key={mIndex}
                  className="border rounded p-3 relative bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => removeSlideMaterial(mIndex)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    title="Remove material"
                  >
                    ×
                  </button>
                  <div className="grid md:grid-cols-5 gap-3 items-start">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type*
                      </label>
                      <select
                        value={m.material_type}
                        onChange={(e) =>
                          updateSlideMaterial(
                            mIndex,
                            "material_type",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded text-sm"
                        required
                      >
                        <option value="">Select</option>
                        {materialTypes.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {m.material_type === "link" ? (
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          URL*
                        </label>
                        <input
                          type="url"
                          value={m.link || ""}
                          onChange={(e) =>
                            updateSlideMaterial(mIndex, "link", e.target.value)
                          }
                          className="w-full p-2 border rounded text-sm"
                          placeholder="https://example.com/resource"
                          required
                        />
                      </div>
                    ) : (
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          File*
                        </label>
                        <input
                          type="file"
                          accept={getAcceptedFileTypes(m.material_type)}
                          onChange={(e) =>
                            handleSlideMaterialFile(mIndex, e.target.files[0])
                          }
                          className="w-full p-2 border rounded text-sm"
                          required
                        />
                        {m.existing_file && !m.file && (
                          <a
                            href={resolveMediaUrl(m.existing_file)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-forestGreen text-xs mt-1 inline-block"
                            onClick={(e) => {
                              const url = resolveMediaUrl(m.existing_file);
                              if (url) {
                                e.preventDefault();
                                window.open(
                                  url,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }
                            }}
                          >
                            Existing File
                          </a>
                        )}
                        {m.previewUrl && (
                          <img
                            src={m.previewUrl}
                            className="h-16 mt-2 rounded border"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Slide general materials array: materials[
            {`{ material_type, link?, file }`}]
          </p>
        </div>

        {/* Programming Language Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Programming Language (Optional)
          </label>
          <select
            value={slide.codeLanguage || ""}
            onChange={(e) =>
              handleSlideChange(slideIndex, "codeLanguage", e.target.value)
            }
            className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
          >
            {codeLanguages.map((cl) => (
              <option key={cl.value} value={cl.value}>
                {cl.label}
              </option>
            ))}
          </select>

          {/* Code Editor */}
          {slide.codeLanguage && (
            <div className="mt-4 grid grid-cols-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code
              </label>
              <CodeMirror
                value={slide.code || ""}
                height="200px"
                extensions={[getLanguageExtension(slide.codeLanguage)]}
                onChange={(value) =>
                  handleSlideChange(slideIndex, "code", value)
                }
                className="border rounded shadow-sm"
                theme="light"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSlideContentForm = (slide, index) => {
    switch (slide.content_type) {
      case "video":
        return renderVideoContent(index);
      // uncomment to add Slide Type Audio
      // case "audio":
      //   return renderAudioContent(index);
      case "accordian":
        return renderAccordianContent(index);
      case "general":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">
          Slides ({slides.length})
        </h3>
      </div>

      {slides &&
        slides.length > 0 &&
        slides.map((slide, index) => (
          <div key={index} className="bg-white rounded-lg">
            {/* Slide header - always visible */}
            <div
              className="py-2 md:p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50"
              onClick={() => toggleSlide(index)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center justify-start w-full">
                  {expandedSlides[index] ? (
                    <ChevronDown className="w-5 h-5 text-gray-700 mr-2" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-700 mr-2" />
                  )}
                  <h3 className="text-md md:text-lg font-semibold text-gray-800">
                    Slide {index + 1}: {slide.title}
                  </h3>
                </div>
                <span className="ml-3 text-sm text-gray-500">
                  {slide.content_type
                    ? `(${slide.content_type
                      .charAt(0)
                      .toUpperCase()}${slide.content_type.slice(1)})`
                    : <p className="hidden md:block">(No content type selected)</p>}
                </span>
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

                {/* Materials Section for each slide - mirror Topics.jsx UI */}
                <div className="w-full bg-gray-50 mt-4">
                  <div className="bg-white w-full">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <span className="block text-sm font-medium text-gray-700 mb-2">Materials</span>
                      <button
                        type="button"
                        onClick={() => addSlideMaterialRow(index)}
                        className="flex items-center gap-2 px-4 py-2 bg-leafGreen text-white rounded-lg   transition-colors font-medium text-sm shadow-sm"
                      >
                        <span className="text-lg">+</span>
                        Add Material
                      </button>
                    </div>

                    {(!slide.materials || slide.materials.length === 0) ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium">No materials added yet</p>
                        <p className="text-sm text-gray-500 mt-1">Click "Add Material" to get started</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 mt-4">
                        {slide.materials.map((m, mIdx) => (
                          <div key={mIdx} className="group relative flex flex-col rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start gap-2 p-3 border-b border-gray-100">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-lightGreen text-forestGreen">M{mIdx + 1}</span>
                                  <select
                                    value={m.material_type || ""}
                                    onChange={(e) => updateSlideMaterialRow(index, mIdx, "material_type", e.target.value)}
                                    className="bg-white border border-gray-300 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                                  >
                                    <option value="">Type</option>
                                    {materialTypes.map((t) => (
                                      <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                  </select>
                                  {m.material_type === "code" && (
                                    <select
                                      value={m.codeLanguage || "python"}
                                      onChange={(e) => updateSlideMaterialRow(index, mIdx, "codeLanguage", e.target.value)}
                                      className="bg-white border border-gray-300 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                                    >
                                      <option value="">Select Language</option>
                                      {codeLanguages.map((lang) => (
                                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                                {m.material_type === "link" && (
                                  <div className="mt-2">
                                    <input
                                      type="url"
                                      value={m.link || ""}
                                      onChange={(e) => updateSlideMaterialRow(index, mIdx, "link", e.target.value)}
                                      placeholder="https://link"
                                      className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <button type="button" onClick={() => removeSlideMaterialRow(index, mIdx)} className="p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition" title="Remove">
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
                                    extensions={[getLanguageExtension(m.codeLanguage || "python")]}
                                    onChange={(value) => updateSlideMaterialRow(index, mIdx, "code", value)}
                                    className="text-xs"
                                  />
                                </div>
                              )}

                              {m.material_type && !["link", "code", ""].includes(m.material_type) && (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition">
                                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <label className="cursor-pointer text-xs font-medium text-forestGreen hover:text-forestGreen">
                                    Upload {m.material_type}
                                    <input
                                      type="file"
                                      onChange={(e) => handleSlideMaterialFile(index, mIdx, e.target.files[0])}
                                      className="hidden"
                                      accept={getAcceptType(m.material_type)}
                                    />
                                  </label>
                                  <p className="mt-1 text-[10px] text-gray-500">
                                    {m.material_type === "pdf" && "PDF only"}
                                    {m.material_type === "image" && "Images up to 10MB"}
                                    {m.material_type === "document" && "DOC/PPT/XLS/TXT/PDF"}
                                  </p>
                                </div>
                              )}

                              {(m.file || m.url) && (
                                <div className="rounded-md bg-gray-50 p-2 border border-gray-200 flex items-center gap-2">
                                  {m.material_type === "image" && (m.file || m.url) ? (
                                    <img
                                      src={m.file ? URL.createObjectURL(m.file) : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${m.url || '/placeholder.png'}`}
                                      className="h-10 w-10 object-cover rounded-md shadow-sm"
                                      alt="preview"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 flex items-center justify-center rounded-md bg-white border">
                                      <Upload className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium text-gray-700 truncate">{m.file ? m.file.name : m.url}</p>
                                    <a href={m.file ? URL.createObjectURL(m.file) : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${m.url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-forestGreen hover:text-forestGreen underline">Open</a>
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



                {(slide.content_type === 'accordian' || slide.content_type === 'general') && <>
                  {/* Completion Type Selection */}
                  <div className="bg-gray-50 md:p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Completion Type*
                    </label>
                    <select
                      name="completion_type"
                      value={slide.slideCompletionType || "audio"}
                      onChange={(e) =>
                        handleSlideChange(
                          index,
                          "slideCompletionType",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                      required={slide.content_type === 'accordian'}
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
                    <div className="bg-gray-50 md:p-4 rounded-lg">
                      <TextToAudioConverter
                        handleFileChange={(e, fieldName) => {
                          const file =
                            e.target.files && e.target.files.length > 0
                              ? e.target.files[0]
                              : null;
                          handleSlideChange(index, "slideAudioFile", file);
                        }}
                        audioPreview={audioPreview[`slideAudioFile-${index}`]}
                        setAudioPreview={(previewUrl) => {
                          setAudioPreview((prev) => ({
                            ...prev,
                            [`slideAudioFile-${index}`]: previewUrl,
                          }));
                        }}
                        isExistingFile={
                          typeof slides[index]?.slideAudioFile === "string" ||
                          slides[index]?.slideAudioFile instanceof File ||
                          !!audioPreview[`slideAudioFile-${index}`]
                        }
                        fieldName={`slideAudioFile-${index}`}
                      />
                      {audioPreview[`slideAudioFile-${index}`] && (
                        <audio
                          src={audioPreview[`slideAudioFile-${index}`]}
                          preload="metadata"
                          className="hidden"
                          onLoadedMetadata={(e) => {
                            const dur = e.currentTarget.duration;
                            const val = secondsToDecimalMinutes(dur);
                            if (!isNaN(val)) {
                              handleSlideChange(index, "audioDuration", val);
                            }
                          }}
                        />
                      )}

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (minutes)*
                        </label>
                        <input
                          type="number"
                          name="audioDuration"
                          min="0"
                          step="0.01"
                          value={slide.audioDuration || ""}
                          onChange={(e) => handleSlideChange(index, "audioDuration", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                          placeholder="Auto-filled when audio is selected or generated"
                          required
                          disabled
                        />
                        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
                          <p className="font-mono text-xs text-slate-700">
                            mm:ss {decimalMinutesToMmSs(slide.audioDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(slide.audioDuration || 0)}
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
                            handleSlideChange(
                              index,
                              "slideCompletionTime",
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
                          value={
                            slide.content_type === "video" && slide.videoType === "youtube"
                              ? "0.00"
                              : slide.slide_extra_duration || "0"
                          }
                          disabled={slide.content_type === "video" && slide.videoType === "youtube"}
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
                          className="w-full p-2 border border-amber-300 rounded focus:ring-amber-500 focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          placeholder="e.g. 1.50"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          {slide.content_type === "video" && slide.videoType === "youtube"
                            ? "Disabled for YouTube videos."
                            : "Optional additional time for this slide"}
                        </p>
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
                            const extra =
                              slide.content_type === "video" && slide.videoType === "youtube"
                                ? 0
                                : parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0));
                            return isNaN(base + extra) ? "0.00" : (base + extra).toFixed(2);
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
                        extra {decimalMinutesToMmSs(slide.content_type === "video" && slide.videoType === "youtube" ? 0 : parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)))} • {decimalMinutesToHhMmSs(slide.content_type === "video" && slide.videoType === "youtube" ? 0 : parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)))}
                      </p>
                      <p className="font-mono text-xs text-amber-900">
                        total {decimalMinutesToMmSs((parseFloat(normalizeLocalMinuteSecondString(slide.slideCompletionType === "timer" ? (slide.slideCompletionTime || slide.slide_duration || 0) : (slide.audioDuration || slide.slide_duration || 0))) || 0) + (slide.content_type === "video" && slide.videoType === "youtube" ? 0 : (parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)) || 0)))} • {decimalMinutesToHhMmSs((parseFloat(normalizeLocalMinuteSecondString(slide.slideCompletionType === "timer" ? (slide.slideCompletionTime || slide.slide_duration || 0) : (slide.audioDuration || slide.slide_duration || 0))) || 0) + (slide.content_type === "video" && slide.videoType === "youtube" ? 0 : (parseFloat(normalizeLocalMinuteSecondString(slide.slide_extra_duration || 0)) || 0)))}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-amber-800 font-medium">
                      Per slide only. Whole topic final duration is shown in the Topic Duration Summary above the form.
                    </p>
                  </div>
                </>}

                {(slide.content_type && slide.content_type !== "general") && (
                  <div className="mt-6 md:p-4 rounded-lg">
                    {renderSlideContentForm(slide, index)}
                  </div>
                )}

                {/* <div className="space-y-4">
                    <div className="flex items-center mb-2">
                      <Tag size={16} className="text-leafGreen mr-2" />
                      <h3 className="text-sm font-medium text-gray-700">
                        Tags and Files
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {slide.tags &&
                        slide.tags.length > 0 &&
                        slide.tags.map((tag, tagIndex) => (
                          <div
                            key={tagIndex}
                            className="p-4  from-blue-50 to-purple-50 rounded-lg border border-leafGreen/20 shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-medium text-gray-700">
                                Tag {tagIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeTag(index, tagIndex)}
                                className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors duration-200"
                                aria-label="Remove tag"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center mb-1">
                                  <Tag
                                    size={14}
                                    className="text-leafGreen mr-1"
                                  />
                                  <label className="text-xs text-gray-600">
                                    Tag Name
                                  </label>
                                </div>
                                <input
                                  type="text"
                                  name="tagName"
                                  value={tag.tagName}
                                  onChange={(e) =>
                                    handleTagChange(
                                      index,
                                      tagIndex,
                                      "tagName",
                                      e
                                    )
                                  }
                                  className="w-full px-3 py-2 bg-white border border-leafGreen/20 rounded-md focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen text-sm transition-all duration-200"
                                  placeholder="Enter tag name"
                                />
                              </div>

                              <div>
                                <div className="flex items-center mb-1">
                                  <Paperclip
                                    size={14}
                                    className="text-leafGreen mr-1"
                                  />
                                  <label className="text-xs text-gray-600">
                                    Attachment
                                  </label>
                                </div>
                                <div className="relative">
                                  <input
                                    type="file"
                                    name="tagFile"
                                    id={`file-${index}-${tagIndex}`}
                                    onChange={(e) =>
                                      handleTagChange(
                                        index,
                                        tagIndex,
                                        "tagFile",
                                        e.target.files[0]
                                      )
                                    }
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor={`file-${index}-${tagIndex}`}
                                    className="flex items-center justify-between w-full px-3 py-2 bg-white border border-dashed border-leafGreen/50 rounded-md cursor-pointer hover:bg-lightGreen transition-colors duration-200 text-sm text-gray-500"
                                  >
                                    <span className="truncate">
                                      {tag.tagFile
                                        ? tag.tagFile.name
                                        : "Choose file"}
                                    </span>
                                    <Upload
                                      size={16}
                                      className="text-purple-500 ml-2"
                                    />
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
                      onClick={() => addTag(index)}
                      className="flex items-center justify-center w-full py-2 mt-2  from-blue-50 to-purple-50 text-leafGreen hover:text-forestGreen rounded-md transition-all duration-200 border border-leafGreen/20 hover:shadow-md"
                    >
                      <Plus size={16} className="mr-1" />
                      <span className="text-sm font-medium">Add Tag</span>
                    </button>
                  </div> */}
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

export default SlideContent;
