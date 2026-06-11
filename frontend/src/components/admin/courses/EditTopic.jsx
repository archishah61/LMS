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
  Link2,
  Camera,
  ArrowLeft,
} from "lucide-react";
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
import { useSelector } from "react-redux";
import EditAccordianContent from "./EditTopic/EditAccordianContent";
import EditSlideContent from "./EditTopic/EditSlideContent";
import EditSlideAccordianContent from "./EditTopic/EditSlideAccordianContent";
import TextToAudioConverter from "../AIServices/TextToAudioConverter";
import AdminLoader from "../AdminLoader";
import PermissionWrapper from "../../../context/PermissionWrapper";

const normalizeMinuteSecondValue = (rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === "") return 0;

  const valueAsString = String(rawValue).trim();
  const parsed = parseFloat(valueAsString);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;

  if (valueAsString.includes(":")) {
    const [mPart, sPart] = valueAsString.split(":");
    const mm = parseInt(mPart, 10);
    const ss = parseInt(sPart, 10);
    if (Number.isFinite(mm) && Number.isFinite(ss) && ss >= 0 && ss <= 59) {
      return Number((mm + ss / 60).toFixed(2));
    }
  }

  return Number(parsed.toFixed(2));
};

const normalizeMinuteSecondString = (rawValue) =>
  normalizeMinuteSecondValue(rawValue).toFixed(2);

