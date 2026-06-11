import React, { useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import {
  useCreateTermsOfServiceMutation,
  useUpdateTermsOfServiceMutation,
  useGetAllTermsOfServiceQuery,
  useToggleTermsOfServiceStatusMutation,
} from "../../services/LegalPages/termsOfServices";
import { getAdminToken } from "../../services/CookieService";
import AdminLoader from "../../components/admin/AdminLoader";
import PermissionWrapper from "../../context/PermissionWrapper";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "react-hot-toast";
import { ArrowLeft, Plus, GripVertical } from 'lucide-react';

const SortableSentence = ({ id, content, onChange, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    touchAction: 'none', // Important for touch devices
  };

  // Enhanced touch handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    listeners.onTouchStart(e);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    // Let dnd-kit handle the movement
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={listeners.onTouchEnd}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Drag handle for mobile */}
            <div className="lg:hidden text-gray-400">
              <GripVertical size={16} />
            </div>
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Term {id + 1}
            </label>
          </div>
          <button
            type="button"
            className="px-3 py-1 text-xs font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
        <div className="border border-gray-300 rounded">
          <Editor
            apiKey={import.meta.env.VITE_TINYMCE_API}
            value={content}
            onEditorChange={(newContent) => onChange(id, newContent)}
            init={{
              height: 200,
              menubar: false,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "table",
                "paste",
                "help",
                "wordcount",
              ],
              toolbar:
                "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | removeformat | help",
              content_style:
                "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; line-height:1.6; }",
              mobile: {
                theme: 'mobile',
                toolbar: 'undo redo | bold italic | bullist numlist'
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

const TermsOfService = () => {
  const [sentences, setSentences] = useState([""]);
  const [category, setCategory] = useState("footer");
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { access_token } = getAdminToken();
  const navigate = useNavigate();

  const { data: terms, isLoading, error, refetch } = useGetAllTermsOfServiceQuery(access_token);
  const [createTermsOfService, { isLoading: isCreating }] = useCreateTermsOfServiceMutation();
  const [updateTermsOfService, { isLoading: isUpdating }] = useUpdateTermsOfServiceMutation();
  const [toggleTermsOfServiceStatus, { isLoading: isToggling }] = useToggleTermsOfServiceStatusMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSentences((prevSentences) => {
        const oldIndex = prevSentences.findIndex((_, index) => index === active.id);
        const newIndex = prevSentences.findIndex((_, index) => index === over.id);
        return arrayMove(prevSentences, oldIndex, newIndex);
      });
    }
    document.body.style.cursor = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sentences.every((s) => s.trim()) || sentences.length === 0) {
      toast.error("All sentences must be non-empty.");
      return;
    }
    const existing = getCategoryTerms(category);
    if (!editingId && existing.length > 0) {
      toast.error("Terms already exist for this category. Please edit instead.");
      return;
    }
    const payload = {
      sentences,
      category,
      createdBy: 1,
      updatedBy: 1,
    };
    try {
      if (editingId) {
        await updateTermsOfService({ id: editingId, data: payload, access_token }).unwrap();
        toast.success("Terms of Service updated successfully.");
      } else {
        await createTermsOfService({ data: payload, access_token }).unwrap();
        toast.success("Terms of Service created successfully.");
      }
      refetch();
      resetForm();
    } catch (err) {
      console.error("Error saving terms of service:", err);
      toast.error(err?.data?.error || "Failed to save terms of service. Please try again.");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleTermsOfServiceStatus({
        id,
        data: { updatedBy: 1 },
        access_token,
      }).unwrap();
      toast.success("Status toggled successfully.");
      refetch();
    } catch (err) {
      console.error("Error toggling status:", err);
      toast.error(err?.data?.error || "Failed to toggle status. Please try again.");
    }
  };

  const resetForm = () => {
    setSentences([""]);
    setCategory("footer");
    setEditingId(null);
    setShowForm(false);
    setSelectedCategory(null);
  };

  const handleAddSentence = () => {
    setSentences((prev) => [...prev, ""]);
  };

  const handleRemoveSentence = (index) => {
    if (sentences.length <= 1) {
      toast.error("You must have at least one term.");
      return;
    }

    setSentences((prev) => {
      const newSentences = [...prev];
      newSentences.splice(index, 1);
      return newSentences;
    });
  };

  const handleEditorChange = (index, content) => {
    const updated = [...sentences];
    updated[index] = content;
    setSentences(updated);
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setSentences(entry.sentences || [""]);
    setCategory(entry.category);
    setSelectedCategory(entry.category);
    setShowForm(true);
  };

  const handleCategoryClick = (categoryId) => {
    const existing = getCategoryTerms(categoryId);
    if (existing.length > 0) {
      handleEdit(existing[0]);
    } else {
      setCategory(categoryId);
      setSelectedCategory(categoryId);
      setShowForm(true);
      setEditingId(null);
      setSentences([""]);
    }
  };

  const getCategoryTerms = (categoryId) => {
    return terms?.data?.filter((term) => term.category === categoryId) || [];
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find((cat) => cat.id === categoryId);
  };

  const categories = [
    {
      id: "footer",
      name: "Footer Terms",
      description: "Terms displayed in footer sections",
    },
    {
      id: "partner",
      name: "Partner Terms",
      description: "Terms for partner agreements and collaborations",
    },
    {
      id: "login",
      name: "Login Terms",
      description: "Terms for user authentication and access",
    },
    {
      id: "signup",
      name: "Registration Terms",
      description: "Terms for user registration and account creation",
    },
  ];

  // Mobile card view component
  const MobileCategoryCard = ({ category }) => {
    const categoryTerms = getCategoryTerms(category.id);
    const hasTerms = categoryTerms[0]?.sentences?.length > 0;
    const termStatus = hasTerms ? categoryTerms[0].status : "No Terms";

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          {hasTerms ? (
            <PermissionWrapper section="Terms Of Services" action="edit">
              <label className="relative inline-flex items-center cursor-pointer w-9 h-5"
                onClick={(e) => e.stopPropagation()}
                title={termStatus === "active" ? "Deactivate" : "Activate"}
              >
                <input
                  type="checkbox"
                  checked={termStatus === "active"}
                  onChange={() => handleToggleStatus(categoryTerms[0].id)}
                  disabled={isToggling}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-leafGreen transition-colors"></div>
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </label>
            </PermissionWrapper>
          ) : (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
              No Terms
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-3">{category.description}</p>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {hasTerms ? `${categoryTerms[0]?.sentences?.length} terms` : 'No terms configured'}
          </div>
          <button
            onClick={() => handleCategoryClick(category.id)}
            className="bg-leafGreen hover:bg-leafGreen/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Manage
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {showForm ? (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 flex-shrink-0">
            <div className="w-full px-4 lg:px-6 py-4">
              {/* Main header row */}
              <div className="flex items-center justify-between">
                {/* Title section */}
                <div className="flex-1 min-w-0">
                  <div className="text-center lg:text-left">
                    <h1 className="text-xl lg:text-2xl font-bold bg-forestGreen bg-clip-text text-transparent break-words">
                      {editingId ? "Edit" : "Create"} {getCategoryInfo(selectedCategory)?.name}
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm lg:text-base line-clamp-2 break-words hidden lg:block">
                      {getCategoryInfo(selectedCategory)?.description}
                    </p>
                  </div>
                </div>

                {/* Button section - Different layout for mobile vs desktop */}
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {/* Mobile: Back and Add buttons */}
                  <div className="lg:hidden flex items-center gap-2">
                    <PermissionWrapper section="Terms Of Services" action={editingId ? "edit" : "create"}>
                      <button
                        onClick={handleAddSentence}
                        type="button"
                        className="bg-leafGreen hover:bg-leafGreen/90 text-white p-2 rounded-lg flex items-center justify-center transition-colors font-medium shadow-sm"
                        title="Add Term"
                      >
                        <Plus size={18} />
                      </button>
                    </PermissionWrapper>

                    <button
                      onClick={resetForm}
                      className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  </div>

                  {/* Desktop/Tab view: All buttons in one row with Update on the right */}
                  <div className="hidden lg:flex items-center gap-3">
                    {/* Back button - Left side */}
                    <button
                      onClick={resetForm}
                      className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium"
                    >
                      <ArrowLeft size={18} className="mr-2" />
                      Back
                    </button>

                    {/* Add button */}
                    <PermissionWrapper section="Terms Of Services" action={editingId ? "edit" : "create"}>
                      <button
                        onClick={handleAddSentence}
                        type="button"
                        className="bg-leafGreen hover:bg-leafGreen/90 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm"
                      >
                        <Plus size={18} />
                        Add
                      </button>
                    </PermissionWrapper>

                    {/* Update/Create button - Positioned on the right */}
                    <PermissionWrapper section="Terms Of Services" action={editingId ? "edit" : "create"}>
                      <button
                        type="submit"
                        form="termForm"
                        disabled={isCreating || isUpdating}
                        className="bg-leafGreen hover:bg-leafGreen/90 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreating || isUpdating ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{editingId ? "Updating..." : "Creating..."}</span>
                          </>
                        ) : editingId ? (
                          "Update Terms"
                        ) : (
                          "Create Terms"
                        )}
                      </button>
                    </PermissionWrapper>
                  </div>
                </div>
              </div>

              {/* Mobile Update button */}
              <div className="lg:hidden mt-4">
                <PermissionWrapper section="Terms Of Services" action={editingId ? "edit" : "create"}>
                  <button
                    type="submit"
                    form="termForm"
                    disabled={isCreating || isUpdating}
                    className="w-full bg-leafGreen hover:bg-leafGreen/90 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating || isUpdating
                      ? editingId
                        ? "Updating Terms..."
                        : "Creating Terms..."
                      : editingId
                        ? "Update Terms"
                        : "Create Terms"}
                  </button>
                </PermissionWrapper>
              </div>
            </div>
          </div>

          {/* Content area with proper scrolling */}
          <div className="flex-1 overflow-y-auto w-full p-4 lg:p-6">
            <PermissionWrapper section="Terms Of Services" action={editingId ? "edit" : "create"}>
              <div className="bg-white border border-gray-200 rounded-lg max-w-full">
                <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Terms Content</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {sentences.length} term{sentences.length !== 1 ? "s" : ""} configured
                  </p>
                </div>

                <form onSubmit={handleSubmit} id="termForm" className="p-4 lg:p-6">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={sentences.map((_, index) => index)}>
                      {sentences.map((sentence, index) => (
                        <SortableSentence
                          key={index}
                          id={index}
                          content={sentence}
                          onChange={handleEditorChange}
                          onRemove={handleRemoveSentence}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </form>
              </div>
            </PermissionWrapper>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
          {/* Header - Fixed with proper overflow handling */}
          <div className="bg-white border-b border-gray-200 flex-shrink-0">
            <div className="w-full px-4 lg:px-6 py-3 lg:py-4">
              <div className="flex items-center justify-between">
                {/* Mobile: Centered title, Desktop: Left aligned */}
                <div className="flex-1 lg:flex-none lg:min-w-0">
                  <div className="text-center lg:text-left">
                    <h1 className="text-xl lg:text-2xl font-bold bg-forestGreen bg-clip-text text-transparent break-words">
                      Terms of Service
                    </h1>
                    {/* Subtitle hidden on mobile, shown on desktop */}
                    <p className="text-gray-600 mt-0.5 lg:mt-1 text-xs lg:text-base hidden lg:block break-words">
                      Manage legal terms across different application sections
                    </p>
                  </div>
                </div>

                {/* Back button - always on right */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="flex items-center justify-center w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                  >
                    <ArrowLeft size={18} />
                    <span className="hidden lg:inline font-medium ml-2">Back</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content area with proper scrolling */}
          <div className="flex-1 overflow-y-auto w-full p-4 lg:p-6">
            {isLoading && <AdminLoader message="Loading terms..." />}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-red-800">Error loading terms of service. Please try again.</span>
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {categories.map((category) => (
                    <MobileCategoryCard key={category.id} category={category} />
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white border border-gray-200 rounded-lg max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <style>
                      {`
                        .switch {
                          position: relative;
                          display: inline-block;
                          width: 40px;
                          height: 20px;
                        }
                        .switch input {
                          opacity: 0;
                          width: 0;
                          height: 0;
                        }
                        .slider {
                          position: absolute;
                          cursor: pointer;
                          top: 0;
                          left: 0;
                          right: 0;
                          bottom: 0;
                          background-color: #ccc;
                          transition: .4s;
                        }
                        .slider:before {
                          position: absolute;
                          content: "";
                          height: 16px;
                          width: 16px;
                          left: 2px;
                          bottom: 2px;
                          background-color: white;
                          transition: .4s;
                        }
                        input:checked + .slider {
                          background-color: #10b981;
                        }
                        input:disabled + .slider {
                          background-color: #e5e7eb;
                          cursor: not-allowed;
                        }
                        input:focus + .slider {
                          box-shadow: 0 0 1px #10b981;
                        }
                        input:checked + .slider:before {
                          transform: translateX(20px);
                        }
                        .slider.round {
                          border-radius: 20px;
                        }
                        .slider.round:before {
                          border-radius: 50%;
                        }
                      `}
                    </style>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Terms Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map((category) => {
                          const categoryTerms = getCategoryTerms(category.id);
                          const hasTerms = categoryTerms[0]?.sentences?.length > 0;
                          const termStatus = hasTerms ? categoryTerms[0].status : "No Terms";

                          return (
                            <tr key={category.id} className="hover:bg-lightGreen/20 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {category.name}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-600">{category.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{categoryTerms[0]?.sentences?.length}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {hasTerms ? (
                                  <PermissionWrapper section="Terms Of Services" action="edit">
                                    <label className="relative inline-flex items-center cursor-pointer w-9 h-5"
                                      onClick={(e) => e.stopPropagation()}
                                      title={termStatus === "active" ? "Deactivate" : "Activate"}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={termStatus === "active"}
                                        onChange={() => handleToggleStatus(categoryTerms[0].id)}
                                        disabled={isToggling}
                                        className="sr-only peer"
                                      />
                                      <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-leafGreen transition-colors"></div>
                                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                    </label>
                                  </PermissionWrapper>
                                ) : (
                                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                    No Terms
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleCategoryClick(category.id)}
                                    className="text-leafGreen hover:text-forestGreen transition-colors"
                                  >
                                    Manage
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TermsOfService;