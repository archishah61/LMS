/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateCheatSheetMutation,
  useGetCheatSheetsQuery,
  useUpdateCheatSheetMutation,
  useDeleteCheatSheetMutation,
  useUpdateCheatSheetSectionStatusMutation,
} from "../../../services/CheatSheet/cheatSheetApi";
import { getAdminToken } from "../../../services/CookieService";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  X,
  Eye,
  Edit,
  Trash2,
  Database,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLoader from "../AdminLoader";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { slugify } from "../../../utils/slugify";
import { Filter } from "lucide-react";
import { useGetPartnersQuery } from "../../../services/Become_partner/becomePartnerApi";

// Move EditModal outside the main component
const EditModal = ({
  isOpen,
  onClose,
  editFormData,
  setEditFormData,
  handleEditSubmit,
  handleEditChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-4 shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Cheat Sheet
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <form
            onSubmit={handleEditSubmit}
            id="editCheatSeetForm"
            className="space-y-3"
          >
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={editFormData.title}
                onChange={handleEditChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-leafGreen focus:outline-none transition duration-300"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-leafGreen focus:outline-none transition duration-300"
                required
                rows={4}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isPaid"
                    value="free"
                    checked={!editFormData.isPaid}
                    onChange={() =>
                      setEditFormData((prev) => ({ ...prev, isPaid: false }))
                    }
                    className="mr-2 accent-leafGreen"
                  />
                  Free
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isPaid"
                    value="paid"
                    checked={editFormData.isPaid}
                    onChange={() =>
                      setEditFormData((prev) => ({ ...prev, isPaid: true }))
                    }
                    className="mr-2 accent-leafGreen"
                  />
                  Paid
                </label>
              </div>
            </div>
            {!!editFormData.isPaid && (
              <div className="flex space-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-gray-700 mb-2">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-leafGreen focus:outline-none transition duration-300"
                    required={editFormData.isPaid}
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-700 mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={editFormData.discount}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-leafGreen focus:outline-none transition duration-300"
                    max="100"
                  />
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Image</label>
              <input
                type="file"
                name="imageUrl"
                onChange={handleEditChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-leafGreen focus:outline-none transition duration-300"
                accept="image/*"
              />
              {editFormData.imageUrl ? (
                <div className="mt-2">
                  {typeof editFormData.imageUrl === "string" ? (
                    <img
                      src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${editFormData.imageUrl || '/placeholder.png'}`}
                      alt="Current cheat sheet"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <p className="text-gray-600">
                      Selected file: {editFormData.imageUrl.name}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No file chosen</p>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="editCheatSeetForm"
            className="px-4 py-2 bg-leafGreen text-white rounded-lg   transition duration-300"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Delete Cheat Sheet</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Are you sure you want to delete this cheatsheet? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Rename EditModal to CheatSheetModal and make it reusable
const CheatSheetModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  handleChange,
  isEditing = false, // Add this prop to distinguish between create/edit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-xl w-full max-w-xs sm:max-w-2xl mx-2 sm:mx-auto shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh]">
        {/* Header - Compact for Mobile */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl sm:rounded-t-xl">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Cheat Sheet" : "Create Cheat Sheet"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content - Compact for Mobile */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 sm:py-3">
          <form
            onSubmit={handleSubmit}
            id="cheatSheetForm"
            className="space-y-2 sm:space-y-3"
          >
            {/* Title */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen focus:outline-none transition duration-300"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen focus:outline-none transition duration-300"
                required
                rows={3}
              />
            </div>

            {/* Type */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">Type *</label>
              <div className="flex space-x-3 sm:space-x-4">
                <label className="flex items-center text-sm sm:text-base">
                  <input
                    type="radio"
                    name="isPaid"
                    value="free"
                    checked={!formData.isPaid}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, isPaid: false }))
                    }
                    className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4 accent-leafGreen text-forestGreen border-gray-300 focus:ring-leafGreen"
                  />
                  Free
                </label>
                <label className="flex items-center text-sm sm:text-base">
                  <input
                    type="radio"
                    name="isPaid"
                    value="paid"
                    checked={formData.isPaid}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, isPaid: true }))
                    }
                    className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4 accent-leafGreen text-forestGreen border-gray-300 focus:ring-leafGreen"
                  />
                  Paid
                </label>
              </div>
            </div>

            {/* Price & Discount - Stack on mobile */}
            {Boolean(formData.isPaid) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <label className="block text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min={"1"}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen focus:outline-none transition duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                    min={"0"}
                    className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen focus:outline-none transition duration-300"
                    max="100"
                  />
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">Image</label>
              <input
                type="file"
                name="imageUrl"
                onChange={handleChange}
                className="w-full px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-leafGreen focus:outline-none transition duration-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                accept="image/*"
              />
              {formData.imageUrl && (
                <div className="mt-2">
                  {typeof formData.imageUrl === "string" ? (
                    // Existing image from backend
                    <img
                      src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${formData.imageUrl || '/placeholder.png'
                        }`}
                      alt="Current cheat sheet"
                      className="w-full h-32 sm:h-64 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    // Newly selected file - show preview
                    <div className="space-y-1 sm:space-y-2">
                      <img
                        src={URL.createObjectURL(formData.imageUrl)}
                        alt="Preview of selected file"
                        className="w-full h-32 sm:h-64 object-cover rounded-lg border border-gray-300"
                        onLoad={(e) => URL.revokeObjectURL(e.target.src)} // Clean up memory
                      />
                      <p className="text-xs text-gray-500 text-center">
                        Click the input above to choose a different image
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer - Compact for Mobile */}
        <div className="flex justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-200 bg-white sticky bottom-0 rounded-b-xl sm:rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-300 border border-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="cheatSheetForm"
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-leafGreen text-white rounded-lg   transition duration-300 border border-leafGreen"
          >
            {isEditing ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

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
              <label className="text-sm font-medium text-gray-700">Cheatsheets per page:</label>
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
            <label className="text-sm font-medium text-gray-700">Cheatsheets per page:</label>
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
                  ? "bg-indigo-600 text-white"
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

export default function CheatSheet() {
  const { access_token } = getAdminToken();
  const { id } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [isPaid, setIsPaid] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [selectedPartnerId, setSelectedPartnerId] = useState("all");
  const [isActive, setIsActive] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: null,
    description: "",
    price: "",
    discount: 0,
  });

  const [createFormData, setCreateFormData] = useState({
    title: "",
    description: "",
    isPaid: false,
    isActive: true,
    price: 0,
    discount: 0,
    imageUrl: null,
  });

  const [selectedCheatSheet, setSelectedCheatSheet] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    isPaid: false,
    isActive: true,
    price: 0,
    discount: 0,
    imageUrl: null,
  });
  const [cheatSheets, setCheatSheets] = useState([]);
  const [sortColumn, setSortColumn] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [createCheatSheet] = useCreateCheatSheetMutation();
  const [deleteCheatSheet, { isLoading: isDeleting }] = useDeleteCheatSheetMutation();
  const [updateCheatSheet] = useUpdateCheatSheetMutation();
  const [updateCheatSheetStatus] = useUpdateCheatSheetSectionStatusMutation();
  const { data, isLoading, isError, refetch } = useGetCheatSheetsQuery(
    {
      createdBy: creatorFilter,
      createdById: selectedPartnerId,
      search_term: searchQuery,
      limit: itemsPerPage,
      offset: itemsPerPage !== "all" ? itemsPerPage * (currentPage - 1) : 0,
      access_token
    });

  const totalCheatsheet = data?.totalCount;
  const totalPages = Math.ceil(data?.totalCount / itemsPerPage)
  const [showFilters, setShowFilters] = useState(false);
  const [createdByType, setCreatedByType] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("");
  const { data: partnersData } = useGetPartnersQuery({ limit: 'all', access_token });
  const { role } = useSelector((state) => state.user);
  const [showFilter, setShowFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [cheatSheetToDelete, setCheatSheetToDelete] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0);

    if (data?.cheatsheets) {
      setCheatSheets(data?.cheatsheets);
    }
  }, [data?.cheatsheets]);

  const handleViewCheatSheet = (sheet) => {
    setSelectedCheatSheet(sheet);
    setIsViewModalOpen(true);
  };

  const handleNavigateToCheatSheetData = (cheatSheet) => {
    navigate(`/admin/dashboard/cheat-sheets/${slugify(cheatSheet.title)}/data`, {
      state: { cheatsheetId: cheatSheet.id },
    });
  };

  const isAnyFilterApplied = () => {
    return (
      dateFrom !== "" ||
      dateTo !== "" ||
      creatorFilter !== "all" ||
      selectedPartnerId !== "all" ||
      searchQuery !== ""
    );
  };

  const handleEditCheatSheet = (sheet) => {
    setSelectedCheatSheet(sheet);
    setEditFormData({
      title: sheet.title,
      description: sheet.description,
      isPaid: sheet.isPaid,
      isActive: sheet.isActive,
      price: sheet.price || 0,
      discount: sheet.discount || 0,
      imageUrl: sheet.imageUrl || null, // Ensure imageUrl is set correctly
    });

    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, files, type } = e.target;

    if (type === "file" && files && files.length > 0) {
      // If the input is a file input and files are selected, update the state with the first file
      setEditFormData((prevData) => ({
        ...prevData,
        [name]: files[0],
      }));
    } else {
      // Handle text and number inputs
      const parsedValue =
        value === ""
          ? name === "price" || name === "discount"
            ? 0
            : value
          : name === "price" || name === "discount"
            ? parseFloat(value)
            : value;
      setEditFormData((prevData) => ({
        ...prevData,
        [name]: parsedValue,
      }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("title", editFormData.title);
    formDataToSend.append("description", editFormData.description);
    formDataToSend.append("isPaid", Boolean(editFormData.isPaid));
    formDataToSend.append("isActive", editFormData.isActive);
    formDataToSend.append("createdBy", id);
    formDataToSend.append("updatedBy", id);
    formDataToSend.append("created_by_type", "admin");
    formDataToSend.append("updated_by_type", "admin");

    if (editFormData.imageUrl) {
      formDataToSend.append("imageUrl", editFormData.imageUrl);
    }

    if (editFormData.isPaid) {
      formDataToSend.append("price", editFormData.price);
      formDataToSend.append("discount", editFormData.discount);
    }

    try {
      await updateCheatSheet({
        id: selectedCheatSheet.id,
        formData: formDataToSend,
        access_token,
      }).unwrap();

      toast.success("Cheat sheet updated successfully");

      setIsEditModalOpen(false);
      refetch();
    } catch (error) {
      toast.error(error.data.message || error?.data?.error || "Failed to update cheat sheet")
      console.error("Failed to update cheat sheet:", error);
    }
  };

  const ViewModal = () => {
    if (!selectedCheatSheet) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-lg sm:text-xl font-semibold text-forestGreen">
              Cheat Sheet Details
            </h2>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-5">

              {/* Basic Info */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-forestGreen mb-3">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600">
                      Title
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCheatSheet.title}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-600">
                      Description
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCheatSheet.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Image */}
              {selectedCheatSheet.imageUrl && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-forestGreen mb-3">
                    Preview
                  </h3>

                  <img
                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${selectedCheatSheet.imageUrl}`}
                    alt={selectedCheatSheet.title}
                    className="h-auto max-w-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Status Info */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-forestGreen mb-3">
                  Status Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600">
                      Type
                    </label>
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${selectedCheatSheet.isPaid
                        ? "bg-lightGreen text-forestGreen"
                        : "bg-green-100 text-green-800"
                        }`}
                    >
                      {selectedCheatSheet.isPaid ? "Paid" : "Free"}
                    </span>
                  </div>

                </div>
              </div>

              {/* Pricing Info */}
              {Boolean(selectedCheatSheet.isPaid) && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-forestGreen mb-3">
                    Pricing Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600">
                        Price
                      </label>
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{selectedCheatSheet.price}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600">
                        Discount
                      </label>
                      <p className="text-sm font-semibold">
                        {selectedCheatSheet.discount}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
            <button
              type="button"
              onClick={() => setIsViewModalOpen(false)}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
            >
              Close
            </button>
            <button
              type="submit"
              onClick={() => {
                setIsViewModalOpen(false);
                handleEditCheatSheet(selectedCheatSheet);
              }}
              className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  const resetEditForm = () => {
    setEditFormData({
      title: "",
      description: "",
      isPaid: false,
      isActive: true,
      price: 0,
      discount: 0,
      imageUrl: null,
    });
  };

  const toggleForm = () => {
    handleOpenCreateModal();
  };

  const handleRadioChange = (event) => {
    setIsPaid(event.target.value === "paid");
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const parsedValue =
      value === "" && name === "discount" ? 0 : files ? files[0] : value;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "price" || name === "discount"
          ? parseFloat(parsedValue)
          : parsedValue,
    }));
  };

  // Handle create form submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("title", createFormData.title);
    formDataToSend.append("description", createFormData.description);
    formDataToSend.append("isPaid", createFormData.isPaid);
    formDataToSend.append("isActive", createFormData.isActive);
    formDataToSend.append("createdBy", id);
    formDataToSend.append("updatedBy", id);
    formDataToSend.append("created_by_type", "admin");
    formDataToSend.append("updated_by_type", "admin");

    if (createFormData.imageUrl) {
      formDataToSend.append("imageUrl", createFormData.imageUrl);
    }

    if (createFormData.isPaid) {
      formDataToSend.append("price", createFormData.price);
      formDataToSend.append("discount", createFormData.discount);
    }

    try {
      const res = await createCheatSheet({ cheatSheet: formDataToSend, access_token }).unwrap();

      setIsCreateModalOpen(false);
      // Reset form
      setCreateFormData({
        title: "",
        description: "",
        isPaid: false,
        isActive: true,
        price: 0,
        discount: 0,
        imageUrl: null,
      });
      refetch();
      toast.success(res.message || "Cheat sheet created successfully!");
    } catch (error) {
      console.error("Failed to create cheat sheet:", error);
      toast.error(error.data?.message || error?.data?.error || "Failed to create cheat sheet");
    }
  };

  // Handle create form changes
  const handleCreateChange = (e) => {
    const { name, value, files, type } = e.target;

    if (type === "file" && files && files.length > 0) {
      setCreateFormData((prevData) => ({
        ...prevData,
        [name]: files[0],
      }));
    } else {
      const parsedValue =
        value === ""
          ? name === "price" || name === "discount"
            ? 0
            : value
          : name === "price" || name === "discount"
            ? parseFloat(value)
            : value;
      setCreateFormData((prevData) => ({
        ...prevData,
        [name]: parsedValue,
      }));
    }
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  // Close create modal and reset form
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateFormData({
      title: "",
      description: "",
      isPaid: false,
      isActive: true,
      price: 0,
      discount: 0,
      imageUrl: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("isPaid", isPaid);
    formDataToSend.append("isActive", isActive);
    formDataToSend.append("createdBy", id);
    formDataToSend.append("updatedBy", id);
    formDataToSend.append("created_by_type", "admin");
    formDataToSend.append("updated_by_type", "admin");
    if (formData.imageUrl) {
      formDataToSend.append("imageUrl", formData.imageUrl);
    }
    if (isPaid) {
      formDataToSend.append("price", formData.price);
      formDataToSend.append("discount", formData.discount);
    }

    try {
      await createCheatSheet({ cheatSheet: formDataToSend, access_token }).unwrap();

      setFormData({
        title: "",
        imageUrl: null,
        description: "",
        price: "",
        discount: "",
      });
      setIsPaid(false);
      setIsActive(true);
      refetch();
    } catch (error) {
      toast.error(error.data?.message || error?.data?.error || "Failed to create cheat sheet");
      console.error("Failed to create cheat sheet:", error);
    }
  };

  const handleStatusToggle = async (cheatSheetId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateCheatSheetStatus({
        cheatSheetId,
        status: newStatus,
        access_token,
      }).unwrap();

      setCheatSheets(
        cheatSheets.map((sheet) =>
          sheet.id === cheatSheetId ? { ...sheet, isActive: newStatus } : sheet
        )
      );

      toast.success(
        `Cheat Sheet ${newStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Status update failed", error);
      toast.error(error.data?.message || error?.data?.error || "Failed to update cheat sheet status");
    }
  };

  const handleDeleteCheatSheet = async (cheatSheetId) => {
    try {
      await deleteCheatSheet({
        id: cheatSheetId,
        access_token,
      }).unwrap();
      refetch();
    } catch (error) {
      toast.error(error.data?.message || error?.data?.error || "Failed to delete cheat sheet");
      console.error("Failed to delete cheat sheet:", error);
    }
  };

  const filteredAndSortedCheatSheets = useMemo(() => {
    if (!cheatSheets) return [];
    let filtered = cheatSheets.filter((sheet) => {
      const matchesSearch =
        sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sheet.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCreatedByType =
        creatorFilter === "all" ||
        (creatorFilter === "admin" && sheet.created_by_type === "admin") ||
        (creatorFilter === "partner" && sheet.created_by_type === "partner");
      const matchesPartner =
        creatorFilter !== "partner" ||
        selectedPartnerId === "all" ||
        sheet.createdBy === Number.parseInt(selectedPartnerId);
      const sheetDate = new Date(sheet.created_at);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      const isWithinDateRange =
        (!fromDate || sheetDate >= fromDate) &&
        (!toDate || sheetDate <= new Date(toDate.setHours(23, 59, 59, 999)));
      return (
        matchesSearch &&
        matchesCreatedByType &&
        matchesPartner &&
        isWithinDateRange
      );
    });
    filtered.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [
    cheatSheets,
    searchQuery,
    creatorFilter,
    selectedPartnerId,
    dateFrom,
    dateTo,
    sortColumn,
    sortDirection,
  ]);

  const paginatedCheatSheets = useMemo(() => {
    return filteredAndSortedCheatSheets;
  }, [filteredAndSortedCheatSheets, currentPage, itemsPerPage]);

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleDeleteQuestion = (item) => {
    setCheatSheetToDelete(item)
    setShowDeleteModal(true)
  }

  const confirmDeleteCheatSheet = async () => {
    if (!cheatSheetToDelete?.id) return

    try {
      await deleteCheatSheet({
        id: cheatSheetToDelete?.id,
        access_token,
      }).unwrap();
      refetch();
      setShowDeleteModal(false)
      setCheatSheetToDelete(null)
      toast.success("Cheatsheet deleted successfully!")
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error(error.data?.message || error?.data?.error || "Failed to delete cheatsheet. Please try again.")
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Mobile View */}
          <div className="sm:hidden">
            {/* Top Row - Title and Back Button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1"></div> {/* Spacer for centering */}
              <div className="flex justify-center">
                <h1 className="text-xl font-bold  text-forestGreen text-center">
                  Cheat Sheet
                </h1>
              </div>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex items-center gap-1 p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeft size={14} />
                </button>
              </div>
            </div>

            {/* Bottom Row - Filter and Create buttons */}
            <div className="flex items-center gap-2">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className="flex items-center justify-center gap-1.5 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm flex-1"
              >
                <Filter size={14} />
                <span>Filters</span>
                {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {/* Create Button */}
              <PermissionWrapper section="Cheat Sheet" action="create">
                <button
                  onClick={toggleForm}
                  className=" bg-leafGreen   text-white p-2 rounded-lg flex items-center justify-center transition-colors font-medium shadow-sm h-10 w-10"
                >
                  <Plus size={16} />
                </button>
              </PermissionWrapper>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                  Cheat Sheet <span className="hidden sm:inline">Management</span>
                </h1>
                <p className="text-sm text-center md:text-start md:text-base text-gray-600 mt-1">
                  Manage <span className="hidden sm:inline">and organize your</span> cheat sheets
                </p>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="flex items-center gap-1 md:gap-2 md:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <Filter size={18} />
                  <span className="font-medium hidden md:inline">Filters</span>
                  {showFilters ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                <PermissionWrapper section="Cheat Sheet" action="create">
                  <button
                    onClick={toggleForm}
                    className=" bg-leafGreen   text-white sm:px-4 p-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add <span className="hidden lg:inline">Cheat Sheet</span></span>
                  </button>
                </PermissionWrapper>

                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex border items-center gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="hidden sm:inline">Back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section - Common for both mobile and desktop */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Cheat Sheets
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute top-3 left-3 text-gray-400"
                      size={16}
                    />
                    <input
                      type="search"
                      placeholder="Search cheat sheets..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    />
                  </div>
                </div>

                {role !== "partner" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Created By
                    </label>
                    <select
                      value={creatorFilter}
                      onChange={(e) => {
                        setCreatorFilter(e.target.value);
                        setSelectedPartnerId("all");
                        setCurrentPage(1);
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Partner
                    </label>
                    <select
                      value={selectedPartnerId}
                      onChange={(e) => {
                        setSelectedPartnerId(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    >
                      <option value="all">All Partners</option>
                      {partnersData?.partners?.map((partner) => (
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
                      setDateFrom("");
                      setDateTo("");
                      setCreatorFilter("all");
                      setSelectedPartnerId("all");
                      setSearchQuery("");
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

      <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6">
        <motion.div
          // initial={{ opacity: 0 }}
          // animate={{ opacity: 1 }}
          // transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full"
        >
          <div className="flex-1 overflow-auto">
            <div className="overflow-x-auto min-h-0 overflow-y-hidden">
              <table className="hidden md:table w-full">
                <thead className="bg-lightGreen border">
                  <tr>
                    {[
                      { key: "title", label: "Title" },
                      { key: "description", label: "Description" },
                      { key: "isPaid", label: "Type" },
                    ].map(({ key, label }) => (
                      <th
                        key={label}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      // onClick={() => key && handleSort(key)}
                      >
                        {/* <div className="flex items-center"> */}
                        {label}
                        {/* {key === sortColumn && (
                            <span className="ml-2">
                              {sortDirection === "asc" ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </span>
                          )}
                        </div> */}
                      </th>
                    ))}
                    <PermissionWrapper section="Cheat Sheet" action="toggle">
                      <th
                        key="Status"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      // eslint-disable-next-line no-constant-binary-expression
                      // onClick={() => "isActive" && handleSort("isActive")}
                      >
                        {/* <div className="flex items-center"> */}
                        Status
                        {/* {"isActive" === sortColumn && (
                            <span className="ml-2">
                              {sortDirection === "asc" ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </span>
                          )}
                        </div> */}
                      </th>
                    </PermissionWrapper>
                    <PermissionWrapper
                      section="Cheat Sheet"
                      action="view|delete|edit"
                    >
                      <th
                        key="Actions"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        <div className="flex items-center">Actions</div>
                      </th>
                    </PermissionWrapper>
                    <PermissionWrapper section="Cheat Sheet Main Section|Cheat Sheet Section">
                      <th
                        key="Data"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        <div className="flex items-center">Data</div>
                      </th>
                    </PermissionWrapper>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <AdminLoader message="Loading cheat sheets..." />
                        </td>
                      </tr>
                    ) : isError ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-red-500">
                          Error loading cheat sheets
                        </td>
                      </tr>
                    ) : paginatedCheatSheets.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          No cheat sheets found
                        </td>
                      </tr>
                    ) : (
                      paginatedCheatSheets.map((sheet, index) => (
                        <motion.tr
                          key={sheet._id}
                          // initial={{ opacity: 0, y: 20 }}
                          // animate={{ opacity: 1, y: 0 }}
                          // exit={{ opacity: 0, y: 20 }}
                          // transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="hover:bg-lightGreen/20 transition duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="grid">
                              <span className="truncate">{sheet.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 grid">
                            <div className="grid">
                              <span className="truncate">{sheet.description}</span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${sheet.isPaid
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                                }`}
                            >
                              {sheet.isPaid === 1 ? "Paid" : "Free"}
                            </span>
                          </td>
                          <PermissionWrapper
                            section="Cheat Sheet"
                            action="toggle"
                          >
                            <td className="px-4 lg:px-6 py-4">
                              <label
                                className="relative inline-flex items-center cursor-pointer"
                                onClick={(e) => e.stopPropagation()} // 👈 prevent row click
                                title={sheet.isActive ? "Deactivate" : "Activate"}
                              >
                                <input
                                  type="checkbox"
                                  checked={sheet.isActive}
                                  onChange={() =>
                                    handleStatusToggle(sheet.id, sheet.isActive)
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                              </label>
                            </td>
                          </PermissionWrapper>

                          <PermissionWrapper
                            section="Cheat Sheet"
                            action="view|edit|delete"
                          >
                            <td className="px-6 py-4 flex space-x-2">
                              <PermissionWrapper
                                section="Cheat Sheet"
                                action="view"
                              >
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="text-leafGreen hover:text-forestGreen"
                                  title="View Details"
                                  onClick={() => handleViewCheatSheet(sheet)}
                                >
                                  <Eye size={20} />
                                </motion.button>
                              </PermissionWrapper>
                              <PermissionWrapper
                                section="Cheat Sheet"
                                action="edit"
                              >
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="text-green-500 hover:text-green-700"
                                  title="Edit"
                                  onClick={() => handleEditCheatSheet(sheet)}
                                >
                                  <Edit size={20} />
                                </motion.button>
                              </PermissionWrapper>
                              <PermissionWrapper
                                section="Cheat Sheet"
                                action="delete"
                              >
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="text-red-500 hover:text-red-700"
                                  title="Delete"
                                  onClick={() => handleDeleteQuestion(sheet)}
                                >
                                  <Trash2 size={20} />
                                </motion.button>
                              </PermissionWrapper>
                            </td>
                          </PermissionWrapper>

                          <PermissionWrapper section="Cheat Sheet Main Section|Cheat Sheet Section">
                            <td className="px-6 py-4">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-leafGreen hover:text-forestGreen"
                                title="Cheat Sheet Data"
                                onClick={() =>
                                  handleNavigateToCheatSheetData(sheet)
                                }
                              >
                                <Database size={20} />
                              </motion.button>
                            </td>
                          </PermissionWrapper>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
              <div className="md:hidden">
                {paginatedCheatSheets.map((sheet, index) => (
                  <div key={index} className="bg-white shadow-sm border p-3">
                    {/* Top Row: Question */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        {sheet.title}
                      </div>
                      <PermissionWrapper section="Cheat Sheet Main Section|Cheat Sheet Section">
                        <button
                          title="Cheat Sheet Data"
                          onClick={() =>
                            handleNavigateToCheatSheetData(sheet)
                          }
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Database size={20} />
                        </button>
                      </PermissionWrapper>
                    </div>

                    {/* Bottom Row: Type + Marks (left) / Actions (right) */}
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${sheet.isPaid
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                            }`}
                        >
                          {sheet.isPaid === 1 ? "Paid" : "Free"}
                        </span>
                      </div>

                      <PermissionWrapper section="Cheat Sheet" action="view|edit|delete">
                        <div className="flex items-center gap-1">
                          <PermissionWrapper section="Cheat Sheet" action="view">
                            <button
                              onClick={() => handleViewCheatSheet(sheet)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="View Details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </PermissionWrapper>

                          <PermissionWrapper section="Cheat Sheet" action="edit">
                            <button
                              onChange={() =>
                                handleStatusToggle(sheet.id, sheet.isActive)
                              }
                              // disabled={!sheet.isActive}
                              className={`relative w-7 h-4 rounded-full transition-colors duration-300 ${sheet.isActive ? "bg-green-500" : "bg-gray-300"} disabled:opacity-50`}
                              title="Toggle Status"
                            >
                              <span
                                className={`absolute top-1/2 left-[3px] w-2.5 h-2.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${sheet.isActive ? "translate-x-[13px]" : "translate-x-0"}`}
                              />
                            </button>
                          </PermissionWrapper>

                          <PermissionWrapper section="Cheat Sheet" action="edit">
                            <button
                              onClick={() => handleEditCheatSheet(sheet)}
                              className="p-2 text-gray-400 hover:text-forestGreen disabled:opacity-50"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </PermissionWrapper>

                          <PermissionWrapper section="Cheat Sheet" action="delete">
                            <button
                              onClick={() => handleDeleteQuestion(sheet)}
                              className="p-2 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </PermissionWrapper>
                        </div>
                      </PermissionWrapper>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalCheatsheet > 10 && (
            <Pagination
              pagination={{ totalCount: totalCheatsheet, totalPages: totalPages }}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              limit={itemsPerPage}
              setLimit={setItemsPerPage}
            />
          )}

        </motion.div>

        <AnimatePresence>
          {isViewModalOpen && <ViewModal />}

          {/* Create Modal */}
          {isCreateModalOpen && (
            <CheatSheetModal
              isOpen={isCreateModalOpen}
              onClose={handleCloseCreateModal}
              formData={createFormData}
              setFormData={setCreateFormData}
              handleSubmit={handleCreateSubmit}
              handleChange={handleCreateChange}
              isEditing={false}
            />
          )}

          {/* Edit Modal */}
          {isEditModalOpen && (
            <CheatSheetModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              formData={editFormData}
              setFormData={setEditFormData}
              handleSubmit={handleEditSubmit}
              handleChange={handleEditChange}
              isEditing={true}
            />
          )}
          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setCheatSheetToDelete(null);
            }}
            onConfirm={confirmDeleteCheatSheet}
          // isDeleting={isDeleting}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}
