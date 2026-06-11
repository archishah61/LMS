"use client"

/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  useCreateCourseMutation,
  useGetAdminCoursesQuery,
  useUpdateCourseStatusMutation,
  useUpdateCourseSequenceMutation,
} from "../../../services/Course_Management/courseApi"
import { useContentGeneratorByTypeMutation } from "../../../services/AIServices"
import { useDispatch, useSelector } from "react-redux"
import { setCourseInfo } from "../../../features/Course_Management/courseSlice"
import toast from "react-hot-toast"
import AdminLoader from "../AdminLoader";
import { Search, Plus, X, Loader2, Eye, List, GripVertical, Filter, ChevronUp, ChevronDown, ArrowLeft, Upload, ChevronLeft } from "lucide-react"
import { Editor } from "@tinymce/tinymce-react"
import { useGetActiveCourseCategoriesQuery } from "../../../services/Course_Management/courseCatagoryApi"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import CourseFAQModal from "../../modal/CourseFAQModal"
import UpdateFAQModal from "../../modal/UpdateFAQModal"
import PermissionWrapper from "../../../context/PermissionWrapper"
import { getAdminToken } from "../../../services/CookieService"
import { useGetPartnersQuery } from "../../../services/Become_partner/becomePartnerApi"
import AIContentGenerator from "../../Home/courses/AIContentGenrator"
import { slugify } from "../../../utils/slugify"
import { base64ToFile } from "../../../utils/toFileObject"

// Pagination Component
function Pagination({ pagination, currentPage, setCurrentPage, limit, setLimit }) {
  const limitOptions = [10, 20, 50, 100, 500];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
      {/* Mobile Pagination */}
      <div className="md:hidden">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 text-center">
              Page {currentPage} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Courses per page:</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when limit changes
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
              >
                {limitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="text-xs text-gray-500 text-center">
              Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, pagination.totalCount)} of {pagination.totalCount}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Next
              <ChevronUp size={16} className="rotate-90" />
            </button>
          </div>
        </div>
      </div>
      {/* Desktop Pagination */}
      <div className="hidden md:flex md:items-center md:justify-between">
        <div className="text-sm text-gray-700">
          Showing {(currentPage - 1) * limit + 1} to{" "}
          {Math.min(currentPage * limit, pagination.totalCount)} of{" "}
          {pagination.totalCount} results
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Courses per page:</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when limit changes
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Previous
          </button>
          {[...Array(pagination.totalPages)].map((_, index) => {
            const page = index + 1;
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
          })}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Sortable Course Row Component
