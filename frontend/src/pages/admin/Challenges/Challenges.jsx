import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdminLoader from "../../../components/admin/AdminLoader";
import toast from "react-hot-toast";
import {
  Award,
  Calendar,
  Code,
  Edit2,
  Trash2,
  Plus,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Users,
  Clock,
  CheckCircle2,
  MoreVertical,
  ChevronLeft,
  Upload,
} from "lucide-react";
import {
  useGetAllChallengesQuery,
  useGetChallengeByIdQuery,
  useUpdateChallengeMutation,
  useCreateChallengeMutation,
  useDeleteChallengeMutation,
  useToggleChallengeStatusMutation,
} from "../../../services/Challenge/chllengeAPI";
import { useGetAllChallengeCategoriesQuery } from "../../../services/Masters/challengeCategoryApi";
import { getAdminToken } from "../../../services/CookieService";
import PermissionWrapper from "../../../context/PermissionWrapper";

// Pagination Component
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
              <label className="text-sm font-medium text-gray-700">Challenges per page:</label>
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
            <label className="text-sm font-medium text-gray-700">Challenges per page:</label>
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
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                  : "text-gray-500 bg-white border border-gray-300 hover:bg-lightGreen/20"
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

// Delete Confirmation Modal Component - Mobile Optimized
function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  challengeName,
}) {
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
                Delete Challenge
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
              Are you sure you want to delete this challenge?
            </p>
            <div className="bg-lightGreen/10 p-3 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                "{challengeName}"
              </p>
            </div>
            <p className="text-xs sm:text-sm text-red-600 mt-3">
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

// Challenge Card Component - Mobile Optimized
function ChallengeCard({
  challenge,
  onEdit,
  onDelete,
  onToggleStatus,
  onManageQuestions,
}) {
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getDifficultyColor = (level) => {
    switch (level) {
      case "Beginner":
        return "bg-leafGreen";
      case "Intermediate":
        return "bg-leafGreen";
      case "Advanced":
        return "bg-leafGreen";
      default:
        return "bg-leafGreen";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCardClick = (challenge) => {
    onManageQuestions?.(challenge.id);
  };

  return (
    <motion.div
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      }}
      className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100 transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={() => handleCardClick(challenge)}
    >
      {/* Header with Difficulty */}
      <div
        className={`${getDifficultyColor(
          challenge.difficulty_level
        )} p-4 relative`}
      >
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-20">
          <img
            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${challenge.image_url || "/placeholder.png"}`}
            alt={challenge.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-medium text-white">
              {challenge.difficulty_level}
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
                  <PermissionWrapper section="Daily Challenge" action="toggle">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                      Quick Actions
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileMenu(false);
                        onToggleStatus?.(challenge.id);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      {challenge.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Daily Challenge" action="edit">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileMenu(false);
                        onEdit?.(challenge);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Daily Challenge" action="delete">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMobileMenu(false);
                        onDelete?.(challenge);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </PermissionWrapper>
                </div>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mt-2 line-clamp-2 min-h-[3.5rem]">
            {challenge.title}
          </h3>

          <div className="flex items-center space-x-2 mt-2">
            <span className="text-white text-sm">
              {challenge.category_name || "General"}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[42px]">
            {challenge.description || "No description provided"}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {challenge.points_reward > 0 && (
              <div className="flex items-center text-gray-500 text-xs">
                <Award size={14} className="mr-1 flex-shrink-0" />
                <span className="truncate">{challenge.points_reward || 0} points</span>
              </div>
            )}
            {challenge.per_question_reward > 0 && (
              <div className="flex items-center text-gray-500 text-xs">
                <Award size={14} className="mr-1 flex-shrink-0" />
                <span className="truncate">{challenge.per_question_reward} pts/q</span>
              </div>
            )}
            <div className="flex items-center text-gray-500 text-xs">
              <Calendar size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{formatDate(challenge.start_date)}</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <CheckCircle2 size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{challenge.qualify_percentage}% qualify</span>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <Clock size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate">{challenge.max_attempt} attempts</span>
            </div>
          </div>
        </div>

        {/* Status indicator and Toggle - Hidden on mobile, shown in menu */}
        <div className="hidden sm:flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${challenge.is_active ? "bg-green-500" : "bg-gray-400"
                }`}
            ></div>
            <span className="text-sm text-gray-600">
              {challenge.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <PermissionWrapper section="Daily Challenge" action="toggle">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(challenge.id);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2 ${challenge.is_active ? "bg-green-600" : "bg-gray-200"
                } action-buttons`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${challenge.is_active ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
          </PermissionWrapper>
        </div>

        {/* Action Buttons - Hidden on mobile, shown in menu */}
        <div className="hidden sm:flex space-x-2 action-buttons">
          <PermissionWrapper section="Daily Challenge" action="edit">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(challenge);
              }}
              className="flex-1 py-2 px-3 bg-leafGreen hover:bg-leafGreen/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Edit2 size={16} className="mr-1" />
              Edit
            </button>
          </PermissionWrapper>

          <PermissionWrapper section="Daily Challenge" action="delete">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(challenge);
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

// Challenge Form Component - Mobile Optimized
function ChallengeForm({
  isOpen,
  onClose,
  onSubmit,
  editChallenge,
  categoriesData,
  isLoading,
}) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    image_url: null,
    difficulty_level: "Beginner",
    qualify_percentage: 70,
    time_limit: 0,
    max_attempt: 3,
    per_question_reward: 0,
    points_reward: 0,
    start_date: new Date().toISOString().split("T")[0],
    is_per_question_reward: false,
    show_answer: true,
    is_warning: false,
    no_of_warning: 0,
  });

  useEffect(() => {
    if (editChallenge) {
      setFormData({
        id: editChallenge.id,
        title: editChallenge.title || "",
        description: editChallenge.description || "",
        category: editChallenge.category
          ? editChallenge.category.toString()
          : "",
        image_url: editChallenge.image_url || "",
        difficulty_level: editChallenge.difficulty_level || "Beginner",
        points_reward: editChallenge.points_reward || 0,
        qualify_percentage: editChallenge.qualify_percentage || 70,
        max_attempt: editChallenge.max_attempt || 3,
        per_question_reward: editChallenge.per_question_reward || 0,
        start_date: editChallenge.start_date
          ? convertUTCToIST(editChallenge.start_date).split("T")[0]
          : new Date().toISOString().split("T")[0],
        time_limit: editChallenge.time_limit || 0,
        is_per_question_reward:
          editChallenge.is_per_question_reward == 1 || false,
        show_answer:
          editChallenge.show_answer !== undefined
            ? editChallenge.show_answer == 1
            : true,
        is_warning: editChallenge.is_warning !== undefined
          ? editChallenge.is_warning == 1
          : false,
        no_of_warning: editChallenge.no_of_warning || 0
      });

      // Set image preview if image_url exists
      if (editChallenge.image_url) {
        setImagePreview(`${import.meta.env.VITE_BACKEND_MEDIA_URL}${editChallenge.image_url || "/placeholder.png"}`);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        category: categoriesData?.[0]?.id.toString() || "",
        image_url: null,
        difficulty_level: "Beginner",
        qualify_percentage: 70,
        time_limit: 0,
        max_attempt: 3,
        per_question_reward: 0,
        points_reward: 0,
        start_date: new Date().toISOString().split("T")[0],
        is_per_question_reward: false,
        show_answer: true,
        is_warning: false,
        no_of_warning: 0,
      });

      setImageFile(null);
      setImagePreview("");
    }
  }, [editChallenge, categoriesData, isOpen]);

  function convertUTCToIST(utcDateTimeStr) {
    const utcDate = new Date(utcDateTimeStr);

    // IST offset in milliseconds (UTC +5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;

    const istDate = new Date(utcDate.getTime() + istOffsetMs);

    return istDate.toISOString(); // returns "YYYY-MM-DDTHH:mm:ss.sssZ"
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // function to handle file change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, editChallenge?.id, imageFile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {editChallenge ? "Edit Challenge" : "Add Challenge"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <form
          onSubmit={handleSubmit}
          id="dailyChallengeForm"
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Challenge Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                placeholder="Enter challenge title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none text-sm sm:text-base"
                placeholder="Enter challenge description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">Select a category</option>
                  {categoriesData
                    ?.filter((cat) => cat.is_active)
                    .map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.category}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level *
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualify Percentage *
                </label>
                <input
                  type="number"
                  name="qualify_percentage"
                  value={formData.qualify_percentage}
                  onChange={handleChange}
                  min="35"
                  max="100"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Attempts *
                </label>
                <input
                  type="number"
                  name="max_attempt"
                  value={formData.max_attempt}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.is_per_question_reward ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Per Question Reward
                  </label>
                  <input
                    type="number"
                    name="per_question_reward"
                    value={formData.per_question_reward}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Reward *
                  </label>
                  <input
                    type="number"
                    name="points_reward"
                    value={formData.points_reward}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  {...(!editChallenge && { min: new Date().toISOString().split("T")[0] })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                name="time_limit"
                min={0}
                value={formData.time_limit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3 mt-1">
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  id="is_per_question_reward"
                  name="is_per_question_reward"
                  checked={formData.is_per_question_reward}
                  onChange={handleChange}
                  className="h-4 w-4 accent-leafGreen text-purple-600 focus:ring-leafGreen border-gray-300 rounded"
                />
                <label
                  htmlFor="is_per_question_reward"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Enable per question reward system
                </label>
              </div>

              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  id="show_answer"
                  name="show_answer"
                  checked={formData.show_answer}
                  onChange={handleChange}
                  className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded"
                />
                <label
                  htmlFor="show_answer"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Show answers after completing the challenge
                </label>
              </div>

              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  id="is_warning"
                  name="is_warning"
                  checked={formData.is_warning}
                  onChange={handleChange}
                  className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded"
                />
                <label
                  htmlFor="is_warning"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Restrict Full Screen Exit
                </label>
              </div>

              {Boolean(formData.is_warning) && <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number Of Warning
                </label>
                <input
                  type="number"
                  name="no_of_warning"
                  min={0}
                  value={formData.no_of_warning}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                />
              </div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challenge Image
              </label>
              <div
                className={`relative w-full h-32 sm:h-36 border-2 border-dashed rounded-lg transition-colors cursor-pointer border-gray-300 hover:border-leafGreen`}
                onClick={() =>
                  document.getElementById("image-upload").click()
                }
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreview}
                      alt="Image preview"
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
          </div>
        </form>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="dailyChallengeForm"
            disabled={isLoading}
            className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Saving..."
              : (editChallenge ? "Update" : "Create")}
            <span className="hidden sm:inline"> Challenge</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DailyChallengesPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editChallenge, setEditChallenge] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    challenge: null,
  });
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    difficulty: "all",
    status: "all",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const startIndex = (currentPage - 1) * itemsPerPage;

  // RTK Query hooks
  const {
    data: challengesData,
    isLoading,
    refetch,
  } = useGetAllChallengesQuery({
    search_term: searchQuery,
    category: filters.category,
    difficulty: filters.difficulty,
    status: filters.status,
    limit: itemsPerPage,
    offset: startIndex,
  });

  const [createChallenge, { isLoading: isCreating }] =
    useCreateChallengeMutation();
  const [updateChallenge, { isLoading: isUpdating }] =
    useUpdateChallengeMutation();
  const [deleteChallenge, { isLoading: isDeleting }] =
    useDeleteChallengeMutation();
  const [toggleChallengeStatus] = useToggleChallengeStatusMutation();

  // Get access token for category API
  const { access_token } = getAdminToken();
  const tokenString =
    typeof access_token === "string"
      ? access_token
      : access_token?.access_token || "";

  // Fetch challenge categories
  const { data: categoriesData, isLoading: loadingCategories } =
    useGetAllChallengeCategoriesQuery({
      access_token: tokenString,
    });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters.category, filters.difficulty, filters.status]);

  useEffect(() => {
    if (challengesData?.challenges?.length == 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [challengesData?.challenges]);

  // // Filter challenges
  // const filteredChallenges = React.useMemo(() => {
  //   if (!challengesData?.challenges) return [];

  //   return challengesData.challenges.filter((challenge) => {
  //     const categoryMatch =
  //       filters.category === "all" || challenge.category_id == filters.category;
  //     const difficultyMatch =
  //       filters.difficulty === "all" ||
  //       challenge.difficulty_level === filters.difficulty;
  //     const statusMatch =
  //       filters.status === "all" ||
  //       (filters.status === "active" && challenge.is_active) ||
  //       (filters.status === "inactive" && !challenge.is_active);
  //     const searchMatch = challenge.title
  //       .toLowerCase()
  //       .includes(searchQuery.toLowerCase());

  //     return categoryMatch && difficultyMatch && statusMatch && searchMatch;
  //   });
  // }, [challengesData, filters, searchQuery]);

  // // Pagination calculations
  // const totalPages = Math.ceil(filteredChallenges.length / itemsPerPage);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  // const paginatedChallenges = filteredChallenges.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(challengesData?.totalCount / itemsPerPage);
  const paginatedChallenges = challengesData?.challenges || [];


  const handleEditChallenge = (challenge) => {
    setEditChallenge(challenge);
    setIsFormOpen(true);
  };

  const handleDeleteChallenge = (challenge) => {
    setDeleteConfirmation({ isOpen: true, challenge });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.challenge) {
      try {
        await deleteChallenge(deleteConfirmation.challenge.id).unwrap();
        toast.success("Challenge deleted successfully!");
        refetch();
        setDeleteConfirmation({ isOpen: false, challenge: null });
      } catch (error) {
        toast.error(error?.data?.message || error?.data?.error || "Failed to delete challenge");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleChallengeStatus(id).unwrap();
      toast.success("Challenge status updated!");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || error?.data?.error || "Failed to update status");
    }
  };

  const handleAddChallenge = () => {
    setEditChallenge(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData, challengeId, imageFile) => {
    try {
      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();

      // Append all text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', parseInt(formData.category));
      formDataToSend.append('difficulty_level', formData.difficulty_level);
      formDataToSend.append('qualify_percentage', parseInt(formData.qualify_percentage));
      formDataToSend.append('max_attempt', parseInt(formData.max_attempt));
      formDataToSend.append('per_question_reward', parseInt(formData.per_question_reward) || 0);
      formDataToSend.append('points_reward', parseInt(formData.points_reward));
      formDataToSend.append('start_date', formData.start_date);
      formDataToSend.append('is_per_question_reward', formData.is_per_question_reward);
      formDataToSend.append('show_answer', formData.show_answer);
      formDataToSend.append('is_warning', formData.is_warning);
      formDataToSend.append('no_of_warning', formData.no_of_warning);
      if (formData.time_limit > 0) {
        formDataToSend.append('time_limit', formData.time_limit);
      }

      // Append image file if exists
      if (imageFile) {
        formDataToSend.append('dailyChallengeImage', imageFile);
      }

      // If editing and no new image, you might need to send the existing image URL
      if (challengeId && !imageFile && formData.image_url) {
        formDataToSend.append('image_url', formData.image_url);
      }

      if (!formData.points_reward && !formData.per_question_reward) {
        toast.error("Please set either points reward or per question reward.");
        return;
      }

      if (challengeId) {
        await updateChallenge({ id: challengeId, data: formDataToSend }).unwrap();
        toast.success("Challenge updated successfully!");
      } else {
        await createChallenge(formDataToSend).unwrap();
        toast.success("Challenge created successfully!");
      }

      setIsFormOpen(false);
      setEditChallenge(null);
      refetch();
    } catch (error) {
      toast.error(
        error?.data?.message || error?.data?.error || "Something went wrong. Please try again!"
      );
    }
  };

  const handleManageQuestions = (id) => {
    navigate(`/admin/dashboard/challenges/daily-challenge/questions`, {
      state: { id },
    });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditChallenge(null);
  };

  const isAnyFilterApplied = () => {
    return (
      filters.category !== "all" ||
      filters.difficulty !== "all" ||
      filters.status !== "all" ||
      searchQuery !== ""
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-forestGreen">
                Daily Challenges
              </h1>
              <p className="text-gray-600 mt-1">
                Manage Daily Challenges
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

              <PermissionWrapper section="Daily Challenge" action="create">
                <button
                  onClick={handleAddChallenge}
                  className="bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                >
                  <Plus size={18} />
                  Add Challenge
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
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold text-forestGreen">
                  Daily Challenges
                </h1>
                <p className="text-gray-600 text-sm mt-0.5 truncate">
                  Manage Daily Challenges
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

              <PermissionWrapper section="Daily Challenge" action="create">
                <button
                  onClick={handleAddChallenge}
                  className="bg-leafGreen   text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search challenges..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg 
                  placeholder-gray-400 focus:outline-none focus:ring-2 
                  focus:ring-leafGreen focus:border-transparent transition duration-150 ease-in-out"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categoriesData
                      ?.filter((cat) => cat.is_active)
                      .map((category) => (
                        <option
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.category}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        difficulty: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>

              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setFilters({
                        category: "all",
                        difficulty: "all",
                        status: "all",
                      })
                      setSearchQuery("")
                    }}
                    className="text-sm text-leafGreen hover:text-leafGreen/80 font-medium"
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
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <AdminLoader fullScreen={false} message="Loading challenges..." />
        ) : paginatedChallenges.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paginatedChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onEdit={handleEditChallenge}
                  onDelete={handleDeleteChallenge}
                  onToggleStatus={handleToggleStatus}
                  onManageQuestions={handleManageQuestions}
                />
              ))}
            </div>
            {challengesData?.totalCount > 10 && (
              <Pagination
                pagination={{ totalCount: challengesData?.totalCount || 0, totalPages: totalPages }}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                limit={itemsPerPage}
                setLimit={setItemsPerPage}
              />
            )}
          </>
        ) : (
          isAnyFilterApplied() ?
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-4">
                <Award size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Challenges Found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters to see more results.
              </p>
              <button
                onClick={() => {
                  setFilters({
                    category: "all",
                    difficulty: "all",
                    status: "all",
                  })
                  setSearchQuery("")
                }}
                className="bg-leafGreen hover:bg-leafGreen/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm mx-auto"
              >
                Clear Filter
              </button>
            </div>
            :
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 mb-4">
                <Award size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Challenges Found
              </h3>
              <p className="text-gray-600 mb-6">
                {challengesData?.totalCount > 0
                  ? "Try adjusting your filters to see more results."
                  : "Get started by creating your first challenge."}
              </p>
              <PermissionWrapper section="Daily Challenge" action="create">
                <button
                  onClick={handleAddChallenge}
                  className="bg-leafGreen hover:bg-leafGreen/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm mx-auto"
                >
                  <Plus size={18} />
                  Create Challenge
                </button>
              </PermissionWrapper>
            </div>
        )}
      </div>

      {/* Form Modal */}
      <ChallengeForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editChallenge={editChallenge}
        categoriesData={categoriesData}
        isLoading={isCreating || isUpdating}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({ isOpen: false, challenge: null })
        }
        onConfirm={confirmDelete}
        challengeName={deleteConfirmation.challenge?.title || ""}
      />
    </div>
  );
}