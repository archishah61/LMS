/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
"use client"
import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  useGetQuizQuestionByQuizIdQuery,
  useCreateQuizQuestionMutation,
  useUpdateQuizQuestionMutation,
  useDeleteQuizQuestionMutation,
  useToggleQuizQuestionMutation,
} from "../../../services/Course_Management/quizQuestionApi"
import {
  useAssignPredefinedQuestionToQuizMutation,
  useGetPredefinedQuestionsByQuizIdQuery,
  useRemovePredefinedQuestionFromQuizMutation,
} from "../../../services/Masters/quizPreDefinedQuestionsApi"
import { useGetAllQuestionsWithOptionsQuery } from "../../../services/Masters/predefinedQuestionAPI"
import { getAdminToken } from "../../../services/CookieService"
import { Upload, Plus, Trash2, GripVertical, X, ChevronDown, ArrowLeft, HelpCircle } from "lucide-react"
import AudioPlayer from "../../ui/audioPlayer"
import AIContentGenerator from "../../Home/courses/AIContentGenrator"
import toast from "react-hot-toast"
import AdminLoader from "../AdminLoader";
import { useSelector } from "react-redux"
import axios from "axios"
import { base64ToFile } from "../../../utils/toFileObject"
import Select from "react-select";
import TextToAudioConverter from "../AIServices/TextToAudioConverter"
import PermissionWrapper from "../../../context/PermissionWrapper"

// Question type configurations
const questionTypes = [
  {
    id: "all",
    label: "All Questions",
    color: "from-gray-500 to-gray-600",
    description: "View all question types",
  },
  {
    id: "predefined",
    label: "Predefined Questions",
    color: "from-cyan-500 to-cyan-600",
    description: "Select from existing predefined questions",
    isPredefined: true, // Add this flag to identify predefined type
  },
  {
    id: "mcq",
    label: "Multiple Choice",
    color: "bg-leafGreen",
    description: "Traditional multiple choice questions",
    aiType: "mcq",
  },
  {
    id: "complete the sentance",
    label: "Complete Sentence",
    color: "from-green-500 to-green-600",
    description: "Fill in the blanks with correct words",
    aiType: "complete-sentence",
  },
  {
    id: "speaking",
    label: "Speaking",
    color: "from-teal-500 to-teal-600",
    description: "Question That User Have To Answer By Speaking",
    aiType: "speaking",
  },
  {
    id: "dragdrop",
    label: "Drag & Drop",
    color: "bg-leafGreen",
    description: "Interactive drag and drop questions",
    aiType: "drag-drop",
  },
  {
    id: "audiotoscript",
    label: "Audio to Script Writing",
    color: "from-orange-500 to-orange-600",
    description: "Listen and transcribe audio content",
    aiType: "audio-script",
  },
  {
    id: "videotoscript", // ✅ new
    label: "Video to Script Writing",
    color: "from-yellow-500 to-yellow-600",
    description: "Watch and transcribe video content",
    // aiType: "video-script",
  },
  {
    id: "imagetoscript", // ✅ new
    label: "Image to Script Writing",
    color: "from-pink-500 to-pink-600",
    description: "Generate description from an image",
    aiType: "image-script",
  },
  {
    id: "realword",
    label: "Real Word",
    color: "from-red-500 to-red-600",
    description: "Identify real vs fake words",
    aiType: "real-word",
  },
  {
    id: "summarizepassage",
    label: "Summarize Passage",
    color: "from-indigo-500 ",
    description: "Summarize given text passages",
    aiType: "summary-passage",
  },
  {
    id: "bestoption",
    label: "Best Option",
    color: "from-teal-500 to-teal-600",
    description: "Choose the best option from choices",
    aiType: "best-option",
  },
  {
    id: "arrangeorder",
    label: "Arrange Order",
    color: "from-pink-500 to-pink-600",
    description: "Arrange sentences in correct order",
    aiType: "arrange-order", // Uncomment if AI generation is supported
  },
  {
    id: "video_pause",
    label: "Video Pause",
    color: "bg-leafGreen",
    description: "Pause video at specific timestamps and ask questions",
  },
  {
    id: "audio_pause",
    label: "Audio Pause",
    color: "from-orange-500 to-orange-600",
    description: "Pause audio at specific timestamps and ask questions",
  },

]

