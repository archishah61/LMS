"use client"
import { useEffect, useMemo, useState } from "react"
import {
  useDoYourOwnCourseGenerateAndSaveMutation,
  useDoYourOwnCourseStructureGenerateMutation,
} from "../../services/AIServices"
import { useNavigate } from "react-router-dom"
import { Upload, X, FileText, CheckCircle, Clock, Loader2, ArrowLeft, BookOpen, Users, Target, FolderOpen, Check, Sparkles } from "lucide-react"
import { io } from "socket.io-client"
import { useDispatch, useSelector } from "react-redux"
import { useGetAllActiveTiersQuery, usePurchaseCourseGenerationTierMutation } from "../../services/Tier/tierAPI"
import { useGetAllActiveDifficultyLevelsQuery, useGetTiersByDifficultyLevelQuery } from "../../services/Tier/difficultyLevelAPI"
import { getStudentToken } from "../../services/CookieService"
import RazorpayButton from "../../components/razorpay/RazorpayButton"
import toast from "react-hot-toast"
import { useLazyGetCourseGenerationHistoryByIdQuery, useGetUserCourseGenerationHistoryQuery } from "../../services/Tier/courseGenerationHistoryAPI"
import useStudentAuthTokenRefresh from "../../hooks/useStudentAuthTokenRefresh"
import { useGetFeatureStatusByNameQuery } from "../../services/Masters/featureStatusAPI"
import ComingSoonModal from "../../components/modal/ComingSoonModal"
import { useAuthModal } from "../../context/AuthModalContext"
import { slugify } from "../../utils/slugify"
import DefaultSEOMeta from "../../context/DefaultSEOMeta"

