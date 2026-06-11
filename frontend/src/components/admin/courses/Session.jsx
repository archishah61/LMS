"use client"

/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import toast from "react-hot-toast"
import {
  Search,
  Plus,
  X,
  Eye,
  Loader2,
  GripVertical,
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Menu,
} from "lucide-react"
import {
  useCreateSessionMutation,
  useGetSessionsByCourseIdQuery,
  useUpdateSessionStatusMutation,
  useUpdateSessionMutation,
} from "../../../services/Course_Management/sessionApi"
import { setSessionInfo } from "../../../features/Course_Management/sessionSlice"
import { getAdminToken } from "../../../services/CookieService"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useUpdateSessionSequenceMutation } from "../../../services/Course_Management/sessionApi"
import PermissionWrapper from "../../../context/PermissionWrapper"
import AIContentGenerator from "../../Home/courses/AIContentGenrator"
import { slugify } from "../../../utils/slugify"
import ImportContentPopup from "../importContent/importContentPopUp"
import AdminLoader from "../AdminLoader"

// Sortable Session Row Component
const SortableSessionRow = ({
  session,
  index,
  handleStatusToggle,
  navigate,
  courseId,
  courseIdSlug,
  handleEditSession,
  handleSessionClick,
  handleViewSession,
  isMobile = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: session.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? "white" : "inherit",
    boxShadow: isDragging ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none",
    border: isDragging ? "2px solid rgba(22, 101, 52, 0.5)" : "none",
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  const handleCardClick = () => {
    handleSessionClick(session)
  }

  // Enhanced touch handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    listeners.onTouchStart(e);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    // Let dnd-kit handle the movement
  };

  const handleDragHandleClick = (e) => {
    e.stopPropagation()
  }

  const handleActionClick = (e, action) => {
    e.stopPropagation()
    if (action === 'edit') {
      handleEditSession(session)
    } else if (action === 'view') {
      handleViewSession(session)
    }
  }

  const handleStatusChange = (e) => {
    e.stopPropagation()
    handleStatusToggle(session.id, session.status || "active")
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-300 cursor-pointer hover:bg-lightGreen/20 ${isDragging ? "bg-white shadow-lg border-2 border-forestGreen/50 hover:bg-lightGreen/20" : "hover:shadow-md hover:bg-lightGreen/20"
          }`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-base font-semibold text-forestGreen">
              {session.title.charAt(0).toUpperCase() + session.title.slice(1)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Duration: {Math.floor(session.min_time_in_minute / 60)}h {session.min_time_in_minute % 60}m
            </p>
          </div>
          <div
            {...attributes}
            {...listeners}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={listeners.onTouchEnd}
            onClick={handleDragHandleClick}
            style={{ touchAction: 'none' }}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-grab flex-shrink-0 ${isDragging ? "bg-lightGreen/30 ring-2 ring-forestGreen/50 cursor-grabbing" : "hover:bg-lightGreen/20"
              }`}
          >
            <GripVertical
              className={`w-4 h-4 transition-colors duration-200 ${isDragging ? "text-forestGreen" : "text-gray-400 hover:text-forestGreen"
                }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4" onClick={(e) => e.stopPropagation()}>
          <PermissionWrapper section="Session" action="toggle">
            <div className="relative flex-1 mr-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${session.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                  {session.status === "active" ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={handleStatusChange}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${session.status !== "inactive" ? 'bg-green-500' : 'bg-gray-300'
                    } disabled:opacity-50`}
                >
                  <span
                    className={`absolute top-1/2 left-1 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${session.status !== "inactive" ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </div>
          </PermissionWrapper>

          <div className="flex items-center gap-2 flex-shrink-0">
            <PermissionWrapper section="Session" action="edit">
              <button
                onClick={(e) => handleActionClick(e, 'edit')}
                className="text-orange-600 hover:text-orange-700 transition-colors duration-300 p-1.5"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </PermissionWrapper>

            <PermissionWrapper section="Session" action="view">
              <button
                onClick={(e) => handleActionClick(e, 'view')}
                className="text-leafGreen hover:text-forestGreen transition-colors duration-300 p-1.5"
              >
                <Eye className="w-4 h-4" />
              </button>
            </PermissionWrapper>
          </div>
        </div>
      </div>
    )
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
      onClick={handleCardClick}
    >
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
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-forestGreen block truncate">
          {session.title.charAt(0).toUpperCase() + session.title.slice(1)}
        </span>
      </td>
      <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock size={16} className="text-gray-400" />
          <span>
            {Math.floor(session.min_time_in_minute / 60)} hr {session.min_time_in_minute % 60} mins
          </span>
        </div>
      </td>
      <PermissionWrapper section="Session" action="edit|toggle|view">
        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-3">
            <PermissionWrapper section="Session" action="edit">
              <button
                onClick={(e) => handleActionClick(e, 'edit')}
                className="text-orange-600 hover:text-orange-700 transition-colors duration-300"
                title="Edit Session"
              >
                <Edit2 size={18} />
              </button>
            </PermissionWrapper>
            <PermissionWrapper section="Session" action="toggle">
              <button
                onClick={handleStatusChange}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${session.status !== "inactive" ? 'bg-green-500' : 'bg-gray-300'
                  } disabled:opacity-50`}
                title={session.status === "inactive" ? "Activate" : "Deactivate"}
              >
                <span
                  className={`absolute top-1/2 left-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${session.status !== "inactive" ? 'translate-x-[20px]' : 'translate-x-0'
                    }`}
                />
              </button>
            </PermissionWrapper>
            <PermissionWrapper section="Session" action="view">
              <button
                onClick={(e) => handleActionClick(e, 'view')}
                className="text-forestGreen hover:text-leafGreen transition-colors duration-300"
                title="View Session"
              >
                <Eye size={18} />
              </button>
            </PermissionWrapper>
          </div>
        </td>
      </PermissionWrapper>
    </tr>
  )
}

