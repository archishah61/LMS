"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Edit3,
  Save,
  Wand2,
  Upload,
  X,
  Play,
  Volume2,
  FileText,
  HelpCircle,
  Presentation,
  BookOpen,
  Clock,
  Target,
  Sparkles,
  BarChart,
  Eye,
  Plus,
  ArrowLeft,
  Home,
  CheckCircle2,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import FilePreview from "./FilePreview"
import RegenerationSelector from "./RegenerationSelector"
import RegenerationModal from "./RegenerationModal"
import RegenerationConfirmationModal from "./RegenerationConfirmationModal"
import AddItemModal from "./AddItemModal"
import useRegeneration from "../hooks/useRegeneration"

// Import modular components
import StatusBadge from "../../../components/admin/CourseGenerator/UI/StatusBadge"
import FieldDisplay from "../../../components/admin/CourseGenerator/UI/FieldDisplay"
import EditableArray from "../../../components/admin/CourseGenerator/CourseStructure/EditableArray"
import EmptyState from "../../../components/admin/CourseGenerator/UI/EmptyState"
import DeleteConfirmationModal from "../../../components/admin/CourseGenerator/UI/DeleteConfirmationModal"
import SaveCourseModal from "../../../components/admin/CourseGenerator/UI/SaveCourseModal"
import SessionItem from "../../../components/admin/CourseGenerator/CourseStructure/SessionItem"
import { useAdminCourseStructureGenerateMutation, useAdminCourseStructureRegenerateMutation, useDoYourOwnCourseGenerateAndSaveMutation } from "../../../services/AIServices"
import { getAdminToken } from "../../../services/CookieService"
import CourseSkeleton from "../../../components/admin/CourseGenerator/Skeletons/CourseSkeleton"
import useAdminAuthRefreshToken from "../../../hooks/useAdminAuthTokenRefresh"
import toast from "react-hot-toast"