const PredefinedQuestionModal = ({ isOpen, onClose, onSelect }) => {
  const { quizId } = useLocation().state
  const { id, role } = useSelector((state) => state.user)
  // Pagination and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const { data: questions, isLoading } = useGetAllQuestionsWithOptionsQuery({
    search: debouncedSearchTerm,
    page: currentPage,
    limit: itemsPerPage,
  })
  const { data: assignedQuestions } = useGetPredefinedQuestionsByQuizIdQuery(quizId)
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [assignPredefinedQuestionToQuiz] = useAssignPredefinedQuestionToQuizMutation()
  const [removePredefinedQuestion] = useRemovePredefinedQuestionFromQuizMutation()
  const [initialAssignments, setInitialAssignments] = useState([])
  const [viewingQuestion, setViewingQuestion] = useState(null)
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when searching
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])
  useEffect(() => {
    if (assignedQuestions?.data) {
      const preSelectedIds = assignedQuestions.data.map((question) => question.pre_defined_question_id)
      setSelectedQuestions(preSelectedIds)
      setInitialAssignments(assignedQuestions.data)
    }
  }, [assignedQuestions])
  if (!isOpen) return null
  const handleCheckboxChange = (questionId) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };
  const handleViewQuestion = (question) => {
    setViewingQuestion(question)
  }
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }
  const handleConfirm = async () => {
    try {
      const questionsToRemove = initialAssignments.filter(
        (assignment) => !selectedQuestions.includes(assignment.pre_defined_question_id),
      )
      const initialAssignedIds = initialAssignments?.map((q) => q.pre_defined_question_id)
      const questionsToAdd = selectedQuestions.filter((id) => !initialAssignedIds.includes(id))
      for (const question of questionsToRemove) {
        try {
          await removePredefinedQuestion(question.mapping_id).unwrap()
        } catch (error) {
          console.error(`Failed to remove question ${question.id}:`, error)
          toast.error(error?.data?.error || `Failed to remove question ${question.id}`)
        }
      }
      if (questionsToAdd.length > 0) {
        const assignments = questionsToAdd?.map((questionId) => ({
          quiz_id: Number.parseInt(quizId),
          pre_defined_question_id: questionId,
          created_by: Number.parseInt(id),
          updated_by: Number.parseInt(id),
          created_by_type: role,
          updated_by_type: role,
        }))
        await assignPredefinedQuestionToQuiz(assignments).unwrap()
      }
      if (questionsToRemove.length > 0 || questionsToAdd.length > 0) {
        toast.success("Questions updated successfully!")
      } else {
        toast.success("No changes made!")
      }
      onSelect(selectedQuestions)
      onClose()
    } catch (error) {
      console.error("Error updating questions:", error)
      toast.error(error.data?.message || error?.data?.error || "Failed to update questions.")
    }
  }
  // Pagination calculations
  const totalQuestions = questions?.data?.total || 0
  const totalPages = Math.ceil(totalQuestions / itemsPerPage)
  const questionsData = questions?.data?.questions || []
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-lightGreen">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-forestGreen">Select Predefined Questions</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          {/* Search Bar */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-9 sm:pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-leafGreen focus:border-leafGreen"
              />
            </div>
          </div>
          <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-200px)]">
            {isLoading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-leafGreen mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-gray-500">Loading questions...</p>
              </div>
            ) : questionsData && questionsData.length > 0 ? (
              <>
                <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <table className="w-full min-w-full">
                    <thead className="bg-lightGreen">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQuestions(prev => {
                                  const newIds = questionsData?.map((q) => q.id).filter(id => !prev.includes(id))
                                  return [...prev, ...newIds]
                                })
                              } else {
                                setSelectedQuestions(prev =>
                                  prev.filter(id => !questionsData?.map(q => q.id).includes(id))
                                )
                              }
                            }}
                            checked={questionsData.length > 0 && questionsData.every(q => selectedQuestions.includes(q.id))}
                            className="rounded accent-leafGreen border-gray-300 w-4 h-4 sm:w-5 sm:h-5"
                          />
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Question
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                          Type
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden xs:table-cell">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {questionsData?.map((question) => {
                        const isAlreadyAssigned = initialAssignments.some(
                          (aq) => aq.pre_defined_question_id === question.id,
                        )
                        const isSelected = selectedQuestions.includes(question.id)
                        return (
                          <tr key={question.id} className="hover:bg-lightGreen/20 transition-colors duration-200">
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleCheckboxChange(question.id)}
                                className="rounded accent-leafGreen border-gray-300 w-4 h-4 sm:w-5 sm:h-5"
                              />
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900 max-w-[150px] sm:max-w-md truncate sm:truncate-none">
                                {question.question_text}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                              <span className="px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-800 rounded-full">
                                {question.question_type}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 hidden xs:table-cell">
                              {isAlreadyAssigned && (
                                <span className="px-2 py-1 text-xs font-medium bg-lightGreen text-forestGreen rounded-full">
                                  Assigned
                                </span>
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <button
                                onClick={() => handleViewQuestion(question)}
                                className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                title="View Question"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                    <div className="text-xs sm:text-sm text-gray-500">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalQuestions)} of {totalQuestions} questions
                    </div>
                    <div className="flex items-center space-x-1">
                      {/* Previous button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Prev
                      </button>
                      {/* Page numbers */}
                      {getPageNumbers().map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${currentPage === page
                            ? 'bg-leafGreen text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      {/* Next button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="text-gray-400 mb-3 sm:mb-4">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-600 mb-2">
                  {searchTerm ? 'No Questions Found' : 'No Predefined Questions Available'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
                  {searchTerm
                    ? `No questions match "${searchTerm}". Try a different search term.`
                    : 'There are no predefined questions to select from.'
                  }
                </p>
              </div>
            )}
          </div>
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
              {selectedQuestions.length} question{selectedQuestions.length !== 1 ? "s" : ""} selected
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto order-1 sm:order-2">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm bg-leafGreen text-white rounded-lg transition-colors shadow-sm"
              >
                Update Questions
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Question View Modal */}
      {viewingQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-forestGreen truncate">
                Question Preview
              </h2>
              <button
                onClick={() => setViewingQuestion(null)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">Question:</h4>
                <p className="text-gray-900 bg-gray-50 p-2 sm:p-3 rounded-lg text-sm sm:text-base">{viewingQuestion.question_text}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">Type:</h4>
                <span className="px-2 sm:px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs sm:text-sm font-medium">
                  {viewingQuestion.question_type}
                </span>
              </div>
              {viewingQuestion.options && viewingQuestion.options.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">Options:</h4>
                  <div className="space-y-2">
                    {viewingQuestion.options?.map((option, index) => (
                      <div
                        key={option.id}
                        className={`p-2 sm:p-3 rounded-lg border text-sm sm:text-base ${option.is_correct === 1
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-gray-50 border-gray-200"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {String.fromCharCode(65 + index)}. {option.option_text}
                          </span>
                          {option.is_correct === true && (
                            <span className="bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-medium">
                              Correct
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white sticky bottom-0 rounded-b-xl">
              <button
                type="button"
                onClick={() => setViewingQuestion(null)}
                className="px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-all duration-200 order-2 sm:order-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, questionType, isDeleting }) => {
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
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Delete Question</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Are you sure you want to delete this {questionType} question? This action cannot be undone.
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

const QuestionSelectionModal = ({ isOpen, onClose, currentPauseType, questionType, onSelect, questionsOfType, questionTypes, stampIndex, allStamps }) => {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [viewingQuestion, setViewingQuestion] = useState(null);

  // Get all question IDs already selected in other stamps
  const allSelectedQuestionIds = allStamps.flatMap((stamp, index) =>
    index !== stampIndex ? stamp.selectedQuestions : []
  );

  // Reset selectedQuestions to the current stamp's selection when the modal opens
  useEffect(() => {
    if (isOpen && stampIndex !== null && allStamps[stampIndex]) {
      setSelectedQuestions([...allStamps[stampIndex].selectedQuestions]);
    }
  }, [isOpen, stampIndex, allStamps]);

  const handleCheckboxChange = (questionId) => {
    // Get questions used in opposite pause type
    const oppositeQuestionType = currentPauseType === "video_pause" ? "audio_pause" : "video_pause";
    const questionsUsedInOppositeType = [];

    // Check in existing questions
    const oppositeQuestions = questionsOfType.filter(q => q.type === oppositeQuestionType);
    oppositeQuestions.forEach(question => {
      if (question[`${oppositeQuestionType}_question_ids`]) {
        question[`${oppositeQuestionType}_question_ids`].forEach(questionIds => {
          questionsUsedInOppositeType.push(...questionIds);
        });
      }
    });

    const isUsedInOppositeType = questionsUsedInOppositeType.includes(questionId);

    const questionsUsedInSameType = [];

    // Check in existing questions
    const sameQuestions = questionsOfType.filter(q => q.type === currentPauseType);
    sameQuestions.forEach(question => {
      if (question[`${currentPauseType}_question_ids`]) {
        question[`${currentPauseType}_question_ids`].forEach(questionIds => {
          questionsUsedInSameType.push(...questionIds);
        });
      }
    });

    const isUsedInSameType = questionsUsedInSameType.includes(questionId);

    if (allSelectedQuestionIds.includes(questionId)) {
      toast.error("This question is already selected in another stamp.");
      return;
    }

    if (isUsedInOppositeType) {
      toast.error(`This question is already used in ${oppositeQuestionType.replace('_', ' ')} questions.`);
      return;
    }

    if (isUsedInSameType) {
      toast.error(`This question is already used in ${currentPauseType.replace('_', ' ')} questions.`);
      return;
    }

    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleConfirm = () => {
    onSelect(selectedQuestions, stampIndex);
    onClose();
  };

  const handleViewQuestion = (question) => {
    setViewingQuestion(question);
  };

  const questionsOfSelectedType = questionsOfType
    .filter((q) => q.type === questionType && q.is_active === true);

  if (!isOpen) return null;

  const renderQuestionText = (question) => {
    if (question.type === "predefined") {
      return question.question_text || "No question text available";
    }

    switch (question.type) {
      case "mcq":
      case "idea passage":
        return question.mcq_question_text || "No question text available";
      case "complete the sentance":
        return question.mcq_question_text || "No question text available";
      case "speaking":
        return question.speaking_question || "No question text available";
      case "dragdrop":
        return question.dragdrop_prompt || "No question text available";
      case "audiotoscript":
        return question.audiotoscript_script || "No question text available";
      case "videotoscript":
        return question.videotoscript_script || "No question text available";
      case "imagetoscript":
        return question.imagetoscript_script || "No question text available";
      case "realword":
        return question.realword_words?.join(", ") || "No question text available";
      case "summarizepassage":
        return question.summarizepassage_summary || "No question text available";
      case "bestoption":
        return question.bestoption_passage || "No question text available";
      case "arrangeorder":
        return question.arrangeorder_prompt || "No question text available";
      case "video_pause":
        return `Video Pause Question with ${question.video_pause_stamps?.length || 0} timestamps`;
      case "audio_pause":
        return `Audio Pause Question with ${question.audio_pause_stamps?.length || 0} timestamps`;
      default:
        return question.question_text || "No question text available";
    }
  };

  // Helper function to render question preview
  const renderQuestionPreview = (question) => {
    switch (question.type) {
      case "predefined":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {question.question_text}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Question Type:</h4>
              <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
                {question.question_type}
              </span>
            </div>
            {question.options && question.options.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Options:</h4>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div
                      key={option.id || index}
                      className={`p-3 rounded-lg border ${option.is_correct === 1
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-gray-50 border-gray-200"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {String.fromCharCode(65 + index)}. {option.option_text}
                        </span>
                        {option.is_correct === 1 && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            Correct
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "mcq":
      case "idea passage":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.mcq_question_text}</p>
            </div>
            {question.options && question.options.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Options:</h4>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div
                      key={option.id || index}
                      className={`p-3 rounded-lg border ${option.mcq_is_correct || option.is_correct === 1
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-gray-50 border-gray-200"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {String.fromCharCode(65 + index)}. {option.mcq_option_text || option.option_text}
                        </span>
                        {(option.mcq_is_correct || option.is_correct === 1) && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            Correct
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "complete the sentance":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Question Text:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.mcq_question_text}</p>
            </div>
            {question.options && question.options.length > 0 && (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div key={option.id || index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Correct Word:</span>
                        <p className="text-green-700 font-medium">{option.complate_correct_word}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Hint:</span>
                        <p className="text-forestGreen">{option.complate_hint}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case "dragdrop":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Prompt:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.dragdrop_prompt}</p>
            </div>
            {question.dragdrop_options && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Options:</h4>
                <div className="flex flex-wrap gap-2">
                  {question.dragdrop_options.map((option, index) => (
                    <span key={index} className="px-3 py-1 bg-lightGreen text-forestGreen rounded-full text-sm">
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {question.dragdrop_blanks && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Correct Order:</h4>
                <div className="flex flex-wrap gap-2">
                  {question.dragdrop_blanks.map((blank, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {blank.correct}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "audiotoscript":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Script:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.audiotoscript_script}</p>
            </div>
          </div>
        );
      case "videotoscript":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Script:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.videotoscript_script}</p>
            </div>
          </div>
        );
      case "imagetoscript":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Description:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.imagetoscript_script}</p>
            </div>
          </div>
        );
      case "realword":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Words:</h4>
              <div className="flex flex-wrap gap-2">
                {question.realword_words?.map((word, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Correct Answers:</h4>
              <div className="flex flex-wrap gap-2">
                {question.realword_correct_answers?.map((answer, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {answer}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      case "summarizepassage":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Summary:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.summarizepassage_summary}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Time Limit:</h4>
              <span className="px-3 py-1 bg-lightGreen text-forestGreen rounded-full text-sm">
                {question.summarizepassage_time_limit} seconds
              </span>
            </div>
          </div>
        );
      case "bestoption":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Passage:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.bestoption_passage}</p>
            </div>
            {question.bestoption_blanked_words && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Blanked Words:</h4>
                <div className="flex flex-col gap-4">
                  {question.bestoption_blanked_words?.map((item, index) => (
                    <div key={index}>
                      <div className="flex flex-wrap gap-2">
                        {item.options?.map((option, optIndex) => (
                          <span
                            key={optIndex}
                            className={`px-3 py-1 rounded-full text-sm ${option === item.word ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "speaking":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.speaking_question}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Answer Script:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.speaking_answer}</p>
            </div>
          </div>
        );

      case "video_pause":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Video Pause Timestamps:</h4>
              <div className="flex flex-wrap gap-2">
                {question.video_pause_stamps?.map((stamp, index) => (
                  <span key={index} className="px-3 py-1 bg-lightGreen text-forestGreen rounded-full text-sm">
                    {stamp}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Associated Questions:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {question.video_pause_question_ids?.length || 0} questions
              </p>
            </div>
          </div>
        );

      case "audio_pause":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Audio Pause Timestamps:</h4>
              <div className="flex flex-wrap gap-2">
                {question.audio_pause_stamps?.map((stamp, index) => (
                  <span key={index} className="px-3 py-1 bg-lightGreen text-forestGreen rounded-full text-sm">
                    {stamp}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Associated Questions:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {question.audio_pause_question_ids?.length || 0} questions
              </p>
            </div>
          </div>
        );
      case "arrangeorder":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Prompt:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {question.arrangeorder_prompt}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Sentences In Correct Order:</h4>
              <ol className="list-decimal pl-4 space-y-2 bg-gray-50 p-3 rounded-lg">
                {question.sentences?.map((sentence, index) => (
                  <li key={index} className="text-gray-900">{sentence}</li>
                ))}
              </ol>
            </div>
          </div>
        );
      default:
        return <p className="text-gray-500">No content available for this question type.</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[160]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Select {questionTypes.find((t) => t.id === questionType)?.label} Questions
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {questionsOfSelectedType.length > 0 ? (
            <div className="space-y-4">
              {questionsOfSelectedType.map((question) => {
                const oppositeQuestionType = currentPauseType === "video_pause" ? "audio_pause" : "video_pause";
                const questionsUsedInOppositeType = [];
                const questionsUsedInSameType = [];

                // Check if this question is used in opposite pause type
                const oppositeQuestions = questionsOfType.filter(q => q.type === oppositeQuestionType);
                oppositeQuestions.forEach(oppQuestion => {
                  if (oppQuestion[`${oppositeQuestionType}_question_ids`]) {
                    oppQuestion[`${oppositeQuestionType}_question_ids`].forEach(questionIds => {
                      questionsUsedInOppositeType.push(...questionIds);
                    });
                  }
                });

                // Check if this question is used in opposite pause type
                const sameQuestions = questionsOfType.filter(q => q.type === currentPauseType);
                sameQuestions.forEach(sameQuestion => {
                  if (sameQuestion[`${currentPauseType}_question_ids`]) {
                    sameQuestion[`${currentPauseType}_question_ids`].forEach(questionIds => {
                      questionsUsedInSameType.push(...questionIds);
                    });
                  }
                });

                const isUsedInOppositeType = questionsUsedInOppositeType.includes(question.id);
                const isUsedInSameType = questionsUsedInSameType.includes(question.id);
                const isSelectedInOtherStamp = allSelectedQuestionIds.includes(question.id);

                return (
                  <div key={question.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => handleCheckboxChange(question.id)}
                      className="h-4 w-4 accent-leafGreen text-forestGreen"
                      disabled={isSelectedInOtherStamp || isUsedInOppositeType || isUsedInSameType}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {renderQuestionText(question)}
                      </p>
                      {(isSelectedInOtherStamp || isUsedInOppositeType || isUsedInSameType) && (
                        <p className="text-xs text-red-500 mt-1">
                          {isUsedInOppositeType
                            ? `Already used in ${oppositeQuestionType.replace('_', ' ')}`
                            : isUsedInSameType
                              ? `Already used in ${currentPauseType.replace('_', ' ')}`
                              : "Already selected in another stamp"
                          }
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewQuestion(question)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No questions available for this type.</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-leafGreen text-white rounded-lg  "
          >
            Select Questions
          </button>
        </div>
      </div>
      {/* Question Preview Modal */}
      {viewingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[170]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Question Preview</h3>
                <button
                  onClick={() => setViewingQuestion(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {renderQuestionPreview(viewingQuestion)}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setViewingQuestion(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SelectedQuestionsModal = ({ isOpen, onClose, stampIndex, stamps, questionsOfType }) => {
  if (!isOpen) return null;

  const stamp = stamps[stampIndex];
  const selectedQuestions = stamp?.selectedQuestions || [];

  // Filter questionsOfType to only include active questions
  const activeQuestionsOfType = questionsOfType.filter((q) => q.is_active === true);

  const renderQuestionText = (question) => {
    const questionType = questionTypes.find((t) => t.id === question.type)?.label;
    return (
      <div className="flex items-center gap-2">
        <p className="font-medium text-gray-800">
          {question.type === "mcq" || question.type === "idea passage"
            ? question.mcq_question_text
            : question.type === "complete the sentance"
              ? question.mcq_question_text
              : question.type === "speaking"
                ? question.speaking_question
                : question.type === "dragdrop"
                  ? question.dragdrop_prompt
                  : question.type === "audiotoscript"
                    ? question.audiotoscript_script
                    : question.type === "videotoscript"
                      ? question.videotoscript_script
                      : question.type === "imagetoscript"
                        ? question.imagetoscript_script
                        : question.type === "realword"
                          ? question.realword_words?.join(", ")
                          : question.type === "summarizepassage"
                            ? question.summarizepassage_summary
                            : question.type === "bestoption"
                              ? question.bestoption_passage
                              : question.type === "arrangeorder"
                                ? question.arrangeorder_prompt
                                : question.question_text || "No question text available"}
        </p>
        {questionType && (
          <span className="px-2 py-1 text-xs rounded-full bg-lightGreen text-forestGreen">
            {questionType}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[170]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Selected Questions</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {selectedQuestions.length > 0 ? (
            <ul className="space-y-3">
              {selectedQuestions.map((questionId) => {
                // Only render if the question is active
                const question = activeQuestionsOfType.find((q) => q.id === questionId);
                if (!question) return null;
                return (
                  <li key={questionId} className="p-3 border rounded-lg">
                    {renderQuestionText(question)}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">No questions selected for this stamp.</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const questionTypeHelp = {
  "mcq": {
    title: "Multiple Choice Question Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Multiple Choice Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Question Text:</strong> Enter the main question that students will see</li>
          <li><strong>Options:</strong> There are 4 answer choices</li>
          <li><strong>Correct Answer:</strong> Mark the checkbox for the correct option(s)</li>
          <li><strong>Marks:</strong> Set the points awarded for correct answer</li>
        </ul>
        <div class="bg-lightGreen p-3 rounded-lg border border-leafGreen/30">
          <p class="text-sm text-forestGreen"><strong>Tip:</strong> Use clear, unambiguous options and ensure only one correct answer unless it's a multiple-select question.</p>
        </div>
      </div>
    `
  },
  "complete the sentance": {
    title: "Complete the Sentence Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Complete the Sentence Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Question Text:</strong> Write your sentence with '_____' for blanks</li>
          <li><strong>Add Blank:</strong> Use the "Add Blank" button to insert blanks</li>
          <li><strong>Correct Word:</strong> Enter the exact word for each blank (no spaces allowed)</li>
          <li><strong>Hint:</strong> Optional starting characters to help students</li>
          <li><strong>Validation:</strong> Hint must match the beginning of the correct word</li>
        </ul>
        <div class="bg-green-50 p-3 rounded-lg border border-green-200">
          <p class="text-sm text-green-800"><strong>Example:</strong> "The sky is _____." → Correct word: "blue", Hint: "bl"</p>
        </div>
      </div>
    `
  },
  "speaking": {
    title: "Speaking Question Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Speaking Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Question:</strong> The prompt that students will respond to</li>
          <li><strong>Answer Script:</strong> The expected correct answer or model response</li>
          <li><strong>Image File:</strong> Optional image to accompany the question</li>
        </ul>
        <div class="bg-teal-50 p-3 rounded-lg border border-teal-200">
          <p class="text-sm text-teal-800"><strong>Note:</strong> Students will record their spoken response to practice pronunciation and fluency.</p>
        </div>
      </div>
    `
  },
  "dragdrop": {
    title: "Drag & Drop Question Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Drag & Drop Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Question Prompt:</strong> Write the text with '___' for drag targets</li>
          <li><strong>Insert Blank:</strong> Use button Insert Blank to add drag targets in your text</li>
          <li><strong>Draggable Options:</strong> Create the items students will drag</li>
          <li><strong>Correct Answers:</strong> Assign the right option to each blank</li>
        </ul>
        <div class="bg-lightGreen p-3 rounded-lg border border-leafGreen/30">
          <p class="text-sm text-forestGreen"><strong>Example:</strong> "The capital of France is ___." → Options: ["Paris", "London", "Berlin"] → Correct: "Paris"</p>
        </div>
      </div>
    `
  },
  "audiotoscript": {
    title: "Audio to Script Writing Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Audio to Script Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Audio File:</strong> Upload the audio students will transcribe</li>
          <li><strong>Text-to-Speech:</strong> Generate audio from your script text</li>
          <li><strong>Correct Script:</strong> The exact transcription of the audio</li>
        </ul>
        <div class="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <p class="text-sm text-orange-800"><strong>Note:</strong> Students listen to the audio and type what they hear to practice listening and writing skills.</p>
        </div>
      </div>
    `
  },
  "videotoscript": {
    title: "Video to Script Writing Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Video to Script Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Video File:</strong> Upload the video students will transcribe</li>
          <li><strong>Correct Script:</strong> The exact transcription of the video audio</li>
        </ul>
        <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p class="text-sm text-yellow-800"><strong>Note:</strong> Students watch the video and transcribe the dialogue or narration.</p>
        </div>
      </div>
    `
  },
  "imagetoscript": {
    title: "Image to Script Writing Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Image to Script Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Image File:</strong> Upload an image for students to describe</li>
          <li><strong>Correct Description:</strong> The model description of the image</li>
        </ul>
        <div class="bg-pink-50 p-3 rounded-lg border border-pink-200">
          <p class="text-sm text-pink-800"><strong>Note:</strong> Students view the image and write a description to practice visual interpretation and writing.</p>
        </div>
      </div>
    `
  },
  "realword": {
    title: "Real Word Question Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Real Word Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Words:</strong> Enter real and fake words separated by commas</li>
          <li><strong>Answers:</strong> Enter "yes" for real words, "no" for fake words</li>
          <li><strong>Sequence:</strong> Answers must match the word order exactly</li>
        </ul>
        <div class="bg-red-50 p-3 rounded-lg border border-red-200">
          <p class="text-sm text-red-800"><strong>Example:</strong> Words: "apple, bxrple, orange" → Answers: "yes, no, yes"</p>
        </div>
      </div>
    `
  },
  "summarizepassage": {
    title: "Summarize Passage Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Summarize Passage Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Summary:</strong> Enter the passage students need to read</li>
          <li><strong>Time Limit:</strong> Set how long students have to read and summarize</li>
        </ul>
        <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
          <p class="text-sm text-indigo-800"><strong>Note:</strong> Students read the passage and write a summary within the time limit.</p>
        </div>
      </div>
    `
  },
  "bestoption": {
    title: "Best Option Question Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Best Option Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Passage:</strong> Enter the text with vocabulary words</li>
          <li><strong>Select Words:</strong> Click words to blank them out</li>
          <li><strong>Distractors:</strong> Add incorrect options for each blanked word</li>
          <li><strong>Correct Answer:</strong> The original word is automatically included</li>
        </ul>
        <div class="bg-teal-50 p-3 rounded-lg border border-teal-200">
          <p class="text-sm text-teal-800"><strong>Note:</strong> Students choose the best word to complete each blank from the given options.</p>
        </div>
      </div>
    `
  },
  "arrangeorder": {
    title: "Arrange Order Question Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Arrange Order Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Prompt:</strong> Instructions for arranging the sentences</li>
          <li><strong>Sentences:</strong> Add sentences in the CORRECT order</li>
          <li><strong>Drag & Drop:</strong> Students will rearrange sentences into correct sequence</li>
        </ul>
        <div class="bg-pink-50 p-3 rounded-lg border border-pink-200">
          <p class="text-sm text-pink-800"><strong>Tip:</strong> Add sentences in the correct order. Students will see them shuffled and must rearrange them properly.</p>
        </div>
      </div>
    `
  },
  "video_pause": {
    title: "Video Pause Question Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Video Pause Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Video File:</strong> Upload the video that will pause at specific times</li>
          <li><strong>Pause Stamps:</strong> Add timestamps (in seconds) where video should pause</li>
          <li><strong>Associated Questions:</strong> Select questions to ask at each pause point</li>
          <li><strong>Question Types:</strong> Choose from existing MCQ, Speaking, etc. questions</li>
        </ul>
        <div class="bg-lightGreen p-3 rounded-lg border border-leafGreen/30">
          <p class="text-sm text-forestGreen"><strong>Note:</strong> Video will automatically pause at specified times to ask comprehension questions.</p>
        </div>
      </div>
    `
  },
  "audio_pause": {
    title: "Audio Pause Question Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Audio Pause Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Audio File:</strong> Upload the audio that will pause at specific times</li>
          <li><strong>Pause Stamps:</strong> Add timestamps (in seconds) where audio should pause</li>
          <li><strong>Associated Questions:</strong> Select questions to ask at each pause point</li>
          <li><strong>Question Types:</strong> Choose from existing MCQ, Speaking, etc. questions</li>
        </ul>
        <div class="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <p class="text-sm text-orange-800"><strong>Note:</strong> Audio will automatically pause at specified times to ask comprehension questions.</p>
        </div>
      </div>
    `
  },
  "predefined": {
    title: "Predefined Questions Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">Using Predefined Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Question Bank:</strong> Select from existing questions in the database</li>
          <li><strong>Search & Filter:</strong> Find questions by type, content, or keywords</li>
          <li><strong>Preview:</strong> View question details before selecting</li>
          <li><strong>Bulk Selection:</strong> Select multiple questions at once</li>
        </ul>
        <div class="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
          <p class="text-sm text-cyan-800"><strong>Tip:</strong> Save time by reusing well-crafted questions from your question bank.</p>
        </div>
      </div>
    `
  },
  "idea passage": {
    title: "Idea Passage Question Help",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">How to create Idea Passage Questions:</h4>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Passage Text:</strong> Enter the main passage or reading material</li>
          <li><strong>Comprehension Questions:</strong> Create questions based on the passage</li>
          <li><strong>Multiple Choice:</strong> Add options for each question</li>
          <li><strong>Correct Answers:</strong> Mark the correct options</li>
        </ul>
        <div class="bg-lightGreen p-3 rounded-lg border border-leafGreen/30">
          <p class="text-sm text-forestGreen"><strong>Note:</strong> These questions test reading comprehension and understanding of the main ideas in the passage.</p>
        </div>
      </div>
    `
  },
  "all": {
    title: "All Questions Overview",
    content: `
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900">Question Types Overview:</h4>
        <p class="text-gray-700">This view shows all question types available in your quiz. You can:</p>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Filter by Type:</strong> Use the dropdown to view specific question types</li>
          <li><strong>Create Questions:</strong> Click "Create" to add new questions of the selected type</li>
          <li><strong>Manage Questions:</strong> View, edit, or delete existing questions</li>
          <li><strong>Toggle Status:</strong> Activate or deactivate questions as needed</li>
        </ul>
        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <p class="text-sm text-gray-800"><strong>Tip:</strong> Use different question types to create engaging and comprehensive assessments.</p>
        </div>
      </div>
    `
  }
}

function QuizQuestion() {
  const { access_token } = getAdminToken()
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [predefinedQuestions, setPredefinedQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [selectedQuestionType, setSelectedQuestionType] = useState("all")
  const [showDropdown, setShowDropdown] = useState(false)
  const [showPredefinedModal, setShowPredefinedModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)     // ✅ new
  const [imageFile, setImageFile] = useState(null)     // ✅ new
  const [fileName, setFileName] = useState("No file selected")
  const [speakingImageFileName, setSpeakingImageFileName] = useState("No file selected")
  const [speakingImageFile, setSpeakingImageFile] = useState(null)
  const [speakingImagePreview, setSpeakingImagePreview] = useState(null)

  const [formData, setFormData] = useState({})
  const [invalidWords, setInvalidWords] = useState([]);
  const [invalidCompleteSentenceWords, setInvalidCompleteSentenceWords] = useState([]);
  const [selectedMediaType, setSelectedMediaType] = useState(null); // 'audio' | 'video' | null
  const [stamps, setStamps] = useState([
    { timestamp: "", selectedQuestions: [] }
  ]);

  const [videoPauseStampLimit, setVideoPauseStampLimit] = useState(0);
  const [audioPauseStampLimit, setAudioPauseStampLimit] = useState(0);

  const [showSelectedQuestionsModal, setShowSelectedQuestionsModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentStampIndex, setCurrentStampIndex] = useState(null);
  const [selectedQuestionTypeForModal, setSelectedQuestionTypeForModal] = useState("mcq"); // Default to MCQ

  // Add these states near your other states
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState("");
  const [audioPreview, setAudioPreview] = useState(null);

  // ✅ Video & Image Previews
  const [videoPreview, setVideoPreview] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [fileNameAudio, setFileNameAudio] = useState("No file selected");
  const [fileNameVideo, setFileNameVideo] = useState("No file selected");

  const [dragIndex, setDragIndex] = useState(null);

  const [showHelpModal, setShowHelpModal] = useState(false)
  const [currentHelpContent, setCurrentHelpContent] = useState("")

  // Help Modal Component
  const HelpModal = ({ isOpen, onClose, title, content }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[200]">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-lightGreen">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-forestGreen" />
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-leafGreen text-white rounded-lg   transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Add Help Icon Component for reusability
  const HelpIcon = ({ onClick, className = "" }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-1 text-gray-400 hover:text-forestGreen transition-colors ${className}`}
      title="Get help"
    >
      <HelpCircle className="w-4 h-4" />
    </button>
  )

  const handleAddStamp = () => {
    setStamps([...stamps, { timestamp: "", selectedQuestions: [] }]);
  };

  const handleRemoveStamp = (index) => {
    const newStamps = [...stamps];
    newStamps.splice(index, 1);
    setStamps(newStamps);
  };

  const handleStampChange = (index, field, value) => {
    const newStamps = [...stamps];
    if (field === "timestamp") {
      // Only allow numeric input
      if (value === "" || !isNaN(value)) {
        newStamps[index][field] = value;
        setStamps(newStamps);
      }
    }
  };

  const handleQuestionSelect = (selectedQuestionIds, stampIndex) => {
    if (stampIndex === null || stampIndex === undefined) {
      console.error("stampIndex is null or undefined");
      return;
    }
    if (selectedQuestionIds.length === 0) {
      toast.error("At least one question must be selected for this pause stamp.");
      return;
    }

    // Check if any selected question is inactive
    const allQuestions = [...questions, ...predefinedQuestions];
    const inactiveSelected = selectedQuestionIds.some(
      (id) => {
        const question = allQuestions.find((q) => q.id === id);
        return !question?.is_active;
      }
    );
    if (inactiveSelected) {
      toast.error("Only active questions can be selected for pause stamps.");
      return;
    }

    // Get current question type (video_pause or audio_pause)
    const currentQuestionType = formData.type;
    const oppositeQuestionType = currentQuestionType === "video_pause" ? "audio_pause" : "video_pause";

    // Get all questions already used in the opposite pause type
    const questionsUsedInOppositeType = [];

    // Check in existing questions of opposite type
    const oppositeQuestions = questions.filter(q => q.type === oppositeQuestionType);
    oppositeQuestions.forEach(question => {
      if (question[`${oppositeQuestionType}_question_ids`]) {
        question[`${oppositeQuestionType}_question_ids`].forEach(questionIds => {
          questionsUsedInOppositeType.push(...questionIds);
        });
      }
    });

    // Check in current form data if editing
    if (selectedQuestion && selectedQuestion.type === oppositeQuestionType) {
      if (selectedQuestion[`${oppositeQuestionType}_question_ids`]) {
        selectedQuestion[`${oppositeQuestionType}_question_ids`].forEach(questionIds => {
          questionsUsedInOppositeType.push(...questionIds);
        });
      }
    }

    // Check if any selected question is already used in the opposite pause type
    const conflictingQuestions = selectedQuestionIds.filter(id =>
      questionsUsedInOppositeType.includes(id)
    );

    if (conflictingQuestions.length > 0) {
      const conflictingQuestionTexts = conflictingQuestions.map(id => {
        const question = allQuestions.find(q => q.id === id);
        return question ?
          (question.mcq_question_text || question.question_text || `Question ${id}`).substring(0, 50) + '...'
          : `Question ${id}`;
      });

      toast.error(
        `The following questions are already used in ${oppositeQuestionType.replace('_', ' ')}: ${conflictingQuestionTexts.join(', ')}`
      );
      return;
    }

    // Proceed if all selected questions are active and not used in opposite pause type
    const newStamps = [...stamps];
    if (!newStamps[stampIndex]) {
      console.error(`Stamp at index ${stampIndex} is undefined`);
      return;
    }
    newStamps[stampIndex] = {
      ...newStamps[stampIndex],
      selectedQuestions: [...selectedQuestionIds],
    };
    setStamps(newStamps);
    setShowQuestionModal(false);
  };

  const extractMediaDuration = (file, type) => {
    return new Promise((resolve, reject) => {
      const mediaElement = type === "video" ? document.createElement("video") : document.createElement("audio");

      mediaElement.preload = "metadata";
      mediaElement.onloadedmetadata = () => {
        resolve(mediaElement.duration);
      };
      mediaElement.onerror = () => {
        reject(new Error("Failed to load media metadata"));
      };

      mediaElement.src = URL.createObjectURL(file);
    });
  };

  const validatePauseTimestamps = (timestamps, mediaDuration) => {
    for (const timestamp of timestamps) {
      if (parseFloat(timestamp) > mediaDuration) {
        return false;
      }
    }
    return true;
  };

  const calculateTotalMarks = (stamps, allQuestions) => {
    let totalMarks = 0;
    stamps.forEach((stamp) => {
      stamp.selectedQuestions.forEach((questionId) => {
        const question = allQuestions.find((q) => q.id === questionId);
        if (question) {
          totalMarks += question.marks || 0;
        }
      });
    });
    return totalMarks;
  };

  // Add your function inside QuizQuestion()
  const handleTextToSpeech = async () => {
    if (!formData.audiotoscript_script?.trim()) {
      toast.error("Please enter some script text first.");
      return;
    }

    setIsConverting(true);
    setConversionError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/text-to-speech`,
        { text: formData.audiotoscript_script },
        { responseType: "blob" }
      );

      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);

      const audioFileGenerated = new File([audioBlob], "generated-audio.mp3", {
        type: "audio/mpeg",
      });

      // Set in state for form submit
      setAudioFile(audioFileGenerated);
      setFileName("generated-audio.mp3");

      // Set preview so user can listen immediately
      setAudioPreview(audioUrl);

      toast.success("Audio generated successfully!");
    } catch (error) {
      console.error("Error converting text to speech:", error);
      setConversionError("Failed to convert text to audio. Please try again.");
      toast.error("Failed to convert text to audio.");
    } finally {
      setIsConverting(false);
    }
  };

  // Refs for textareas
  const completeTextareaRef = useRef(null)
  const dragdropTextareaRef = useRef(null)
  const dropdownRef = useRef(null)

  const { quizId } = useLocation().state
  const [removePredefinedQuestion] = useRemovePredefinedQuestionFromQuizMutation()

  // RTK Query hooks
  const {
    data: apiResponse,
    error: apiError,
    isLoading: apiLoading,
    refetch,
  } = useGetQuizQuestionByQuizIdQuery({ id: quizId, access_token })

  const {
    data: predefinedApiResponse,
    error: predefinedApiError,
    isLoading: predefinedApiLoading,
    refetch: refetchPredefined,
  } = useGetPredefinedQuestionsByQuizIdQuery(quizId)

  const [createQuizQuestion, { isLoading: isCreating }] = useCreateQuizQuestionMutation()
  const [updateQuizQuestion, { isLoading: isUpdating }] = useUpdateQuizQuestionMutation()
  const [deleteQuizQuestion, { isLoading: isDeleting }] = useDeleteQuizQuestionMutation()
  const [toggleQuizQuestion, { isLoading: isToggling }] = useToggleQuizQuestionMutation()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Update questions when API data is received
  useEffect(() => {
    if (apiResponse?.success && apiResponse?.data) {
      const transformedQuestions = apiResponse.data.map((question) => ({
        ...question,
        is_active: Boolean(question.is_active),
        options: question.options || undefined,
        audio_url: question.audio_url || "",  // ✅ Add
        video_url: question.video_url || "",  // ✅ Add
      }))
      setQuestions(transformedQuestions)
    }
  }, [apiResponse])

  useEffect(() => {
    if (predefinedApiResponse?.data) {
      const transformedPredefinedQuestions = predefinedApiResponse.data.map((item) => ({
        id: item.mapping_id,
        pre_defined_question_id: item.pre_defined_question_id,
        question_text: item.question_text,
        question_type: item.question_type,
        question_img: item.question_img,
        options: item.options,
        type: "predefined",
        is_active: true,
        marks: item.marks || 1, // Use item.marks if available, else default to 1
      }));
      setPredefinedQuestions(transformedPredefinedQuestions);
    }
  }, [predefinedApiResponse]);


  useEffect(() => {
    // Reset stamps when the question type changes
    if (formData.type !== "video_pause" && formData.type !== "audio_pause") {
      setStamps([{ timestamp: "", selectedQuestions: [] }]);
    }
  }, [formData.type]);


  const handleFileChange = (e, mediaType) => {  // Rename 'type' to 'mediaType' for clarity
    const file = e.target.files[0];
    if (!file) return;

    if (selectedMediaType && selectedMediaType !== mediaType) {
      toast.error(`You have already selected a ${selectedMediaType} file. You cannot select both audio and video.`);
      return;
    }

    if (mediaType === "audio") {
      setAudioFile(file);
      setFileNameAudio(file.name);
      setAudioPreview(URL.createObjectURL(file));
      setSelectedMediaType("audio");
      const audioElement = document.createElement("audio");
      audioElement.src = URL.createObjectURL(file);
      audioElement.onloadedmetadata = () => {
        setAudioPauseStampLimit(Math.floor(audioElement.duration)); // duration in seconds
      };
    } else if (mediaType === "video") {
      setVideoFile(file);
      setFileNameVideo(file.name);
      setVideoPreview(URL.createObjectURL(file));
      setSelectedMediaType("video");
      const videoElement = document.createElement("video");
      videoElement.src = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        setVideoPauseStampLimit(Math.floor(videoElement.duration)); // duration in seconds
      };
    } else if (mediaType === "image") {
      // only for handling image file in image to script
      setImageFile(file);
      setFileName(file.name);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSpeakFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSpeakingImageFile(file);
    setSpeakingImageFileName(file.name);
    setSpeakingImagePreview(URL.createObjectURL(file));
  };

  const getQuestionsByType = (type) => {
    if (type === "all") {
      return [...questions, ...predefinedQuestions]
    }
    if (type === "predefined") {
      return predefinedQuestions
    }
    return questions.filter((q) => q.type === type)
  }

  const getCurrentQuestionType = () => {
    return questionTypes.find((type) => type.id === selectedQuestionType) || questionTypes[0]
  }

  const initializeFormData = (type, question) => {
    const baseData = {
      quiz_id: Number.parseInt(quizId),
      type: type,
      marks: question?.marks || 1,
      is_active: question?.is_active ?? true,
      audio_url: question?.audio_url || "",  // ✅ Add this
      video_url: question?.video_url || "",  // ✅ Add this
    }

    switch (type) {
      case "mcq":
      case "idea passage":
        return {
          ...baseData,
          mcq_question_text: question?.mcq_question_text || "",
          mcq_options: question?.options?.map((opt) => ({
            mcq_option_text: opt.mcq_option_text || "",
            mcq_option_img: opt.mcq_option_img || "",
            mcq_is_correct: opt.mcq_is_correct || false,
          })) || [
              { mcq_option_text: "", mcq_option_img: "", mcq_is_correct: false },
              { mcq_option_text: "", mcq_option_img: "", mcq_is_correct: false },
              { mcq_option_text: "", mcq_option_img: "", mcq_is_correct: false },
              { mcq_option_text: "", mcq_option_img: "", mcq_is_correct: false },
            ],
        }
      case "complete the sentance":
        return {
          ...baseData,
          mcq_question_text: question?.mcq_question_text || "",
          complete_sentence_options:
            question?.options?.map((opt) => ({
              complate_correct_word: opt.complate_correct_word || "",
              complate_hint: opt.complate_hint || "",
            })) || [],
        }
      case "speaking":
        return {
          ...baseData,
          speaking_question: question?.speaking_question || "",
          speaking_answer: question?.speaking_answer || "",
        }
      case "dragdrop":
        return {
          ...baseData,
          dragdrop_prompt: question?.dragdrop_prompt || "",
          dragdrop_options: question?.dragdrop_options || [""],
          dragdrop_blanks: question?.dragdrop_blanks || [],
        }
      case "audiotoscript":
        return {
          ...baseData,
          audiotoscript_url: question?.audiotoscript_url || "",
          audiotoscript_script: question?.audiotoscript_script || "",
        }
      case "videotoscript": // ✅ new
        return {
          ...baseData,
          videotoscript_url: question?.videotoscript_url || "",
          videotoscript_script: question?.videotoscript_script || "",
        }
      case "imagetoscript": // ✅ new
        return {
          ...baseData,
          imagetoscript_url: question?.imagetoscript_url || "",
          imagetoscript_script: question?.imagetoscript_script || "",
        }
      case "realword":
        return {
          ...baseData,
          realword_words: question?.realword_words || [""],
          realword_correct_answers: question?.realword_correct_answers || [""],
        }
      case "summarizepassage":
        return {
          ...baseData,
          summarizepassage_summary: question?.summarizepassage_summary || "",
          summarizepassage_time_limit: question?.summarizepassage_time_limit || 10,
        }
      case "bestoption":
        return {
          ...baseData,
          bestoption_passage: question?.bestoption_passage || "",
          bestoption_blanked_words: question?.bestoption_blanked_words || [],
        }
      case "arrangeorder":
        const sentences = question?.sentences || [""];
        // let orderNumbers = sentences.map((_, i) => i + 1);
        // if (question?.correct_order) {
        //   orderNumbers = sentences.map((_, i) => question.correct_order.indexOf(i) + 1);
        // }
        return {
          ...baseData,
          sentences,
          // orderNumbers,
          arrangeorder_prompt: question?.arrangeorder_prompt || "", // ✅ Add this line
        }
      case "video_pause":
        return {
          ...baseData,
          video_pause_stamps: question?.video_pause_stamps || [],
          video_pause_question_ids: question?.video_pause_question_ids || [],
        };
      case "audio_pause":
        return {
          ...baseData,
          audio_pause_stamps: question?.audio_pause_stamps || [],
          audio_pause_question_ids: question?.audio_pause_question_ids || [],
        };
      default:
        return baseData
    }
  }

  const handleCreateQuestion = (type) => {
    if (type === "predefined") {
      setShowPredefinedModal(true); // Only open predefined modal
      return; // Exit early, do not open create modal
    }
    setFormData(initializeFormData(type));
    setStamps([{ timestamp: "", selectedQuestions: [] }]); // Reset stamps
    setShowCreateModal(true);
    setSelectedMediaType(null);
  };


  const handlePredefinedQuestionSelect = (selectedIds) => {
    refetchPredefined() // Refresh the predefined questions list
    toast.success("Predefined questions updated successfully!")
  }

  const handleUseGeneratedQuestion = (generatedQuestions) => {

    // Handle both single question and multiple questions    
    const questions = Array.isArray(generatedQuestions) ? generatedQuestions : [generatedQuestions];

    if (questions.length === 0) return;

    if (questions.length === 1) {
      // Single question - existing logic
      const question = questions[0];
      handleSingleGeneratedQuestion(question);
    } else {
      toast.success(`Creating ${questions.length} questions...`);

      // Multiple questions - create directly
      handleCreateMultipleQuestions(questions);
    }
  }

  const handleSingleGeneratedQuestion = (generatedQuestion) => {

    const type = questionTypes.find((type) => type.aiType === generatedQuestion.contentType).id
    let transformedData = initializeFormData(type)

    // Transform generated data based on question type
    switch (type) {
      case "mcq":
        transformedData = {
          ...transformedData,
          mcq_question_text: generatedQuestion.question_text || generatedQuestion.question || "",
          marks: generatedQuestion.marks || 1,
          mcq_options:
            generatedQuestion.options?.map((opt, index) => ({
              mcq_option_text: typeof opt === "string" ? opt : opt.text || "",
              mcq_option_img: "",
              mcq_is_correct:
                (typeof opt === "object" && opt.isCorrect) || index === generatedQuestion.correct_answer || false,
            })) || [],
        }
        break
      case "complete the sentance":
        transformedData = {
          ...transformedData,
          mcq_question_text: generatedQuestion.question || "",
          complete_sentence_options:
            generatedQuestion.blanks?.map((blank) => ({
              complate_correct_word: blank.word || "",
              complate_hint: blank.hint || "",
            })) || [],
        }
        break
      case "speaking":
        if (generatedQuestion.imageFile && typeof generatedQuestion.imageFile === "object") {
          let imageFile = base64ToFile(generatedQuestion.imageFile.data, generatedQuestion.imageFile.name, generatedQuestion.imageFile.type);
          setSpeakingImageFile(imageFile);
          setSpeakingImageFileName(imageFile.name);
          setSpeakingImagePreview(URL.createObjectURL(imageFile));
        }
        if (generatedQuestion.audioFile && typeof generatedQuestion.audioFile === "object") {
          let audioFile = base64ToFile(generatedQuestion.audioFile.data, generatedQuestion.audioFile.name, generatedQuestion.audioFile.type);
          setAudioFile(audioFile);
          setFileNameAudio(audioFile.name);
          setAudioPreview(URL.createObjectURL(audioFile));
          setSelectedMediaType("audio");
        }
        transformedData = {
          ...transformedData,
          speaking_question: generatedQuestion.speaking_question || "",
          speaking_answer: generatedQuestion.speaking_answer || [""],
          marks: generatedQuestion.marks || generatedQuestion.blanks?.length || 1,
        }
        break
      case "dragdrop":
        transformedData = {
          ...transformedData,
          dragdrop_prompt: generatedQuestion.prompt || "",
          dragdrop_options: generatedQuestion.options || [""],
          dragdrop_blanks: generatedQuestion.blanks || [],
          marks: generatedQuestion.marks || generatedQuestion.blanks?.length || 1,
        }
        break
      case "bestoption":
        transformedData = {
          ...transformedData,
          bestoption_passage: generatedQuestion.passage || "",
          bestoption_blanked_words:
            [...(generatedQuestion.selectedWords || [])]
              ?.sort((a, b) => a.position - b.position)
              ?.map((w) => {
                const correctWord = w.word || w.options?.[0] || "";
                const options = w.options?.includes(correctWord)
                  ? [correctWord, ...w.options.filter((opt) => opt !== correctWord)]
                  : [correctWord, ...w.options.slice(1)];
                return { ...w, options };
              }) || [],
          marks: generatedQuestion.marks || 1,
        };
        break;
      case "idea passage":
        transformedData = {
          ...transformedData,
          mcq_question_text: generatedQuestion.passage || generatedQuestion.question_text || "",
          marks: generatedQuestion.marks || 1,
          mcq_options:
            generatedQuestion.suggestedQuestions?.slice(0, 4).map((q, index) => ({
              mcq_option_text: q,
              mcq_option_img: "",
              mcq_is_correct: index === 0,
            })) || [],
        }
        break
      case "summarizepassage":
        transformedData = {
          ...transformedData,
          summarizepassage_summary: generatedQuestion.passage || generatedQuestion.summary || "",
          summarizepassage_time_limit: generatedQuestion.timeLimit || 180,
          marks: generatedQuestion.marks || 1,
        }
        break
      case "audiotoscript":
        if (generatedQuestion.audioFile && typeof generatedQuestion.audioFile === "object") {
          let audioFile = base64ToFile(generatedQuestion.audioFile.data, generatedQuestion.audioFile.name, generatedQuestion.audioFile.type);
          setAudioFile(audioFile);
          setFileNameAudio(audioFile.name);
          setAudioPreview(URL.createObjectURL(audioFile));
          setSelectedMediaType("audio");
        }
        transformedData = {
          ...transformedData,
          audiotoscript_script: generatedQuestion.script || "",
          marks: generatedQuestion.marks || 1,
        }
        break
      case "imagetoscript": // ✅ new
        // In handleUseGeneratedQuestion for image-script
        // Convert data URL to File object
        fetch(generatedQuestion.imagetoscript_image?.dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "generated-image.png", { type: blob.type });
            setImageFile(file);
            setFileName("generated-image.png");
            setImagePreview(generatedQuestion.imagetoscript_image?.dataUrl);
          });

        transformedData = {
          ...transformedData,
          imagetoscript_script: generatedQuestion.imagetoscript_script || "",
          marks: generatedQuestion.marks || 1,
        };
        break
      case "arrangeorder":
        transformedData = {
          ...transformedData,
          arrangeorder_prompt: generatedQuestion.prompt || "",
          sentences: generatedQuestion.sentences || [""],
          // orderNumbers: generatedQuestion.correct_order.map((i) => i + 1),
          marks: generatedQuestion.marks || 1,
        }
        break;
      case "realword":
        transformedData = {
          ...transformedData,
          realword_words: generatedQuestion.words || [""],
          realword_correct_answers: generatedQuestion.correct_answers || [""],
          marks: generatedQuestion.marks || generatedQuestion.correct_answers?.length || 1,
        }
        break
    }

    setFormData(transformedData)
    setShowCreateModal(true)
    toast.success("Question data populated from AI!")
  }

  // New function to create multiple questions directly
  const handleCreateMultipleQuestions = async (questions) => {
    try {
      const results = [];

      for (const [index, question] of questions.entries()) {
        try {
          const result = await createSingleQuestionDirectly(question);
          results.push({ success: true, result, index });

          // Show progress
          toast.success(`Created question ${index + 1}/${questions.length}`);

          // Small delay to avoid overwhelming the API
          if (index < questions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error creating question ${index + 1}:`, error);
          results.push({ success: false, error, index });
          toast.error(`Failed to create question ${index + 1}`);
        }
      }

      // Show summary
      const successful = results.filter(r => r.success).length;
      if (successful > 0) {
        toast.success(`Successfully created ${successful}/${questions.length} questions!`);
        refetch(); // Refresh the questions list
      }

      return results;
    } catch (error) {
      console.error("Error in batch question creation:", error);
      toast.error("Failed to create multiple questions");
    }
  }

  // Function to create a single question directly
  const createSingleQuestionDirectly = async (generatedQuestion) => {
    const type = questionTypes.find((type) => type.aiType === generatedQuestion.contentType).id;

    // Prepare form data similar to initializeFormData but for direct submission
    const baseData = {
      quiz_id: parseInt(quizId),
      type: type,
      marks: generatedQuestion.marks || 1,
      is_active: true,
    };

    let questionData = { ...baseData };
    const formData = new FormData();

    // Transform data based on question type and prepare FormData
    switch (type) {
      case "mcq":
      case "idea passage":
        questionData = {
          ...questionData,
          mcq_question_text: generatedQuestion.question_text || generatedQuestion.question || "",
          mcq_options: JSON.stringify(
            generatedQuestion.options?.map((opt, index) => ({
              mcq_option_text: typeof opt === "string" ? opt : opt.text || "",
              mcq_option_img: "",
              mcq_is_correct: (typeof opt === "object" && opt.isCorrect) || index === generatedQuestion.correct_answer || false,
            })) || []
          ),
        };
        break;

      case "complete the sentance":
        questionData = {
          ...questionData,
          mcq_question_text: generatedQuestion.question || "",
          complete_sentence_options: JSON.stringify(
            generatedQuestion.blanks?.map((blank) => ({
              complate_correct_word: blank.word || "",
              complate_hint: blank.hint || "",
            })) || []
          ),
        };
        break;

      case "speaking":
        // Handle speaking image file if present
        if (generatedQuestion.imageFile && typeof generatedQuestion.imageFile === "object") {
          const imageFile = base64ToFile(generatedQuestion.imageFile.data, generatedQuestion.imageFile.name, generatedQuestion.imageFile.type);
          formData.append("questionImg", imageFile);
        }

        // Handle audio file if present
        if (generatedQuestion.audioFile && typeof generatedQuestion.audioFile === "object") {
          const audioFile = base64ToFile(generatedQuestion.audioFile.data, generatedQuestion.audioFile.name, generatedQuestion.audioFile.type);
          formData.append("audio", audioFile);
        }

        questionData = {
          ...questionData,
          speaking_question: generatedQuestion.speaking_question || "",
          speaking_answer: generatedQuestion.speaking_answer || "",
          marks: generatedQuestion.marks || generatedQuestion.blanks?.length || 1,
        };
        break;

      case "dragdrop":
        questionData = {
          ...questionData,
          dragdrop_prompt: generatedQuestion.prompt || "",
          dragdrop_options: JSON.stringify(generatedQuestion.options || [""]),
          dragdrop_blanks: JSON.stringify(generatedQuestion.blanks || []),
          marks: generatedQuestion.marks || generatedQuestion.blanks?.length || 1,
        };
        break;

      case "bestoption":
        questionData = {
          ...questionData,
          bestoption_passage: generatedQuestion.passage || "",
          bestoption_blanked_words: JSON.stringify(
            [...(generatedQuestion.selectedWords || [])]
              ?.sort((a, b) => a.position - b.position)
              ?.map((w) => {
                const correctWord = w.word || w.options?.[0] || "";
                const options = w.options?.includes(correctWord)
                  ? [correctWord, ...w.options.filter((opt) => opt !== correctWord)]
                  : [correctWord, ...w.options.slice(1)];
                return { ...w, options };
              }) || []
          ),
          marks: generatedQuestion.marks || 1,
        };
        break;

      case "summarizepassage":
        questionData = {
          ...questionData,
          summarizepassage_summary: generatedQuestion.passage || generatedQuestion.summary || "",
          summarizepassage_time_limit: generatedQuestion.timeLimit || 180,
          marks: generatedQuestion.marks || 1,
        };
        break;

      case "audiotoscript":
        // Handle audio file if present
        if (generatedQuestion.audioFile && typeof generatedQuestion.audioFile === "object") {
          const audioFile = base64ToFile(generatedQuestion.audioFile.data, generatedQuestion.audioFile.name, generatedQuestion.audioFile.type);
          formData.append("audiotoscript", audioFile);
        }

        questionData = {
          ...questionData,
          audiotoscript_script: generatedQuestion.script || "",
          marks: generatedQuestion.marks || 1,
        };
        break;

      case "imagetoscript":
        // Handle image file if present
        if (generatedQuestion.imagetoscript_image?.dataUrl) {
          try {
            const response = await fetch(generatedQuestion.imagetoscript_image.dataUrl);
            const blob = await response.blob();
            const imageFile = new File([blob], "generated-image.png", { type: blob.type });
            formData.append("imagetoscript", imageFile);
          } catch (error) {
            console.error("Error converting image:", error);
          }
        }

        questionData = {
          ...questionData,
          imagetoscript_script: generatedQuestion.imagetoscript_script || "",
          marks: generatedQuestion.marks || 1,
        };
        break;

      case "arrangeorder":
        questionData = {
          ...questionData,
          arrangeorder_prompt: generatedQuestion.prompt || "",
          sentences: JSON.stringify(generatedQuestion.sentences || [""]),
          marks: generatedQuestion.marks || 1,
        };
        break;

      case "realword":
        questionData = {
          ...questionData,
          realword_words: JSON.stringify(generatedQuestion.words || [""]),
          realword_correct_answers: JSON.stringify(generatedQuestion.correct_answers || [""]),
          marks: generatedQuestion.marks || generatedQuestion.correct_answers?.length || 1,
        };
        break;
    }

    // Append all question data to FormData
    Object.keys(questionData).forEach(key => {
      if (key == "is_active") {
        formData.append("is_active", 1);
      } else if (questionData[key] !== null && questionData[key] !== undefined) {
        formData.append(key, questionData[key]);
      }
    });

    try {
      // Make API call
      const result = await createQuizQuestion({
        questionData: formData,
        access_token,
      }).unwrap();

      return result;
    } catch (error) {
      toast.error(error.data?.message || error?.data?.error || "Error Creating Quiz Question.")
    }

  }

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question)
    setFormData(initializeFormData(question.type, question))

    if (question.type !== "video_pause" && question.type !== "audio_pause") {
      setStamps([{ timestamp: "", selectedQuestions: [] }]);
    } else {
      // Set stamps for video_pause or audio_pause
      const stampsFromQuestion = question[`${question.type}_stamps`]?.map((stamp, index) => ({
        timestamp: stamp,
        selectedQuestions: question[`${question.type}_question_ids`]?.[index] || [],
      })) || [{ timestamp: "", selectedQuestions: [] }];
      setStamps(stampsFromQuestion);
    }

    // Set selectedMediaType based on existing files
    if (question.audio_url) {
      setSelectedMediaType("audio");
    } else if (question.video_url) {
      setSelectedMediaType("video");
    } else {
      setSelectedMediaType(null); // Reset to null if no file is selected
    }

    // Set stamps state if editing a video_pause question
    // if (question.type === "video_pause") {
    //   const stampsFromQuestion = question.video_pause_stamps?.map((stamp, index) => ({
    //     timestamp: stamp,
    //     selectedQuestions: question.video_pause_question_ids?.[index] || [],
    //   })) || [{ timestamp: "", selectedQuestions: [] }];
    //   setStamps(stampsFromQuestion);
    // }

    // if (question.type === "audio_pause") {
    //   const stampsFromQuestion = question.audio_pause_stamps?.map((stamp, index) => ({
    //     timestamp: stamp,
    //     selectedQuestions: question.audio_pause_question_ids?.[index] || [],
    //   })) || [{ timestamp: "", selectedQuestions: [] }];
    //   setStamps(stampsFromQuestion);
    // }

    if (question.type === "speaking" && question.question_img) {
      const existingFileUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.question_img}`;
      setSpeakingImagePreview(existingFileUrl);
      setSpeakingImageFileName(question.question_img.split("/").pop()); // just the file name
      setSpeakingImageFile(null); // No actual file until user uploads or generates new
    }

    if (question.type === "audiotoscript" && question.audiotoscript_url) {
      const existingFileUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audiotoscript_url}`;
      setAudioPreview(existingFileUrl);
      setFileName(question.audiotoscript_url.split("/").pop()); // just the file name
      setAudioFile(null); // No actual file until user uploads or generates new
    }

    // ✅ Video to Script
    if (question.type === "videotoscript" && question.videotoscript_url) {
      const existingFileUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.videotoscript_url}`;
      setVideoPreview(existingFileUrl); // <-- you'll need a new state: const [videoPreview, setVideoPreview] = useState(null)
      setFileName(question.videotoscript_url.split("/").pop());
      setVideoFile(null); // <-- add state: const [videoFile, setVideoFile] = useState(null)
    }

    // ✅ Image to Script
    if (question.type === "imagetoscript" && question.imagetoscript_url) {
      const existingFileUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.imagetoscript_url}`;
      setImagePreview(existingFileUrl); // <-- add state: const [imagePreview, setImagePreview] = useState(null)
      setFileName(question.imagetoscript_url.split("/").pop());
      setImageFile(null); // <-- add state: const [imageFile, setImageFile] = useState(null)
    }

    // Existing type-specific logic remains, but add this generic block at the end:
    if (question.type !== "audiotoscript" && question.type !== "videotoscript") {
      if (question.audio_url) {
        const existingAudioUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`;
        setAudioPreview(existingAudioUrl);
        setFileNameAudio(question.audio_url.split("/").pop());
        setAudioFile(null);
        const audioElement = document.createElement("audio");
        audioElement.src = existingAudioUrl;
        audioElement.onloadedmetadata = () => {
          setAudioPauseStampLimit(Math.floor(audioElement.duration)); // duration in seconds
        };
      }
      if (question.video_url) {
        const existingVideoUrl = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`;
        setVideoPreview(existingVideoUrl);

        // Create video element to get duration
        const videoElement = document.createElement("video");
        videoElement.src = existingVideoUrl;

        videoElement.onloadedmetadata = () => {
          setVideoPauseStampLimit(Math.floor(videoElement.duration)); // set duration in seconds
        };

        setFileNameVideo(question.video_url.split("/").pop());
        setVideoFile(null);
      }
    }

    setShowEditModal(true)
  }

  const handleViewQuestion = (question) => {
    setSelectedQuestion(question)
    setShowViewModal(true)
  }

  const handleDeleteQuestion = (question) => {
    setQuestionToDelete(question)
    setShowDeleteModal(true)
  }

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return

    try {
      let result;
      if (questionToDelete.type === "predefined") {
        result = await removePredefinedQuestion(questionToDelete.id).unwrap()
      } else {
        result = await deleteQuizQuestion({
          id: questionToDelete.id,
          access_token,
        }).unwrap()
      }

      if (result.success) {
        refetch()
        setShowDeleteModal(false)
        setQuestionToDelete(null)
        setShowViewModal(false)
        toast.success("Question deleted successfully!")
      }
    } catch (error) {
      console.error("Error deleting question:", error)
      toast.error(error.data?.message || error?.data?.error || "Failed to delete question. Please try again.")
    }
  }

  const handleToggleQuestion = async (questionId) => {
    try {
      const result = await toggleQuizQuestion({
        id: questionId,
        access_token,
      }).unwrap()

      if (result.success) {
        refetch()
        toast.success("Question status updated successfully!")
      }
    } catch (error) {
      console.error("Error toggling question:", error)
      toast.error(error?.data?.error || "Failed to update question status. Please try again.")
    }
  }

  // Helper functions for Complete the Sentence
  const handleInsertBlankComplete = () => {
    const textarea = completeTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = formData.mcq_question_text.slice(0, start) + "_____" + formData.mcq_question_text.slice(end)

    const newBlanks = [...(formData.complete_sentence_options || []), { complate_correct_word: "", complate_hint: "" }]
    setFormData({ ...formData, mcq_question_text: newValue, complete_sentence_options: newBlanks })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 5, start + 5)
    }, 0)
  }

  const handleBlankChange = (index, field, value) => {
    const updated = [...formData.complete_sentence_options]
    updated[index][field] = value

    // Validate correct word (no spaces) for complete sentence questions
    if (field === "complate_correct_word") {
      const hasSpaces = /\s/.test(value)

      // Update the invalid words list
      setInvalidCompleteSentenceWords(prev => {
        const newInvalid = [...prev]
        if (hasSpaces) {
          if (!newInvalid.includes(index)) {
            newInvalid.push(index)
          }
        } else {
          const indexToRemove = newInvalid.indexOf(index)
          if (indexToRemove > -1) {
            newInvalid.splice(indexToRemove, 1)
          }
        }
        return newInvalid
      })

      // If hint exists, validate that it starts with the characters from correct word
      if (updated[index].complate_hint) {
        const hint = updated[index].complate_hint
        if (hint && value && !value.startsWith(hint)) {
          updated[index].complate_hint = ""
        }
      }
    }

    // If field is "complate_hint", make sure it doesn't exceed the length of the correct word
    // and ensure the hint is a prefix of the correct word
    if (field === "complate_hint" && updated[index].complate_correct_word) {
      const correctWord = updated[index].complate_correct_word

      // Ensure hint isn't longer than correct word
      if (value.length > correctWord.length) {
        value = value.slice(0, correctWord.length)
      }

      // Ensure hint is a prefix of correct word
      if (value && correctWord && !correctWord.startsWith(value)) {
        value = ""
        toast.error("Hint must be the starting characters of the correct word")
      }
    }

    updated[index][field] = value
    setFormData({ ...formData, complete_sentence_options: updated })
  }

  // Helper functions for Drag Drop
  const handleInsertBlankDragDrop = () => {
    const textarea = dragdropTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = formData.dragdrop_prompt.slice(0, start) + "___" + formData.dragdrop_prompt.slice(end)

    setFormData({ ...formData, dragdrop_prompt: newValue })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 3, start + 3)
    }, 0)
  }

  const handleDragDropOptionChange = (index, value) => {
    const newOptions = [...formData.dragdrop_options]
    newOptions[index] = value
    setFormData({ ...formData, dragdrop_options: newOptions })
  }

  const handleAddDragDropOption = () => {
    setFormData({ ...formData, dragdrop_options: [...formData.dragdrop_options, ""] })
  }

  const handleRemoveDragDropOption = (index) => {
    const newOptions = [...formData.dragdrop_options]
    newOptions.splice(index, 1)
    setFormData({ ...formData, dragdrop_options: newOptions })
  }

  const setOptionForBlank = (blankIndex, optionValue) => {
    const newBlanks = [...formData.dragdrop_blanks]
    newBlanks[blankIndex] = {
      position: blankIndex + 1, // keep 1-based position
      correct: optionValue
    };
    setFormData({ ...formData, dragdrop_blanks: newBlanks })
  }

  function replaceNthOccurrence(str, search, replace, nth) {
    let count = 0;
    return str.replace(new RegExp(search, 'g'), match => {
      count++;
      return count === nth ? replace : match;
    });
  }

  const recalculatePositions = (words, passageWords) => {
    return words
      .sort((a, b) => {
        return passageWords.indexOf(a.word) - passageWords.indexOf(b.word);
      })
      .map((w, index) => ({ ...w, position: index + 1 }));
  };

  const handleWordSelection = ({ word }) => {
    const current = formData.bestoption_blanked_words || [];
    const passageWords = getDisplayPassage().split(/\s+/);

    const exists = current.find((w) => w.word === word);

    if (exists) {
      // Remove existing
      const filtered = current.filter((w) => w.word !== word);

      // Recalculate positions for remaining words
      const updatedList = recalculatePositions(filtered, passageWords);

      const restoredPassage = replaceNthOccurrence(
        formData.bestoption_passage,
        "____",
        exists.word,
        exists.position
      );

      setFormData(prev => ({
        ...prev,
        bestoption_passage: restoredPassage,
        bestoption_blanked_words: updatedList
      }));
    } else {
      // Add new
      const newWord = { word, options: [word] };
      const updated = [...current, newWord];

      // Recalculate correct order
      const recalculated = recalculatePositions(updated, passageWords);

      // Add blank back in passage
      const updatedPassage = replaceNthOccurrence(
        formData.bestoption_passage,
        word,
        "____",
        1
      );

      setFormData(prev => ({
        ...prev,
        bestoption_passage: updatedPassage,
        bestoption_blanked_words: recalculated
      }));
    }
  };

  const getDisplayPassage = () => {
    let display = formData.bestoption_passage;
    const blanks = formData.bestoption_blanked_words || [];

    blanks.forEach((obj) => {
      display = display.replace("____", obj.word);
    });

    return display;
  };

  const handlePassageChange = (value) => {
    const words = value.split(/(\s+)/).map(w => w.trim().replace(/[^\w'-]/g, "")).filter(Boolean);

    const updatedBlanks = (formData.bestoption_blanked_words || []).filter(
      (obj) => words.includes(obj.word)
    );

    setFormData({
      ...formData,
      bestoption_passage: value,
      bestoption_blanked_words: updatedBlanks,
    });
  };

  const handleAddDistractor = (wordIndex, distractor) => {
    if (!distractor.trim()) return

    const updated = formData.bestoption_blanked_words.map((wordObj, index) => {
      if (index === wordIndex) {
        const newOptions = [...wordObj.options]
        if (!newOptions.includes(distractor.trim())) {
          newOptions.push(distractor.trim())
        }
        return {
          ...wordObj,
          options: newOptions,
        }
      }
      return { ...wordObj, options: [...wordObj.options] }
    })

    setFormData((prev) => ({
      ...prev,
      bestoption_blanked_words: updated,
    }))
  }

  const handleRemoveDistractor = (wordIndex, optionIndex) => {
    const updated = formData.bestoption_blanked_words.map((wordObj, index) => {
      if (index === wordIndex) {
        return {
          ...wordObj,
          options: wordObj.options.filter((_, idx) => idx !== optionIndex || idx === 0),
        }
      }
      return { ...wordObj, options: [...wordObj.options] }
    })

    setFormData((prev) => ({
      ...prev,
      bestoption_blanked_words: updated,
    }))
  }

  // State for touch dragging
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [touchY, setTouchY] = useState(0);
  const [touchPreview, setTouchPreview] = useState({ text: "", x: 0, y: 0, visible: false });

  const handleTouchStart = (e, index) => {
    // Only proceed if dragging from the grip handle
    const isGripHandle = e.currentTarget.classList.contains('cursor-move');
    if (!isGripHandle) return;

    setDraggedIndex(index);
    setTouchY(e.touches[0].clientY);

    // Create preview element
    const touch = e.touches[0];
    const text = formData.sentences[index] || `Sentence ${index + 1}`;

    setTouchPreview({
      text: text,
      x: touch.clientX,
      y: touch.clientY,
      visible: true
    });

    // Visual feedback - make the entire row semi-transparent
    const row = e.currentTarget.parentElement;
    if (row) {
      row.style.opacity = '0.6';
      row.style.backgroundColor = '#f9fafb'; // Optional: add background color
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchMove = (e) => {
    if (draggedIndex === null) return;

    const touch = e.touches[0];

    // Update preview position
    setTouchPreview(prev => ({
      ...prev,
      x: touch.clientX,
      y: touch.clientY
    }));

    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchEnd = (e) => {
    if (draggedIndex === null) return;

    const touch = e.changedTouches[0];
    const endY = touch.clientY;

    // Find the target index based on position
    const rows = document.querySelectorAll('.draggable-item');
    let targetIndex = draggedIndex;

    rows.forEach((row, index) => {
      const rect = row.getBoundingClientRect();
      const rowMiddle = rect.top + rect.height / 2;

      if (endY < rowMiddle && index < draggedIndex) {
        targetIndex = index;
      } else if (endY > rowMiddle && index > draggedIndex) {
        targetIndex = index;
      }
    });

    if (targetIndex !== draggedIndex) {
      // Reorder the sentences
      const newSentences = [...formData.sentences];
      const [movedSentence] = newSentences.splice(draggedIndex, 1);
      newSentences.splice(targetIndex, 0, movedSentence);

      // Update your form data
      setFormData(prev => ({
        ...prev,
        sentences: newSentences
      }));
    }

    // Reset styles for all rows
    rows.forEach(row => {
      row.style.opacity = '1';
      row.style.backgroundColor = '';
    });

    setDraggedIndex(null);
    setTouchY(0);
    setTouchPreview({ text: "", x: 0, y: 0, visible: false });

    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    const newSentences = [...formData.sentences];
    const [movedItem] = newSentences.splice(dragIndex, 1);
    newSentences.splice(dropIndex, 0, movedItem);

    setFormData({ ...formData, sentences: newSentences });
    setDragIndex(null);
  };

  // Helper functions for Arrange Order
  const handleSentenceChange = (index, value) => {
    const newSentences = [...formData.sentences];
    newSentences[index] = value;
    setFormData({ ...formData, sentences: newSentences });
  };

  const handleAddSentence = () => {
    setFormData({
      ...formData,
      sentences: [...formData.sentences, ""],
      // orderNumbers: [...formData.orderNumbers, formData.sentences.length + 1],
    });
  };

  const handleRemoveSentence = (index) => {
    const newSentences = formData.sentences.filter((_, i) => i !== index);
    // const newOrderNumbers = formData.orderNumbers.filter((_, i) => i !== index);
    // setFormData({ ...formData, sentences: newSentences, orderNumbers: newOrderNumbers });
    setFormData({ ...formData, sentences: newSentences });
  };

  const handleOrderNumberChange = (index, value) => {
    const newOrderNumbers = [...formData.orderNumbers];
    newOrderNumbers[index] = value;
    setFormData({ ...formData, orderNumbers: newOrderNumbers });
  };

  // Track blank count for drag drop and update blanks array
  useEffect(() => {
    if (formData.type === "dragdrop" && formData.dragdrop_prompt) {
      const blankCount = (formData.dragdrop_prompt.match(/___/g) || []).length
      if (blankCount > (formData.dragdrop_blanks?.length || 0)) {
        const newBlanks = [...(formData.dragdrop_blanks || [])]
        for (let i = formData.dragdrop_blanks?.length || 0; i < blankCount; i++) {
          newBlanks.push("")
        }
        setFormData({ ...formData, dragdrop_blanks: newBlanks })
      } else if (blankCount < (formData.dragdrop_blanks?.length || 0)) {
        const newBlanks = (formData.dragdrop_blanks || []).slice(0, blankCount)
        setFormData({ ...formData, dragdrop_blanks: newBlanks })
      }
    }
  }, [formData.dragdrop_prompt, formData.type])

  // Track blank count for complete sentence and update blanks array
  useEffect(() => {
    if (formData.type === "complete the sentance" && formData.mcq_question_text) {
      const blankCount = (formData.mcq_question_text.match(/_____/g) || []).length
      if (blankCount !== (formData.complete_sentence_options?.length || 0)) {
        const currentBlanks = formData.complete_sentence_options || []
        if (blankCount > currentBlanks.length) {
          const newBlanks = [...currentBlanks]
          for (let i = currentBlanks.length; i < blankCount; i++) {
            newBlanks.push({ complate_correct_word: "", complate_hint: "" })
          }
          setFormData({ ...formData, complete_sentence_options: newBlanks })
        } else if (blankCount < currentBlanks.length) {
          const newBlanks = currentBlanks.slice(0, blankCount)
          setFormData({ ...formData, complete_sentence_options: newBlanks })
        }
      }
    }
  }, [formData.mcq_question_text, formData.type])

  useEffect(() => {
    if (formData.type === "video_pause" || formData.type === "audio_pause") {
      const allQuestions = [...questions, ...predefinedQuestions];
      const totalMarks = calculateTotalMarks(stamps, allQuestions);
      setFormData((prev) => ({
        ...prev,
        marks: totalMarks,
        video_pause_stamps: formData.type === "video_pause" ? stamps.map((stamp) => stamp.timestamp) : prev.video_pause_stamps || [],
        video_pause_question_ids: formData.type === "video_pause" ? stamps.map((stamp) => [...stamp.selectedQuestions]) : prev.video_pause_question_ids || [],
        audio_pause_stamps: formData.type === "audio_pause" ? stamps.map((stamp) => stamp.timestamp) : prev.audio_pause_stamps || [],
        audio_pause_question_ids: formData.type === "audio_pause" ? stamps.map((stamp) => [...stamp.selectedQuestions]) : prev.audio_pause_question_ids || [],
      }));
    }
  }, [stamps, formData.type, questions, predefinedQuestions]);

  const normalize = (text) => text.trim().toLowerCase()

  const handleSubmitForm = async (e) => {
    e.preventDefault()

    // Validate complete sentence questions
    if (formData.type === "complete the sentance") {
      // Check for spaces in correct words
      if (invalidCompleteSentenceWords.length > 0) {
        toast.error("Correct words cannot contain spaces. Please fix the highlighted fields.")
        return
      }

      // Check for empty blanks or words
      const emptyBlanks = formData.complete_sentence_options?.findIndex(
        option => !option.complate_correct_word.trim()
      )

      if (emptyBlanks !== -1) {
        toast.error(`Please fill in a correct word for blank #${emptyBlanks + 1}`)
        return
      }

      // Validate that hints (if provided) are valid prefixes of correct words
      const invalidHint = formData.complete_sentence_options?.findIndex(
        option => option.complate_hint && !option.complate_correct_word.startsWith(option.complate_hint)
      )

      if (invalidHint !== -1) {
        toast.error(`Hint for blank #${invalidHint + 1} must be the starting characters of the correct word.`)
        return
      }
    }

    // Validate arrangeorder questions
    if (formData.type === "arrangeorder") {
      const n = formData.sentences.length;
      if (n < 2) {
        toast.error("At least 2 sentences are required for arrange order questions.");
        return;
      }
    }

    // Validate pause timestamps for video_pause and audio_pause
    if (formData.type === "video_pause" || formData.type === "audio_pause") {
      // 1. Check if at least one pause stamp is provided
      if (stamps.length === 0) {
        toast.error("At least one pause stamp is required.");
        return;
      }

      // 2. Check if all pause stamps are valid numbers
      const invalidStamps = stamps.some((stamp) => isNaN(stamp.timestamp) || stamp.timestamp <= 0);
      if (invalidStamps) {
        toast.error("All pause stamps must be valid numbers greater than 0.");
        return;
      }

      // 3. Check if at least one question is selected for each stamp
      const stampsWithNoQuestions = stamps.some((stamp) => stamp.selectedQuestions.length === 0);
      if (stampsWithNoQuestions) {
        toast.error("At least one question must be selected for each pause stamp.");
        return;
      }

      // 4. Check if a media file is uploaded
      const hasMediaFile = formData.type === "video_pause"
        ? (videoFile || selectedQuestion?.video_pause_url)
        : (audioFile || selectedQuestion?.audio_pause_url);

      if (!hasMediaFile) {
        toast.error("A media file (video/audio) is required.");
        return;
      }

      // 5. Check if pause stamps are within media duration (only for new files)
      try {
        const mediaFile = formData.type === "video_pause" ? videoFile : audioFile;

        if (mediaFile) {
          const mediaDuration = await extractMediaDuration(mediaFile, formData.type === "video_pause" ? "video" : "audio");
          const invalidTimestamps = stamps.some((stamp) => parseFloat(stamp.timestamp) > mediaDuration);
          if (invalidTimestamps) {
            toast.error("One or more pause timestamps exceed the media duration.");
            return;
          }
        }

        // 6. Check if any selected questions are already used in the opposite pause type
        const oppositeQuestionType = formData.type === "video_pause" ? "audio_pause" : "video_pause";
        const questionsUsedInOppositeType = [];

        // Check in existing questions
        const oppositeQuestions = questions.filter(q => q.type === oppositeQuestionType);
        oppositeQuestions.forEach(question => {
          if (question[`${oppositeQuestionType}_question_ids`]) {
            question[`${oppositeQuestionType}_question_ids`].forEach(questionIds => {
              questionsUsedInOppositeType.push(...questionIds);
            });
          }
        });

        // Also check in predefined questions if they have pause question IDs
        const oppositePredefinedQuestions = predefinedQuestions.filter(q => q.type === oppositeQuestionType);
        oppositePredefinedQuestions.forEach(question => {
          if (question[`${oppositeQuestionType}_question_ids`]) {
            question[`${oppositeQuestionType}_question_ids`].forEach(questionIds => {
              questionsUsedInOppositeType.push(...questionIds);
            });
          }
        });

        const conflictingQuestions = stamps.flatMap(stamp =>
          stamp.selectedQuestions.filter(id => questionsUsedInOppositeType.includes(id))
        );

        if (conflictingQuestions.length > 0) {
          const conflictingCount = conflictingQuestions.length;
          toast.error(`${conflictingCount} question${conflictingCount > 1 ? 's' : ''} already used in ${oppositeQuestionType.replace('_', ' ')}. Please remove them.`);
          return;
        }
      } catch (error) {
        console.error("Error validating pause stamps:", error);
        toast.error("Failed to validate pause stamps. Please try again.");
        return;
      }
    }

    const payload = new FormData()

    // Add common fields
    payload.append("quiz_id", formData.quiz_id)
    payload.append("type", formData.type)
    payload.append("marks", formData.marks)
    payload.append("is_active", formData.is_active ? 1 : 0)

    // Handle media files for non-audio/video script types
    if (formData.type !== "audiotoscript" && formData.type !== "videotoscript") {
      if (audioFile) {
        payload.append("audio", audioFile);
      } else if (formData.audio_url) {
        payload.append("existing_audio", formData.audio_url);
      }
      if (videoFile) {
        payload.append("video", videoFile);
      } else if (formData.video_url) {
        payload.append("existing_video", formData.video_url);
      }
    }

    // Handle different question types
    if (formData.type === "complete the sentance") {
      const blankCount = (formData.mcq_question_text.match(/_____/g) || []).length

      if (blankCount !== formData.complete_sentence_options.length) {
        toast.error("Mismatch between number of blanks and answers provided.")
        return
      }

      // validate correct word vs hint length
      const invalidOption = formData.complete_sentence_options.find(opt => {
        const correctWordLength = opt.complate_correct_word?.trim().length || 0
        const hintLength = opt.complate_hint?.trim().length || 0
        return correctWordLength <= hintLength
      })

      if (invalidOption) {
        toast.error("Correct word must be longer than the hint.")
        return
      }

      payload.append("mcq_question_text", formData.mcq_question_text)
      payload.append("complete_sentence_options", JSON.stringify(formData.complete_sentence_options))
    } else if (formData.type === "speaking") {
      if (!formData.speaking_question || !formData.speaking_answer) {
        toast.error(`Question And Answer is required in Speaking`)
        return
      }
      if (speakingImageFile) {
        payload.append("questionImg", speakingImageFile);
      } else if (selectedQuestion?.question_img) {
        payload.append("existing_question_img", selectedQuestion.question_img);
      }
      payload.append("speaking_question", formData.speaking_question)
      payload.append("speaking_answer", formData.speaking_answer)
    } else if (formData.type === "dragdrop") {
      const blankCount = (formData.dragdrop_prompt.match(/___/g) || []).length

      if (!(blankCount > 0)) {
        toast.error(`Prompt has atleast one Blank`)
        return
      }

      if (blankCount !== formData.dragdrop_blanks.filter(blank => typeof blank === "string" ? blank?.trim() : blank).length) {
        toast.error(`Prompt has ${blankCount} blanks but you've defined ${formData.dragdrop_blanks.filter(blank => typeof blank === "string" ? blank?.trim() : blank).length} answers`)
        return
      }
      payload.append("dragdrop_prompt", formData.dragdrop_prompt)
      payload.append("dragdrop_options", JSON.stringify(formData.dragdrop_options.filter((opt) => opt.trim())))
      payload.append("dragdrop_blanks", JSON.stringify(formData.dragdrop_blanks))
    } else if (formData.type === "bestoption") {
      if (formData.bestoption_blanked_words.length === 0) {
        toast.error("Please select at least one word to blank out.")
        return
      }

      const incompleteWords = formData.bestoption_blanked_words.filter((wordObj) => wordObj.options.length < 2)
      if (incompleteWords.length > 0) {
        toast.error("Each blanked word must have at least one distractor option.")
        return
      }

      const tokens = formData.bestoption_passage.split(/(\s+)/)
      const modifiedTokens = tokens.map((token) => {
        const cleanWord = token.trim().replace(/[^\w'-]/g, "")
        if (cleanWord && formData.bestoption_blanked_words.some((w) => w.word === cleanWord)) {
          const match = token.match(/^([a-zA-Z0-9'-]+)(\W*)$/)
          const wordPart = match?.[1] || token
          const punctPart = match?.[2] || ""
          return "____" + punctPart
        }
        return token
      })

      const passageWithBlanks = modifiedTokens.join("")
      payload.append("bestoption_passage", passageWithBlanks)
      payload.append("bestoption_blanked_words", JSON.stringify(formData.bestoption_blanked_words))
    } else if (formData.type === "mcq" || formData.type === "idea passage") {
      const optionTexts = formData.mcq_options.map(opt => normalize(opt.mcq_option_text))
      const hasDuplicateOptions = new Set(optionTexts).size !== optionTexts.length
      if (hasDuplicateOptions) {
        toast.error("Duplicate options are not allowed.")
        return
      }

      const hasCorrectOption = formData.mcq_options.some((opt) => opt.mcq_is_correct === true || opt.mcq_is_correct === 1)
      if (!hasCorrectOption) {
        toast.error("Please mark at least one option as correct.")
        return
      }

      payload.append("mcq_question_text", formData.mcq_question_text)
      payload.append("mcq_options", JSON.stringify(formData.mcq_options))
    } else if (formData.type === "realword") {
      if (invalidWords.length > 0) {
        toast.error("Only 'yes' or 'no' allowed in answers.");
        return;
      }

      const wordCount = formData.realword_words?.length || 0;
      const answerCount = formData.realword_correct_answers?.length || 0;

      if (wordCount !== answerCount) {
        toast.error("Number of words and answers must match.");
        return;
      }

      payload.append("realword_words", JSON.stringify(formData.realword_words));
      payload.append("realword_correct_answers", JSON.stringify(formData.realword_correct_answers));
    } else if (formData.type === "arrangeorder") {
      const sentences = formData.sentences.map(sentence => normalize(sentence))
      const hasDuplicateSentences = new Set(sentences).size !== sentences.length
      if (hasDuplicateSentences) {
        toast.error("Duplicate sentences are not allowed.")
        return
      }

      payload.append("sentences", JSON.stringify(formData.sentences.filter(s => s.trim())));
      payload.append("arrangeorder_prompt", formData.arrangeorder_prompt || "");
    } else if (formData.type === "video_pause") {
      if (videoFile) {
        payload.append("videopause", videoFile);
      } else if (selectedQuestion?.video_pause_url) {
        payload.append("existing_videopause", selectedQuestion.video_pause_url);
      }
      payload.append("video_pause_stamps", JSON.stringify(stamps.map(stamp => stamp.timestamp)));
      payload.append("video_pause_question_ids", JSON.stringify(stamps.map(stamp => stamp.selectedQuestions)));
    } else if (formData.type === "audio_pause") {
      if (audioFile) {
        payload.append("audiopause", audioFile);
      } else if (selectedQuestion?.audio_pause_url) {
        payload.append("existing_audiopause", selectedQuestion.audio_pause_url);
      }
      payload.append("audio_pause_stamps", JSON.stringify(stamps.map(stamp => stamp.timestamp)));
      payload.append("audio_pause_question_ids", JSON.stringify(stamps.map(stamp => stamp.selectedQuestions)));
    } else {
      // Handle other question types
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && key !== "quiz_id" && key !== "type" && key !== "marks" && key !== "is_active") {
          let value = formData[key]
          if (typeof value === "boolean") {
            value = value ? 1 : 0
          } else if (Array.isArray(value)) {
            value = JSON.stringify(value)
          }
          payload.append(key, value)
        }
      })

      if (formData.type === "audiotoscript") {
        if (audioFile) {
          payload.append("audiotoscript", audioFile);
        } else if (selectedQuestion?.audiotoscript_url) {
          payload.append("existing_audiotoScript", selectedQuestion.audiotoscript_url);
        }
      } else if (formData.type === "videotoscript") {
        if (videoFile) {
          payload.append("videotoscript", videoFile);
        } else if (selectedQuestion?.videotoscript_url) {
          payload.append("existing_videotoscript", selectedQuestion.videotoscript_url);
        }
      } else if (formData.type === "imagetoscript") {
        if (imageFile) {
          payload.append("imagetoscript", imageFile);
        } else if (selectedQuestion?.imagetoscript_url) {
          payload.append("existing_imagetoscript", selectedQuestion.imagetoscript_url);
        }
      }
    }

    try {
      if (showEditModal && selectedQuestion) {
        const result = await updateQuizQuestion({
          id: selectedQuestion.id,
          questionData: payload,
          access_token,
        }).unwrap()
        if (result.success) {
          setShowEditModal(false)
          refetch()
          toast.success("Question updated successfully!")
        }
      } else {
        const result = await createQuizQuestion({
          questionData: payload,
          access_token,
        }).unwrap()
        if (result.success) {
          setShowCreateModal(false)
          refetch()
          toast.success("Question created successfully!")
        }
      }

      // Reset form state
      setFormData({})
      setSelectedQuestion(null)
      setFileName("No file selected")
      setVideoPreview(null)
      setImagePreview(null)
      setVideoFile(null)
      setImageFile(null)
      setAudioPreview(null)
      setAudioFile(null)
      setSpeakingImageFile(null)
      setSpeakingImageFileName(null)
      setSpeakingImagePreview(null)
      setFileNameAudio("No file selected")
      setFileNameVideo("No file selected")
      setSelectedMediaType(null)
      setStamps([{ timestamp: "", selectedQuestions: [] }])

    } catch (error) {
      console.error("Error submitting form:", error)
      const errorMessage = error?.data?.error || error?.data?.message || "Failed to save question"
      toast.error(errorMessage)
    }
  }

  const renderQuestionContent = (question, questions, predefinedQuestions) => {
    let questionsOfType = [];
    if (Array.isArray(questions) && Array.isArray(predefinedQuestions)) {
      questionsOfType = [...questions, ...predefinedQuestions];
    } else {
      console.error("Invalid questions or predefinedQuestions:", { questions, predefinedQuestions });
    }

    if (question.type === "predefined") {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-900 mb-3">{question.question_text}</p>
              {question.question_img && (
                <div className="mt-3">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.question_img || "/placeholder.png"}`}
                    alt="Question Image"
                    className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Question Type:</h4>
            <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
              {question.question_type}
            </span>
          </div>
          {question.options && Array.isArray(question.options) && question.options.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Options:</h4>
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <div
                    key={option.id || index}
                    className={`p-3 rounded-lg border ${option.is_correct === 1
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="block mb-2">
                          {String.fromCharCode(65 + index)}. {option.option_text}
                        </span>
                        {option.option_img && (
                          <div className="mt-2">
                            <img
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_img || "/placeholder.png"}`}
                              alt={`Option ${String.fromCharCode(65 + index)} Image`}
                              className="max-w-full h-auto rounded border border-gray-200 shadow-sm"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        )}
                      </div>
                      {option.is_correct === 1 && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0">
                          Correct
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {question.correct_answer && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Correct Answer:</h4>
              <p className="text-green-700 bg-green-50 p-3 rounded-lg font-medium">{question.correct_answer}</p>
            </div>
          )}
        </div>
      );
    }

    if (question.type === "predefined") {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-900 mb-3">{question.question_text}</p>
              {question.question_img && (
                <div className="mt-3">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.question_img || "/placeholder.png"}`}
                    alt="Question Image"
                    className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Question Type:</h4>
            <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
              {question.question_type}
            </span>
          </div>
          {question.options && Array.isArray(question.options) && question.options.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Options:</h4>
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <div
                    key={option.id || index}
                    className={`p-3 rounded-lg border ${option.is_correct === 1
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="block mb-2">
                          {String.fromCharCode(65 + index)}. {option.option_text}
                        </span>
                        {option.option_img && (
                          <div className="mt-2">
                            <img
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_img || "/placeholder.png"}`}
                              alt={`Option ${String.fromCharCode(65 + index)} Image`}
                              className="max-w-full h-auto rounded border border-gray-200 shadow-sm"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        )}
                      </div>
                      {option.is_correct === 1 && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0">
                          Correct
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {question.correct_answer && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Correct Answer:</h4>
              <p className="text-green-700 bg-green-50 p-3 rounded-lg font-medium">{question.correct_answer}</p>
            </div>
          )}
        </div>
      );
    }


    switch (question.type) {
      case "mcq":
      case "idea passage":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.mcq_question_text}</p>
            </div>
            {question.options && question.options.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Options:</h4>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div
                      key={option.id || index}
                      className={`p-3 rounded-lg border ${option.mcq_is_correct
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-gray-50 border-gray-200"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {String.fromCharCode(65 + index)}. {option.mcq_option_text}
                        </span>
                        {option.mcq_is_correct === 1 && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            Correct
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!question.options || question.options.length === 0) && (
              <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
                No options available for this question. Options may need to be fetched separately.
              </div>
            )}
            {question.type !== "audiotoscript" && question.type !== "videotoscript" && (
              <>
                {question.audio_url && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                    <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
                  </div>
                )}
                {question.video_url && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                    <video
                      src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                      controls
                      className="w-full max-h-80 rounded-lg border"
                    />
                  </div>
                )}
              </>
            )}

          </div>
        )
      case "complete the sentance":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Question Text:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.mcq_question_text}</p>
            </div>
            {question.options && question.options.length > 0 ? (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div key={option.id || index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Correct Word:</span>
                        <p className="text-green-700 font-medium">{option.complate_correct_word}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Hint:</span>
                        <p className="text-forestGreen">{option.complate_hint}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 bg-yellow-50 p-3 rounded-lg">
                No completion options available for this question.
              </div>
            )}
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        )
      case "speaking":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Question:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.speaking_question}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Answer Script:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.speaking_answer}</p>
            </div>
            {question.question_img && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Image:</h4>
                <img
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.question_img || "/placeholder.png"}`}
                  alt="Uploaded question"
                  className="max-w-full h-auto rounded-lg border"
                  style={{ maxHeight: "300px" }}
                />
              </div>
            )}
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        )
      case "dragdrop":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Prompt:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.dragdrop_prompt}</p>
            </div>
            {question.dragdrop_options && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Options:</h4>
                <div className="flex flex-wrap gap-2">
                  {question.dragdrop_options.map((option, index) => (
                    <span key={index} className="px-3 py-1 bg-lightGreen text-forestGreen rounded-full text-sm">
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {question.dragdrop_blanks && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Correct Order:</h4>
                <div className="flex flex-wrap gap-2">
                  {question.dragdrop_blanks.map((blank, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {blank.correct}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        )
      case "audiotoscript":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Audio URL:</h4>
              <AudioPlayer
                fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audiotoscript_url}`}
              ></AudioPlayer>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Script:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.audiotoscript_script}</p>
            </div>
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        )
      case "videotoscript":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
              <video
                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.videotoscript_url}`}
                controls
                className="w-full max-h-80 rounded-lg border"
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Script:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.videotoscript_script}</p>
            </div>
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        );

      case "imagetoscript":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Image:</h4>
              <img
                src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.imagetoscript_url || "/placeholder.png"}`}
                alt="Uploaded question"
                className="max-w-full h-auto rounded-lg border"
                style={{ maxHeight: "300px" }}
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Description:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.imagetoscript_script}</p>
            </div>
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        );

      case "realword":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Words:</h4>
              <div className="flex flex-wrap gap-2">
                {question.realword_words?.map((word, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {word}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Correct Answers:</h4>
              <div className="flex flex-wrap gap-2">
                {question.realword_correct_answers?.map((answer, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {answer}
                  </span>
                ))}
              </div>
            </div>
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        );
      case "summarizepassage":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Summary:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.summarizepassage_summary}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Time Limit:</h4>
              <span className="px-3 py-1 bg-lightGreen text-forestGreen rounded-full text-sm">
                {question.summarizepassage_time_limit} seconds
              </span>
            </div>
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        )
      case "bestoption":

        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Passage:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{question.bestoption_passage}</p>
            </div>
            {question.bestoption_blanked_words && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Blanked Words:</h4>
                <div className="flex flex-col gap-4">
                  {question.bestoption_blanked_words?.map((item, index) => (
                    <div key={index}>
                      <div className="flex flex-wrap gap-2">
                        {item.options?.map((option, optIndex) => (
                          <span
                            key={optIndex}
                            className={`px-3 py-1 rounded-full text-sm ${option === item.word ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        )
      case "arrangeorder":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Prompt:</h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                {question.arrangeorder_prompt}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Sentences In Correct Order:</h4>
              <ol className="list-decimal pl-4 space-y-2 bg-gray-50 p-3 rounded-lg">
                {question.sentences?.map((sentence, index) => (
                  <li key={index} className="text-gray-900">{sentence}</li>
                ))}
              </ol>
            </div>
            {question.audio_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
                <audio controls src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_url}`} className="w-full" />
              </div>
            )}
            {question.video_url && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
          </div>
        );
      case "video_pause":
        return (
          <div className="space-y-4">
            {/* Video section */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Video:</h4>
              {question.video_pause_url ? (
                <video
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.video_pause_url}`}
                  controls
                  className="w-full max-h-80 rounded-lg border"
                  onError={(e) => {
                    console.error("Video error:", e);
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <p className="text-gray-500">No video available</p>
              )}
            </div>
            {/* Pause Timestamps and Associated Questions section */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Pause Timestamps and Associated Questions:</h4>
              {question.video_pause_stamps?.map((stamp, index) => {
                const associatedQuestionIds = question.video_pause_question_ids[index];
                return (
                  <div key={index} className="mb-4 p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-2">Timestamp: {stamp}</h5>
                    <h6 className="font-medium text-gray-700 mb-2">Associated Questions:</h6>
                    <ul className="list-disc pl-5 space-y-2">
                      {associatedQuestionIds?.map((id) => {
                        const associatedQuestion = questionsOfType.find(q => q.id === id);
                        const questionType = questionTypes.find(t => t.id === associatedQuestion?.type)?.label;

                        return (
                          <li key={id}>
                            {associatedQuestion ? (
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-800">
                                    {associatedQuestion.type === "mcq" || associatedQuestion.type === "idea passage"
                                      ? associatedQuestion.mcq_question_text
                                      : associatedQuestion.type === "complete the sentance"
                                        ? associatedQuestion.mcq_question_text
                                        : associatedQuestion.type === "speaking"
                                          ? associatedQuestion.speaking_question
                                          : associatedQuestion.type === "dragdrop"
                                            ? associatedQuestion.dragdrop_prompt
                                            : associatedQuestion.type === "audiotoscript"
                                              ? associatedQuestion.audiotoscript_script
                                              : associatedQuestion.type === "videotoscript"
                                                ? associatedQuestion.videotoscript_script
                                                : associatedQuestion.type === "imagetoscript"
                                                  ? associatedQuestion.imagetoscript_script
                                                  : associatedQuestion.type === "realword"
                                                    ? associatedQuestion.realword_words?.join(", ")
                                                    : associatedQuestion.type === "summarizepassage"
                                                      ? associatedQuestion.summarizepassage_summary
                                                      : associatedQuestion.type === "bestoption"
                                                        ? associatedQuestion.bestoption_passage
                                                        : associatedQuestion.type === "arrangeorder"
                                                          ? associatedQuestion.arrangeorder_prompt
                                                          : associatedQuestion.question_text || "No question text available"}
                                  </p>
                                  {questionType && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-lightGreen text-forestGreen">
                                      {questionType}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-red-500">Question with ID {id} not found</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "audio_pause":
        if (!Array.isArray(questions) || !Array.isArray(predefinedQuestions)) {
          console.error("Invalid questions or predefinedQuestions:", { questions, predefinedQuestions });
          return <p className="text-red-500">Error: Invalid question data</p>;
        }

        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Audio:</h4>
              {question.audio_pause_url ? (
                <audio
                  controls
                  src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${question.audio_pause_url}`}
                  className="w-full"
                  onError={(e) => console.error("Audio error:", e)}
                />
              ) : (
                <p className="text-gray-500">No audio available</p>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Pause Timestamps and Associated Questions:</h4>
              {Array.isArray(question.audio_pause_stamps) ? (
                question.audio_pause_stamps.map((stamp, index) => (
                  <div key={index} className="mb-4 p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-2">Timestamp: {stamp}</h5>
                    <h6 className="font-medium text-gray-700 mb-2">Associated Questions:</h6>
                    <ul className="list-disc pl-5 space-y-2">
                      {Array.isArray(question.audio_pause_question_ids[index]) ? (
                        question.audio_pause_question_ids[index].map((id) => {
                          const associatedQuestion = questionsOfType.find(q => q.id === id);
                          const questionType = questionTypes.find(t => t.id === associatedQuestion?.type)?.label;

                          return (
                            <li key={id}>
                              {associatedQuestion ? (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-800">
                                      {associatedQuestion.type === "mcq" || associatedQuestion.type === "idea passage"
                                        ? associatedQuestion.mcq_question_text
                                        : associatedQuestion.type === "complete the sentance"
                                          ? associatedQuestion.mcq_question_text
                                          : associatedQuestion.type === "speaking"
                                            ? associatedQuestion.speaking_question
                                            : associatedQuestion.type === "dragdrop"
                                              ? associatedQuestion.dragdrop_prompt
                                              : associatedQuestion.type === "audiotoscript"
                                                ? associatedQuestion.audiotoscript_script
                                                : associatedQuestion.type === "videotoscript"
                                                  ? associatedQuestion.videotoscript_script
                                                  : associatedQuestion.type === "imagetoscript"
                                                    ? associatedQuestion.imagetoscript_script
                                                    : associatedQuestion.type === "realword"
                                                      ? associatedQuestion.realword_words?.join(", ")
                                                      : associatedQuestion.type === "summarizepassage"
                                                        ? associatedQuestion.summarizepassage_summary
                                                        : associatedQuestion.type === "bestoption"
                                                          ? associatedQuestion.bestoption_passage
                                                          : associatedQuestion.type === "arrangeorder"
                                                            ? associatedQuestion.arrangeorder_prompt
                                                            : associatedQuestion.question_text || "No question text available"}
                                    </p>
                                    {questionType && (
                                      <span className="px-2 py-1 text-xs rounded-full bg-lightGreen text-forestGreen">
                                        {questionType}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-red-500">Question with ID {id} not found</p>
                              )}
                            </li>
                          );
                        })
                      ) : (
                        <p className="text-gray-500">No questions for this timestamp</p>
                      )}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No pause timestamps available</p>
              )}
            </div>
          </div>
        );

      default:
        return <p className="text-gray-500">No content available</p>
    }
  }

  const renderForm = () => {
    const currentType = formData.type

    return (
      <form onSubmit={handleSubmitForm} id="quizQuestionForm" className="space-y-4 md:space-y-6">
        {/* Common Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
            <input
              type="number"
              value={formData.marks || 1}
              onChange={(e) => setFormData({ ...formData, marks: Number.parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
              min="1"
              required
              disabled={formData.type === "video_pause" || formData.type === "audio_pause"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.is_active ? "true" : "false"}
              disabled={Boolean(selectedQuestion?.assigned_pause_id)}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Type-specific Fields */}
        {(currentType === "mcq" || currentType === "idea passage") && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                {/* <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> */}
              </div>

              <textarea
                value={formData.mcq_question_text || ""}
                onChange={(e) => setFormData({ ...formData, mcq_question_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              {formData.mcq_options?.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option.mcq_option_text}
                    onChange={(e) => {
                      const newOptions = [...formData.mcq_options]
                      newOptions[index].mcq_option_text = e.target.value
                      setFormData({ ...formData, mcq_options: newOptions })
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(option.mcq_is_correct)}
                      onChange={(e) => {
                        const newOptions = [...formData.mcq_options];
                        newOptions[index].mcq_is_correct = e.target.checked;
                        setFormData({ ...formData, mcq_options: newOptions });
                      }}
                      className="w-5 h-5 accent-leafGreen"
                    />
                    <span>Correct</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentType === "videotoscript" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
              {/* <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> */}

              <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-leafGreen/50 cursor-pointer hover:border-leafGreen">
                <div className="flex flex-col items-center justify-center">
                  <Upload size={28} className="text-leafGreen" />
                  <p className="mt-2 text-sm text-gray-500">Click to select video file</p>
                  <p className="text-xs text-gray-500 mt-1">{fileName}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, "video")}
                />
              </label>

              {videoPreview && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Video Preview:</h4>
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-64 rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Script input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Script</label>
              <textarea
                value={formData.videotoscript_script || ""}
                onChange={(e) =>
                  setFormData({ ...formData, videotoscript_script: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={4}
                required
              />
            </div>
          </div>
        )}

        {currentType === "imagetoscript" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image File</label>
              {/* <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> */}

              <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-leafGreen/50 cursor-pointer hover:border-leafGreen">
                <div className="flex flex-col items-center justify-center">
                  <Upload size={28} className="text-leafGreen" />
                  <p className="mt-2 text-sm text-gray-500">Click to select image file</p>
                  <p className="text-xs text-gray-500 mt-1">{fileName}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "image")}
                />
              </label>
              {imagePreview && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Image Preview:</h4>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Script / Description input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Description</label>
              <textarea
                value={formData.imagetoscript_script || ""}
                onChange={(e) =>
                  setFormData({ ...formData, imagetoscript_script: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={4}
                required
              />
            </div>
          </div>
        )}

        {currentType === "complete the sentance" && (
          <div className="space-y-4">
            {/* <div className="flex items-center justify-between">
              <div className="bg-lightGreen border border-leafGreen/30 rounded-lg p-4 flex-1">
                <h4 className="text-sm font-semibold text-forestGreen mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                  Complete Sentence Question Instructions
                </h4>
                <div className="text-sm text-forestGreen space-y-2">
                  <p>1. Type your question text and use the "Add Blank" button to insert blanks (<code className="bg-lightGreen px-1 py-0.5 rounded">_____</code>).</p>
                  <p>2. For each blank, provide a correct answer with <strong>no spaces</strong>. For example: "blue", "running", "JavaScript".</p>
                  <p>3. The hint <strong>must be the starting characters</strong> of the correct word. For example: "b" or "bl" for "blue", "ru" for "running".</p>
                  <p>4. The hint cannot be longer than the correct word and must match the beginning of the word exactly.</p>
                </div>
              </div>
               <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} />
            </div> */}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                Question Text
                <button
                  type="button"
                  onClick={handleInsertBlankComplete}
                  className="text-sm text-forestGreen hover:underline flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Blank
                </button>
              </label>
              <textarea
                ref={completeTextareaRef}
                value={formData.mcq_question_text || ""}
                onChange={(e) => setFormData({ ...formData, mcq_question_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={4}
                placeholder='e.g., "The sky is _____."'
                required
              />
            </div>

            {formData.complete_sentence_options?.map((blank, index) => (
              <div key={index} className="border-t pt-2">
                <p className="text-sm font-semibold text-gray-600 mb-2">Blank #{index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex justify-between">
                      <span>Correct Word</span>
                      {invalidCompleteSentenceWords.includes(index) && (
                        <span className="text-red-500 text-xs">No spaces allowed</span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., blue"
                      value={blank.complate_correct_word}
                      onChange={(e) => handleBlankChange(index, "complate_correct_word", e.target.value)}
                      className={`w-full px-3 py-2 border ${invalidCompleteSentenceWords.includes(index)
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-leafGreen"
                        } rounded-lg focus:ring-2 focus:border-transparent`}
                      required
                    />
                    {invalidCompleteSentenceWords.includes(index) && (
                      <p className="mt-1 text-sm text-red-600">Correct word cannot contain spaces</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Hint (Optional)
                      <span className="text-xs text-gray-500">(Starting characters only)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., bl"
                      value={blank.complate_hint}
                      onChange={(e) => handleBlankChange(index, "complate_hint", e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${blank.complate_hint && blank.complate_correct_word && !blank.complate_correct_word.startsWith(blank.complate_hint)
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-leafGreen"
                        } focus:border-transparent`}
                    />
                    {blank.complate_hint && blank.complate_correct_word && !blank.complate_correct_word.startsWith(blank.complate_hint) ? (
                      <p className="mt-1 text-xs text-red-600">
                        Hint must be the starting characters of the correct word
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">
                        Example: for "blue", hint could be "b" or "bl"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentType === "speaking" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <textarea
                value={formData.speaking_question || ""}
                onChange={(e) => setFormData({ ...formData, speaking_question: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={3}
                required
              />
            </div>

            {/* Script input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer Script</label>
              <textarea
                value={formData.speaking_answer || ""}
                onChange={(e) => setFormData({ ...formData, speaking_answer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={4}
                required
              />
            </div>

            {/* Image file upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image File</label>
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-leafGreen/50 cursor-pointer hover:border-leafGreen">
                <div className="flex flex-col items-center justify-center">
                  <Upload size={28} className="text-leafGreen" />
                  <p className="mt-2 text-sm text-gray-500">Click to select image file</p>
                  <p className="text-xs text-gray-500 mt-1">{speakingImageFileName}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleSpeakFileChange(e)}
                />
              </label>
              {speakingImagePreview && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Image Preview:</h4>
                  <img
                    src={speakingImagePreview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Audio file upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-leafGreen/50 cursor-pointer hover:border-leafGreen">
                <div className="flex flex-col items-center justify-center">
                  <Upload size={28} className="text-leafGreen" />
                  <p className="mt-2 text-sm text-gray-500">Click to select audio file</p>
                  <p className="text-xs text-gray-500 mt-1">{fileNameAudio}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, "audio")}
                />
              </label>
              {audioPreview && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Audio Preview:</h4>
                  <audio controls src={audioPreview} className="w-full" />
                </div>
              )}
            </div>
          </div>
        )}

        {currentType === "dragdrop" && (
          <div className="space-y-4">
            {/*  <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 mb-2">Question Prompt</label>
              <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} />
            </div> */}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Question Prompt</label>
                {/* <span>Enter your question with ___ for blanks</span> */}
                <button
                  type="button"
                  onClick={handleInsertBlankDragDrop}
                  className="text-sm text-forestGreen hover:underline flex items-center gap-1"
                >
                  <Plus size={16} />
                  Insert Blank
                </button>
              </div>
              <textarea
                ref={dragdropTextareaRef}
                value={formData.dragdrop_prompt || ""}
                onChange={(e) => setFormData({ ...formData, dragdrop_prompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={3}
                placeholder="Enter your question with ___ for blanks"
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                {(formData.dragdrop_prompt?.match(/___/g) || []).length} blanks in question
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">Draggable Options</label>
                <button
                  type="button"
                  onClick={handleAddDragDropOption}
                  className="text-sm bg-leafGreen text-white px-3 py-1 rounded-md   flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Option
                </button>
              </div>
              <div className="space-y-2">
                {formData.dragdrop_options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleDragDropOptionChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    {formData.dragdrop_options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDragDropOption(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {formData.dragdrop_blanks?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Correct Answers for Blanks</label>
                {formData.dragdrop_blanks.map((blank, blankIndex) => {
                  const availableOptions =
                    formData.dragdrop_options?.filter(
                      (option) =>
                        option.trim() &&
                        (!formData.dragdrop_blanks.some((b, i) => i !== blankIndex && b.correct === option) ||
                          blank.correct === option),
                    ) || []

                  return (
                    <div key={blankIndex} className="mb-4 bg-gray-50 p-3 rounded-lg border">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Blank #{blankIndex + 1} - Select correct answer:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {availableOptions.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            onClick={() => setOptionForBlank(blankIndex, option)}
                            className={`p-2 border rounded-md cursor-pointer ${blank.correct === option
                              ? "bg-green-50 border-green-300 text-green-800"
                              : "bg-white border-gray-200 hover:bg-lightGreen/20"
                              }`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                      {blank && (
                        <div className="mt-2 text-xs text-gray-500">
                          Selected: <span className="font-medium text-green-600">{blank.correct}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {currentType === "bestoption" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Passage</label>
              {/* <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> */}

              <textarea
                value={getDisplayPassage() || formData.bestoption_passage || ""}
                onChange={(e) => handlePassageChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={6}
                placeholder="Enter the passage here..."
                required
              />
            </div>

            {formData.bestoption_passage && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select words to blank out:</label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border max-h-40 overflow-y-auto">
                  {getDisplayPassage()
                    .split(/(\s+)/)
                    .map((token, index) => {
                      const cleanedWord = token.trim().replace(/[^\w'-]/g, "")
                      if (!cleanedWord) return null
                      const isSelected = formData.bestoption_blanked_words?.some((w) => w.word === cleanedWord)
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleWordSelection({ word: cleanedWord })}
                          className={`px-3 py-1 rounded-md text-sm ${isSelected ? "bg-leafGreen text-white" : "bg-gray-200 hover:bg-lightGreen"
                            }`}
                        >
                          {cleanedWord}
                        </button>
                      )
                    })
                    .filter(Boolean)}
                </div>
                {formData.bestoption_blanked_words?.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected {formData.bestoption_blanked_words.length} word(s) to blank out
                  </div>
                )}
              </div>
            )}
            {/* Add distractor options for selected words */}
            {formData.bestoption_blanked_words?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Add distractor options for blanked words:
                </label>
                <div className="space-y-4">
                  {formData.bestoption_blanked_words.map((wordObj, wordIndex) => (
                    <div key={wordIndex} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800">Word: "{wordObj.word}" (Correct Answer)</h4>
                        <span className="text-sm text-gray-500">{wordObj.options.length}/4 options</span>
                      </div>
                      <div className="space-y-2">
                        {wordObj.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-sm ${optionIndex === 0 ? "bg-green-100 text-green-800" : "bg-lightGreen text-forestGreen"
                                }`}
                            >
                              {optionIndex === 0 ? "Correct" : `Option ${optionIndex + 1}`}
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const updated = formData.bestoption_blanked_words.map((wordObj, index) => {
                                  if (index === wordIndex) {
                                    const newOptions = [...wordObj.options]
                                    newOptions[optionIndex] = e.target.value
                                    return {
                                      ...wordObj,
                                      options: newOptions,
                                    }
                                  }
                                  return { ...wordObj, options: [...wordObj.options] }
                                })
                                setFormData((prev) => ({
                                  ...prev,
                                  bestoption_blanked_words: updated,
                                }))
                              }}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                              placeholder={optionIndex === 0 ? "Correct answer" : "Distractor option"}
                              disabled={optionIndex === 0}
                            />
                            {optionIndex > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDistractor(wordIndex, optionIndex)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        {wordObj.options.length < 4 && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add distractor option"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddDistractor(wordIndex, e.target.value)
                                  e.target.value = ""
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = e.target.previousElementSibling
                                handleAddDistractor(wordIndex, input.value)
                                input.value = ""
                              }}
                              className="px-3 py-1 bg-leafGreen text-white rounded   text-sm"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentType === "audiotoscript" && (
          <div className="space-y-4">
            {/* <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
              <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> 
            </div>*/}

            {/* Audio Upload/Text-to-Speech Section - Using TextToAudioConverter */}
            <TextToAudioConverter
              handleFileChange={handleFileChange}
              audioPreview={audioPreview}
              setAudioPreview={setAudioPreview}
              fieldName="audio"
              isExistingFile={audioPreview !== null}
              existingFileUrl={typeof formData.audiotoscript_url === 'string' ? formData.audiotoscript_url : null}
            />

            {/* Script input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Script</label>
              <textarea
                value={formData.audiotoscript_script || ""}
                onChange={(e) => setFormData({ ...formData, audiotoscript_script: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={4}
                required
              />
            </div>
          </div>
        )}

        {currentType === "realword" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Words (comma separated)</label>
              {/* <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> */}

              <input
                type="text"
                value={formData.realwordRawValue || formData.realword_words?.join(", ")}
                onChange={(e) => {
                  const raw = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    realwordRawValue: raw,
                    realword_words: raw
                      .split(",")
                      .map((word) => word.trim())
                      .filter((word) => word.length > 0),
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                placeholder="apple, bxrple, orange, qwery"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yes No According to Words in sequence (comma separated)</label>
              <input
                type="text"
                value={formData.realwordCorrectRawValue || formData.realword_correct_answers?.join(", ")}
                onChange={(e) => {
                  const raw = e.target.value;
                  const entries = raw.split(",").map((word) => word.trim().toLowerCase());
                  const valid = entries.filter((word) => word === "yes" || word === "no");
                  const invalid = entries.filter((word) => word && word !== "yes" && word !== "no");

                  setInvalidWords(invalid);
                  setFormData((prev) => ({
                    ...prev,
                    realwordCorrectRawValue: raw,
                    realword_correct_answers: valid,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                placeholder="yes, no, yes, no"
                required
              />

              {invalidWords.length > 0 && (
                <p className="text-red-500 text-sm mt-1">
                  Invalid entries: {invalidWords.join(", ")} (only "yes" or "no" allowed)
                </p>
              )}
            </div>
          </div>
        )}

        {currentType === "summarizepassage" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
              {/* <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> */}

              <textarea
                value={formData.summarizepassage_summary || ""}
                onChange={(e) => setFormData({ ...formData, summarizepassage_summary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
              <input
                type="number"
                value={formData.summarizepassage_time_limit || 10}
                onChange={(e) =>
                  setFormData({ ...formData, summarizepassage_time_limit: Number.parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                min="1"
                required
              />
            </div>
          </div>
        )}

        {currentType === "arrangeorder" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prompt</label>
              {/* <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> */}

              <textarea
                value={formData.arrangeorder_prompt || ""}
                onChange={(e) => setFormData({ ...formData, arrangeorder_prompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                rows={2}
                placeholder="Enter a prompt for the arrange order question..."
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">Sentences In Correct Order</label>
                <button
                  type="button"
                  onClick={handleAddSentence}
                  className="text-sm bg-leafGreen text-white px-3 py-1 rounded-md   flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Sentence
                </button>
              </div>
              <div className="space-y-2">
                {formData.sentences?.map((sentence, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 draggable-item"
                  >
                    {/* Drag handle - only this part is draggable */}
                    <div
                      className="cursor-move touch-none select-none"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <GripVertical size={16} className="text-gray-400" />
                    </div>

                    {/* Input field - fully accessible */}
                    <input
                      type="text"
                      value={sentence}
                      onChange={(e) => handleSentenceChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder={`Sentence ${index + 1}`}
                      required
                    />

                    {formData.sentences.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSentence(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {/* Touch Drag Preview */}
              {touchPreview.visible && (
                <div
                  className="fixed z-50 px-4 py-3 bg-white border-2 border-leafGreen rounded-lg shadow-xl select-none pointer-events-none"
                  style={{
                    left: touchPreview.x,
                    top: touchPreview.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="flex items-center gap-2 text-gray-700">
                    <GripVertical size={16} />
                    <span className="text-sm font-medium">Moving item</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentType === "video_pause" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
              {/* <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> */}

              <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-leafGreen/50 cursor-pointer hover:border-leafGreen">
                <div className="flex flex-col items-center justify-center">
                  <Upload size={28} className="text-leafGreen" />
                  <p className="mt-2 text-sm text-gray-500">Click to select video file</p>
                  <p className="text-xs text-gray-500 mt-1">{fileNameVideo}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={(e) => handleFileChange(e, "video")}
                />
              </label>
              {videoPreview && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Video Preview:</h4>
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-64 rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Pause Stamps and Question Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pause Stamps (second)</label>
              {stamps.map((stamp, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2 items-center">
                  <Select
                    options={questionTypes
                      .filter(
                        (type) =>
                          ![
                            "audio_pause",
                            "video_pause",
                            "imagetoscript",
                            "videotoscript",
                            "audiotoscript",
                            "predefined",
                          ].includes(type.id)
                      )
                      .map((type) => ({
                        value: type.id,
                        label: type.label,
                      }))
                    }
                    onChange={(selected) => {
                      setSelectedQuestionTypeForModal(selected.value);
                      setCurrentStampIndex(index);
                      setShowQuestionModal(true);
                    }}
                    placeholder="Select question type..."
                    className="w-full"
                  />

                  <div className="flex w-full">
                    <input
                      type="number"
                      min={0}
                      max={videoPauseStampLimit}
                      step={1}
                      value={stamp.timestamp}
                      disabled={!videoPauseStampLimit}
                      onChange={(e) =>
                        handleStampChange(
                          index,
                          "timestamp",
                          Math.min(videoPauseStampLimit, Math.max(0, parseInt(e.target.value) || 0))
                        )
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder={`Pause second (0 - ${videoPauseStampLimit})`}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStampIndex(index);
                        setShowSelectedQuestionsModal(true);
                      }}
                      className="p-2 text-leafGreen hover:bg-lightGreen rounded-md"
                      title="View selected questions"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStamp(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end items-center">
                <button
                  type="button"
                  onClick={handleAddStamp}
                  className="mt-2 px-4 py-2 bg-leafGreen text-white rounded-lg   transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Stamp
                </button>
              </div>
            </div>
          </div>
        )}

        {currentType === "audio_pause" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
              {/* <HelpIcon onClick={() => {
                setCurrentHelpContent(questionTypeHelp[currentType]?.content || "")
                setShowHelpModal(true)
              }} /> */}

              <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-leafGreen/50 cursor-pointer hover:border-leafGreen">
                <div className="flex flex-col items-center justify-center">
                  <Upload size={28} className="text-leafGreen" />
                  <p className="mt-2 text-sm text-gray-500">Click to select audio file</p>
                  <p className="text-xs text-gray-500 mt-1">{fileNameAudio}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, "audio")}
                />
              </label>
              {audioPreview && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Audio Preview:</h4>
                  <audio controls src={audioPreview} className="w-full" />
                </div>
              )}
            </div>

            {/* Pause Stamps and Question Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pause Stamps</label>
              {stamps.map((stamp, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2 items-center">
                  <Select
                    options={questionTypes
                      .filter(
                        (type) =>
                          ![
                            "audio_pause",
                            "video_pause",
                            "imagetoscript",
                            "videotoscript",
                            "audiotoscript",
                            "predefined",
                          ].includes(type.id)
                      )
                      .map((type) => ({
                        value: type.id,
                        label: type.label,
                      }))
                    }
                    onChange={(selected) => {
                      setSelectedQuestionTypeForModal(selected.value);
                      setCurrentStampIndex(index);
                      setShowQuestionModal(true);
                    }}
                    placeholder="Select question type..."
                    className="w-full"
                  />

                  <div className="w-full flex">
                    <input
                      type="number"
                      min={0}
                      max={audioPauseStampLimit}
                      step={1}
                      value={stamp.timestamp}
                      disabled={!audioPauseStampLimit}
                      onChange={(e) => handleStampChange(index, "timestamp", Math.min(audioPauseStampLimit, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder={`Pause second (0 - ${audioPauseStampLimit})`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStampIndex(index);
                        setShowSelectedQuestionsModal(true);
                      }}
                      className="p-2 text-leafGreen hover:bg-lightGreen rounded-md"
                      title="View selected questions"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStamp(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end items-center">
                <button
                  type="button"
                  onClick={handleAddStamp}
                  className="mt-2 px-4 py-2 bg-leafGreen text-white rounded-lg   transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Stamp
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    )
  }

  const questionsUsedPauseType = [
    ...new Map(
      questions
        .filter(q => ["audio_pause", "video_pause"].includes(q.type))
        .flatMap(q => {
          const rawIds = q[`${q.type}_question_ids`];
          if (!rawIds) return [];
          let parsed;
          try {
            parsed = typeof rawIds === 'string' ? JSON.parse(rawIds) : rawIds;
          } catch (e) {
            parsed = [];
          }
          const flatIds = Array.isArray(parsed) ? parsed.flat() : [parsed];
          return flatIds.map(id => [id, { id, type: q.type }]);
        })
    ).values()
  ];

  const renderQuestionRow = (question, index) => {
    const isUsedByPause = questionsUsedPauseType.some(p => p.id === question.id);
    const usedPauseType = questionsUsedPauseType.find(p => p.id === question.id)?.type;

    const questionText =
      question.type === "predefined"
        ? question.question_text
        : question.type === "mcq" || question.type === "idea passage"
          ? question.mcq_question_text
          : question.type === "complete the sentance"
            ? question.mcq_question_text
            : question.type === "speaking"
              ? question.speaking_question
              : question.type === "dragdrop"
                ? question.dragdrop_prompt
                : question.type === "audiotoscript"
                  ? question.audiotoscript_script
                  : question.type === "videotoscript"
                    ? question.videotoscript_script
                    : question.type === "imagetoscript"
                      ? question.imagetoscript_script
                      : question.type === "realword"
                        ? question.realword_words?.join(", ")
                        : question.type === "summarizepassage"
                          ? question.summarizepassage_summary
                          : question.type === "bestoption"
                            ? question.bestoption_passage
                            : question.type === "arrangeorder"
                              ? question.arrangeorder_prompt
                              : question.type === "video_pause"
                                ? `Video Pause Question with ${question.video_pause_stamps.length} timestamps`
                                : question.type === "audio_pause"
                                  ? `Audio Pause Question with ${question.audio_pause_stamps.length} timestamps`
                                  : `${questionTypes.find((t) => t.id === question.type)?.label} Question`;

    return (
      <tr key={question.id} className="hover:bg-lightGreen/20">
        <td className="px-6 py-4">
          <span className="text-sm font-medium text-gray-900">{index + 1}</span>
        </td>
        <td className="px-6 py-4 grid">
          <div className="text-sm text-gray-900 truncate gap-2">
            {questionText}
          </div>
        </td>

        <td className="px-6 py-4">
          <span
            className={`px-2 py-1 inline-flex whitespace-nowrap text-xs font-medium rounded-full ${question.type === "predefined" ? "bg-cyan-100 text-cyan-800" : "bg-lightGreen text-forestGreen"
              }`}>
            {questionTypes.find((t) => t.id === question.type)?.label}
          </span>
          {isUsedByPause && <span
            className={`px-2 py-1 inline-flex whitespace-nowrap text-xs font-medium rounded-full bg-red-100 text-red-800`}>
            {` (Used in ${usedPauseType})`}
          </span>}
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-gray-900">{question.marks}</span>
        </td>
        {/* <td className="px-6 py-4">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${question.is_active ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}
          >
            {question.is_active ? "Active" : "InActive"}
          </span>
        </td> */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <PermissionWrapper section="Quiz Question" action="view">
              <button
                onClick={() => handleViewQuestion(question)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </PermissionWrapper>

            {question.type !== "predefined" && (
              <>
                <PermissionWrapper section="Quiz Question" action="toggle">
                  <button
                    onClick={() => handleToggleQuestion(question.id)}
                    disabled={isToggling || isUsedByPause}
                    className={`relative w-7 h-4 rounded-full transition-colors duration-300 ${question.is_active ? 'bg-green-500' : 'bg-gray-300'
                      } disabled:opacity-50`}
                    title="Toggle Status"
                  >
                    <span
                      className={`absolute top-1/2 left-[3px] w-2.5 h-2.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${question.is_active ? 'translate-x-[13px]' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </PermissionWrapper>

                <PermissionWrapper section="Quiz Question" action="edit">
                  <button
                    onClick={() => handleEditQuestion(question)}
                    disabled={isUpdating}
                    className="p-2 text-gray-400 hover:text-forestGreen transition-colors disabled:opacity-50"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </PermissionWrapper>
              </>
            )}
            <PermissionWrapper section="Quiz Question" action="delete">
              <button
                onClick={() => handleDeleteQuestion(question)}
                disabled={isUsedByPause}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </PermissionWrapper>
          </div>
        </td>
      </tr>
    )
  }

  const renderQuestionCard = (question, index) => {
    const isUsedByPause = questionsUsedPauseType.some(p => p.id === question.id);
    const usedPauseType = questionsUsedPauseType.find(p => p.id === question.id)?.type;

    const questionText =
      question.type === "predefined"
        ? question.question_text
        : question.type === "mcq" || question.type === "idea passage"
          ? question.mcq_question_text
          : question.type === "complete the sentance"
            ? question.mcq_question_text
            : question.type === "speaking"
              ? question.speaking_question
              : question.type === "dragdrop"
                ? question.dragdrop_prompt
                : question.type === "audiotoscript"
                  ? question.audiotoscript_script
                  : question.type === "videotoscript"
                    ? question.videotoscript_script
                    : question.type === "imagetoscript"
                      ? question.imagetoscript_script
                      : question.type === "realword"
                        ? question.realword_words?.join(", ")
                        : question.type === "summarizepassage"
                          ? question.summarizepassage_summary
                          : question.type === "bestoption"
                            ? question.bestoption_passage
                            : question.type === "arrangeorder"
                              ? question.arrangeorder_prompt
                              : question.type === "video_pause"
                                ? `Video Pause Question with ${question.video_pause_stamps.length} timestamps`
                                : question.type === "audio_pause"
                                  ? `Audio Pause Question with ${question.audio_pause_stamps.length} timestamps`
                                  : `${questionTypes.find((t) => t.id === question.type)?.label} Question`;

    return (
      <div key={question.id} className="bg-white shadow-sm border p-3">
        {/* Top Row: Question */}
        <div className="text-sm font-medium text-gray-900 mb-2">
          {index + 1}. {questionText}
        </div>

        {/* Bottom Row: Type + Marks (left) / Actions (right) */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${question.type === "predefined"
                ? "bg-cyan-100 text-cyan-800"
                : "bg-lightGreen text-forestGreen"
                }`}
            >
              {questionTypes.find((t) => t.id === question.type)?.label}
              {isUsedByPause && `${usedPauseType})`}
            </span>
            <span className="text-gray-700">Marks: {question.marks}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleViewQuestion(question)}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            {question.type !== "predefined" && (
              <>
                <button
                  onClick={() => handleToggleQuestion(question.id)}
                  disabled={isToggling || isUsedByPause}
                  className={`relative w-7 h-4 rounded-full transition-colors duration-300 ${question.is_active ? "bg-green-500" : "bg-gray-300"} disabled:opacity-50`}
                  title="Toggle Status"
                >
                  <span
                    className={`absolute top-1/2 left-[3px] w-2.5 h-2.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${question.is_active ? "translate-x-[13px]" : "translate-x-0"}`}
                  />
                </button>

                <button
                  onClick={() => handleEditQuestion(question)}
                  disabled={isUpdating}
                  className="p-2 text-gray-400 hover:text-forestGreen disabled:opacity-50"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </>
            )}

            <button
              onClick={() => handleDeleteQuestion(question)}
              className="p-2 text-gray-400 hover:text-red-600"
              disabled={isUsedByPause}
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (apiLoading || predefinedApiLoading) {
    return <AdminLoader fullScreen message="Loading quiz questions..." />;
  }

  if (apiError || predefinedApiError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Questions</h3>
          <p className="text-gray-600">There was an error loading the quiz questions. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-leafGreen text-white rounded-lg   transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const currentQuestionType = getCurrentQuestionType()
  const questionsOfType = getQuestionsByType(selectedQuestionType)

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6 relative">
          {/* Mobile title - centered absolutely */}
          <h1 className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl text-center font-bold  text-forestGreen">
            Quiz Questions
          </h1>
          <div className="flex items-center">
            {/* Spacer for mobile to push buttons to the right */}
            <div className="flex-1 md:hidden"></div>
            {/* Desktop title */}
            <div className="hidden md:block flex-1 mx-2">
              <h1 className="text-2xl text-start font-bold  text-forestGreen">
                Quiz Questions
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 md:px-4 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="hidden md:inline">Back</span>
              </button>
              {/* Question Type Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-between md:w-64 md:px-4 p-2 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                >
                  <span className="text-gray-900 hidden md:inline">{currentQuestionType.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-1 translate-y-1 z-10 w-64 max-h-[calc(100vh-150px)] overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      {questionTypes.map((type) => {
                        const questionsCount = getQuestionsByType(type.id).length;

                        if (type.isPredefined) {
                          return (
                            <PermissionWrapper section="Quiz Predefined Questions">
                              <button
                                key={type.id}
                                onClick={() => {
                                  setSelectedQuestionType(type.id);
                                  setShowDropdown(false);
                                }}
                                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${selectedQuestionType === type.id ? "bg-lightGreen text-forestGreen" : "text-gray-900"
                                  }`}
                              >
                                <span>{type.label}</span>
                                {questionsCount > 0 && (
                                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                    {questionsCount}
                                  </span>
                                )}
                              </button>
                            </PermissionWrapper>
                          );
                        }

                        return (
                          <button
                            key={type.id}
                            onClick={() => {
                              setSelectedQuestionType(type.id);
                              setShowDropdown(false);
                            }}
                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${selectedQuestionType === type.id ? "bg-lightGreen text-forestGreen" : "text-gray-900"
                              }`}
                          >
                            <span>{type.label}</span>
                            {questionsCount > 0 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {questionsCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-8xl w-full p-4 sm:p-6 flex-1 overflow-y-auto">
        {/* Questions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-forestGreen">{currentQuestionType.label}</h3>
                <p className="text-gray-600 text-sm">{currentQuestionType.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedQuestionType !== "all" && (
                  <div className="flex gap-2">
                    {currentQuestionType.aiType && !currentQuestionType.isPredefined && (
                      <AIContentGenerator
                        contentType={currentQuestionType.aiType}
                        onUseGenerated={handleUseGeneratedQuestion}
                        modalTitle={`Generate ${currentQuestionType?.label} Questions with AI`}
                        placeholderText={`Describe what kind of ${currentQuestionType?.label.toLowerCase()} questions you want to create...`}
                        requiresPDF={true}
                        clearContent={false}
                        allowMultipleSelection={true}
                      />
                    )}
                    <PermissionWrapper section="Quiz Question" action="create">
                      <button
                        onClick={() => handleCreateQuestion(selectedQuestionType)}
                        className={`sm:px-6 p-2 bg-leafGreen text-white rounded-lg transition-colors shadow-sm flex items-center gap-2`}
                        disabled={isCreating}
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Create</span>
                      </button>
                    </PermissionWrapper>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {questionsOfType.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="hidden md:table w-full">
                  <thead className="bg-lightGreen">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Question</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Marks</th>
                      <PermissionWrapper section="Quiz Question" action="edit|delete|toggle|view">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                      </PermissionWrapper>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {questionsOfType.map((question, index) => renderQuestionRow(question, index))}
                  </tbody>
                </table>
                {/* Mobile layout */}
                <div className="md:hidden">
                  {questionsOfType.map((question, index) => renderQuestionCard(question, index))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No {selectedQuestionType === "all" ? "Questions" : currentQuestionType.label + " Questions"}
                </h3>
                <PermissionWrapper section="Quiz Question" action="create">
                  <p className="text-gray-500 mb-4">
                    {selectedQuestionType === "all"
                      ? "Create your first question to get started."
                      : `${currentQuestionType.isPredefined ? "Select" : "Create"} your first ${currentQuestionType.label.toLowerCase()} question to get started.`}
                  </p>
                  {selectedQuestionType !== "all" && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleCreateQuestion(selectedQuestionType)}
                        className={`px-4 py-2 bg-leafGreen text-white rounded-lg transition-colors shadow-sm`}
                        disabled={isCreating}
                      >
                        {currentQuestionType.isPredefined ? "Select First Question" : "Create First Question"}
                      </button>
                    </div>
                  )}
                </PermissionWrapper>
              </div>
            )}
          </div>
        </div>
        {/* Modals and other components remain unchanged */}
        <QuestionSelectionModal
          isOpen={showQuestionModal}
          onClose={() => setShowQuestionModal(false)}
          questionType={selectedQuestionTypeForModal}
          currentPauseType={formData.type}
          onSelect={handleQuestionSelect}
          stampIndex={currentStampIndex}
          questionsOfType={[...questions, ...predefinedQuestions]}
          questionTypes={questionTypes}
          allStamps={stamps}
        />
        <SelectedQuestionsModal
          isOpen={showSelectedQuestionsModal}
          onClose={() => setShowSelectedQuestionsModal(false)}
          stampIndex={currentStampIndex}
          stamps={stamps}
          questionsOfType={[...questions, ...predefinedQuestions]}
        />
        <PredefinedQuestionModal
          isOpen={showPredefinedModal}
          onClose={() => setShowPredefinedModal(false)}
          onSelect={handlePredefinedQuestionSelect}
        />
        {/* View Question Modal */}
        {showViewModal && selectedQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-forestGreen">
                  {questionTypes.find((t) => t.id === selectedQuestion.type)?.label} Question
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <div className="flex items-center gap-4 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${selectedQuestion.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {selectedQuestion.is_active ? "Active" : "Inactive"}
                  </span>
                  <span className="px-3 py-1 bg-lightGreen text-forestGreen rounded-full text-sm font-medium">
                    {selectedQuestion.marks} marks
                  </span>
                </div>
                {renderQuestionContent(selectedQuestion, questions, predefinedQuestions)}
              </div>
              <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0 border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedQuestion.type !== "predefined" && (
                  <PermissionWrapper section="Quiz Question" action="edit">
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditQuestion(selectedQuestion);
                      }}
                      className="px-4 py-2 bg-leafGreen text-white rounded-lg transition-colors shadow-sm flex items-center gap-2"
                      disabled={isUpdating}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                  </PermissionWrapper>
                )}
                <PermissionWrapper section="Quiz Question" action="delete">
                  <button
                    onClick={() => handleDeleteQuestion(selectedQuestion)}
                    disabled={questionsUsedPauseType.some(p => p.id === selectedQuestion.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </button>
                </PermissionWrapper>
              </div>
            </div>
          </div>
        )}
        {/* Create Question Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-forestGreen">
                  Create New {questionTypes.find((t) => t.id === formData.type)?.label} Question
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentHelpContent(questionTypeHelp[formData.type]?.content || "");
                      setShowHelpModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-forestGreen transition-colors"
                    title="Get help"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setFormData({});
                      setSelectedQuestion(null);
                      setFileName("No file selected");
                      setVideoPreview(null);
                      setImagePreview(null);
                      setVideoFile(null);
                      setImageFile(null);
                      setAudioPreview(null);
                      setAudioFile(null);
                      setSpeakingImageFile(null);
                      setSpeakingImageFileName(null);
                      setSpeakingImagePreview(null);
                      setFileNameAudio("No file selected");
                      setFileNameVideo("No file selected");
                      setSelectedMediaType(null);
                      setStamps([{ timestamp: "", selectedQuestions: [] }]);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {renderForm()}
              </div>
              <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormData({});
                    setSelectedQuestion(null);
                    setFileName("No file selected");
                    setVideoPreview(null);
                    setImagePreview(null);
                    setVideoFile(null);
                    setImageFile(null);
                    setAudioPreview(null);
                    setAudioFile(null);
                    setSpeakingImageFile(null);
                    setSpeakingImageFileName(null);
                    setSpeakingImagePreview(null);
                    setFileNameAudio("No file selected");
                    setFileNameVideo("No file selected");
                    setSelectedMediaType(null);
                    setStamps([{ timestamp: "", selectedQuestions: [] }]);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="quizQuestionForm"
                  disabled={isCreating || isUpdating}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isCreating || isUpdating ? "Saving..." : showEditModal ? "Update Question" : "Create Question"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Question Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-forestGreen">
                  Edit {questionTypes.find((t) => t.id === formData.type)?.label} Question
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormData({});
                    setSelectedQuestion(null);
                    setFileName("No file selected");
                    setVideoPreview(null);
                    setImagePreview(null);
                    setVideoFile(null);
                    setImageFile(null);
                    setAudioPreview(null);
                    setAudioFile(null);
                    setSpeakingImageFile(null);
                    setSpeakingImageFileName(null);
                    setSpeakingImagePreview(null);
                    setFileNameAudio("No file selected");
                    setFileNameVideo("No file selected");
                    setSelectedMediaType(null);
                    setStamps([{ timestamp: "", selectedQuestions: [] }]);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {renderForm()}
              </div>
              <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormData({});
                    setSelectedQuestion(null);
                    setFileName("No file selected");
                    setVideoPreview(null);
                    setImagePreview(null);
                    setVideoFile(null);
                    setImageFile(null);
                    setAudioPreview(null);
                    setAudioFile(null);
                    setSpeakingImageFile(null);
                    setSpeakingImageFileName(null);
                    setSpeakingImagePreview(null);
                    setFileNameAudio("No file selected");
                    setFileNameVideo("No file selected");
                    setSelectedMediaType(null);
                    setStamps([{ timestamp: "", selectedQuestions: [] }]);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="quizQuestionForm"
                  disabled={isCreating || isUpdating}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isCreating || isUpdating ? "Saving..." : showEditModal ? "Update Question" : "Create Question"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setQuestionToDelete(null);
          }}
          onConfirm={confirmDeleteQuestion}
          questionType={questionToDelete?.type || ""}
          isDeleting={isDeleting}
        />
      </div>
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title={questionTypeHelp[formData.type]?.title || "Question Help"}
        content={currentHelpContent}
      />
      <style jsx>{`
        .prose {
          color: #374151;
        }
        .prose h4 {
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
          color: #111827;
        }
        .prose ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .prose li {
          margin-bottom: 0.5rem;
        }
        .prose strong {
          font-weight: 600;
          color: #111827;
        }
        .prose em {
          color: #6b7280;
          font-style: italic;
        }
      `}</style>
    </div>
  );

}

export default QuizQuestion