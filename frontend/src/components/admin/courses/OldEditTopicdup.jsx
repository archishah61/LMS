/* eslint-disable no-unused-vars */
/* eslint-disable no-case-declarations */
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useGetTopicByIdQuery,
  useUpdateTopicMutation,
} from "../../../services/Course_Management/topicApi";
import { getAdminToken } from "../../../services/CookieService";
import toast from "react-hot-toast";
import { Editor } from "@tinymce/tinymce-react";
import {
  Loader2,
  ChevronDown,
  PlusCircle,
  Trash2,
  MoveUp,
  MoveDown,
  Video,
  Music,
  FileText,
  Plus,
  Upload,
  Paperclip,
  Tag,
  X,
  Type,
  Code,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp"; // Use for both C and C++
import { useSelector } from "react-redux";
import EditAccordianContent from "./EditTopic/EditAccordianContent";
import EditSlideContent from "./EditTopic/EditSlideContent";
import EditSlideAccordianContent from "./EditTopic/EditSlideAccordianContent";
import TextToAudioConverter from "../AIServices/TextToAudioConverter";
export default function EditTopic() {
  const { topicId } = useLocation().state;
  const navigate = useNavigate();
  const { access_token } = useSelector((state) => state.auth);

  const {
    data: topic,
    error,
    isLoading,
  } = useGetTopicByIdQuery({ id: topicId, access_token });

  const [updateTopic, { isLoading: isLoadingUpdate }] =
    useUpdateTopicMutation();
  const { role } = useSelector((state) => state.user);
  const [generalAudioPreview, setGeneralAudioPreview] = useState({});
  const [accordionAudioPreview, setAccordionAudioPreview] = useState({});
  const [videoPreview, setVideoPreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [accordianPreviews, setAccordianPreviews] = useState({});
  const [slidePreviews, setSlidePreviews] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "",
    videoFile: null,
    generalCompletionType: "audio",
    generalCompletionTime: 1,
    generalAudioFile: null,
    videoDuration: "",
    audioFile: null,
    audioDuration: "",
    accordianSections: [
      {
        title: "",
        body: "",
        mediaUrl: [],
        accordianAudioFile: null,
        accordianCompletionType: "audio",
        accordianCompletionTime: 1,
        accordianAudioUrl: "",
        codeLanguage: "",
        code: "",
      },
    ],
    generalFile: null,
    generalDescription: "",
    materialType: "",
    externalLink: "",
    slides: [
      {
        id: "",
        title: "",
        description: "",
        content_type: "",
        videoFile: null,
        slideCompletionType: "audio",
        slideCompletionTime: 1,
        slideAudioFile: null,
        videoDuration: "",
        audioFile: null,
        audioDuration: "",
        accordianSections: [
          {
            id: "",
            title: "",
            body: "",
            mediaUrl: [],
            codeLanguage: "",
            code: "",
          },
        ],
        generalFile: null,
        materialType: "",
        externalLink: "",
      },
    ],
    created_by_type: role,
    updated_by_type: role,
    tags: topic?.topic?.TopicTags?.map((tag) => ({
      id: tag.id,
      tagName: tag.tag || "",
      tagFile: tag.tag_file_path,
      tag_type: tag.tag_file_type || "file",
      codeLanguage: tag.code_language || "",
      existingFile: tag.tag_file_path || null,
    })) || [{ tagName: "", tagFile: null, tag_type: "file", codeLanguage: "" }],
  });

  const contentTypes = [
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
    { value: "accordian", label: "Accordian" },
    { value: "general", label: "General" },
  ];

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

  useEffect(() => {
    if (topic) {
      setFormData({
        title: topic.topic.title || "",
        description: topic.topic.description || "",
        content_type: topic.topic.content_type || "",
        video_type: topic.topic.Video?.video_type,
        videoUrl: topic.topic.Video?.video_type === 'youtube' ? sanitizeYoutubeUrl(topic.topic.Video?.url) : topic.topic.Video?.url || "",
        videoFile: null,
        videoAudioFile: null,
        generalAudioFile: null,
        videoDuration: topic.topic.Video?.duration_minutes || "",
        transcript: topic.topic.Video?.transcript || "",
        bulletPoints: Array.isArray(topic.topic.Video?.bullet_points)
          ? topic.topic.Video.bullet_points
          : [],
        audioFile: null,
        audioDuration: topic.topic.Audio?.duration_minutes || "",
        accordianSections: topic.topic.Accordions?.map((acc) => ({
          id: acc.id,
          title: acc.title || "",
          body: acc.body || "",
          codeLanguage: acc.codeLanguage || "",
          code: acc.code || "",
          accordianCompletionType: acc.completion_type || "audio",
          accordianCompletionTime: acc.completion_time || 0,
          accordianAudioFile: null,
          accordianAudioUrl: acc.audio_url || "",
          mediaUrl: Array.isArray(acc.AccordionAttachments)
            ? acc.AccordionAttachments.map((att) => ({
              url: att.fileUrl,
              fileType: att.fileType,
              isExisting: true,
            }))
            : [], // Empty array as fallback
        })) || [
            {
              title: "",
              body: "",
              mediaUrl: [],
              codeLanguage: "",
              code: "",
              accordianAudioFile: null,
            },
          ],
        generalFile: null,
        generalDescription: topic.topic.GeneralMaterial?.description || "",
        generalCompletionType:
          topic.topic.GeneralMaterial?.completion_type || "audio",
        generalCompletionTime:
          topic.topic.GeneralMaterial?.completion_time || 0,
        materialType: topic.topic.GeneralMaterial?.material_type || "",
        externalLink: topic.topic.GeneralMaterial?.url || "",
        generalCode: topic.topic.GeneralMaterial?.code || "", // ✅ Added
        generalCodeLanguage: topic.topic.GeneralMaterial?.codeLanguage || "", // ✅ Added
        slides: topic.topic.MultiSlides?.map((slide) => ({
          id: slide.id,
          title: slide.title || "",
          description: slide.description || "",
          content_type: slide.type || "",
          videoType: slide.MultiSlideVideos?.[0]?.type || "",
          videoUrl: slide.MultiSlideVideos?.[0]?.url || "",
          videoAudioUrl: slide.MultiSlideVideos?.[0]?.audio_url || "",
          generalAudioUrl: slide.MultiSlideGenerals?.[0]?.audio_url || "",
          slideCompletionType: slide.completion_type || "audio",
          slideCompletionTime: slide.completion_time || 0,
          slideAudioFile: null,
          slideAudioUrl: slide.audio_url || "",
          videoDuration: slide.MultiSlideVideos?.[0]?.duration_minutes || "",
          audioUrl: slide.MultiSlideAudios?.[0]?.url || "",
          audioDuration: slide.MultiSlideAudios?.[0]?.duration_minutes || "",
          accordianSections: slide.MultiSlideAccordions?.map((acc) => ({
            id: acc.id,
            title: acc.title || "",
            body: acc.body || "",
            codeLanguage: acc.codeLanguage || "", // ✅ Added
            code: acc.code || "", // ✅ Added
            mediaUrl: acc.MultiSlideAccordionAttachments
              ? acc.MultiSlideAccordionAttachments.map((att) => ({
                url: att.fileUrl,
                fileType: att.fileType,
                isExisting: true,
              }))
              : [],
          })) || [
              {
                title: "",
                body: "",
                mediaUrl: [],
                codeLanguage: "",
                code: "",
                accordianAudioUrl: "",
              },
            ],
          generalFile: null,
          generalUrl: slide.MultiSlideGenerals?.[0]?.url || "",
          materialType: slide.MultiSlideGenerals?.[0]?.material_type || "",
          externalLink: slide.MultiSlideGenerals?.[0]?.url || "",
          code: slide.MultiSlideGenerals?.[0]?.code || "",
          codeLanguage: slide.MultiSlideGenerals?.[0]?.codeLanguage || "",
        })) || [
            {
              title: "",
              description: "",
              content_type: "",
              videoFile: null,
              videoDuration: "",
              audioFile: null,
              audioDuration: "",
              accordianSections: [
                {
                  id: "",
                  title: "",
                  body: "",
                  mediaUrl: [],
                  codeLanguage: "",
                  code: "",
                },
              ],
              generalFile: null,
              materialType: "",
              externalLink: "",
            },
          ],
        tags: topic.topic.TopicTags?.map((tag) => ({
          id: tag.id,
          tagName: tag.tag || "",
          tagFile: tag.tag_file_path,
          tag_type: tag.tag_file_type || "file",
          codeLanguage: tag.code_language || "",
          existingFile: tag.tag_file_path || null,
        })) || [
            { tagName: "", tagFile: null, tag_type: "file", codeLanguage: "" },
          ], // Initialize tags from topic data
      });
    }
  }, [topic]);

  // Initialize audio preview for edit mode
  useEffect(() => {
    if (topic?.topic.GeneralMaterial?.audio_url && !formData.generalAudioFile) {
      const existingAudioUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.GeneralMaterial.audio_url
        }`;
      setGeneralAudioPreview(existingAudioUrl);
    }
    if (topic?.topic.Audio?.url && !formData.audioFile) {
      const existingAudioUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.Audio.url
        }`;
      setAudioPreview(existingAudioUrl);
    }
    if (topic?.topic.Accordions?.length > 0) {
      topic.topic.Accordions.forEach((acc, index) => {
        if (
          acc.audio_url &&
          !formData.accordianSections.find((section) => section.id === acc.id)
            ?.accordianAudioFile
        ) {
          const existingAudioUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${acc.audio_url
            }`;
          setAccordianPreviews((prev) => ({
            ...prev,
            [`accordianAudioUrl-${index}`]: existingAudioUrl,
          }));
        }
      });
    }
    if (topic?.topic.MultiSlides?.length > 0) {
      topic.topic.MultiSlides.forEach((slide, index) => {
        if (
          slide.audio_url &&
          !formData.slides.find((s) => s.id === slide.id)?.slideAudioFile
        ) {
          const existingAudioUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${slide.audio_url
            }`;
          setSlidePreviews((prev) => ({
            ...prev,
            [`slideAudioFile-${index}`]: existingAudioUrl,
          }));
        }
      });
    }
    if (
      topic?.topic?.MultiSlides?.length > 0 &&
      Array.isArray(formData.slides)
    ) {
      topic.topic.MultiSlides.forEach((slide, index) => {
        const audioUrl = slide.MultiSlideAudios?.[0]?.url;
        const alreadyHasAudio = formData.slides.find(
          (s) => s.id === slide.id
        )?.audioFile;

        if (audioUrl && !alreadyHasAudio) {
          const existingAudioUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL
            }${audioUrl}`;
          setSlidePreviews((prev) => ({
            ...prev,
            [`audioPreview-${index}`]: existingAudioUrl,
          }));
        }
      });
    }

  }, [
    topic,
    formData.generalAudioFile,
    formData.audioFile,
    formData.accordianSections,
    formData.slides,
  ]);

  const [expandedSlides, setExpandedSlides] = useState(
    formData.slides.map((_, index) => index === 0) // Expand only the first slide by default
  );

  const toggleSlide = (index) => {
    const newExpandedSlides = [...expandedSlides];
    newExpandedSlides[index] = !newExpandedSlides[index];
    setExpandedSlides(newExpandedSlides);
  };

  // Add this useEffect hook alongside your other hooks
  useEffect(() => {
    // Reset file input when material type changes
    const fileInput = document.getElementById("general-file-upload");
    if (fileInput) fileInput.value = "";

    // Clear the generalFile in formData if material type changes
    if (formData.materialType) {
      setFormData((prev) => ({
        ...prev,
        generalFile: null,
      }));
    }
  }, [formData.materialType]);

  const addBulletPoint = () => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      bulletPoints: [
        ...prevFormData.bulletPoints,
        { timestamp: "", bullet: "" },
      ],
    }));
  };

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
        return "*/*";
      default:
        return "";
    }
  };

  const handleTagChange = (e, index, field) => {
    const updatedTags = [...formData.tags];

    if (field === "tagFile" && e.target.files?.length > 0) {
      const file = e.target.files[0]; // Get the actual file object
      updatedTags[index] = {
        ...updatedTags[index],
        tagFile: file,
        tag_file_path: file?.name || null,
      };
    } else if (field === "tag_type") {
      updatedTags[index] = {
        ...updatedTags[index],
        [field]: e.target.value,
        tagFile: null,
        tag_file_path: null,
        codeLanguage: null,
      };

      const fileInput = document.querySelector(`#file-${index}`);
      if (fileInput) {
        fileInput.value = "";
      }
    } else {
      updatedTags[index] = {
        ...updatedTags[index],
        [field]: e.target.value,
      };
    }

    setFormData((prev) => ({
      ...prev,
      tags: updatedTags,
    }));
  };

  const addTag = () => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      tags: [
        ...prevFormData.tags,
        {
          tagName: "",
          tagFile: null,
          tag_type: "file",
          codeLanguage: "",
          existingFile: null,
          id: null,
        },
      ],
    }));
  };

  const removeTag = (index) => {
    // Filter out the tag at the specified index
    const newTags = formData.tags.filter((_, i) => i !== index);
    // Update the state with the new tags array
    setFormData({ ...formData, tags: newTags });
  };


  const handleAccordionAudioChange = (
    slideIndex,
    accordianIndex,
    fieldName,
    file
  ) => {
    handleAccordianChange(slideIndex, accordianIndex, fieldName, file); // Call parent function

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAccordionAudioPreview((prev) => ({
        ...prev,
        [`${fieldName}-${slideIndex}-${accordianIndex}`]: previewUrl,
      }));
    }
  };

  const handleBulletPointChange = (e, index, field) => {
    setFormData((prevFormData) => {
      const newBulletPoints = [...prevFormData.bulletPoints];
      newBulletPoints[index] = {
        ...newBulletPoints[index],
        [field]: e.target.value,
      };
      return { ...prevFormData, bulletPoints: newBulletPoints };
    });
  };

  const removeBulletPoint = (index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      bulletPoints: prevFormData.bulletPoints.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target || {};
    if (name === "generalCompletionType") {
      const updatedFormData = { ...formData };
      updatedFormData.generalCompletionType = value;
      if (value === "audio") {
        updatedFormData.generalCompletionTime = 0;
      } else if (value === "timer") {
        // Set default completion time to 1 instead of 0
        updatedFormData.generalCompletionTime = 1;
        updatedFormData.generalAudioFile = null;
        setGeneralAudioPreview(null);
        document.getElementById("general-audio-upload").value = "";
      }
      setFormData(updatedFormData);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };



  const updateSlides = (newSlides) => {
    setFormData((prev) => ({
      ...prev,
      slides: newSlides,
    }));
  };

  const handleEditorChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      description: content,
    }));
  };
  const handleGeneralEditorChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      generalDescription: content,
    }));
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

  const extractYouTubeId = (url) => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Helper function to sanitize YouTube URLs
  const sanitizeYoutubeUrl = (url) => {
    if (!url) return "";

    // Remove any potential /video/ prefix
    if (url.startsWith('/video/')) {
      url = url.substring(7);
    }

    // Make sure URL starts with http:// or https:// 
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('www.') || url.startsWith('youtube.com') || url.startsWith('youtu.be')) {
        url = 'https://' + url;
      }
    }

    return url;
  };

  // ---- Auto-duration helpers (mm.ss) ----
  const computeVideoDurationFromUrl = (src) => {
    return new Promise((resolve, reject) => {
      try {
        const el = document.createElement("video");
        el.preload = "metadata";
        const onLoaded = () => {
          const sec = Number.isFinite(el.duration) ? Math.floor(el.duration) : 0;
          const m = Math.floor(sec / 60);
          const s = sec - m * 60;
          const mmss = parseFloat(`${m}.${String(s).padStart(2, "0")}`);
          cleanup();
          resolve(mmss);
        };
        const onError = () => { cleanup(); reject(new Error("video metadata load failed")); };
        const cleanup = () => {
          el.removeEventListener("loadedmetadata", onLoaded);
          el.removeEventListener("error", onError);
          el.src = "";
        };
        el.addEventListener("loadedmetadata", onLoaded);
        el.addEventListener("error", onError);
        el.src = src;
      } catch (err) {
        reject(err);
      }
    });
  };

  const loadYouTubeIframeAPI = () => {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return;
      }

      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
      };
    });
  };

  const computeYouTubeDuration = async (videoId) => {
    if (!videoId) return null;
    await loadYouTubeIframeAPI();
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.width = "0";
    container.style.height = "0";
    document.body.appendChild(container);
    return new Promise((resolve) => {
      // eslint-disable-next-line no-undef
      const player = new YT.Player(container, {
        height: "0",
        width: "0",
        videoId,
        events: {
          onReady: () => {
            try {
              const dur = player.getDuration();
              const sec = Number.isFinite(dur) ? Math.floor(dur) : 0;
              const m = Math.floor(sec / 60);
              const s = sec - m * 60;
              // Return exact string to avoid float precision drift like +0.01
              const mmss = `${m}.${String(s).padStart(2, "0")}`;
              player.destroy();
              container.remove();
              resolve(mmss);
            } catch (e) {
              try { player.destroy(); } catch { }
              container.remove();
              resolve(null);
            }
          },
          onError: () => {
            try { player.destroy(); } catch { }
            container.remove();
            resolve(null);
          },
        },
      });
    });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (fieldName === "generalFile" && file) {
      const fileType = file.type;
      const fileName = file.name;
      const validFileType = validateFileType(
        fileType,
        fileName,
        formData.materialType
      );

      if (!validFileType) {
        alert(`Please upload a valid file for ${formData.materialType} type.`);
        e.target.value = "";
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [fieldName]: file,
    }));

    // Auto-duration calculations
    if (fieldName === "videoFile" && file) {
      const url = URL.createObjectURL(file);
      computeVideoDurationFromUrl(url)
        .then((mins) => {
          setFormData((prev) => ({ ...prev, videoDuration: mins }));
          URL.revokeObjectURL(url);
        })
        .catch(() => {
          try { URL.revokeObjectURL(url); } catch { }
        });
    }
    if (fieldName === "audioFile" && file) {
      const audioEl = document.createElement('audio');
      audioEl.preload = 'metadata';
      const url = URL.createObjectURL(file);
      audioEl.src = url;
      const onLoaded = () => {
        const sec = Number.isFinite(audioEl.duration) ? Math.floor(audioEl.duration) : 0;
        const m = Math.floor(sec / 60);
        const s = sec - m * 60;
        const mmss = parseFloat(`${m}.${String(s).padStart(2, '0')}`);
        setFormData((prev) => ({ ...prev, audioDuration: mmss }));
        cleanup();
      };
      const onError = () => cleanup();
      const cleanup = () => {
        audioEl.removeEventListener('loadedmetadata', onLoaded);
        audioEl.removeEventListener('error', onError);
        try { URL.revokeObjectURL(url); } catch { }
        audioEl.src = '';
      };
      audioEl.addEventListener('loadedmetadata', onLoaded);
      audioEl.addEventListener('error', onError);
    }
  };

  // Auto-calc for YouTube when URL changes in edit form
  useEffect(() => {
    const type = Array.isArray(formData.video_type) ? formData.video_type[0] : formData.video_type;
    if (type === 'youtube' && formData.videoUrl) {
      const id = extractYouTubeId(sanitizeYoutubeUrl(formData.videoUrl));
      if (!id) return;
      let cancelled = false;
      computeYouTubeDuration(id).then((mins) => {
        if (!cancelled && mins != null) {
          setFormData((prev) => ({ ...prev, videoDuration: mins }));
        }
      });
      return () => { cancelled = true; };
    }
  }, [formData.video_type, formData.videoUrl]);

  // Auto-capture for slide video/audio file and YouTube URL
  useEffect(() => {
    if (!Array.isArray(formData.slides)) return;
    // For each slide, when a File is present, compute durations
    formData.slides.forEach((slide, idx) => {
      // Internal video file
      if (slide.content_type === 'video' && slide.videoFile instanceof File) {
        const url = URL.createObjectURL(slide.videoFile);
        computeVideoDurationFromUrl(url).then((mmss) => {
          setFormData((prev) => {
            const next = { ...prev };
            next.slides = [...prev.slides];
            next.slides[idx] = { ...prev.slides[idx], videoDuration: mmss };
            return next;
          });
          try { URL.revokeObjectURL(url); } catch { }
        }).catch(() => { try { URL.revokeObjectURL(url); } catch { } });
      }

      // Audio file
      if (slide.content_type === 'audio' && slide.audioFile instanceof File) {
        const audioEl = document.createElement('audio');
        audioEl.preload = 'metadata';
        const url = URL.createObjectURL(slide.audioFile);
        audioEl.src = url;
        const onLoaded = () => {
          const sec = Number.isFinite(audioEl.duration) ? Math.floor(audioEl.duration) : 0;
          const m = Math.floor(sec / 60);
          const s = sec - m * 60;
          const mmss = parseFloat(`${m}.${String(s).padStart(2, '0')}`);
          setFormData((prev) => {
            const next = { ...prev };
            next.slides = [...prev.slides];
            next.slides[idx] = { ...prev.slides[idx], audioDuration: mmss };
            return next;
          });
          cleanup();
        };
        const onError = () => cleanup();
        const cleanup = () => {
          audioEl.removeEventListener('loadedmetadata', onLoaded);
          audioEl.removeEventListener('error', onError);
          try { URL.revokeObjectURL(url); } catch { }
          audioEl.src = '';
        };
        audioEl.addEventListener('loadedmetadata', onLoaded);
        audioEl.addEventListener('error', onError);
      }

      // YouTube slide video URL
      if (slide.content_type === 'video' && slide.videoType === 'youtube' && slide.videoUrl) {
        const id = extractYouTubeId(sanitizeYoutubeUrl(slide.videoUrl));
        if (id) {
          computeYouTubeDuration(id).then((mmss) => {
            if (mmss != null) {
              setFormData((prev) => {
                const next = { ...prev };
                next.slides = [...prev.slides];
                next.slides[idx] = { ...prev.slides[idx], videoDuration: mmss };
                return next;
              });
            }
          });
        }
      }
    });
  }, [formData.slides]);

  const handleAccordionChange = (index, field, value) => {
    const updatedSections = [...formData.accordianSections];

    if (
      [
        "title",
        "body",
        "codeLanguage",
        "code",
        "accordianAudioFile",
        "accordianCompletionType",
        "accordianCompletionTime",
      ].includes(field)
    ) {
      if (field === "accordianCompletionType") {
        // Reset completion time when switching to audio type
        if (value === "audio") {
          updatedSections[index].accordianCompletionTime = 0;
        }
        // Reset audio file when switching to time-based completion
        else if (value === "timer") {
          // Set default completion time to 1 instead of 0
          updatedSections[index].accordianCompletionTime = 1;
          updatedSections[index].accordianAudioFile = null;
        }
      }
      updatedSections[index][field] = value;
    } else if (
      field === "showVideo" ||
      field === "showAudio" ||
      field === "showFile"
    ) {
      updatedSections[index][field] = value;
    } else if (
      field === "videoUrl" ||
      field === "audioUrl" ||
      field === "fileUrl"
    ) {
      const mediaUrl = value;

      if (mediaUrl) {
        const fileType =
          field === "videoUrl"
            ? "video"
            : field === "audioUrl"
              ? "audio"
              : "document";

        updatedSections[index].mediaUrl.push({ url: mediaUrl, fileType });
      }
    }

    setFormData((prev) => ({
      ...prev,
      accordianSections: updatedSections,
    }));
  };

  const handleAccordionAttachmentChange = (index, file, fileType) => {
    const updatedSections = [...formData.accordianSections];
    if (!updatedSections[index].mediaUrl) {
      updatedSections[index].mediaUrl = [];
    }
    updatedSections[index].mediaUrl.push({ url: file, fileType });
    setFormData((prev) => ({
      ...prev,
      accordianSections: updatedSections,
    }));
  };

  const handleRemoveAccordionAttachment = (sectionIndex, fileType) => {
    const updatedSections = [...formData.accordianSections];
    if (updatedSections[sectionIndex].mediaUrl) {
      updatedSections[sectionIndex].mediaUrl = updatedSections[
        sectionIndex
      ].mediaUrl.filter((att) => att.fileType !== fileType);
    }
    setFormData((prev) => ({
      ...prev,
      accordianSections: updatedSections,
    }));
  };

  const addAccordionSection = () => {
    setFormData((prev) => ({
      ...prev,
      accordianSections: [
        ...prev.accordianSections,
        {
          title: "",
          body: "",
          mediaUrl: [],
          accordianCompletionType: "audio",
          accordianCompletionTime: 1,
          codeLanguage: "",
          code: "",
        },
      ],
    }));
  };

  const removeAccordionSection = (index) => {
    const updatedSections = formData.accordianSections.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      accordianSections: updatedSections,
    }));
  };

  // Function to remove an accordion section from a specific slide
  const removeSlideAccordionSection = (slideIndex, accordianIndex) => {
    const updatedSlides = [...formData.slides];
    const sections = updatedSlides[slideIndex]?.accordianSections || [];
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      accordianSections: sections.filter((_, i) => i !== accordianIndex),
    };
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleSlideChange = (slideIndex, field, value) => {
    const updatedSlides = [...formData.slides];
    if (field === "slideCompletionType") {
      if (value === "audio") {
        updatedSlides[slideIndex].slideCompletionTime = 0;
      } else if (value === "timer") {
        // Set default completion time to 1 instead of 0
        updatedSlides[slideIndex].slideCompletionTime = 1;
        updatedSlides[slideIndex].slideAudioFile = null;
        setGeneralAudioPreview((prev) => {
          const updatedPreviews = { ...prev };
          delete updatedPreviews[`slideAudioFile-${slideIndex}`];
          return updatedPreviews;
        });
        document.getElementById(`slide-audio-upload-${slideIndex}`).value = "";
      }
    }
    updatedSlides[slideIndex][field] = value;
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleSlideFileChange = (slideIndex, fieldName, file) => {
    const updatedSlides = [...formData.slides];
    updatedSlides[slideIndex][fieldName] = file;
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  // Function to handle video type change (internal vs youtube)
  const handleVideoTypeChange = (index, type) => {
    const updatedSlides = [...formData.slides];

    // Don't allow changing video type for existing slides (ones with an id)
    // if (updatedSlides[index].id) {
    //   console.warn("Cannot change video type for existing slides");
    //   return;
    // }

    if (type === "internal") {
      updatedSlides[index].videoType = "internal";
      updatedSlides[index].videoUrl = "";
    } else {
      updatedSlides[index].videoType = "youtube";
      updatedSlides[index].videoFile = null;
      // Clear video file preview when switching to YouTube
      setSlidePreviews((prev) => {
        const updated = { ...prev };
        delete updated[`videoPreview-${index}`];
        return updated;
      });

      // Clear the file input
      const fileInput = document.getElementById(`video-upload-${index}`);
      if (fileInput) fileInput.value = "";
    }

    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleSlideAccordionChange = (
    slideIndex,
    accordianIndex,
    field,
    value
  ) => {
    setFormData((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        accordianSections: updatedSlides[slideIndex].accordianSections.map(
          (section, idx) =>
            idx === accordianIndex ? { ...section, [field]: value } : section
        ),
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const handleAccordianChange = (slideIndex, accordianIndex, field, value) => {
    const updatedSlides = [...formData.slides];
    const newSections = [...updatedSlides[slideIndex].accordianSections];
    const currentSection = { ...newSections[accordianIndex] }; // create copy

    if (field === "title" || field === "body") {
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

    newSections[accordianIndex] = currentSection; //assign modified copy
    updatedSlides[slideIndex].accordianSections = newSections;
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleSlideAccordionFileChange = (
    slideIndex,
    accordianIndex,
    field,
    value
  ) => {
    const updatedSlides = [...formData.slides];
    const newSections = [...updatedSlides[slideIndex].accordianSections];
    const currentSection = { ...newSections[accordianIndex] }; // create copy

    if (field === "title" || field === "body") {
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

    newSections[accordianIndex] = currentSection; //assign modified copy
    updatedSlides[slideIndex].accordianSections = newSections;
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleSlideAccordionAttachmentChange = (
    slideIndex,
    accordianIndex,
    file,
    fileType
  ) => {
    const updatedSlides = [...formData.slides];
    const updatedAccordianSections = [
      ...updatedSlides[slideIndex].accordianSections,
    ];
    if (!updatedAccordianSections[accordianIndex].mediaUrl) {
      updatedAccordianSections[accordianIndex].mediaUrl = [];
    }
    updatedAccordianSections[accordianIndex].mediaUrl.push({
      url: file,
      fileType,
    });
    updatedSlides[slideIndex].accordianSections = updatedAccordianSections;
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleRemoveSlideAccordionAttachment = (
    slideIndex,
    accordianIndex,
    fileType
  ) => {
    const updatedSlides = [...formData.slides];
    const updatedAccordianSections = [
      ...updatedSlides[slideIndex].accordianSections,
    ];
    if (updatedAccordianSections[accordianIndex].mediaUrl) {
      updatedAccordianSections[accordianIndex].mediaUrl =
        updatedAccordianSections[accordianIndex].mediaUrl.filter(
          (att) => att.fileType !== fileType
        );
    }
    updatedSlides[slideIndex].accordianSections = updatedAccordianSections;
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const addSlideAccordionSection = (slideIndex) => {
    const updatedSlides = [...formData.slides];
    updatedSlides[slideIndex].accordianSections.push({
      title: "",
      body: "",
      mediaUrl: [],
    });
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleAudioFileChangeForGeneral = (e, fieldName) => {
    handleFileChange(e, fieldName);

    // If a new file is selected, update preview
    if (e.target.files && e.target.files[0]) {
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setGeneralAudioPreview(previewUrl);
    } else if (!e.target.files || e.target.files.length === 0) {
      // If file is cleared, reset to existing audio if available
      if (topic?.topic.GeneralMaterial?.audio_url) {
        const existingAudioUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.GeneralMaterial.audio_url
          }`;
        setGeneralAudioPreview(existingAudioUrl);
      } else {
        setGeneralAudioPreview(null);
      }
    }
  };

  const handleAudioFileChangeForAudio = (e, fieldName) => {
    handleFileChange(e, fieldName);

    // If a new file is selected, update preview
    if (e.target.files && e.target.files[0]) {
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setAudioPreview(previewUrl);
    } else if (!e.target.files || e.target.files.length === 0) {
      // If file is cleared, reset to existing audio if available
      if (topic?.topic.Audio?.url) {
        const existingAudioUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.Audio.url
          }`;
        setAudioPreview(existingAudioUrl);
      } else {
        setAudioPreview(null);
      }
    }
  };

  const addSlide = () => {
    setFormData((prev) => ({
      ...prev,
      slides: [
        ...prev.slides,
        {
          title: "",
          description: "",
          content_type: "",
          videoFile: null,
          videoDuration: "",
          audioFile: null,
          audioDuration: "",
          accordianSections: [
            { title: "", body: "", mediaUrl: [], codeLanguage: "", code: "" },
          ],
          generalFile: null,
          materialType: "",
          externalLink: "",
        },
      ],
    }));
  };

  const removeSlide = (index) => {
    if (formData.slides.length > 1) {
      setFormData((prev) => ({
        ...prev,
        slides: prev.slides.filter((_, i) => i !== index),
      }));
      setAccordionAudioPreview((prev) => {
        const updatedAccordionAudioPreviews = { ...prev };
        Object.keys(prev).forEach((key) => {
          if (key.startsWith(`slideAccordionAudioUrls-${index}`)) {
            delete updatedAccordionAudioPreviews[key];
          }
        });
        return updatedAccordionAudioPreviews;
      });
    }
  };

  const moveSlide = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.slides.length - 1)
    ) {
      return;
    }

    const updatedSlides = [...formData.slides];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updatedSlides[index], updatedSlides[newIndex]] = [
      updatedSlides[newIndex],
      updatedSlides[index],
    ];
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleSlideContentTypeChange = (slideIndex, contentType) => {
    const updatedSlides = [...formData.slides];
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      content_type: contentType,
      videoFile: null,
      videoUrl: "",
      audioUrl: "",
      generalUrl: "",
      videoDuration: "",
      audioFile: null,
      audioDuration: "",
      accordianSections: [
        {
          id: "",
          title: "",
          body: "",
          mediaUrl: [],
          codeLanguage: "",
          code: "",
        },
      ],
      generalFile: null,
      materialType: "",
      externalLink: "",
    };
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleSlideEditorChange = (slideIndex, content) => {
    const updatedSlides = [...formData.slides];
    updatedSlides[slideIndex].description = content;
    setFormData((prev) => ({
      ...prev,
      slides: updatedSlides,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();

    Object.keys(formData).forEach((key) => {
      if (
        formData[key] &&
        ![
          "videoFile",
          "generalAudioFile",
          "audioFile",
          "generalFile",
          "accordianSections",
          "slides",
          "tags",
          // Exclude these fields to prevent duplication as they'll be handled in the switch statement
          "video_type",
          "videoUrl",
          "content",
        ].includes(key)
      ) {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (formData.tags) {
      formData.tags.forEach((tag, index) => {
        if (tag.tagFile) {
          formDataToSend.append(`tagFile[${index}]`, tag.tagFile);
        }
      });
      // Always send tags, even if it's an empty array
      formDataToSend.append(
        "tags",
        JSON.stringify(
          formData.tags.map((tag) => ({
            id: tag.id || null,
            tagName: tag.tagName,
            tagFile: tag.tagFile ? tag.tagFile.name : null,
            existingFile: tag.existingFile,
            tag_type: tag.tag_type || "file",
            codeLanguage: tag.tag_type === "code" ? tag.codeLanguage : null,
          }))
        )
      );
    }

    switch (formData.content_type) {
      case "video":
        // Handle different video types correctly
        // Check if video_type is an array or a string that equals 'youtube'
        const videoType = Array.isArray(formData.video_type)
          ? formData.video_type[0]
          : formData.video_type;

        if (videoType === 'youtube') {
          // For YouTube videos, send the URL as a string value
          formDataToSend.append("video_type", "youtube");

          // Handle videoUrl if it's an array
          let youtubeUrl = Array.isArray(formData.videoUrl)
            ? formData.videoUrl[0]
            : formData.videoUrl;

          // Sanitize YouTube URL to ensure proper format
          youtubeUrl = sanitizeYoutubeUrl(youtubeUrl);

          // If this is a new submission and no URL is provided, show error
          if (!youtubeUrl && !topicId) {
            toast.error("Please enter a YouTube URL");
            return;
          }

          // For editing, always use either the new URL or the existing one
          // Without any validation to prevent form submission
          const urlToUse = youtubeUrl || sanitizeYoutubeUrl(topic?.topic?.Video?.url) || "";

          // Ensure we're sending a properly formatted YouTube URL
          formDataToSend.append("videoUrl", urlToUse);
        } else {
          // For internal videos, send the file
          formDataToSend.append("video_type", "internal");
          formDataToSend.append("videoUrl", formData.videoFile);
        }

        // For both video types, include these fields
        formDataToSend.append(
          "content[duration_minutes]",
          formData.videoDuration
        );
        formDataToSend.append("content[transcript]", formData.transcript);
        formDataToSend.append(
          "content[bullet_points]",
          Array.isArray(formData.bulletPoints)
            ? JSON.stringify(formData.bulletPoints)
            : "[]"
        );

        // Add the videoUrl to content object only once
        if (videoType === 'youtube') {
          // Use the same handling for array as above to ensure consistency
          let youtubeUrl = Array.isArray(formData.videoUrl)
            ? formData.videoUrl[0]
            : formData.videoUrl;

          // Sanitize the URL for consistency
          youtubeUrl = sanitizeYoutubeUrl(youtubeUrl);

          // For consistency, use the same URL we determined above
          const urlToUse = youtubeUrl || sanitizeYoutubeUrl(topic?.topic?.Video?.url) || "";
          formDataToSend.append("content[videoUrl]", urlToUse);
        }
        break;

      case "audio":
        formDataToSend.append("audioUrl", formData.audioFile);
        formDataToSend.append(
          "content[duration_minutes]",
          formData.audioDuration
        );
        break;

      case "accordian":
        const processedAccordianSections = formData.accordianSections.map((section, sectionIndex) => {
          const processedSection = { ...section };
          // Remove id if it's not a valid number (i.e., for new sections)
          if (!processedSection.id || isNaN(Number(processedSection.id))) {
            delete processedSection.id;
          }
          // Map accordianCompletionType to completion_type for backend
          const processedMedia = (section.mediaUrl || []).map(
            (media, mediaIndex) => {
              if (media.url instanceof File) {
                formDataToSend.append(
                  `accordionAttachment[${sectionIndex}][${mediaIndex}]`,
                  media.url
                );
                return { url: "", fileType: media.fileType };
              }
              return { url: media.url, fileType: media.fileType };
            }
          );

          if (processedSection.accordianAudioFile) {
            formDataToSend.append(
              `accordionAudioUrls[${sectionIndex}]`,
              processedSection.accordianAudioFile
            );
            processedSection.index = sectionIndex;
          }
          return { ...processedSection, mediaUrl: processedMedia };
        });
        formDataToSend.append(
          "content",
          JSON.stringify(processedAccordianSections)
        );
        break;

      case "general":
        formDataToSend.append("content[material_type]", formData.materialType);
        formDataToSend.append("content[description]", formData.generalDescription);
        formDataToSend.append("content[code]", formData.generalCode);
        formDataToSend.append("content[completion_type]", formData.generalCompletionType || "audio");
        if (formData.generalCompletionType === "timer" && formData.generalCompletionTime) {
          formDataToSend.append("content[completion_time]", formData.generalCompletionTime);
        }
        if (formData.generalCompletionType === "audio") {
          formDataToSend.append("generalAudioUrl", formData.generalAudioFile);
        }
        formDataToSend.append("content[codeLanguage]", formData.generalCodeLanguage);
        if (formData.materialType !== "link") {
          formDataToSend.append("generalMaterial", formData.generalFile);
        } else {
          formDataToSend.append("content[url]", formData.externalLink);
        }
        break;

      case "slide":
        const processedSlides = formData.slides.map((slide, slideIndex) => {
          const processedSlide = { ...slide };
          switch (slide.content_type) {
            case "video":
              // Add videoType property to the slide data
              processedSlide.videoType = slide.videoType || "internal";

              if (slide.videoType === "youtube") {
                // For YouTube videos, just keep the URL
                processedSlide.videoUrl = slide.videoUrl || "";
              } else if (slide.videoFile instanceof File) {
                // For internal videos with a file
                processedSlide.videoUrl = "";
                formDataToSend.append(
                  `slide_video[${slideIndex}]`,
                  slide.videoFile
                );
              }
              break;
            case "audio":
              if (slide.audioFile instanceof File) {
                processedSlide.audioUrl = "";
                formDataToSend.append(`slide_audio[${slideIndex}]`, slide.audioFile);
              }
              break;
            case "general":

              formDataToSend.append(
                `slide_general_material_type_${slideIndex}`,
                slide.materialType
              );
              if (slide.generalFile instanceof File) {
                // Create a new File object with a modified name that includes the slide index
                const fileWithIndex = new File(
                  [slide.generalFile],
                  `slide_${slideIndex}_${slide.generalFile.name}`,
                  { type: slide.generalFile.type }
                );
                // Append the file with the modified name
                formDataToSend.append(
                  `slide_general[${slideIndex}]`,
                  fileWithIndex
                );
                processedSlide.generalUrl = "";
              }

              if (slide.materialType == "link") {
                processedSlide.generalUrl = "";
                formDataToSend.append(`slide_url`, slide.externalLink);
              }

              formDataToSend.append(`slide_code`, slide.generalCode || ""); // ✅ Added
              formDataToSend.append(
                `slide_codeLanguage`,
                slide.generalCodeLanguage || ""
              ); // ✅ Added

              break;
            case "accordian":
              processedSlide.accordianSections =
                processedSlide.accordianSections.map(
                  (section, sectionIndex) => {
                    const processedSection = { ...section };
                    const processedMedia = (section.mediaUrl || []).map(
                      (media, mediaIndex) => {
                        if (media.url instanceof File) {
                          formDataToSend.append(
                            `multislideAccordionAttachment[${slideIndex}][${sectionIndex}][${mediaIndex}]`,
                            media.url
                          );
                          return { url: "", fileType: media.fileType };
                        }
                        return { url: media.url, fileType: media.fileType };
                      }
                    );

                    // return { ...section, mediaUrl: processedMedia };
                    return {
                      ...processedSection,
                      mediaUrl: processedMedia,
                      codeLanguage: section.codeLanguage || "", // ✅ Ensure code language is included
                      code: section.code || "", // ✅ Ensure code is included
                    };
                  }
                );
              break;
          }

          if (slide.slideCompletionType === "audio" && slide.slideAudioFile) {
            formDataToSend.append(
              `slideAudioUrl[${slideIndex}]`,
              slide.slideAudioFile
            );
          }

          processedSlide.index = slideIndex;
          return processedSlide;
        });
        formDataToSend.append("content", JSON.stringify(processedSlides));
        break;
    }

    try {
      await updateTopic({
        id: topicId,
        formData: formDataToSend,
        access_token,
      }).unwrap();

      toast.success("Topic updated successfully!");
      setTimeout(() => navigate(-1), 500);
    } catch (error) {
      console.error("Error updating topic:", error);
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'An unexpected error occurred';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        Failed to load topic details
      </div>
    );
  }

  const renderSlideContentForm = (slide, index) => {
    switch (slide.content_type) {
      case "video":
        return (
          <div className="space-y-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Video Content
            </h2>

            {/* Video Type Selection - Only editable for new slides (without an id) */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {/* {!slide.id ? "Video Type*" : "Video Type* (Cannot be changed after creation)"} */}
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name={`video-type-${index}`}
                    id={`internal-video-${index}`}
                    checked={slide.videoType === "internal"}
                    onChange={() => handleVideoTypeChange(index, "internal")}
                    // disabled={!!slide.id}
                    className={`h-4 w-4 border-gray-300 rounded focus:ring-blue-500 ${!slide.id ? "accent-leafGreen" : "text-gray-400 cursor-not-allowed"
                      }`}
                  />
                  <label
                    htmlFor={`internal-video-${index}`}
                    className={`ml-2 text-sm ${!slide.id ? "text-gray-700" : "text-gray-500"}`}
                  >
                    Internal Video
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    name={`video-type-${index}`}
                    id={`youtube-video-${index}`}
                    checked={slide.videoType === "youtube"}
                    onChange={() => handleVideoTypeChange(index, "youtube")}
                    // disabled={!!slide.id}
                    className={`h-4 w-4 border-gray-300 rounded focus:ring-blue-500 ${!slide.id ? "accent-leafGreen" : "text-gray-400 cursor-not-allowed"
                      }`}
                  />
                  <label
                    htmlFor={`youtube-video-${index}`}
                    className={`ml-2 text-sm ${!slide.id ? "text-gray-700" : "text-gray-500"}`}
                  >
                    YouTube Video
                  </label>
                </div>
              </div>


              {/* {slide.id && (
                <p className="text-xs text-amber-600 mt-1">
                  You cannot change the video type (internal/YouTube) after creation.
                </p>
              )} */}
            </div>

            {slide.videoType !== "youtube" ? (
              <div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video File*
                  </label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <input
                        id={`video-upload-${index}`}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          handleSlideFileChange(
                            index,
                            "videoFile",
                            e.target.files[0]
                          );
                          if (e.target.files[0]) {
                            const previewUrl = URL.createObjectURL(
                              e.target.files[0]
                            );
                            setSlidePreviews((prev) => ({
                              ...prev,
                              [`videoPreview-${index}`]: previewUrl,
                            }));
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    {slidePreviews[`videoPreview-${index}`] && (
                      <div className="mt-3 flex flex-col items-center">
                        <div className="relative w-full max-w-md">
                          <video
                            src={slidePreviews[`videoPreview-${index}`]}
                            controls
                            className="w-full rounded-lg border border-blue-200 shadow-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleSlideFileChange(index, "videoFile", null);
                              setSlidePreviews((prev) => {
                                const updatedPreviews = { ...prev };
                                delete updatedPreviews[`videoPreview-${index}`];
                                return updatedPreviews;
                              });
                              document.getElementById(
                                `video-upload-${index}`
                              ).value = "";
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                            title="Remove video"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {!slidePreviews[`videoPreview-${index}`] &&
                      slide.videoUrl && (
                        <div className="mt-3 flex flex-col items-center">
                          <div className="relative w-full max-w-md">
                            <video
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${slide.videoUrl
                                }`}
                              controls
                              className="w-full rounded-lg border border-blue-200 shadow-md object-cover"
                            />
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Video Duration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)*
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={slide.videoDuration || ""}
                    onChange={(e) =>
                      handleSlideChange(index, "videoDuration", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter duration in minutes"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube URL*
                  </label>
                  <input
                    type="text"
                    value={slide.videoUrl || ""}
                    onChange={(e) =>
                      handleSlideChange(index, "videoUrl", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter YouTube video URL"
                  />
                </div>

                {slide.videoUrl && (
                  <div className="grid grid-cols-1 sm:min-h-[315px]">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(
                        slide.videoUrl
                      )}`}
                      title="YouTube video"
                      frameBorder="0"
                      allowFullScreen
                      className="w-full h-full rounded-lg shadow-md"
                    ></iframe>
                  </div>
                )}

                {/* Video Duration - Added for YouTube videos */}
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)*
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={slide.videoDuration || ""}
                    onChange={(e) =>
                      handleSlideChange(index, "videoDuration", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter duration in minutes"
                    required
                  />
                </div>
              </div>
            )}
            {/* Video Upload */}
          </div>
        );
      case "audio":
        return (
          <div className="space-y-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Audio Content
            </h2>

            {/* Audio Upload using TextToAudioConverter */}
            <TextToAudioConverter
              handleFileChange={(e, fieldName) => {
                handleSlideFileChange(index, "audioFile", e.target.files[0]);
              }}
              audioPreview={slidePreviews[`audioPreview-${index}`]}
              setAudioPreview={(previewUrl) => {
                setSlidePreviews((prev) => ({
                  ...prev,
                  [`audioPreview-${index}`]: previewUrl,
                }));
              }}
              fieldName={`audioFile-${index}`}
              isExistingFile={slide.audioUrl && !slide.audioFile}
              existingFileUrl={
                slide.audioUrl
                  ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${slide.audioUrl}`
                  : null
              }
            />

            {/* Audio Duration */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)*
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={slide.audioDuration || ""}
                onChange={(e) =>
                  handleSlideChange(index, "audioDuration", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter duration in minutes"
                required
              />
            </div>
          </div>
        );
      case "accordian":
        return (
          <EditSlideAccordianContent
            slide={slide}
            slideIndex={index}
            handleSlideAccordionChange={handleSlideAccordionChange}
            handleSlideAccordionFileChange={handleSlideAccordionFileChange}
            addSlideAccordionSection={addSlideAccordionSection}
            removeSlideAccordionSection={removeSlideAccordionSection}
            setFormData={setFormData}
            completionTypes={completionTypes}
          />
        );
      case "general":
        return (
          <div className="space-y-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              General Content
            </h2>

            {/* Material Type Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material Type*
              </label>
              <select
                value={slide.materialType}
                onChange={(e) =>
                  handleSlideChange(index, "materialType", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Material Type</option>
                {materialTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional Rendering based on Material Type */}
            {slide.materialType && (
              <div className="bg-gray-50 p-4 rounded-lg">
                {slide.materialType === "link" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      External Link*
                    </label>
                    <input
                      type="url"
                      value={slide.externalLink || ""}
                      onChange={(e) =>
                        handleSlideChange(index, "externalLink", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload File* ({slide.materialType})
                    </label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <input
                          id={`general-upload-${index}`}
                          type="file"
                          accept={
                            getAcceptedFileTypes
                              ? getAcceptedFileTypes(slide.materialType)
                              : ""
                          }
                          onChange={(e) => {
                            handleSlideFileChange(
                              index,
                              "generalFile",
                              e.target.files[0]
                            );
                            if (e.target.files[0]) {
                              const previewUrl = URL.createObjectURL(
                                e.target.files[0]
                              );
                              setSlidePreviews((prev) => ({
                                ...prev,
                                [`generalPreview-${index}`]: previewUrl,
                              }));
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          required={
                            slide.materialType !==
                            formData.slides[index].materialType
                          }
                        />
                      </div>

                      {/* Show Preview */}
                      {slidePreviews[`generalPreview-${index}`] ? (
                        <div className="mt-3 flex flex-col items-center">
                          <div className="relative w-full max-w-md">
                            {slide.materialType === "image" ? (
                              <img
                                src={slidePreviews[`generalPreview-${index}`]}
                                alt="Preview"
                                className="w-full rounded-lg border border-blue-200 shadow-md object-cover"
                              />
                            ) : (
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-md text-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-10 w-10 mx-auto text-blue-500"
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
                                <a
                                  href={
                                    slidePreviews[`generalPreview-${index}`]
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 block text-blue-600 font-medium hover:underline"
                                >
                                  View File
                                </a>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                handleSlideFileChange(
                                  index,
                                  "generalFile",
                                  null
                                );
                                setSlidePreviews((prev) => {
                                  const updatedPreviews = { ...prev };
                                  delete updatedPreviews[
                                    `generalPreview-${index}`
                                  ];
                                  return updatedPreviews;
                                });
                                document.getElementById(
                                  `general-upload-${index}`
                                ).value = "";
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                              title="Remove file"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        slide.generalUrl && (
                          <div className="mt-3 flex flex-col items-center">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-md text-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 mx-auto text-blue-500"
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
                              <a
                                href={`${import.meta.env.VITE_BACKEND_MEDIA_URL
                                  }${slide.generalUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 block text-blue-600 font-medium hover:underline"
                              >
                                {slide.generalUrl.split("/").pop()}
                              </a>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Programming Language Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programming Language (Optional)
              </label>
              <select
                value={slide.codeLanguage || ""}
                onChange={(e) =>
                  handleSlideChange(index, "codeLanguage", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Language</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
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
                    extensions={[
                      slide.codeLanguage === "javascript"
                        ? javascript()
                        : slide.codeLanguage === "python"
                          ? python()
                          : slide.codeLanguage === "java"
                            ? java()
                            : slide.codeLanguage === "cpp" ||
                              slide.codeLanguage === "c"
                              ? cpp()
                              : [],
                    ]}
                    onChange={(value) =>
                      handleSlideChange(index, "code", value)
                    }
                    className="border border-gray-300 rounded"
                    theme="light"
                  />
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 mx-10">
      <header className="bg-white border-b border-purple-100 p-6 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Edit Topic
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
        >
          Back
        </button>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-lg border border-purple-100 transform transition-all duration-300 hover:shadow-xl"
        >
          <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Topic Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 hover:shadow-md"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center mb-2">
                <Tag size={16} className="text-purple-600 mr-2" />
                <h3 className="text-sm font-medium text-gray-700">
                  Tags and Files
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Tag {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors duration-200"
                        aria-label="Remove tag"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center mb-1">
                          <Tag size={14} className="text-purple-600 mr-1" />
                          <label className="text-xs text-gray-600">
                            Tag Name
                          </label>
                        </div>
                        <input
                          type="text"
                          name="tagName"
                          value={tag.tagName}
                          onChange={(e) => handleTagChange(e, index, "tagName")}
                          className="w-full px-3 py-2 bg-white border border-purple-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-all duration-200"
                          placeholder="Enter tag name"
                        />
                      </div>

                      <div>
                        <div className="flex items-center mb-1">
                          <Type size={14} className="text-purple-600 mr-1" />
                          <label className="text-xs text-gray-600">
                            Tag Type
                          </label>
                        </div>
                        <select
                          value={tag.tag_type}
                          onChange={(e) =>
                            handleTagChange(e, index, "tag_type")
                          }
                          className="w-full px-3 py-2 bg-white border border-purple-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-all duration-200"
                        >
                          <option value="file">File</option>
                          <option value="code">Code</option>
                        </select>
                      </div>

                      {tag.tag_type === "code" ? (
                        <div>
                          <div className="flex items-center mb-1">
                            <Code size={14} className="text-purple-600 mr-1" />
                            <label className="text-xs text-gray-600">
                              Programming Language
                            </label>
                          </div>
                          <select
                            value={tag.codeLanguage || ""}
                            onChange={(e) =>
                              handleTagChange(e, index, "codeLanguage")
                            }
                            className="w-full px-3 py-2 bg-white border border-purple-100 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-all duration-200 mb-2"
                          >
                            <option value="">Select Language</option>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="c">C</option>
                          </select>
                          <div>
                            <div className="flex items-center mb-1">
                              <Code
                                size={14}
                                className="text-purple-600 mr-1"
                              />
                              <label className="text-xs text-gray-600">
                                Code
                              </label>
                            </div>
                            <CodeMirror
                              value={tag.tagFile || ""}
                              height="200px"
                              extensions={[
                                tag.codeLanguage === "javascript"
                                  ? javascript()
                                  : tag.codeLanguage === "python"
                                    ? python()
                                    : tag.codeLanguage === "java"
                                      ? java()
                                      : tag.codeLanguage === "cpp" ||
                                        tag.codeLanguage === "c"
                                        ? cpp()
                                        : [],
                              ]}
                              onChange={(value) =>
                                handleTagChange(
                                  { target: { value } },
                                  index,
                                  "tagFile"
                                )
                              }
                              className="border border-purple-100 rounded"
                              theme="light"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center mb-1">
                            <Paperclip
                              size={14}
                              className="text-purple-600 mr-1"
                            />
                            <label className="text-xs text-gray-600">
                              Attachment
                            </label>
                          </div>
                          <div className="relative">
                            <input
                              type="file"
                              name="tagFile"
                              id={`file-${index}`}
                              onChange={(e) =>
                                handleTagChange(e, index, "tagFile")
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor={`file-${index}`}
                              className="flex items-center justify-between w-full px-3 py-2 bg-white border border-dashed border-purple-300 rounded-md cursor-pointer hover:bg-purple-50 transition-colors duration-200 text-sm text-gray-500"
                            >
                              <span className="truncate">
                                {tag.tagFile
                                  ? ` ${tag.tagFile}`
                                  : tag.existingFile
                                    ? ` ${tag.existingFile.split("/").pop()}`
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
                          {tag.existingFile && tag.tagFile && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 truncate">
                                Existing: {tag.existingFile.split("/").pop()}
                              </p>
                              <a
                                href={`${import.meta.env.VITE_BACKEND_MEDIA_URL
                                  }${tag.existingFile}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                              >
                                View File
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addTag}
                className="flex items-center justify-center w-full py-2 mt-2 bg-gradient-to-r from-blue-50 to-purple-50 text-purple-600 hover:text-purple-700 rounded-md transition-all duration-200 border border-purple-100 hover:shadow-md"
              >
                <Plus size={16} className="mr-1" />
                <span className="text-sm font-medium">Add Tag</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Editor
                apiKey={import.meta.env.VITE_TINYMCE_API}
                value={formData.description}
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

            {formData.content_type === "video" && (
              <div className="space-y-6 p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Video Content
                </h2>

                {/* Video Type Selection - Disabled in Edit mode */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Type* (Cannot be changed after creation)
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="internal-video"
                        checked={formData.video_type === "internal"}
                        disabled={true}
                        className="h-4 w-4 accent-leafGreen border-gray-300 rounded focus:ring-blue-500 cursor-not-allowed opacity-60"
                      />
                      <label htmlFor="internal-video" className="ml-2 text-sm text-gray-700">
                        Internal Video
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="youtube-video"
                        checked={formData.video_type === "youtube"}
                        disabled={true}
                        className="h-4 w-4 accent-leafGreen border-gray-300 rounded focus:ring-blue-500 cursor-not-allowed opacity-60"
                      />
                      <label htmlFor="youtube-video" className="ml-2 text-sm text-gray-700">
                        YouTube Video
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    <i className="fas fa-info-circle mr-1"></i>
                    You cannot change the video type (internal/YouTube) after creation.
                  </p>
                </div>

                {/* Video Upload or YouTube URL */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.video_type === "internal"
                      ? "Video File*"
                      : "YouTube URL*"}
                  </label>

                  {formData.video_type === "internal" ? (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <input
                          id="video-upload"
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            handleFileChange(e, "videoFile");
                            if (e.target.files[0]) {
                              const previewUrl = URL.createObjectURL(
                                e.target.files[0]
                              );
                              setVideoPreview(previewUrl);
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>

                      {videoPreview && (
                        <div className="mt-3 flex flex-col items-center">
                          <div className="relative w-full max-w-md">
                            <video
                              src={videoPreview}
                              controls
                              className="w-full rounded-lg border border-blue-200 shadow-md object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setVideoPreview(null);
                                const clearEvent = {
                                  target: {
                                    files: [],
                                    value: null,
                                  },
                                };
                                handleFileChange(clearEvent, "videoFile");
                                document.getElementById("video-upload").value =
                                  "";
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                              title="Remove video"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      {!videoPreview && topic?.topic.Video?.url && (
                        <div className="mt-3 flex flex-col items-center">
                          <div className="relative w-full max-w-md">
                            <video
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.Video.url
                                }`}
                              controls
                              className="w-full rounded-lg border border-blue-200 shadow-md object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <input
                        type="text"
                        name="videoUrl"
                        placeholder="Enter YouTube video URL"
                        value={formData.videoUrl || ''}
                        onChange={(e) => {
                          // Use regular handleChange but ensure it's treated as a simple string value
                          handleChange(e);
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />

                      {formData.videoUrl && (
                        <div className="grid grid-cols-1 sm:min-h-[315px]">
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYouTubeId(
                              formData.videoUrl
                            )}`}
                            title="YouTube video"
                            frameBorder="0"
                            allowFullScreen
                            className="w-full h-full rounded-lg shadow-md"
                          ></iframe>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Video Duration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)*
                  </label>
                  <input
                    type="number"
                    name="videoDuration"
                    min="0"
                    step="0.01"
                    value={formData.videoDuration}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Auto-filled from file or YouTube; you can adjust"
                    required
                  />
                </div>
              </div>
            )}

            {formData.content_type === "accordian" && (
              <EditAccordianContent
                formData={formData}
                accordianPreviews={accordianPreviews}
                setAccordianPreviews={setAccordianPreviews}
                handleAccordionChange={handleAccordionChange}
                addAccordionSection={addAccordionSection}
                removeAccordionSection={removeAccordionSection}
                setFormData={setFormData}
                completionTypes={completionTypes}
              />
            )}

            {formData.content_type === "audio" && (
              <div className="space-y-6 p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Audio Content
                </h2>

                {/* Audio Upload/Text-to-Speech Section - Using TextToAudioConverter */}
                <TextToAudioConverter
                  handleFileChange={handleAudioFileChangeForAudio}
                  audioPreview={audioPreview}
                  setAudioPreview={setAudioPreview}
                  fieldName="audioFile"
                  isExistingFile={
                    topic?.topic.Audio?.url && !formData.audioFile
                  }
                  existingFileUrl={
                    topic?.topic.Audio?.url
                      ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.Audio.url
                      }`
                      : null
                  }
                />

                {/* Audio Duration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)*
                  </label>
                  <input
                    type="number"
                    name="audioDuration"
                    min="0"
                    step="0.01"
                    value={formData.audioDuration}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Auto-filled when audio is selected or generated; you can adjust"
                    required
                  />
                </div>
              </div>
            )}

            {formData.content_type === "general" && (
              <div className="space-y-6 p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  General Content
                </h2>

                {/* Title Input */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title*
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ""}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter title"
                    required
                  />
                </div>

                {/* Description Editor */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description*
                  </label>
                  <Editor
                    apiKey={import.meta.env.VITE_TINYMCE_API} // Replace with your TinyMCE API key
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
                    onEditorChange={(content) =>
                      setFormData((prev) => ({
                        ...prev,
                        generalDescription: content,
                      }))
                    }
                  />
                </div>

                {/* Completion Type Selection */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Type*
                  </label>
                  <select
                    name="generalCompletionType"
                    value={formData.generalCompletionType || "audio"}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="audio">Audio</option>
                    <option value="timer">Timer</option>
                  </select>
                </div>

                {/* Conditional Rendering based on Completion Type */}
                {formData.generalCompletionType === "audio" ? (
                  <div>
                    {/* Audio Upload/Text-to-Speech Section - Using TextToAudioConverter */}
                    <TextToAudioConverter
                      handleFileChange={handleAudioFileChangeForGeneral}
                      audioPreview={generalAudioPreview}
                      setAudioPreview={setGeneralAudioPreview}
                      fieldName="generalAudioFile"
                      isExistingFile={
                        topic?.topic.GeneralMaterial?.audio_url &&
                        !formData.generalAudioFile
                      }
                      existingFileUrl={
                        topic?.topic.GeneralMaterial?.audio_url
                          ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.GeneralMaterial.audio_url
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
                      name="generalCompletionTime"
                      value={formData.generalCompletionTime || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          handleChange({
                            target: {
                              name: "generalCompletionTime",
                              value: value
                            }
                          });
                        } else if (e.target.value === "") {
                          handleChange({
                            target: {
                              name: "generalCompletionTime",
                              value: ""
                            }
                          });
                        }
                      }}
                      min="1"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter time in minutes"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Time required to mark this content as completed
                    </p>
                  </div>
                )}

                {/* Material Type Selection */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Type*
                  </label>
                  <select
                    name="materialType"
                    value={formData.materialType}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Material Type</option>
                    {[
                      { value: "pdf", label: "PDF Document" },
                      { value: "link", label: "External Link" },
                      { value: "document", label: "Document" },
                      { value: "image", label: "Image" },
                      { value: "other", label: "Other" },
                    ].map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Rendering based on Material Type */}
                {formData.materialType && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {formData.materialType === "link" ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          External Link*
                        </label>
                        <input
                          type="url"
                          name="externalLink"
                          value={formData.externalLink || ""}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter URL"
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload File* ({formData.materialType})
                        </label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <input
                              id="general-file-upload"
                              type="file"
                              accept={
                                formData.materialType === "pdf"
                                  ? "application/pdf"
                                  : formData.materialType === "document"
                                    ? ".doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.xls,.xlsx,.html,.text"
                                    : formData.materialType === "image"
                                      ? "image/*"
                                      : "*/*"
                              }
                              onChange={(e) =>
                                handleFileChange(e, "generalFile")
                              }
                              required={
                                formData.materialType !==
                                topic?.topic.GeneralMaterial?.material_type
                              }
                              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>

                          {/* Show Preview */}
                          {formData.generalFile ? (
                            <div className="mt-3 flex flex-col items-center">
                              <div className="relative w-full max-w-md">
                                {formData.materialType === "image" ? (
                                  <img
                                    src={URL.createObjectURL(
                                      formData.generalFile
                                    )}
                                    alt="Preview"
                                    className="w-full rounded-lg border border-blue-200 shadow-md object-cover"
                                  />
                                ) : (
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-md text-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-10 w-10 mx-auto text-blue-500"
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
                                    <a
                                      href={URL.createObjectURL(
                                        formData.generalFile
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 block text-blue-600 font-medium hover:underline"
                                    >
                                      View File
                                    </a>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    document.getElementById(
                                      "general-file-upload"
                                    ).value = "";
                                    handleFileChange(
                                      { target: { files: [] } },
                                      "generalFile"
                                    );
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                  title="Remove file"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ) : topic?.topic.GeneralMaterial?.url &&
                            topic?.topic.GeneralMaterial?.material_type !==
                            "link" &&
                            formData.materialType ===
                            topic?.topic.GeneralMaterial?.material_type ? (
                            <div className="mt-3 flex flex-col items-center">
                              <div className="relative w-full max-w-md">
                                {formData.materialType === "image" ? (
                                  <img
                                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL
                                      }${topic.topic.GeneralMaterial.url}`}
                                    alt="Preview"
                                    className="w-full rounded-lg border border-blue-200 shadow-md object-cover"
                                  />
                                ) : (
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-md text-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-10 w-10 mx-auto text-blue-500"
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
                                    <a
                                      href={`${import.meta.env.VITE_BACKEND_MEDIA_URL
                                        }${topic.topic.GeneralMaterial.url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 block text-blue-600 font-medium hover:underline"
                                    >
                                      View File
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Programming Language and Code Editor */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programming Language (Optional)
                  </label>
                  <select
                    name="generalCodeLanguage"
                    value={formData.generalCodeLanguage || ""}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Language</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                  </select>

                  {formData.generalCodeLanguage && (
                    <div className="mt-4 grid grid-cols-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code
                      </label>
                      <CodeMirror
                        value={formData.generalCode || ""}
                        height="200px"
                        extensions={[
                          formData.generalCodeLanguage === "javascript"
                            ? javascript()
                            : formData.generalCodeLanguage === "python"
                              ? python()
                              : formData.generalCodeLanguage === "java"
                                ? java()
                                : formData.generalCodeLanguage === "cpp" ||
                                  formData.generalCodeLanguage === "c"
                                  ? cpp()
                                  : [],
                        ]}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            generalCode: value,
                          }))
                        }
                        className="border border-gray-300 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Render EditSlideContent component when content_type is "slide" */}
            {formData.content_type === "slide" && (
              <EditSlideContent
                slides={formData.slides}
                slidePreviews={slidePreviews}
                setSlidePreviews={setSlidePreviews}
                updateSlides={updateSlides}
                contentTypes={contentTypes}
                renderSlideContentForm={renderSlideContentForm}
                handleSlideFileChange={handleSlideFileChange}
              />
            )}

            <button
              type="submit"
              className="px-6 py-3 mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              {isLoadingUpdate ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Update Topic"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
