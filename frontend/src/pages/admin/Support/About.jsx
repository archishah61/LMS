"use client"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateAboutMutation,
  useUpdateAboutMutation,
  useUpdateAboutStatusMutation,
  useGetAllAboutQuery,
  useDeleteAboutByIdMutation,
} from "../../../services/Support/aboutApi";
import { ArrowLeft, ChevronDown, ChevronUp, Facebook, Filter, Instagram, Loader2, MoreVertical, Plus, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { getAdminToken } from "../../../services/CookieService";
import AdminLoader from "../../../components/admin/AdminLoader";
import { FaXTwitter } from "react-icons/fa6";
import PermissionWrapper from "../../../context/PermissionWrapper";
import toast from "react-hot-toast";

// Custom Delete Confirmation Modal
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, memberName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full mx-auto">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 md:h-6 md:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-base md:text-lg font-medium text-gray-900">Delete Team Member</h3>
          </div>
        </div>
        <div className="mb-4 md:mb-6">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete <span className="font-medium text-gray-900">{memberName}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Custom Form Modal
function FormModal({ isOpen, onClose, onSubmit, formData, handleChange, handleImageChange, imagePreview, editingId, resetForm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            {editingId ? "Edit Team Member" : "Add New Team Member"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="w-5 h-5 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <form onSubmit={onSubmit} id="memberForm" className="space-y-4 md:space-y-3">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                <div className="flex-shrink-0 self-center sm:self-auto">
                  <img src={imagePreview || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`} alt="Preview" className="h-16 w-16 rounded-full object-cover border-2 border-gray-200" />
                </div>
                <input
                  type="file"
                  name="aboutImg"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen/80 transition-colors"
                />
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter position"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Enter description"
              />
            </div>

            {/* Social Media Links */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Social Media (Optional)</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">X</label>
                  <input
                    type="url"
                    name="x"
                    value={formData.x}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen transition-colors"
                    placeholder="X URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Instagram</label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen transition-colors"
                    placeholder="Instagram URL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Facebook</label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Facebook URL"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
          <button
            type="button"
            onClick={() => { resetForm(); onClose(); }}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="memberForm"
            className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingId ? "Update Member" : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  const { access_token } = getAdminToken();
  const [createAbout] = useCreateAboutMutation();
  const [updateAbout] = useUpdateAboutMutation();
  const [updateAboutStatus] = useUpdateAboutStatusMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const { data: response, error, isLoading, refetch } = useGetAllAboutQuery({
    searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
    all: true,
  });
  const [deleteAboutById] = useDeleteAboutByIdMutation();
  const aboutEntries = response?.data || [];
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    description: "",
    x: "",
    instagram: "",
    facebook: "",
    email: "",
    aboutImg: null,
    existingImg: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "" });
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData((prevState) => ({
      ...prevState,
      aboutImg: file || null,
      existingImg: file ? null : prevState.existingImg,
    }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(formData.existingImg ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${formData.existingImg}` : null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      position: "",
      description: "",
      x: "",
      instagram: "",
      facebook: "",
      email: "",
      aboutImg: null,
      existingImg: null,
    });
    setImagePreview(null);
    setEditingId(null);
  };

  const createFormData = (data) => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", data.name);
    formDataToSend.append("position", data.position);
    formDataToSend.append("description", data.description);
    formDataToSend.append("email", data.email);
    formDataToSend.append("x", data.x || "");
    formDataToSend.append("instagram", data.instagram || "");
    formDataToSend.append("facebook", data.facebook || "");
    if (data.aboutImg && data.aboutImg instanceof File) {
      formDataToSend.append("aboutImg", data.aboutImg);
    } else if (data.existingImg) {
      formDataToSend.append("aboutImg", data.existingImg);
    }
    return formDataToSend;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.name || !formData.position || !formData.description) {
      toast.error("Name, position, and description are required!", { position: "top-right" });
      return;
    }
    try {
      const formDataToSend = createFormData(formData);
      if (editingId) {
        await updateAbout({
          id: editingId,
          aboutData: formDataToSend,
          access_token,
        }).unwrap();
        toast.success("Team member updated successfully!", { position: "top-right" });
      } else {
        await createAbout({
          aboutData: formDataToSend,
          access_token,
        }).unwrap();
        toast.success("Team member created successfully!", { position: "top-right" });
      }
      resetForm();
      refetch();
      setIsFormModalOpen(false);
    } catch (error) {
      console.error("Failed to save the about entry: ", error);
      if (error?.data?.error) {
        toast.error(error.data.error, { position: "top-right" });
      } else {
        toast.error(`Failed to ${editingId ? "update" : "create"} team member. Please try again later.`, { position: "top-right" });
      }
    }
  };

  const handleEdit = (about) => {
    setFormData({
      name: about.name,
      position: about.position,
      description: about.description,
      x: about.x || "",
      instagram: about.instagram || "",
      facebook: about.facebook || "",
      email: about.email,
      aboutImg: null,
      existingImg: about.img || null,
    });
    setImagePreview(about.img ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${about.img}` : null);
    setEditingId(about.id);
    setIsFormModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ isOpen: true, id, name });
    setMobileMenuOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAboutById({
        id: deleteModal.id,
        access_token,
      }).unwrap();
      toast.success("Team member deleted successfully!", { position: "top-right" });
      refetch();
      setDeleteModal({ isOpen: false, id: null, name: "" });
    } catch (error) {
      console.error("Failed to delete the about entry: ", error);
      if (error?.data?.error) {
        toast.error(error.data.error, { position: "top-right" });
      } else {
        toast.error("Failed to delete team member. Please try again later.", { position: "top-right" });
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, id: null, name: "" });
  };

  const handleStatusToggle = async (about) => {
    const nextStatus = (about.status || "active") === "active" ? "inactive" : "active";

    try {
      setUpdatingStatusId(about.id);
      await updateAboutStatus({
        id: about.id,
        status: nextStatus,
        access_token,
      }).unwrap();
      toast.success(`Team member marked as ${nextStatus}.`, { position: "top-right" });
      setMobileMenuOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to update about status: ", error);
      if (error?.data?.error) {
        toast.error(error.data.error, { position: "top-right" });
      } else {
        toast.error("Failed to update team member status. Please try again later.", { position: "top-right" });
      }
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (isLoading) {
    return <AdminLoader message="Loading team members..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
          <div className="w-full px-4 sm:px-6 py-4">
            {/* Mobile View */}
            <div className="sm:hidden">
              {/* Top Row - Title and Back Button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1"></div> {/* Spacer for centering */}
                <div className="flex-1 flex justify-center">
                  <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent text-center">
                    Team
                  </h1>
                </div>
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="flex items-center gap-1 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                  >
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </div>

              {/* Bottom Row - Two Buttons in Columns */}
              <div className="grid grid-cols-2 gap-2">
                {/* Filter Button */}
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center justify-center gap-1.5 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm"
                >
                  <Filter size={14} />
                  <span>Filters</span>
                  {isFilterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {/* Add Member Button */}
                <PermissionWrapper section="About" action="create">
                  <button
                    onClick={() => {
                      resetForm();
                      setIsFormModalOpen(true);
                    }}
                    className="bg-leafGreen hover:bg-leafGreen/90 text-white p-2 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 font-medium shadow-sm text-sm"
                  >
                    <Plus size={14} />
                    <span>Add New</span>
                  </button>
                </PermissionWrapper>
              </div>
            </div>

            {/* Desktop View - Unchanged */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                    Your Team
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your team members <span className="hidden md:inline-flex">and their information</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 lg:gap-4">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-1 lg:gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                  >
                    <Filter size={18} />
                    <span className="font-medium">Filters</span>
                    {isFilterOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  <PermissionWrapper section="About" action="create">
                    <button
                      onClick={() => {
                        resetForm();
                        setIsFormModalOpen(true);
                      }}
                      className="bg-leafGreen hover:bg-leafGreen/90 text-white lg:px-6 px-4 py-2 rounded-lg flex items-center gap-1 transition-all duration-300 font-medium shadow-sm"
                    >
                      <Plus size={18} />
                      Add <span className="hidden lg:inline-flex">Member</span>
                    </button>
                  </PermissionWrapper>
                  <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                  >
                    <ArrowLeft size={18} />
                    <span className="font-medium">Back</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Section */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
            >
              <div className="bg-lightGreen/10 rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search By Name, Position"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {(searchTerm || statusFilter !== "all") && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
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
          {/* Team Members List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-200">
            {aboutEntries.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                {
                  (!searchTerm && statusFilter === "all") ?
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your first team member.</p>
                    :
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or add a new team member.</p>
                }
              </div>
            ) : (
              aboutEntries.map((about) => {
                const currentStatus = (about.status || "active").toLowerCase();
                const isActive = currentStatus === "active";
                const isToggleLoading = updatingStatusId === about.id;

                return (
                <div key={about.id} className="p-4 sm:p-6 hover:bg-lightGreen/20 transition-colors border-b border-gray-100 last:border-b-0">
                  {/* Desktop View */}
                  <div className="hidden sm:flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {about.img ? (
                        <img src={about.img ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${about.img}` : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`} alt={about.name} className="h-12 w-12 rounded-full object-cover border-2 border-gray-200" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                          <span className="text-sm font-medium text-gray-600">{about.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{about.name}</h3>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-sm text-leafGreen font-medium mt-0.5">{about.position}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{about.description}</p>
                          {about.email && <p className="text-xs text-gray-500 mt-1">{about.email}</p>}
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <PermissionWrapper section="About" action="toggle">
                            <label className="relative inline-flex items-center cursor-pointer" title={isActive ? "Deactivate" : "Activate"}>
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={() => handleStatusToggle(about)}
                                disabled={isToggleLoading}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                              {isToggleLoading && <Loader2 className="absolute -right-5 h-4 w-4 animate-spin text-emerald-600" />}
                            </label>
                          </PermissionWrapper>
                          <PermissionWrapper section="About" action="edit">
                            <button onClick={() => handleEdit(about)} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-emerald-50" title="Edit">
                              <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </PermissionWrapper>
                          <PermissionWrapper section="About" action="delete">
                            <button onClick={() => handleDeleteClick(about.id, about.name)} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50" title="Delete">
                              <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </PermissionWrapper>
                        </div>
                      </div>
                      {(about.x || about.instagram || about.facebook) && (
                        <div className="flex items-center space-x-2 mt-3">
                          {about.x && (
                            <a href={about.x} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                              <span className="w-4 h-4 inline-block">
                                <FaXTwitter className="w-full h-full" />
                              </span>
                            </a>
                          )}
                          {about.instagram && (
                            <a href={about.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                              <span className="w-4 h-4 inline-block">
                                <Instagram className="w-full h-full" />
                              </span>
                            </a>
                          )}
                          {about.facebook && (
                            <a href={about.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                              <span className="w-4 h-4 inline-block">
                                <Facebook className="w-full h-full" />
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="sm:hidden space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {about.img ? (
                            <img src={about.img ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${about.img}` : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`} alt={about.name} className="h-10 w-10 rounded-full object-cover border-2 border-gray-200" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                              <span className="text-xs font-medium text-gray-600">{about.name.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900">{about.name}</h3>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-xs text-leafGreen font-medium">{about.position}</p>
                          {about.email && <p className="text-xs text-gray-500 mt-1">{about.email}</p>}
                        </div>
                      </div>

                      {/* Mobile Actions Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMobileMenuOpen(mobileMenuOpen === about.id ? false : about.id);
                          }}
                          className="h-8 w-8 p-0 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {mobileMenuOpen === about.id && (
                          <div className="absolute right-0 top-10 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-32">
                            <PermissionWrapper section="About" action="toggle">
                              <label className={`flex items-center justify-between gap-3 px-4 py-2 text-sm ${isActive ? "text-emerald-700 hover:bg-emerald-50" : "text-gray-700 hover:bg-gray-100"}`} title={isActive ? "Deactivate" : "Activate"}>
                                <span>{isActive ? "Deactivate" : "Activate"}</span>
                                <span className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleStatusToggle(about);
                                    }}
                                    disabled={isToggleLoading}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                </span>
                                {isToggleLoading && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
                              </label>
                            </PermissionWrapper>
                            <PermissionWrapper section="About" action="edit">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(about);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            </PermissionWrapper>
                            <PermissionWrapper section="About" action="delete">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(about.id, about.name);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </PermissionWrapper>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1">
                      <PermissionWrapper section="About" action="toggle">
                        <label className="relative inline-flex items-center cursor-pointer" title={isActive ? "Deactivate" : "Activate"}>
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleStatusToggle(about)}
                            disabled={isToggleLoading}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                          {isToggleLoading && <Loader2 className="absolute -right-5 h-4 w-4 animate-spin text-emerald-600" />}
                        </label>
                      </PermissionWrapper>
                      <PermissionWrapper section="About" action="edit">
                        <button
                          onClick={() => handleEdit(about)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-600 transition-colors hover:bg-emerald-50"
                          title="Edit"
                        >
                          <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper section="About" action="delete">
                        <button
                          onClick={() => handleDeleteClick(about.id, about.name)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50"
                          title="Delete"
                        >
                          <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </PermissionWrapper>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-gray-600 leading-relaxed">
                      {about.description}
                    </div>

                    {/* Social Media Links */}
                    {(about.x || about.instagram || about.facebook) && (
                      <div className="flex items-center space-x-3 pt-2 border-t border-gray-100">
                        {about.x && (
                          <a href={about.x} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors">
                            <span className="w-4 h-4 inline-block">
                              <FaXTwitter className="w-full h-full" />
                            </span>
                          </a>
                        )}
                        {about.instagram && (
                          <a href={about.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                            <span className="w-4 h-4 inline-block">
                              <Instagram className="w-full h-full" />
                            </span>
                          </a>
                        )}
                        {about.facebook && (
                          <a href={about.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                            <span className="w-4 h-4 inline-block">
                              <Facebook className="w-full h-full" />
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} memberName={deleteModal.name} />
      <FormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSubmit={handleSubmit} formData={formData} handleChange={handleChange} handleImageChange={handleImageChange} imagePreview={imagePreview} editingId={editingId} resetForm={resetForm} />
    </>
  );
}