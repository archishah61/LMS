/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { useUpdateMainSectionMutation, useToggleMainSectionStatusMutation } from "../../../services/CheatSheet/cheatSheetContent/mainSectionApi";
import { useUpdateSectionMutation, useDeleteSectionMutation, useCreateSectionMutation } from "../../../services/CheatSheet/cheatSheetContent/sectionApi";
import { Edit2, Save, X, ToggleLeft, ToggleRight, FileText, Image, Code, Layers, Clock, Eye, Grid3X3, List, Check, Plus, MoreVertical, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { getAdminToken } from "../../../services/CookieService";
import PermissionWrapper from "../../../context/PermissionWrapper";

const CheatSheetDisplay = ({ cheatSheets: initialCheatSheets, title, onRefresh }) => {
  const [updateMainSection] = useUpdateMainSectionMutation();
  const [updateSection] = useUpdateSectionMutation();
  const [deleteSection] = useDeleteSectionMutation();
  const [createSection] = useCreateSectionMutation();
  const [toggleMainSectionStatus] = useToggleMainSectionStatusMutation();
  const [editingItems, setEditingItems] = useState({});
  const [editValues, setEditValues] = useState({});
  const [cheatSheets, setCheatSheets] = useState(initialCheatSheets || []);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);
  const [expandedImages, setExpandedImages] = useState({});
  const [addingSection, setAddingSection] = useState(null);
  const [newSectionData, setNewSectionData] = useState({
    title: '',
    contentType: 'text',
    content: '',
    sectionImage: null
  });
  const { access_token } = getAdminToken();

  const toggleEdit = (type, id, item) => {
    setEditingItems((prev) => ({
      ...prev,
      [type + id]: !prev[type + id],
    }));
    if (!editingItems[type + id]) {
      setEditValues((prev) => ({
        ...prev,
        [type + id]:
          type === "main"
            ? { mainTitle: item.mainTitle || "" }
            : {
              title: item.title || "",
              content: item.content || "",
              contentType: item.contentType || "text",
              sectionImage: item.sectionImage || null,
            },
      }));
    }
  };

  const toggleImageExpansion = (sectionId) => {
    setExpandedImages(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Close expanded image when clicking outside
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setExpandedImages({});
      }
    };

    const handleClickOutside = (e) => {
      if (Object.keys(expandedImages).length > 0) {
        const expandedImageElements = document.querySelectorAll('[data-expanded-image]');
        let clickedInside = false;

        expandedImageElements.forEach(element => {
          if (element.contains(e.target)) {
            clickedInside = true;
          }
        });

        if (!clickedInside) {
          setExpandedImages({});
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedImages]);

  useEffect(() => {
    setCheatSheets(initialCheatSheets || []);
  }, [initialCheatSheets]);

  const handleValueChange = (type, id, field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [type + id]: {
        ...prev[type + id],
        [field]: value,
      },
    }));
  };

  const handleUpdateSubmit = async (item, type) => {
    try {
      const editValue = editValues[type + item.id];
      if (type === "main") {
        await updateMainSection({
          id: item.id,
          formData: { mainTitle: editValue.mainTitle },
          access_token,
        }).unwrap();
        setCheatSheets((prev) =>
          prev.map((sheet) =>
            sheet.id === item.id ? { ...sheet, mainTitle: editValue.mainTitle } : sheet
          )
        );
        toast.success("Main Section updated successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        const formData = new FormData();
        formData.append("title", editValue.title);
        formData.append("content", editValue.content);
        formData.append("contentType", editValue.contentType);
        if (editValue.contentType === "image" && editValue.sectionImage) {
          formData.append(
            "sectionImage",
            editValue.sectionImage instanceof File ? editValue.sectionImage : editValue.sectionImage
          );
        }
        await updateSection({
          id: item.id,
          formData: formData,
          access_token,
        }).unwrap();
        setCheatSheets((prev) =>
          prev.map((sheet) => ({
            ...sheet,
            Sections: sheet.Sections.map((section) =>
              section.id === item.id
                ? {
                  ...section,
                  title: editValue.title,
                  content: editValue.content,
                  contentType: editValue.contentType,
                  sectionImage:
                    editValue.contentType === "image"
                      ? editValue.sectionImage instanceof File
                        ? URL.createObjectURL(editValue.sectionImage)
                        : editValue.sectionImage || section.sectionImage
                      : null,
                }
                : section
            ),
          }))
        );
        toast.success("Section updated successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      toggleEdit(type, item.id, item);
    } catch (error) {
      toast.error(
        error?.data?.error || `Failed to update ${type === "main" ? "main section" : "section"}`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      console.error("Update failed:", error);
    }
  };

  const handleAddNewSection = async (mainSectionId) => {
    try {
      // Validate required fields
      if (!newSectionData.title.trim()) {
        toast.error("Section title is required", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      if (newSectionData.contentType === 'text' && !newSectionData.content.trim()) {
        toast.error("Section content is required", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      if (newSectionData.contentType === 'image' && !newSectionData.sectionImage) {
        toast.error("Please select an image", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      const sectionData = {
        mainSectionId: mainSectionId,
        title: newSectionData.title,
        contentType: newSectionData.contentType,
        content: newSectionData.contentType === 'text' ? newSectionData.content : '',
        sectionImage: newSectionData.sectionImage,
      };

      const formData = new FormData();
      formData.append('mainSectionId', sectionData.mainSectionId);
      formData.append('title', sectionData.title);
      formData.append('contentType', sectionData.contentType);
      formData.append('content', sectionData.content);
      if (sectionData.sectionImage) {
        formData.append('sectionImage', sectionData.sectionImage);
      }

      await createSection({
        section: formData,
        access_token
      }).unwrap();

      // Reset the form
      setNewSectionData({
        title: '',
        contentType: 'text',
        content: '',
        sectionImage: null
      });
      setAddingSection(null);

      // Refresh the cheat sheets
      onRefresh();

      toast.success("Section added successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      toast.error(error?.data?.error || "Failed to add section", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error("Add section failed:", error);
    }
  };

  // Add this function to cancel adding a new section
  const cancelAddSection = () => {
    setAddingSection(null);
    setNewSectionData({
      title: '',
      contentType: 'text',
      content: '',
      sectionImage: null
    });
  };

  const handleDeleteSection = async (itemId) => {
    try {
      await deleteSection({
        id: itemId,
        access_token
      }).unwrap();

      onRefresh();

      toast.success("Section removed successfully", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      toast.error(
        error?.data?.error || `Failed to remove section`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      console.error("Update failed:", error);
    }
  };

  const handleToggleStatus = async (sheet) => {
    const previousSheets = [...cheatSheets];
    setCheatSheets((prev) =>
      prev.map((s) =>
        s.id === sheet.id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s
      )
    );
    try {
      await toggleMainSectionStatus({
        id: sheet.id,
        access_token,
      }).unwrap();
      toast.success(
        `Main Section ${sheet.status === "active" ? "deactivated" : "activated"} successfully`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } catch (error) {
      setCheatSheets(previousSheets);
      toast.error(error?.data?.error || "Failed to toggle section status", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error("Toggle status failed:", error);
    }
  };

  const getSectionImageSrc = (section) =>
    section.sectionImage?.includes("blob:")
      ? section.sectionImage
      : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${section.sectionImage || '/placeholder.png'}`;

  const sectionPreviewClasses =
    "bg-white rounded-lg border border-emerald-100 shadow-sm overflow-hidden";

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />

      {/* Main Content */}
      <div className="mx-auto container py-4 sm:py-6">
        {cheatSheets?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 px-4 rounded-xl border border-dashed border-primary bg-white/80"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-primary">
              <Code className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Collections Yet</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
              Start building your knowledge base by creating your first cheat sheet collection.
            </p>
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' ? 'space-y-5' : 'space-y-4'}>
            {cheatSheets.map((sheet, index) => (
              <motion.div
                key={sheet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group"
              >
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-emerald-200 transition-all duration-200 overflow-hidden">
                  {/* Mobile Card Header */}
                  <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-white via-white to-emerald-50/40">
                    {editingItems["main" + sheet.id] ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editValues["main" + sheet.id]?.mainTitle ?? ""}
                          onChange={(e) =>
                            handleValueChange(
                              "main",
                              sheet.id,
                              "mainTitle",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base bg-white"
                          placeholder="Enter title..."
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleUpdateSubmit(sheet, "main")}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={() => toggleEdit("main", sheet.id, sheet)}
                            className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm rounded-lg transition-colors flex items-center gap-2"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight pr-2 break-words tracking-tight">
                              {sheet.mainTitle}
                            </h2>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <PermissionWrapper section="Cheat Sheet Main Section" action="edit">
                                <button
                                  onClick={() => toggleEdit("main", sheet.id, sheet)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-emerald-50 rounded-md transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </PermissionWrapper>
                              {/* <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMobileMenuOpen(mobileMenuOpen === sheet.id ? null : sheet.id);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                {mobileMenuOpen === sheet.id && (
                                  <div className="absolute right-0 top-10 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-32">
                                    <PermissionWrapper section="Cheat Sheet Main Section" action="toggle">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleStatus(sheet);
                                          setMobileMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 justify-between"
                                      >
                                        <span>{sheet.status === "active" ? "Deactivate" : "Activate"}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={sheet.status === "active"}
                                            onChange={() => { }}
                                            className="sr-only peer"
                                          />
                                          <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                          <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                        </label>
                                      </button>
                                    </PermissionWrapper>
                                  </div>
                                )}
                              </div> */}
                              <div>
                                <PermissionWrapper section="Cheat Sheet Main Section" action="toggle">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={sheet.status === "active"}
                                      onChange={() => handleToggleStatus(sheet)}
                                      className="sr-only peer"
                                    />
                                    <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
                                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                  </label>
                                </PermissionWrapper>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${sheet.status === "active"
                              ? "bg-emerald-50 text-primary border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${sheet.status === "active" ? "bg-emerald-500" : "bg-red-500"
                                }`}></div>
                              {sheet.status === "active" ? "Active" : "Inactive"}
                            </div>

                            <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium">
                              <Layers className="w-3 h-3" />
                              {sheet.Sections.length} sections
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Sections */}
                  <div className="p-4 sm:p-5">
                    <div className="space-y-4">
                      {sheet.Sections.map((section, sectionIndex) => (
                        <motion.div
                          key={section.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: sectionIndex * 0.05 }}
                          className="group/section"
                        >
                          {editingItems["section" + section.id] ? (
                            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 space-y-3 shadow-sm">
                              <input
                                type="text"
                                value={editValues["section" + section.id]?.title ?? ""}
                                onChange={(e) =>
                                  handleValueChange("section", section.id, "title", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
                                placeholder="Section title..."
                              />

                              <select
                                value={editValues["section" + section.id]?.contentType ?? "text"}
                                onChange={(e) =>
                                  handleValueChange("section", section.id, "contentType", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
                              >
                                <option value="text">Text</option>
                                <option value="image">Image</option>
                              </select>

                              {editValues["section" + section.id]?.contentType === "image" ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Image
                                  </label>
                                  {editValues["section" + section.id]?.sectionImage && (
                                    <div className="mb-3 rounded-xl overflow-hidden border border-emerald-200 bg-white">
                                      <img
                                        src={
                                          editValues["section" + section.id].sectionImage instanceof File
                                            ? URL.createObjectURL(editValues["section" + section.id].sectionImage)
                                            : getSectionImageSrc({ sectionImage: editValues["section" + section.id].sectionImage })
                                        }
                                        alt="Existing section"
                                        className="max-h-48 w-full object-contain"
                                      />
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        handleValueChange("section", section.id, "sectionImage", file);
                                      }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 text-sm bg-white"
                                  />
                                </div>
                              ) : (
                                <textarea
                                  value={editValues["section" + section.id]?.content ?? ""}
                                  onChange={(e) =>
                                    handleValueChange("section", section.id, "content", e.target.value)
                                  }
                                  rows={5}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm resize-y bg-white leading-relaxed"
                                  placeholder="Section content..."
                                />
                              )}

                              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                                <button
                                  onClick={() => handleUpdateSubmit(section, "section")}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={() => toggleEdit("section", section.id, section)}
                                  className="px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 rounded-lg border border-gray-100 bg-white hover:border-emerald-100 transition-all shadow-sm">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${section.contentType === "image"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-emerald-50 text-emerald-600"
                                    }`}>
                                    {section.contentType === "image" ? (
                                      <Image className="w-3 h-3" />
                                    ) : (
                                      <Code className="w-3 h-3" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-sm sm:text-[15px] break-words">{section.title}</h3>
                                    <p className="text-[11px] text-gray-500 capitalize mt-0.5">{section.contentType} content</p>
                                  </div>
                                </div>
                                <PermissionWrapper section="Cheat Sheet Section" action="edit">
                                    <button
                                      onClick={() => handleDeleteSection(section.id)}
                                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover/section:opacity-100 transition-all flex-shrink-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => toggleEdit("section", section.id, section)}
                                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-emerald-50 rounded-md opacity-0 group-hover/section:opacity-100 transition-all flex-shrink-0"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                </PermissionWrapper>
                              </div>

                              {section.contentType === "image" ? (
                                <div className="relative">
                                  {/* Normal compact view */}
                                  {!expandedImages[section.id] && (
                                    <div className={sectionPreviewClasses}>
                                      <img
                                        src={getSectionImageSrc(section)}
                                        alt={section.title}
                                        className="w-full h-auto max-h-[420px] object-contain bg-white"
                                      />
                                      <button
                                        onClick={() => toggleImageExpansion(section.id)}
                                        className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all z-10"
                                      >
                                        <Maximize2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Expanded view - appears as overlay without blurring background */}
                                  {expandedImages[section.id] && (
                                    <div
                                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                                      data-expanded-image
                                    >
                                      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
                                        <img
                                          src={
                                            section.sectionImage?.includes("blob:")
                                              ? section.sectionImage
                                              : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${section.sectionImage || '/placeholder.png'}`
                                          }
                                          alt={section.title}
                                          className="max-w-full max-h-full object-contain rounded-lg"
                                        />
                                        <button
                                          onClick={() => toggleImageExpansion(section.id)}
                                          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
                                        >
                                          <Minimize2 className="w-5 h-5" />
                                        </button>
                                        <button
                                          onClick={() => toggleImageExpansion(section.id)}
                                          className="absolute top-4 left-4 p-2 text-white hover:bg-white/20 rounded-full transition-all"
                                        >
                                          <X className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {!expandedImages[section.id] && (
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                      Click the expand icon to view full size
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed overflow-visible">
                                    {section.content}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))}

                      {addingSection !== sheet.id && (
                        <PermissionWrapper section="Cheat Sheet Section" action="create">
                          <button
                            onClick={() => setAddingSection(sheet.id)}
                            className="w-full py-4 border-2 border-dashed border-emerald-200 rounded-md text-emerald-700 bg-emerald-50/40 flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Add New Section
                          </button>
                        </PermissionWrapper>
                      )}

                      {/* Add New Section Form */}
                      {addingSection === sheet.id && (
                        <div className="p-4 sm:p-5 bg-emerald-50 rounded-md border border-emerald-200 space-y-4 shadow-sm">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="text-sm font-semibold text-emerald-900">Add New Section</h4>
                              <p className="text-xs text-emerald-700 mt-1">Create a text block or upload an image for this main section.</p>
                            </div>
                            <button
                              onClick={cancelAddSection}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-white rounded-md border border-transparent"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Title Input */}
                          <input
                            type="text"
                            value={newSectionData.title}
                            onChange={(e) => setNewSectionData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
                            placeholder="Section title..."
                          />

                          {/* Content Type Select */}
                          <select
                            value={newSectionData.contentType}
                            onChange={(e) => setNewSectionData(prev => ({
                              ...prev,
                              contentType: e.target.value,
                              content: '',
                              sectionImage: null
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
                          >
                            <option value="text">Text</option>
                            <option value="image">Image</option>
                          </select>

                          {/* Content Based on Type */}
                          {newSectionData.contentType === "image" ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Image
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  setNewSectionData(prev => ({ ...prev, sectionImage: file }));
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 text-sm bg-white"
                              />
                              {newSectionData.sectionImage && (
                                <div className="mt-3 relative rounded-xl overflow-hidden border border-emerald-200 bg-white">
                                  <img
                                    src={URL.createObjectURL(newSectionData.sectionImage)}
                                    alt="Preview"
                                    className="max-h-48 w-full object-contain"
                                  />
                                  <button
                                    onClick={() => setNewSectionData(prev => ({ ...prev, sectionImage: null }))}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <textarea
                              value={newSectionData.content}
                              onChange={(e) => setNewSectionData(prev => ({ ...prev, content: e.target.value }))}
                              rows={5}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm resize-y bg-white leading-relaxed"
                              placeholder="Section content..."
                            />
                          )}

                          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
                            <button
                              onClick={cancelAddSection}
                              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm rounded-lg transition-colors flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAddNewSection(sheet.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Add Section
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Footer */}
                  <div className="px-4 sm:px-5 py-3 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        <span>{new Date(sheet.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(sheet.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CheatSheetDisplay;