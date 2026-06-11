/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
"use client";

/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Music,
  Video,
  ChevronDown,
  FileText,
  Loader2,
  SlidersIcon,
  ToggleLeft,
  ToggleRight,
  Upload,
  Plus,
  Paperclip,
  Tag,
  GripVertical,
  Type,
  Code,
  Sparkles,
  Link2,
  ArrowLeft,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  useCreateTopicMutation,
  useGetTopicsByModuleIdQuery,
  useUpdateTopicStatusMutation,
} from "../../../services/Course_Management/topicApi";
import { setTopicInfo } from "../../../features/Course_Management/topicSlice";
import { PlusCircle, X, Eye } from "lucide-react";
import Quiz from "../Quizes/Quiz";
import Assignment from "../Quizes/Assignment";
import { Editor } from "@tinymce/tinymce-react";
import VideoContent from "./Topic/VideoContent";
import AccordianContent from "./Topic/AccordianContent";
import AudioContent from "./Topic/AudioContent";
import GeneralContent from "./Topic/GeneralContent";
import SlideContent from "./Topic/SlideContent";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUpdateTopicSequenceMutation } from "../../../services/Course_Management/topicApi";
import TopicContentModal from "../../modal/TopicContentModal";
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
import PermissionWrapper from "../../../context/PermissionWrapper";
import AIContentGenerator from "../../Home/courses/AIContentGenrator";
import { base64ToFile } from "../../../utils/toFileObject";
import { slugify } from "../../../utils/slugify";
import ImportContentPopup from "../importContent/importContentPopUp";
import AdminLoader from "../AdminLoader";

const normalizeMinuteSecondValue = (rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === "") return 0;

  const valueAsString = String(rawValue).trim();
  const parsed = parseFloat(valueAsString);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;

  // Accept mm:ss input and convert to decimal minutes.
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