const contentStyles = ["professional", "friendly", "funny", "comparative", "story_based", "tutorial", "academic"]
const CourseGeneratorAdmin = () => {
  const navigate = useNavigate()

  useAdminAuthRefreshToken()

  const { access_token } = getAdminToken()
  const [courseData, setCourseData] = useState(null)
  const [expandedItems, setExpandedItems] = useState({})
  const [editingItems, setEditingItems] = useState({})
  const [selectedForRegeneration, setSelectedForRegeneration] = useState([])
  const [regeneratingItems, setRegeneratingItems] = useState(new Set())
  const [prompt, setPrompt] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [accordionState, setAccordionState] = useState({})

  const [contentStyle, setContentStyle] = useState("academic") // "quick" or "detailed"
  const [generationMode, setGenerationMode] = useState("quick") // "quick" or "detailed"
  const [estimatedHours, setEstimatedHours] = useState(4)

  const [addItemModal, setAddItemModal] = useState({
    isOpen: false,
    type: "",
    parentId: null,
    parentTitle: "",
  })
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: "",
    id: null,
    parentId: null,
    title: "",
    isDeleting: false,
  })

  // File preview state
  const [filePreview, setFilePreview] = useState({
    isOpen: false,
    file: null,
  })

  const [saveModal, setSaveModal] = useState({
    isOpen: false,
    isSaving: false,
  })


  const [adminCourseStructureGenerate] = useAdminCourseStructureGenerateMutation()
  const [adminCourseStructureRegenerate] = useAdminCourseStructureRegenerateMutation()
  const [doYourOwnCourseGenerateAndSave] = useDoYourOwnCourseGenerateAndSaveMutation()

  // Regeneration hook
  const {
    regenerationState,
    openRegenerationModal,
    closeRegenerationModal,
    updateRegenerationItem,
    removeRegenerationItem,
    startRegeneration,
    closeConfirmationModal,
    confirmChanges,
    discardChanges,
  } = useRegeneration(
    courseData,
    setCourseData,
    setSelectedForRegeneration,
    adminCourseStructureRegenerate
  )

  // Check if we have valid course data
  const hasCourse = courseData

  // Navigation handler for back to dashboard
  const handleBackToDashboard = useCallback(() => {
    navigate("/admin/dashboard")
  }, [navigate])

  // Memoized statistics calculation with null safety
  const stats = useMemo(() => {
    if (!hasCourse) {
      return {
        sessions: 0,
        modules: 0,
        topics: 0,
        duration: 0,
        totalVideos: 0,
        totalAudio: 0,
        totalAccordian: 0,
        totalSlides: 0,
        totalGeneralMaterial: 0,
      }
    }

    const sessions = courseData.sessions?.length || 0
    const modules = courseData.sessions?.reduce((acc, s) => acc + (s.modules?.length || 0), 0) || 0
    const topics =
      courseData.sessions?.reduce(
        (acc, s) => acc + (s.modules?.reduce((mAcc, m) => mAcc + (m.topics?.length || 0), 0) || 0),
        0,
      ) || 0
    const duration = courseData.duration || 0

    let totalVideos = 0
    let totalAudio = 0
    let totalAccordian = 0
    let totalSlides = 0
    let totalGeneralMaterial = 0

    courseData.sessions?.forEach((session) => {
      session.modules?.forEach((module) => {
        module.topics?.forEach((topic) => {
          if (topic.type === "video") totalVideos++
          else if (topic.type === "audio") totalAudio++
          else if (topic.type === "accordian") totalAccordian++
          else if (topic.type === "slide") totalSlides++
          else if (topic.type === "general") totalGeneralMaterial++
        })
      })
    })

    return {
      sessions,
      modules,
      topics,
      duration,
      totalVideos,
      totalAudio,
      totalAccordian,
      totalSlides,
      totalGeneralMaterial,
    }
  }, [courseData, hasCourse])

  const openSaveModal = useCallback(() => {
    setSaveModal({ isOpen: true, isSaving: false })
  }, [])

  const closeSaveModal = useCallback(() => {
    setSaveModal({ isOpen: false, isSaving: false })
  }, [])

  const convertBase64ToFile = (base64Data, fileName, mimeType) => {
    try {
      // Convert base64 to binary
      const binaryString = atob(base64Data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      // Create blob and file
      const blob = new Blob([bytes], { type: mimeType })
      const file = new File([blob], fileName, { type: mimeType })
      return file
    } catch (error) {
      console.error("Error converting base64 to file:", error)
      return null
    }
  }

  const normalizeCourseStructure = (courseData) => {
    if (!courseData?.sessions) return courseData

    // Create a deep copy to avoid mutating the original
    const normalizedCourse = JSON.parse(JSON.stringify(courseData))

    let sessionCounter = 1
    let moduleCounter = 1
    let topicCounter = 1

    // Normalize sessions
    normalizedCourse.sessions = normalizedCourse.sessions.map((session, sessionIndex) => {
      const normalizedSession = {
        ...session,
        session_number: sessionCounter++,
        sequence_no: sessionIndex + 1,
      }

      // Normalize modules within this session
      if (normalizedSession.modules) {
        normalizedSession.modules = normalizedSession.modules.map((module, moduleIndex) => {
          const normalizedModule = {
            ...module,
            module_number: moduleCounter++,
            session_number: normalizedSession.session_number,
            sequence_no: moduleIndex + 1,
          }

          // Normalize topics within this module
          if (normalizedModule.topics) {
            normalizedModule.topics = normalizedModule.topics.map((topic, topicIndex) => {
              return {
                ...topic,
                topic_number: topicCounter++,
                module_number: normalizedModule.module_number,
                sequence_no: topicIndex + 1,
              }
            })
          }

          // Normalize assignments (if they have sequence numbers)
          if (normalizedModule.assignments) {
            normalizedModule.assignments = normalizedModule.assignments.map((assignment, assignmentIndex) => ({
              ...assignment,
              sequence_no: assignmentIndex + 1,
            }))
          }

          // Normalize quizzes (if they have sequence numbers)
          if (normalizedModule.quizzes) {
            normalizedModule.quizzes = normalizedModule.quizzes.map((quiz, quizIndex) => ({
              ...quiz,
              sequence_no: quizIndex + 1,
            }))
          }

          return normalizedModule
        })
      }

      return normalizedSession
    })

    return normalizedCourse
  }

  const handleSaveConfirm = useCallback(async () => {
    setSaveModal((prev) => ({ ...prev, isSaving: true }))
    try {
      // Normalize the course structure before saving
      const normalizedCourseData = normalizeCourseStructure(courseData)

      // Filter out any temporary IDs or frontend-only fields if needed
      const filteredCourseStructure = {
        course: {
          ...normalizedCourseData
        }
      }

      // You may need to adjust this based on your API requirements
      const response = await doYourOwnCourseGenerateAndSave({
        data: { courseStructure: filteredCourseStructure },
        access_token: access_token
      }).unwrap()

      toast.success("Course saved successfully!")
      closeSaveModal()

      // Optionally navigate or refresh after save
      navigate('/admin/dashboard/course')
    } catch (error) {
      console.error("Error saving course:", error)
      const errorMessage =
        error?.data?.error || error?.data?.message || error?.error || error?.message || "Failed to save course"
      toast.error(`Failed to save course: ${errorMessage}`)
      setSaveModal((prev) => ({ ...prev, isSaving: false }))
    }
  }, [courseData, closeSaveModal, doYourOwnCourseGenerateAndSave])

  // File preview handlers
  const openFilePreview = useCallback((file) => {
    setFilePreview({ isOpen: true, file })
  }, [])

  const closeFilePreview = useCallback(() => {
    setFilePreview({ isOpen: false, file: null })
  }, [])

  // Memoized callbacks to prevent unnecessary re-renders
  const toggleExpanded = useCallback((type, id) => {
    const key = `${type}_${id}`
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }, [])

  const toggleEditing = useCallback((type, id) => {
    const key = `${type}_${id}`
    setEditingItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }, [])

  const toggleAccordion = useCallback((id) => {
    setAccordionState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

  const updateCourseField = useCallback((field, value) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // In your main component, update the field update functions to handle the number-based IDs
  const updateSessionField = useCallback((sessionId, field, value) => {
    setCourseData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        (session.session_number || session.id) === sessionId
          ? { ...session, [field]: value }
          : session
      ),
    }))
  }, [])

  const updateModuleField = useCallback((sessionId, moduleId, field, value) => {
    setCourseData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        (session.session_number || session.id) === sessionId
          ? {
            ...session,
            modules: session.modules.map((module) =>
              (module.module_number || module.id) === moduleId
                ? { ...module, [field]: value }
                : module
            ),
          }
          : session,
      ),
    }))
  }, [])

  const updateTopicField = useCallback((sessionId, moduleId, topicId, field, value) => {
    setCourseData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        (session.session_number || session.id) === sessionId
          ? {
            ...session,
            modules: session.modules.map((module) =>
              (module.module_number || module.id) === moduleId
                ? {
                  ...module,
                  topics: module.topics.map((topic) =>
                    (topic.topic_number || topic.id) === topicId
                      ? { ...topic, [field]: value }
                      : topic
                  ),
                }
                : module,
            ),
          }
          : session,
      ),
    }))
  }, [])

  const updateQuizField = useCallback((sessionId, moduleId, quizId, field, value) => {
    setCourseData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        (session.session_number || session.id) === sessionId
          ? {
            ...session,
            modules: session.modules.map((module) =>
              (module.module_number || module.id) === moduleId
                ? {
                  ...module,
                  quizzes: module.quizzes?.map((quiz) =>
                    (quiz.quiz_number || quiz.id) === quizId
                      ? { ...quiz, [field]: value }
                      : quiz
                  ) || [],
                }
                : module
            ),
          }
          : session
      ),
    }))
  }, [])

  const updateAssignmentField = useCallback((sessionId, moduleId, assignmentId, field, value) => {
    setCourseData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        (session.session_number || session.id) === sessionId
          ? {
            ...session,
            modules: session.modules.map((module) =>
              (module.module_number || module.id) === moduleId
                ? {
                  ...module,
                  assignments: module.assignments?.map((assignment) =>
                    (assignment.assignment_number || assignment.id) === assignmentId
                      ? { ...assignment, [field]: value }
                      : assignment
                  ) || [],
                }
                : module
            ),
          }
          : session
      ),
    }))
  }, [])

  const updateArrayField = useCallback((field, index, value) => {
    setCourseData((prev) => {
      const newArray = [...prev[field]]
      newArray[index] = value
      return {
        ...prev,
        [field]: newArray,
      }
    })
  }, [])

  const addArrayItem = useCallback((field, value) => {
    if (value.trim()) {
      setCourseData((prev) => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()],
      }))
    }
  }, [])

  const removeArrayItem = useCallback((field, index) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate course content.")
      return
    }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append("userQuery", prompt)
      formData.append("contentStyle", contentStyle)
      formData.append("generation_mode", generationMode)
      if (generationMode === "detailed") {
        formData.append("estimated_hours", estimatedHours)
      }

      uploadedFiles.forEach((file, index) => {
        formData.append(`contentFiles`, file)
        formData.append(`fileNames`, file.name)
      })

      const response = await adminCourseStructureGenerate(formData).unwrap()

      // Response format: { data: { course: { course: {...} } } }
      if (response?.data?.course?.course) {
        setCourseData(response.data.course.course)
      } else if (response?.course?.course) {
        // Fallback in case structure is slightly different
        setCourseData(response.course?.course)
      } else {
        throw new Error("Invalid response structure")
      }

      setUploadedFiles([])
      setPrompt("")
    } catch (error) {
      console.error("Error generating course:", error)
      toast.error("Failed to generate course. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, uploadedFiles, adminCourseStructureGenerate, contentStyle, generationMode, estimatedHours])

  const removeAllFiles = useCallback(() => {
    setUploadedFiles([])
  }, [])

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  const handleFileUpload = useCallback(
    (event) => {
      const files = Array.from(event.target.files || [])
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ]

      // Removed file size and count restrictions
      const validFiles = []
      const errors = []

      files.forEach((file, index) => {
        if (!allowedTypes.includes(file.type)) {
          errors.push(`${file.name}: Unsupported file type`)
          return
        }
        validFiles.push(file)
      })

      if (errors.length > 0) {
        toast.error("Upload errors:\n" + errors.join("\n"))
        return
      }

      setUploadedFiles((prev) => [...prev, ...validFiles])
      event.target.value = ""
    },
    [uploadedFiles],
  )

  const removeFile = useCallback((index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const openAddItemModal = useCallback((type, parentId = null, parentTitle = "") => {
    setAddItemModal({ isOpen: true, type, parentId, parentTitle })
  }, [])

  const closeAddItemModal = useCallback(() => {
    setAddItemModal({
      isOpen: false,
      type: "",
      parentId: null,
      parentTitle: "",
    })
  }, [])

  // 1. First define openDeleteModal
  const openDeleteModal = useCallback((type, id, title, parentId = null) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      parentId,
      title,
      isDeleting: false,
    })
  }, [])

  // 2. Then define closeDeleteModal
  const closeDeleteModal = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      type: "",
      id: null,
      parentId: null,
      title: "",
      isDeleting: false,
    })
  }, [])

  // 3. Then define handleDeleteConfirm
  const handleDeleteConfirm = useCallback(() => {
    const { type, id, parentId } = deleteModal
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }))

    setTimeout(() => {
      setCourseData((prev) => {
        if (type === "session") {
          return {
            ...prev,
            sessions: prev.sessions.filter((session) =>
              (session.session_number || session.id) !== id
            ),
          }
        } else if (type === "module") {
          return {
            ...prev,
            sessions: prev.sessions.map((session) =>
              (session.session_number || session.id) === parentId
                ? {
                  ...session,
                  modules: session.modules.filter((module) =>
                    (module.module_number || module.id) !== id
                  ),
                }
                : session,
            ),
          }
        } else if (type === "topic") {
          const [sessionId, moduleId] = parentId.split("_")
          return {
            ...prev,
            sessions: prev.sessions.map((session) =>
              (session.session_number || session.id) === parseInt(sessionId)
                ? {
                  ...session,
                  modules: session.modules.map((module) =>
                    (module.module_number || module.id) === parseInt(moduleId)
                      ? {
                        ...module,
                        topics: module.topics.filter((topic) =>
                          (topic.topic_number || topic.id) !== id
                        ),
                      }
                      : module,
                  ),
                }
                : session,
            ),
          }
        } else if (type === "quiz") {
          const [sessionId, moduleId] = parentId.split("_")
          return {
            ...prev,
            sessions: prev.sessions.map((session) =>
              (session.session_number || session.id) === parseInt(sessionId)
                ? {
                  ...session,
                  modules: session.modules.map((module) =>
                    (module.module_number || module.id) === parseInt(moduleId)
                      ? {
                        ...module,
                        quizzes: module.quizzes?.filter((quiz) =>
                          (quiz.quiz_number || quiz.id) !== id
                        ) || [],
                      }
                      : module,
                  ),
                }
                : session,
            ),
          }
        } else if (type === "assignment") {
          const [sessionId, moduleId] = parentId.split("_")
          return {
            ...prev,
            sessions: prev.sessions.map((session) =>
              (session.session_number || session.id) === parseInt(sessionId)
                ? {
                  ...session,
                  modules: session.modules.map((module) =>
                    (module.module_number || module.id) === parseInt(moduleId)
                      ? {
                        ...module,
                        assignments: module.assignments?.filter((assignment) =>
                          (assignment.assignment_number || assignment.id) !== id
                        ) || [],
                      }
                      : module,
                  ),
                }
                : session,
            ),
          }
        }
        return prev
      })
      closeDeleteModal()
    }, 700)
  }, [deleteModal, closeDeleteModal])

  const addToRegeneration = useCallback((type, item) => {
    const regenerationItem = {
      id: `${type}_${item.id}`,
      type: type,
      label: item.title,
      fullLabel: `${type}: ${item.title}`,
      value: item,
      path: `${type}[${item.id}]`,
      level: type === "course" ? 0 : type === "session" ? 1 : type === "module" ? 2 : 3,
      icon: type === "course" ? "🎓" : type === "session" ? "🎯" : type === "module" ? "📘" : "📄",
    }

    setSelectedForRegeneration((prev) => {
      const exists = prev.some((selected) => selected.id === regenerationItem.id)
      if (exists) {
        return prev.filter((selected) => selected.id !== regenerationItem.id)
      } else {
        return [...prev, regenerationItem]
      }
    })
  }, [])

  const isSelectedForRegeneration = useCallback(
    (type, id) => {
      return selectedForRegeneration.some((item) => item.id === `${type}_${id}`)
    },
    [selectedForRegeneration],
  )

  const isRegenerating = useCallback(
    (type, id) => {
      return regeneratingItems.has(`${type}_${id}`)
    },
    [regeneratingItems],
  )

  const regenerateContent = useCallback(
    (type, id) => {
      let item
      if (type === "course") {
        item = courseData
      } else if (type === "session") {
        item = courseData.sessions?.find((s) => s.id === id)
      } else if (type === "module") {
        item = courseData.sessions?.flatMap((s) => s.modules || []).find((m) => m.id === id)
      } else if (type === "topic") {
        item = courseData.sessions
          ?.flatMap((s) => s.modules || [])
          .flatMap((m) => m.topics || [])
          .find((t) => t.id === id)
      }

      if (item) {
        addToRegeneration(type, item)
      }
    },
    [courseData, addToRegeneration],
  )

  const addNewItem = useCallback(
    (formData) => {
      const { type, parentId } = addItemModal
      const newId = Date.now()

      if (type === "session") {
        const newSession = {
          id: newId,
          course_id: courseData.id,
          title: formData.title,
          status: "active",
          sequence_no: (courseData.sessions?.length || 0) + 1,
          created_by: 1,
          created_by_type: "admin",
          updated_by: 1,
          updated_by_type: "admin",
          min_time_in_minute: Number.parseInt(formData.min_time_in_minute) || 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          modules: [],
        }

        setCourseData((prev) => ({
          ...prev,
          sessions: [...(prev.sessions || []), newSession],
        }))
      } else if (type === "module" && parentId) {
        setCourseData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) =>
            session.id === parentId
              ? {
                ...session,
                modules: [
                  ...(session.modules || []),
                  {
                    id: newId,
                    course_id: courseData.id,
                    session_id: parentId,
                    title: formData.title,
                    sequence_no: (session.modules?.length || 0) + 1,
                    duration_minutes: Number.parseFloat(formData.duration_minutes) || 1,
                    status: "active",
                    created_by: 1,
                    created_by_type: "admin",
                    updated_by: 1,
                    updated_by_type: "admin",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    topics: [],
                  },
                ],
              }
              : session,
          ),
        }))
      } else if (type === "topic" && parentId) {
        setCourseData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => ({
            ...session,
            modules: session.modules.map((module) =>
              module.id === parentId
                ? {
                  ...module,
                  topics: [
                    ...(module.topics || []),
                    {
                      id: newId,
                      module_id: parentId,
                      title: formData.title,
                      description: formData.description || "",
                      content_type: formData.content_type,
                      sequence_no: (module.topics?.length || 0) + 1,
                      status: "active",
                      created_by: 1,
                      created_by_type: "admin",
                      updated_by: 1,
                      updated_by_type: "admin",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                  ],
                }
                : module,
            ),
          })),
        }))
      } else if (type === "quiz" && parentId) {
        setCourseData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => ({
            ...session,
            modules: session.modules.map((module) =>
              module.id === parentId
                ? {
                  ...module,
                  quizzes: [
                    ...(module.quizzes || []),
                    {
                      id: newId,
                      quiz_number: newId,
                      module_id: parentId,
                      title: formData.title,
                      description: formData.description || "",
                      type: "quiz",
                      status: "active",
                      created_by: 1,
                      created_by_type: "admin",
                      updated_by: 1,
                      updated_by_type: "admin",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                  ],
                }
                : module,
            ),
          })),
        }))
      } else if (type === "assignment" && parentId) {
        setCourseData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => ({
            ...session,
            modules: session.modules.map((module) =>
              module.id === parentId
                ? {
                  ...module,
                  assignments: [
                    ...(module.assignments || []),
                    {
                      id: newId,
                      assignment_number: newId,
                      module_id: parentId,
                      title: formData.title,
                      description: formData.description || "",
                      type: formData.type || "paragraph_writing",
                      status: "active",
                      created_by: 1,
                      created_by_type: "admin",
                      updated_by: 1,
                      updated_by_type: "admin",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    },
                  ],
                }
                : module,
            ),
          })),
        }))
      }
    },
    [addItemModal, courseData],
  )

  const handleGenerateFromEmpty = useCallback(() => {
    const promptElement = document.querySelector('textarea[placeholder*="Describe the course"]')
    if (promptElement) {
      promptElement.focus()
    }
    setGenerationMode("quick")
    setEstimatedHours(4)
  }, [])

  const handleUploadFromEmpty = useCallback(() => {
    const fileInput = document.getElementById("file-upload")
    if (fileInput) {
      fileInput.click()
    }
  }, [])

  // Enhanced CourseStructure component that handles skeleton loading
  const EnhancedCourseStructure = useCallback(
    ({ sessions, ...props }) => {
      if (!sessions || sessions.length === 0) {
        return (
          <div className="space-y-4 lg:space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Course Structure</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">No sessions created yet              </p>
              </div>
              <button
                onClick={() => openAddItemModal("session", null, "")}
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Add Session</span>
                <span className="xs:hidden">Add</span>
              </button>
            </div>
            <EmptyState onGenerateClick={handleGenerateFromEmpty} className="min-h-[400px]" />
          </div>
        )
      }

      return (
        <div className="space-y-4 lg:space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Course Structure</h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {stats.sessions} Sessions • {stats.modules} Modules • {stats.topics} Topics
              </p>
            </div>
            <button
              onClick={() => openAddItemModal("session", null, "")}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Add Session</span>
              <span className="xs:hidden">Add</span>
            </button>
          </div>
          <div className="space-y-4 md:space-y-6">
            {sessions.map((session) => {
              const sessionId = session.session_number || session.id
              return (
                <div key={`session_${sessionId}`} className="space-y-4">
                  <SessionItem
                    session={session}
                    expandedItems={expandedItems}
                    editingItems={editingItems}
                    toggleExpanded={toggleExpanded}
                    toggleEditing={toggleEditing}
                    regenerateContent={regenerateContent}
                    isSelectedForRegeneration={isSelectedForRegeneration}
                    openAddItemModal={openAddItemModal}
                    updateSessionField={updateSessionField}
                    updateModuleField={updateModuleField}
                    updateTopicField={updateTopicField}
                    updateQuizField={updateQuizField}
                    updateAssignmentField={updateAssignmentField}
                    accordionState={accordionState}
                    toggleAccordion={toggleAccordion}
                    openDeleteModal={openDeleteModal}
                    isRegenerating={isRegenerating}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )
    },
    [
      stats,
      openAddItemModal,
      handleGenerateFromEmpty,
      expandedItems,
      editingItems,
      toggleExpanded,
      toggleEditing,
      regenerateContent,
      isSelectedForRegeneration,
      updateSessionField,
      updateModuleField,
      updateTopicField,
      updateQuizField,
      updateAssignmentField,
      accordionState,
      toggleAccordion,
      openDeleteModal,
      isRegenerating,
    ],
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 1000px;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      {/* Enhanced Header with Back Button */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              {/* Back Button */}
              <button
                onClick={handleBackToDashboard}
                className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-white/50 border border-gray-300/60 rounded-xl shadow-sm hover:bg-white hover:text-gray-900 hover:border-gray-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 transition-all duration-300 group backdrop-blur-sm"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
                <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 transition-transform duration-300 group-hover:scale-110" />
                <span className="hidden xs:inline">Dashboard</span>
              </button>

              {/* Page Title Section */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="relative">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">AI Course Generator</h1>
                  <p className="text-xs text-gray-500 font-medium hidden sm:block">Create comprehensive courses with AI assistance</p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4 sm:space-x-4">
              {/* Save Button */}
              {hasCourse && (
                <button
                  onClick={openSaveModal}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 sm:px-6 py-2 rounded-xl font-medium flex items-center space-x-1 sm:space-x-2 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:ring-offset-2"
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:rotate-12" />
                  <span className="hidden xs:inline text-xs sm:text-sm">Save</span>
                  <span className="hidden sm:inline">Course</span>
                </button>
              )}

              {/* Auto-save Status */}
              {/* <div className="flex items-center space-x-1 sm:space-x-3 bg-green-50/80 backdrop-blur-sm px-2 sm:px-3 py-2 rounded-xl border border-green-200/60">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  <span className="text-xs sm:text-sm font-medium text-green-700 hidden sm:inline">Auto-save</span>
                </div>
                <div className="relative">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-ping"></div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
        {/* Subtle gradient line at bottom */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-0 lg:h-[calc(100vh-66px)] overflow-visible lg:overflow-hidden">
        {/* Left Panel */}
        <div className="w-full lg:w-96 bg-white border-r border-gray-200 flex flex-col lg:h-full overflow-visible lg:overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* AI Generation Section */}
            <div className="m-3 sm:m-4">
              <div className="pb-2 sm:pb-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-purple-600" />
                  AI Content Generation
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Enter a prompt and upload files to generate course content
                </p>
              </div>

              {/* Mode Selection Toggle */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">Generation Mode</label>
                <div className="flex items-center bg-gray-100 rounded-lg p-1 max-w-[250px]">
                  <button
                    type="button"
                    onClick={() => setGenerationMode("quick")}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${generationMode === "quick"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Quick
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationMode("detailed")}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${generationMode === "detailed"
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    Detailed
                  </button>
                </div>
              </div>

              {/* Time Input for Quick Mode */}
              {generationMode === "detailed" && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-xs font-medium text-blue-700 mb-2">
                    Estimated Duration (hours)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="3"
                      max="20"
                      value={estimatedHours}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 2

                        if (val < 2) val = 2
                        if (val > 20) val = 20

                        setEstimatedHours(val)
                      }}
                      className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Content Style Selector */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Content Style
                </label>

                <select
                  value={contentStyle}
                  onChange={(e) => setContentStyle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                >
                  {contentStyles.map((style) => (
                    <option key={style} value={style}>
                      {style
                        .replace("_", " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>

                <p className="text-xs text-gray-500 mt-1">
                  Controls tone and structure of generated content
                </p>
              </div>

              {hasCourse && (
                <div className="pb-3">
                  <RegenerationSelector
                    courseData={courseData}
                    selectedItems={selectedForRegeneration}
                    onSelectionChange={setSelectedForRegeneration}
                    onOpenRegenerationModal={openRegenerationModal}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Prompt Input</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the course content you want to generate..."
                    rows={4}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Reference Files</label>
                    {uploadedFiles.length > 0 && (
                      <button onClick={removeAllFiles} className="text-xs text-red-600 hover:text-red-800 underline">
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 transition-colors hover:border-blue-400 hover:bg-blue-50">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-1 sm:mb-2" />
                      <span className="text-xs sm:text-sm text-gray-600 text-center">Click to upload files or drag and drop</span>
                      <span className="text-xs text-gray-500 text-center mt-1">PDF, DOC, TXT, CSV, XLS, Images</span>
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-600">
                          {uploadedFiles.length} file
                          {uploadedFiles.length !== 1 ? "s" : ""} selected
                        </span>
                        <span className="text-xs text-gray-500">
                          Total: {formatFileSize(uploadedFiles.reduce((total, file) => total + file.size, 0))}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded border group hover:bg-gray-100 transition-colors relative"
                          >
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => openFilePreview(file)}
                              title={file.name}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700 truncate block">{file.name}</span>
                                <Eye className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                              title="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Statistics Section */}
            {hasCourse && (
              <div className="m-4">
                <div className="pb-2">
                  <h3 className="text-lg font-semibold flex items-center">
                    <BarChart className="w-5 h-5 mr-2 text-blue-600" />
                    Course Statistics
                  </h3>
                </div>
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <Target className="w-8 h-8 text-green-600 mr-3" />
                          <div>
                            <p className="text-xs text-green-700">Sessions</p>
                            <p className="text-2xl font-bold text-green-900">{stats.sessions}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                          <div>
                            <p className="text-xs text-blue-700">Modules</p>
                            <p className="text-2xl font-bold text-blue-900">{stats.modules}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="w-8 h-8 text-purple-600 mr-3" />
                          <div>
                            <p className="text-xs text-purple-700">Topics</p>
                            <p className="text-2xl font-bold text-purple-900">{stats.topics}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <Clock className="w-8 h-8 text-orange-600 mr-3" />
                          <div>
                            <p className="text-xs text-orange-700">Duration</p>
                            <p className="text-2xl font-bold text-orange-900">{stats.duration}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Content Breakdown</h4>
                    <div className="space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Play className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-gray-600">Videos:</span>
                        </div>
                        <span className="font-medium text-gray-900">{stats.totalVideos}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Volume2 className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">Audio:</span>
                        </div>
                        <span className="font-medium text-gray-900">{stats.totalAudio}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <HelpCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">Accordians:</span>
                        </div>
                        <span className="font-medium text-gray-900">{stats.totalAccordian}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Presentation className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-600">Slides:</span>
                        </div>
                        <span className="font-medium text-gray-900">{stats.totalSlides}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">General Materials:</span>
                        </div>
                        <span className="font-medium text-gray-900">{stats.totalGeneralMaterial}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 lg:overflow-y-auto lg:h-full">
          <div className="p-4 lg:p-6">
            <div className="bg-white rounded-lg shadow border border-gray-200">
              {isGenerating ? (
                <CourseSkeleton />
              ) : !hasCourse ? (
                <EmptyState onGenerateClick={handleGenerateFromEmpty} onUploadClick={handleUploadFromEmpty} />
              ) : (
                <>
                  <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-gray-900">Course Overview & Structure</h2>
                      <div className="flex items-center space-x-2">
                        {courseData?.status && <StatusBadge status={courseData.status} />}
                        <button
                          onClick={() => toggleEditing("course", courseData.id)}
                          className={`transition-colors ${editingItems[`course_${courseData.id}`]
                            ? "text-green-700 bg-green-100 border border-green-300 rounded p-1"
                            : "text-blue-500 hover:text-blue-700"
                            }`}
                          title={editingItems[`course_${courseData.id}`] ? "Save changes" : "Edit course"}
                        >
                          {editingItems[`course_${courseData.id}`] ? (
                            <Save className="w-4 h-4" />
                          ) : (
                            <Edit3 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => regenerateContent("course", courseData.id)}
                          className={`transition-colors ${isSelectedForRegeneration("course", courseData.id)
                            ? "text-purple-700 bg-purple-100 border border-purple-300 rounded p-1"
                            : "text-purple-500 hover:text-purple-700"
                            }`}
                          title={
                            isSelectedForRegeneration("course", courseData.id)
                              ? "Remove from regeneration"
                              : "Add to regeneration"
                          }
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Manage and edit all aspects of your course content</p>
                  </div>
                  <div className="p-2 sm:p-4 md:p-6 space-y-6">
                    <div className="space-y-4">
                      <FieldDisplay
                        label="Course Title"
                        value={courseData.title}
                        isEditing={editingItems[`course_${courseData.id}`]}
                        onChange={(value) => updateCourseField("title", value)}
                      />
                      <FieldDisplay
                        label="Description"
                        value={courseData.description}
                        isEditing={editingItems[`course_${courseData.id}`]}
                        onChange={(value) => updateCourseField("description", value)}
                        multiline={true}
                      />
                    </div>
                    <hr className="border-t border-gray-200" />
                    <div className="space-y-4 lg:space-y-6">
                      <EnhancedCourseStructure
                        sessions={courseData.sessions}
                        stats={stats}
                        expandedItems={expandedItems}
                        editingItems={editingItems}
                        toggleExpanded={toggleExpanded}
                        toggleEditing={toggleEditing}
                        regenerateContent={regenerateContent}
                        isSelectedForRegeneration={isSelectedForRegeneration}
                        openAddItemModal={openAddItemModal}
                        updateSessionField={updateSessionField}
                        updateModuleField={updateModuleField}
                        updateTopicField={updateTopicField}
                        updateQuizField={updateQuizField}
                        updateAssignmentField={updateAssignmentField}
                        accordionState={accordionState}
                        toggleAccordion={toggleAccordion}
                        openDeleteModal={openDeleteModal}
                        onGenerateClick={handleGenerateFromEmpty}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreview file={filePreview.file} isOpen={filePreview.isOpen} onClose={closeFilePreview} />

      {/* Regeneration Modal */}
      <RegenerationModal
        isOpen={regenerationState.isModalOpen}
        onClose={closeRegenerationModal}
        selectedItems={regenerationState.selectedItems}
        onUpdateItem={updateRegenerationItem}
        onRemoveItem={removeRegenerationItem}
        onRegenerate={startRegeneration}
        isRegenerating={regenerationState.isRegenerating}
      />

      {/* Regeneration Confirmation Modal */}
      <RegenerationConfirmationModal
        isOpen={regenerationState.isConfirmationOpen}
        onClose={closeConfirmationModal}
        onConfirm={confirmChanges}
        onDiscard={discardChanges}
        regeneratedItems={regenerationState.regeneratedItems}
        isProcessing={regenerationState.isProcessingConfirmation}
      />

      <AddItemModal
        isOpen={addItemModal.isOpen}
        onClose={closeAddItemModal}
        onAdd={addNewItem}
        type={addItemModal.type}
        parentTitle={addItemModal.parentTitle}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        itemType={deleteModal.type}
        itemTitle={deleteModal.title}
        isDeleting={deleteModal.isDeleting}
      />

      <SaveCourseModal
        isOpen={saveModal.isOpen}
        onClose={closeSaveModal}
        onConfirm={handleSaveConfirm}
        courseData={courseData}
        stats={stats}
        isSaving={saveModal.isSaving}
      />
    </div >
  )
}

export default CourseGeneratorAdmin
