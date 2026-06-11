/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
"use client"

import { useEffect, useState } from "react"
import { X, Eye, Loader2, ToggleLeft, ToggleRight, Plus, FileText, Upload } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import {
  useCreateAssignmentMutation,
  useGetAssignmentModuleByIdQuery,
  useUpdateAssignmentMutation,
} from "../../../services/Content_Management/assignmentApi"
import toast from "react-hot-toast"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { getAdminToken } from "../../../services/CookieService"
import { setAssignmentInfo } from "../../../features/Content_Management/assignmentSlice"
import { Editor } from "@tinymce/tinymce-react"
import PermissionWrapper from "../../../context/PermissionWrapper"
import AIContentGenerator from "../../Home/courses/AIContentGenrator"
import { slugify } from "../../../utils/slugify"

const Assignment = ({ showAssignmentForm, setShowAssignmentForm }) => {
  const { moduleId } = useLocation().state
  const { id } = useSelector((state) => state.user)
  const [filePreview, setFilePreview] = useState(null)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { access_token } = getAdminToken()
  const [showViewModal, setShowViewModal] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isMobile, setIsMobile] = useState(false);

  const [formData, setFormData] = useState({
    module_id: moduleId,
    title: "",
    description: "",
    days_to_complete: 7,
    max_score: 0,
    passing_score: 0,
    max_attempt: 1,
    extension_limit: 0,
    status: "active",
    assignmentFile: null,
    category: "regular",
    paragraph_prompt: "",
  })

  const categoryColors = {
    regular: "bg-amber-100 text-amber-700 ring-amber-200",
    matching: "bg-lightGreen text-forestGreen ring-leafGreen/30",
    true_false: "bg-green-100 text-green-700 ring-green-200",
    fill_in_the_blanks: "bg-lightGreen text-forestGreen ring-purple-200",
    paragraph_writing: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  }

  const {
    data: assignmentsData,
    isSuccess: isSuccessGetAssignments,
    isLoading: isLoadingGetAssignments,
  } = useGetAssignmentModuleByIdQuery({
    moduleId,
    access_token,
  })

  const [createAssignment, { isLoading: isLoadingCreateAssignment, isSuccess: isSuccessCreateAssignment }] =
    useCreateAssignmentMutation()

  const [updateAssignment, { isLoading: isLoadingUpdateAssignment }] = useUpdateAssignmentMutation()

  useEffect(() => {
    if (!id) {
      navigate("/admin/dashboard")
      return
    }
  }, [id, navigate])

  useEffect(() => {
    if (assignmentsData && isSuccessGetAssignments) {
      setAssignments(assignmentsData)
      dispatch(setAssignmentInfo({ assignments: assignmentsData }))
    }
  }, [assignmentsData, isSuccessGetAssignments, dispatch])

  const handleUseGeneratedAssignment = (assignment) => {
    setFormData({
      ...formData,
      title: assignment.title,
      description: assignment.description,
      days_to_complete: assignment.days_to_complete || 7,
      max_score: assignment.max_score,
      passing_score: assignment.passing_score,
      max_attempt: assignment.max_attempt || 1,
      extension_limit: assignment.extension_limit || 0,
      category: assignment.category,
      paragraph_prompt: assignment?.paragraph_questions ? assignment.paragraph_questions[0]?.paragraph : "",
    })
    toast.success("Assignment data populated!")
  }

  // Helper function to format date for MySQL
  const formatDateForMySQL = (dateString) => {
    const date = new Date(dateString)
    return date.toISOString().slice(0, 19).replace('T', ' ')
  }

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault()
    const formDataToSubmit = new FormData()

    Object.keys(formData).forEach((key) => {
      if (key === "due_date") {
        formDataToSubmit.append(key, formatDateForMySQL(formData[key]))
      } else if (key !== "paragraph_prompt") {
        formDataToSubmit.append(key, formData[key])
      }
    })

    // Add paragraph prompt for paragraph writing category
    if (formData.category === "paragraph_writing") {
      if (!formData.paragraph_prompt) {
        toast.error("Please add a paragraph prompt.")
        return
      }
      formDataToSubmit.append("paragraph_prompt", formData.paragraph_prompt)
    }

    // Validation for regular assignment
    if (formData.category === "regular") {
      if (!formData.description && !formData.assignmentFile) {
        toast.error("Please add a description or upload a file for the regular assignment.")
        return
      }
    }

    try {
      if (isEditing && selectedItem) {
        await updateAssignment({
          id: selectedItem.id,
          formData: formDataToSubmit,
          access_token: access_token,
        }).unwrap()
        toast.success("Assignment updated successfully!")
        setIsEditing(false)
      } else {
        await createAssignment({
          assignment: formDataToSubmit,
          access_token: access_token,
        }).unwrap()
        toast.success("Assignment added successfully")
      }
      setShowAssignmentForm(false)
      resetForm()
      setSelectedItem(null)
    } catch (error) {
      console.error("Error submitting assignment:", error)
      const errorMessage =
        error?.data?.error || error?.data?.message || error?.error || error?.message || "Failed to Create Assignment"
      toast.error(errorMessage)
    }
  }

  const resetForm = () => {
    setFormData({
      module_id: moduleId,
      title: "",
      description: "",
      days_to_complete: 7,
      max_score: 0,
      passing_score: 0,
      max_attempt: 1,
      extension_limit: 0,
      status: "active",
      assignmentFile: null,
      category: "regular",
      paragraph_prompt: "",
    })
    setFilePreview(null)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData({ ...formData, assignmentFile: file })
      const previewUrl = URL.createObjectURL(file)
      setFilePreview(previewUrl)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name !== "description") {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleCategoryChange = (e) => {
    const { value } = e.target
    setFormData({ ...formData, category: value })
  }

  const handleView = (item) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowViewModal(false)
    setShowAssignmentForm(true)
    setFormData({
      ...selectedItem,
      file: selectedItem.file || null,
      paragraph_prompt: selectedItem.ParagraphWritings?.[0]?.paragraph || "",
    })
  }

  const handleManageQuestions = (assignment) => {
    // Navigate to assignment questions page
    navigate(`/admin/dashboard/assignment/questions/${slugify(assignment.title)}`, {
      state: { assignmentId: assignment.id }
    })
  }

  const handleStatusToggle = async (item) => {
    if (item?.included_topic_id) {
      toast.error(`This assignment is included in topic: ${item.included_topic_title}`)
      return
    }

    const newStatus = item.status === "active" ? "closed" : "active"
    try {
      await updateAssignment({
        id: item.id,
        formData: {
          status: newStatus,
        },
        access_token: access_token,
      }).unwrap()

      if (newStatus === "active") {
        toast.success("Assignment activated successfully!")
      } else {
        toast.success("Assignment deactivated successfully!")
      }

      setAssignments((prevAssignments) =>
        prevAssignments.map((assignment) =>
          assignment.id === item.id ? { ...assignment, status: newStatus } : assignment,
        ),
      )
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error(error.data?.message || error.data?.error || "Failed to update status. Please try again.")
    }
  }

  return (
    <div>
      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-forestGreen">
                Assignment Details
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedItem(null)
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-md font-medium">{selectedItem.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1">
                    <span
                      className={`px-2.5 py-1 rounded-full text-md font-medium ${categoryColors[selectedItem.category] || categoryColors["regular"]
                        }`}
                    >
                      {selectedItem.category
                        ? selectedItem.category
                          .split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")
                        : "Regular"}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <div
                    className="mt-1 text-md"
                    dangerouslySetInnerHTML={{
                      __html: selectedItem.description,
                    }}
                  />
                </div>

                {/* Display file for regular assignments */}
                {selectedItem.category === "regular" && selectedItem.file && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assignment File</label>
                    <div className="mt-2 flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-md text-gray-600">
                        {selectedItem.file.split('/').pop()}
                      </span>
                      <a
                        href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${selectedItem.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm text-forestGreen hover:text-forestGreen bg-lightGreen hover:bg-lightGreen rounded-full transition-colors duration-200 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View File</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Days to Complete</label>
                    <p className="mt-1 text-md">{selectedItem.days_to_complete} days</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Attempts</label>
                    <p className="mt-1 text-md">{selectedItem.max_attempt || 1}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Extension Limit</label>
                    <p className="mt-1 text-md">{selectedItem.extension_limit || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Score</label>
                    <p className="mt-1 text-md">{selectedItem.max_score}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Passing Score</label>
                    <p className="mt-1 text-md">{selectedItem.passing_score}</p>
                  </div>
                </div>

                {/* Show paragraph prompt for paragraph writing category */}
                {selectedItem.category === "paragraph_writing" && selectedItem.ParagraphWritings && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paragraph Prompt</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: selectedItem.ParagraphWritings[0]?.paragraph }}
                      ></p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  setSelectedItem(null)
                }}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <PermissionWrapper section="Assignment" action="edit">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen hover:bg-forestGreen rounded-lg transition-colors duration-200 shadow-sm"
                >
                  Edit
                </button>
              </PermissionWrapper>

              {/* Show manage questions button only for non-regular assignments */}
              {/* {selectedItem.category !== "regular" && (
                <button
                  onClick={() => handleManageQuestions(selectedItem)}
                  className="px-6 py-2.5 text-sm font-medium text-white  bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Manage Questions
                </button>
              )} */}
            </div>

          </div>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-forestGreen">
                {isEditing ? "Edit Assignment" : "Add Assignment"}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <AIContentGenerator contentType="assignment" onUseGenerated={handleUseGeneratedAssignment} />
                )}
                <button
                  onClick={() => {
                    setShowAssignmentForm(false)
                    setIsEditing(false)
                    setSelectedItem(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <form id="assignmentForm" onSubmit={handleAssignmentSubmit} className="space-y-4">

                <div className="grid grid-cols-3 gap-4">
                  {/* Title - 2/3 width */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter assignment title"
                      required
                    />
                  </div>

                  {/* Category - 1/3 width */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    {isEditing ? (
                      <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-800 font-medium">
                        {formData.category?.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                    ) : (
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleCategoryChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      >
                        <option value="regular">Regular</option>
                        <option value="matching">Matching</option>
                        <option value="true_false">True/False</option>
                        <option value="fill_in_the_blanks">Fill in the Blanks</option>
                        <option value="paragraph_writing">Paragraph Writing</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Editor
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
                        "undo redo | formatselect | bold italic underline | " +
                        "alignleft aligncenter alignright alignjustify | " +
                        "bullist numlist outdent indent | removeformat | help",
                      content_style: "body { font-family:Arial,Helvetica,sans-serif; font-size:14px }",
                    }}
                    onEditorChange={(content) => setFormData({ ...formData, description: content })}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload File
                  </label>

                  {/* Show existing file if editing and file exists */}
                  {isEditing && formData.file && (
                    <div className="mb-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formData.file.split('/').pop()}
                        </span>
                      </div>
                      <a
                        href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${formData.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm text-forestGreen hover:text-forestGreen bg-lightGreen hover:bg-lightGreen rounded-full transition-colors duration-200 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Current File</span>
                      </a>
                    </div>
                  )}

                  {/* File input */}
                  <div className={`relative w-full border-2 border-dashed rounded-lg transition-colors cursor-pointer`}
                    // onDragOver={handleDragOver}
                    // onDragLeave={handleDragLeave}
                    // onDrop={handleDrop}
                    onClick={() => document.getElementById('assignmentFile').click()}
                  >
                    <input
                      id="assignmentFile"
                      type="file"
                      name="assignmentFile"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {filePreview ? (
                      <div className="p-4 text-center">
                        <FileText className="h-8 w-8 text-leafGreen mx-auto mb-2" />
                        <span className="text-sm text-gray-600">File selected</span>
                        <a
                          href={filePreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-leafGreen hover:text-forestGreen mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Upload
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-gray-500">
                        <Upload size={24} className="mb-2" />
                        <span className="text-xs text-center">
                          Drop file here or click to upload
                        </span>
                        <span className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, TXT</span>
                      </div>
                    )}
                  </div>

                  {isEditing && formData.file && (
                    <p className="mt-1 text-xs text-gray-500">Upload a new file to replace the current one</p>
                  )}
                </div>

                {/* Due Date, Max Score, Passing Score, Max Attempts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Score *
                    </label>
                    <input
                      type="number"
                      name="max_score"
                      required
                      min="1"
                      value={formData.max_score}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter max score"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing Score *
                    </label>
                    <input
                      type="number"
                      name="passing_score"
                      required
                      min="1"
                      max={formData.max_score}
                      value={formData.passing_score}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter passing score"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Days to Complete
                    </label>
                    <input
                      type="number"
                      name="days_to_complete"
                      min="1"
                      value={formData.days_to_complete}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter days"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extension Limit
                    </label>
                    <input
                      type="number"
                      name="extension_limit"
                      required
                      min="0"
                      value={formData.extension_limit}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter extension limit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attempts *
                    </label>
                    <input
                      type="number"
                      name="max_attempt"
                      required
                      min="1"
                      value={formData.max_attempt}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter max attempts"
                    />
                  </div>
                </div>

                {/* Paragraph Writing Prompt */}
                {formData.category === "paragraph_writing" && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Paragraph Writing</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paragraph Prompt
                      </label>
                      <textarea
                        value={formData.paragraph_prompt}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paragraph_prompt: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none"
                        placeholder="Enter the prompt for the paragraph"
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setShowAssignmentForm(false)
                  setIsEditing(false)
                  setSelectedItem(null)
                  resetForm()
                }}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="assignmentForm"
                disabled={isLoadingCreateAssignment || isLoadingUpdateAssignment}
                className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen hover:bg-forestGreen rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoadingCreateAssignment || isLoadingUpdateAssignment ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  `${isEditing ? "Update" : "Create"} Assignment`
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Assignment Form Modal */}
      {/* {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold  text-forestGreen">
                {isEditing ? "Edit Assignment" : "Add New Assignment"}
              </h2>
              <div className="flex gap-2 mb-4">
                {!isEditing &&
                  <AIContentGenerator contentType="assignment" onUseGenerated={handleUseGeneratedAssignment} />
                }
              </div>
              <button
                onClick={() => {
                  setShowAssignmentForm(false)
                  setIsEditing(false)
                  setSelectedItem(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close form"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAssignmentSubmit} className="flex-1 overflow-x-hidden pr-2 pl-2">
              <div className="space-y-4">
                // Category Selection
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  {isEditing ? (
                    <div className="mt-1 px-3 py-2 bg-gray-100 rounded-lg text-gray-800 font-medium">
                      {formData.category?.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  ) : (
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleCategoryChange}
                      className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                    >
                      <option value="regular">Regular</option>
                      <option value="matching">Matching</option>
                      <option value="true_false">True/False</option>
                      <option value="fill_in_the_blanks">Fill in the Blanks</option>
                      <option value="paragraph_writing">Paragraph Writing</option>
                    </select>
                  )}
                </div>

                // Title
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                    placeholder="Enter assignment title"
                  />
                </div>

                //  Description
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <Editor
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
                        "undo redo | formatselect | bold italic underline | " +
                        "alignleft aligncenter alignright alignjustify | " +
                        "bullist numlist outdent indent | removeformat | help",
                      content_style: "body { font-family:Arial,Helvetica,sans-serif; font-size:14px }",
                    }}
                    onEditorChange={(content) => setFormData({ ...formData, description: content })}
                  />
                </div>

                // File Upload
                <div>
                  <label htmlFor="assignmentFile" className="block text-sm font-medium text-gray-700">
                    Upload File
                  </label>

                  // Show existing file if editing and file exists
                  {isEditing && formData.file && (
                    <div className="mt-2 mb-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formData.file.split('/').pop()}
                      </span>
                      <a
                        href={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${formData.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm text-forestGreen hover:text-forestGreen bg-lightGreen hover:bg-lightGreen rounded-full transition-colors duration-200 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Current File</span>
                      </a>
                    </div>
                  )}

                  // File input for new upload
                  <div className={isEditing && formData.file ? "mt-2" : ""}>
                    <input
                      type="file"
                      id="assignmentFile"
                      name="assignmentFile"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                    />
                    {isEditing && formData.file && (
                      <p className="mt-1 text-xs text-gray-500">Upload a new file to replace the current one</p>
                    )}
                  </div>

                  // Preview for newly uploaded file
                  {filePreview && (
                    <div className="mt-2 flex justify-center">
                      <a
                        href={filePreview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-leafGreen underline"
                      >
                        View New Upload
                      </a>
                    </div>
                  )}
                </div>

                // Due Date, Max Score, Max Attempts
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="days_to_complete" className="block text-sm font-medium text-gray-700">
                      Days to Complete
                    </label>
                    <input
                      type="number"
                      id="days_to_complete"
                      name="days_to_complete"
                      min="1"
                      value={formData.days_to_complete}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                      placeholder="Enter number of days to complete"
                    />
                  </div>
                  <div>
                    <label htmlFor="max_score" className="block text-sm font-medium text-gray-700">
                      Max Score
                    </label>
                    <input
                      type="number"
                      id="max_score"
                      name="max_score"
                      required
                      min="0"
                      value={formData.max_score}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                      placeholder="Enter maximum score"
                    />
                  </div>
                  <div>
                    <label htmlFor="max_attempt" className="block text-sm font-medium text-gray-700">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      id="max_attempt"
                      name="max_attempt"
                      required
                      min="1"
                      value={formData.max_attempt}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                      placeholder="Enter maximum attempts allowed"
                    />
                  </div>
                </div>

                // Paragraph Writing Prompt
                {formData.category === "paragraph_writing" && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Paragraph Writing</h3>
                    <div className="mb-6 border rounded-md p-4  bg-lightGreen">
                      <label htmlFor="paragraph_prompt" className="block text-sm font-medium text-gray-700">
                        Paragraph Prompt
                      </label>
                      <textarea
                        id="paragraph_prompt"
                        value={formData.paragraph_prompt}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paragraph_prompt: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 bg-white border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                        placeholder="Enter the prompt for the paragraph"
                        rows={4}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignmentForm(false)
                      setIsEditing(false)
                      setSelectedItem(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover: hover:bg-lightGreen/50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoadingCreateAssignment || isLoadingUpdateAssignment}
                    className="px-4 py-2  bg-lightGreen text-white rounded-lg   transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingCreateAssignment || isLoadingUpdateAssignment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Assignment"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )} */}

      {/* List of Assignments */}
      <div className="mt-8">
        {isLoadingGetAssignments ? (
          <div className="flex justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-forestGreen" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl mb-8">
            <p className="text-gray-500">No Assignments available. Add your first Assignment to get started.</p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-lightGreen">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Max Score</th>
                    <PermissionWrapper section="Assignment" action="edit">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    </PermissionWrapper>
                    <PermissionWrapper section="Assignment" action="view">
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </PermissionWrapper>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments &&
                    assignments.length > 0 &&
                    assignments.map((item, queindex) => (
                      <tr key={item.id} className="hover:bg-lightGreen/20 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{queindex + 1}</td>

                        {/* Title */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-forestGreen block truncate max-w-[28ch]">
                            {item.title.charAt(0).toUpperCase() + item.title.slice(1)}
                          </span>
                          {item.included_topic_id && (
                            <p className="mt-0.5 text-xs text-amber-700">
                              Included in topic: {item.included_topic_title}
                            </p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full inline-flex items-center justify-center text-xs font-medium ${categoryColors[item.category] || categoryColors["regular"]}`}>
                            {item.category
                              ? item.category.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
                              : "Regular"}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.days_to_complete} days</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.max_score}</td>

                        <PermissionWrapper section="Assignment" action="edit">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleStatusToggle(item)}
                              disabled={!!item.included_topic_id}
                              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${item.status === "active" ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={item.included_topic_id ? `Included in topic: ${item.included_topic_title}` : (item.status === "active" ? "Deactivate" : "Activate")}
                            >
                              <span className={`absolute top-1/2 left-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${item.status === "active" ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                            </button>
                          </td>
                        </PermissionWrapper>

                        <PermissionWrapper section="Assignment" action="view">
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleView(item)}
                                className="text-forestGreen hover:text-leafGreen transition-colors duration-200"
                                title="View Assignment"
                              >
                                <Eye className="w-5 h-5 inline-block mr-1" />
                                View
                              </button>
                              {item.category !== "regular" && (
                                <button
                                  onClick={() => handleManageQuestions(item)}
                                  className="text-forestGreen hover:text-leafGreen transition-colors duration-200"
                                  title="Manage Questions"
                                >
                                  <Plus className="w-5 h-5 inline-block mr-1" />
                                  Questions
                                </button>
                              )}
                            </div>
                          </td>
                        </PermissionWrapper>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              <div className="sm:p-2">
                {assignments &&
                  assignments.length > 0 &&
                  assignments.map((item, queindex) => (
                    <div
                      className={"p-4 bg-white transition-all duration-300"}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 mr-2">
                          <h3 className="text-base font-semibold  text-forestGreen">
                            {item.title.charAt(0).toUpperCase() + item.title.slice(1)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            <span
                              className={`px-2.5 py-1 rounded-full inline-flex items-center justify-center text-xs font-medium
                        ${categoryColors[item.category] || categoryColors["regular"]}`}
                            >
                              {item.category
                                ? item.category
                                  .split("_")
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ")
                                : "Regular"}
                            </span>
                          </p>
                            {item.included_topic_id && (
                              <p className="text-xs text-amber-700 mt-1">
                                Included in topic: {item.included_topic_title}
                              </p>
                            )}
                        </div>
                        <PermissionWrapper section="Assignment" action="view">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleView(item)}
                              className="text-forestGreen hover:text-leafGreen transition-colors duration-200"
                              title="View Assignment"
                            >
                              <Eye className="w-5 h-5 inline-block mr-1" />
                              View
                            </button>
                          </div>
                        </PermissionWrapper>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <PermissionWrapper section="Assignment" action="edit">
                          <button
                            onClick={() => handleStatusToggle(item)}
                            disabled={!!item.included_topic_id}
                            className={`relative w-7 h-4 rounded-full transition-colors duration-300 ${item.status === "active" ? 'bg-green-500' : 'bg-gray-300'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={item.included_topic_id ? `Included in topic: ${item.included_topic_title}` : (item.status === "active" ? "Activate" : "Deactivate")}
                          >
                            <span
                              className={`absolute top-1/2 left-[3px] w-2.5 h-2.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${item.status === "active" ? 'translate-x-[13px]' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </PermissionWrapper>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <PermissionWrapper section="Assignment" action="view">
                            <div className="flex items-center justify-center gap-2">
                              {item.category !== "regular" && (
                                <button
                                  onClick={() => handleManageQuestions(item)}
                                  className="text-green-600 hover:text-emerald-600 transition-colors duration-200"
                                  title="Manage Questions"
                                >
                                  <Plus className="w-5 h-5 inline-block mr-1" />
                                  Questions
                                </button>
                              )}
                            </div>
                          </PermissionWrapper>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  )
}

export default Assignment