// Enhanced Modal component with consistent styling
function Modal({ open, onClose, title, children, variant = "default", autoCloseMs, showCloseButton = true }) {
  useEffect(() => {
    if (!open || !autoCloseMs) return
    const t = setTimeout(() => onClose?.(), autoCloseMs)
    return () => clearTimeout(t)
  }, [open, autoCloseMs, onClose])

  if (!open) return null

  const variants = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      ring: "ring-green-500/20",
      titleColor: "text-green-800",
      textColor: "text-green-700",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      ring: "ring-red-500/20",
      titleColor: "text-red-800",
      textColor: "text-red-700",
    },
    default: {
      bg: "bg-white",
      border: "border-gray-200",
      ring: "ring-gray-500/20",
      titleColor: "text-gray-800",
      textColor: "text-gray-700",
    },
  }

  const style = variants[variant]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md rounded-xl ${style.bg} p-6 shadow-xl ring-1 ${style.ring} border ${style.border}`}
      >
        <div className="flex justify-between items-start mb-4">
          {title && <h3 className={`text-lg font-semibold ${style.titleColor}`}>{title}</h3>}
          {showCloseButton && onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className={`text-sm ${style.textColor}`}>{children}</div>
        {onClose && showCloseButton && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// File Upload Component (unchanged)
function FileUpload({ files, onFilesChange, disabled }) {
  const [isDragOver, setIsDragOver] = useState(false)

  const allowedTypes = {
    "text/plain": ".txt",
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.ms-excel": ".xls",
    "text/csv": ".csv",
  }

  const isValidFileType = (file) => {
    return (
      Object.keys(allowedTypes).includes(file.type) ||
      Object.values(allowedTypes).some((ext) => file.name.toLowerCase().endsWith(ext))
    )
  }

  const handleFileSelect = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter(isValidFileType)
    const invalidFiles = Array.from(selectedFiles).filter((file) => !isValidFileType(file))

    if (invalidFiles.length > 0) {
      alert(
        `Invalid file types: ${invalidFiles.map((f) => f.name).join(", ")}. Only TXT, PDF, Word, Excel, and CSV files are allowed.`,
      )
    }

    if (validFiles.length > 0) {
      onFilesChange([...files, ...validFiles])
    }
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles)
    }
  }

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    onFilesChange(updatedFiles)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="flex flex-col h-full">
      {/* File List */}
      {files.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0 mb-4 max-h-[150px]">
          {/* <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Uploaded Files ({files.length})</p> */}
          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border border-gray-100 bg-white p-2 shadow-sm"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-1.5 bg-green-50 rounded">
                    <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-500">{formatFileSize(file.size)} • UPLOADED</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  disabled={disabled}
                  className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative w-full rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 flex flex-col items-center justify-center bg-white md:bg-green-50/50 ${isDragOver ? "border-green-500 bg-green-50" : "border-gray-200 md:border-green-200/60 hover:border-green-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById("file-input").click()}
        style={{ minHeight: '100px' }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.csv"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />

        <div className="flex items-center gap-2">
          <div className="rounded-full bg-gray-100 md:bg-white p-1.5 md:p-3 shadow-sm ring-1 ring-gray-100">
            <Upload className={`h-4 w-4 md:h-6 md:w-6 ${isDragOver ? "text-green-600" : "text-gray-400 md:text-green-400"}`} />
          </div>

          <p className="text-sm font-medium text-gray-600 md:text-gray-900">
            Add reference material
          </p>
        </div>

        <p className="mt-1 text-xs text-gray-400 hidden md:block">
          Drop on or click here
        </p>
      </div>
    </div>
  )
}

// Enhanced Progress Display Component
function ProgressDisplay({ progress, isConnected, onClose }) {
  const currentProgress = progress[progress.length - 1]

  // Define all possible steps with their weights for calculating overall progress
  const stepWeights = {
    'start': 0,
    'transforming_database': 2,
    'database_transformed': 5,
    'generating_thumbnail': 7,
    'thumbnail_generated': 10,
    'saving_course': 15,
    'course_saved': 17,
    'retrieving_mappings': 18,
    'mappings_retrieved': 19,
    'processing_session': 20,
    'processing_topics': 25,
    'generating_topic': 50, // Dynamic weight based on topic progress
    'topic_generated': 80,
    'generating_assignments': 85,
    'assignments_generated': 90,
    'generating_quizzes': 95,
    'generating_quiz': 95,
    'quiz_generated': 95,
    'complete': 100
  }

  // Calculate dynamic progress for topic generation
  const calculateProgressPercentage = () => {
    if (!currentProgress) return 0

    const step = currentProgress.step
    let baseProgress = stepWeights[step] || 0

    // For topic generation, calculate based on current topic vs total topics
    if (step === 'generating_topic' && currentProgress.data?.topicIndex && currentProgress.data?.totalTopics) {
      const topicProgress = (currentProgress.data.topicIndex / currentProgress.data.totalTopics) * 20 // 20% range for topics (50-70%)
      baseProgress = 50 + topicProgress
    }

    return Math.min(Math.round(baseProgress), 100)
  }

  const progressPercentage = calculateProgressPercentage()

  // Get display message based on current step
  const getDisplayMessage = () => {
    if (!currentProgress) return "Initializing..."

    const step = currentProgress.step
    const data = currentProgress.data

    switch (step) {
      case 'start':
        return 'Initializing course generation...'
      case 'transforming_database':
      case 'database_transformed':
        return 'Generating course structure...'
      case 'generating_thumbnail':
      case 'thumbnail_generated':
        return 'Generating course thumbnail...'
      case 'saving_course':
      case 'course_saved':
      case 'retrieving_mappings':
      case 'mappings_retrieved':
      case 'processing_session':
      case 'processing_topics':
        return 'Setting up course content...'
      case 'generating_topic':
        return `Generating topic: ${data?.topicTitle || 'Loading...'}`
      case 'topic_generated':
        return `Generated topic: ${data?.topicTitle || 'Topic'}`
      case 'generating_assignments':
        return `Generating assignment: ${data?.assignmentTitle || 'Assignment'}`
      case 'assignments_generated':
        return `Generated assignment: ${data?.assignmentTitle || 'Assignment'}`
      case 'generating_quizzes':
      case 'generating_quiz':
        return `Generating quiz: ${data?.quizTitle || 'Quiz'}`
      case 'quiz_generated':
        return `Generated quiz: ${data?.quizTitle || 'Quiz'}`
      case 'complete':
        return 'Course generation completed!'
      default:
        return currentProgress.message || 'Processing...'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md md:max-w-xl rounded-xl bg-white p-4 md:p-6 shadow-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-green-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">Generating Your Course</h3>
              <p className={`text-xs md:text-sm ${isConnected ? "text-green-600" : "text-yellow-600"}`}>
                {isConnected ? "● Connected" : "● Connecting..."}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Single Progress Bar */}
        <div className="mb-4 md:mb-6">
          <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
            <div
              className="bg-green-600 h-2 md:h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Status - Clean and Simple */}
        <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200 mb-3 md:mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <p className="text-xs md:text-sm font-medium text-green-800 break-words">{getDisplayMessage()}</p>
          </div>
        </div>

        {/* Simple processing info */}
        <div className="text-xs text-gray-500">
          <p>Please wait while we generate your personalized course content...</p>
        </div>
      </div>
    </div>
  )
}

// Enhanced Chat-Style Notification System
function NotificationSystem({ notifications, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 max-h-96">
      {/* Container with scrollable content */}
      <div className="flex flex-col-reverse overflow-y-auto space-y-reverse space-y-2 max-h-96 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg shadow-lg border transform transition-all duration-300 ${notification.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : notification.type === "warning"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              } animate-in slide-in-from-right-5 fade-in-0 hover:shadow-xl`}
            style={{
              animationDelay: `${index * 100}ms`,
              animationDuration: '300ms'
            }}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                {/* Icon based on type */}
                <div className="flex items-center gap-2 mb-1">
                  {notification.type === "success" && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                  )}
                  {notification.type === "error" && (
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  )}
                  {notification.type === "warning" && (
                    <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
                  )}
                  {notification.type === "info" && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                  )}

                  <p className="font-medium text-xs truncate">
                    {notification.title}
                  </p>
                </div>

                <p className="text-xs opacity-90 leading-relaxed break-words">
                  {notification.message}
                </p>

                {/* Show timestamp */}
                <p className="text-xs opacity-60 mt-1">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <button
                onClick={() => onRemove(notification.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Progress bar if available */}
            {notification.progress && (
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${notification.type === "success" ? "bg-green-500" : "bg-blue-500"
                    }`}
                  style={{ width: `${notification.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notification count indicator when there are many */}
      {notifications.length > 3 && (
        <div className="text-center mt-2">
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm border">
            {notifications.length} notifications
          </span>
        </div>
      )}
    </div>
  )
}

// Enhanced Confirmation Modal Component
function ConfirmationModal({ open, onClose, courseStructure, selectedItems, onSelectionChange, onConfirm }) {
  const [activeSessionNum, setActiveSessionNum] = useState(1);

  if (!open || !courseStructure) return null;

  // Check if anything is selected
  const hasSelections =
    selectedItems.sessions.length > 0 ||
    selectedItems.modules.length > 0 ||
    selectedItems.topics.length > 0 ||
    selectedItems.assignments.length > 0 ||
    selectedItems.quizzes.length > 0 ||
    selectedItems.topicContent.length > 0;

  // Helper functions for key generation
  const getModuleKey = (sessionNum, moduleNum) => `${sessionNum}-${moduleNum}`;
  const getTopicKey = (sessionNum, moduleNum, topicIndex) => `${sessionNum}-${moduleNum}-${topicIndex}`;
  const getAssignmentKey = (sessionNum, moduleNum, assignmentIndex) => `${sessionNum}-${moduleNum}-assignment-${assignmentIndex}`;
  const getQuizKey = (sessionNum, moduleNum, quizIndex) => `${sessionNum}-${moduleNum}-quiz-${quizIndex}`;
  const getTopicContentKey = (sessionNum, moduleNum, topicIndex, type, index) => `${sessionNum}-${moduleNum}-${topicIndex}-${type}-${index}`;

  const getTopicChildren = (sessionNum, moduleNum, topicidx, topic) => {
    const children = {
      topicCOntent: topic.topic_content?.map((topicContent, i) => getTopicContentKey(sessionNum, moduleNum, topicidx, topicContent?.type, i)) || [],
    };
    return children;
  };

  // Get all child items for a given parent
  const getModuleChildren = (sessionNum, moduleNum, module) => {
    const children = {
      topics: module.topics?.map((_, i) => getTopicKey(sessionNum, moduleNum, i)) || [],
      assignments: module.assignments?.map((_, i) => getAssignmentKey(sessionNum, moduleNum, i)) || [],
      quizzes: module.quizzes?.map((_, i) => getQuizKey(sessionNum, moduleNum, i)) || []
    };
    return children;
  };

  const getSessionChildren = (sessionNum, session) => {
    const children = {
      modules: [],
      topics: [],
      assignments: [],
      quizzes: []
    };

    session.modules.forEach((module, moduleIndex) => {
      const moduleNum = moduleIndex + 1;
      const moduleKey = getModuleKey(sessionNum, moduleNum);
      children.modules.push(moduleKey);

      const moduleChildren = getModuleChildren(sessionNum, moduleNum, module);
      children.topics.push(...moduleChildren.topics);
      children.assignments.push(...moduleChildren.assignments);
      children.quizzes.push(...moduleChildren.quizzes);
    });

    return children;
  };

  // Hierarchical selection logic (Same as before)
  const updateSelectionHierarchically = (type, key, isSelected, sessionNum, moduleNum, topicIdx = null) => {
    let updated = { ...selectedItems };

    if (isSelected) {
      updated[type] = [...updated[type], key];
    } else {
      updated[type] = updated[type].filter(item => item !== key);
    }

    if (type === 'sessions') {
      const session = courseStructure.course.sessions[sessionNum - 1];
      const children = getSessionChildren(sessionNum, session);

      if (isSelected) {
        updated.modules = [...new Set([...updated.modules, ...children.modules])];
        updated.topics = [...new Set([...updated.topics, ...children.topics])];
        updated.assignments = [...new Set([...updated.assignments, ...children.assignments])];
        updated.quizzes = [...new Set([...updated.quizzes, ...children.quizzes])];
        // Also select all topic content
        const allTopicContent = [];
        session.modules.forEach((module, mIdx) => {
          module.topics?.forEach((topic, tIdx) => {
            topic.topic_content?.forEach((_, cIdx) => {
              allTopicContent.push(getTopicContentKey(sessionNum, mIdx + 1, tIdx, topic.topic_content[cIdx].type, cIdx));
            });
          });
        });
        updated.topicContent = [...new Set([...updated.topicContent, ...allTopicContent])];
      } else {
        updated.modules = updated.modules.filter(m => !children.modules.includes(m));
        updated.topics = updated.topics.filter(t => !children.topics.includes(t));
        updated.assignments = updated.assignments.filter(a => !children.assignments.includes(a));
        updated.quizzes = updated.quizzes.filter(q => !children.quizzes.includes(q));
        // Deselect all topic content
        const allTopicContent = [];
        session.modules.forEach((module, mIdx) => {
          module.topics?.forEach((topic, tIdx) => {
            topic.topic_content?.forEach((_, cIdx) => {
              allTopicContent.push(getTopicContentKey(sessionNum, mIdx + 1, tIdx, topic.topic_content[cIdx].type, cIdx));
            });
          });
        });
        updated.topicContent = updated.topicContent.filter(tc => !allTopicContent.includes(tc));
      }
    }
    else if (type === 'modules') {
      const session = courseStructure.course.sessions[sessionNum - 1];
      const module = session.modules[moduleNum - 1];
      const children = getModuleChildren(sessionNum, moduleNum, module);

      // Get all topic content for this module
      const moduleTopicContent = [];
      module.topics?.forEach((topic, tIdx) => {
        topic.topic_content?.forEach((contentItem, cIdx) => {
          moduleTopicContent.push(getTopicContentKey(sessionNum, moduleNum, tIdx, contentItem.type, cIdx));
        });
      });

      if (isSelected) {
        updated.topics = [...new Set([...updated.topics, ...children.topics])];
        updated.assignments = [...new Set([...updated.assignments, ...children.assignments])];
        updated.quizzes = [...new Set([...updated.quizzes, ...children.quizzes])];
        updated.topicContent = [...new Set([...updated.topicContent, ...moduleTopicContent])];

        const sessionKey = sessionNum.toString();
        if (!updated.sessions.includes(sessionKey)) {
          updated.sessions = [...updated.sessions, sessionKey];
        }
      } else {
        updated.topics = updated.topics.filter(t => !children.topics.includes(t));
        updated.assignments = updated.assignments.filter(a => !children.assignments.includes(a));
        updated.quizzes = updated.quizzes.filter(q => !children.quizzes.includes(q));
        updated.topicContent = updated.topicContent.filter(tc => !moduleTopicContent.includes(tc));

        const sessionKey = sessionNum.toString();
        const sessionChildren = getSessionChildren(sessionNum, session);
        const hasSelectedModules = sessionChildren.modules.some(m => updated.modules.includes(m));
        if (!hasSelectedModules) {
          updated.sessions = updated.sessions.filter(s => s !== sessionKey);
        }
      }
    }
    else if (type === 'topics') {
      const session = courseStructure.course.sessions[sessionNum - 1];
      const module = session.modules[moduleNum - 1];
      const topic = module.topics[topicIdx];

      // Get all topic content keys for this topic
      const topicContentKeys = topic?.topic_content?.map((contentItem, cIdx) =>
        getTopicContentKey(sessionNum, moduleNum, topicIdx, contentItem.type, cIdx)
      ) || [];

      if (isSelected) {
        // Select all topic content when topic is selected
        updated.topicContent = [...new Set([...updated.topicContent, ...topicContentKeys])];

        const moduleKey = getModuleKey(sessionNum, moduleNum);
        const sessionKey = sessionNum.toString();

        if (!updated.modules.includes(moduleKey)) {
          updated.modules = [...updated.modules, moduleKey];
        }
        if (!updated.sessions.includes(sessionKey)) {
          updated.sessions = [...updated.sessions, sessionKey];
        }
      } else {
        // Deselect all topic content when topic is deselected
        updated.topicContent = updated.topicContent.filter(tc => !topicContentKeys.includes(tc));

        const moduleKey = getModuleKey(sessionNum, moduleNum);
        const session = courseStructure.course.sessions[sessionNum - 1];
        const module = session.modules[moduleNum - 1];
        const children = getModuleChildren(sessionNum, moduleNum, module);

        const hasSelectedChildren =
          children.topics.some(t => updated.topics.includes(t)) ||
          children.assignments.some(a => updated.assignments.includes(a)) ||
          children.quizzes.some(q => updated.quizzes.includes(q));

        if (!hasSelectedChildren) {
          updated.modules = updated.modules.filter(m => m !== moduleKey);
          const sessionKey = sessionNum.toString();
          const sessionChildren = getSessionChildren(sessionNum, session);
          const hasSelectedModules = sessionChildren.modules.some(m => updated.modules.includes(m));
          if (!hasSelectedModules) {
            updated.sessions = updated.sessions.filter(s => s !== sessionKey);
          }
        }
      }
    }
    else if (type === 'topicContent') {
      // When toggling individual topic content
      if (isSelected) {
        // Ensure parent topic, module, and session are selected
        const topicKey = getTopicKey(sessionNum, moduleNum, topicIdx);
        if (!updated.topics.includes(topicKey)) {
          updated.topics = [...updated.topics, topicKey];
        }

        const moduleKey = getModuleKey(sessionNum, moduleNum);
        if (!updated.modules.includes(moduleKey)) {
          updated.modules = [...updated.modules, moduleKey];
        }

        const sessionKey = sessionNum.toString();
        if (!updated.sessions.includes(sessionKey)) {
          updated.sessions = [...updated.sessions, sessionKey];
        }
      } else {
        // Check if topic has any other selected content
        const session = courseStructure.course.sessions[sessionNum - 1];
        const module = session.modules[moduleNum - 1];
        const topic = module.topics[topicIdx];

        const topicContentKeys = topic?.topic_content?.map((contentItem, cIdx) =>
          getTopicContentKey(sessionNum, moduleNum, topicIdx, contentItem.type, cIdx)
        ) || [];

        const hasOtherSelectedContent = topicContentKeys.some(tcKey =>
          tcKey !== key && updated.topicContent.includes(tcKey)
        );

        // If no other content selected, deselect the topic
        // if (!hasOtherSelectedContent) {
        //   const topicKey = getTopicKey(sessionNum, moduleNum, topicIdx);
        //   updated.topics = updated.topics.filter(t => t !== topicKey);

        //   // Check if module has any selected topics or content
        //   const moduleChildren = getModuleChildren(sessionNum, moduleNum, module);
        //   const hasSelectedTopics = moduleChildren.topics.some(t => updated.topics.includes(t));
        //   const hasSelectedContent = topicContentKeys.some(tc => updated.topicContent.includes(tc));

        //   if (!hasSelectedTopics && !hasSelectedContent) {
        //     const moduleKey = getModuleKey(sessionNum, moduleNum);
        //     updated.modules = updated.modules.filter(m => m !== moduleKey);

        //     // Check session
        //     const sessionKey = sessionNum.toString();
        //     const sessionChildren = getSessionChildren(sessionNum, session);
        //     const hasSelectedModules = sessionChildren.modules.some(m => updated.modules.includes(m));
        //     if (!hasSelectedModules) {
        //       updated.sessions = updated.sessions.filter(s => s !== sessionKey);
        //     }
        //   }
        // }
      }
    }
    else if (['assignments', 'quizzes'].includes(type)) {
      // Keep your existing logic for assignments and quizzes
      if (isSelected) {
        const moduleKey = getModuleKey(sessionNum, moduleNum);
        const sessionKey = sessionNum.toString();

        if (!updated.modules.includes(moduleKey)) {
          updated.modules = [...updated.modules, moduleKey];
        }
        if (!updated.sessions.includes(sessionKey)) {
          updated.sessions = [...updated.sessions, sessionKey];
        }
      } else {
        const moduleKey = getModuleKey(sessionNum, moduleNum);
        const session = courseStructure.course.sessions[sessionNum - 1];
        const module = session.modules[moduleNum - 1];
        const children = getModuleChildren(sessionNum, moduleNum, module);

        const hasSelectedChildren =
          children.topics.some(t => updated.topics.includes(t)) ||
          children.assignments.some(a => updated.assignments.includes(a)) ||
          children.quizzes.some(q => updated.quizzes.includes(q));

        if (!hasSelectedChildren) {
          updated.modules = updated.modules.filter(m => m !== moduleKey);
          const sessionKey = sessionNum.toString();
          const sessionChildren = getSessionChildren(sessionNum, session);
          const hasSelectedModules = sessionChildren.modules.some(m => updated.modules.includes(m));
          if (!hasSelectedModules) {
            updated.sessions = updated.sessions.filter(s => s !== sessionKey);
          }
        }
      }
    }

    return updated;
  };

  const toggleSelection = (type, key, sessionNum, moduleNum, topicIdx = null) => {
    const isCurrentlySelected = selectedItems[type].includes(key);
    const updated = updateSelectionHierarchically(type, key, !isCurrentlySelected, sessionNum, moduleNum, topicIdx);
    onSelectionChange(updated);
  };

  const areAllSelected = (items, selectedList) => {
    return items.length > 0 && items.every(item => selectedList.includes(item));
  };

  const areSomeSelected = (items, selectedList) => {
    return items.some(item => selectedList.includes(item)) && !areAllSelected(items, selectedList);
  };

  // Toggle all items in a specific collection (e.g. all topics in a module)
  const toggleAllInCollection = (type, items, sessionNum, moduleNum) => {
    const allSelected = areAllSelected(items, selectedItems[type])

    let updated = { ...selectedItems }

    if (allSelected) {
      // Deselect all items
      updated[type] = updated[type].filter(item => !items.includes(item))

      // Check if module should be deselected (no children left)
      const moduleKey = getModuleKey(sessionNum, moduleNum)
      const session = courseStructure.course.sessions[sessionNum - 1]
      const module = session.modules[moduleNum - 1]
      const moduleChildren = getModuleChildren(sessionNum, moduleNum, module)

      const hasSelectedChildren =
        moduleChildren.topics.some(t => updated.topics.includes(t)) ||
        moduleChildren.assignments.some(a => updated.assignments.includes(a)) ||
        moduleChildren.quizzes.some(q => updated.quizzes.includes(q))

      if (!hasSelectedChildren) {
        updated.modules = updated.modules.filter(m => m !== moduleKey)

        // Check if session should be deselected
        const sessionKey = sessionNum.toString()
        const sessionChildren = getSessionChildren(sessionNum, session)
        const hasSelectedModules = sessionChildren.modules.some(m => updated.modules.includes(m))
        if (!hasSelectedModules) {
          updated.sessions = updated.sessions.filter(s => s !== sessionKey)
        }
      }
    } else {
      // Select all items
      updated[type] = [...new Set([...updated[type], ...items])]

      // Ensure parent module is selected
      const moduleKey = getModuleKey(sessionNum, moduleNum)
      if (!updated.modules.includes(moduleKey)) {
        updated.modules = [...updated.modules, moduleKey]
      }

      // Ensure parent session is selected
      const sessionKey = sessionNum.toString()
      if (!updated.sessions.includes(sessionKey)) {
        updated.sessions = [...updated.sessions, sessionKey]
      }
    }

    onSelectionChange(updated)
  }

  const toggleAllInSession = (sessionNum) => {
    const sessionKey = sessionNum.toString();
    const session = courseStructure.course.sessions[sessionNum - 1];
    const items = getSessionChildren(sessionNum, session);
    const isSelected = selectedItems.sessions.includes(sessionKey);

    // Use the existing logic: if selected, deselect; if not, select all
    const updated = updateSelectionHierarchically('sessions', sessionKey, !isSelected, sessionNum);
    onSelectionChange(updated);
  };

  // Toggle all items in a module (topics, assignments, quizzes)
  const toggleAllInModule = (sessionNum, moduleNum) => {
    const session = courseStructure.course.sessions[sessionNum - 1];
    const module = session.modules[moduleNum - 1];
    const moduleChildren = getModuleChildren(sessionNum, moduleNum, module);

    // Get all topic content keys for this module
    const moduleTopicContent = [];
    module.topics?.forEach((topic, tIdx) => {
      topic.topic_content?.forEach((contentItem, cIdx) => {
        moduleTopicContent.push(getTopicContentKey(sessionNum, moduleNum, tIdx, contentItem.type, cIdx));
      });
    });

    const allModuleItems = [...moduleChildren.topics, ...moduleChildren.assignments, ...moduleChildren.quizzes, ...moduleTopicContent];

    const areAllSelected = allModuleItems.length > 0 && allModuleItems.every(item =>
      selectedItems.topics.includes(item) ||
      selectedItems.assignments.includes(item) ||
      selectedItems.quizzes.includes(item) ||
      selectedItems.topicContent.includes(item)
    );

    let updated = { ...selectedItems };

    if (areAllSelected) {
      // Deselect all items in this module
      updated.topics = updated.topics.filter(t => !moduleChildren.topics.includes(t));
      updated.assignments = updated.assignments.filter(a => !moduleChildren.assignments.includes(a));
      updated.quizzes = updated.quizzes.filter(q => !moduleChildren.quizzes.includes(q));
      updated.topicContent = updated.topicContent.filter(tc => !moduleTopicContent.includes(tc));

      // Check if module should be deselected
      const hasSelectedChildren =
        moduleChildren.topics.some(t => updated.topics.includes(t)) ||
        moduleChildren.assignments.some(a => updated.assignments.includes(a)) ||
        moduleChildren.quizzes.some(q => updated.quizzes.includes(q)) ||
        moduleTopicContent.some(tc => updated.topicContent.includes(tc));

      const moduleKey = getModuleKey(sessionNum, moduleNum);

      if (!hasSelectedChildren) {
        updated.modules = updated.modules.filter(m => m !== moduleKey);

        // Check if session should be deselected
        const sessionKey = sessionNum.toString();
        const sessionChildren = getSessionChildren(sessionNum, session);
        const hasSelectedModules = sessionChildren.modules.some(m => updated.modules.includes(m));
        if (!hasSelectedModules) {
          updated.sessions = updated.sessions.filter(s => s !== sessionKey);
        }
      }
    } else {
      // Select all items in this module
      updated.topics = [...new Set([...updated.topics, ...moduleChildren.topics])];
      updated.assignments = [...new Set([...updated.assignments, ...moduleChildren.assignments])];
      updated.quizzes = [...new Set([...updated.quizzes, ...moduleChildren.quizzes])];
      updated.topicContent = [...new Set([...updated.topicContent, ...moduleTopicContent])];

      // Ensure parent module is selected
      const moduleKey = getModuleKey(sessionNum, moduleNum);
      if (!updated.modules.includes(moduleKey)) {
        updated.modules = [...updated.modules, moduleKey];
      }

      // Ensure parent session is selected
      const sessionKey = sessionNum.toString();
      if (!updated.sessions.includes(sessionKey)) {
        updated.sessions = [...updated.sessions, sessionKey];
      }
    }

    onSelectionChange(updated);
  };

  const activeSessionIndex = activeSessionNum - 1;
  const activeSession = courseStructure.course.sessions[activeSessionIndex];

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-hidden">

      {/* Header */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Generate Content</h2>
            <p className="text-xs text-gray-500">Select the sessions and modules for your output.</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">

        {/* Mobile Session Navigation */}
        <div className="lg:hidden w-full bg-white border-b border-gray-100 overflow-x-auto flex items-center gap-3 p-4 no-scrollbar z-20 shrink-0">
          <div className="flex gap-2">
            {courseStructure.course.sessions.map((session, idx) => {
              const sessionNum = idx + 1;
              const isActive = activeSessionNum === sessionNum;
              const isSelected = selectedItems.sessions.includes(sessionNum.toString());

              return (
                <button
                  key={sessionNum}
                  onClick={() => setActiveSessionNum(sessionNum)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all shadow-sm ${isActive
                    ? "bg-green-50 border-green-600 text-green-700 font-bold ring-1 ring-green-600 mb-0.5"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-green-600 border-green-600" : "border-gray-300"
                    }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-xs font-semibold">Session {sessionNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Left Sidebar: Sessions List (Desktop Only) */}
        <div className="hidden lg:flex w-80 h-full border-r border-gray-100 bg-gray-50/50 flex-col">
          <div className="p-5 pb-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sessions</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 custom-scrollbar">
            {courseStructure.course.sessions.map((session, idx) => {
              const sessionNum = idx + 1;
              const sessionKey = sessionNum.toString();
              const isActive = activeSessionNum === sessionNum;
              const isSelected = selectedItems.sessions.includes(sessionKey);

              return (
                <button
                  key={sessionNum}
                  onClick={() => setActiveSessionNum(sessionNum)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 group flex items-start gap-3 border ${isActive
                    ? "bg-green-50 border-green-200 shadow-sm"
                    : "hover:bg-white border-transparent hover:border-gray-200 hover:shadow-sm"
                    }`}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllInSession(sessionNum);
                    }}
                    className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected
                      ? "bg-green-600 border-green-600"
                      : "border-gray-300 bg-white group-hover:border-green-400"
                      }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-sm font-semibold truncate mb-0.5 ${isActive ? "text-green-900" : "text-gray-700"}`}>
                      Session {sessionNum}
                    </h4>
                    <p className={`text-xs truncate ${isActive ? "text-green-600" : "text-gray-500"}`}>
                      {session.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content: Active Session Details */}
        <div className="flex-1 h-full bg-white flex flex-col min-h-0 relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32 md:pb-24">
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
              {/* Active Session Header */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between pb-6 border-b border-gray-100 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 md:hidden">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                      Session {activeSessionNum}
                    </span>
                  </div>
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 leading-tight">
                    <span className="hidden md:inline">Session {activeSessionNum}: </span>{activeSession.title}
                  </h2>
                  <p className="text-sm md:text-base text-gray-500">Select modules to include in generation.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group self-start lg:self-auto bg-gray-50 px-3 py-1.5 rounded-lg lg:bg-transparent lg:p-0">
                  <div className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${selectedItems.sessions.includes(activeSessionNum.toString()) ? "bg-green-600 border-green-600" : "border-gray-300 bg-white group-hover:border-green-500"}`}>
                    {selectedItems.sessions.includes(activeSessionNum.toString()) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedItems.sessions.includes(activeSessionNum.toString())}
                    onChange={() => toggleAllInSession(activeSessionNum)}
                  />
                  <span className="text-xs font-bold text-gray-700 md:text-green-600">Select All</span>
                </label>
              </div>

              {/* Modules List */}
              <div className="space-y-6 md:space-y-8">
                {activeSession.modules.map((module, mIdx) => {
                  const moduleNum = mIdx + 1;
                  const moduleKey = getModuleKey(activeSessionNum, moduleNum);
                  const moduleChildren = getModuleChildren(activeSessionNum, moduleNum, module);
                  const allModuleItems = [...moduleChildren.topics, ...moduleChildren.assignments, ...moduleChildren.quizzes];
                  const isModuleFullySelected = allModuleItems.length > 0 && allModuleItems.every(item =>
                    selectedItems.topics.includes(item) ||
                    selectedItems.assignments.includes(item) ||
                    selectedItems.quizzes.includes(item)
                  );

                  return (
                    <div key={moduleKey} className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <FolderOpen className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide leading-relaxed">
                            Module {String.fromCharCode(64 + moduleNum)}: {module.title}
                          </h3>
                        </div>
                        {/* Module Select All Toggle */}
                        <button
                          onClick={() => toggleAllInModule(activeSessionNum, moduleNum)}
                          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isModuleFullySelected ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
                            {isModuleFullySelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span>Select All</span>
                        </button>
                      </div>

                      <div className="space-y-3 pl-0 md:pl-8">
                        {/* Topics */}
                        {module.topics?.map((topic, tIdx) => {
                          const topicKey = getTopicKey(activeSessionNum, moduleNum, tIdx);
                          const isSelected = selectedItems.topics.includes(topicKey);
                          return (
                            <label key={topicKey} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm bg-white hover:border-green-300 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden">
                              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                              <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-green-600 border-green-600" : "border-gray-300 bg-white group-hover:border-green-500"}`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => toggleSelection("topics", topicKey, activeSessionNum, moduleNum, tIdx)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`font-bold text-xs md:text-sm leading-tight ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                                    Topic {moduleNum}.{tIdx + 1}: {topic.title}
                                  </span>
                                  <span className="shrink-0 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase tracking-wider">
                                    {topic.type || "General"}
                                  </span>
                                </div>

                                {/* Main content description */}
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                  {typeof topic.content === 'string' ? topic.content : "Includes comprehensive coverage of key concepts."}
                                </p>

                                {/* Topic content items (quiz, assignments, etc.) */}
                                {topic.topic_content && topic.topic_content.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    <div className="space-y-1">
                                      {topic.topic_content.map((contentItem, idx) => {
                                        if (contentItem.type === 'assignment') {
                                          const assignKey = getTopicContentKey(activeSessionNum, moduleNum, tIdx, "assignment", idx);
                                          const isAssignSelected = selectedItems.topicContent.includes(assignKey);
                                          return (
                                            <label key={assignKey} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
                                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAssignSelected ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
                                                {isAssignSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                              </div>
                                              <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isAssignSelected}
                                                onChange={() => toggleSelection("topicContent", assignKey, activeSessionNum, moduleNum, tIdx)}
                                              />
                                              <div className="flex-1">
                                                <span className="text-xs font-medium text-gray-700">{contentItem.title}</span>
                                                {contentItem.description && (
                                                  <span className="text-xs text-gray-400 ml-2">- {contentItem.description}</span>
                                                )}
                                              </div>
                                              <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                                Assignment
                                              </span>
                                            </label>
                                          );
                                        } else if (contentItem.type === 'quiz') {
                                          const quizKey = getTopicContentKey(activeSessionNum, moduleNum, tIdx, "quiz", idx);
                                          const isQuizSelected = selectedItems.topicContent.includes(quizKey);
                                          return (
                                            <label key={quizKey} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
                                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isQuizSelected ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
                                                {isQuizSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                              </div>
                                              <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isQuizSelected}
                                                onChange={() => toggleSelection("topicContent", quizKey, activeSessionNum, moduleNum, tIdx)}
                                              />
                                              <div className="flex-1">
                                                <span className="text-xs font-medium text-gray-700">{contentItem.title}</span>
                                                {contentItem.description && (
                                                  <span className="text-xs text-gray-400 ml-2">- {contentItem.description}</span>
                                                )}
                                              </div>
                                              <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                                Quiz
                                              </span>
                                            </label>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </label>
                          )
                        })}

                        {/* Assignments */}
                        {module.assignments?.map((assign, aIdx) => {
                          const assignKey = getAssignmentKey(activeSessionNum, moduleNum, aIdx);
                          const isSelected = selectedItems.assignments.includes(assignKey);
                          return (
                            <label key={assignKey} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm bg-white hover:border-green-300 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden">
                              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                              <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-green-600 border-green-600" : "border-gray-300 bg-white group-hover:border-green-500"}`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => toggleSelection("assignments", assignKey, activeSessionNum, moduleNum)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`font-bold text-xs md:text-sm leading-tight ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                                    {assign.title || `Assignment ${aIdx + 1}`}
                                  </span>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="shrink-0 text-[10px] font-bold text-leafGreen bg-lightGreen px-2 py-1 rounded uppercase tracking-wider">
                                      {assign?.type?.replace(/_/g, ' ')}
                                    </span>
                                    <span className="shrink-0 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase tracking-wider">
                                      Assignment
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </label>
                          )
                        })}

                        {/* Quizzes */}
                        {module.quizzes?.map((quiz, qIdx) => {
                          const quizKey = getQuizKey(activeSessionNum, moduleNum, qIdx);
                          const isSelected = selectedItems.quizzes.includes(quizKey);
                          return (
                            <label key={quizKey} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm bg-white hover:border-green-300 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden">
                              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                              <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-green-600 border-green-600" : "border-gray-300 bg-white group-hover:border-green-500"}`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => toggleSelection("quizzes", quizKey, activeSessionNum, moduleNum)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`font-bold text-xs md:text-sm leading-tight ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                                    {quiz.title || `Quiz ${qIdx + 1}`}
                                  </span>
                                  <span className="shrink-0 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded uppercase tracking-wider">
                                    Quiz
                                  </span>
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {activeSession.modules.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p>No modules available in this session.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating Footer Action */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:absolute lg:bottom-6 lg:right-8 lg:left-auto lg:p-0 lg:bg-transparent lg:border-none z-30">
            <button
              onClick={onConfirm}
              disabled={!hasSelections}
              className="w-full lg:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3.5 rounded-xl lg:rounded-full font-bold shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" />
              <span>Generate Content</span>
              {hasSelections && (
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold ml-1">
                  {selectedItems.topics.length + selectedItems.assignments.length + selectedItems.quizzes.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment Tier Modal Component
function PaymentTierModal({ open, onClose, selectedItems, courseStructure, onPaymentConfirm, difficultyLevelId, courseGenerationHistoryId, preSelectedTier = "basic" }) {
  const { access_token } = getStudentToken();
  const { data: tiersData } = useGetAllActiveTiersQuery();

  const [selectedTier, setSelectedTier] = useState(preSelectedTier);
  const [purchaseCourseGenerationTier] = usePurchaseCourseGenerationTierMutation();

  if (!open || !courseStructure) return null;

  // Transform backend data to frontend format
  const transformTiersData = (tiersData) => {
    if (!tiersData?.data) return {};

    const tierConfigs = {
      basic: {
        name: "Basic",
        description: "Perfect for getting started",
        features: [
          "Standard support"
        ],
        limitations: [
          "Limited to basic content structure",
          "No advanced features"
        ],
        icon: BookOpen,
        color: "blue"
      },
      standard: {
        name: "Standard",
        description: "Great for comprehensive learning",
        features: [
          "Advanced analytics",
          "Priority support"
        ],
        limitations: [
          "Suitable for most use cases"
        ],
        icon: Users,
        color: "green"
      },
      premium: {
        name: "Premium",
        description: "Enterprise-grade course creation",
        features: [
          "Custom branding",
          "API access",
          "24/7 premium support"
        ],
        limitations: [
          "Full flexibility and features"
        ],
        icon: Target,
        color: "teal"
      }
    };

    const transformedTiers = {};

    tiersData.data
      .filter((tier) => tier.difficulty_level_id == difficultyLevelId)
      .forEach(tier => {
        const tierName = tier.name.toLowerCase();
        const config = tierConfigs[tierName] || tierConfigs.basic;

        // Generate features based on tier limits
        const limitFeatures = [
          `Up to ${tier.max_sessions} sessions`,
          `${tier.max_modules_per_session} modules per session`,
          `${tier.max_topics_per_module} topics per module`,
          `${tier.max_assignments_per_module} assignments per module`,
          `${tier.max_quizzes_per_module} quiz per module`
        ];

        transformedTiers[tierName] = {
          ...config,
          id: tier.id,
          price: parseFloat(tier.price),
          max_sessions: tier.max_sessions,
          max_modules_per_session: tier.max_modules_per_session,
          max_topics_per_module: tier.max_topics_per_module,
          max_assignments_per_module: tier.max_assignments_per_module,
          max_quizzes_per_module: tier.max_quizzes_per_module,
          features: [...limitFeatures, ...config.features]
        };
      });

    return transformedTiers;
  };

  const tiers = transformTiersData(tiersData);

  // Check if selected items fit within a tier
  const doesTierSupportSelection = (tier) => {
    return (
      selectedItems.sessions.length <= tier.max_sessions &&
      selectedItems.modules.length <= (tier.max_sessions * tier.max_modules_per_session) &&
      selectedItems.topics.length <=
      (tier.max_sessions *
        tier.max_modules_per_session *
        tier.max_topics_per_module) &&
      selectedItems.assignments.length <=
      (tier.max_sessions *
        tier.max_modules_per_session *
        tier.max_assignments_per_module) &&
      selectedItems.quizzes.length <=
      (tier.max_sessions *
        tier.max_modules_per_session *
        tier.max_quizzes_per_module)
    );
  };

  // Find nearest possible tier (lowest price that supports selection)
  const nearestTierKey = Object.entries(tiers)
    .filter(([_, tier]) => doesTierSupportSelection(tier))
    .sort((a, b) => a[1].price - b[1].price)?.[0]?.[0];

  const currentTier = tiers[nearestTierKey] || tiers[selectedTier];

  // Fallback if tiers data is not loaded yet
  if (!currentTier) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-gray-200">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = currentTier.icon;

  // Check if selected content exceeds tier limits
  const checkTierLimits = () => {
    const sessionCount = selectedItems.sessions.length;
    const moduleCount = selectedItems.modules.length;

    if (!currentTier) return true;

    return sessionCount > currentTier.max_sessions ||
      moduleCount > (currentTier.max_sessions * currentTier.max_modules_per_session);
  };

  const handlePayment = async (razorpayResponse, currentTier, generationHistoryId) => {
    try {
      if (!currentTier) {
        toast.error("Current Tier not found for purchase.");
        return;
      } else if (!generationHistoryId) {
        toast.error("Current Course Generation History Not Found");
        return;
      }

      const purchasePayload = {
        tier_id: currentTier.id,
        course_generation_history_id: generationHistoryId,
        amount: razorpayResponse.data.amount / 100,
        currency: razorpayResponse.data.currency || "INR",
        payment_method: razorpayResponse.data.method,
        payment_gateway: "razorpay",
        gateway_response: razorpayResponse.data,
        transaction_id: razorpayResponse.data.id,
        reference_id: razorpayResponse.data.order_id,
        status: razorpayResponse.data.captured ? "completed" : "failed",
      };

      const response = await purchaseCourseGenerationTier({
        data: purchasePayload,
        access_token,
      }).unwrap();

      if (response?.success) {
        onPaymentConfirm(selectedTier, response.purchase.tier_id, response.purchase.course_generation_payment_id)
        toast.success("Payment successful! You can now generate the course");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      toast.error(error?.data?.message || "Payment failed. Please try again.");
    }
  };

  const exceedsLimits = checkTierLimits();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 md:p-4">
      <div className="w-full max-w-full md:max-w-4xl max-h-[90vh] rounded-xl bg-white p-4 md:p-6 shadow-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="flex items-center space-x-2 md:space-x-3">
            <IconComponent className={`w-5 h-5 md:w-6 md:h-6 text-${currentTier.color}-600`} />
            <h3 className="text-base md:text-lg font-semibold text-gray-800">Choose Your Plan</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Tier Tabs - Only show if no pre-selected tier */}
        {!preSelectedTier && (
          <div className="flex space-x-1 mb-4 md:mb-6 p-1 bg-gray-100 rounded-lg">
            {Object.entries(tiers).map(([key, tier]) => (
              <button
                key={key}
                onClick={() => setSelectedTier(key)}
                className={`flex-1 py-2 md:py-3 px-2 md:px-4 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${selectedTier === key
                  ? `bg-white text-${tier.color}-600 shadow-sm`
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                {tier.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Tier Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Tier Details */}
            <div className="lg:col-span-2">
              <div className={`p-4 md:p-6 rounded-xl bg-${currentTier.color}-50 border border-${currentTier.color}-200`}>
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div>
                    <h4 className={`text-xl md:text-2xl font-bold text-${currentTier.color}-800`}>₹{currentTier.price}</h4>
                    <p className={`text-${currentTier.color}-600 text-sm md:text-base`}>{currentTier.description}</p>
                  </div>
                  <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium bg-${currentTier.color}-100 text-${currentTier.color}-800`}>
                    {currentTier.name}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-2 md:space-y-3">
                  <h5 className={`font-semibold text-${currentTier.color}-800 text-sm md:text-base`}>What's included:</h5>
                  {currentTier.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 md:space-x-3">
                      <CheckCircle className={`w-4 h-4 text-${currentTier.color}-600 flex-shrink-0`} />
                      <span className={`text-xs md:text-sm text-${currentTier.color}-700`}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                {currentTier.limitations && (
                  <div className="mt-3 md:mt-4 space-y-1 md:space-y-2">
                    {currentTier.limitations.map((limitation, index) => (
                      <p key={index} className={`text-xs text-${currentTier.color}-600`}>• {limitation}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Content Summary */}
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg">
                <h5 className="font-semibold text-gray-800 text-sm md:text-base mb-2 md:mb-3">Your Selected Content:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-600">Sessions: <span className="font-medium">{selectedItems.sessions.length}</span></p>
                    <p className="text-gray-600">Modules: <span className="font-medium">{selectedItems.modules.length}</span></p>
                    <p className="text-gray-600">Max Allowed: <span className="font-medium">{currentTier.max_sessions} sessions, {currentTier.max_sessions * currentTier.max_modules_per_session} modules</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-600">Topics: <span className="font-medium">{selectedItems.topics.length}</span></p>
                    <p className="text-gray-600">Assignments: <span className="font-medium">{selectedItems.assignments.length}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 sticky top-0">
                <h5 className="font-semibold text-gray-800 text-sm md:text-base mb-3 md:mb-4">Order Summary</h5>

                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Plan</span>
                    <span className="font-medium">{currentTier.name}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Price</span>
                    <span className="font-medium">₹{currentTier.price}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Content Size</span>
                    <span className="font-medium">
                      {selectedItems.sessions.length} sessions, {selectedItems.modules.length} modules
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold text-sm md:text-base">
                    <span>Total</span>
                    <span>₹{currentTier.price}</span>
                  </div>
                </div>

                {exceedsLimits && (
                  <div className="mt-3 md:mt-4 p-2 md:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      ⚠️ Your selected content exceeds the {currentTier.name} tier limits.
                      Please upgrade to a higher tier or reduce your content selection.
                    </p>
                  </div>
                )}

                <RazorpayButton
                  amount={currentTier.price}
                  onResult={(response) => handlePayment(response, currentTier, courseGenerationHistoryId)}
                  buttonText={exceedsLimits ? "Exceeds Tier Limits" : `Pay ₹${currentTier.price}`}
                  disabled={exceedsLimits}
                  className={`w-full mt-4 md:mt-6 py-2 md:py-3 px-4 rounded-lg font-medium text-white transition-colors text-sm md:text-base ${exceedsLimits
                    ? "bg-gray-400 cursor-not-allowed"
                    : `bg-primary hover:bg-leafGreen`
                    }`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TierSelectionDisplay = ({ onTierSelect, selectedTier, disabled, difficultyLevelId }) => {
  const { access_token } = getStudentToken();
  const { data: tiersData, isLoading: tiersLoading } = useGetTiersByDifficultyLevelQuery(
    { id: difficultyLevelId, access_token },
    { skip: !difficultyLevelId }
  );
  const [showInfo, setShowInfo] = useState(null);

  const transformTiersData = (tiersData) => {
    if (!tiersData?.data) return [];

    const tierDescriptions = {
      basic: "Essential tools for single learners",
      standard: "Collaboration & advanced modules",
      premium: "Unlimited sessions & priority AI"
    };

    return tiersData.data
      .filter((tier) => Boolean(tier.is_active))
      .map(tier => {
        const tierName = tier.name.toLowerCase();

        return {
          id: tier.id,
          name: tierName,
          price: parseFloat(tier.price),
          max_sessions: tier.max_sessions,
          max_modules_per_session: tier.max_modules_per_session,
          max_topics_per_module: tier.max_topics_per_module,
          max_assignments_per_module: tier.max_assignments_per_module,
          max_quizzes_per_module: tier.max_quizzes_per_module,
          description: tierDescriptions[tierName] || "Unlock potential with this plan"
        };
      });
  };

  const tiers = transformTiersData(tiersData);

  const handleTierClick = (tier) => {
    if (!disabled) {
      onTierSelect(tier.name);
    }
  };

  if (!difficultyLevelId) {
    return (
      <div className="space-y-4 md:space-y-6">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">Subscription Plan</label>
        <label className="hidden md:block text-base font-semibold text-gray-900">Select Plan</label>
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">Please select a difficulty level first to see available plans.</p>
        </div>
      </div>
    );
  }

  if (tiersLoading) {
    return (
      <div className="mt-8 flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!tiers.length) {
    return (
      <div className="space-y-4 md:space-y-6">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">Subscription Plan</label>
        <label className="hidden md:block text-base font-semibold text-gray-900">Select Plan</label>
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">No plans available for this difficulty level.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:space-y-6">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">
          Subscription Plan
        </label>
        <label className="hidden md:block text-base font-semibold text-gray-900">
          Select Plan
        </label>

        {/* Mobile View: Vertical List */}
        <div className="flex flex-col space-y-2 md:hidden">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`group relative flex items-center justify-between py-3 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleTierClick(tier)}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-medium capitalize ${tier.name === selectedTier ? 'text-gray-900' : 'text-gray-500'}`}>
                      {tier.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInfo(tier);
                      }}
                      className="text-gray-400 hover:text-green-600 focus:outline-none"
                    >
                      <img src="https://img.icons8.com/material-outlined/24/info.png" alt="info" className="w-4 h-4 opacity-60" />
                    </button>
                  </div>
                  <span className="text-base font-medium text-gray-900">₹{tier.price}</span>
                </div>
                <p className="text-xs text-gray-400 font-medium truncate">
                  {tier.description}
                </p>
              </div>

              <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ml-2 ${tier.name === selectedTier ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-200'
                }`}>
                {tier.name === selectedTier && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Grid */}
        <div className={`hidden md:grid gap-4 ${tiers.length === 1 ? 'grid-cols-1 max-w-sm' : tiers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => handleTierClick(tier)}
              className={`relative rounded-xl border p-5 cursor-pointer transition-all duration-200 h-full flex flex-col ${tier.name === selectedTier
                ? 'border-green-600 bg-green-50 ring-1 ring-green-600 shadow-sm'
                : 'border-gray-200 bg-white hover:border-green-200 hover:shadow-md'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`pb-4 mb-4 border-b ${tier.name === selectedTier ? 'border-green-200' : 'border-gray-100'}`}>
                <h4 className={`text-lg font-semibold capitalize mb-1 ${tier.name === selectedTier ? 'text-green-900' : 'text-gray-900'
                  }`}>
                  {tier.name}
                </h4>
                <div className="flex items-baseline">
                  <span className={`text-3xl font-bold ${tier.name === selectedTier ? 'text-gray-900' : 'text-gray-900'
                    }`}>
                    ₹{tier.price}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 flex-1">
                <li className="flex items-start">
                  <CheckCircle className={`w-4 h-4 mt-1 flex-shrink-0 ${tier.name === selectedTier ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  <span className="ml-3 text-sm text-gray-600">Core features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`w-4 h-4 mt-1 flex-shrink-0 ${tier.name === selectedTier ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  <span className="ml-3 text-sm text-gray-600">{tier.max_sessions} sessions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`w-4 h-4 mt-1 flex-shrink-0 ${tier.name === selectedTier ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  <span className="ml-3 text-sm text-gray-600">{tier.max_modules_per_session} modules / session</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`w-4 h-4 mt-1 flex-shrink-0 ${tier.name === selectedTier ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  <span className="ml-3 text-sm text-gray-600">{tier.max_topics_per_module} topics / module</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`w-4 h-4 mt-1 flex-shrink-0 ${tier.name === selectedTier ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  <span className="ml-3 text-sm text-gray-600">{tier.max_quizzes_per_module} quizzes / module</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`w-4 h-4 mt-1 flex-shrink-0 ${tier.name === selectedTier ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  <span className="ml-3 text-sm text-gray-600">{tier.max_assignments_per_module} assignments / module</span>
                </li>
              </ul>
            </div>
          ))}
        </div>

        <p className="hidden md:block text-xs text-gray-400">
          Plans shown are specific to your selected difficulty level
        </p>
      </div>

      {/* Mobile Info Modal */}
      <Modal
        open={!!showInfo}
        onClose={() => setShowInfo(null)}
        title={`${showInfo?.name} Plan Details`}
        autoCloseMs={0}
        showCloseButton={true}
      >
        {showInfo && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-4">{showInfo.description}</p>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-gray-600 text-sm">Max Sessions</span>
                <span className="font-semibold text-gray-900">{showInfo.max_sessions}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-gray-600 text-sm">Modules per Session</span>
                <span className="font-semibold text-gray-900">{showInfo.max_modules_per_session}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-gray-600 text-sm">Topics per Module</span>
                <span className="font-semibold text-gray-900">{showInfo.max_topics_per_module}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-gray-600 text-sm">Assignments per Module</span>
                <span className="font-semibold text-gray-900">{showInfo.max_assignments_per_module}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-gray-600 text-sm">Quizzes per Module</span>
                <span className="font-semibold text-gray-900">{showInfo.max_quizzes_per_module}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default function CourseGenerator() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { id: userId, isLoaded } = useSelector((state) => state.user)

  const { access_token } = getStudentToken();
  const { openLogin } = useAuthModal();

  const [socket, setSocket] = useState(null)
  const [progress, setProgress] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  // Form + request state
  const [userQuery, setUserQuery] = useState("")
  const [difficulty, setDifficulty] = useState(null)
  const [selectedDifficultyLevelId, setSelectedDifficultyLevelId] = useState(null)
  const [contentFiles, setContentFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // Feedback state
  const [error, setError] = useState(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [notifications, setNotifications] = useState([])
  const [notificationIds, setNotificationIds] = useState(new Set())

  // Result
  const [result, setResult] = useState(null)

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState("basic")

  // Confirmation
  const [showConfirmation, setShowConfirmation] = useState(() => {
    try {
      const saved = sessionStorage.getItem("cg_showConfirmation")
      return saved === "true"
    } catch {
      return false
    }
  })

  const [courseStructure, setCourseStructure] = useState(() => {
    try {
      const saved = sessionStorage.getItem("cg_courseStructure")
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [coursePaymentDone, setCoursePaymentDone] = useState({
    is_payment_done: false,
    course_generation_payment_id: null,
    tier_id: null
  });

  const [courseGenerationHistoryId, setCourseGenerationHistoryId] = useState(() => {
    try {
      return sessionStorage.getItem("cg_courseGenerationHistoryId") || null
    } catch {
      return null
    }
  });

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("cg_showConfirmation", showConfirmation)
  }, [showConfirmation])

  useEffect(() => {
    if (courseStructure) {
      sessionStorage.setItem("cg_courseStructure", JSON.stringify(courseStructure))
    } else {
      sessionStorage.removeItem("cg_courseStructure")
    }
  }, [courseStructure])

  useEffect(() => {
    if (courseGenerationHistoryId) {
      sessionStorage.setItem("cg_courseGenerationHistoryId", courseGenerationHistoryId)
    } else {
      sessionStorage.removeItem("cg_courseGenerationHistoryId")
    }
  }, [courseGenerationHistoryId])

  // Tier Selection
  const [selectedTierSelection, setSelectedTierSelection] = useState("basic")

  // Course Generation History
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)

  const [selectedItems, setSelectedItems] = useState({
    sessions: [],
    modules: [],
    topics: [],
    assignments: [],
    quizzes: [],
    topicContent: []
  })

  useStudentAuthTokenRefresh();

  const [doYourOwnCourseGenerateAndSave] = useDoYourOwnCourseGenerateAndSaveMutation()
  const [doYourOwnCourseStructureGenerate] = useDoYourOwnCourseStructureGenerateMutation()
  const [getCourseHistoryById] = useLazyGetCourseGenerationHistoryByIdQuery();

  const {
    data: historyData,
    refetch: refetchHistory
  } = useGetUserCourseGenerationHistoryQuery({ access_token });

  // Rest of the existing component logic continues...
  useEffect(() => {
    if (courseStructure) {
      const defaultSelections = {
        sessions: [],
        modules: [],
        topics: [],
        assignments: [],
        quizzes: [],
        topicContent: [] // Add this line
      }

      courseStructure.course.sessions.forEach((session, sessionIndex) => {
        const sessionNum = sessionIndex + 1
        const sessionKey = sessionNum.toString()
        defaultSelections.sessions.push(sessionKey)

        session.modules.forEach((module, moduleIndex) => {
          const moduleNum = moduleIndex + 1
          const moduleKey = `${sessionNum}-${moduleNum}`
          defaultSelections.modules.push(moduleKey)

          // Topics and their content
          module.topics?.forEach((topic, topicIndex) => {
            const topicKey = `${sessionNum}-${moduleNum}-${topicIndex}`
            defaultSelections.topics.push(topicKey)

            // Add topic content items
            topic.topic_content?.forEach((contentItem, contentIndex) => {
              const contentKey = `${sessionNum}-${moduleNum}-${topicIndex}-${contentItem.type}-${contentIndex}`
              defaultSelections.topicContent.push(contentKey)
            })
          })

          // Assignments
          module.assignments?.forEach((_, assignmentIndex) => {
            defaultSelections.assignments.push(`${sessionNum}-${moduleNum}-assignment-${assignmentIndex}`)
          })

          // Quizzes
          module.quizzes?.forEach((_, quizIndex) => {
            defaultSelections.quizzes.push(`${sessionNum}-${moduleNum}-quiz-${quizIndex}`)
          })
        })
      })

      setSelectedItems(defaultSelections)
    }
  }, [courseStructure])

  // Fetch difficulty levels dynamically from API
  const { data: difficultyLevelsData, isLoading: difficultyLevelsLoading } = useGetAllActiveDifficultyLevelsQuery();

  const difficultyLevels = useMemo(() => {
    if (!difficultyLevelsData?.data) return [];
    const iconMap = { 0: Target, 1: BookOpen, 2: Users };
    return difficultyLevelsData.data.map((dl, index) => ({
      id: dl.id,
      name: dl.name,
      description: dl.description || `${dl.name} level courses`,
      icon: iconMap[index % 3] || Target,
    }));
  }, [difficultyLevelsData]);

  useEffect(() => {
    if (submitting) {
      // Initialize socket with the correct URL from environment variables
      const newSocket = io(import.meta.env.VITE_BACKEND_MEDIA_URL, {
        transports: ["websocket"],
      })

      setSocket(newSocket)

      newSocket.on("connect", () => {
        setIsConnected(true)
        addNotification("success", "Connected", "Real-time updates enabled")
      })

      newSocket.on("disconnect", () => {
        setIsConnected(false)
        addNotification("warning", "Disconnected", "Connection lost, attempting to reconnect...")
      })

      // Register course progress updates
      newSocket.emit("register-course-progress", { userId })

      // Listen for course progress events
      newSocket.on("course-progress", (data) => {
        setProgress((prev) => [...prev, data])

        // Show notifications for key milestones only
        const showNotificationFor = [
          "database_transformed",
          "thumbnail_generated",
          "course_saved",
          "topic_generated",
          "assignments_generated",
          "quiz_generated",
          "complete",
          "error"
        ]

        if (showNotificationFor.includes(data.step)) {
          const getNotificationDetails = () => {
            switch (data.step) {
              case "database_transformed":
                return { title: "Structure Ready", message: "Course structure generated successfully" };
              case "thumbnail_generated":
                return { title: "Thumbnail Created", message: "Course thumbnail generated" };
              case "course_saved":
                return { title: "Course Saved", message: "Course structure saved to database" };
              case "topic_generated":
                return {
                  title: "Topic Complete",
                  message: `Generated: ${data.data?.topicTitle || 'Topic'}`
                };
              case "assignments_generated":
                return {
                  title: "Assignment Complete",
                  message: `Generated assignment for module`
                };
              case "quiz_generated":
                return {
                  title: "Quiz Complete",
                  message: `Generated: ${data.data?.quizTitle || 'Quiz'}`
                };
              case "complete":
                return { title: "Course Ready!", message: "Your course has been generated successfully" };
              case "error":
                return { title: "Generation Error", message: data?.message || "An error occurred" };
              default:
                return { title: "Update", message: data?.message || "Processing..." };
            }
          }

          const { title, message } = getNotificationDetails()
          const type = data.step === "error" ? "error" :
            data.step === "complete" ? "success" : "info"

          const uniqueKey = `${data.step}-${data.data?.topicTitle || data.data?.quizTitle || Date.now()}`
          addNotification(type, title, message, data.data, uniqueKey)
        }

        if (data.step === "complete") {
          setSubmitting(false)
          setSuccess(true)
          setShowSuccessModal(true)
          setShowProgress(false)
        }

        if (data.step === "error") {
          setSubmitting(false)
          setError(data?.message)
          setShowErrorModal(true)
          setShowProgress(false)
        }
      })

      return () => {
        newSocket.disconnect()
      }
    }
  }, [submitting, userId])

  const handleTierSelect = (tier) => {
    setSelectedTierSelection(tier);
  };

  const handleDifficultyClick = (level) => {
    if (!submitting) {
      setDifficulty({ id: level.id, name: level.name.toLowerCase() });
      setSelectedDifficultyLevelId(level.id);
      // Reset tier selection when difficulty changes
      setSelectedTierSelection("basic");
    }
  };

  const handleSelectHistory = async (historyId) => {
    try {
      const response = await getCourseHistoryById({ id: historyId, access_token }).unwrap();
      if (response?.data?.structure) {
        handleDifficultyClick(response.data.structure.level)
        setCourseStructure(response.data.structure.course);
        setCourseGenerationHistoryId(response.data.id);
        setCoursePaymentDone({
          is_payment_done: response?.data?.is_payment_done,
          course_generation_payment_id: response?.data?.course_generation_payment_id,
          tier_id: response?.data?.tier_id
        })
        setShowConfirmation(true);
      } else {
        toast.error("Failed to load history");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to fetch history");
    }
  };

  const addNotification = (type, title, message, data = null, uniqueKey = null) => {
    const key = uniqueKey || `${type}-${title}-${Date.now()}`

    // Prevent duplicate notifications
    if (notificationIds.has(key)) return

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const notification = {
      id,
      type,
      title,
      message,
      data,
      progress: data?.progress || null,
    }

    setNotifications((prev) => [notification, ...prev]) // Add to beginning for chat-like behavior
    setNotificationIds((prev) => new Set([...prev, key]))

    // Auto-remove after 6 seconds (increased for better readability)
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setNotificationIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }, 6000)
  }

  // Remove notification function
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const parsed = useMemo(() => {
    const payload = result?.data ?? result
    const courseRoot = payload?.course
    const level2 = courseRoot?.course
    const courseObj = level2?.course ?? payload?.course?.course ?? payload?.course

    // Enhanced courseHash extraction
    const courseHash =
      payload?.courseHash ||
      courseRoot?.courseHash ||
      level2?.courseHash ||
      courseObj?.public_hash ||
      courseObj?.courseHash ||
      courseObj?.hash

    const successFlag = Boolean(courseRoot?.success ?? level2?.success ?? payload?.success)
    return { course: courseObj, courseHash, courseTitle: payload?.courseTitle, successFlag }
  }, [result])

  async function generateCourse({ difficulty_level, userQuery, contentFiles, selectedTierSelection }, confirmed = false) {
    // Reset progress and feedback state
    setProgress([])
    setError(null)
    setSuccess(false)
    setShowSuccessModal(false)
    setShowErrorModal(false)
    setResult(null)

    if (userQuery.trim().length < 8) {
      setError("Please provide a more detailed course description (at least 8 characters)")
      setShowErrorModal(true)
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append("difficulty_level", difficulty_level)
      formData.append("userQuery", userQuery)
      formData.append("tier", selectedTierSelection)
      contentFiles.forEach((file, index) => {
        formData.append(`contentFiles`, file)
        formData.append(`fileNames`, file.name)
      })

      const response = await doYourOwnCourseStructureGenerate(formData)

      if (response?.data?.courseStructure) {
        // Show confirmation modal instead of immediately generating
        setCourseStructure(response.data.courseStructure)
        setCourseGenerationHistoryId(response.data?.courseGenerationHistoryId)

        refetchHistory();

        if (!confirmed) {
          setShowConfirmation(true)
          setSubmitting(false)
          return
        }

        // If confirmed, proceed with generation
        setShowProgress(true)
        setShowConfirmation(false)

        // This would call your new confirmAndGenerateCourse API
        // For now, we'll simulate the response structure
        setResult(response)
        const ok = response?.data?.success === true
        setSuccess(ok)
        if (ok) {
          setShowSuccessModal(true)
        }
      } else {
        const msg = response?.error?.data?.error || "Failed to generate course structure. Please try again."
        setError(msg)
        setShowErrorModal(true)
        setSubmitting(false)
      }
    } catch (err) {
      const msg = err?.message || err?.data?.error || "Failed to generate course. Please try again."
      setError(msg)
      setShowErrorModal(true)
      setSubmitting(false)
    }
  }

  // Enhanced filter function with assignment support
  const filterCourseStructure = (courseStructure, selectedItems) => {
    if (!courseStructure?.course?.sessions) return courseStructure

    let globalModuleCounter = 1

    const filteredSessions = courseStructure.course.sessions
      .map((session, sessionIndex) => {
        const sessionKey = (sessionIndex + 1).toString()

        // If session is not selected, return null (will be filtered out)
        if (!selectedItems.sessions.includes(sessionKey)) {
          return null
        }

        // Filter modules within this session
        const filteredModules = session.modules
          .map((module, moduleIndex) => {
            const moduleKey = `${sessionIndex + 1}-${moduleIndex + 1}`

            // If module is not selected, return null (will be filtered out)
            if (!selectedItems.modules.includes(moduleKey)) {
              return null
            }

            // Filter topics and their topic_content
            const filteredTopics =
              module.topics
                ?.map((topic, topicIndex) => {
                  const topicKey = `${sessionIndex + 1}-${moduleIndex + 1}-${topicIndex}`

                  // If topic is not selected, return null (skip entire topic)
                  if (!selectedItems.topics.includes(topicKey)) {
                    return null
                  }

                  // Filter topic_content (assignments and quizzes within this topic)
                  const filteredTopicContent = topic.topic_content?.filter((contentItem, contentIndex) => {
                    if (contentItem.type === 'assignment') {
                      const contentKey = `${sessionIndex + 1}-${moduleIndex + 1}-${topicIndex}-assignment-${contentIndex}`
                      return selectedItems.topicContent?.includes(contentKey) ?? false
                    } else if (contentItem.type === 'quiz') {
                      const contentKey = `${sessionIndex + 1}-${moduleIndex + 1}-${topicIndex}-quiz-${contentIndex}`
                      return selectedItems.topicContent?.includes(contentKey) ?? false
                    }
                    // Keep other content types by default if they exist
                    return true
                  }) || []

                  // Return topic with filtered content
                  return {
                    ...topic,
                    topic_content: filteredTopicContent
                  }
                })
                .filter(Boolean) || []

            const filteredAssignments =
              module.assignments
                ?.map((assignment, assignmentIndex) => {
                  const assignmentKey = `${sessionIndex + 1}-${moduleIndex + 1}-assignment-${assignmentIndex}`
                  return selectedItems.assignments.includes(assignmentKey) ? assignment : null
                })
                .filter(Boolean) || []

            const filteredQuizzes =
              module.quizzes
                ?.map((quiz, quizIndex) => {
                  const quizKey = `${sessionIndex + 1}-${moduleIndex + 1}-quiz-${quizIndex}`
                  return selectedItems.quizzes.includes(quizKey) ? quiz : null
                })
                .filter(Boolean) || []

            return {
              ...module,
              topics: filteredTopics,
              assignments: filteredAssignments,
              quizzes: filteredQuizzes,
            }
          })
          .filter(Boolean)

        return filteredModules.length > 0
          ? {
            ...session,
            modules: filteredModules,
          }
          : null
      })
      .filter(Boolean)

    // Now renumber sessions and modules sequentially
    const renumberedSessions = filteredSessions.map((session, newSessionIndex) => {
      const newSessionNumber = newSessionIndex + 1

      const renumberedModules = session.modules.map((module, newModuleIndex) => {
        const newModuleNumber = globalModuleCounter++

        return {
          ...module,
          session_number: newSessionNumber,
          module_number: newModuleNumber,
        }
      })

      return {
        ...session,
        session_number: newSessionNumber,
        modules: renumberedModules,
      }
    })

    return {
      ...courseStructure,
      course: {
        ...courseStructure.course,
        sessions: renumberedSessions,
      },
    }
  }

  const handleConfirmGeneration = async (tier = "basic", tierId, courseGenerationPaymentId) => {
    if (!courseStructure) return

    try {
      setSubmitting(true)
      setShowConfirmation(false)
      setShowPaymentModal(false) // Close payment modal
      setSelectedTier(tier) // Store the selected tier
      setShowProgress(true)

      // Filter courseStructure based on selected items
      const filteredCourseStructure = filterCourseStructure(courseStructure, selectedItems)

      // Add tier information to the request
      const response = await doYourOwnCourseGenerateAndSave({
        data: {
          courseStructure: filteredCourseStructure,
          selectedItems,
          userId,
          tier_id: tierId, // Pass the selected tier to the backend
          courseGenerationPaymentId
        },
        access_token: access_token
      })

      const result = response.data

      if (result?.success) {
        setResult(result)
        setSuccess(true)
        setShowSuccessModal(true)
      } else {
        throw new Error(response?.error?.data?.error || "Generation failed")
      }
    } catch (err) {
      setError(err?.message)
      setShowErrorModal(true)
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!showErrorModal) return
    const t = setTimeout(() => {
      setShowErrorModal(false)
    }, 5000)
    return () => clearTimeout(t)
  }, [showErrorModal])

  useEffect(() => {
    if (!showSuccessModal || !parsed.courseHash) return

    const t = setTimeout(() => {
      handleGoToCourse()
    }, 3000)

    return () => clearTimeout(t)
  }, [showSuccessModal, parsed.courseHash])

  function handleGoToCourse() {
    if (!parsed.courseHash) {
      console.error("No courseHash available for navigation")
      return
    }

    // Navigate using courseHash directly
    navigate(`/course/${slugify(parsed.courseTitle)}`, {
      state: {
        public_hash: parsed.courseHash,
      },
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    generateCourse({ difficulty_level: JSON.stringify(difficulty), userQuery, contentFiles, selectedTierSelection }, false)
  }

  const handleReset = () => {
    setUserQuery("")
    setDifficulty(null)
    setSelectedDifficultyLevelId(null)
    setContentFiles([])
    setError(null)
    setResult(null)
    setSuccess(false)
    setShowErrorModal(false)
    setShowSuccessModal(false)
    setNotifications([])
    setNotificationIds(new Set())
  }

  // Feature status query
  const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
    useGetFeatureStatusByNameQuery(
      { name: "do_your_own_course_ai" }
    );

  useEffect(() => {
    if (!access_token && Boolean(featureData?.is_active)) {
      navigate("/");
      openLogin();
    }
  }, [access_token, navigate, featureData, openLogin]);

  useEffect(() => {
    if (isLoaded && !userId && Boolean(featureData?.is_active)) {
      navigate("/");
      openLogin();
    }
  }, [isLoaded, userId, navigate, featureData, openLogin]);

  // Show coming soon page if feature is inactive
  if (featureData?.is_active === 0) {
    return <ComingSoonModal featureData={featureData} />;
  }

  // Show loading state for feature data
  if (featureDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Course Generator...</p>
        </div>
      </div>
    );
  }

  // Show error state for feature data
  if (featureDataError) {
    return (
      <div className="text-red-500 text-center p-4 bg-red-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
          <p>Error loading feature status: {featureDataError?.toString()}</p>
        </div>
      </div>
    );
  }


  return (

    <div className="h-screen w-full bg-white flex flex-col lg:overflow-hidden overflow-y-auto">
      <DefaultSEOMeta />
      {/* Enhanced Progress Display */}
      {showProgress && !showConfirmation && (
        <ProgressDisplay progress={progress} isConnected={isConnected} onClose={() => setShowProgress(false)} />
      )}

      <div className="flex-1 w-full lg:h-full lg:overflow-hidden">
        {showConfirmation || showPaymentModal ? (
          <ConfirmationModal
            open={true}
            onClose={() => {
              setShowConfirmation(false)
              setSubmitting(false)
            }}
            courseStructure={courseStructure}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onConfirm={() => {
              if (coursePaymentDone?.is_payment_done) {
                handleConfirmGeneration("basic", coursePaymentDone.tier_id, coursePaymentDone.course_generation_payment_id);
              } else {
                setShowConfirmation(false)
                setShowPaymentModal(true)
              }
            }}
          />
        ) : (
          <form onSubmit={handleSubmit} className="lg:h-full grid grid-cols-1 lg:grid-cols-2">

            {/* Main Form - Left Side */}
            <div className="lg:h-full flex flex-col lg:min-h-0 bg-white lg:border-r border-gray-100">
              <div className="lg:flex-1 lg:overflow-y-auto px-4 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10 scrollbar-thin scrollbar-thumb-gray-200">
                <div className="space-y-8 max-w-2xl mx-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2 md:mb-0">
                    {/* Mobile Header */}
                    <div className="flex items-center w-full md:hidden">
                      <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-600">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h1 className="flex-1 text-center text-sm font-bold tracking-widest text-gray-500 uppercase">New Course</h1>
                      <div className="w-8" />
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden md:flex items-center justify-between w-full">
                      <h1 className="text-2xl font-bold text-gray-900">Do Your Own Course</h1>
                      <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center px-4 py-1.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                        Back
                      </button>
                    </div>
                  </div>

                  {/* Difficulty Selector */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">Difficulty Level</label>
                    <label className="hidden md:block text-base font-semibold text-gray-900">Difficulty Level</label>

                    {difficultyLevelsLoading ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                      </div>
                    ) : (
                      <>
                        {/* Mobile: Integrated Segmented Control */}
                        <div className="flex bg-gray-50 p-1.5 rounded-full md:hidden relative overflow-x-auto">
                          {difficultyLevels.map((level) => (
                            <button
                              key={level.id}
                              type="button"
                              onClick={() => !submitting && handleDifficultyClick(level)}
                              className={`flex-1 py-2.5 text-xs font-medium rounded-full transition-all duration-200 z-10 whitespace-nowrap px-2 ${selectedDifficultyLevelId === level.id
                                ? "bg-white text-green-700 shadow-sm ring-1 ring-black/5"
                                : "text-gray-400 hover:text-gray-600"
                                }`}
                            >
                              {level.name}
                            </button>
                          ))}
                        </div>

                        {/* Desktop: Cards */}
                        <div className={`hidden md:grid gap-4 ${difficultyLevels.length <= 3 ? `grid-cols-${difficultyLevels.length}` : 'grid-cols-3'}`}>
                          {difficultyLevels.map((level, index) => {
                            const IconComp = level.icon;
                            return (
                              <button
                                type="button"
                                key={level.id}
                                className={`group relative flex flex-col items-start p-5 rounded-xl border text-left transition-all duration-200 h-full ${selectedDifficultyLevelId === level.id
                                  ? "border-green-600 bg-green-50 ring-1 ring-green-600"
                                  : "border-gray-200 bg-white hover:border-green-200 hover:shadow-sm"
                                  }`}
                                onClick={() => !submitting && handleDifficultyClick(level)}
                              >
                                <div className={`p-2 rounded-lg mb-3 ${selectedDifficultyLevelId === level.id ? "bg-white text-green-700 ring-1 ring-green-100" : "bg-gray-100 text-gray-500 group-hover:bg-green-50 group-hover:text-green-600"}`}>
                                  <IconComp className="w-5 h-5" />
                                </div>

                                <span className={`text-base font-bold mb-1 ${selectedDifficultyLevelId === level.id ? 'text-gray-900' : 'text-gray-900'}`}>
                                  {level.name}
                                </span>
                                <span className="text-xs text-gray-500 leading-relaxed">
                                  {level.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tier Selection - Inline */}
                  <TierSelectionDisplay
                    onTierSelect={handleTierSelect}
                    selectedTier={selectedTierSelection}
                    disabled={submitting}
                    difficultyLevelId={selectedDifficultyLevelId}
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Form Inputs & Actions */}
            <div className="lg:h-full flex flex-col lg:min-h-0 bg-white lg:bg-gray-50/30">
              <div className="lg:flex-1 lg:overflow-y-auto px-4 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10 scrollbar-thin scrollbar-thumb-gray-200 flex flex-col">
                <div className="max-w-xl mx-auto w-full space-y-8 flex-1 flex flex-col">
                  {/* Topic & Description */}
                  <div className="space-y-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <label htmlFor="userQuery" className="hidden md:block text-base font-semibold text-gray-900">
                        Topic & Description
                      </label>
                      <label htmlFor="userQuery" className="block text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">
                        Course Topic & Goals
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowHistorySidebar(true)}
                        className="flex items-center px-3 py-1.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors font-medium text-xs shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        History
                      </button>
                    </div>
                    <textarea
                      id="userQuery"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="E.g., Quantum Physics for Beginners using visual analogies..."
                      rows={6}
                      className="w-full rounded-xl border border-gray-200 px-5 py-4 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 focus:outline-none transition-all resize-none shadow-sm bg-white text-sm leading-relaxed"
                      disabled={submitting}
                    />
                  </div>

                  {/* References & Upload */}
                  <div className="space-y-4 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between">
                      <label className="block text-base font-semibold text-gray-900 md:block hidden">References</label>
                      <div className="flex justify-between items-center w-full md:w-auto">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">
                          References
                        </label>
                        <span className="text-[10px] text-gray-400 md:hidden">Max 10MB</span>
                      </div>


                    </div>

                    <div className="flex-1 flex flex-col min-h-[200px]">
                      <FileUpload files={contentFiles} onFilesChange={setContentFiles} disabled={submitting} />
                    </div>
                  </div>
                </div>

                {/* Actions Footer - Fixed at bottom of right col inside the container */}
                <div className="mt-8 pt-6 border-t border-gray-100 max-w-xl mx-auto w-full">
                  <div className="flex flex-col md:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] flex items-center justify-center rounded-lg bg-green-800 md:bg-green-600 px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-green-900/10 hover:bg-green-900 md:hover:bg-green-700 hover:shadow-green-900/20 focus:outline-none focus:ring-4 focus:ring-green-500/20 active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-75 order-1 md:order-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Course"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={submitting}
                      className="flex-1 px-6 py-2 md:py-3.5 rounded-lg border-none md:border md:border-gray-200 bg-transparent md:bg-white font-bold md:font-medium text-xs md:text-base text-gray-400 md:text-gray-700 hover:text-gray-600 md:hover:bg-gray-50 md:hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 shadow-none md:shadow-sm uppercase tracking-wider md:normal-case order-2 md:order-2"
                    >
                      <span className="md:hidden">Reset Selection</span>
                      <span className="hidden md:inline">Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </form>
        )}
      </div>

      {/* History Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${showHistorySidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Course History</h2>
            <button
              onClick={() => setShowHistorySidebar(false)}
              className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto">
            {historyData?.data?.length > 0 ? (
              <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                {historyData.data.map((item) => (
                  <div
                    key={item.id}
                    className="group p-3 md:p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
                    onClick={() => {
                      if (item.is_generated) {
                        toast.error("This Course Is Already Generated")
                      } else {
                        handleSelectHistory(item.id)
                        setShowHistorySidebar(false)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      {/* Icon with animation */}
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 
                          ${item.is_generated
                            ? "bg-green-100 group-hover:bg-green-200"
                            : Boolean(item.is_payment_done)
                              ? "bg-blue-100 group-hover:bg-blue-200"
                              : "bg-orange-100 group-hover:bg-orange-200"
                          }`}
                      >
                        {item.is_generated ? (
                          // Generated
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : Boolean(item.is_payment_done) ? (
                          // Payment Done but not generated
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a5 5 0 00-10 0v2M5 9h14l1 10H4L5 9z"
                            />
                          </svg>
                        ) : (
                          // Not generated
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-orange-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate transition-colors duration-200 group-hover:text-green-700">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 md:mt-1 transition-colors duration-200 group-hover:text-gray-700">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Hover arrow */}
                      <svg
                        className="w-3 h-3 md:w-4 md:h-4 text-gray-400 opacity-0 group-hover:opacity-100 transform translate-x-[-8px] md:translate-x-[-10px] group-hover:translate-x-0 transition-all duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 md:p-8">
                <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-base md:text-lg font-medium mb-1 md:mb-2">No Course History</p>
                <p className="text-gray-400 text-xs md:text-sm">Your generated courses will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {showHistorySidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setShowHistorySidebar(false)}
        />
      )}

      {/* Enhanced Modals */}
      <Modal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Generation Error"
        variant="error"
        autoCloseMs={5000}
      >
        <p>{error}</p>
      </Modal>

      <Modal
        open={showSuccessModal && !!parsed.courseHash}
        onClose={handleGoToCourse}
        title="🎉 Course Generated Successfully!"
        variant="success"
        showCloseButton={false}
      >
        {parsed.course ? (
          <div className="space-y-3 md:space-y-4">
            <div className="text-center">
              <h4 className="font-semibold text-green-800 text-base md:text-lg mb-1 md:mb-2">{parsed.course.title}</h4>
              {parsed.course.duration_minutes && (
                <p className="text-xs md:text-sm text-green-600 mb-1 md:mb-2">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                  Duration: {parsed.course.duration_minutes} minutes
                </p>
              )}
              {parsed.course.description && (
                <p className="text-xs md:text-sm text-green-600 line-clamp-3 mb-3 md:mb-4">{parsed.course.description}</p>
              )}
            </div>
            <div className="text-center">
              <button
                onClick={handleGoToCourse}
                className="inline-flex items-center rounded-lg bg-green-600 px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-lg"
              >
                <BookOpen className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                Start Learning Now
              </button>
              <p className="text-xs text-green-600 mt-1 md:mt-2">Redirecting automatically in 3 seconds...</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-green-600 mx-auto mb-1 md:mb-2" />
            <p className="text-xs md:text-sm text-green-700">Preparing your course...</p>
          </div>
        )}
      </Modal>



      <PaymentTierModal
        open={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setShowConfirmation(true) // Go back to confirmation modal
        }}
        selectedItems={selectedItems}
        courseStructure={courseStructure}
        onPaymentConfirm={handleConfirmGeneration} // This now accepts tier parameter
        difficultyLevelId={selectedDifficultyLevelId}
        courseGenerationHistoryId={courseGenerationHistoryId}
        preSelectedTier={selectedTierSelection}
      />
      <NotificationSystem notifications={notifications} onRemove={removeNotification} />
    </div>
  )
}