import { useState, useEffect } from "react";
import AdminLoader from "../../../components/admin/AdminLoader";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Users,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowLeft,
  Upload,
  BookOpen,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useGetAllTemplatesQuery,
  useToggleTemplateStatusMutation,
  useUpdateTemplateMutation,
} from "../../../services/Contest/contestTemplateAPI";
import toast from "react-hot-toast";
import { slugify } from "../../../utils/slugify";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { all } from "axios";

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, templateName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm mx-auto shadow-2xl">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} className="text-red-600 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Delete Template
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
              Are you sure you want to delete this template?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                "{templateName}"
              </p>
            </div>
            <p className="text-xs sm:text-sm text-red-600 mt-3 flex items-center gap-1">
              <AlertCircle size={14} className="flex-shrink-0" />
              This action cannot be undone and all associated data will be lost.
            </p>
          </div>

          {/* Actions */}
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
              <label className="text-sm font-medium text-gray-700">Templates per page:</label>
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
              className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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
              className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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
            <label className="text-sm font-medium text-gray-700">Templates per page:</label>
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
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function ContestCard({ template, onEdit, onDelete, onToggleStatus }) {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeColor = () => {
    return "bg-leafGreen";
  };

  const getRecurrenceText = () => {
    if (template.type === "on-demand") return "On-demand";
    if (!template.recurrence_pattern) return "Recurring";

    const interval = template.recurrence_interval || 1;
    const pattern = template.recurrence_pattern;

    if (interval === 1) {
      return `${pattern.charAt(0).toUpperCase() + pattern.slice(1)}`;
    }
    return `Every ${interval} ${pattern}s`;
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on action buttons
    if (e.target.closest(".action-buttons")) {
      return;
    }

    navigate(`/admin/dashboard/contests/templates/${slugify(template.title)}`, {
      state: { id: template.id, template_title: template.title },
    });
  };

  return (
    <motion.div
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      }}
      className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100 transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header with Type and Status */}
      <div className={`${getTypeColor()} p-4 relative`}>
        {/* Background Image Overlay */}
        {template.banner_url && (
          <div className="absolute inset-0 opacity-20">
            <img
              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${template.banner_url || "/placeholder.png"
                }`}
              alt={template.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-medium text-white">
              {template.type === "recurring" ? "Recurring" : "On-demand"}
            </div>
            <div className="flex space-x-2">
              {/* Popular badge */}
              {template.total_contests > 10 && (
                <div className="bg-amber-400/90 backdrop-blur-md rounded-lg px-3 py-1 text-xs font-medium text-white">
                  Popular
                </div>
              )}
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mt-2 line-clamp-2 min-h-[3.5rem]">
            {template.title}
          </h3>

          <div className="flex items-center space-x-2 mt-3">
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-1.5">
              <Clock size={16} className="text-white" />
            </div>
            <span className="text-white text-sm">{getRecurrenceText()}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p
          className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[42px] cursor-help"
          title={template?.description || "No description provided"}
        >
          {template?.description || "No description provided"}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar size={16} className="mr-1" />
            <span>{formatDate(template.created_at)}</span>
          </div>
          {template.total_contests !== undefined && (
            <div className="flex items-center text-gray-500 text-sm">
              <Users size={16} className="mr-1" />
              <span>{template.total_contests} contests</span>
            </div>
          )}
          {template.created_by_name && (
            <div className="flex items-center text-gray-500 text-sm col-span-2">
              <Users size={16} className="mr-1" />
              <span>by {template.created_by_name}</span>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${template.is_active ? "bg-green-500" : "bg-gray-400"
                }`}
            ></div>
            <span className="text-sm text-gray-600">
              {template.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <PermissionWrapper section="Contest Template" action="toggle">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(template.id);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2 ${template.is_active ? "bg-green-600" : "bg-gray-200"
                } action-buttons`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${template.is_active ? "translate-x-6" : "translate-x-1"
                  }`}
              />
            </button>
          </PermissionWrapper>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 action-buttons">
          <PermissionWrapper section="Contest Template" action="edit">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(template);
              }}
              className="flex-1 py-2 px-3 bg-leafGreen   text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Edit2 size={16} className="mr-1" />
              Edit
            </button>
          </PermissionWrapper>

          <PermissionWrapper section="Contest Template" action="delete">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(template.id);
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