export default function Session() {
  const { cid, courseId, courseDuration } = useLocation().state
  const { courseIdSlug } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { access_token } = getAdminToken()
  const { id } = useSelector((state) => state.user)
  const { courses } = useSelector((state) => state.course)
  const [courseTitle, setCourseTitle] = useState("")
  const [sessions, setSessions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeId, setActiveId] = useState(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [viewSession, setViewSession] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    min_time_in_minute: "",
    is_points_rewarded_on_completion: false,
    points_rewarded_on_completion: 0,
    course_id: courseId,
  })
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const { data: sessionData, isSuccess: isSuccessGetSessions, isLoading, refetch: refetchSessions } = useGetSessionsByCourseIdQuery({
    courseId,
    searchTerm,
    dateFrom,
    dateTo,
    statusFilter,
    access_token,
  })
  const [createSession, { isLoading: isLoadingCreateSession }] = useCreateSessionMutation()
  const [updateSession, { isLoading: isLoadingUpdateSession }] = useUpdateSessionMutation()
  const [updateSessionSequence] = useUpdateSessionSequenceMutation()
  const [updateSessionStatus] = useUpdateSessionStatusMutation()
  const [showImportPopup, setShowImportPopup] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (sessionData && isSuccessGetSessions) {
      const sortedSessions = [...sessionData.sessions].sort((a, b) => a.sequence_no - b.sequence_no)
      setSessions(sortedSessions)
      dispatch(setSessionInfo({ sessions: sortedSessions }))
    }
  }, [sessionData, isSuccessGetSessions, dispatch])

  useEffect(() => {
    fetchCourseTitle()
  }, [])

  const fetchCourseTitle = async () => {
    const foundCourse = courses?.find((course) => course.public_hash === courseId);
    const title = foundCourse?.title;
    setCourseTitle(title);
  };

  const handleViewSession = (session) => {
    setViewSession(session)
    setShowViewModal(true)
  }

  const handleAddSession = () => {
    setEditingSession(null)
    setFormData({
      title: "",
      min_time_in_minute: "",
      is_points_rewarded_on_completion: false,
      points_rewarded_on_completion: 0,
      course_id: courseId,
    })
    setShowForm(true)
    setShowMobileMenu(false);
  }

  const handleEditSession = (session) => {
    setEditingSession(session)
    setFormData({
      title: session.title,
      min_time_in_minute: session.min_time_in_minute.toString(),
      is_points_rewarded_on_completion: session.is_points_rewarded_on_completion || false,
      points_rewarded_on_completion: session.points_rewarded_on_completion || 0,
      course_id: courseId,
    })
    setShowForm(true)
  }

  const handleEditFromView = () => {
    setShowViewModal(false)
    handleEditSession(viewSession)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSession) {
        await updateSession({
          id: editingSession.public_hash,
          formData: formData,
          access_token,
        }).unwrap()
        toast.success("Session updated successfully!")
      } else {
        await createSession({
          session: formData,
          access_token,
        }).unwrap()
        toast.success("Session added successfully")
      }
      resetForm()
      setEditingSession(null)
      setShowForm(false)
    } catch (error) {
      if (Array.isArray(error?.data?.error)) {
        error.data.error.forEach((errMsg) => {
          toast.error(errMsg)
        })
      } else {
        const errorMessage =
          error?.data?.error ||
          error?.data?.message ||
          error?.error ||
          error?.message ||
          `Failed to ${editingSession ? "update" : "create"} session. Please try again.`
        toast.error(errorMessage)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      min_time_in_minute: "",
      is_points_rewarded_on_completion: false,
      points_rewarded_on_completion: 0,
      course_id: courseId,
    })
  }

  const isAnyFilterApplied = () => {
    return dateFrom !== "" || dateTo !== "" || statusFilter !== "all" || searchTerm !== "";
  }

  const filteredSessions = sessions
  // .filter((session) => {
  //   const sessionDate = new Date(session.created_at)
  //   const fromDate = dateFrom ? new Date(dateFrom) : null
  //   const toDate = dateTo ? new Date(dateTo) : null
  //   const isWithinDateRange =
  //     (!fromDate || sessionDate >= fromDate) && (!toDate || sessionDate <= new Date(toDate.setHours(23, 59, 59, 999)))
  //   const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase())
  //   const matchesStatus = statusFilter === "all" || session.status === statusFilter
  //   return isWithinDateRange && matchesSearch && matchesStatus
  // })

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over) return
    if (active.id !== over.id) {
      setSessions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        updateSequenceOnServer(newItems)
        return newItems
      })
    }
    setActiveId(null)
  }

  const updateSequenceOnServer = async (reorderedSessions) => {
    try {
      const updatedSequence = reorderedSessions.map((session) => session.id)
      await updateSessionSequence({
        sequence: updatedSequence,
        access_token,
      }).unwrap()
    } catch (error) {
      toast.error(error.data?.error || "Failed to update session sequence")
    }
  }

  const handleStatusToggle = async (sessionId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      await updateSessionStatus({
        sessionId,
        status: newStatus,
        access_token,
      }).unwrap()
      setSessions(sessions.map((session) => (session.id === sessionId ? { ...session, status: newStatus } : session)))
      toast.success(`Session ${newStatus === "active" ? "activated" : "deactivated"} successfully`)
    } catch (error) {
      toast.error(error?.data?.error || "Failed to update session status")
    }
  }

  const handleUseGeneratedSession = (session) => {
    setEditingSession(null)
    setFormData({
      title: session.title,
      min_time_in_minute: session.min_time_in_minute.toString(),
      is_points_rewarded_on_completion: session.is_points_rewarded_on_completion || false,
      points_rewarded_on_completion: session.points_rewarded_on_completion || 0,
      course_id: courseId,
    })
    setShowForm(true)
    toast.success("Session data populated!")
  }

  const handleSessionClick = (session) => {
    navigate(`/admin/dashboard/course/${courseIdSlug}/session/${slugify(session.title)}/modules`, {
      state: {
        cid: cid, courseId: courseId, sid: session.id, sessionId: session.public_hash, sessionDuration: session.min_time_in_minute
      },
    })
  }

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forestGreen mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading sessions...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full max-w-full px-4 py-4 sm:px-6">
          {/* ──────────────────────────────
              MOBILE LAYOUT (< lg)
              ────────────────────────────── */}
          <div className="lg:hidden space-y-4">
            <div className="relative flex items-center justify-between">
              <div></div>

              {/* Center: Title + Subtitle */}
              <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none max-w-[60%] sm:max-w-[70%]">
                <h1 className="text-xl font-bold text-forestGreen">
                  Sessions
                </h1>
                <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">
                  {courseTitle}
                </p>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                <PermissionWrapper section="Session" action="create">
                  <AIContentGenerator
                    contentType="session"
                    onUseGenerated={handleUseGeneratedSession}
                    details={{ courseDuration }}
                    mobile
                  />
                </PermissionWrapper>

                <div className="relative">
                  <PermissionWrapper section="Session" action="create">
                    <button
                      onClick={() => setShowMobileMenu((prev) => !prev)}
                      className="bg-leafGreen   text-white p-2.5 rounded-lg transition-colors shadow-sm"
                      aria-label={showMobileMenu ? "Close menu" : "Open menu"}
                    >
                      <Plus size={18} />
                    </button>
                  </PermissionWrapper>

                  {showMobileMenu && (
                    <div className="absolute right-0 top-full mt-1 translate-y-1 z-10 w-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                      <PermissionWrapper section="Session" action="create">
                        <button
                          onClick={() => {
                            handleAddSession();
                            setShowMobileMenu(false);
                          }}
                          className="flex items-center gap-3 w-full text-left px-5 py-3.5 text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        >
                          <Plus size={18} />
                          Add Session
                        </button>
                      </PermissionWrapper>

                      <PermissionWrapper section="Import Content" action="create">
                        <button
                          onClick={() => {
                            setShowImportPopup(true);
                            setShowMobileMenu(false);
                          }}
                          className="flex items-center gap-3 w-full text-left px-5 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={18} />
                          Import Session
                        </button>
                      </PermissionWrapper>
                    </div>
                  )}
                </div>

                {/* Back button */}
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft size={22} />
                </button>
              </div>
            </div>

            {/* Filter toggle – centered, full-width capped */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors w-full max-w-md shadow-sm"
              >
                <Filter size={17} />
                <span className="font-medium text-sm">Filters</span>
                {showFilters ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex md:items-center md:justify-between">
            <div className="grid">
              <h1 className="text-2xl font-bold text-forestGreen">Sessions</h1>
              <p className="text-gray-600 mt-1 truncate">
                {courseTitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <PermissionWrapper section="Session" action="create">
                <AIContentGenerator
                  contentType="session"
                  onUseGenerated={handleUseGeneratedSession}
                  details={{ courseDuration }}
                />
              </PermissionWrapper>

              <PermissionWrapper section="Session" action="create">
                <button
                  onClick={handleAddSession}
                  className="bg-leafGreen text-white px-4 xl:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm whitespace-nowrap"
                >
                  <Plus size={18} />
                  Add Session
                </button>
              </PermissionWrapper>

              <PermissionWrapper section="Import Content" action="create">
                <button
                  onClick={() => setShowImportPopup(true)}
                  className="bg-leafGreen text-white px-4 xl:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm whitespace-nowrap"
                >
                  <Plus size={18} />
                  Import Session
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors shadow-sm"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* ──────────────────────────────
        FILTERS PANEL (shared)
    ────────────────────────────── */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters
              ? "max-h-[500px] opacity-100 mt-5"
              : "max-h-0 opacity-0 mt-0"
              }`}
          >
            <div className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Sessions</label>
                  <div className="relative">
                    <Search className="absolute top-3 left-3 text-gray-400" size={16} />
                    <input
                      type="search"
                      placeholder="Search sessions..."
                      className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      value={searchTerm}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      setStatusFilter("all");
                      setSearchTerm("");
                    }}
                    className="text-sm text-leafGreen hover:text-forestGreen font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Form Section */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingSession ? "Edit Session" : "New Session"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingSession(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                <form onSubmit={handleSubmit} id="sessionForm" className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Session Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter session title"
                    />
                  </div>

                  <div>
                    <label htmlFor="min_time_in_minute" className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Time (minutes)
                    </label>
                    <input
                      id="min_time_in_minute"
                      name="min_time_in_minute"
                      type="number"
                      value={formData.min_time_in_minute}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter minimum time in minutes"
                    />
                  </div>

                  <div className="group flex items-center space-x-2">
                    <input
                      id="is_points_rewarded_on_completion"
                      name="is_points_rewarded_on_completion"
                      type="checkbox"
                      checked={formData.is_points_rewarded_on_completion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_points_rewarded_on_completion: e.target.checked,
                          points_rewarded_on_completion: e.target.checked ? formData.points_rewarded_on_completion : 0,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_points_rewarded_on_completion" className="text-sm font-medium text-gray-700">
                      Reward Points on Session Completion
                    </label>
                  </div>

                  {formData.is_points_rewarded_on_completion && (
                    <div>
                      <label htmlFor="points_rewarded_on_completion" className="block text-sm font-medium text-gray-700 mb-2">
                        Points Rewarded On Session Completion :
                      </label>
                      <input
                        id="points_rewarded_on_completion"
                        name="points_rewarded_on_completion"
                        type="number"
                        value={formData.points_rewarded_on_completion || null}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            points_rewarded_on_completion: Number.parseInt(e.target.value || 0),
                          })
                        }
                        min={1}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                        placeholder="Enter Reward Points"
                      />
                    </div>
                  )}
                </form>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSession(null);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingCreateSession || isLoadingUpdateSession}
                  form="sessionForm"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingCreateSession || isLoadingUpdateSession ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    `${editingSession ? "Update" : "Create"} Session`
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Sessions List */}
        {isLoading ?
          <AdminLoader message="Loading sessions..." />
          : <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
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
                      Duration
                    </th>
                    <PermissionWrapper section="Session" action="edit|toggle|view">
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
                      items={paginatedSessions.map((session) => session.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {paginatedSessions.map((session, index) => (
                        <SortableSessionRow
                          key={session.id}
                          session={session}
                          index={index}
                          handleStatusToggle={handleStatusToggle}
                          navigate={navigate}
                          courseId={courseId}
                          courseIdSlug={courseIdSlug}
                          handleEditSession={handleEditSession}
                          handleSessionClick={handleSessionClick}
                          handleViewSession={handleViewSession}
                          isMobile={false}
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
                    items={paginatedSessions.map((session) => session.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedSessions.map((session, index) => (
                      <SortableSessionRow
                        key={session.id}
                        session={session}
                        index={index}
                        handleStatusToggle={handleStatusToggle}
                        navigate={navigate}
                        courseId={courseId}
                        courseIdSlug={courseIdSlug}
                        handleEditSession={handleEditSession}
                        handleSessionClick={handleSessionClick}
                        handleViewSession={handleViewSession}
                        isMobile={true}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Empty State */}
            {filteredSessions.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} className="text-gray-400" />
                </div>
                <div className="text-gray-500 text-lg font-medium mb-2">No sessions found</div>
                <p className="text-gray-400">Try adjusting your filters or add a new session.</p>
              </div>
            )}

            {/* Pagination */}
            {filteredSessions.length > 0 && totalPages > 1 && (
              <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="hidden md:block text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredSessions.length)} of {filteredSessions.length} results
                  </div>
                  <div className="md:hidden text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Only show first, last, and pages near current
                      if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${currentPage === page
                              ? "bg-leafGreen text-white"
                              : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === 2 || page === totalPages - 1) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      </div>

      {/* Mobile Floating Action Button */}
      {/* {isMobile && !showForm && (
        <div className="fixed bottom-6 right-6 z-40">
          <PermissionWrapper section="Session" action="create">
            <button
              onClick={handleAddSession}
              className="w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95"
            >
              <Plus size={24} />
            </button>
          </PermissionWrapper>
        </div>
      )} */}

      {/* View Modal */}
      {showViewModal && viewSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                Session Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2 gap-6"}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Title</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900 font-medium">{viewSession.title}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-500" />
                      <span className="text-gray-900">
                        {Math.floor(viewSession.min_time_in_minute / 60)} hr {viewSession.min_time_in_minute % 60} mins
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewSession.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {viewSession.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sequence</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">#{viewSession.sequence_no}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900">
                      {new Date(viewSession.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {Boolean(viewSession.is_points_rewarded_on_completion) ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Completion Points</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-900">{viewSession.points_rewarded_on_completion}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Completion Points</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-gray-500 italic">No points rewarded for this session</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleEditFromView}
                className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit Session
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportContentPopup
        open={showImportPopup}
        onClose={() => setShowImportPopup(false)}
        from="session"
        Id={cid}
        refetchSessions={refetchSessions}
      />
    </div>
  )
}