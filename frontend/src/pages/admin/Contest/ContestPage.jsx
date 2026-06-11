import { useState, useEffect } from "react";
import AdminLoader from "../../../components/admin/AdminLoader";
import {
  Plus,
  Edit2,
  Play,
  Pause,
  Trash2,
  Calendar,
  Users,
  X,
  Trophy,
  Target,
  Coins,
  User,
  UserCheck,
  ArrowLeft,
  Filter,
  ChevronDown,
  ChevronUp,
  Upload,
  BookOpen,
  MoreVertical,
  Info,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import {
  useGetAllContestsQuery,
  useCreateContestMutation,
  useUpdateContestMutation,
  useDeleteContestMutation,
  useToggleContestStatusMutation,
} from "../../../services/Contest/contestAPI";
import {
  useGetPrizesByContestQuery,
  useCreatePrizeMutation,
  useUpdatePrizeMutation,
  useDeletePrizeMutation,
  useTogglePrizeStatusMutation,
} from "../../../services/Contest/contestPrizeAPI";
import { useGetAllChallengeCategoriesQuery } from "../../../services/Masters/challengeCategoryApi";
import { useLocation, useNavigate } from "react-router-dom";
import { slugify } from "../../../utils/slugify";
import { getAdminToken } from "../../../services/CookieService";
import toast from "react-hot-toast";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { Editor } from "@tinymce/tinymce-react";

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, contestName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm mx-auto shadow-2xl">
        <div className="p-4 sm:p-6">
          {/* Header with Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} className="text-red-600 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Delete Contest
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                This action cannot be undone
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-600 mb-3">
              Are you sure you want to delete this contest?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                "{contestName}"
              </p>
            </div>
            <p className="text-xs sm:text-sm text-red-600 mt-3 flex items-center gap-1">
              <AlertCircle size={14} className="flex-shrink-0" />
              This action cannot be undone and all associated data will be lost.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <Trash2 size={16} className="sm:w-4 sm:h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeletePrizeModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Delete Prize</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Are you sure you want to delete the prize:
          </p>
          <p className="text-sm text-red-600 mt-2">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Delete<span className="hidden sm:inline"> Prize</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ pagination, currentPage, setCurrentPage, limit, setLimit }) {
  const limitOptions = [10, 20, 50, 100, 500];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-white">
      {/* Mobile Pagination */}
      <div className="md:hidden">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 text-center">
              Page {currentPage} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Contests per page:</label>
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
            <label className="text-sm font-medium text-gray-700">Contests per page:</label>
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

function ContestCard({
  contest,
  onEdit,
  onDelete,
  onToggleStatus,
  onManagePrizes,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigate = useNavigate();

  const getStatusColor = () => {
    return "bg-leafGreen";
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case "solo":
        return <User size={16} className="text-white" />;
      case "team":
        return <Users size={16} className="text-white" />;
      case "mixed":
        return <UserCheck size={16} className="text-white" />;
      default:
        return <User size={16} className="text-white" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = (e) => {
    if (e.target.closest(".action-buttons") || e.target.closest(".mobile-menu")) {
      return;
    }

    navigate(`/admin/dashboard/contests/${slugify(contest.title)}/activities`, {
      state: { id: contest.id },
    });
  };

  return (
    <motion.div
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      }}
      className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      {/* Header with Status and Image Background */}
      <div className={`${getStatusColor()} p-4 relative`}>
        {/* Background Image Overlay */}
        {!imageError && contest.banner_url && (
          <div className="absolute inset-0 opacity-20">
            <img
              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${contest.banner_url || "/placeholder.png"
                }`}
              alt={contest.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
        )}

        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-medium text-white">
              {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
            </div>

            {/* Desktop Dropdown */}
            <div className="hidden sm:flex space-x-1">
              <PermissionWrapper section="Contest" action="toggle">
                <div className="relative action-buttons">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown((prev) => !prev);
                    }}
                    className="text-white bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-colors"
                  >
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${showDropdown ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {showDropdown && (
                    <div
                      className="absolute top-full mt-2 right-0 min-w-[120px] rounded-xl shadow-lg bg-white border border-gray-100 py-2 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {["active", "draft", "ended", "cancelled"].map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setShowDropdown(false);
                              onToggleStatus?.(contest.id, status);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-lightGreen transition-colors duration-150"
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </PermissionWrapper>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden relative mobile-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileMenu(!showMobileMenu);
                }}
                className="text-white bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              {showMobileMenu && (
                <div className="absolute top-full mt-2 right-0 min-w-[140px] rounded-xl shadow-lg bg-white border border-gray-100 py-2 z-20">
                  <PermissionWrapper section="Contest" action="toggle">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                      Change Status
                    </div>
                    {["active", "draft", "ended", "cancelled"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setShowMobileMenu(false);
                            onToggleStatus?.(contest.id, status);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-lightGreen transition-colors duration-150"
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      )
                    )}
                  </PermissionWrapper>
                </div>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mt-2 line-clamp-2 min-h-[3.5rem]">
            {contest.title}
          </h3>

          <div className="flex items-center space-x-2 mt-3">
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-1.5">
              {getModeIcon(contest.mode)}
            </div>
            <span className="text-white text-sm capitalize">
              {contest.mode} Contest
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex-1">
          {/* <p
            className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[42px] cursor-help"
            title={contest?.description || "No description provided"}
          >
            {contest?.description || "No description provided"}
          </p> */}

          <div
            className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[42px]"
            dangerouslySetInnerHTML={{ __html: contest?.description }}
          />

          <div className="grid grid-cols-2 gap-3 mb-4">
            {contest.max_participants > 0 && (
              <div className="flex items-center text-gray-500 text-sm">
                <Target size={16} className="mr-1" />
                <span>Max {contest.max_participants}</span>
              </div>
            )}
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar size={16} className="mr-1" />
              <span>{formatDate(contest.start_time)}</span>
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <Coins size={16} className="mr-1" />
              <span>
                {contest.enroll_by === "free"
                  ? "Free"
                  : contest.enroll_by === "points" ? `${contest.enrollment_fee} pts` : `${contest.enrollment_fee} ₹`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 action-buttons">
          <PermissionWrapper section="Contest" action="edit">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(contest);
              }}
              className="flex-1 py-2 px-3 bg-leafGreen   text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Edit2 size={16} className="mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </PermissionWrapper>

          <PermissionWrapper section="Contest Prize" action="view">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onManagePrizes?.(contest);
              }}
              className="flex-1 py-2  bg-leafGreen   text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Trophy size={16} className="mr-1" />
              <span className="hidden sm:inline">Prizes</span>
            </button>
          </PermissionWrapper>

          <PermissionWrapper section="Contest" action="delete">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(contest.id);
              }}
              className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </PermissionWrapper>
        </div>
      </div>
    </motion.div>
  );
}

function ContestForm({
  template_id,
  contest,
  categoriesData,
  onSave,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    template_id: template_id,
    category_id: contest?.category_id || "",
    title: contest?.title || "",
    description: contest?.description || "",
    rules: contest?.rules || "",
    start_time: contest?.start_time ? contest.start_time.slice(0, 16) : "",
    end_time: contest?.end_time ? contest.end_time.slice(0, 16) : "",
    enrollment_start: contest?.enrollment_start
      ? contest.enrollment_start.slice(0, 16)
      : "",
    enrollment_end: contest?.enrollment_end
      ? contest.enrollment_end.slice(0, 16)
      : "",
    max_participants: contest?.max_participants,
    enroll_by: contest?.enroll_by || "free",
    is_limites_participants: contest?.is_limites_participants || false,
    enrollment_fee: contest?.enrollment_fee,
    mode: contest?.mode || "solo",
    banner_url: contest?.banner_url || "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Add this function to handle file selection
  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, banner_url: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Add drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  // Update your handleSubmit function to include the file
  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = [];

    const formDataToSend = new FormData();

    const { start_time, end_time, enrollment_start, enrollment_end } = formData;

    // Convert to Date objects if values exist
    const start = start_time ? new Date(start_time) : null;
    const end = end_time ? new Date(end_time) : null;
    const enrollStart = enrollment_start ? new Date(enrollment_start) : null;
    const enrollEnd = enrollment_end ? new Date(enrollment_end) : null;

    // --- Validation Rules ---

    // Required: start & end
    if (!start || !end) {
      errors.push("Start Time and End Time are required.");
    } else {
      if (end <= start) {
        errors.push("End Time must be after Start Time.");
      }
    }

    // Enrollment Start < Enrollment End
    if (enrollStart && enrollEnd && enrollEnd <= enrollStart) {
      errors.push("Enrollment End must be after Enrollment Start.");
    }

    // Enrollment End < Contest Start
    if (enrollEnd && start && enrollEnd >= start) {
      errors.push("Enrollment End must be before Contest Start.");
    }

    // --- If any errors, show and stop submission ---
    if (errors.length > 0) {
      toast.error(errors.join("\n"));
      return;
    }

    // Add all form fields
    Object.keys(formData).forEach((key) => {
      const value = formData[key];

      // ❌ skip null, undefined, empty string
      if (value === null || value === undefined || value === "") return;

      if (key !== "banner_url") {
        formDataToSend.append(key, value);
      }
    });

    // Add the file if selected
    if (selectedFile) {
      formDataToSend.append("contestBanner", selectedFile);
    }

    onSave(formDataToSend);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {contest ? "Edit Contest" : "Add New Contest"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-lightGreen rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form id="contestForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Title and Category */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  required
                  placeholder="Enter contest title"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/100 characters
                </p>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categoriesData?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
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

              {/* <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none text-sm sm:text-base"
                rows={3}
                placeholder="Enter contest description"
              maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p> */}
            </div>

            {/* Banner and Mode */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image
                </label>
                <div
                  className={`relative w-full h-32 sm:h-36 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${isDragOver
                    ? "border-leafGreen/70 bg-lightGreen"
                    : "border-gray-300 hover:border-leafGreen/70"
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById("banner-upload").click()
                  }
                >
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />

                  {formData.banner_url ? (
                    <div className="relative w-full h-full">
                      <img
                        src={
                          selectedFile instanceof File
                            ? URL.createObjectURL(selectedFile)
                            : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${formData.banner_url || "/placeholder.png"
                            }`
                        }
                        alt="Banner preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all rounded-lg flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity text-white text-xs text-center p-2">
                          Click to change image
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                      <Upload size={24} className="mb-2" />
                      <span className="text-xs text-center">
                        Drop image here or click to upload
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        Recommended: 16:9 aspect ratio
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mode */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode *
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) =>
                      setFormData({ ...formData, mode: e.target.value })
                    }
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="" disabled>
                      Select Mode
                    </option>
                    <option value="solo">Solo</option>
                    <option value="team" disabled>
                      Team
                    </option>
                    <option value="mixed" disabled>
                      Mixed
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contest Dates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            {/* Enrollment Dates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment Start
                </label>
                <input
                  type="datetime-local"
                  value={formData.enrollment_start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enrollment_start: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment End
                </label>
                <input
                  type="datetime-local"
                  value={formData.enrollment_end}
                  onChange={(e) =>
                    setFormData({ ...formData, enrollment_end: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Paid Contest */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enroll By *
                </label>
                <select
                  value={formData.enroll_by}
                  onChange={(e) =>
                    setFormData({ ...formData, enroll_by: e.target.value, enrollment_fee: null })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                >
                  <option value="" disabled>
                    Enroll By
                  </option>
                  <option value="free">Free</option>
                  <option value="points">Points</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {formData.enroll_by === "points" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enrollment Fee (Points)*
                  </label>
                  <input
                    type="number"
                    value={formData.enrollment_fee || null}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enrollment_fee: Number.parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                    min="1"
                    placeholder="Enter fee amount"
                    required
                  />
                </div>
              )}

              {formData.enroll_by === "paid" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enrollment Fee ₹*
                  </label>
                  <input
                    type="number"
                    value={formData.enrollment_fee || null}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enrollment_fee: Number.parseInt(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                    min="1"
                    placeholder="Enter fee amount"
                    required
                  />
                </div>
              )}
            </div>

            {/* Limited Participants */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_limites_participants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_limites_participants: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-leafGreen text-forestGreen focus:ring-leafGreen border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Limited Participants
                </label>
              </div>

              {formData.is_limites_participants && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants{" "}
                    {formData.is_limites_participants ? "*" : ""}
                  </label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_participants: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                    min="1"
                    placeholder="Enter max participants"
                    required={formData.is_limites_participants}
                  />
                </div>
              )}
            </div>

            {/* Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rules
              </label>
              <Editor
                id="rules"
                apiKey={import.meta.env.VITE_TINYMCE_API}
                value={formData.rules}
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
                onEditorChange={(content) => setFormData({ ...formData, rules: content })}
              />

              {/* <textarea
                value={formData.rules}
                onChange={(e) =>
                  setFormData({ ...formData, rules: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none text-sm sm:text-base"
                rows={3}
                placeholder="Enter contest rules"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.rules.length}/1000 characters
              </p> */}
            </div>
          </form>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="contestForm"
            className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {contest ? "Update " : "Create "} <span className="hidden sm:inline">Contest</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PrizeForm({ prize, prizes, onSave, onCancel }) {
  let nextStart = 1;

  if (prizes.length > 0) {
    const maxEnd = Math.max(
      ...prizes.map((p) =>
        p.prize_type === "range" ? p.position_end : p.position_start
      )
    );
    nextStart = maxEnd + 1;
  }

  const [formData, setFormData] = useState({
    prize_type: prize?.prize_type || "position",
    position_start: prize?.position_start || nextStart,
    position_end: prize?.position_end || nextStart + 1,
    prize_points: prize?.prize_points,
    prize_description: prize?.prize_description || "",
  });

  const validatePositions = () => {
    const start = formData.position_start;
    const end =
      formData.prize_type === "range"
        ? formData.position_end
        : formData.position_start;

    for (let existing of prizes) {
      if (prize && existing.id === prize.id) continue; // skip self on edit

      const existingStart = existing.position_start;
      const existingEnd =
        existing.prize_type === "range"
          ? existing.position_end
          : existing.position_start;

      // Check overlap: (start <= existingEnd && end >= existingStart)
      if (start <= existingEnd && end >= existingStart) {
        return `Positions overlap with existing prize: ${existing.prize_description ? existing.prize_description : ""
          } (${existingStart}${existingEnd !== existingStart ? `-${existingEnd}` : ""
          })`;
      }
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errorMsg = validatePositions();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-md mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            {prize ? "Edit Prize" : "Add New Prize"}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} id='contestPrizeForm' className="space-y-4 sm:space-y-6">
            {/* Prize Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Type
              </label>
              <select
                value={formData.prize_type}
                onChange={(e) =>
                  setFormData({ ...formData, prize_type: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
              >
                <option value="position">Single Position</option>
                <option value="range">Position Range</option>
              </select>
            </div>

            {/* Position Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Position *
                </label>
                <input
                  type="number"
                  value={formData.position_start}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position_start: Number.parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  min="1"
                  required
                  placeholder="1"
                />
              </div>

              {formData.prize_type === "range" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Position *
                  </label>
                  <input
                    type="number"
                    value={formData.position_end}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position_end: Number.parseInt(e.target.value) || formData.position_start + 1,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                    min={formData.position_start + 1}
                    required
                    placeholder={formData.position_start + 1}
                  />
                </div>
              )}
            </div>

            {/* Prize Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Points *
              </label>
              <input
                type="number"
                value={formData.prize_points}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prize_points: Number.parseInt(e.target.value) || 0,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                min="1"
                placeholder="Enter points"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Points awarded to the winner(s)
              </p>
            </div>

            {/* Prize Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Description
              </label>
              <input
                type="text"
                value={formData.prize_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prize_description: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                placeholder="e.g., First Place Award, Runner-up Prize"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.prize_description.length}/100 characters
              </p>
            </div>

            {/* Position Preview */}
            <div className="bg-lightGreen border border-leafGreen/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-forestGreen">
                <Info size={16} className="flex-shrink-0" />
                <span className="font-medium">Position {formData.prize_type === "range" && "Range"}:</span>
                <span>
                  {formData.position_start}
                  {formData.prize_type === "range" && formData.position_end !== formData.position_start
                    ? ` - ${formData.position_end}`
                    : ""}
                </span>
              </div>
              {formData.prize_type === "range" && (
                <p className="text-xs text-forestGreen mt-1">
                  This prize will be awarded to positions {formData.position_start} through {formData.position_end}
                </p>
              )}
              {formData.prize_type === "position" && (
                <p className="text-xs text-forestGreen mt-1">
                  This prize will be awarded to position {formData.position_start} only
                </p>
              )}
            </div>

            {/* Spacer for mobile to ensure content doesn't get hidden behind fixed buttons */}
            <div className="h-4 sm:h-0"></div>
          </form>
        </div>

        {/* Fixed Footer Buttons */}
        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="contestPrizeForm"
            className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trophy size={16} className="flex-shrink-0" />
            {prize ? "Update " : "Add "} <span className="hidden sm:inline">Prize</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PrizeManagementModal({ contest, onClose }) {
  const { data: prizesData, isLoading: prizesLoading } =
    useGetPrizesByContestQuery(contest?.id, {
      skip: !contest?.id,
    });

  const [createPrize] = useCreatePrizeMutation();
  const [updatePrize] = useUpdatePrizeMutation();
  const [deletePrize] = useDeletePrizeMutation();
  const [togglePrizeStatus] = useTogglePrizeStatusMutation();

  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [deletePrizeConfirmation, setDeletePrizeConfirmation] = useState({
    isOpen: false,
    id: null,
  });

  const prizes = prizesData?.prizes || [];

  const handleAddPrize = () => {
    setEditingPrize(null);
    setShowPrizeForm(true);
  };

  const handleEditPrize = (prize) => {
    setEditingPrize(prize);
    setShowPrizeForm(true);
  };

  const handleSavePrize = async (prizeData) => {
    try {
      if (editingPrize) {
        await updatePrize({ id: editingPrize.id, ...prizeData }).unwrap();
        toast.success("Contest Prize Edited Successfully");
      } else {
        await createPrize({ contest_id: contest.id, ...prizeData }).unwrap();
        toast.success("Contest Prize Created Successfully");
      }
      setShowPrizeForm(false);
      setEditingPrize(null);
    } catch (error) {
      toast.error(
        error?.data?.error || error?.data?.message || "Error saving Prize"
      );
      console.error("Error saving prize:", error);
    }
  };

  const handleDeletePrize = (id) => {
    setDeletePrizeConfirmation({ isOpen: true, id });
  };

  const handleDeletePrizeConfirm = async (id) => {
    try {
      const response = await deletePrize(id).unwrap();
      if (response.success)
        toast.success(response.message || "Contest Prize Deleted Successfully");
    } catch (error) {
      toast.error(
        error?.data?.error || error?.data?.message || "Error in Deleting Prize"
      );
      console.error("Error deleting prize:", error);
    } finally {
      setDeletePrizeConfirmation({ isOpen: false, id: null });
    }
  };

  const handleTogglePrizeStatus = async (id) => {
    try {
      const response = await togglePrizeStatus(id).unwrap();
      if (response.success)
        toast.success("Contest Prize Status Updated Successfully");
    } catch (error) {
      toast.error(
        error?.data?.error ||
        error?.data?.message ||
        "Error in toggling Prize Status"
      );
      console.error("Error toggling prize status:", error);
    }
  };

  if (prizesLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md mx-auto shadow-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading prizes...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPrizeForm ? (
        <PrizeForm
          prize={editingPrize}
          prizes={prizes}
          onSave={handleSavePrize}
          onCancel={() => {
            setShowPrizeForm(false);
            setEditingPrize(null);
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  Manage Prizes
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                  {contest?.title}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <PermissionWrapper section="Contest Prize" action="create">
                  <button
                    onClick={handleAddPrize}
                    className=" bg-leafGreen   text-white rounded-lg transition-colors sm:px-3x p-2 flex items-center gap-2 font-medium text-sm"
                  >
                    <Plus size={16} className="flex-shrink-0" />
                    <span className="hidden sm:inline">Add<span className="hidden md:inline"> Prize</span></span>
                  </button>
                </PermissionWrapper>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Prize List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {prizes.map((prize) => (
                  <div
                    key={prize.id}
                    className="group border border-gray-200 rounded-xl p-3 sm:p-4 bg-white hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Prize Info */}
                      <div className="flex-1 min-w-0">
                        {/* Status and Type */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${prize.is_active
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                              }`}
                          >
                            {prize.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-lightGreen text-forestGreen border border-leafGreen/30 capitalize">
                            {prize.prize_type} Prize
                          </span>
                        </div>

                        {/* Description */}
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base break-words">
                          {prize.prize_description}
                        </h4>

                        {/* Prize Details */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Trophy size={12} className="flex-shrink-0 text-leafGreen" />
                            <span>
                              Position:{" "}
                              <span className="font-medium">
                                {prize.position_start}
                                {prize.prize_type === "range" &&
                                  prize.position_end &&
                                  prize.position_end !== prize.position_start
                                  ? ` - ${prize.position_end}`
                                  : ""}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Coins size={12} className="flex-shrink-0 text-yellow-500" />
                            <span>
                              <span className="font-medium">{prize.prize_points}</span> points
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 sm:gap-1">
                        <PermissionWrapper section="Contest Prize" action="edit">
                          <button
                            onClick={() => handleEditPrize(prize)}
                            className="h-8 w-8 p-0 hover:bg-lightGreen rounded-lg flex items-center justify-center text-forestGreen transition-colors flex-shrink-0"
                            title="Edit Prize"
                          >
                            <Edit2 size={14} />
                          </button>
                        </PermissionWrapper>
                        <PermissionWrapper section="Contest Prize" action="toggle">
                          <label
                            className="relative inline-flex items-center cursor-pointer flex-shrink-0"
                            title={prize.is_active ? "Deactivate" : "Activate"}
                          >
                            <input
                              type="checkbox"
                              checked={prize.is_active}
                              onChange={() => handleTogglePrizeStatus(prize.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                          </label>
                        </PermissionWrapper>
                        <PermissionWrapper section="Contest Prize" action="delete">
                          <button
                            onClick={() => handleDeletePrize(prize.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 rounded-lg flex items-center justify-center text-red-600 transition-colors flex-shrink-0"
                            title="Delete Prize"
                          >
                            <Trash2 size={14} />
                          </button>
                        </PermissionWrapper>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {prizes.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Trophy size={20} className="text-gray-400 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                      No prizes yet
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto mb-4">
                      Get started by adding prizes for your contest winners
                    </p>
                    <PermissionWrapper section="Contest Prize" action="create">
                      <button
                        onClick={handleAddPrize}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-leafGreen   text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Plus size={16} />
                        Add First Prize
                      </button>
                    </PermissionWrapper>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          <DeletePrizeModal
            isOpen={deletePrizeConfirmation.isOpen}
            onClose={() =>
              setDeletePrizeConfirmation({ isOpen: false, id: null })
            }
            onConfirm={() =>
              handleDeletePrizeConfirm(deletePrizeConfirmation.id)
            }
          />
        </div>
      )}
    </>
  );
}

export default function ContestsPage() {
  const id = useLocation()?.state?.id;
  const template_title = useLocation()?.state?.template_title;
  const navigate = useNavigate();

  const [createContest] = useCreateContestMutation();
  const [updateContest] = useUpdateContestMutation();
  const [deleteContest] = useDeleteContestMutation();
  const [toggleContestStatus] = useToggleContestStatusMutation();

  const { access_token } = getAdminToken();

  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    mode: "all",
    type: "all",
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isAnyFilterApplied = () => {
    return filters.status !== "all" || filters.type !== "all" || sortBy !== "newest";
  }

  const { data: contestsData, isLoading, error } = useGetAllContestsQuery({ limit: itemsPerPage, offset: itemsPerPage !== "all" ? itemsPerPage * (currentPage - 1) : 0, sortBy, status: filters.status, type: filters.type, template_id: id });

  const { data: categoriesData } = useGetAllChallengeCategoriesQuery({ access_token });

  const [showForm, setShowForm] = useState(false);
  const [editingContest, setEditingContest] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    contest: null,
  });
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Map contests and convert times
  const contests =
    contestsData?.data?.map((contest) => ({
      ...contest,
      start_time: convertUTCToIST(contest.start_time)?.dateTime,
      end_time: convertUTCToIST(contest.end_time)?.dateTime,
      enrollment_start: contest.enrollment_start
        ? convertUTCToIST(contest.enrollment_start)?.dateTime
        : null,
      enrollment_end: contest.enrollment_end
        ? convertUTCToIST(contest.enrollment_end)?.dateTime
        : null,
    })) || [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.mode, filters.type, sortBy]);

  useEffect(() => {
    if (contestsData?.data?.length == 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [contestsData?.data]);

  const handleAddContest = () => {
    setEditingContest(null);
    setShowForm(true);
  };

  const handleEditContest = (contest) => {
    setEditingContest(contest);
    setShowForm(true);
  };

  const handleSaveContest = async (contestData) => {
    try {
      if (editingContest) {
        await updateContest({
          id: editingContest.id,
          data: contestData,
        }).unwrap();
        toast.success("Contest Updated Successfully");
      } else {
        await createContest({ data: contestData }).unwrap();
        toast.success("Contest Created Successfully");
      }
      setShowForm(false);
      setEditingContest(null);
    } catch (error) {
      toast.error(
        error?.data?.error || error?.data?.message || "Error in Saving Contest"
      );
      console.error("Error saving contest:", error);
    }
  };

  const handleDeleteContest = (contest) => {
    setDeleteConfirmation({ isOpen: true, contest });
  };

  // utils/dateUtils.js
  function convertUTCToIST(utcDateTimeStr) {
    const utcDate = new Date(utcDateTimeStr);

    // IST is UTC +5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utcDate.getTime());

    const pad = (n) => String(n).padStart(2, "0");
    const formatted =
      `${istDate.getFullYear()}-` +
      `${pad(istDate.getMonth() + 1)}-` +
      `${pad(istDate.getDate())} ` +
      `${pad(istDate.getHours())}:` +
      `${pad(istDate.getMinutes())}:` +
      `${pad(istDate.getSeconds())}`;

    return {
      dateTime: formatted,
      offset: "+5:30",
    };
  }

  const confirmDelete = async () => {
    if (deleteConfirmation.contest) {
      try {
        const response = await deleteContest(
          deleteConfirmation.contest.id
        ).unwrap();
        setDeleteConfirmation({ isOpen: false, contest: null });
        if (response.success)
          toast.success(response.message || "Contest deleted successfully");
      } catch (error) {
        toast.error(
          error?.data?.error || error?.data?.message || "Error Deleting Contest"
        );
        console.error("Error deleting contest:", error);
      }
    }
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      const contest = contests.find((c) => c.id === id);
      const response = await toggleContestStatus({
        id,
        status: newStatus,
      }).unwrap();
      if (response.success) {
        toast.success("Contest Status Updated Successfully");
      }
    } catch (error) {
      toast.error(error?.data?.error || error?.data?.message || "Error Updating Contest Status!");
      console.error("Error toggling contest status:", error);
    }
  };

  const handleManagePrizes = (contest) => {
    setSelectedContest(contest);
    setShowPrizeModal(true);
  };

  let filteredContests = [...contests];

  // Apply filters
  // if (filters.status !== "all") {
  //   filteredContests = filteredContests.filter(
  //     (c) => c.status === filters.status
  //   );
  // }
  // if (filters.mode !== "all") {
  //   filteredContests = filteredContests.filter((c) => c.mode === filters.mode);
  // }
  // if (filters.type !== "all") {
  //   filteredContests = filteredContests.filter(
  //     (c) => c.is_free === (filters.type === "free")
  //   );
  // }

  // Apply sorting
  const sortedContests = filteredContests

  // Pagination
  const totalPages = Math.ceil(sortedContests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContests = sortedContests

  const pagination = contestsData?.pagination;

  if (isLoading) {
    return <AdminLoader fullScreen={true} message="Loading contests..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-500">
          Error loading contests: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1 grid">
              <h1 className="text-2xl font-bold  text-forestGreen">
                Contests
              </h1>
              <p className="text-gray-600 mt-1 truncate">
                {template_title
                  ? `Manage Contests For "${template_title}"`
                  : "Manage Individual Contests"}
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-2 md:gap-3">
              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors sm:px-3"
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {showAllFilters ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              <PermissionWrapper section="Contest" action="create">
                <button
                  onClick={handleAddContest}
                  className=" bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                >
                  <Plus size={18} />
                  Add Contest
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm sm:px-3"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>
          <div className="sm:hidden">
            {/* Title Row - Centered with back button on right */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-8"></div> {/* Spacer for balance */}
              <div className="flex-1 grid text-center">
                <h1 className="text-xl font-bold  text-forestGreen">
                  Contests
                </h1>
                <p className="text-gray-600 text-sm mt-0.5 truncate">
                  {template_title
                    ? `For "${template_title}"`
                    : "Individual Contests"}
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex border items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Action Buttons Row - Smaller size */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllFilters(!showAllFilters)}
                className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors flex-1 justify-center text-sm"
              >
                <Filter size={16} />
                <span className="font-medium">Filters</span>
              </button>

              <PermissionWrapper section="Contest" action="create">
                <button
                  onClick={handleAddContest}
                  className=" bg-leafGreen   text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </PermissionWrapper>
            </div>
          </div>

          {/* Filters Section */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showAllFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="status">By Status</option>
                    <option value="participants">By Participants</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="ended">Ended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode
            </label>
            <select
              value={filters.mode}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, mode: e.target.value }))
              }
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
            >
              <option value="all">All Modes</option>
              <option value="solo">Solo</option>
              <option value="team">Team</option>
              <option value="mixed">Mixed</option>
            </select>
          </div> */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="free">Free</option>
                    <option value="points">Points</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setFilters({
                        status: "all",
                        type: "all"
                      })
                      setSortBy("newest")
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

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {paginatedContests.map((contest) => (
              <ContestCard
                key={contest.id}
                contest={contest}
                onEdit={handleEditContest}
                onDelete={() => handleDeleteContest(contest)}
                onToggleStatus={handleToggleStatus}
                onManagePrizes={handleManagePrizes}
              />
            ))}
          </div>

          {paginatedContests.length <= 0 && (
            <div className="px-4 sm:px-6 py-12 sm:py-16 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={20} className="sm:w-6 sm:h-6 text-gray-400" />
              </div>
              <div className="text-gray-500 text-base sm:text-lg font-medium mb-2">
                No Contest found
              </div>
              <p className="text-gray-400 text-sm sm:text-base">
                Try adjusting your filters or add a new Contest to start.
              </p>
            </div>
          )}

          {pagination?.totalCount > 10 && (
            <Pagination
              pagination={pagination}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              limit={itemsPerPage}
              setLimit={setItemsPerPage}
            />
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ContestForm
          template_id={id}
          contest={editingContest}
          categoriesData={categoriesData}
          onSave={handleSaveContest}
          onCancel={() => {
            setShowForm(false);
            setEditingContest(null);
          }}
        />
      )}

      {/* Prize Management Modal */}
      {showPrizeModal && (
        <PrizeManagementModal
          contest={selectedContest}
          onClose={() => {
            setShowPrizeModal(false);
            setSelectedContest(null);
          }}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, contest: null })}
        onConfirm={confirmDelete}
        contestName={deleteConfirmation.contest?.title || ""}
      />
    </div>
  );
}