function ContestForm({ isOpen, onClose, onSubmit, editTemplate }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "on-demand",
    recurrence_pattern: "week",
    recurrence_interval: null,
    banner_url: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (editTemplate) {
      // ensure defaults so we don't get undefined
      setFormData({
        title: editTemplate.title ?? "",
        description: editTemplate.description ?? "",
        type: editTemplate.type ?? "on-demand",
        recurrence_pattern: editTemplate.recurrence_pattern ?? "week",
        recurrence_interval:
          typeof editTemplate.recurrence_interval === "number"
            ? editTemplate.recurrence_interval
            : null,
        banner_url: editTemplate.banner_url ?? "",
      });
      setSelectedFile(null);
    } else {
      setFormData({
        title: "",
        description: "",
        type: "on-demand",
        recurrence_pattern: "week",
        recurrence_interval: null,
        banner_url: "",
      });
      setSelectedFile(null);
    }
  }, [editTemplate, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number.parseInt(value) || 1 : value,
    }));
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({ ...prev, banner_url: e.target?.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      if (key !== "banner_url") {
        fd.append(key, String(value));
      }
    });

    if (selectedFile) {
      fd.append("templateBanner", selectedFile);
    }

    onSubmit({ template: fd, template_id: editTemplate?.id });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {editTemplate ? "Edit Contest Template" : "Add Contest Template"}
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
          id="contestTemplateForm"
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Title and Template Type */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                placeholder="Enter template title"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
              >
                <option value="on-demand">On-demand</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none text-sm sm:text-base"
              placeholder="Enter template description"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Banner + Recurrence Section */}
          {formData.type === "recurring" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Banner Image */}
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
                    document.getElementById("template-banner-upload")?.click()
                  }
                >
                  <input
                    id="template-banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                    className="hidden"
                  />
                  {formData.banner_url ? (
                    <div className="relative w-full h-full">
                      <img
                        src={
                          selectedFile instanceof File
                            ? URL.createObjectURL(selectedFile)
                            : `${import.meta?.env?.VITE_BACKEND_MEDIA_URL ?? ""
                            }${formData.banner_url || "/placeholder.png"}`
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

              {/* Recurrence Options */}
              <div className="space-y-4 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recurrence Pattern
                  </label>
                  <select
                    name="recurrence_pattern"
                    value={formData.recurrence_pattern}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recurrence Interval *
                  </label>
                  <input
                    type="number"
                    name="recurrence_interval"
                    value={formData.recurrence_interval ?? ""}
                    onChange={handleChange}
                    min={1}
                    max={365}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                    placeholder="e.g., 1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of {formData.recurrence_pattern}s between contests
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* On-demand Banner Only */
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
                  document.getElementById("template-banner-upload")?.click()
                }
              >
                <input
                  id="template-banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  className="hidden"
                />
                {formData.banner_url ? (
                  <div className="relative w-full h-full">
                    <img
                      src={
                        selectedFile instanceof File
                          ? URL.createObjectURL(selectedFile)
                          : `${import.meta?.env?.VITE_BACKEND_MEDIA_URL ?? ""
                          }${formData.banner_url || "/placeholder.png"}`
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
          )}
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
            form="contestTemplateForm"
            className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editTemplate ? "Update " : "Create "} <span className="hidden sm:inline">Template</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContestTemplatesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    template: null,
  });
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
  });

  const isAnyFilterApplied = () => {
    return filters.status !== "all" || filters.type !== "all";
  }

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();

  const {
    data: contestTemplatesData,
    isLoading,
    refetch,
  } = useGetAllTemplatesQuery({ limit: itemsPerPage, offset: itemsPerPage !== "all" ? itemsPerPage * (currentPage - 1) : 0, status: filters.status, type: filters.type });

  const [createTemplate] = useCreateTemplateMutation();
  const [updateTemplate] = useUpdateTemplateMutation();
  const [toggleStatus] = useToggleTemplateStatusMutation();
  const [deleteTemplate] = useDeleteTemplateMutation();

  useEffect(() => {
    if (contestTemplatesData?.data?.length == 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [contestTemplatesData?.data]);

  const handleEditTemplate = (template) => {
    setEditTemplate(template);
    setIsFormOpen(true);
  };

  const handleDeleteTemplate = (template) => {
    setDeleteConfirmation({ isOpen: true, template });
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirmation.template) {
        await deleteTemplate(deleteConfirmation.template.id).unwrap();
        toast.success("Template deleted successfully!");
        refetch();
        setDeleteConfirmation({ isOpen: false, template: null });
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(error?.data?.message || error?.data?.error || "Error deleting template!");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleStatus(id).unwrap();
      toast.success("Template status updated!");
      refetch();
    } catch (error) {
      console.error("Error while toggle template status:", error);
      toast.error(error?.data?.message || error?.data?.error || "Error while toggle template status!");
    }
  };

  const handleAddTemplate = () => {
    setEditTemplate(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editTemplate) {
        await updateTemplate({
          id: data.template_id,
          template: data.template,
        }).unwrap();
        toast.success("Template updated successfully!");
      } else {
        await createTemplate(data.template).unwrap();
        toast.success("Template created successfully!");
      }
      refetch(); // Refresh list
    } catch (error) {
      console.error("Error while saving template:", error);
      toast.error(
        error?.data?.message ||
        error?.data?.error ||
        "Something went wrong. Please try again!"
      );
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditTemplate(null);
  };

  let templates = contestTemplatesData?.data || [];

  const pagination = contestTemplatesData?.pagination || { totalPages: 1, totalCount: 1 };

  // Apply filters
  // if (filters.status !== "all") {
  //   templates = templates.filter((t) =>
  //     filters.status === "active" ? t.is_active : !t.is_active
  //   );
  // }
  // if (filters.type !== "all") {
  //   templates = templates.filter((t) => t.type === filters.type);
  // }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.type, sortBy]);

  // Pagination
  const totalPages = Math.ceil(pagination?.totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTemplates = templates

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold  text-forestGreen">
                Contest Templates
              </h1>
              <p className="text-gray-600 mt-1">
                Manage Contest Templates
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

              <PermissionWrapper section="Contest Template" action="create">
                <button
                  onClick={handleAddTemplate}
                  className=" bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                >
                  <Plus size={18} />
                  Add Template
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
                <h1 className="text-xl font-bold  text-forestGreen">
                  Templates
                </h1>
                <p className="text-gray-600 text-sm mt-0.5 truncate">
                  Manage Contest Templates
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

              <PermissionWrapper section="Contest Template" action="create">
                <button
                  onClick={handleAddTemplate}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
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
                    <option value="on-demand">On-demand</option>
                    <option value="recurring">Recurring</option>
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
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <AdminLoader message="Loading templates..." />
        ) : paginatedTemplates?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paginatedTemplates.map((template) => (
                <ContestCard
                  key={template.id}
                  template={template}
                  onEdit={handleEditTemplate}
                  onDelete={() => handleDeleteTemplate(template)}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>

            {pagination?.totalCount > 10 && (
              <Pagination
                pagination={pagination}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                limit={itemsPerPage}
                setLimit={setItemsPerPage}
              />
            )}
          </>
        ) : (
          <div className="px-4 sm:px-6 py-12 sm:py-16 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={20} className="sm:w-6 sm:h-6 text-gray-400" />
            </div>
            <div className="text-gray-500 text-base sm:text-lg font-medium mb-2">
              No templates found
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              Try adjusting your filters or add a new template.
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ContestForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editTemplate={editTemplate}
      />

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, template: null })}
        onConfirm={confirmDelete}
        templateName={deleteConfirmation.template?.title || ""}
      />
    </div>
  );
}