const decimalMinutesToMmSs = (minutes) => {
  const totalSeconds = Math.round((Number(minutes) || 0) * 60);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

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

const decimalMinutesToHhMmSs = (minutes) => {
  const totalSeconds = Math.round((Number(minutes) || 0) * 60);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

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
  const [audioImagePreview, setAudioImagePreview] = useState(null);
  const [accordianPreviews, setAccordianPreviews] = useState({});
  const [slidePreviews, setSlidePreviews] = useState({});
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const languageOptions = [
    "JavaScript", "HTML", "CSS", "TypeScript", "PHP",
    "Python", "Dart", "C", "C++", "C#", "Java", "Go", "HTML/CSS/JavaScript"
  ];
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "",
    videoFile: null,
    generalCompletionType: "audio",
    generalCompletionTime: 1,
    generalAudioFile: null,
    generalAudioDuration: "0.00",
    videoDuration: "",
    audioFile: null,
    audioImageFile: null,
    audioDuration: "",
    extra_duration: "0",
    topic_duration: "0",
    total_duration: "0",
    accordianSections: [
      {
        title: "",
        body: "",
        mediaUrl: [],
        accordianAudioFile: null,
        accordianCompletionType: "audio",
        accordianCompletionTime: 1,
        accordianAudioUrl: "",
        accordianAudioDuration: "0.00",
        codeLanguage: "",
        code: "",
      },
    ],
    generalFile: null,
    generalTitle: "",
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
        slide_extra_duration: "0",
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
    languages: [],
  });

  const contentTypes = [
    { value: "video", label: "Video" },
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

  const codeLanguages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "go", label: "Go" },
    { value: "php", label: "PHP" },
    { value: "rust", label: "Rust" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "sql", label: "SQL" },
    { value: "json", label: "JSON" },
    { value: "xml", label: "XML" },
    { value: "markdown", label: "Markdown" },
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
        // Keep file input state as File|null only; existing audio is handled via preview/url props.
        generalAudioFile: null,
        videoDuration: topic.topic.Video?.duration_minutes || "",
        transcript: topic.topic.Video?.transcript || "",
        bulletPoints: Array.isArray(topic.topic.Video?.bullet_points)
          ? topic.topic.Video.bullet_points
          : [],
        audioFile: null,
        audioImageFile: null,
        image_url: topic.topic.Audio?.image_url || null,
        audioDuration: topic.topic.Audio?.duration_minutes || "",
        extra_duration:
          topic.topic.content_type === "slide"
            ? "0.00"
            : topic.topic.extra_duration?.toString() || "0.00",
        topic_duration: topic.topic.topic_duration?.toString() || "0",
        total_duration: topic.topic.total_duration?.toString() || "0",
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
          accordianAudioDuration: acc.accordianAudioDuration || acc.duration_minutes || 0,
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
        generalTitle: topic.topic.GeneralMaterial?.title || "",
        generalDescription: topic.topic.GeneralMaterial?.description || "",
        generalCompletionType:
          topic.topic.GeneralMaterial?.completion_type || "audio",
        generalCompletionTime:
          topic.topic.GeneralMaterial?.completion_time || 0,
        generalAudioDuration:
          topic.topic.content_type === "general" && topic.topic.GeneralMaterial?.completion_type === "audio"
            ? (topic.topic.GeneralMaterial?.duration_minutes?.toString() || topic.topic.topic_duration?.toString() || "0")
            : "0",
        // Prefer nested materials under GeneralMaterial returned by API
        materials: (topic.topic.TopicMaterials || []).map(m => ({
          id: m.id,
          material_type: m.material_type,
          link: m.url || '',
          url: m.url || '',
          file: null,
          existing_file: m.url || null,
          previewUrl: null,
          code: m.code || "", // Add code field
          codeLanguage: m.codeLanguage || "", // Add codeLanguage field
        })),
        generalCode: topic.topic.GeneralMaterial?.code || "", // ✅ Added
        generalCodeLanguage: topic.topic.GeneralMaterial?.codeLanguage || "", // ✅ Added
        slides: topic.topic.MultiSlides
          ?.slice() // Create a copy first
          ?.sort((a, b) => (a.sequence_no || 0) - (b.sequence_no || 0)) // Add this line
          ?.map((slide) => {
            const parsedSlideMaterials = Array.isArray(slide.materials)
              ? slide.materials
              : (() => {
                if (!slide.materials) return [];
                try {
                  const parsed = JSON.parse(slide.materials);
                  return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                  return [];
                }
              })();

            return ({
              id: slide.id,
              sequence_no: slide.sequence_no,
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
              audioDuration:
                slide.MultiSlideAudios?.[0]?.duration_minutes ||
                (slide.completion_type === "audio" ? slide.slide_duration : "") ||
                "",
              slide_duration: slide.slide_duration?.toString() || "0",
              total_slide_duration: slide.total_slide_duration?.toString() || "0",
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
              })
              ) || [
                  {
                    title: "",
                    body: "",
                    mediaUrl: [],
                    codeLanguage: "",
                    code: "",
                    accordianAudioUrl: "",
                  },
                ],
              // Prefer nested materials under the first MultiSlideGenerals entry if present
              materials: ((slide.MultiSlideGenerals && slide.MultiSlideGenerals[0] && slide.MultiSlideGenerals[0].materials) || slide.MultiSlideGeneralMaterials || slide.materials || []).map(m => ({
                id: m.id,
                material_type: m.material_type,
                link: m.url || '',
                code: m.code || '',
                file: null,
                existing_file: m.url || null,
                previewUrl: null,
                codeLanguage: m.codeLanguage || "",
              })),
              code: slide.MultiSlideGenerals?.[0]?.code || "",
              codeLanguage: slide.MultiSlideGenerals?.[0]?.codeLanguage || "",
              slide_extra_duration: (slide.slide_extra_duration)?.toString() || "0",
            });
          }) || [
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
        languages: Array.isArray(topic?.topic?.languages)
          ? topic.topic.languages
          : []
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
    if (topic?.topic.Audio?.image_url && !formData.audioImageFile) {
      const existingAudioImageUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.Audio.image_url || '/placeholder.png'
        }`;
      setAudioImagePreview(existingAudioImageUrl);
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
    formData.audioImageFile,
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

  const addSlideMaterialRow = (slideIndex) => {
    setFormData((prev) => {
      const updatedSlides = [...prev.slides];
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        materials: [
          ...(updatedSlides[slideIndex].materials || []),
          { material_type: "", link: "", file: null, code: "", codeLanguage: "" },
        ],
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const updateSlideMaterialRow = (slideIndex, materialIndex, key, value) => {
    setFormData((prev) => {
      const updatedSlides = [...prev.slides];
      const updatedMaterials = [...(updatedSlides[slideIndex].materials || [])];
      updatedMaterials[materialIndex] = {
        ...updatedMaterials[materialIndex],
        [key]: value,
      };
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        materials: updatedMaterials,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const removeSlideMaterialRow = (slideIndex, materialIndex) => {
    setFormData((prev) => {
      const updatedSlides = [...prev.slides];
      const updatedMaterials = (updatedSlides[slideIndex].materials || []).filter(
        (_, i) => i !== materialIndex
      );
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        materials: updatedMaterials,
      };
      return { ...prev, slides: updatedSlides };
    });
  };

  const isValidMaterialFile = (file, type) => {
    if (!file) return false;

    const ext = file.name.split(".").pop().toLowerCase();
    const mime = file.type;

    // ❌ Block JS/JSX files for ALL types
    if (["js", "jsx"].includes(ext)) {
      return false;
    }

    if (type === "pdf") {
      return mime === "application/pdf" && ext === "pdf";
    }

    if (type === "image") {
      return mime.startsWith("image/");
    }

    if (type === "document") {
      return ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext);
    }

    // "other" → allow everything
    return true;
  };

  const handleSlideMaterialFileChange = (slideIndex, materialIndex, file) => {
    if (!file) return;
    setFormData((prev) => {
      const updatedSlides = [...prev.slides];
      const updatedMaterials = [...(updatedSlides[slideIndex].materials || [])];

      if (!isValidMaterialFile(file, updatedMaterials[materialIndex].material_type)) {
        toast.error(`Invalid file for type: ${updatedMaterials[materialIndex].material_type}`);
        return prev;
      }

      updatedMaterials[materialIndex] = {
        ...updatedMaterials[materialIndex],
        file,
      };
      updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        materials: updatedMaterials,
      };
      return { ...prev, slides: updatedSlides };
    });
  };


  // Ensure media links open correctly by resolving relative URLs against backend media base
  const resolveMediaUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (/^https?:\/\//i.test(url)) return url; // already absolute
    const base = import.meta.env.VITE_BACKEND_MEDIA_URL || '';
    if (!base) return url.startsWith('/') ? url : `/${url}`;
    const baseTrim = base.endsWith('/') ? base.slice(0, -1) : base;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseTrim}${path}`;
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

  // Real-time duration calculation
  useEffect(() => {
    let topic_duration = 0;
    const { content_type, videoDuration, audioDuration, generalCompletionType, generalCompletionTime, generalAudioDuration, accordianSections, slides } = formData;

    if (content_type === "video") {
      topic_duration = normalizeMinuteSecondValue(videoDuration);
    } else if (content_type === "audio") {
      topic_duration = normalizeMinuteSecondValue(audioDuration);
    } else if (content_type === "general") {
      if (generalCompletionType === "timer") {
        topic_duration = normalizeMinuteSecondValue(generalCompletionTime);
      } else {
        topic_duration = normalizeMinuteSecondValue(generalAudioDuration ?? formData.topic_duration);
      }
    } else if (content_type === "accordian") {
      topic_duration = (accordianSections || []).reduce((sum, section) => {
        let sectionDur = 0;
        if (section.accordianCompletionType === "timer") {
          sectionDur = normalizeMinuteSecondValue(section.accordianCompletionTime);
        } else {
          sectionDur = normalizeMinuteSecondValue(section.accordianAudioDuration);
        }
        return sum + sectionDur;
      }, 0);
    } else if (content_type === "slide") {
      topic_duration = (slides || []).reduce((sum, slide) => {
        let slide_duration = 0;

        if (slide.content_type === "video") {
          slide_duration = normalizeMinuteSecondValue(slide.videoDuration);
        } else if (slide.content_type === "audio") {
          slide_duration = normalizeMinuteSecondValue(slide.audioDuration);
        } else if (slide.content_type === "accordian") {
          if (slide.slideCompletionType === "timer") {
            slide_duration = normalizeMinuteSecondValue(slide.slideCompletionTime);
          } else {
            const slideLevelAudioDuration = normalizeMinuteSecondValue(slide.audioDuration);
            if (Number.isFinite(slideLevelAudioDuration)) {
              slide_duration = slideLevelAudioDuration;
            } else {
              // Fallback for legacy accordion data that stores per-section durations.
              slide_duration = (slide.accordianSections || []).reduce((accSum, accSec) => {
                let accDur = 0;
                if (accSec.accordianCompletionType === "timer") accDur = normalizeMinuteSecondValue(accSec.accordianCompletionTime);
                else accDur = normalizeMinuteSecondValue(accSec.accordianAudioDuration);
                return accSum + accDur;
              }, 0);
            }
          }
        } else if (slide.content_type === "general") {
          if (slide.slideCompletionType === "timer") slide_duration = normalizeMinuteSecondValue(slide.slideCompletionTime);
          else slide_duration = normalizeMinuteSecondValue(slide.audioDuration);
        }

        return sum + slide_duration;
      }, 0);
    }

    const slide_extra = (slides || []).reduce((sum, slide) => {
      return sum + (normalizeMinuteSecondValue(slide?.slide_extra_duration) || 0);
    }, 0);

    const extra =
      content_type === "slide"
        ? slide_extra
        : (content_type === "video" &&
          (Array.isArray(formData.video_type)
            ? formData.video_type[0] === "youtube"
            : formData.video_type === "youtube"))
          ? 0.00
          : normalizeMinuteSecondValue(formData.extra_duration);

    const total = topic_duration + extra;

    if (
      String(formData.topic_duration) !== String(topic_duration.toFixed(2)) ||
      String(formData.total_duration) !== String(total.toFixed(2))
    ) {
      setFormData((prev) => ({
        ...prev,
        topic_duration: topic_duration.toFixed(2),
        total_duration: total.toFixed(2),
      }));
    }
  }, [
    formData.content_type,
    formData.videoDuration,
    formData.audioDuration,
    formData.generalCompletionType,
    formData.generalCompletionTime,
    formData.generalAudioDuration,
    formData.accordianSections,
    formData.slides,
    formData.extra_duration,
    formData.video_type,
  ]);

  useEffect(() => {
    if (
      (formData.content_type === "slide" ||
        (formData.content_type === "video" &&
          (Array.isArray(formData.video_type)
            ? formData.video_type[0] === "youtube"
            : formData.video_type === "youtube"))) &&
      normalizeMinuteSecondString(formData.extra_duration || "0.00") !== "0.00"
    ) {
      setFormData((prev) => ({
        ...prev,
        extra_duration: "0.00",
      }));
    }
  }, [formData.content_type, formData.extra_duration, formData.video_type]);

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
        updatedFormData.generalAudioDuration = Number(updatedFormData.generalAudioDuration) || 0;
      } else if (value === "timer") {
        // Set default completion time to 1 instead of 0
        updatedFormData.generalCompletionTime = 1;
        updatedFormData.generalAudioFile = null;
        updatedFormData.generalAudioDuration = 0;
        setGeneralAudioPreview(null);
        if (document.getElementById("general-audio-upload")) {
          document.getElementById("general-audio-upload").value = "";
        }
      }
      setFormData(updatedFormData);
    } else if (name === "content_type") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        extra_duration: value === "slide" ? "0.00" : prev.extra_duration,
      }));
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

  const secondsToDecimalMinutes = (seconds) =>
    Number((Math.max(0, Number(seconds) || 0) / 60).toFixed(2));

  // ---- Auto-duration helpers (minutes) ----
  const computeVideoDurationFromUrl = (src) => {
    return new Promise((resolve, reject) => {
      try {
        const el = document.createElement("video");
        el.preload = "metadata";
        const onLoaded = () => {
          const sec = Number.isFinite(el.duration) ? el.duration : 0;
          const minutes = secondsToDecimalMinutes(sec);
          cleanup();
          resolve(minutes);
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
              const sec = Number.isFinite(dur) ? dur : 0;
              const minutes = secondsToDecimalMinutes(sec);
              player.destroy();
              container.remove();
              resolve(minutes);
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
    if ((fieldName === "audioFile" || fieldName === "generalAudioFile") && file) {
      const durationField = fieldName === "generalAudioFile" ? "generalAudioDuration" : "audioDuration";
      const audioEl = document.createElement('audio');
      audioEl.preload = 'metadata';
      const url = URL.createObjectURL(file);
      audioEl.src = url;
      const onLoaded = () => {
        const sec = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
        const minutes = secondsToDecimalMinutes(sec);
        setFormData((prev) => ({ ...prev, [durationField]: minutes }));
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
        computeVideoDurationFromUrl(url).then((minutes) => {
          setFormData((prev) => {
            const next = { ...prev };
            next.slides = [...prev.slides];
            next.slides[idx] = { ...prev.slides[idx], videoDuration: minutes };
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
          const sec = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
          const minutes = secondsToDecimalMinutes(sec);
          setFormData((prev) => {
            const next = { ...prev };
            next.slides = [...prev.slides];
            next.slides[idx] = { ...prev.slides[idx], audioDuration: minutes };
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

      // Slide completion audio (used by slide types like general/accordian)
      if (slide.slideCompletionType === 'audio' && slide.slideAudioFile instanceof File) {
        const audioEl = document.createElement('audio');
        audioEl.preload = 'metadata';
        const url = URL.createObjectURL(slide.slideAudioFile);
        audioEl.src = url;
        const onLoaded = () => {
          const sec = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
          const minutes = secondsToDecimalMinutes(sec);
          setFormData((prev) => {
            const current = parseFloat(prev.slides?.[idx]?.audioDuration || 0);
            if (current === minutes) return prev;
            const next = { ...prev };
            next.slides = [...prev.slides];
            next.slides[idx] = { ...prev.slides[idx], audioDuration: minutes };
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
          computeYouTubeDuration(id).then((minutes) => {
            if (minutes != null) {
              setFormData((prev) => {
                const next = { ...prev };
                next.slides = [...prev.slides];
                next.slides[idx] = { ...prev.slides[idx], videoDuration: minutes };
                return next;
              });
            }
          });
        }
      }
    });
  }, [formData.slides]);

  const handleAccordionChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedSections = prev.accordianSections.map((sec, i) => {
        if (i !== index) return sec;
        if (
          [
            "title",
            "body",
            "codeLanguage",
            "code",
            "accordianAudioFile",
            "accordianCompletionType",
            "accordianCompletionTime",
            "accordianAudioDuration",
          ].includes(field)
        ) {
          if (field === "accordianCompletionType") {
            if (value === "audio") {
              return { ...sec, accordianCompletionTime: 0, [field]: value };
            } else if (value === "timer") {
              return { ...sec, accordianCompletionTime: 1, accordianAudioFile: null, [field]: value };
            }
          }
          return { ...sec, [field]: value };
        } else if (
          field === "showVideo" ||
          field === "showAudio" ||
          field === "showFile"
        ) {
          return { ...sec, [field]: value };
        } else if (
          field === "videoUrl" ||
          field === "audioUrl" ||
          field === "fileUrl"
        ) {
          if (value) {
            const fileType =
              field === "videoUrl"
                ? "video"
                : field === "audioUrl"
                  ? "audio"
                  : "document";
            return { ...sec, mediaUrl: [...(sec.mediaUrl || []), { url: value, fileType }] };
          }
          return sec;
        }
        return sec;
      });
      return { ...prev, accordianSections: updatedSections };
    });
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
        updatedSlides[slideIndex].audioDuration = "";
        setSlidePreviews((prev) => {
          const updatedPreviews = { ...prev };
          delete updatedPreviews[`slideAudioFile-${slideIndex}`];
          return updatedPreviews;
        });
        const input = document.getElementById(`slide-audio-upload-${slideIndex}`);
        if (input) input.value = "";
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
      field === "showFile" ||
      field === "videoType"
    ) {
      currentSection[field] = value;
    } else if (
      field === "videoUrl" ||
      field === "youtubeUrl" ||
      field === "audioUrl" ||
      field === "fileUrl"
    ) {
      const mediaUrl = value;

      const fileType =
        field === "videoUrl"
          ? "video"
          : field === "youtubeUrl"
            ? "youtube"
            : field === "audioUrl"
              ? "audio"
              : "document";

      if (mediaUrl) {
        const index = currentSection.mediaUrl.findIndex(
          item => item.fileType === fileType
        );

        if (index !== -1) {
          // 🔄 update existing
          currentSection.mediaUrl[index] = {
            ...currentSection.mediaUrl[index],
            url: mediaUrl,
            isExisting: false,
          };
        } else {
          // ➕ add new
          currentSection.mediaUrl.push({
            url: mediaUrl,
            fileType,
            isExisting: false,
          });
        }
      } else {
        // ❌ remove that fileType for no mediaUrl
        currentSection.mediaUrl = currentSection.mediaUrl.filter(
          item => item.fileType !== fileType
        );
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

  const removeAudioImageFile = () => {
    setFormData((prev) => ({
      ...prev,
      image_url: null,
    }));
    setAudioImagePreview(null)
  }

  const handleAudioImageFileChangeForAudio = (e, fieldName) => {
    handleFileChange(e, fieldName);

    // If a new file is selected, update preview
    if (e.target.files && e.target.files[0]) {
      const previewUrl = URL.createObjectURL(e.target.files[0]);
      setAudioImagePreview(previewUrl);
    } else if (!e.target.files || e.target.files.length === 0) {
      // If file is cleared, reset to existing audio if available
      if (topic?.topic.Audio?.image_url) {
        const existingAudioImageUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.Audio.image_url || '/placeholder.png'
          }`;
        setAudioImagePreview(existingAudioImageUrl);
      } else {
        setAudioImagePreview(null);
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

  // === Multi-material preview helpers (general + slides) ===
  // Renders a preview for a material entry (image thumbnail or file/link anchor)
  const renderMaterialPreview = (material) => {
    if (!material) return null;
    const baseUrl = import.meta.env.VITE_BACKEND_MEDIA_URL || '';
    // Link type
    if (material.material_type === 'link') {
      const linkUrl = material.link || material.url;
      if (!linkUrl) return null;
      return (
        <a
          href={linkUrl.startsWith('http') ? linkUrl : `${baseUrl}${linkUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forestGreen hover:underline break-all text-sm"
        >
          {linkUrl}
        </a>
      );
    }
    // New file selected (_file or file property)
    const fileObj = material._file || material.file;
    if (fileObj instanceof File) {
      const objUrl = URL.createObjectURL(fileObj);
      if (material.material_type === 'image') {
        return (
          <div className="space-y-1">
            <img src={objUrl} alt="preview" className="h-24 rounded border object-cover" />
            <a href={objUrl} target="_blank" rel="noopener noreferrer" className="text-forestGreen text-xs hover:underline">Open image</a>
          </div>
        );
      }
      return (
        <a href={objUrl} target="_blank" rel="noopener noreferrer" className="text-forestGreen text-xs hover:underline">View File</a>
      );
    }
    // Existing stored file
    const storedUrl = material.url || material.existing_file;
    if (storedUrl) {
      const fullUrl = resolveMediaUrl(storedUrl);
      if (material.material_type === 'image') {
        return (
          <div className="space-y-1">
            <img src={fullUrl} alt="existing" className="h-24 rounded border object-cover" />
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forestGreen text-xs hover:underline"
              onClick={(e) => {
                if (fullUrl) {
                  e.preventDefault();
                  window.open(fullUrl, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              Open image
            </a>
          </div>
        );
      }
      return (
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forestGreen text-xs hover:underline"
          onClick={(e) => {
            if (fullUrl) {
              e.preventDefault();
              window.open(fullUrl, '_blank', 'noopener,noreferrer');
            }
          }}
        >
          Existing File
        </a>
      );
    }
    return null;
  };

  // Materials handlers
  const addMaterialRow = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [
        ...(prev.materials || []),
        { material_type: "", link: "", file: null, code: "", codeLanguage: "" },
      ],
    }));
  };

  const getAcceptType = (type) => {
    switch (type) {
      case "pdf":
        return ".pdf,application/pdf";

      case "image":
        return "image/*";

      case "document":
        return `
        .doc,.docx,
        .xls,.xlsx,
        .ppt,.pptx,
        .txt,
        application/msword,
        application/vnd.openxmlformats-officedocument.wordprocessingml.document,
        application/vnd.ms-excel,
        application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
        application/vnd.ms-powerpoint,
        application/vnd.openxmlformats-officedocument.presentationml.presentation,
        text/plain
      `;

      case "other":
        return "*/*"; // allow everything

      default:
        return ""; // for link & code (no upload)
    }
  };

  const updateMaterialRow = (index, key, value) => {
    setFormData((prev) => {
      const list = [...(prev.materials || [])];
      list[index] = { ...list[index], [key]: value };
      // Clear file/link if type changes
      if (key === "material_type") {
        list[index].file = null;
        list[index].link = "";
        list[index].code = ""; // Clear code when type changes
        list[index].codeLanguage = ""; // Clear code language when type changes
      }
      return { ...prev, materials: list };
    });
  };

  const removeMaterialRow = (index) => {
    setFormData((prev) => {
      const list = [...(prev.materials || [])];
      list.splice(index, 1);
      return { ...prev, materials: list };
    });
  };

  // const handleMaterialFile = (index, file) => {
  //   if (!file) return;
  //   setFormData((prev) => {
  //     const list = [...prev.materials];
  //     console.log("list[index] ", list[index]);
  //     list[index] = { ...list[index], file };
  //     return { ...prev, materials: list };
  //   });
  // };

  const handleMaterialFile = (index, file) => {
    if (!file) return;

    setFormData((prev) => {
      const list = [...prev.materials];
      const current = list[index];

      if (!isValidMaterialFile(file, current.material_type)) {
        toast.error(`Invalid file for type: ${current.material_type}`);
        return prev;
      }

      list[index] = {
        ...current,
        file,
        previewUrl: URL.createObjectURL(file),
      };

      return { ...prev, materials: list };
    });
  };

  const getLanguageExtension = (lang) => {
    const map = {
      javascript: javascript(),
      typescript: javascript({ typescript: true }),
      python: python(),
      java: java(),
      cpp: cpp(),
      c: cpp(),
      go: go(),
      php: php(),
      rust: rust(),
      html: html(),
      css: css(),
      sql: sql(),
      json: json(),
      xml: xml(),
      markdown: markdown(),
    };

    return map[lang] || javascript();
  };

  const isYouTubeTopicContent =
    formData.content_type === "video" &&
    (Array.isArray(formData.video_type)
      ? formData.video_type[0] === "youtube"
      : formData.video_type === "youtube");


  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    const normalizedTopicExtraDuration =
      formData.content_type === "slide" ||
        (formData.content_type === "video" &&
          (Array.isArray(formData.video_type)
            ? formData.video_type[0] === "youtube"
            : formData.video_type === "youtube"))
        ? "0.00"
        : normalizeMinuteSecondString(formData.extra_duration || "0.00");

    Object.keys(formData).forEach((key) => {
      if (
        (formData[key] !== undefined && formData[key] !== null && formData[key] !== "") &&
        ![
          "videoFile",
          "generalAudioFile",
          "audioFile",
          "audioImageFile",
          "generalFile",
          "accordianSections",
          "slides",
          "tags",
          // Exclude these fields to prevent duplication as they'll be handled in the switch statement
          "video_type",
          "videoUrl",
          "content",
          "materials",
          "languages",
          "topic_duration",
          "extra_duration",
          "total_duration"
        ].includes(key)
      ) {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (formData.languages) {
      formDataToSend.append("languages", JSON.stringify(formData.languages));
    }
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

    // Add this RIGHT BEFORE the switch statement or at the end before try/catch:

    if (formData.materials && formData.materials.length > 0) {
      formData.materials.forEach((m, idx) => {
        if (!m.material_type) return
        const entry = { material_type: m.material_type }

        if (m.material_type === 'link') {
          if (m.link) entry.url = m.link
        } else if (m.material_type === 'code') {
          // For code type, include code and language in the entry
          entry.code = m.code || ""
          entry.codeLanguage = m.codeLanguage || "python"
        } else if (m.file instanceof File) {
          const fieldName = `material[${idx}]`
          formDataToSend.append(fieldName, m.file)
          entry.file_field = fieldName
        }
      })

      formDataToSend.append(
        "materials",
        JSON.stringify(
          formData.materials.map((material, idx) => {
            let url = null;

            if (material.material_type === "link") {
              url = material.link;
            } else if (material.material_type === "code") {
              // For code type, we don't need a URL
              url = null;
            } else if (material.file instanceof File) {
              const fieldName = `material[${idx}]`;
              url = fieldName;
            }

            return {
              id: material.id || null,
              material_type: material.material_type,
              url: url || material.url,
              code: material.material_type === "code" ? material.code || "" : null,
              codeLanguage: material.material_type === "code" ? (material.codeLanguage || "python") : null,
            };
          })
        )
      );
    }

    // // Global materials handling for all content types
    // const processedMaterials = [];
    // if (Array.isArray(formData.materials)) {
    //   formData.materials.forEach((m, idx) => {
    //     if (!m || !m.material_type) return;
    //     const entry = { material_type: m.material_type };

    //     if (m.material_type === 'link') {
    //       const linkUrl = m.link || m.url || m.existing_file;
    //       if (linkUrl) entry.url = linkUrl;
    //     } else if (m.material_type === 'code') {
    //       // For code type, include code and language
    //       entry.code = m.code || "";
    //       entry.codeLanguage = m.codeLanguage || "python";
    //     } else if (m._file instanceof File) {
    //       const fieldName = `material[${idx}]`;
    //       formDataToSend.append(fieldName, m._file);
    //       entry.file_field = fieldName;
    //     } else {
    //       // Preserve existing stored file URL if no new file is chosen
    //       const existing = m.url || m.existing_file;
    //       if (existing) entry.url = existing;
    //     }

    //     // Only push if we have enough data to represent a material
    //     if (entry.material_type && (entry.url || entry.file_field || entry.code)) {
    //       processedMaterials.push(entry);
    //     }
    //   });
    // }

    // // Always send materials to preserve or clear explicitly
    // formDataToSend.append('materials', JSON.stringify(processedMaterials));

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
          normalizeMinuteSecondString(formData.videoDuration)
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
        formDataToSend.append("audioImageUrl", formData.audioImageFile);
        formDataToSend.append("content[image_url]", formData.image_url);
        formDataToSend.append(
          "content[duration_minutes]",
          normalizeMinuteSecondString(formData.audioDuration)
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

          processedSection.accordianAudioDuration =
            processedSection.accordianCompletionType === "audio"
              ? normalizeMinuteSecondValue(processedSection.accordianAudioDuration)
              : 0;
          return { ...processedSection, mediaUrl: processedMedia };
        });
        formDataToSend.append(
          "content",
          JSON.stringify(processedAccordianSections)
        );
        break;

      case "general":
        formDataToSend.append("content[title]", formData.generalTitle);
        formDataToSend.append("content[description]", formData.generalDescription);
        formDataToSend.append("content[code]", formData.generalCode);
        formDataToSend.append("content[completion_type]", formData.generalCompletionType || "audio");
        if (formData.generalCompletionType === "timer" && formData.generalCompletionTime) {
          formDataToSend.append("content[completion_time]", formData.generalCompletionTime);
        }
        if (formData.generalCompletionType === "audio" && formData.generalAudioFile instanceof File) {
          formDataToSend.append("generalAudioUrl", formData.generalAudioFile);
        }
        // Send duration for general if audio
        if (formData.generalCompletionType === "audio") {
          formDataToSend.append(
            "content[duration_minutes]",
            normalizeMinuteSecondString(formData.generalAudioDuration || "0")
          );
          formDataToSend.append("generalAudioDuration", normalizeMinuteSecondString(formData.generalAudioDuration || "0"));
        } else {
          formDataToSend.append("content[duration_minutes]", "0");
        }
        formDataToSend.append("content[codeLanguage]", formData.generalCodeLanguage);
        break;

      case "slide":
        const processedSlides = formData.slides.map((slide, slideIndex) => {
          const processedSlide = { ...slide };
          const isYouTubeSlideVideo =
            slide.content_type === "video" && slide.videoType === "youtube";
          processedSlide.slide_extra_duration = isYouTubeSlideVideo
            ? "0.00"
            : normalizeMinuteSecondString(slide.slide_extra_duration);
          if (slide.videoDuration !== undefined) {
            processedSlide.videoDuration = normalizeMinuteSecondString(slide.videoDuration);
          }
          if (slide.audioDuration !== undefined) {
            processedSlide.audioDuration = normalizeMinuteSecondString(slide.audioDuration);
          }
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

                    return {
                      ...processedSection,
                      mediaUrl: processedMedia,
                      codeLanguage: section.codeLanguage || "",
                      code: section.code || "",
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

          if (processedSlide.materials && processedSlide.materials.length > 0) {
            // Build the formatted materials array
            const formattedMaterials = processedSlide.materials.map((m, idx) => {
              if (!m.material_type) return null;

              const entry = {
                id: m.id || null,
                material_type: m.material_type,
                code: "",
                codeLanguage: "",
                url: null
              };

              if (m.material_type === "link") {
                entry.url = m.link || "";
              } else if (m.material_type === "code") {
                entry.code = m.code || "";
                entry.codeLanguage = m.codeLanguage || "python";
              } else if (m.file instanceof File) {
                // File-based materials: add file to FormData
                const fieldName = `slide_material[${slideIndex}][${idx}]`;
                formDataToSend.append(fieldName, m.file);
                entry.url = fieldName;
              } else if (m.existing_file) {
                entry.url = m.existing_file;
              }

              return entry;
            }).filter(Boolean);

            processedSlide.materials = formattedMaterials;
          }

          processedSlide.index = slideIndex;
          return processedSlide;
        });

        formDataToSend.append("content", JSON.stringify(processedSlides));
        break;
    }

    // Append durations to the root for backend check
    formDataToSend.append("topic_duration", normalizeMinuteSecondString(formData.topic_duration || "0"));
    formDataToSend.append("extra_duration", normalizedTopicExtraDuration);
    formDataToSend.append("total_duration", normalizeMinuteSecondString(formData.total_duration || "0"));

    // for (const pair of formDataToSend.entries()) {
    //   const [key, value] = pair;
    //   if (value instanceof File) {
    //   } else {
    //     let display = value;
    //     try {
    //       if (typeof value === "string") {
    //         const parsed = JSON.parse(value);
    //         display = parsed;
    //       }
    //     } catch (e) {
    //       // not JSON
    //     }
    //   }
    // }
    // console.groupEnd();

    try {
      const result = await updateTopic({
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
    return <AdminLoader fullScreen message="Loading topic details..." />;
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
          <div className="space-y-4 md:space-y-6 md:p-4 bg-white md:rounded-lg md:shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Video Content
            </h2>

            {/* Video Type Selection - Only editable for new slides (without an id) */}
            <div className="bg-gray-50 md:p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {!slide.id ? "Video Type*" : "Video Type* (Cannot be changed after creation)"}
              </label>
              <div className="flex md:flex-row flex-col md:items-center md:space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name={`video-type-${index}`}
                    id={`internal-video-${index}`}
                    checked={slide.videoType === "internal"}
                    onChange={() => handleVideoTypeChange(index, "internal")}
                    // disabled={!!slide.id}
                    className={`h-4 w-4 border-gray-300 rounded focus:ring-leafGreen ${!slide.id ? "accent-leafGreen" : "text-gray-400 cursor-not-allowed"
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
                    className={`h-4 w-4 border-gray-300 rounded focus:ring-leafGreen ${!slide.id ? "accent-leafGreen" : "text-gray-400 cursor-not-allowed"
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
                <div className="bg-gray-50 md:p-4 rounded-lg">
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
                        className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-leafGreen/20"
                      />
                    </div>

                    {slidePreviews[`videoPreview-${index}`] && (
                      <div className="mt-3 flex flex-col items-center">
                        <div className="relative w-full max-w-md">
                          <video
                            src={slidePreviews[`videoPreview-${index}`]}
                            controls
                            className="w-full rounded-lg border border-leafGreen/30 shadow-md object-cover"
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
                              className="w-full rounded-lg border border-leafGreen/30 shadow-md object-cover"
                            />
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Video Duration */}
                <div className="bg-gray-50 md:p-4 rounded-lg">
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
                    className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                    placeholder="Enter duration in minutes"
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
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 md:p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube URL*
                  </label>
                  <input
                    type="text"
                    value={slide.videoUrl || ""}
                    onChange={(e) =>
                      handleSlideChange(index, "videoUrl", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
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
                <div className="bg-gray-50 md:p-4 rounded-lg mt-4">
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
                    className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                    placeholder="Enter duration in minutes"
                    required
                    disabled
                  />
                  <p className="mt-2 text-sm text-gray-500">*This field is disabled because the video duration is auto-captured.</p>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-amber-200  from-amber-50 to-orange-50 p-4 mt-4">
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
                    value={Number(slide.videoDuration || slide.slide_duration || 0).toFixed(2)}
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
                      handleSlideChange(index, "slide_extra_duration", e.target.value)
                    }
                    onBlur={(e) =>
                      handleSlideChange(
                        index,
                        "slide_extra_duration",
                        normalizeMinuteSecondString(e.target.value)
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
                      const base = parseFloat(slide.videoDuration || slide.slide_duration || 0);
                      const extra =
                        slide.videoType === "youtube"
                          ? 0
                          : normalizeMinuteSecondValue(slide.slide_extra_duration || 0);
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
                  slide {decimalMinutesToMmSs(parseFloat(normalizeLocalMinuteSecondString((slide.videoDuration || slide.slide_duration || 0))))} • {decimalMinutesToHhMmSs(parseFloat(normalizeLocalMinuteSecondString((slide.videoDuration || slide.slide_duration || 0))))}
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
            {/* Video Upload */}
          </div>
        );
      // uncomment to add Slide Type Audio
      // case "audio":
      //   return (
      //     <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      //       <h2 className="text-xl font-semibold text-gray-800 mb-4">
      //         Audio Content
      //       </h2>

      //       {/* Audio Upload using TextToAudioConverter */}
      //       <TextToAudioConverter
      //         handleFileChange={(e, fieldName) => {
      //           handleSlideFileChange(index, "audioFile", e.target.files[0]);
      //         }}
      //         audioPreview={slidePreviews[`audioPreview-${index}`]}
      //         setAudioPreview={(previewUrl) => {
      //           setSlidePreviews((prev) => ({
      //             ...prev,
      //             [`audioPreview-${index}`]: previewUrl,
      //           }));
      //         }}
      //         fieldName={`audioFile-${index}`}
      //         isExistingFile={slide.audioUrl && !slide.audioFile}
      //         existingFileUrl={
      //           slide.audioUrl
      //             ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${slide.audioUrl}`
      //             : null
      //         }
      //       />

      //       {/* Audio Duration */}
      //       <div className="bg-gray-50 p-4 rounded-lg">
      //         <label className="block text-sm font-medium text-gray-700 mb-2">
      //           Duration (minutes)*
      //         </label>
      //         <input
      //           type="number"
      //           min="0"
      //           step="0.01"
      //           value={slide.audioDuration || ""}
      //           onChange={(e) =>
      //             handleSlideChange(index, "audioDuration", e.target.value)
      //           }
      //           className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
      //           placeholder="Enter duration in minutes"
      //           required
      //         />
      //       </div>
      //     </div>
      //   );
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
            codeLanguages={codeLanguages}
            getLanguageExtension={getLanguageExtension}
          />
        );
      // Inside renderSlideContentForm, add a case for materials
      // Inside renderSlideContentForm, for the "general" case:
      // case "general":
      //   return (

      //   );


      // case "general":
      //   return (
      //     <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      //       <h2 className="text-xl font-semibold text-gray-800 mb-4">
      //         General Content
      //       </h2>

      //       {/* Materials */}
      //       <div className="bg-gray-50 p-4 rounded-lg">
      //         <div className="flex items-center justify-between mb-3">
      //           <label className="block text-sm font-medium text-gray-700">
      //             Materials
      //           </label>
      //           <div className="flex gap-2">
      //             <button
      //               type="button"
      //               onClick={() => addSlideMaterialRow(index)}
      //               className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
      //             >
      //               Add material
      //             </button>
      //             {Array.isArray(slide.materials) && slide.materials.length > 0 && (
      //               <button
      //                 type="button"
      //                 onClick={() => updateSlideMaterialRow(index, -1, '__clear__', true)}
      //                 className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
      //               >
      //                 Clear all
      //               </button>
      //             )}
      //           </div>
      //         </div>

      //         {/* Rows */}
      //         <div className="space-y-3">
      //           {(Array.isArray(slide.materials) ? slide.materials : []).map((m, mIdx) => (
      //             <div key={mIdx} className="grid md:grid-cols-12 gap-3 items-start p-3 rounded border">
      //               {/* Type */}
      //               <div className="md:col-span-3">
      //                 <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
      //                 <select
      //                   value={m.material_type || ''}
      //                   onChange={(e) => updateSlideMaterialRow(index, mIdx, 'material_type', e.target.value)}
      //                   className="w-full p-2 border rounded text-sm"
      //                 >
      //                   <option value="">Select</option>
      //                   <option value="pdf">PDF</option>
      //                   <option value="link">External Link</option>
      //                   <option value="document">Document</option>
      //                   <option value="image">Image</option>
      //                   <option value="other">Other</option>
      //                 </select>
      //               </div>

      //               {/* Link or File */}
      //               <div className="md:col-span-5">
      //                 {m.material_type === 'link' ? (
      //                   <div>
      //                     <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
      //                     <input
      //                       type="url"
      //                       value={m.link || ''}
      //                       onChange={(e) => updateSlideMaterialRow(index, mIdx, 'link', e.target.value)}
      //                       className="w-full p-2 border rounded text-sm"
      //                       placeholder="https://..."
      //                     />
      //                   </div>
      //                 ) : (
      //                   <div>
      //                     <label className="block text-xs font-medium text-gray-600 mb-1">File</label>
      //                     <input
      //                       type="file"
      //                       accept={
      //                         m.material_type === 'pdf' ? 'application/pdf' :
      //                           m.material_type === 'document' ? '.doc,.docx,.txt,.rtf,.odt,.ppt,.pptx,.xls,.xlsx,.html,.text' :
      //                             m.material_type === 'image' ? 'image/*' :
      //                               m.material_type === 'other' ? '.zip,.json,.xml,.csv,.mp4,.mp3,.wav,.exe,.apk,.7z,.tar,.gz' : '*/*'

      //                       }
      //                       onChange={(e) => handleSlideMaterialFileChange(index, mIdx, e.target.files?.[0])}
      //                       className="w-full p-2 border rounded text-sm"
      //                     />
      //                   </div>
      //                 )}
      //               </div>

      //               {/* Preview */}
      //               <div className="md:col-span-3">
      //                 <label className="block text-xs font-medium text-gray-600 mb-1">Preview</label>
      //                 <div className="min-h-6">
      //                   {renderMaterialPreview(m)}
      //                 </div>
      //               </div>

      //               {/* Actions */}
      //               <div className="md:col-span-1 flex items-center justify-end">
      //                 <button
      //                   type="button"
      //                   onClick={() => removeSlideMaterialRow(index, mIdx)}
      //                   className="text-red-600 text-xs"
      //                 >
      //                   Remove
      //                 </button>
      //               </div>
      //             </div>
      //           ))}

      //           {(!slide.materials || slide.materials.length === 0) && (
      //             <p className="text-xs text-gray-500">No materials added yet. Click "Add material" to start.</p>
      //           )}
      //         </div>
      //       </div>

      //       {/* Programming Language Selection */}
      //       <div className="bg-gray-50 p-4 rounded-lg">
      //         <label className="block text-sm font-medium text-gray-700 mb-2">
      //           Programming Language (Optional)
      //         </label>
      //         <select
      //           value={slide.codeLanguage || ""}
      //           onChange={(e) =>
      //             handleSlideChange(index, "codeLanguage", e.target.value)
      //           }
      //           className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
      //         >
      //           <option value="">Select Language</option>
      //           <option value="javascript">JavaScript</option>
      //           <option value="python">Python</option>
      //           <option value="java">Java</option>
      //           <option value="cpp">C++</option>
      //           <option value="c">C</option>
      //         </select>

      //         {/* Code Editor */}
      //         {slide.codeLanguage && (
      //           <div className="mt-4">
      //             <label className="block text-sm font-medium text-gray-700 mb-2">
      //               Code
      //             </label>
      //             <CodeMirror
      //               value={slide.code || ""}
      //               height="200px"
      //               extensions={[
      //                 slide.codeLanguage === "javascript"
      //                   ? javascript()
      //                   : slide.codeLanguage === "python"
      //                     ? python()
      //                     : slide.codeLanguage === "java"
      //                       ? java()
      //                       : slide.codeLanguage === "cpp" ||
      //                         slide.codeLanguage === "c"
      //                         ? cpp()
      //                         : [],
      //               ]}
      //               onChange={(value) =>
      //                 handleSlideChange(index, "code", value)
      //               }
      //               className="border border-gray-300 rounded"
      //               theme="light"
      //             />
      //           </div>
      //         )}
      //       </div>

      //     </div>
      //   );
      default:
        return null;
    }
  };

  // const selectedContentTypeLabel = formData.content_type
  //   ? `${formData.content_type.charAt(0).toUpperCase()}${formData.content_type.slice(1)}`
  //   : "Not selected";

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4">
          <div className="flex items-center justify-between">
            {/* Left Section: Title and Subtitle */}
            <div className="flex-1 mx-2">
              <h1 className="text-xl text-center md:text-start md:text-2xl font-bold text-forestGreen">
                Edit Topic
              </h1>
            </div>

            {/* Right Section: Buttons */}
            <div className="flex items-center gap-4 flex-wrap relative">
              {/* Buttons for md and above */}
              <div className="hidden md:flex items-center gap-4 flex-wrap">
                {/* Back Button */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="font-medium">Back</span>
                </button>
              </div>

              {/* Dropdown for < md */}
              <div className="md:hidden relative flex items-center justify-between">
                {/* Back Arrow */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex border rounded-md items-center gap-2 text-gray-600 hover:text-gray-900 p-1"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 md:p-6 rounded-lg shadow-lg border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl"
        >
          <h2 className="text-xl font-semibold text-forestGreen mb-6">
            Topic Information
          </h2>

          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Topic Title */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 
                 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                  placeholder="Enter title"
                  required
                />
              </div>

              {/* Languages Field */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.languages?.join(", ") || ""}
                    readOnly
                    className="flex-1 min-w-0 px-3 py-2 border bg-gray-100 border-gray-300 rounded-lg 
                   cursor-default"
                    placeholder="Select languages"
                  />

                  <button
                    type="button"
                    onClick={() => setShowLanguageModal(true)}
                    className="shrink-0 px-4 py-2 bg-leafGreen text-white rounded-lg  "
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg border border-leafGreen/30 bg-lightGreen p-3 w-fit">
              <span className="text-xs font-semibold uppercase tracking-wide text-forestGreen">
                Content Type :
              </span>
              <span className="text-xs font-semibold text-slate-800">
                {formData.content_type ? formData.content_type.toUpperCase() : "Not selected"}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic Description
              </label>
              {["general", "slide", "accordian"].includes(
                formData.content_type
              ) ? (
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                  placeholder="Enter topic description"
                />
              ) : (
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
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center mb-2">
                <Tag size={16} className="text-leafGreen mr-2" />
                <h3 className="text-sm font-medium text-gray-700">
                  Tags and Files
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="p-4 bg-lightGreen rounded-lg border border-leafGreen/20 shadow-sm hover:shadow-md transition-all duration-300"
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
                          <Tag size={14} className="text-leafGreen mr-1" />
                          <label className="text-xs text-gray-600">
                            Tag Name
                          </label>
                        </div>
                        <input
                          type="text"
                          name="tagName"
                          value={tag.tagName}
                          pattern="^#[^#\s]+#$"
                          onChange={(e) => handleTagChange(e, index, "tagName")}
                          title="Tag must start and end with #, no spaces, no extra #"
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen text-sm transition-all duration-200"
                          placeholder="Enter tag like #react#"
                        />
                      </div>

                      <div>
                        <div className="flex items-center mb-1">
                          <Type size={14} className="text-leafGreen mr-1" />
                          <label className="text-xs text-gray-600">
                            Tag Type
                          </label>
                        </div>
                        <select
                          value={tag.tag_type}
                          onChange={(e) =>
                            handleTagChange(e, index, "tag_type")
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen text-sm transition-all duration-200"
                        >
                          <option value="file">File</option>
                          <option value="code">Code</option>
                        </select>
                      </div>

                      {tag.tag_type === "code" ? (
                        <div>
                          <div className="flex items-center mb-1">
                            <Code size={14} className="text-leafGreen mr-1" />
                            <label className="text-xs text-gray-600">
                              Programming Language
                            </label>
                          </div>
                          <select
                            value={tag.codeLanguage}
                            onChange={(e) =>
                              handleTagChange(e, index, "codeLanguage")
                            }
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select Language</option>
                            {codeLanguages.map((cl) => (
                              <option key={cl.value} value={cl.value}>
                                {cl.label}
                              </option>
                            ))}
                          </select>
                          <div>
                            <div className="flex items-center mb-1">
                              <Code
                                size={14}
                                className="text-leafGreen mr-1"
                              />
                              <label className="text-xs text-gray-600">
                                Code
                              </label>
                            </div>
                            <CodeMirror
                              value={tag.tagFile || ""}
                              height="200px"
                              extensions={[
                                getLanguageExtension(tag.codeLanguage),
                              ]}
                              onChange={(value) =>
                                handleTagChange(
                                  { target: { value } },
                                  index,
                                  "tagFile"
                                )
                              }
                            />
                          </div>
                        </div>
                      ) : (
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
                              id={`file-${index}`}
                              onChange={(e) =>
                                handleTagChange(e, index, "tagFile")
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor={`file-${index}`}
                              className="flex items-center justify-between w-full px-3 py-2 bg-white border border-dashed border-leafGreen/50 rounded-md cursor-pointer hover:bg-lightGreen transition-colors duration-200 text-sm text-gray-500"
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
                                className="text-leafGreen ml-2"
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
                                className="text-xs text-forestGreen hover:underline mt-1 inline-block"
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
                className="flex items-center justify-center w-full py-2 mt-2 bg-lightGreen text-forestGreen hover:text-leafGreen rounded-md transition-all duration-200 border border-leafGreen/20 hover:shadow-md"
              >
                <Plus size={16} className="mr-1" />
                <span className="text-sm font-medium">Add Tag</span>
              </button>
            </div>

            {/* Universal Materials Section - Available for all content types */}
            <div className="mx-auto bg-gray-50">
              <div className="bg-white">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <span className="block text-sm font-medium text-gray-700 mb-2">
                    Materials
                  </span>
                  <button
                    type="button"
                    onClick={addMaterialRow}
                    className="flex items-center gap-2 px-4 py-2 bg-leafGreen text-white rounded-lg   transition-colors font-medium text-sm shadow-sm"
                  >
                    <span className="text-lg">+</span>
                    Add Material
                  </button>
                </div>

                {!formData.materials || formData.materials.length === 0 ? (
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
                    {formData.materials.map((m, idx) => (
                      <div
                        key={idx}
                        className="group relative flex flex-col rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-2 p-3 border-b border-gray-100">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-lightGreen text-forestGreen">
                                M{idx + 1}
                              </span>
                              <div className="flex justify-between items-center sm:items-start sm:justify-start sm:flex-row gap-1">
                                <select
                                  value={m.material_type}
                                  onChange={(e) =>
                                    updateMaterialRow(
                                      idx,
                                      "material_type",
                                      e.target.value
                                    )
                                  }
                                  className="w-full sm:w-auto bg-white border border-gray-300 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                                >
                                  <option value="">Select Type</option>
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
                                      updateMaterialRow(
                                        idx,
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
                                    updateMaterialRow(
                                      idx,
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
                              onClick={() => removeMaterialRow(idx)}
                              className="p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 transition"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="p-3 space-y-3 grid grid-cols-1">
                          {m.material_type === "code" && (
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                              <CodeMirror
                                value={m.code || ""}
                                height="200px"
                                extensions={[
                                  getLanguageExtension(
                                    m.codeLanguage || "python"
                                  ),
                                ]}
                                onChange={(value) =>
                                  updateMaterialRow(idx, "code", value)
                                }
                                theme="light"
                                className="text-xs"
                              />
                            </div>
                          )}

                          {m.material_type &&
                            !["link", "code", ""].includes(m.material_type) && (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-leafGreen transition">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <label className="cursor-pointer text-xs font-medium text-forestGreen hover:text-leafGreen">
                                  Upload {m.material_type}
                                  <input
                                    type="file"
                                    onChange={(e) =>
                                      handleMaterialFile(idx, e.target.files[0])
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

                          {(m.file || m.url) && (
                            <div className="rounded-md bg-gray-50 p-2 border border-gray-200 flex items-center gap-2">
                              {m.material_type === "image" &&
                                (m.file || m.url) ? (
                                <img
                                  src={
                                    m.file
                                      ? URL.createObjectURL(m.file)
                                      : `${import.meta.env.VITE_BACKEND_MEDIA_URL
                                      }${m.url || "/placeholder.png"}`
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
                                  {m.file ? m.file.name : m.url}
                                </p>
                                <a
                                  href={
                                    m.file
                                      ? URL.createObjectURL(m.file)
                                      : `${import.meta.env.VITE_BACKEND_MEDIA_URL
                                      }${m.url}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-forestGreen hover:text-leafGreen underline"
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
          </div>

          {formData.content_type === "video" && (
            <div className="space-y-6 p-4 bg-white rounded-lg shadow mt-4 md:mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Video Content
              </h2>

              {/* Video Type Selection - Disabled in Edit mode */}
              <div className="bg-gray-50 md:p-4 rounded-lg mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Type* (Cannot be changed after creation)
                </label>
                <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="internal-video"
                      checked={formData.video_type === "internal"}
                      disabled={true}
                      className="h-4 w-4 accent-leafGreen border-gray-300 rounded focus:ring-leafGreen cursor-not-allowed opacity-60"
                    />
                    <label
                      htmlFor="internal-video"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Internal Video
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="youtube-video"
                      checked={formData.video_type === "youtube"}
                      disabled={true}
                      className="h-4 w-4 accent-leafGreen border-gray-300 rounded focus:ring-leafGreen cursor-not-allowed opacity-60"
                    />
                    <label
                      htmlFor="youtube-video"
                      className="ml-2 text-sm text-gray-700"
                    >
                      YouTube Video
                    </label>
                  </div>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  <i className="fas fa-info-circle mr-1"></i>
                  You cannot change the video type (internal/YouTube) after
                  creation.
                </p>
              </div>

              {/* Video Upload or YouTube URL */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
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
                        className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-leafGreen/20"
                      />
                    </div>

                    {videoPreview && (
                      <div className="mt-3 flex flex-col items-center">
                        <div className="relative w-full max-w-md">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full rounded-lg border border-leafGreen/30 shadow-md object-cover"
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
                            className="w-full rounded-lg border border-leafGreen/30 shadow-md object-cover"
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
                      value={formData.videoUrl || ""}
                      onChange={(e) => {
                        // Use regular handleChange but ensure it's treated as a simple string value
                        handleChange(e);
                      }}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
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
              <div className="bg-gray-50 md:p-4 rounded-lg">
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
                  className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                  placeholder="Auto-filled from file or YouTube; you can adjust"
                  required
                  disabled
                />
                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
                  <p className="font-mono text-xs text-slate-700">
                    mm:ss {decimalMinutesToMmSs(formData.videoDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(formData.videoDuration || 0)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">stored value uses decimal minutes; use hh:mm:ss for readability (hh hours, mm minutes, ss seconds).</p>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  *This field is disabled because the video duration is
                  auto-captured.
                </p>
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
              codeLanguages={codeLanguages}
              getLanguageExtension={getLanguageExtension}
            />
          )}

          {formData.content_type === "audio" && (
            <div className="space-y-4 md:space-y-6 p-4 bg-white rounded-lg shadow mt-4 md:mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Audio Content
              </h2>

              <div className="relative group">
                {audioImagePreview ? (
                  <div className="relative w-full h-64 border-2 border-gray-300 rounded-lg overflow-hidden hover:border-gray-400 transition-colors flex items-center justify-center bg-white">
                    {/* Preview Image */}
                    <img
                      src={audioImagePreview}
                      alt="Audio Image preview"
                      className="max-w-full max-h-full object-contain"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-4">
                      {/* Change Image */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <input
                          id="audioImageFile"
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleAudioImageFileChangeForAudio(
                              e,
                              "audioImageFile"
                            )
                          }
                          className="hidden"
                        />
                        <label
                          htmlFor="audioImageFile"
                          className="cursor-pointer bg-black bg-opacity-70 text-white p-3 rounded-full shadow-lg hover:bg-opacity-80 transition-all duration-200 flex items-center justify-center"
                        >
                          <Camera className="h-6 w-6" />
                        </label>
                      </div>

                      {/* Cancel Button */}
                      <button
                        type="button"
                        onClick={removeAudioImageFile}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Placeholder Upload Box */
                  <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center hover:border-gray-400 transition-colors">
                    <input
                      id="audioImageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleAudioImageFileChangeForAudio(e, "audioImageFile")
                      }
                      className="hidden"
                    />
                    <label htmlFor="audioImageFile" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload audio image
                      </p>
                    </label>
                  </div>
                )}
              </div>

              {/* Audio Upload/Text-to-Speech Section - Using TextToAudioConverter */}
              <TextToAudioConverter
                handleFileChange={handleAudioFileChangeForAudio}
                audioPreview={audioPreview}
                setAudioPreview={setAudioPreview}
                fieldName="audioFile"
                isExistingFile={topic?.topic.Audio?.url && !formData.audioFile}
                existingFileUrl={
                  topic?.topic.Audio?.url
                    ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.Audio.url
                    }`
                    : null
                }
              />

              {/* Audio Duration */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
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
                  className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                  placeholder="Auto-filled when audio is selected or generated; you can adjust"
                  required
                  disabled
                />
                <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
                  <p className="font-mono text-xs text-slate-700">
                    mm:ss {decimalMinutesToMmSs(formData.audioDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(formData.audioDuration || 0)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">stored value uses decimal minutes; use hh:mm:ss for readability (hh hours, mm minutes, ss seconds).</p>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  *This field is disabled because the audio duration is
                  auto-captured.
                </p>
              </div>
            </div>
          )}

          {formData.content_type === "general" && (
            <div className="space-y-4 md:space-y-6 p-4 bg-white rounded-lg shadow mt-4 md:mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                General Content
              </h2>
              {/* General Title Input */}
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title*
                </label>
                <input
                  type="text"
                  name="generalTitle"
                  value={formData.generalTitle || ""}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                  placeholder="Enter General title"
                  required
                />
              </div>
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description*
                </label>
                <Editor
                  apiKey={import.meta.env.VITE_TINYMCE_API}
                  value={formData.generalDescription || ""}
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
                  onEditorChange={handleGeneralEditorChange}
                />
                {/*<textarea
                  name="generalDescription"
                  value={formData.generalDescription || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, generalDescription: e.target.value }))}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter description"
                  required
                /> */}
              </div>
              <div className="bg-gray-50 md:p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Type*
                </label>
                <select
                  name="generalCompletionType"
                  value={formData.generalCompletionType || "audio"}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
                  required
                >
                  <option value="audio">Audio</option>
                  <option value="timer">Timer</option>
                </select>
              </div>
              {formData.generalCompletionType === "audio" ? (
                <div>
                  {/* Audio Upload/Text-to-Speech Section - Using TextToAudioConverter */}
                  <TextToAudioConverter
                    handleFileChange={handleAudioFileChangeForGeneral}
                    audioPreview={generalAudioPreview}
                    setAudioPreview={setGeneralAudioPreview}
                    fieldName="generalAudioFile"
                    isExistingFile={
                      topic?.topic?.GeneralMaterial?.audio_url &&
                      !(formData.generalAudioFile instanceof File)
                    }
                    existingFileUrl={
                      topic?.topic?.GeneralMaterial?.audio_url
                        ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${topic.topic.GeneralMaterial.audio_url
                        }`
                        : null
                    }
                  />
                </div>
              ) : (
                <div className="bg-gray-50 md:p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Time (minutes)*
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.generalCompletionTime || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        generalCompletionTime: e.target.value,
                      }))
                    }
                    placeholder="Enter time in minutes"
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              )}
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
              addSlideMaterialRow={addSlideMaterialRow}
              updateSlideMaterialRow={updateSlideMaterialRow}
              removeSlideMaterialRow={removeSlideMaterialRow}
              handleSlideMaterialFileChange={handleSlideMaterialFileChange}
              materialTypes={materialTypes}
              codeLanguages={codeLanguages}
              getLanguageExtension={getLanguageExtension}
              getAcceptType={getAcceptType}
            />
          )}

          <div className="rounded-lg border border-leafGreen/30 bg-lightGreen mt-4 p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="text-sm font-semibold text-forestGreen">Topic Duration Summary</h3>
              <span className="text-xs font-medium text-forestGreen bg-leafGreen/20 px-2.5 py-1 rounded-full w-fit">
                Whole Topic Final = Topic + Extra
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-leafGreen/20 p-3">
                <label className="block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-2">
                  Topic Duration (Whole Topic)
                </label>
                <input
                  type="text"
                  name="topic_duration"
                  value={Number(formData.topic_duration || 0).toFixed(2)}
                  readOnly
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-slate-600 cursor-not-allowed font-medium"
                />
              </div>

              <div className="bg-white rounded-lg border border-leafGreen/20 p-3">
                <label className="block text-xs font-semibold tracking-wide uppercase text-forestGreen mb-2">
                  Extra Duration (min)
                </label>
                <input
                  type="number"
                  name="extra_duration"
                  min="0"
                  step="0.01"
                  value={
                    formData.content_type === "slide" || isYouTubeTopicContent
                      ? "0.00"
                      : formData.extra_duration || ""
                  }
                  disabled={formData.content_type === "slide" || isYouTubeTopicContent}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      extra_duration: e.target.value,
                    }))
                  }
                  onBlur={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      extra_duration: normalizeMinuteSecondString(e.target.value),
                    }))
                  }
                  className="w-full border border-leafGreen/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="e.g. 2.00"
                />
              </div>

              <div className="bg-white rounded-lg border border-green-200 p-3">
                <label className="block text-xs font-semibold tracking-wide uppercase text-green-700 mb-2">
                  Final Topic Duration
                </label>
                <input
                  type="text"
                  name="total_duration"
                  value={Number(formData.total_duration || 0).toFixed(2)}
                  readOnly
                  className="w-full border border-green-200 bg-green-50 rounded-lg px-3 py-2 text-green-700 cursor-not-allowed font-semibold"
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-700 font-medium">
              This is the final duration for the whole topic. Slide duration summaries below are per slide only.
            </p>
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalents</p>
              <p className="font-mono text-xs text-slate-700">topic {decimalMinutesToMmSs(formData.topic_duration || 0)} • {decimalMinutesToHhMmSs(formData.topic_duration || 0)}</p>
              <p className="font-mono text-xs text-slate-700">extra {decimalMinutesToMmSs(formData.content_type === "slide" || isYouTubeTopicContent ? 0 : formData.extra_duration || 0)} • {decimalMinutesToHhMmSs(formData.content_type === "slide" || isYouTubeTopicContent ? 0 : formData.extra_duration || 0)}</p>
              <p className="font-mono text-xs text-slate-700">final {decimalMinutesToMmSs(formData.total_duration || 0)} • {decimalMinutesToHhMmSs(formData.total_duration || 0)}</p>
              <p className="mt-1 text-[11px] text-slate-500">stored values use decimal minutes; clock format is for readability only (hh hours, mm minutes, ss seconds).</p>
            </div>
          </div>

          <PermissionWrapper section="Topic" action="edit">
            <button
              type="submit"
              className="px-6 py-3 mt-6 bg-leafGreen text-white rounded-lg transition-all duration-300 transform shadow-md"
            >
              {isLoadingUpdate ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Update Topic"
              )}
            </button>
          </PermissionWrapper>
        </form>
      </div>

      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-96 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Select Languages</h2>

            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {languageOptions.map((lang) => (
                <label key={lang} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-leafGreen"
                    checked={formData?.languages?.includes(lang)}
                    onChange={() => {
                      setFormData((prev) => ({
                        ...prev,
                        languages: prev.languages?.includes(lang)
                          ? prev.languages?.filter((l) => l !== lang)
                          : [...prev?.languages, lang],
                      }));
                    }}
                  />
                  {lang}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="px-4 py-2 bg-leafGreen text-white rounded-lg  "
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