const decimalMinutesToHhMmSs = (minutes) => {
  const totalSeconds = Math.round((Number(minutes) || 0) * 60);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

// Sortable Topic Row Component
const SortableTopicRow = ({
  topic,
  index,
  handleStatusToggle,
  handleAddContent,
  navigate,
  isMobile = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  // Enhanced touch handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    listeners.onTouchStart(e);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    // Let dnd-kit handle the movement
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ${isDragging ? "bg-white shadow-lg border-2 border-leafGreen/50" : "hover:shadow-md hover:bg-gray-50"
          }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-base font-semibold text-forestGreen">
              {topic.title.charAt(0).toUpperCase() + topic.title.slice(1)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {topic.content_type}
            </p>
          </div>
          <div
            {...attributes}
            {...listeners}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={listeners.onTouchEnd}
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'none' }}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-grab flex-shrink-0 ${isDragging ? "bg-lightGreen ring-2 ring-leafGreen/50 cursor-grabbing" : "hover:bg-lightGreen"
              }`}
          >
            <GripVertical
              className={`w-4 h-4 transition-colors duration-200 ${isDragging ? "text-leafGreen" : "text-gray-400 hover:text-leafGreen"
                }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <PermissionWrapper section="Topic" action="toggle">
            <button
              onClick={() =>
                handleStatusToggle(topic.id, topic.status || "active")
              }
              className={`relative w-7 h-4 rounded-full transition-colors duration-300 ${topic.status !== "inactive" ? "bg-green-500" : "bg-gray-300"
                } disabled:opacity-50`}
              title={topic.status !== "inactive" ? "Activate" : "Deactivate"}
            >
              <span
                className={`absolute top-1/2 left-[3px] w-2.5 h-2.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${topic.status !== "inactive"
                  ? "translate-x-[13px]"
                  : "translate-x-0"
                  }`}
              />
            </button>
          </PermissionWrapper>

          <div className="flex items-center gap-2 flex-shrink-0">
            <PermissionWrapper section="Topic" action="view|edit">
              <button
                onClick={() =>
                  navigate(
                    `/admin/dashboard/course/topic/topics/${slugify(topic.title)}`,
                    {
                      state: { topicId: topic.public_hash },
                    }
                  )
                }
                className="text-emerald-600 hover:text-teal-600 transition-colors duration-300 flex items-center"
              >
                <Eye className="w-5 h-5 mr-1" />
                <span className="hidden sm:inline-flex">View</span>
              </button>
            </PermissionWrapper>

            <PermissionWrapper section="Topic Content" action="edit|create">
              <div className="col-span-2">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleAddContent(topic.id)}
                    className="md:px-4 p-2 gap-1 bg-leafGreen   text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center"
                  >
                    <PlusCircle className="w-4 h-4 md:mr-2" />
                    <span className="hidden sm:inline-flex">Select <span className="hidden ms:inline-flex">Content</span></span>
                  </button>
                </div>
              </div>
            </PermissionWrapper>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Table Row
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hidden md:table-row ${isDragging
        ? "bg-white shadow-lg border-2 border-forestGreen/50"
        : "hover:bg-lightGreen/20"
        } transition-colors duration-300`}
    >
      {/* Drag Handle */}
      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
        <div
          {...attributes}
          {...listeners}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={listeners.onTouchEnd}
          style={{ touchAction: 'none' }}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 cursor-grab ${isDragging ? "bg-lightGreen ring-2 ring-forestGreen/50 cursor-grabbing" : "hover:bg-lightGreen/50"
            }`}
        >
          <GripVertical
            className={`w-5 h-5 transition-colors duration-200 ${isDragging ? "text-forestGreen" : "text-gray-400 hover:text-forestGreen"
              }`}
          />
        </div>
      </td>

      {/* Title */}
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-forestGreen block truncate">
          {topic.title.charAt(0).toUpperCase() + topic.title.slice(1)}
        </span>
      </td>

      {/* Content Type */}
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-600 capitalize">{topic.content_type}</span>
      </td>

      {/* Add Content */}
      <PermissionWrapper section="Topic Content" action="edit|create">
        <td className="px-3 lg:px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleAddContent(topic.id)}
            className="px-3 py-1.5 bg-leafGreen text-white rounded-lg text-sm flex items-center gap-1 hover:bg-forestGreen transition-colors duration-200 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden xl:inline">Select Content</span>
            <span className="xl:hidden">Select</span>
          </button>
        </td>
      </PermissionWrapper>

      {/* Actions */}
      <PermissionWrapper section="Topic" action="view|edit|toggle">
        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-3">
            <PermissionWrapper section="Topic" action="toggle">
              <button
                onClick={() => handleStatusToggle(topic.id, topic.status || "active")}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${topic.status !== "inactive" ? "bg-green-500" : "bg-gray-300"
                  } disabled:opacity-50`}
                title={topic.status !== "inactive" ? "Deactivate" : "Activate"}
              >
                <span
                  className={`absolute top-1/2 left-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${topic.status !== "inactive" ? "translate-x-[20px]" : "translate-x-0"
                    }`}
                />
              </button>
            </PermissionWrapper>

            <PermissionWrapper section="Topic" action="view|edit">
              <button
                onClick={() =>
                  navigate(
                    `/admin/dashboard/course/topic/topics/${slugify(topic.title)}`,
                    { state: { topicId: topic.public_hash } }
                  )
                }
                className="text-forestGreen hover:text-leafGreen transition-colors duration-300"
                title="View Topic"
              >
                <Eye size={18} />
              </button>
            </PermissionWrapper>
          </div>
        </td>
      </PermissionWrapper>
    </tr>
  );
};

export default function Topics() {
  const { courseId, sessionId, moduleId, mId } = useLocation().state;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { access_token } = useSelector((state) => state.auth);
  const { id } = useSelector((state) => state.user);
  const { modules } = useSelector((state) => state.module);
  const [topics, setTopics] = useState([]);
  const { role } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    course_id: courseId,
    session_id: sessionId,
    module_id: moduleId,
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
        codeLanguage: "",
        code: "",
        mediaUrl: [],
        accordianAudioFile: null,
        accordianCompletionType: "audio",
        accordianCompletionTime: 1,
        tags: [], // Initialize with empty array
      },
    ],
    generalFile: null,
    generalDescription: "",
    generalTitle: "",
    materialType: "",
    externalLink: "",
    codeLanguage: "",
    code: "",
    slides: [
      {
        title: "",
        description: "",
        content_type: "",
        videoFile: null,
        slideCompletionType: "audio",
        slideCompletionTime: 1,
        slideAudioFile: null,
        videoDuration: "",
        audioFile: null,
        audioImageFile: null,
        audioDuration: "",
        accordianSections: [
          {
            title: "",
            body: "",
            codeLanguage: "",
            code: "",
            mediaUrl: [],
          },
        ],
        generalFile: null,
        materialType: "",
        externalLink: "",
        slide_extra_duration: "0",
      },
    ],
    status: "active",
    tags: [],
    materials: [],
    videoUrl: "", // For YouTube URL
    video_type: "internal",
    languages: [],
  });

  const languageOptions = [
    "JavaScript", "HTML", "CSS", "TypeScript", "PHP",
    "Python", "Dart", "C", "C++", "C#", "Java", "Go", "HTML/CSS/JavaScript"
  ]
  const [moduleTitle, setModuleTitle] = useState("");
  const [activeModuleId, setActiveModuleId] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeComponent, setActiveComponent] = useState("Assignment");
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  const {
    data: topicsData,
    isSuccess: isSuccessGetTopics,
    isLoading: isLoadingGetTopics,
    refetch: refetchTopics
  } = useGetTopicsByModuleIdQuery({ id: moduleId, access_token });
  const [
    createTopic,
    { isLoading: isLoadingCreateTopic, isSuccess: isSuccessCreateTopic },
  ] = useCreateTopicMutation();

  const [updateTopicStatus] = useUpdateTopicStatusMutation();

  const contentTypes = [
    { value: "video", label: "Video", icon: Video },
    { value: "audio", label: "Audio", icon: Music },
    { value: "accordian", label: "Accordian", icon: ChevronDown },
    { value: "general", label: "General", icon: FileText },
    { value: "slide", label: "Slides", icon: SlidersIcon },
  ];

  const materialTypes = [
    { value: "pdf", label: "PDF Document" },
    { value: "link", label: "External Link" },
    { value: "document", label: "Document" },
    { value: "image", label: "Image" },
    { value: "code", label: "Code" },
    { value: "other", label: "Other" },
  ];

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

  const notifySuccess = (message) => toast.success(message);
  const notifyError = (error) => toast.error(error);

  const [updateTopicSequence] = useUpdateTopicSequenceMutation();

  // Function to populate form with generated topic data
  const handleUseGeneratedTopic = (topic) => {

    // Process tags and convert base64 tag files to File objects
    const processedTags = topic.tags
      ? topic.tags.map((tag, index) => {
        const processedTag = { ...tag };

        // Convert tag file from base64 to File object if it exists
        if (tag.tagFile && typeof tag.tagFile === "object") {
          const fileName =
            tag.tagFile.name ||
            `tag_${tag.tagName || index}_${Date.now()}.png`;
          const mimeType = tag.tagFile.type || "image/png";
          processedTag.tagFile = base64ToFile(
            tag.tagFile.data,
            fileName,
            mimeType
          );
          processedTag.tag_type = "file";
        }

        return processedTag;
      })
      : [{ tagName: "", tagFile: null, tag_type: "file", codeLanguage: "" }];

    // Process materials and convert base64 files to File objects (similar to tags)
    const processedMaterials = topic.materials
      ? topic.materials.map((material, index) => {
        const processedMaterial = { ...material };

        // If there's a file object (base64), convert it
        if (material.file && typeof material.file === "object") {
          const fileName =
            material.file.name ||
            `material_${material.material_type || index}_${Date.now()}.dat`;
          const mimeType = material.file.type || "application/octet-stream";
          processedMaterial.file = base64ToFile(
            material.file.data,
            fileName,
            mimeType
          );
        }

        // If it's an image or audio with direct URL, ensure proper structure
        if (material.material_type === "image" && material.url) {
          processedMaterial.file_type = "image";
        } else if (material.material_type === "other" && material.url) {
          processedMaterial.file_type = "audio";
        } else if (material.material_type === "code") {
          processedMaterial.file_type = "code";
        }

        // Add index for ordering
        processedMaterial.index = index;

        return processedMaterial;
      })
      : [];

    // Base form data that applies to all content types
    const baseFormData = {
      title: topic.title || "",
      description: topic.description || "",
      content_type: topic.content_type || "",
      estimated_duration: topic.estimated_duration?.toString() || "",
      content_outline: topic.content_outline || "",
      status: topic.status || "active",
      module_id: moduleId,
      tags: processedTags || [
        { tagName: "", tagFile: null, tag_type: "file", codeLanguage: "" },
      ],
      materials: processedMaterials
    };

    // Content-type-specific initialization
    let contentSpecificData = {};

    switch (topic.content_type) {
      case "video":
        contentSpecificData = {
          videoFile: null,
          videoDuration:
            topic.videoDuration || topic.estimated_duration?.toString() || "",
          video_type: topic.video_type || "internal",
          videoUrl: topic.videoUrl || "",
        };
        break;

      case "audio":
        let audio = topic.audio_file
          ? base64ToFile(
            topic.audio_file.data,
            topic.audio_file.name,
            topic.audio_file.type
          )
          : null;
        let audioImage = topic.audio_image_file
          ? base64ToFile(
            topic.audio_image_file.data,
            topic.audio_image_file.name,
            topic.audio_image_file.type
          )
          : null;
        contentSpecificData = {
          audioFile: audio,
          audioImageFile: audioImage,
          audioDuration:
            topic.audioDuration || topic.estimated_duration?.toString() || "",
        };
        break;

      case "accordian":
        if (topic.accordianSections?.length > 0) {
          const formattedSections = [];

          for (const section of topic.accordianSections) {
            formattedSections.push({
              title: section.title || "",
              body: section.body || "",
              codeLanguage: section.codeLanguage || "",
              code: section.code || "",
              mediaUrl: section.mediaUrl || [],
              accordianAudioFile: section.audio_file
                ? base64ToFile(
                  section.audio_file.data,
                  section.audio_file.name,
                  section.audio_file.type
                )
                : null,
              accordianCompletionType:
                section.accordianCompletionType || "audio",
              accordianCompletionTime: section.accordianCompletionTime || 1,
              audio_script: section.audio_script || "",
              tags: section.tags || [],
            });
          }

          contentSpecificData = {
            accordianSections: formattedSections,
          };
        } else {
          // fallback if no accordianSections are provided
          contentSpecificData = {
            accordianSections: [
              {
                title: topic.title || "",
                body: topic.content_outline || topic.description || "",
                codeLanguage: "",
                code: "",
                mediaUrl: [],
                accordianAudioFile: null,
                accordianCompletionType: "audio",
                accordianCompletionTime: 0,
                tags: [],
              },
            ],
          };
        }
        break;

      case "general":
        contentSpecificData = {
          generalFile: null,
          generalDescription:
            topic.generalDescription ||
            topic.content_outline ||
            topic.description ||
            "",
          generalTitle: topic.generalTitle || "",
          materialType: topic.materialType || "document",
          externalLink: topic.externalLink || "",
          generalMaterials: topic.materials.map((material) => ({
            ...material,
            file: material.file
              ? base64ToFile(
                material.file.data,
                material.file.name,
                material.file.type
              )
              : null,
          })),
          codeLanguage: topic.codeLanguage || "",
          code: topic.code || "",
          generalCompletionType: topic.generalCompletionType || "audio",
          generalCompletionTime:
            topic.generalCompletionTime || topic.estimated_duration || 0,
          generalAudioFile: topic.generalAudioFile
            ? base64ToFile(
              topic.generalAudioFile.data,
              topic.generalAudioFile.name,
              topic.generalAudioFile.type
            )
            : null,
        };
        break;

      case "slide":

        const processMaterials = (materials) => {
          return materials
            ? materials.map((material, index) => {
              const processedMaterial = { ...material };

              if (material.file && typeof material.file === "object") {
                const fileName =
                  material.file.name ||
                  `material_${material.material_type || index}_${Date.now()}.dat`;
                const mimeType = material.file.type || "application/octet-stream";
                processedMaterial.file = base64ToFile(
                  material.file.data,
                  fileName,
                  mimeType
                );
              }

              if (material.material_type === "image" && material.url) {
                processedMaterial.file_type = "image";
              } else if (material.material_type === "audio" && material.url) {
                processedMaterial.file_type = "audio";
              } else if (material.material_type === "code") {
                processedMaterial.file_type = "code";
              }

              processedMaterial.index = index;
              return processedMaterial;
            })
            : [];
        };

        // Handle slides - use provided slides array or create default
        const processSlide = (slide) => {
          const baseSlide = {
            title: slide.title || "",
            description: slide.description || "",
            content_type: slide.content_type || "general",
            slideCompletionType: slide.slideCompletionType || "audio",
            slideCompletionTime: slide.slideCompletionTime || 0,
            slideAudioFile: slide.slideAudioFile
              ? base64ToFile(
                slide.slideAudioFile.data,
                slide.slideAudioFile.name,
                slide.slideAudioFile.type
              )
              : null,
            materials: processMaterials(slide.materials || []),
          };

          // Add content-type specific properties based on slide's content_type
          switch (slide.content_type) {
            case "video":
              return {
                ...baseSlide,
                videoFile: null,
                videoDuration: slide.videoDuration || "",
              };

            // uncomment to add Slide Type Audio
            case "audio":
              return {
                ...baseSlide,
                audioFile: slide.audioFile ? base64ToFile(slide.audioFile.data, slide.audioFile.name, slide.audioFile.type) : null,
                audioDuration: slide.audioDuration || "",
              };

            case "accordian":
              return {
                ...baseSlide,
                accordianSections: slide.accordianSections || [
                  {
                    title: "",
                    body: "",
                    codeLanguage: "",
                    code: "",
                    mediaUrl: [],
                  },
                ],
              };

            case "general":
            default:
              return {
                ...baseSlide,
                generalFile: null,
                materialType: slide.materialType || "document",
                externalLink: slide.externalLink || "",
              };
          }
        };

        contentSpecificData = {
          slides: topic.slides
            ? topic.slides.map(processSlide)
            : [
              processSlide({
                title: topic.title || "",
                description: topic.description || "",
                content_type: "general",
                slideCompletionType: "audio",
                slideCompletionTime: topic.estimated_duration || 0,
                materialType: "document",
                externalLink: "",
                tags: [],
              }),
            ],
        };
        break;

      default:
        // For unknown content types, use general as fallback
        contentSpecificData = {
          generalFile: null,
          generalDescription: topic.content_outline || topic.description || "",
          materialType: "document",
          externalLink: "",
          codeLanguage: "",
          code: "",
          generalCompletionType: "audio",
          generalCompletionTime: topic.estimated_duration || 0,
          generalAudioFile: null,
        };
        break;
    }

    // Merge base data with content-specific data
    const finalFormData = {
      ...baseFormData,
      ...contentSpecificData,
    };

    setFormData(finalFormData);

    toast.success(
      `${topic.content_type.charAt(0).toUpperCase() + topic.content_type.slice(1)
      } topic data populated successfully!`
    );
  };

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // window.scrollTo(0, 0)
    if (topicsData && isSuccessGetTopics) {
      const sortedTopics = [...topicsData].sort(
        (a, b) => a.sequence_no - b.sequence_no
      );
      setTopics(sortedTopics);
      dispatch(setTopicInfo({ topics: sortedTopics }));
    }
  }, [topicsData, isSuccessGetTopics, dispatch]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      setTopics((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newArray = arrayMove(items, oldIndex, newIndex);

        // Update sequence in the backend
        const updatedSequence = newArray.map((topic) => topic.id);
        updateTopicSequence({
          sequence: updatedSequence,
          access_token,
        }).catch((error) => {
          console.error("Sequence update failed", error);
        });

        return newArray;
      });
    }
    setActiveId(null);
  };

  // useEffect(() => {
  //   if (!id) {
  //     navigate("/admin/dashboard")
  //     return
  //   }
  // }, [id, navigate])

  useEffect(() => {
    if (!modules || modules.length === 0) {
      navigate("/admin/dashboard");
      return;
    }
    fetchModuleTitle();
  }, [modules, moduleId, navigate]);

  useEffect(() => {
    if (topicsData && isSuccessGetTopics) {
      const sortedTopics = [...topicsData].sort(
        (a, b) => a.sequence_no - b.sequence_no
      );
      setTopics(sortedTopics);
      dispatch(setTopicInfo({ topics: sortedTopics }));
    }
  }, [topicsData, isSuccessGetTopics, dispatch]);

  const fetchModuleTitle = async () => {
    const title = modules.find(
      (module) => module.public_hash === moduleId
    )?.title;
    const id = modules.find((module) => module.public_hash === moduleId)?.id;

    setModuleTitle(title);
    setActiveModuleId(id);
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
        : (content_type === "video" && formData.video_type === "youtube")
          ? 0
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
        (formData.content_type === "video" && formData.video_type === "youtube")) &&
      normalizeMinuteSecondString(formData.extra_duration || "0.00") !== "0.00"
    ) {
      setFormData((prev) => ({
        ...prev,
        extra_duration: "0.00",
      }));
    }
  }, [formData.content_type, formData.extra_duration, formData.video_type]);

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

  const addBulletPoint = () => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      bulletPoints: [
        ...prevFormData.bulletPoints,
        { timestamp: "", bullet: "" },
      ],
    }));
  };

  const removeBulletPoint = (index) => {
    const newBulletPoints = formData.bulletPoints.filter((_, i) => i !== index);
    setFormData({ ...formData, bulletPoints: newBulletPoints });
  };

  const handleChange = (e) => {
    const { name, value } = e.target || {};

    if (name === "content_type") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        extra_duration: value === "slide" ? "0.00" : "0",
        videoFile: null,
        generalCompletionType: "audio",
        generalCompletionTime: 0,
        generalAudioFile: null,
        videoDuration: "",
        audioFile: null,
        audioImageFile: null,
        audioDuration: "",
        accordianSections: [
          {
            title: "",
            body: "",
            mediaUrl: [],
            accordianCompletionType: "audio",
            accordianCompletionTime: 0,
            accordianAudioFile: null,
          },
        ],
        generalFile: null,
        materialType: "",
        externalLink: "",
        codeLanguage: "",
        code: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleEditorChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      description: content,
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      [fieldName]: file,
    }));
  };

  const handleAccordianChange = (index, field, value) => {
    setFormData((prev) => {
      const newSections = prev.accordianSections.map((sec, i) => {
        if (i !== index) return sec;
        if (
          field === "title" ||
          field === "body" ||
          field === "codeLanguage" ||
          field === "code" ||
          field === "accordianCompletionType" ||
          field === "accordianCompletionTime" ||
          field === "accordianAudioDuration" ||
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
        } else if (field === "accordianAudioUrl") {
          return { ...sec, accordianAudioFile: value };
        }
        return sec;
      });
      return { ...prev, accordianSections: newSections };
    });
  };

  const addAccordianSection = () => {
    setFormData((prev) => ({
      ...prev,
      accordianSections: [
        ...prev.accordianSections,
        {
          title: "",
          body: "",
          mediaUrl: [],
          accordianCompletionType: "audio",
          accordianCompletionTime: 0,
          accordianAudioFile: null,
        },
      ],
    }));
  };

  const removeAccordianSection = (index) => {
    const updatedSections = formData.accordianSections.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      accordianSections: updatedSections,
    }));
  };

  const handleTagChange = (e, index, field) => {
    setFormData((prevFormData) => {
      const newTags = [...prevFormData.tags];
      if (field === "tagFile") {
        if (newTags[index].tag_type === "file") {
          // Handle file input
          newTags[index] = {
            ...newTags[index],
            [field]: e.target.files?.[0] || null,
          };
        } else {
          // Handle code input - store code content in tagFile for code-type tags
          newTags[index] = {
            ...newTags[index],
            [field]: e.target.value,
          };
          // If this is code and no language is set, default to "python"
          if (
            newTags[index].tag_type === "code" &&
            !newTags[index].codeLanguage
          ) {
            newTags[index].codeLanguage = "python";
          }
        }
      } else if (field === "tag_type") {
        // Reset tagFile and codeLanguage when switching types
        const newValue = e.target.value;
        newTags[index] = {
          ...newTags[index],
          [field]: newValue,
          tagFile: null,
          // Default to python for code type
          codeLanguage: newValue === "code" ? "python" : "",
        };
      } else {
        // Handle other fields (tagName, codeLanguage)
        newTags[index] = {
          ...newTags[index],
          [field]: e.target.value,
        };
      }
      return { ...prevFormData, tags: newTags };
    });
  };

  const addTag = () => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      tags: [
        ...prevFormData.tags,
        { tagName: "", tagFile: null, tag_type: "file", codeLanguage: "" },
      ],
    }));
  };

  const removeTag = (index) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({ ...formData, tags: newTags });
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

  const handleMaterialFile = (index, file) => {
    if (!file) return;
    setFormData((prev) => {
      const list = [...prev.materials];

      if (!isValidMaterialFile(file, list[index].material_type)) {
        toast.error(`Invalid file for type: ${list[index].material_type}`);
        return prev;
      }

      list[index] = { ...list[index], file };
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

  const renderContentTypeForm = () => {
    const commonProps = {
      formData,
      handleChange,
      handleFileChange,
      handleBulletPointChange,
      addBulletPoint,
      removeBulletPoint,
    };
    switch (formData.content_type) {
      case "video":
        return <VideoContent {...commonProps} />;
      case "audio":
        return <AudioContent {...commonProps} />;
      case "accordian":
        return (
          <AccordianContent
            {...commonProps}
            handleAccordianChange={handleAccordianChange}
            addAccordianSection={addAccordianSection}
            removeAccordianSection={removeAccordianSection}
            setFormData={setFormData}
            codeLanguages={codeLanguages}
            getLanguageExtension={getLanguageExtension}
          />
        );
      case "general":
        return (
          <GeneralContent
            {...commonProps}
            setFormData={setFormData}
            codeLanguage={formData.codeLanguage}
            code={formData.code}
          />
        );

      case "slide":
        return (
          <SlideContent
            {...commonProps}
            codeLanguages={codeLanguages}
            getLanguageExtension={getLanguageExtension}
            normalizeMinuteSecondString={normalizeMinuteSecondString}
            getAcceptType={getAcceptType}
            isValidMaterialFile={isValidMaterialFile}
          />
        );
      default:
        return null;
    }
  };

  const isYouTubeTopicContent =
    formData.content_type === "video" && formData.video_type === "youtube";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    const normalizedTopicExtraDuration =
      formData.content_type === "slide" ||
        (formData.content_type === "video" && formData.video_type === "youtube")
        ? "0.00"
        : normalizeMinuteSecondString(formData.extra_duration || "0.00");

    Object.keys(formData).forEach((key) => {
      if (
        (formData[key] !== undefined && formData[key] !== null && formData[key] !== "") &&
        ![
          "videoFile",
          "audioFile",
          "audioImageFile",
          "generalFile",
          "generalAudioFile",
          "accordianSections",
          "slides",
          "tags",
          "materials",
          "topic_duration",
          "extra_duration",
          "total_duration",
          "languages"      // ⭐ ADD THIS LINE
        ].includes(key)
      ) {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (formData.languages) {
      formDataToSend.append("languages", JSON.stringify(selectedLanguages));
    }

    if (formData.tags && formData.tags.length > 0) {
      formData.tags.forEach((tag, index) => {
        if (tag.tag_type === "file" && tag.tagFile) {
          formDataToSend.append(`tagFile[${index}]`, tag.tagFile);
        }
      });

      formDataToSend.append(
        "tags",
        JSON.stringify(
          formData.tags.map((tag) => {
            // Ensure code language is set for code-type tags
            let finalCodeLanguage = tag.codeLanguage;
            if (
              tag.tag_type === "code" &&
              (!finalCodeLanguage || finalCodeLanguage === "")
            ) {
              finalCodeLanguage = "python"; // Default to Python if no language selected
            }

            return {
              id: tag.id || null,
              tagName: tag.tagName,
              tagFile:
                tag.tag_type === "file"
                  ? tag.tagFile
                    ? tag.tagFile.name
                    : null
                  : tag.tagFile, // For code type, send the actual code content in tagFile
              tag_type: tag.tag_type,
              codeLanguage: tag.tag_type === "code" ? finalCodeLanguage : null,
              existingFile: tag.existingFile,
            };
          })
        )
      );
    }

    // In handleSubmit function, add this after the content-type switch cases:
    if (formData.materials && formData.materials.length > 0) {
      formData.materials.forEach((m, idx) => {
        if (!m.material_type) return;
        const entry = { material_type: m.material_type };

        if (m.material_type === "link") {
          if (m.link) entry.url = m.link;
        } else if (m.material_type === "code") {
          // For code type, include code and language in the entry
          entry.code = m.code || "";
          entry.codeLanguage = m.codeLanguage || "python";
        } else if (m.file instanceof File) {
          const fieldName = `material[${idx}]`;
          formDataToSend.append(fieldName, m.file);
          entry.file_field = fieldName;
        }
      });

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
              url,
              code: material.material_type === "code" ? material.code : null,
              codeLanguage:
                material.material_type === "code"
                  ? material.codeLanguage || "python"
                  : null,
            };
          })
        )
      );
    }

    switch (formData.content_type) {
      case "video":
        if (formData.video_type !== "youtube") {
          formDataToSend.append("videoUrl", formData.videoFile);
        }
        formDataToSend.append("content[video_type]", formData.video_type);
        formDataToSend.append("content[duration_minutes]", normalizeMinuteSecondString(formData.videoDuration));

        break;

      case "audio":
        formDataToSend.append("audioUrl", formData.audioFile);
        formDataToSend.append("content[duration_minutes]", normalizeMinuteSecondString(formData.audioDuration));
        formDataToSend.append("audioImageUrl", formData.audioImageFile);
        break;
      case "accordian":
        const processedAccordianSections = formData.accordianSections.map(
          (section, sectionIndex) => {
            const processedSection = { ...section };

            if (
              processedSection.mediaUrl &&
              Array.isArray(processedSection.mediaUrl)
            ) {
              const processedMedia = [];
              processedSection.mediaUrl.forEach((media, index) => {
                if (media.url instanceof File) {
                  formDataToSend.append(
                    `accordionAttachment[${sectionIndex}][${index}]`,
                    media.url
                  );
                  processedMedia.push({ url: "", fileType: media.fileType });
                } else {
                  processedMedia.push({
                    url: media.url,
                    fileType: media.fileType,
                  });
                }
              });
              processedSection.mediaUrl = processedMedia;
            }

            processedSection.codeLanguage = section.codeLanguage || "";
            processedSection.code = section.code || "";

            // Include section index in the field name when appending
            if (processedSection.accordianAudioFile) {
              formDataToSend.append(
                `accordionAudioUrls[${sectionIndex}]`,
                processedSection.accordianAudioFile
              );
              // Add an index property to track which accordion this belongs to
              processedSection.index = sectionIndex;
            }

            processedSection.accordianAudioDuration =
              processedSection.accordianCompletionType === "audio"
                ? normalizeMinuteSecondValue(processedSection.accordianAudioDuration)
                : 0;

            // Append tag files for the accordion section
            if (section.tags && Array.isArray(section.tags)) {
              section.tags.forEach((tag, tagIndex) => {
                if (tag.tagFile) {
                  formDataToSend.append(`accordionTagFile`, tag.tagFile);
                }
              });
            }

            return processedSection;
          }
        );

        formDataToSend.append(
          "content",
          JSON.stringify(processedAccordianSections)
        );
        break;

      case "general":
        formDataToSend.append(
          "content[description]",
          formData.generalDescription
        );
        formDataToSend.append("content[title]", formData.generalTitle);
        formDataToSend.append(
          "content[codeLanguage]",
          formData.codeLanguage || ""
        );
        formDataToSend.append("content[code]", formData.code || "");
        formDataToSend.append(
          "content[completion_type]",
          formData.generalCompletionType || "audio"
        );
        if (
          formData.generalCompletionType === "timer" &&
          formData.generalCompletionTime
        ) {
          formDataToSend.append(
            "content[completion_time]",
            formData.generalCompletionTime
          );
        }
        // Only append audio file when provided as a File
        if (
          formData.generalCompletionType === "audio" &&
          formData.generalAudioFile instanceof File
        ) {
          formDataToSend.append("generalAudioUrl", formData.generalAudioFile);
        }
        // Send duration for general if audio
        if (formData.generalCompletionType === "audio") {
          formDataToSend.append("content[duration_minutes]", normalizeMinuteSecondString(formData.generalAudioDuration || "0"));
          formDataToSend.append("generalAudioDuration", normalizeMinuteSecondString(formData.generalAudioDuration || "0"));
        } else {
          formDataToSend.append("content[duration_minutes]", "0");
        }
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
              if (slide.videoFile instanceof File) {
                formDataToSend.append(
                  `slide_video[${slideIndex}]`,
                  slide.videoFile
                );
                // Include section index in the field name when appending
              }
              break;

            // case "audio":
            //   if (slide.audioFile instanceof File) {
            //     formDataToSend.append(`slide_audio[${slideIndex}]`, slide.audioFile)
            //   }
            //   break

            // case "general":
            //   const materialsPayload = []
            //   if (Array.isArray(slide.materials)) {
            //     slide.materials.forEach((m, mIdx) => {
            //       if (!m.material_type) return
            //       const entry = { material_type: m.material_type }
            //       if (m.material_type === 'link') {
            //         if (m.link) entry.url = m.link
            //       } else if (m.file instanceof File) {
            //         const fieldName = `slide_general[${slideIndex}][${mIdx}]`
            //         formDataToSend.append(fieldName, m.file)
            //         entry.file_field = fieldName
            //       }
            //       materialsPayload.push(entry)
            //     })
            //   }
            //   processedSlide.materials = materialsPayload
            //   break

            case "accordian":
              if (processedSlide.accordianSections) {
                processedSlide.accordianSections =
                  processedSlide.accordianSections.map(
                    (section, sectionIndex) => {
                      const processedSection = { ...section };

                      processedSection.codeLanguage =
                        section.codeLanguage || "";
                      processedSection.code = section.code || "";

                      if (
                        processedSection.mediaUrl &&
                        Array.isArray(processedSection.mediaUrl)
                      ) {
                        const processedMedia = [];
                        processedSection.mediaUrl.forEach(
                          (media, mediaIndex) => {
                            if (media.url instanceof File) {
                              const fileKey = `slide_accordion[${slideIndex}][${sectionIndex}][${mediaIndex}]`;
                              formDataToSend.append(fileKey, media.url);
                              processedMedia.push({
                                url: fileKey,
                                fileType: media.fileType,
                                isFileRef: true,
                              });
                            } else {
                              processedMedia.push(media);
                            }
                          }
                        );
                        processedSection.mediaUrl = processedMedia;
                      }

                      // Append tag files for the accordion section in slides
                      if (section.tags && Array.isArray(section.tags)) {
                        section.tags.forEach((tag, tagIndex) => {
                          if (tag.tagFile) {
                            formDataToSend.append(
                              `accordionTagFile`,
                              tag.tagFile
                            );
                          }
                        });
                      }

                      return processedSection;
                    }
                  );
              }
              break;
          }

          // Append tag files for the slide
          if (slide.tags && Array.isArray(slide.tags)) {
            slide.tags.forEach((tag, tagIndex) => {
              if (tag.tagFile) {
                formDataToSend.append(`slideTagFile`, tag.tagFile);
              }
            });
          }

          // Process slide materials similar to topic-level materials
          if (Array.isArray(slide.materials) && slide.materials.length > 0) {
            const slideMaterialsPayload = [];
            slide.materials.forEach((m, mIdx) => {
              if (!m.material_type) return;
              if (m.material_type === "link") {
                slideMaterialsPayload.push({
                  id: m.id || null,
                  material_type: m.material_type,
                  url: m.link || null,
                  code: null,
                  codeLanguage: null,
                });
              } else if (m.material_type === "code") {
                slideMaterialsPayload.push({
                  id: m.id || null,
                  material_type: "code",
                  url: null,
                  code: m.code || "",
                  codeLanguage: m.codeLanguage || "python",
                });
              } else if (m.file instanceof File) {
                const fieldName = `slide_material[${slideIndex}][${mIdx}]`;
                formDataToSend.append(fieldName, m.file);
                slideMaterialsPayload.push({
                  id: m.id || null,
                  material_type: m.material_type,
                  url: fieldName,
                  code: null,
                  codeLanguage: null,
                });
              } else {
                slideMaterialsPayload.push({
                  id: m.id || null,
                  material_type: m.material_type,
                  url: m.url || null,
                  code: null,
                  codeLanguage: null,
                });
              }
            });
            processedSlide.materials = slideMaterialsPayload;
          }

          // Append slide completion audio file if present (non-video slides)
          if (
            slide.slideCompletionType === "audio" &&
            slide.slideAudioFile &&
            slide.content_type !== "video"
          ) {
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

    // Append durations to the root for backend check
    formDataToSend.append("topic_duration", normalizeMinuteSecondString(formData.topic_duration || "0"));
    formDataToSend.append("extra_duration", normalizedTopicExtraDuration);
    formDataToSend.append("total_duration", normalizeMinuteSecondString(formData.total_duration || "0"));

    // Debug: log FormData contents for inspection (keys and file info)
    try {
      console.groupCollapsed("FormData preview");
      for (const pair of formDataToSend.entries()) {
        const [key, value] = pair;
        if (!(value instanceof File)) {
          let display = value;
          try {
            if (typeof value === "string") {
              const parsed = JSON.parse(value);
              display = parsed;
            }
          } catch (e) {
            // not JSON
          }
        }
      }
      console.groupEnd();

      const res = await createTopic({
        topic: formDataToSend,
        access_token,
      }).unwrap();

      resetForm();
      setIsFormVisible(false);
      notifySuccess("Topic added successfully");
    } catch (error) {
      const errorMessage =
        error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "An unexpected error occurred";
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: courseId,
      session_id: sessionId,
      module_id: moduleId,
      title: "",
      description: "",
      content_type: "",
      sequence_no: "",
      videoFile: null,
      generalCompletionType: "audio",
      generalCompletionTime: 1,
      generalAudioFile: null,
      generalAudioDuration: "0.00",
      videoDuration: "",
      audioFile: null,
      audioImageFile: null,
      audioDuration: "",
      accordianSections: [
        {
          title: "",
          body: "",
          mediaUrl: [],
          accordianCompletionType: "audio",
          accordianCompletionTime: 1,
          accordianAudioFile: null,
        },
      ],
      generalFile: null,
      materialType: "",
      externalLink: "",
      generalDescription: "",
      generalTitle: "",
      slides: [
        {
          title: "",
          description: "",
          content_type: "",
          videoFile: null,
          slideCompletionType: "audio",
          slideCompletionTime: 1,
          slideAudioFile: null,
          videoDuration: "",
          audioFile: null,
          audioImageFile: null,
          audioDuration: "",
          accordianSections: [
            {
              title: "",
              body: "",
              codeLanguage: "",
              code: "",
              mediaUrl: [],
            },
          ],
          generalFile: null,
          materialType: "",
          externalLink: "",
        },
      ],
      status: "active",
      materials: [],
      tags: [
        { tagName: "", tagFile: null, tag_type: "file", codeLanguage: "" },
      ], // Reset tags field
      video_type: "internal", // Reset to default video type
      videoUrl: "", // Reset YouTube URL
    });
    setSelectedLanguages([]);
  };

  const handleStatusToggle = async (topicId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await updateTopicStatus({
        topicId,
        status: newStatus,
        access_token,
      }).unwrap();

      setTopics(
        topics.map((topic) =>
          topic.id === topicId ? { ...topic, status: newStatus } : topic
        )
      );

      notifySuccess(
        `Topic ${newStatus === "active" ? "activated" : "deactivated"
        } successfully`
      );
    } catch (error) {
      console.error("Status update failed", error);
      notifyError(error?.data?.error || "Failed to update topic status");
    }
  };

  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  const handleAddContent = (topicId) => {
    setSelectedTopicId(topicId);
    setIsContentModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsContentModalOpen(false);
    setSelectedTopicId(null);
  };

  if (isLoadingGetTopics) {
    return <AdminLoader className="h-screen" message="Loading topics..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full p-4">
          <div className="flex items-center justify-between">
            {/* Left Section: Title and Subtitle */}
            <div className="grid">
              <h1 className="text-2xl font-bold text-forestGreen">Topics</h1>
              <p className="text-gray-600 mt-1 truncate">Module: {moduleTitle}</p>
            </div>

            {/* Right Section: Buttons */}
            <div className="flex items-center gap-4 flex-wrap relative">
              {/* Buttons for lg and above */}
              <div className="hidden lg:flex items-center gap-3 flex-wrap">
                <PermissionWrapper section="Topic" action="create">
                  <button
                    onClick={() => {
                      resetForm();
                      setIsFormVisible(!isFormVisible);
                    }}
                    className="bg-leafGreen text-white px-4 xl:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm whitespace-nowrap"
                  >
                    {isFormVisible ? (
                      <>
                        <X size={18} />
                        <span>Hide Form</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle size={18} />
                        <span>Add Topic</span>
                      </>
                    )}
                  </button>
                </PermissionWrapper>

                <PermissionWrapper section="Import Content" action="create">
                  <button
                    onClick={() => setShowImportPopup(true)}
                    className="bg-leafGreen text-white px-4 xl:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm whitespace-nowrap"
                  >
                    <Plus size={18} />
                    Import Topic
                  </button>
                </PermissionWrapper>

                <PermissionWrapper section="Assignment" action="create">
                  <button
                    onClick={() => {
                      setShowAssignmentForm(true);
                      setActiveComponent("Assignment");
                    }}
                    className="bg-leafGreen text-white px-4 xl:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm whitespace-nowrap"
                  >
                    <PlusCircle size={18} />
                    <span>Add Assignment</span>
                  </button>
                </PermissionWrapper>

                <PermissionWrapper section="Quiz" action="create">
                  <button
                    onClick={() => {
                      setShowQuizForm(true);
                      setActiveComponent("quiz");
                    }}
                    className="bg-leafGreen text-white px-4 xl:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm whitespace-nowrap"
                  >
                    <PlusCircle size={18} />
                    <span>Add Quiz</span>
                  </button>
                </PermissionWrapper>

                {/* Back Button */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="font-medium">Back</span>
                </button>
              </div>

              {/* Dropdown for < md */}
              <div className="lg:hidden relative flex items-center justify-between">
                <button
                  onClick={() => setShowDropdown((prev) => !prev)}
                  className="bg-leafGreen   text-white p-2 rounded-lg flex items-center transition-colors font-medium shadow-sm min-w-[30px]"
                >
                  {showDropdown ? <X size={18} /> : <Plus size={18} />}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 translate-y-1 z-10 w-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                    <PermissionWrapper section="Topic" action="create">
                      <button
                        onClick={() => {
                          resetForm();
                          setIsFormVisible(!isFormVisible);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        {isFormVisible ? (
                          <X size={16} />
                        ) : (
                          <PlusCircle size={16} />
                        )}
                        <span>{isFormVisible ? "Hide Form" : "Add Topic"}</span>
                      </button>
                    </PermissionWrapper>

                    <PermissionWrapper section="Import Content" action="create">
                      <button
                        onClick={() => setShowImportPopup(true)}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <Plus size={18} />
                        Import Topic
                      </button>
                    </PermissionWrapper>

                    <PermissionWrapper section="Assignment" action="create">
                      <button
                        onClick={() => {
                          setShowAssignmentForm(true);
                          setActiveComponent("Assignment");
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <PlusCircle size={16} />
                        <span>Add Assignment</span>
                      </button>
                    </PermissionWrapper>

                    <PermissionWrapper section="Quiz" action="create">
                      <button
                        onClick={() => {
                          setShowQuizForm(true);
                          setActiveComponent("quiz");
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <PlusCircle size={16} />
                        <span>Add Quiz</span>
                      </button>
                    </PermissionWrapper>
                  </div>
                )}

                {/* Back Arrow */}
                <button
                  onClick={() => navigate(-1)}
                  className="flex border rounded-md ml-3 items-center gap-2 text-gray-600 hover:text-gray-900 p-1"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        {isFormVisible && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-4 md:p-6 mb-4 md:mb-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 md:space-y-6 relative"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-forestGreen">
                  New Topic
                </h2>
                <AIContentGenerator
                  contentType="topic"
                  onUseGenerated={handleUseGeneratedTopic}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Title*
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    placeholder="Enter topic title"
                  />
                </div>

                <div className="group">
                  <div className="flex items-center gap-3">
                    {/* Input Field */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Languages
                      </label>
                      <input
                        type="text"
                        value={selectedLanguages.join(", ")}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 cursor-default shadow-sm"
                        placeholder="No languages selected"
                      />
                    </div>

                    {/* Button */}
                    <button
                      type="button"
                      onClick={() => setShowLanguageModal(true)}
                      className="mt-6 h-[42px] min-w-[150px] px-4 bg-leafGreen text-white rounded-lg   
               shadow-sm flex items-center justify-center gap-2 transition"
                    >
                      Select Language
                    </button>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type *
                  </label>
                  <select
                    name="content_type"
                    required
                    value={formData.content_type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="">Select Content Type</option>
                    {contentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Description*
                </label>
                {["general", "slide", "accordian"].includes(
                  formData.content_type
                ) ? (
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
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
                  {formData.tags?.map((tag, index) => (
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
                            onChange={(e) =>
                              handleTagChange(e, index, "tagName")
                            }
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen text-sm transition-all duration-200"
                            placeholder="Enter tag name"
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
                              <Code
                                size={14}
                                className="text-leafGreen mr-1"
                              />
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
                                className="border border-leafGreen/20 rounded"
                                theme="light"
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
                                    ? tag.tagFile.name
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
                      {formData.materials.map((m, idx) => {
                        const cardId = `material-card-${idx}`;
                        return (
                          <div
                            key={idx}
                            className="group relative flex flex-col rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex items-start gap-2 p-3 border-b border-gray-100">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-leafGreen/10 text-forestGreen">
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

                            <div className="p-3 space-y-3">
                              {/* Dynamic Content */}
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
                                      updateMaterialRow(idx, "code", value)
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
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-leafGreen transition">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <label className="cursor-pointer text-xs font-medium text-forestGreen hover:text-leafGreen">
                                      Upload {m.material_type}
                                      <input
                                        type="file"
                                        onChange={(e) =>
                                          handleMaterialFile(
                                            idx,
                                            e.target.files[0]
                                          )
                                        }
                                        className="hidden"
                                        accept={getAcceptType(m.material_type)}
                                      // accept={
                                      //   m.material_type === "pdf"
                                      //     ? ".pdf"
                                      //     : m.material_type === "image"
                                      //       ? "image/*"
                                      //       : ".doc,.docx,.txt,.pdf"
                                      // }
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

                              {/* Previews */}
                              {(m.file || m.url) && (
                                <div className="rounded-md bg-gray-50 p-2 border border-gray-200 flex items-center gap-2">
                                  {m.material_type === "image" &&
                                    (m.file || m.url) ? (
                                    <img
                                      src={
                                        m.file
                                          ? URL.createObjectURL(m.file)
                                          : `${import.meta.env
                                            .VITE_BACKEND_MEDIA_URL
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
                                          : `${import.meta.env
                                            .VITE_BACKEND_MEDIA_URL
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
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {formData.content_type && (
                <div className="bg-lightGreen rounded-lg border border-leafGreen/20 shadow-sm">
                  {renderContentTypeForm()}
                </div>
              )}

              <div className="rounded-lg border-2 border-leafGreen/30 bg-lightGreen/50 p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <h3 className="text-sm font-semibold text-forestGreen">Topic Duration Summary</h3>
                  <span className="text-xs font-medium text-forestGreen bg-leafGreen/20 px-2.5 py-1 rounded-full w-fit">
                    Whole Topic Final = Topic + Extra
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg border border-leafGreen/30 p-3">
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

                  <div className="bg-white rounded-lg border border-leafGreen/30 p-3">
                    <label className="block text-xs font-semibold tracking-wide uppercase text-leafGreen mb-2">
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
                          : formData.extra_duration
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-leafGreen text-white rounded-lg hover:bg-forestGreen focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2 transition-colors duration-200 font-medium shadow-sm flex items-center gap-2"
                >
                  {isLoadingCreateTopic ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Create Topic"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {topics.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-lightGreen">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                      Order
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Content Type
                    </th>
                    <PermissionWrapper section="Topic Content" action="edit|create">
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Add Content
                      </th>
                    </PermissionWrapper>
                    <PermissionWrapper section="Topic" action="view|edit|toggle">
                      <th className="px-3 lg:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </PermissionWrapper>
                  </tr>
                </thead>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <tbody className="bg-white divide-y divide-gray-100">
                    <SortableContext
                      items={topics.map((topic) => topic.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {topics.map((topic, index) => (
                        <SortableTopicRow
                          key={topic.id}
                          topic={topic}
                          index={index}
                          handleStatusToggle={handleStatusToggle}
                          handleAddContent={handleAddContent}
                          navigate={navigate}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </DndContext>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              <div className="sm:p-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={topics.map((topic) => topic.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {topics.map((topic, index) => (
                      <SortableTopicRow
                        key={topic.id}
                        topic={topic}
                        index={index}
                        handleStatusToggle={handleStatusToggle}
                        handleAddContent={handleAddContent}
                        navigate={navigate}
                        isMobile={true}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg p-8 text-center border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl mb-10">
            <p className="text-gray-500">
              No topics available. Add your first topic to get started.
            </p>
          </div>
        )}

        <PermissionWrapper section="Assignment" action="view">
          <div className="my-10">
            <h1 className="pl-5 text-3xl font-bold text-forestGreen mb-4">
              Assignments
            </h1>
            <Assignment
              showAssignmentForm={showAssignmentForm}
              setShowAssignmentForm={setShowAssignmentForm}
            />
          </div>
        </PermissionWrapper>

        <PermissionWrapper section="Quiz" action="view">
          <div className="mb-10">
            <h1 className="pl-5 text-3xl font-bold text-forestGreen mb-4">
              Quizzes
            </h1>
            <Quiz
              showQuizForm={showQuizForm}
              setShowQuizForm={setShowQuizForm}
              moduleId={moduleId}
            />
          </div>
        </PermissionWrapper>
      </div>

      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-96 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Select Languages</h2>

            {/* GRID VIEW */}
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {languageOptions.map((lang) => (
                <label
                  key={lang}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang)}
                    onChange={() => {
                      setSelectedLanguages((prev) => {
                        const updated = prev.includes(lang)
                          ? prev.filter((l) => l !== lang)
                          : [...prev, lang];

                        // update formData also
                        setFormData((f) => ({ ...f, languages: updated }));

                        return updated;
                      });
                    }}
                    className="h-4 w-4 accent-leafGreen"
                  />
                  <span>{lang}</span>
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


      <TopicContentModal
        isOpen={isContentModalOpen}
        onClose={handleCloseModal}
        topicId={selectedTopicId}
        moduleId={moduleId}
        activeModuleId={activeModuleId}
      />

      <ImportContentPopup
        open={showImportPopup}
        onClose={() => setShowImportPopup(false)}
        from="topic"
        Id={mId}
        refetchTopics={refetchTopics}
      />
    </div>
  );
}
