"use client"

/* eslint-disable no-unused-vars */
import { useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { X, Eye, Trash2, ArrowLeft, Code, List, CheckCircle, ChevronDown, Edit2, Plus, FileText, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import AdminLoader from "../../../components/admin/AdminLoader"
import {
  useCreateFillInTheBlanksChallengeMutation,
  useUpdateFillInTheBlanksChallengeMutation,
  useToggleFillInTheBlanksChallengeStatusMutation,
  useDeleteFillInTheBlanksChallengeMutation,
} from "../../../services/Challenge/fillIntheBlankAPI"
import {
  useCreateMCQChallengeMutation,
  useUpdateMCQChallengeMutation,
  useToggleMCQChallengeStatusMutation,
  useDeleteMCQChallengeMutation,
  useDeleteMCQOptionChallengeMutation,
} from "../../../services/Challenge/challengeMCQAPI"
import {
  useCreateTrueFalseChallengeMutation,
  useUpdateTrueFalseChallengeMutation,
  useToggleTrueFalseChallengeStatusMutation,
  useDeleteTrueFalseChallengeMutation,
} from "../../../services/Challenge/challengeTrueFalseAPI"

import { useGetChallengeByIdQuery, useGetTaskChallengeByIdQuery } from "../../../services/Challenge/chllengeAPI"
import { useGetQuizzQuestionByIdQuery } from "../../../services/Contest/contestQuizAPI"
import toast from "react-hot-toast"
import PermissionWrapper from "../../../context/PermissionWrapper"

// Question type configurations
const challengeTypes = [
  {
    id: "all",
    label: "All Questions",
    color: "from-gray-500 to-gray-600",
    description: "View all question types",
    icon: List,
  },
  {
    id: "blanks",
    label: "Fill in the Blanks",
    color: "from-leafGreen to-forestGreen",
    description: "Fill in the blanks with correct words",
    permission: "Fill-in-the-Blank Challenge",
    icon: Code,
  },
  {
    id: "mcq",
    label: "Multiple Choice",
    color: "from-leafGreen to-forestGreen",
    description: "Traditional multiple choice questions",
    permission: "MCQ Challenge",
    icon: List,
  },
  {
    id: "truefalse",
    label: "True/False",
    color: "from-leafGreen to-forestGreen",
    description: "True or false questions",
    permission: "True/False Challenge",
    icon: CheckCircle,
  },
]

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, questionType, isDeleting }) => {
  if (!isOpen) return null

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
                Delete Question
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
              Are you sure you want to delete this {questionType} question?
            </p>
            <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} className="flex-shrink-0" />
              This action cannot be undone and all associated data will be lost.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="sm:w-4 sm:h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChallengeQuestions() {
  const { challenge_type } = useParams()
  const { id } = useLocation().state
  const navigate = useNavigate()

  const isTaskChallenge = challenge_type === "task"
  const isContestQuiz = challenge_type === "contest-quiz"

  // State for active question type filter
  const [selectedType, setSelectedType] = useState("all")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItemType, setDeleteItemType] = useState(null)
  const [deleteItemId, setDeleteItemId] = useState(null)

  // Form states
  const [showFormModal, setShowFormModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [createQuestionType, setCreateQuestionType] = useState("blanks")

  // Form data states
  const [blankFormData, setBlankFormData] = useState({
    text: "",
    answers: [],
    ...(isContestQuiz
      ? { contest_quiz_id: id, challenge_task_id: null, challenge_id: null }
      : isTaskChallenge
        ? { challenge_task_id: id, challenge_id: null, contest_quiz_id: null }
        : { challenge_id: id, challenge_task_id: null, contest_quiz_id: null }),
  })

  const [mcqFormData, setMCQFormData] = useState({
    question_text: "",
    options: [
      { option_text: "", option_type: "text", is_correct: false },
      { option_text: "", option_type: "text", is_correct: false },
    ],
    ...(isContestQuiz
      ? { contest_quiz_id: id, challenge_task_id: null, challenge_id: null }
      : isTaskChallenge
        ? { challenge_task_id: id, challenge_id: null, contest_quiz_id: null }
        : { challenge_id: id, challenge_task_id: null, contest_quiz_id: null }),
  })

  const [trueFalseFormData, setTrueFalseFormData] = useState({
    question: "",
    answer: false,
    ...(isContestQuiz
      ? { contest_quiz_id: id, challenge_task_id: null, challenge_id: null }
      : isTaskChallenge
        ? { challenge_task_id: id, challenge_id: null, contest_quiz_id: null }
        : { challenge_id: id, challenge_task_id: null, contest_quiz_id: null }),
  })

  const [newBlankAnswer, setNewBlankAnswer] = useState("")
  const [newMCQOption, setNewMCQOption] = useState({
    option_text: "",
    option_type: "text",
    is_correct: false,
  })

  // RTK Query hooks
  const getChallengeDataQuery = () => {
    if (isContestQuiz) {
      return useGetQuizzQuestionByIdQuery(id)
    } else if (isTaskChallenge) {
      return useGetTaskChallengeByIdQuery(id)
    } else {
      return useGetChallengeByIdQuery(id)
    }
  }

  const { data: challengeData, isLoading, refetch } = getChallengeDataQuery()

  const [createBlank] = useCreateFillInTheBlanksChallengeMutation()
  const [updateBlank] = useUpdateFillInTheBlanksChallengeMutation()
  const [deleteBlank] = useDeleteFillInTheBlanksChallengeMutation()
  const [createMCQ] = useCreateMCQChallengeMutation()
  const [updateMCQ] = useUpdateMCQChallengeMutation()
  const [deleteMCQ] = useDeleteMCQChallengeMutation()
  const [createTrueFalse] = useCreateTrueFalseChallengeMutation()
  const [updateTrueFalse] = useUpdateTrueFalseChallengeMutation()
  const [deleteTrueFalse] = useDeleteTrueFalseChallengeMutation()
  const [deleteMCQOptionChallenge] = useDeleteMCQOptionChallengeMutation()

  const [toggleTrueFalseStatus] = useToggleTrueFalseChallengeStatusMutation()
  const [toggleFillInTheBlanksStatus] = useToggleFillInTheBlanksChallengeStatusMutation()
  const [toggleMCQChallengeStatus] = useToggleMCQChallengeStatusMutation()

  if (!["task", "daily-challenge", "contest-quiz"].includes(challenge_type)) {
    return <div>Invalid challenge type</div>
  }

  // Get the questions arrays from the challenge data with proper null checks
  const blanks = isContestQuiz
    ? (challengeData?.data?.FillInTheBlanksChallenges ?? [])
    : isTaskChallenge
      ? (challengeData?.data?.FillInBlankChallenges ?? [])
      : (challengeData?.challenge?.FillInTheBlanksChallenges ?? [])

  const mcqs = isContestQuiz
    ? (challengeData?.data?.MCQChallenges ?? [])
    : isTaskChallenge
      ? (challengeData?.data?.MCQChallenges ?? [])
      : (challengeData?.challenge?.MCQChallenges ?? [])

  const trueFalse = isContestQuiz
    ? (challengeData?.data?.TrueFalseChallenges ?? [])
    : isTaskChallenge
      ? (challengeData?.data?.TrueFalseChallenges ?? [])
      : (challengeData?.challenge?.TrueFalseChallenges ?? [])

  // Combine all questions for "all" view
  const allQuestions = [
    ...blanks.map(q => ({ ...q, type: 'blanks', typeLabel: 'Fill in the Blanks', permission: "Fill-in-the-Blank Challenge" })),
    ...mcqs.map(q => ({ ...q, type: 'mcq', typeLabel: 'Multiple Choice', permission: "MCQ Challenge" })),
    ...trueFalse.map(q => ({ ...q, type: 'truefalse', typeLabel: 'True/False', permission: "True/False Challenge" }))
  ]

  // Helper functions
  const getCurrentQuestionType = () => {
    return challengeTypes.find((type) => type.id === selectedType) || challengeTypes[0]
  }

  const getQuestionsByType = (type) => {
    switch (type) {
      case "all":
        return allQuestions
      case "blanks":
        return blanks.map(q => ({ ...q, type: 'blanks', typeLabel: 'Fill in the Blanks', permission: "Fill-in-the-Blank Challenge" }))
      case "mcq":
        return mcqs.map(q => ({ ...q, type: 'mcq', typeLabel: 'Multiple Choice', permission: "MCQ Challenge" }))
      case "truefalse":
        return trueFalse.map(q => ({ ...q, type: 'truefalse', typeLabel: 'True/False', permission: "True/False Challenge" }))
      default:
        return []
    }
  }

  const handleToggleStatus = async (type, id) => {
    try {
      let response

      switch (type) {
        case "true_false":
          response = await toggleTrueFalseStatus(id).unwrap()
          break
        case "fill_in_the_blanks":
          response = await toggleFillInTheBlanksStatus(id).unwrap()
          break
        case "mcq":
          response = await toggleMCQChallengeStatus(id).unwrap()
          break
        default:
          toast.error("Invalid toggle type")
          return
      }

      refetch()
      toast.success(response.message || "Status toggled successfully!")
    } catch (error) {
      console.error(error)
      toast.error(error?.data?.message || error?.data?.error || "Failed to toggle status. Please try again.")
    }
  }

  // Handle type change
  const handleTypeChange = (type) => {
    setSelectedType(type)
    setIsDropdownOpen(false)
  }

  // Reset all forms
  const resetAllForms = () => {
    setBlankFormData({
      text: "",
      answers: [],
      ...(isContestQuiz
        ? { contest_quiz_id: id, challenge_task_id: null, challenge_id: null }
        : isTaskChallenge
          ? { challenge_task_id: id, challenge_id: null, contest_quiz_id: null }
          : { challenge_id: id, challenge_task_id: null, contest_quiz_id: null }),
    })
    setMCQFormData({
      question_text: "",
      options: [
        { option_text: "", option_type: "text", is_correct: false },
        { option_text: "", option_type: "text", is_correct: false },
      ],
      ...(isContestQuiz
        ? { contest_quiz_id: id, challenge_task_id: null, challenge_id: null }
        : isTaskChallenge
          ? { challenge_task_id: id, challenge_id: null, contest_quiz_id: null }
          : { challenge_id: id, challenge_task_id: null, contest_quiz_id: null }),
    })
    setTrueFalseFormData({
      question: "",
      answer: false,
      ...(isContestQuiz
        ? { contest_quiz_id: id, challenge_task_id: null, challenge_id: null }
        : isTaskChallenge
          ? { challenge_task_id: id, challenge_id: null, contest_quiz_id: null }
          : { challenge_id: id, challenge_task_id: null, contest_quiz_id: null }),
    })
    setNewBlankAnswer("")
    setNewMCQOption({
      option_text: "",
      option_type: "text",
      is_correct: false,
    })
    setIsEditing(false)
    setSelectedQuestion(null)
  }

  // Handle create question
  const handleCreateQuestion = (type = "blanks") => {
    setCreateQuestionType(type)
    resetAllForms()
    setShowFormModal(true)
  }

  // Handle view question
  const handleViewQuestion = (question) => {
    setSelectedQuestion(question)
    setShowViewModal(true)
  }

  // Handle edit question
  const handleEditQuestion = (question) => {
    setSelectedQuestion(question)
    setIsEditing(true)
    setCreateQuestionType(question.type)

    if (question.type === "blanks") {
      setBlankFormData({
        text: question.text,
        answers: [...question.answers],
        challenge_id: isTaskChallenge ? null : Number.parseInt(id),
        challenge_task_id: isTaskChallenge ? Number.parseInt(id) : null,
      })
    } else if (question.type === "mcq") {
      setMCQFormData({
        question_text: question.question_text,
        options: question.options?.map((opt) => ({
          id: opt.id,
          option_text: opt.option_text,
          option_type: opt.option_type || "text",
          is_correct: opt.is_correct === 1 ? true : false,
        })) || [],
        challenge_id: isTaskChallenge ? null : Number.parseInt(id),
        challenge_task_id: isTaskChallenge ? Number.parseInt(id) : null,
      })
    } else if (question.type === "truefalse") {
      setTrueFalseFormData({
        question: question.question,
        answer: Boolean(question.answer),
        challenge_id: isTaskChallenge ? null : Number.parseInt(id),
        challenge_task_id: isTaskChallenge ? Number.parseInt(id) : null,
      })
    }

    setShowViewModal(false)
    setShowFormModal(true)
  }

  // Handle delete question
  const handleDeleteQuestion = (questionId, questionType) => {
    setDeleteItemType(questionType)
    setDeleteItemId(questionId)
    setShowDeleteModal(true)
  }

  // Form submission handlers
  const handleBlankSubmit = async (e) => {
    e.preventDefault()

    const blankCount = (blankFormData.text.match(/___/g) || []).length
    const trimmedText = blankFormData.text.replace(/_+/g, "").trim();

    if (
      trimmedText.length === 0
    ) {
      toast.error("Please add some text other than blanks");
      return;
    }

    if (!blankFormData.text || blankFormData.answers.length === 0 || blankCount === 0) {
      toast.error("Please add both text and at least one answer")
      return
    }

    if (blankCount !== 1) {
      toast.error(`Please use exactly one blank (___) in your question. Currently you have ${blankCount} blanks.`)
      return
    }

    try {
      const requestData = {
        text: blankFormData.text,
        answers: blankFormData.answers,
        challenge_id: isContestQuiz ? null : isTaskChallenge ? null : Number.parseInt(id),
        challenge_task_id: isTaskChallenge ? Number.parseInt(id) : null,
        contest_quiz_id: isContestQuiz ? Number.parseInt(id) : null,
      }

      if (isEditing) {
        await updateBlank({ id: selectedQuestion.id, ...requestData }).unwrap()
        toast.success("Question updated successfully")
      } else {
        await createBlank(requestData).unwrap()
        toast.success("Question added successfully")
      }

      setShowFormModal(false)
      resetAllForms()
      refetch()
    } catch (error) {
      console.error("Failed to save question:", error)
      const errorMessage =
        error?.data?.error || error?.data?.message || error?.error || error?.message || "An unexpected error occurred"
      toast.error(errorMessage)
    }
  }

  const handleMCQSubmit = async (e) => {
    e.preventDefault()

    if (!mcqFormData.question_text || mcqFormData.options.length < 2) {
      toast.error("Please add question text and at least 2 options")
      return
    }

    const correctOptions = mcqFormData.options.filter((opt) => opt.is_correct)
    if (correctOptions.length === 0) {
      toast.error("Please mark at least one option as correct")
      return
    }

    try {
      const requestData = {
        question_text: mcqFormData.question_text,
        options: mcqFormData.options,
        challenge_id: isContestQuiz ? null : isTaskChallenge ? null : Number.parseInt(id),
        challenge_task_id: isTaskChallenge ? Number.parseInt(id) : null,
        contest_quiz_id: isContestQuiz ? Number.parseInt(id) : null,
      }

      if (isEditing) {
        await updateMCQ({ id: selectedQuestion.id, ...requestData }).unwrap()
        toast.success("Question updated successfully!")
      } else {
        await createMCQ(requestData).unwrap()
        toast.success("Question created successfully!")
      }

      setShowFormModal(false)
      resetAllForms()
      refetch()
    } catch (error) {
      console.error("Error saving question:", error)
      const errorMessage = error?.data?.message || error?.error || error?.message || "An unexpected error occurred"
      toast.error(errorMessage)
    }
  }

  const handleTrueFalseSubmit = async (e) => {
    e.preventDefault()

    if (!trueFalseFormData.question) {
      toast.error("Please add a question")
      return
    }

    try {
      const requestData = {
        question: trueFalseFormData.question,
        answer: trueFalseFormData.answer,
        challenge_id: isContestQuiz ? null : isTaskChallenge ? null : Number.parseInt(id),
        challenge_task_id: isTaskChallenge ? Number.parseInt(id) : null,
        contest_quiz_id: isContestQuiz ? Number.parseInt(id) : null,
      }

      if (isEditing) {
        await updateTrueFalse({ id: selectedQuestion.id, ...requestData }).unwrap()
        toast.success("Question updated successfully!")
      } else {
        await createTrueFalse(requestData).unwrap()
        toast.success("Question created successfully!")
      }

      setShowFormModal(false)
      resetAllForms()
      refetch()
    } catch (error) {
      console.error("Error saving question:", error)
      const errorMessage = error?.data?.message || error?.error || error?.message || "An unexpected error occurred"
      toast.error(errorMessage)
    }
  }

  // Helper functions for forms
  const addBlankAnswer = () => {
    if (!newBlankAnswer) {
      toast.error("Please enter an answer")
      return
    }
    setBlankFormData({
      ...blankFormData,
      answers: [...blankFormData.answers, newBlankAnswer],
    })
    setNewBlankAnswer("")
  }

  const removeBlankAnswer = (index) => {
    const updatedAnswers = [...blankFormData.answers]
    updatedAnswers.splice(index, 1)
    setBlankFormData({
      ...blankFormData,
      answers: updatedAnswers,
    })
  }

  const addMCQOption = () => {
    if (!newMCQOption.option_text) {
      toast.error("Please enter option text")
      return
    }
    setMCQFormData({
      ...mcqFormData,
      options: [...mcqFormData.options, newMCQOption],
    })
    setNewMCQOption({
      option_text: "",
      option_type: "text",
      is_correct: false,
    })
  }

  const removeMCQOption = async (index) => {
    const optionToDelete = mcqFormData.options[index]

    if (!optionToDelete?.id) {
      setMCQFormData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }))
      toast.success("Option Removed")
      return
    }

    try {
      await deleteMCQOptionChallenge(optionToDelete.id).unwrap()
      const updatedOptions = [...mcqFormData.options]
      updatedOptions.splice(index, 1)
      setMCQFormData({
        ...mcqFormData,
        options: updatedOptions,
      })
    } catch (error) {
      console.error("Failed to delete MCQ option:", error)
    }
  }

  const handleCorrectOptionChange = (selectedIndex) => {
    const updatedOptions = mcqFormData.options.map((opt, index) => ({
      ...opt,
      is_correct: index === selectedIndex,
    }))

    setMCQFormData({
      ...mcqFormData,
      options: updatedOptions,
    })
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      if (deleteItemType === "blanks") {
        await deleteBlank(deleteItemId).unwrap()
      } else if (deleteItemType === "mcq") {
        await deleteMCQ(deleteItemId).unwrap()
      } else if (deleteItemType === "truefalse") {
        await deleteTrueFalse(deleteItemId).unwrap()
      }

      toast.success("Question deleted successfully")
      setShowDeleteModal(false)
      setDeleteItemType(null)
      setDeleteItemId(null)
      refetch()
    } catch (error) {
      console.error("Failed to delete question:", error)
      const errorMessage =
        error?.data?.error || error?.data?.message || error?.error || error?.message || "An unexpected error occurred"
      toast.error(errorMessage)
    }
  }
  // Render question content for view modal
  const renderQuestionContent = (question) => {
    switch (question.type) {
      case "blanks":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">Question Text</h4>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <p className="text-gray-900 text-sm sm:text-base break-words leading-relaxed">
                  {question.text}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">Answers</h4>
              <div className="flex flex-wrap gap-2">
                {question.answers.map((answer, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-green-100 text-green-800 border border-green-200 rounded-full text-xs sm:text-sm font-medium break-words max-w-full"
                  >
                    {answer}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      case "mcq":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">Question Text</h4>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <p className="text-gray-900 text-sm sm:text-base break-words leading-relaxed">
                  {question.question_text}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">Options</h4>
              <div className="space-y-2 sm:space-y-3">
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-3 sm:p-4 rounded-lg border ${option.is_correct
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="font-medium text-xs sm:text-sm bg-white border border-gray-300 rounded px-2 py-1 flex-shrink-0 mt-0.5">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-sm sm:text-base break-words flex-1">
                          {option.option_text}
                        </span>
                      </div>
                      {Boolean(option.is_correct) && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium border border-green-200 flex-shrink-0 self-start sm:self-center">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case "truefalse":
        // Fix: Handle both boolean and numeric (0/1) values for answer
        const isTrue = question.answer === true || question.answer === 1 || question.answer === '1';

        return (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">Question</h4>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <p className="text-gray-900 text-sm sm:text-base break-words leading-relaxed">
                  {question.question}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">Answer</h4>
              <div className="flex gap-3">
                <span
                  className={`px-4 py-2 rounded-lg text-sm sm:text-base font-medium border ${isTrue
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                    }`}
                >
                  {isTrue ? "True" : "False"}
                </span>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Render form based on active tab
  const renderForm = () => {
    const currentType = challengeTypes.find(type => type.id === createQuestionType) || challengeTypes[1]

    return (
      <form onSubmit={
        createQuestionType === "blanks" ? handleBlankSubmit :
          createQuestionType === "mcq" ? handleMCQSubmit :
            handleTrueFalseSubmit
      } id="challengeContestQuestions" className="space-y-4 sm:space-y-6">
        {createQuestionType === "blanks" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={blankFormData.text}
                  onChange={(e) => setBlankFormData({ ...blankFormData, text: e.target.value })}
                  className="flex-1 px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter question text with ___ for blank"
                  required
                  maxLength={200}
                />
                <button
                  type="button"
                  onClick={() => {
                    const currentText = blankFormData.text
                    const blankCount = (currentText.match(/___/g) || []).length
                    if (blankCount === 0) {
                      setBlankFormData({ ...blankFormData, text: currentText + "___" })
                    } else {
                      toast.error("Only one blank is allowed per question")
                    }
                  }}
                  disabled={(blankFormData.text.match(/___/g) || []).length >= 1}
                  className={`px-4 py-2.5 sm:py-2 rounded-lg transition-all duration-200 font-medium text-sm ${(blankFormData.text.match(/___/g) || []).length >= 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-leafGreen text-white hover:bg-leafGreen/90 shadow-sm transition-all"
                    }`}
                >
                  Add ___
                </button>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {blankFormData.text.length}/200 characters
                </p>
                <p className="text-xs text-gray-500">
                  Only 1 blank allowed, multiple answers supported
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Answer</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newBlankAnswer}
                  onChange={(e) => setNewBlankAnswer(e.target.value)}
                  className="flex-1 px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter answer..."
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={addBlankAnswer}
                  className="px-4 py-2.5 sm:py-2 bg-leafGreen text-white rounded-lg hover:bg-primary transition-all duration-200 font-medium text-sm"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {newBlankAnswer.length}/50 characters
              </p>
            </div>
            {blankFormData.answers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answers ({blankFormData.answers.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {blankFormData.answers.map((answer, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-leafGreen/10 border border-leafGreen rounded-full px-3 py-1.5 max-w-full group"
                    >
                      <span className="text-sm text-leafGreen break-words mr-2 max-w-[120px] sm:max-w-[200px] truncate">
                        {answer}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBlankAnswer(index)}
                        className="text-leafGreen hover:text-red-600 flex-shrink-0 transition-colors text-sm"
                        title="Remove answer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {createQuestionType === "mcq" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
              <input
                type="text"
                value={mcqFormData.question_text}
                onChange={(e) => setMCQFormData({ ...mcqFormData, question_text: e.target.value })}
                className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                placeholder="Enter question text..."
                required
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {mcqFormData.question_text.length}/200 characters
              </p>
            </div>
            {/* {!isEditing && ( */}
            {mcqFormData.options.length > 0 && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options ({mcqFormData.options.length})
                  </label>
                  <span className="block text-sm font-medium text-gray-500 mb-2">
                    Max 8 Options Allowed
                  </span>
                </div>

                <div className="space-y-2">
                  {mcqFormData.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-gray-200 rounded-lg p-3 gap-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center flex-1 gap-3 w-full">
                        <span className="font-medium text-xs bg-gray-100 border border-gray-300 rounded px-2 py-1 flex-shrink-0 mt-0.5 sm:mt-0">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <input
                          type="text"
                          value={option.option_text}
                          onChange={(e) => {
                            const updatedOptions = [...mcqFormData.options]
                            updatedOptions[index].option_text = e.target.value
                            setMCQFormData({ ...mcqFormData, options: updatedOptions })
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                          placeholder="Option text"
                          required
                          maxLength={100}
                        />
                        <label className="flex items-center text-sm text-gray-700 whitespace-nowrap">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={option.is_correct}
                            onChange={() => handleCorrectOptionChange(index)}
                            className="mr-2 h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                          />
                          Correct
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMCQOption(index)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors self-end sm:self-center"
                        title="Remove option"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {mcqFormData?.options?.length < 8 && (
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add New Option</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newMCQOption.option_text}
                    onChange={(e) => setNewMCQOption({ ...newMCQOption, option_text: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter option text..."
                    maxLength={100}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={newMCQOption.is_correct}
                        onChange={(e) => setNewMCQOption({ ...newMCQOption, is_correct: e.target.checked })}
                        className="mr-2 h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300 rounded"
                      />
                      Mark as correct answer
                    </label>
                    <button
                      type="button"
                      onClick={addMCQOption}
                      className="px-4 py-2.5 sm:py-2 bg-leafGreen text-white rounded-lg hover:bg-primary transition-all duration-200 font-medium text-sm sm:w-auto w-full"
                    >
                      Add Option
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {newMCQOption.option_text.length}/100 characters
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {createQuestionType === "truefalse" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
              <input
                type="text"
                value={trueFalseFormData.question}
                onChange={(e) => setTrueFalseFormData({ ...trueFalseFormData, question: e.target.value })}
                className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                placeholder="Enter question text..."
                required
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {trueFalseFormData.question.length}/200 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="radio"
                    name="answer"
                    checked={trueFalseFormData.answer === true}
                    onChange={() => setTrueFalseFormData({ ...trueFalseFormData, answer: true })}
                    className="mr-2 h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                  />
                  True
                </label>
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="radio"
                    name="answer"
                    checked={trueFalseFormData.answer === false}
                    onChange={() => setTrueFalseFormData({ ...trueFalseFormData, answer: false })}
                    className="mr-2 h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                  />
                  False
                </label>
              </div>
            </div>
          </>
        )}
      </form>
    )
  }

  // Render question row for desktop
  const renderQuestionRowDesktop = (question, index) => {
    const questionText =
      question.type === "blanks" ? question.text :
        question.type === "mcq" ? question.question_text :
          question.question

    return (
      <tr key={question.id} className="hover:bg-lightGreen/20">
        <td className="px-6 py-4">
          <span className="text-sm font-medium text-gray-900">{index + 1}</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <div className="text-sm text-gray-900 max-w-md break-words">{questionText}</div>
            {selectedType === "all" && (
              <span className="text-xs text-gray-500 mt-1">{question.typeLabel}</span>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${question.is_active === 1 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}
          >
            {question.is_active === 1 ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-center gap-2 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleViewQuestion(question)
              }}
              className="h-8 w-8 p-0 hover:bg-leafGreen/10 rounded-lg flex items-center justify-center text-primary transition-colors"
              title="View Question"
            >
              <Eye size={14} />
            </button>

            <PermissionWrapper section={question?.permission} action="edit">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditQuestion(question)
                }}
                className="h-8 w-8 p-0 hover:bg-leafGreen/10 rounded-lg flex items-center justify-center text-primary transition-colors"
                title="Edit Question"
              >
                <Edit2 size={14} />
              </button>
            </PermissionWrapper>

            <PermissionWrapper section={question?.permission} action="toggle">
              <label
                className="relative inline-flex items-center cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                title={question.is_active ? "Deactivate" : "Activate"}
              >
                <input
                  type="checkbox"
                  checked={question.is_active}
                  onChange={() => handleToggleStatus(
                    question.type === "blanks" ? "fill_in_the_blanks" :
                      question.type === "mcq" ? "mcq" : "true_false",
                    question.id
                  )}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </label>
            </PermissionWrapper>

            <PermissionWrapper section={question?.permission} action="delete">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteQuestion(question.id, question.type)
                }}
                className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors"
                title="Delete Question"
              >
                <Trash2 size={14} />
              </button>
            </PermissionWrapper>
          </div>
        </td>
      </tr>
    )
  }

  // Render question card for mobile
  const renderQuestionCardMobile = (question, index) => {
    const questionText =
      question.type === "blanks" ? question.text :
        question.type === "mcq" ? question.question_text :
          question.question

    return (
      <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${question.is_active === 1 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}
          >
            {question.is_active === 1 ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="mb-3">
          <div className="text-sm text-gray-900 break-words mb-1">{questionText}</div>
          {selectedType === "all" && (
            <span className="text-xs text-gray-500">{question.typeLabel}</span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleViewQuestion(question)
              }}
              className="h-8 w-8 p-0 hover:bg-leafGreen/10 rounded-lg flex items-center justify-center text-primary transition-colors"
              title="View Question"
            >
              <Eye size={14} />
            </button>

            <PermissionWrapper section={question?.permission} action="edit">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditQuestion(question)
                }}
                className="h-8 w-8 p-0 hover:bg-leafGreen/10 rounded-lg flex items-center justify-center text-primary transition-colors"
                title="Edit Question"
              >
                <Edit2 size={14} />
              </button>
            </PermissionWrapper>
          </div>

          <div className="flex items-center gap-3">
            <PermissionWrapper section={question?.permission} action="toggle">
              <label
                className="relative inline-flex items-center cursor-pointer"
                onClick={(e) => e.stopPropagation()}
                title={question.is_active ? "Deactivate" : "Activate"}
              >
                <input
                  type="checkbox"
                  checked={question.is_active}
                  onChange={() => handleToggleStatus(
                    question.type === "blanks" ? "fill_in_the_blanks" :
                      question.type === "mcq" ? "mcq" : "true_false",
                    question.id
                  )}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </label>
            </PermissionWrapper>

            <PermissionWrapper section={question?.permission} action="delete">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteQuestion(question.id, question.type)
                }}
                className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors"
                title="Delete Question"
              >
                <Trash2 size={14} />
              </button>
            </PermissionWrapper>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestionType = getCurrentQuestionType()
  const questionsOfType = getQuestionsByType(selectedType)


  // if (isLoading) {
  //   return <AdminLoader className="h-screen" message="Loading questions..." />;
  // }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1 grid">
              <h1 className="text-2xl font-bold text-forestGreen">
                {isContestQuiz ? "Contest Quiz" : isTaskChallenge ? "Task Challenge" : "Daily Challenge"} Questions
              </h1>
              <p className="text-gray-600 mt-1 truncate">
                {challengeData?.challenge?.title || challengeData?.data?.title}
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-2 md:gap-3">
              {/* Question Type Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between w-full sm:w-auto gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors sm:px-3"
                >
                  <span className="truncate">{currentQuestionType.label}</span>
                  <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''} shrink-0`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 sm:right-auto sm:left-auto mt-2 w-full sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {challengeTypes.map((type) => (
                      type?.id === "all" ?
                        <button
                          key={type.id}
                          onClick={() => handleTypeChange(type.id)}
                          className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedType === type.id ? 'bg-lightGreen/20 text-forestGreen' : 'text-gray-700'
                            }`}
                        >
                          <type.icon size={18} className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{type.label}</div>
                            <div className="text-xs text-gray-500 truncate">{type.description}</div>
                          </div>
                        </button>
                        :
                        <PermissionWrapper section={type?.permission}>
                          <button
                            key={type.id}
                            onClick={() => handleTypeChange(type.id)}
                            className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedType === type.id ? 'bg-lightGreen/20 text-forestGreen' : 'text-gray-700'
                              }`}
                          >
                            <type.icon size={18} className="shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{type.label}</div>
                              <div className="text-xs text-gray-500 truncate">{type.description}</div>
                            </div>
                          </button>
                        </PermissionWrapper>
                    ))}
                  </div>
                )}
              </div>

              <PermissionWrapper section={currentQuestionType?.permission} action="create">
                <button
                  onClick={() => handleCreateQuestion(selectedType === 'all' ? 'blanks' : selectedType)}
                  disabled={selectedType === 'all'}
                  className="bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed sm:px-4"
                >
                  <Plus size={18} />
                  Create
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate(-1)}
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
                <h1 className="text-xl font-bold text-forestGreen">
                  {isContestQuiz ? "Contest Quiz" : isTaskChallenge ? "Task Challenge" : "Daily Challenge"}
                </h1>
                <p className="text-gray-600 text-sm mt-0.5 truncate">
                  {challengeData?.challenge?.title || challengeData?.data?.title}
                </p>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="flex border items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Action Buttons Row - Smaller size */}
            <div className="flex items-center gap-2">
              {/* Question Type Dropdown */}
              <div className="relative flex-1">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between w-full gap-1 px-2 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <span className="truncate font-medium">{currentQuestionType.label}</span>
                  <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''} shrink-0`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {challengeTypes.map((type) => (

                      type?.id === "all" ?
                        <button
                          key={type.id}
                          onClick={() => handleTypeChange(type.id)}
                          className={`flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${selectedType === type.id ? 'bg-lightGreen/20 text-forestGreen' : 'text-gray-700'
                            }`}
                        >
                          <type.icon size={16} className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{type.label}</div>
                          </div>
                        </button>
                        :
                        <PermissionWrapper section={type?.permission}>
                          <button
                            key={type.id}
                            onClick={() => handleTypeChange(type.id)}
                            className={`flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${selectedType === type.id ? 'bg-lightGreen/20 text-forestGreen' : 'text-gray-700'
                              }`}
                          >
                            <type.icon size={16} className="shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{type.label}</div>
                            </div>
                          </button>
                        </PermissionWrapper>
                    ))}
                  </div>
                )}
              </div>

              <PermissionWrapper section={currentQuestionType?.permission} action="create">
                <button
                  onClick={() => handleCreateQuestion(selectedType === 'all' ? 'blanks' : selectedType)}
                  disabled={selectedType === 'all'}
                  className="bg-leafGreen   text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  <span>Create</span>
                </button>
              </PermissionWrapper>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto max-w-8xl p-4 sm:p-6">
        {/* Questions Table/Cards */}
        {isLoading ?
          <AdminLoader message="Loading questions..." />
          : <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {questionsOfType.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-lightGreen border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Question
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {questionsOfType.map((question, index) => renderQuestionRowDesktop(question, index))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden p-4">
                  {questionsOfType.map((question, index) => renderQuestionCardMobile(question, index))}
                </div>
              </>
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
                  No Questions Found
                </h3>
                <p className="text-gray-500 mb-4 px-4">
                  {selectedType === "all"
                    ? "Select Question Type and Create your first question to get started."
                    : `Create your first ${currentQuestionType.label.toLowerCase()} question to get started.`}
                </p>
                {selectedType === "all" ?
                  <button
                    onClick={() => setIsDropdownOpen(true)}
                    className="px-4 py-2 bg-leafGreen hover:bg-leafGreen/90 text-white rounded-lg transition-all font-medium shadow-sm"
                  >
                    Select Question Type
                  </button>
                  :
                  <button
                    onClick={() => handleCreateQuestion(selectedType === "all" ? "blanks" : selectedType)}
                    className="px-4 py-2 bg-leafGreen hover:bg-leafGreen/90 text-white rounded-lg transition-all font-medium shadow-sm"
                  >
                    Create First Question
                  </button>
                }
              </div>
            )}
          </div>}

        {/* Create/Edit Question Modal */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {isEditing ? "Edit" : "Create New"} {challengeTypes.find(t => t.id === createQuestionType)?.label} Question
                </h2>
                <button
                  onClick={() => {
                    setShowFormModal(false)
                    resetAllForms()
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {renderForm()}

                {/* Spacer for mobile to ensure content doesn't get hidden behind fixed buttons */}
                <div className="h-4 sm:h-0"></div>
              </div>

              {/* Fixed Footer Buttons */}
              <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormModal(false)
                    resetAllForms()
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="challengeContestQuestions"
                  className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText size={16} className="flex-shrink-0" />
                  {isEditing ? "Update " : "Create "}<span className="hidden sm:inline">Question</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Question Modal */}
        {showViewModal && selectedQuestion && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[95vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {selectedQuestion.typeLabel} Question
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border ${selectedQuestion.is_active === 1
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                  >
                    {selectedQuestion.is_active === 1 ? "Active" : "Inactive"}
                  </span>
                  <span className="px-3 py-1.5 bg-lightGreen/20 text-forestGreen border border-lightGreen/30 rounded-full text-xs sm:text-sm font-medium">
                    {selectedQuestion.typeLabel}
                  </span>
                </div>

                {/* Question Content */}
                {renderQuestionContent(selectedQuestion)}

                {/* Spacer for mobile to ensure content doesn't get hidden behind fixed buttons */}
                <div className="h-4 sm:h-0"></div>
              </div>

              {/* Fixed Footer Buttons */}
              <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  Close
                </button>
                <PermissionWrapper section={selectedQuestion?.permission} action="edit">
                  <button
                    onClick={() => handleEditQuestion(selectedQuestion)}
                    className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit2 size={16} />
                    Edit Question
                  </button>
                </PermissionWrapper>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setDeleteItemType(null)
            setDeleteItemId(null)
          }}
          onConfirm={handleConfirmDelete}
          questionType={deleteItemType || ""}
          isDeleting={false}
        />
      </div>
    </div>
  )
}