const SortableCourseRow = ({
  course,
  index,
  handleStatusToggle,
  loadingStatus,
  navigate,
  setSelectedCourseId,
  setShowFAQUpdateModal,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: course.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? "white" : "inherit",
    boxShadow: isDragging ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none",
    border: isDragging ? "2px solid rgba(124, 58, 237, 0.5)" : "none",
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
  }

  const handleCardClick = () => {
    navigate(`/admin/dashboard/course/${slugify(course.title)}/sessions`, {
      state: { cid: course.id, courseId: course.public_hash, courseDuration: course.duration_minutes },
    })
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
    if (action === 'faq') {
      setSelectedCourseId(course.public_hash)
      setShowFAQUpdateModal(true)
    } else if (action === 'view') {
      navigate(`/admin/dashboard/course/${slugify(course.title)}`, {
        state: { public_hash: course.public_hash },
      })
    }
  }

  const handleStatusChange = (e) => {
    e.stopPropagation()
    handleStatusToggle(course.id, e.target.value)
  }

  return (
    <>
      {/* Desktop Table Row */}
      <tr
        ref={setNodeRef}
        style={style}
        onClick={handleCardClick}
        className={`cursor-pointer hidden md:table-row ${isDragging
          ? "bg-white shadow-lg border-2 border-forestGreen/50"
          : "hover:bg-lightGreen/20"
          } transition-colors duration-300`}
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
        <td className="px-3 lg:px-6 py-4 grid whitespace-nowrap">
          <span className="mt-2 text-sm font-medium text-forestGreen block truncate">
            {course.title.charAt(0).toUpperCase() + course.title.slice(1)}
          </span>
        </td>
        <PermissionWrapper section="Course FAQ" action="view">
          <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => handleActionClick(e, 'faq')}
              className="bg-leafGreen text-white px-4 py-2 rounded-lg shadow-md transition-transform duration-300"
            >
              FAQs
            </button>
          </td>
        </PermissionWrapper>
        <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {Math.floor(course.duration_minutes / 60)} hr {course.duration_minutes % 60} mins
        </td>
        <PermissionWrapper section="Course" action="toggle">
          <td className="px-3 lg:px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              {loadingStatus[course.id] ? (
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin mx-auto" />
              ) : (
                <select
                  value={course.status}
                  onChange={handleStatusChange}
                  className="block px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  {Boolean(course.generated_by) && <option value="private">Private</option>}
                </select>
              )}
            </div>
          </td>
        </PermissionWrapper>
        <PermissionWrapper section="Course" action="view">
          <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
            <PermissionWrapper section="Course" action="view">
              <button
                onClick={(e) => handleActionClick(e, 'view')}
                className="text-forestGreen hover:text-leafGreen transition-colors duration-300"
              >
                <Eye className="w-5 h-5 inline-block mr-1" />
                View
              </button>
            </PermissionWrapper>
          </td>
        </PermissionWrapper>
      </tr>

      {/* Mobile Card */}
      <div
        ref={setNodeRef}
        style={style}
        className={`md:hidden p-4 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 cursor-pointer ${isDragging ? "bg-white shadow-lg border-2 border-forestGreen/50" : "hover:shadow-md hover:bg-gray-50"
          }`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-base font-semibold text-forestGreen">
              {course.title.charAt(0).toUpperCase() + course.title.slice(1)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Duration: {Math.floor(course.duration_minutes / 60)} hr {course.duration_minutes % 60} mins
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
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-grab flex-shrink-0 ${isDragging ? "bg-lightGreen ring-2 ring-forestGreen/50 cursor-grabbing" : "hover:bg-lightGreen/50"
              }`}
          >
            <GripVertical
              className={`w-4 h-4 transition-colors duration-200 ${isDragging ? "text-forestGreen" : "text-gray-400 hover:text-forestGreen"
                }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4" onClick={(e) => e.stopPropagation()}>
          <PermissionWrapper section="Course" action="toggle">
            <div className="relative flex-1 mr-2">
              {loadingStatus[course.id] ? (
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
              ) : (
                <select
                  value={course.status}
                  onChange={handleStatusChange}
                  className="block w-full px-3 py-2 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="private">Private</option>
                </select>
              )}
            </div>
          </PermissionWrapper>

          <div className="flex items-center gap-2 flex-shrink-0">
            <PermissionWrapper section="Course FAQ" action="view">
              <button
                onClick={(e) => handleActionClick(e, 'faq')}
                className="bg-leafGreen   text-white px-3 py-1.5 rounded-lg text-xs shadow-md hover:scale-105 transition-transform duration-300"
              >
                FAQs
              </button>
            </PermissionWrapper>

            <PermissionWrapper section="Course" action="view">
              <button
                onClick={(e) => handleActionClick(e, 'view')}
                className="text-forestGreen hover:text-leafGreen transition-colors duration-300 p-1.5"
              >
                <Eye className="w-4 h-4" />
              </button>
            </PermissionWrapper>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Courses() {
  const { id } = useSelector((state) => state.user)
  const [showForm, setShowForm] = useState(false)
  const [courses, setCourses] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [thumbnailPreview, setThumbnailPreview] = useState(null)
  const [seoImagePreview, setSeoImagePreview] = useState(null);
  const [ogImagePreview, setOgImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null)
  const [detailPreviews, setDetailPreviews] = useState([])
  const [previewModal, setPreviewModal] = useState(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [updateCourseStatus] = useUpdateCourseStatusMutation({
    invalidatesTags: ["UpdateCourse"],
  })
  const { access_token } = getAdminToken();

  const { role } = useSelector((state) => state.user)
  const [activeId, setActiveId] = useState(null)
  const [creatorFilter, setCreatorFilter] = useState("all")
  const [selectedPartnerId, setSelectedPartnerId] = useState("all")
  const { data: partnersData, isLoading: isLoadingPartners } = useGetPartnersQuery({ limit: 'all', access_token })
  const [generateContent, { isLoading }] = useContentGeneratorByTypeMutation()
  const [showFilter, setShowFilter] = useState(false)
  const [errors, setErrors] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Date filter states - MOVED HERE before useEffect
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    courseThumbnail: null,
    coursePreviewVideo: null,
    price: "",
    discount: 0,
    duration_minutes: "",
    expiry_days: "",
    status: "published",
    what_you_will_learn: [""],
    prerequisites: [""],
    skill_development: [{ title: "", statements: [""] }],
    hashtags: [""],
    max_access_minutes: "",
    min_access_minutes: "",
    is_points_enrollable: false,
    points_to_enroll: 0,
    is_points_rewarded: false,
    points_rewarded: 0,
    is_points_rewarded_on_completion: false,
    points_rewarded_on_completion: 0,
    is_copy_paste_allowed: false,
    is_course_trending: false,
    meta_title: "",
    meta_keyword: "",
    meta_description: "",
    seo_image: "",
    seo_image_alt: "",
    seo_canonical: "",
    og_title: "",
    og_description: "",
    og_image: "",
    og_image_alt: "",
  })

  const handleUseGeneratedCourse = (course) => {
    let generatedThumbnail = null
    let generatedDetailImage = null
    console.log("course", course)
    // Check if course has thumbnail image data
    if (course.thumbnailImage) {
      try {
        // Make sure we have the base64ToFile function available
        if (typeof base64ToFile === "function") {
          const fileName = course.thumbnailImage.name || `course_thumbnail_${Date.now()}.png`
          const mimeType = course.thumbnailImage.type || "image/png"

          // Fix: Use correct property path - should be course.thumbnailImage.data
          generatedThumbnail = base64ToFile(course.thumbnailImage.data, fileName, mimeType)

          if (generatedThumbnail) {
            const previewUrl = URL.createObjectURL(generatedThumbnail)
            setThumbnailPreview(previewUrl)
          }
        } else {
          console.warn("base64ToFile function not available")
        }
      } catch (error) {
        toast.error("Failed to process thumbnail image")
      }
    }

    if (course.detailImage) {
      try {
        setDetailPreviews([])

        // Make sure we have the base64ToFile function available
        if (typeof base64ToFile === "function") {
          const fileName = course.detailImage.name || `course_preview_${Date.now()}.png`
          const mimeType = course.detailImage.type || "image/png"

          generatedDetailImage = base64ToFile(course.detailImage.data, fileName, mimeType)

          if (generatedDetailImage) {
            const previewUrl = URL.createObjectURL(generatedDetailImage)
            setDetailPreviews([{ url: previewUrl, isImage: true }])
          }
        } else {
          console.warn("base64ToFile function not available")
        }
      } catch (error) {
        console.log(error)
        toast.error("Failed to process preview image")
      }
    }

    // Update form data with generated course information
    setFormData({
      ...formData,
      title: course.title || "",
      description: course.description || "",
      category_id: course.category_id || formData.category_id,
      courseThumbnail: generatedThumbnail,
      coursePreviewVideo: generatedDetailImage,
      price: course.price || "",
      discount: course.discount || 0,
      duration_minutes: course.duration_minutes || "",
      expiry_days: course.expiry_days || "",
      what_you_will_learn:
        Array.isArray(course.what_you_will_learn) && course.what_you_will_learn.length > 0
          ? course.what_you_will_learn
          : [""],
      prerequisites:
        Array.isArray(course.prerequisites) && course.prerequisites.length > 0 ? course.prerequisites : [""],
      skill_development:
        Array.isArray(course.skill_development) && course.skill_development.length > 0 ? course.skill_development : [{ title: "", statements: [""] }],
      hashtags: Array.isArray(course.hashtags) && course.hashtags.length > 0 ? course.hashtags : [""],
      max_access_minutes: course.max_access_minutes || "",
      min_access_minutes: course.min_access_minutes || "",
      status: course.status || "published",
      is_points_enrollable: course.is_points_enrollable || false,
      points_to_enroll: course.points_to_enroll || 0,
      meta_title: course.meta_title || "",
      meta_keyword: course.meta_keyword || "",
      meta_description: course.meta_description || "",
      seo_image_alt: course.seo_image_alt || "",
      // seo_canonical: course.seo_canonical || "",
      og_title: course.og_title || "",
      og_description: course.og_description || "",
      og_image_alt: course.og_image_alt || "",
    })
    setShowForm(true)
    toast.success("Course data populated successfully!")
  }

  const {
    data: courseData,
    isSuccess: isSuccessGetCourses,
    isLoading: isLoadingGetCourses,
  } = useGetAdminCoursesQuery({
    creatorType: creatorFilter,
    createdById: selectedPartnerId,
    createdFrom: dateFrom,
    createdTo: dateTo,
    search_term: searchTerm,
    limit: itemsPerPage,
    offset: itemsPerPage !== "all" ? itemsPerPage * (currentPage - 1) : 0,
    access_token
  })

  const [createCourse, { isLoading: isLoadingCreateCourse, isSuccess: isSuccessCreateCourse }] =
    useCreateCourseMutation()

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
    if (courseData?.data && isSuccessGetCourses) {
      const sortedCourses = [...courseData?.data].sort((a, b) => a.sequence - b.sequence)
      setCourses(sortedCourses)
      dispatch(setCourseInfo({ courses: sortedCourses }))
    }
  }, [courseData?.data, isSuccessGetCourses, dispatch])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFrom, dateTo, creatorFilter, selectedPartnerId]);

  const isValidUrl = (value) => {
    if (!value) return true; // allow empty
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleCanonicalChange = (e) => {
    const value = e.target.value;

    const valid = isValidUrl(value);

    // optional: store error state
    setErrors(prev => ({
      ...prev,
      seo_canonical: !valid
    }));

    // always allow typing
    handleChange(e);
  };

  const handleRemovePreview = (index) => {
    setDetailPreviews(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    setFormData(prev => {
      const newFiles = Array.isArray(prev.coursePreviewVideo) ? [...prev.coursePreviewVideo] : [];
      newFiles.splice(index, 1);
      return { ...prev, coursePreviewVideo: newFiles };
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "courseThumbnail" && files && files[0]) {
      const file = files[0]
      setFormData({ ...formData, [name]: file })
      const previewUrl = URL.createObjectURL(file)
      setThumbnailPreview(previewUrl)
    } else if (name === "coursePreviewVideo" && files && files.length > 0) {
      const selectedFiles = Array.from(files)
      setFormData(prev => ({ ...prev, [name]: [...(prev[name] || []), ...selectedFiles] }))
      const previews = selectedFiles.map(file => ({
        url: URL.createObjectURL(file),
        isImage: file.type && file.type.startsWith("image/"),
        name: file.name
      }))
      setDetailPreviews(prev => [...prev, ...previews])
    } else if (name === "seo_image" && files && files[0]) {
      const file = files[0]
      setFormData({ ...formData, ["courseSEOImage"]: file })
      const previewUrl = URL.createObjectURL(file)
      setSeoImagePreview(previewUrl)
    } else if (name === "og_image" && files && files[0]) {
      const file = files[0]
      setFormData({ ...formData, ["courseOGImage"]: file })
      const previewUrl = URL.createObjectURL(file)
      setOgImagePreview(previewUrl)
    } else if (["category_id", "discount"].includes(name)) {
      setFormData({ ...formData, [name]: Number.parseInt(value, 10) || 0 })
    } else if (name === "min_access_minutes" || name === "max_access_minutes") {
      const regex = /^\d*\.?\d{0,2}$/
      if (regex.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }))
      }
      return
    } else if (name !== "description") {
      setFormData({ ...formData, [name]: files ? files[0] : value })
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    if (value === "") return
    const floatValue = Number.parseFloat(value)
    const formattedValue = floatValue.toFixed(2)
    setFormData((prev) => ({ ...prev, [name]: formattedValue }))
  }

  const formatToHoursAndMinutes = (decimalMinutes) => {
    if (!decimalMinutes) return ""
    const hours = Math.floor(decimalMinutes / 60)
    const minutes = Math.round(decimalMinutes % 60)
    return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`
  }

  const {
    data: categories,
    isLoading: isLoadingCategories,
    error,
  } = useGetActiveCourseCategoriesQuery({ access_token })

  const handleListChange = (index, name, value) => {
    const list = [...formData[name]]
    list[index] = value
    setFormData({ ...formData, [name]: list })
  }

  const addField = (name) => {
    setFormData({ ...formData, [name]: [...formData[name], ""] })
  }

  const removeField = (index, name) => {
    const list = [...formData[name]]
    if (list.length > 1) {
      list.splice(index, 1)
      setFormData({ ...formData, [name]: list })
    }
  }

  const handleAddSkill = () => {
    setFormData({ ...formData, skill_development: [...formData.skill_development, { title: "", statements: [""] }] })
  }

  const handleRemoveSkill = (index) => {
    const list = [...formData.skill_development]
    if (list.length > 1) {
      list.splice(index, 1)
      setFormData({ ...formData, skill_development: list })
    }
  }

  const handleSkillTitleChange = (index, value) => {
    const list = [...formData.skill_development]
    list[index].title = value
    setFormData({ ...formData, skill_development: list })
  }

  const handleSkillStatementChange = (skillIndex, statementIndex, value) => {
    const list = [...formData.skill_development]
    list[skillIndex].statements[statementIndex] = value
    setFormData({ ...formData, skill_development: list })
  }

  const handleAddSkillStatement = (skillIndex) => {
    const list = [...formData.skill_development]
    list[skillIndex].statements.push("")
    setFormData({ ...formData, skill_development: list })
  }

  const handleRemoveSkillStatement = (skillIndex, statementIndex) => {
    const list = [...formData.skill_development]
    if (list[skillIndex].statements.length > 1) {
      list[skillIndex].statements.splice(statementIndex, 1)
      setFormData({ ...formData, skill_development: list })
    }
  }

  const [loadingStatus, setLoadingStatus] = useState({})

  const handleStatusToggle = async (courseId, currentStatus) => {
    setLoadingStatus((prev) => ({ ...prev, [courseId]: true }))

    if (!["published", "draft", "private"].includes(currentStatus)) {
      toast.error("Invalid status selected!")
      return
    }

    try {
      await updateCourseStatus({
        id: courseId,
        status: currentStatus,
        access_token,
      }).unwrap()
      toast.success(`Course status successfully updated to ${currentStatus}!`)
    } catch (error) {
      toast.error(error.data?.error || "Failed to update course status. Please try again later.")
    } finally {
      setLoadingStatus((prev) => ({ ...prev, [courseId]: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formDataToSubmit = new FormData()
    Object.keys(formData).forEach((key) => {
      let value = formData[key]

      if (key === "coursePreviewVideo" && Array.isArray(value) && value.some(item => item instanceof File)) {
        value.forEach(file => formDataToSubmit.append("coursePreviewVideo", file));
        return;
      }
      if (Array.isArray(value)) {
        value = JSON.stringify(value)
      } else if (typeof value === "boolean") {
        value = value ? 1 : 0 // Convert boolean to integer
      } else if (value === null || value === undefined) {
        return // Skip null or undefined fields entirely
      }

      formDataToSubmit.append(key, value)
    })
    try {
      const newCourse = await createCourse({
        course: formDataToSubmit,
        access_token,
      }).unwrap()
      setCreatedCourseId(newCourse.course[0].public_hash)
      setShowFAQModal(true)
      resetForm()
      setShowForm(false)
      toast.success("Course added successfully")
    } catch (error) {
      const errorMessage =
        error?.data?.error || error?.data?.message || error?.error || error?.message || "An unexpected error occurred"

      toast.error(errorMessage)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category_id: "",
      courseThumbnail: null,
      coursePreviewVideo: null,
      price: "",
      discount: 0,
      duration_minutes: "",
      expiry_days: "",
      what_you_will_learn: [""],
      prerequisites: [""],
      skill_development: [{ title: "", statements: [""] }],
      hashtags: [""],
      status: "published",
      max_access_minutes: "",
      min_access_minutes: "",
      is_points_enrollable: false,
      points_to_enroll: 0,
      is_points_rewarded: false,
      points_rewarded: 0,
      is_points_rewarded_on_completion: false,
      points_rewarded_on_completion: 0,
      is_copy_paste_allowed: false,
      is_course_trending: false,
      meta_title: "",
      meta_keyword: "",
      meta_description: "",
      seo_image: "",
      seo_image_alt: "",
      seo_canonical: "",
      og_title: "",
      og_description: "",
      og_image: "",
      og_image_alt: "",
    })
    setThumbnailPreview(null)
    setSeoImagePreview(null)
    setOgImagePreview(null)
    setVideoPreview(null)
    setDetailPreviews([])
  }

  const filteredCourses = courses.filter((course) => {
    const courseDate = new Date(course.created_at)
    const fromDate = dateFrom ? new Date(dateFrom) : null
    const toDate = dateTo ? new Date(dateTo) : null
    const isWithinDateRange =
      (!fromDate || courseDate >= fromDate) && (!toDate || courseDate <= new Date(toDate.setHours(23, 59, 59, 999)))
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCreator =
      creatorFilter === "all" ||
      (creatorFilter === "admin" && course.created_by_type === "admin") ||
      (creatorFilter === "partner" && course.created_by_type === "partner")
    const matchesPartner =
      creatorFilter !== "partner" ||
      selectedPartnerId === "all" ||
      course.created_by === Number.parseInt(selectedPartnerId)
    return isWithinDateRange && matchesSearch && matchesCreator && matchesPartner
  })

  // Pagination calculations
  const totalPages = Math.ceil(courseData?.totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses

  const [updateSequence] = useUpdateCourseSequenceMutation()

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over) return
    if (active.id !== over.id) {
      setCourses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newArray = arrayMove(items, oldIndex, newIndex)
        const updatedSequence = newArray.map((course) => course.id)
        updateSequence({
          sequence: updatedSequence,
          access_token,
        }).catch((error) => {
          console.error("Sequence update failed", error)
        })
        return newArray
      })
    }
    setActiveId(null)
  }

  // Add this function to check if any filters are applied
  const isAnyFilterApplied = () => {
    return (
      dateFrom !== "" || dateTo !== "" || creatorFilter !== "all" || selectedPartnerId !== "all" || searchTerm !== ""
    )
  }

  const [showFAQModal, setShowFAQModal] = useState(false)
  const [createdCourseId, setCreatedCourseId] = useState(null)
  const [showFAQUpdateModal, setShowFAQUpdateModal] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState(null)

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full max-w-full p-4 sm:px-6">
          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="relative flex items-center justify-between mb-1">
              <h1 className="text-xl font-bold text-forestGreen absolute left-1/2 -translate-x-1/2">
                Courses
              </h1>
              <div className="flex items-center gap-2 ml-auto">
                <PermissionWrapper section="Course" action="create">
                  <AIContentGenerator contentType="course" onUseGenerated={handleUseGeneratedCourse} />
                </PermissionWrapper>

                <PermissionWrapper section="Course" action="create">
                  <button
                    onClick={() => {
                      resetForm();
                      setShowForm(!showForm)
                    }}
                    className="bg-leafGreen   text-white p-2 rounded-lg flex items-center transition-colors font-medium shadow-sm min-w-[30px]"
                  >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                  </button>
                </PermissionWrapper>
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex border rounded-md items-center gap-2 text-gray-600 hover:text-gray-900 p-1"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-forestGreen">Course Management</h1>
              <p className="text-gray-600 mt-1">Manage your courses and content</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {showFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <PermissionWrapper section="Course" action="create">
                <AIContentGenerator contentType="course" onUseGenerated={handleUseGeneratedCourse} />
              </PermissionWrapper>

              <PermissionWrapper section="Course" action="create">
                <button
                  onClick={() => {
                    resetForm(); // Clear the form fields
                    setShowForm(!showForm)
                  }
                  }
                  className="bg-leafGreen   text-white px-4 xl:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                >
                  {showForm ? <X size={18} /> : <Plus size={18} />}
                  {showForm ? "Close Form" : "Add Course"}
                </button>
              </PermissionWrapper>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden flex justify-center">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors w-full max-w-xs justify-center"
            >
              <Filter size={16} />
              <span className="font-medium text-sm">Filters</span>
              {showFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Filters */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilter ? "mt-3 max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Courses</label>
                  <div className="relative">
                    <Search className="absolute top-3 left-3 text-gray-400" size={16} />
                    <input
                      type="search"
                      placeholder="Search courses..."
                      className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
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
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {role !== "partner" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created By</label>
                    <select
                      value={creatorFilter}
                      onChange={(e) => {
                        setCreatorFilter(e.target.value)
                        setSelectedPartnerId("all")
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    >
                      <option value="all">All Creators</option>
                      <option value="admin">Admin</option>
                      <option value="partner">Partner</option>
                    </select>
                  </div>
                )}
                {creatorFilter === "partner" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Partner</label>
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => {
                        setSelectedPartnerId(e.target.value)
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    >
                      <option value="all">All Partners</option>
                      {!isLoadingPartners &&
                        partnersData?.partners?.map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setDateFrom("")
                      setDateTo("")
                      setCreatorFilter("all")
                      setSelectedPartnerId("all")
                      setSearchTerm("")
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <h2 className="text-xl font-semibold text-forestGreen mb-6">New Course</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    placeholder="Enter course title"
                  />
                </div>
                <div className="group">
                  <label htmlFor="course_category" className="block text-sm font-medium text-gray-700 mb-2">
                    Course Category *
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option disabled value="">
                      Select Category
                    </option>
                    {isLoadingCategories ? (
                      <option>Loading...</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="group">
                  <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (Minutes)
                  </label>
                  <input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min="0"
                    placeholder="Enter duration in minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hashtag</label>
                  {formData?.hashtags?.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => handleListChange(index, "hashtags", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen"
                        placeholder="Enter a Hashtag"
                      />
                      <button
                        type="button"
                        onClick={() => removeField(index, "hashtags")}
                        className="text-red-500 px-2 py-1 border border-red-500 rounded-md hover:bg-red-100 transition"
                        disabled={formData.hashtags.length === 1}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField("hashtags")}
                    className="text-leafGreen px-2 py-1 border border-leafGreen rounded-md hover:bg-lightGreen/20 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add More
                  </button>
                </div>
                <div className="group">
                  <label htmlFor="max_access_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Access Minutes
                  </label>
                  <input
                    type="text"
                    name="max_access_minutes"
                    value={formData.max_access_minutes}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                  {formData.max_access_minutes && (
                    <p className="text-sm text-gray-500">
                      {formatToHoursAndMinutes(Number.parseFloat(formData.max_access_minutes))}
                    </p>
                  )}
                </div>
                <div className="group">
                  <label htmlFor="min_access_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                    Min Access Minutes
                  </label>
                  <input
                    type="text"
                    name="min_access_minutes"
                    value={formData.min_access_minutes}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                  {formData.min_access_minutes && (
                    <p className="text-sm text-gray-500">
                      {formatToHoursAndMinutes(Number.parseFloat(formData.min_access_minutes))}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description
                </label>
                <Editor
                  id="description"
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
                      "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
                    content_style: "body { font-family:Arial,Helvetica,sans-serif; font-size:14px }",
                  }}
                  onEditorChange={(content) => setFormData({ ...formData, description: content })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Detail Image/Video
                  </label>
                  <button
                    type="button"
                    onClick={() => document.getElementById("coursePreviewVideo").click()}
                    className="cursor-pointer border border-leafGreen text-leafGreen px-4 py-2 rounded-lg hover:bg-lightGreen/20 transition-colors flex items-center gap-2 text-sm mb-2"
                  >
                    <Plus className="w-4 h-4" /> Add Media
                  </button>

                  <input
                    id="coursePreviewVideo"
                    name="coursePreviewVideo"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleChange}
                  />
                  {detailPreviews && detailPreviews.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2 w-full">
                      {detailPreviews.map((preview, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg bg-gray-50 group hover:bg-gray-100 transition-colors">
                          <div
                            className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1"
                            onClick={() => setPreviewModal(preview)}
                          >
                            {preview.isImage ? (
                              <img
                                src={preview.url}
                                alt="preview"
                                className="w-10 h-10 rounded object-cover shadow-sm bg-white flex-shrink-0"
                              />
                            ) : (
                              <video
                                src={preview.url}
                                className="w-10 h-10 rounded object-cover shadow-sm bg-black flex-shrink-0"
                              />
                            )}
                            <span className="text-sm font-medium text-gray-700 truncate" title={preview.name || `Media ${idx + 1}`}>
                              {preview.name || `Media ${idx + 1}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePreview(idx)}
                            className="text-red-500 hover:text-red-700 p-1.5 focus:outline-none flex-shrink-0"
                            title="Remove preview"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: For best results on the course page, use a 16:9 image (e.g., 1280×720 or 1920×1080). Non‑16:9 images will be displayed without distortion.
                  </p>
                </div>
                <div className="group">
                  <label htmlFor="courseThumbnail" className="block text-sm font-medium text-gray-700 mb-2">
                    Course Thumbnail
                  </label>
                  <input
                    id="courseThumbnail"
                    name="courseThumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lightGreen file:text-forestGreen hover:file:bg-leafGreen hover:file:text-white"
                  />
                  {thumbnailPreview && (
                    <div className="mt-4 flex justify-center">
                      <img
                        src={thumbnailPreview || "/placeholder.svg"}
                        alt="Course Thumbnail Preview"
                        className="w-48 h-32 rounded-lg border border-gray-200 shadow-lg object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="group">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    placeholder="Enter price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                </div>
                <div className="group">
                  <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    id="discount"
                    name="discount"
                    type="number"
                    min="0"
                    placeholder="Enter discount percentage"
                    value={formData.discount}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                </div>

                <div className="items-center gap-7">
                  <div className="group flex items-center space-x-2">
                    <input
                      id="is_points_enrollable"
                      name="is_points_enrollable"
                      type="checkbox"
                      checked={formData.is_points_enrollable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_points_enrollable: e.target.checked,
                          points_to_enroll: e.target.checked ? formData.points_to_enroll : 0,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_points_enrollable" className="text-sm font-medium text-gray-700">
                      Allow Enrollment via Points
                    </label>
                  </div>

                  {formData.is_points_enrollable && (
                    <div className="w-full">
                      <label htmlFor="points_to_enroll" className="block text-sm font-medium text-gray-700 mt-2">
                        Points Required to Enroll
                      </label>
                      <input
                        id="points_to_enroll"
                        name="points_to_enroll"
                        type="number"
                        min={10}
                        placeholder="Enter points required"
                        value={formData.points_to_enroll}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            points_to_enroll: Number.parseInt(e.target.value || 0),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="items-center">
                  <div className="flex group items-center space-x-2">
                    <input
                      id="is_points_rewarded"
                      name="is_points_rewarded"
                      type="checkbox"
                      checked={formData.is_points_rewarded}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_points_rewarded: e.target.checked,
                          points_rewarded: e.target.checked ? formData.points_rewarded : 0,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_points_rewarded" className="text-sm font-medium text-gray-700">
                      Reward Points on Purchase
                    </label>
                  </div>

                  {formData.is_points_rewarded && (
                    <div className="w-full">
                      <label htmlFor="points_rewarded" className="block text-sm font-medium text-gray-700 mt-2">
                        Points Rewarded :
                      </label>
                      <input
                        id="points_rewarded"
                        name="points_rewarded"
                        type="number"
                        min={1}
                        placeholder="Enter points rewarded"
                        required
                        value={formData.points_rewarded}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            points_rewarded: Number.parseInt(e.target.value || 0),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="items-center">
                  <div className="flex group items-center space-x-2">
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
                      Reward Points on Course Complete
                    </label>
                  </div>

                  {formData.is_points_rewarded_on_completion && (
                    <div className="w-full">
                      <label htmlFor="points_rewarded_on_completion" className="block text-sm font-medium text-gray-700 mt-2">
                        Points Rewarded On Completion :
                      </label>
                      <input
                        id="points_rewarded_on_completion"
                        name="points_rewarded_on_completion"
                        type="number"
                        min={1}
                        placeholder="Enter points"
                        value={formData.points_rewarded_on_completion}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            points_rewarded_on_completion: Number.parseInt(e.target.value || 0),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="items-center space-y-6">
                  <div className="flex group items-center space-x-2">
                    <input
                      id="is_copy_paste_allowed"
                      name="is_copy_paste_allowed"
                      type="checkbox"
                      checked={formData.is_copy_paste_allowed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_copy_paste_allowed: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_copy_paste_allowed" className="text-sm font-medium text-gray-700">
                      Allow Copy Paste Course Content
                    </label>
                  </div>

                  <div className="flex group items-center space-x-2">
                    <input
                      id="is_course_trending"
                      name="is_course_trending"
                      type="checkbox"
                      checked={formData.is_course_trending}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_course_trending: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                    />
                    <label htmlFor="is_course_trending" className="text-sm font-medium text-gray-700">
                      Set Course As Trending
                    </label>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">What You Will Learn</label>
                  {formData.what_you_will_learn.map((point, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => handleListChange(index, "what_you_will_learn", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen"
                        placeholder="Enter a learning point"
                      />
                      <button
                        type="button"
                        onClick={() => removeField(index, "what_you_will_learn")}
                        className="text-red-500 px-2 py-1 border border-red-500 rounded-md hover:bg-red-100 transition"
                        disabled={formData.what_you_will_learn.length === 1}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField("what_you_will_learn")}
                    className="text-leafGreen px-2 py-1 border border-leafGreen rounded-md hover:bg-lightGreen/20 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add More
                  </button>
                </div>
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prerequisites</label>
                  {formData.prerequisites.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => handleListChange(index, "prerequisites", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen"
                        placeholder="Enter a prerequisite"
                      />
                      <button
                        type="button"
                        onClick={() => removeField(index, "prerequisites")}
                        className="text-red-500 px-2 py-1 border border-red-500 rounded-md hover:bg-red-100 transition"
                        disabled={formData.prerequisites.length === 1}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField("prerequisites")}
                    className="text-leafGreen px-2 py-1 border border-leafGreen rounded-md hover:bg-lightGreen/20 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add More
                  </button>
                </div>
                {/* Skill Development */}
                <div className="group border border-gray-200 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skill Development</label>
                  {formData.skill_development.map((skill, skillIndex) => (
                    <div key={skillIndex} className="mb-4 p-4 border border-leafGreen/20 bg-lightGreen/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="text"
                          value={skill.title}
                          onChange={(e) => handleSkillTitleChange(skillIndex, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-leafGreen"
                          placeholder="Skill Title (e.g., Frontend Development)"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skillIndex)}
                          className="text-red-500 px-3 py-2 border border-red-500 bg-white rounded-md hover:bg-red-50 transition"
                          disabled={formData.skill_development.length === 1}
                        >
                          ❌
                        </button>
                      </div>

                      <div className="pl-4 border-l-2 border-leafGreen/30 ml-2 space-y-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Statements</label>
                        {skill.statements.map((statement, statementIndex) => (
                          <div key={statementIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={statement}
                              onChange={(e) => handleSkillStatementChange(skillIndex, statementIndex, e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leafGreen"
                              placeholder="Relevant statement for this skill"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSkillStatement(skillIndex, statementIndex)}
                              className="text-red-500 px-2 py-1.5 border border-red-300 bg-white rounded-md hover:bg-red-50 transition"
                              disabled={skill.statements.length === 1}
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddSkillStatement(skillIndex)}
                          className="text-leafGreen px-2 py-1 border border-leafGreen rounded-md hover:bg-lightGreen/20 transition flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Statement
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="w-full mt-2 text-leafGreen px-4 py-3 border-2 border-leafGreen/20 border-dashed rounded-lg hover:bg-lightGreen/10 font-medium transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Another Skill
                  </button>
                </div>
                <div className="group">
                  <label htmlFor="expiry_days" className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Days *
                  </label>
                  <input
                    id="expiry_days"
                    name="expiry_days"
                    type="number"
                    min="1"
                    placeholder="Enter expiry days"
                    value={formData.expiry_days}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  />
                </div>

                {/* Meta Section */}
                <section className="bg-white rounded-xl shadow-sm border p-4 md:p-6 w-full col-span-1 md:col-span-2">
                  <h2 className="text-xl font-semibold mb-4 text-forestGreen">
                    Meta
                  </h2>

                  <div className="w-full md:grid md:grid-cols-2 md:gap-6 md:items-stretch">

                    {/* LEFT SIDE — STACKED */}
                    <div className="flex flex-col space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                        <input
                          id="meta_title"
                          name="meta_title"
                          type="text"
                          value={formData.meta_title}
                          onChange={handleChange}
                          // required
                          placeholder="Enter meta title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-leafGreen/20 focus:border-leafGreen"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meta Keyword</label>
                        <input
                          id="meta_keyword"
                          name="meta_keyword"
                          type="text"
                          value={formData.meta_keyword}
                          onChange={handleChange}
                          // required
                          placeholder="Enter meta Keyword"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-leafGreen/20 focus:border-leafGreen"
                        />
                      </div>
                    </div>

                    {/* RIGHT SIDE – MATCH HEIGHT TO LEFT SIDE */}
                    <div className="flex flex-col h-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>

                      <textarea
                        id="meta_description"
                        name="meta_description"
                        value={formData.meta_description}
                        onChange={handleChange}
                        // required
                        placeholder="Enter meta description"
                        className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent md:h-full"
                      />
                    </div>

                  </div>
                </section>

                {/* SEO Section */}
                <section className="bg-white rounded-xl shadow-sm border p-4 md:p-6 w-full col-span-1 md:col-span-2">
                  <h2 className="text-xl font-semibold mb-4 text-forestGreen">
                    SEO
                  </h2>

                  <div className="w-full md:grid md:grid-cols-2 md:gap-6 md:items-stretch">

                    {/* LEFT SIDE — STACKED */}
                    <div className="flex flex-col space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SEO Canonical</label>
                        <input
                          id="seo_canonical"
                          name="seo_canonical"
                          type="url"
                          value={formData.seo_canonical}
                          onChange={handleCanonicalChange}
                          // required
                          placeholder="https://example.com/course/course_hash"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                            ${errors?.seo_canonical
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-leafGreen"
                            }`}
                        />
                        {errors?.seo_canonical && (
                          <p className="text-sm text-red-500 mt-1">
                            Please enter a valid URL (https://...)
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SEO Image Alt</label>
                        <input
                          id="seo_image_alt"
                          name="seo_image_alt"
                          type="text"
                          value={formData.seo_image_alt}
                          onChange={handleChange}
                          // required
                          placeholder="Enter SEO Image ALT"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* RIGHT SIDE – MATCH HEIGHT TO LEFT SIDE */}
                    <div className="flex flex-col h-full justify-center px-4 mt-4 md:mt-0 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl transition-all duration-200 hover:border-leafGreen/50">
                      <div className="space-y-1 text-center w-full">
                        {seoImagePreview ? (
                          <div className="relative w-full">
                            <img
                              src={seoImagePreview}
                              alt="SEO Image"
                              className="mx-auto h-32 w-32 object-cover rounded-lg"
                            />
                          </div>
                        ) : (
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        )}
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                        <div className="w-full flex justify-center">
                          <input
                            id="seo_image"
                            name="seo_image"
                            type="file"
                            accept="image/*"
                            onChange={handleChange}
                            className="
                              block w-full max-w-sm text-sm text-gray-700
                              file:mr-4 file:px-4 file:py-2 file:border-0
                              file:bg-leafGreen file:text-white file:rounded-lg
                              file:cursor-pointer file:hover:bg-leafGreen
                              cursor-pointer border border-gray-300 rounded-lg
                              overflow-hidden text-ellipsis whitespace-nowrap
                            "
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </section>

                {/* OG Section */}
                <section className="bg-white rounded-xl shadow-sm border p-4 md:p-6 w-full col-span-1 md:col-span-2">
                  <h2 className="text-xl font-semibold mb-4 text-forestGreen">
                    OG
                  </h2>

                  <div className="space-y-6 w-full">

                    {/* ---------- ROW 1 ---------- */}
                    <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                      {/* OG Title */}
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OG Title
                        </label>
                        <input
                          id="og_title"
                          name="og_title"
                          type="text"
                          value={formData.og_title}
                          onChange={handleChange}
                          // required
                          placeholder="Enter OG Title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                        />
                      </div>

                      {/* OG Image Alt */}
                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OG Image Alt
                        </label>
                        <input
                          id="og_image_alt"
                          name="og_image_alt"
                          type="text"
                          value={formData.og_image_alt}
                          onChange={handleChange}
                          // required
                          placeholder="Enter OG Image Alt"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* ---------- ROW 2 ---------- */}
                    <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0 md:items-stretch">
                      {/* OG Description */}
                      <div className="flex flex-col h-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OG Description
                        </label>

                        <textarea
                          id="og_description"
                          name="og_description"
                          value={formData.og_description}
                          onChange={handleChange}
                          // required
                          placeholder="Enter OG Description"
                          className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                        />
                      </div>

                      {/* OG Image Upload */}
                      <div className="flex flex-col h-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          OG Image
                        </label>

                        <div className="flex-1 w-full flex justify-center px-4 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl transition-all duration-200 hover:border-leafGreen/50">
                          <div className="space-y-1 text-center w-full flex flex-col justify-center">

                            {ogImagePreview ? (
                              <img
                                src={ogImagePreview}
                                alt="OG Image"
                                className="mx-auto h-32 w-32 object-cover rounded-lg"
                              />
                            ) : (
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            )}

                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            <div className="w-full flex justify-center">
                              <input
                                id="og_image"
                                name="og_image"
                                type="file"
                                accept="image/*"
                                onChange={handleChange}
                                className="
                              block w-full max-w-sm text-sm text-gray-700
                              file:mr-4 file:px-4 file:py-2 file:border-0
                              file:bg-leafGreen file:text-white file:rounded-lg
                              file:cursor-pointer
                              cursor-pointer border border-gray-300 rounded-lg
                              overflow-hidden text-ellipsis whitespace-nowrap
                            "
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </section>

                <div className="group mt-6 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-leafGreen text-white rounded-lg   focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                    disabled={isLoadingCreateCourse}
                  >
                    {isLoadingCreateCourse ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Course"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Courses List */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-lightGreen">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Title
                    </th>
                    <PermissionWrapper section="Course FAQ" action="view">
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        FAQs
                      </th>
                    </PermissionWrapper>
                    <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <PermissionWrapper section="Course" action="toggle">
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                    </PermissionWrapper>
                    <PermissionWrapper section="Course" action="view">
                      <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </PermissionWrapper>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingGetCourses ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center">
                        <AdminLoader message="Loading courses..." />
                      </td>
                    </tr>
                  ) : paginatedCourses.length > 0 ? (
                    <SortableContext
                      items={paginatedCourses.map((course) => course.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {paginatedCourses.map((course, index) => (
                        <SortableCourseRow
                          key={course.id}
                          course={course}
                          index={startIndex + index}
                          handleStatusToggle={handleStatusToggle}
                          loadingStatus={loadingStatus}
                          navigate={navigate}
                          setSelectedCourseId={setSelectedCourseId}
                          setShowFAQUpdateModal={setShowFAQUpdateModal}
                        />
                      ))}
                    </SortableContext>
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500 font-medium">
                        No course available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {isLoadingGetCourses ? (
                <div className="p-8 flex justify-center bg-white">
                  <AdminLoader message="Loading courses..." />
                </div>
              ) : paginatedCourses.length > 0 ? (
                <SortableContext
                  items={paginatedCourses.map((course) => course.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="">
                    {paginatedCourses.map((course, index) => (
                      <SortableCourseRow
                        key={course.id}
                        course={course}
                        index={startIndex + index}
                        handleStatusToggle={handleStatusToggle}
                        loadingStatus={loadingStatus}
                        navigate={navigate}
                        setSelectedCourseId={setSelectedCourseId}
                        setShowFAQUpdateModal={setShowFAQUpdateModal}
                      />
                    ))}
                  </div>
                </SortableContext>
              ) : (
                <div className="p-8 text-center text-gray-500 font-medium bg-white">
                  No course available
                </div>
              )}
            </DndContext>
          </div>
        </div>

        {/* Pagination */}
        {courseData?.totalCount > 10 && (
          <Pagination
            pagination={{ totalCount: courseData?.totalCount, totalPages: totalPages }}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            limit={itemsPerPage}
            setLimit={setItemsPerPage}
          />
        )}
      </div>

      {/* Modals */}
      {showFAQModal && (
        <CourseFAQModal
          course_id={createdCourseId}
          access_token={access_token}
          onClose={() => setShowFAQModal(false)}
        />
      )}
      {showFAQUpdateModal && (
        <UpdateFAQModal course_id={selectedCourseId} onClose={() => setShowFAQUpdateModal(false)} access_token={access_token} />
      )}

      {/* Media Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm" onClick={() => setPreviewModal(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center bg-transparent" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2 transition-colors"
              onClick={() => setPreviewModal(null)}
            >
              <X size={24} />
            </button>
            {previewModal.isImage ? (
              <img src={previewModal.url} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-lg bg-black/10" />
            ) : (
              <video src={previewModal.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-lg bg-black" />
            )}
            <p className="mt-4 text-white text-sm font-medium bg-black bg-opacity-50 px-4 py-2 rounded-full backdrop-blur-md">
              {previewModal.name || "Preview"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}