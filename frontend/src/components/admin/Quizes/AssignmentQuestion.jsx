/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { Plus, ArrowLeft, FileText, Loader2, Trash2, X, Edit, Save, AlertCircle, Eye } from "lucide-react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  useGetAssignmentByIdQuery,
  useUpdateAssignmentMutation,
  useCreateTrueFalseQuestionMutation,
  useEditTrueFalseQuestionMutation,
  useDeleteTrueFalseQuestionMutation,
  useCreateFillBlanksQuestionMutation,
  useEditFillBlanksQuestionMutation,
  useDeleteFillBlanksQuestionMutation,
  useCreateMatchingQuestionMutation,
  useEditMatchingQuestionMutation,
  useDeleteMatchingQuestionMutation
} from "../../../services/Content_Management/assignmentApi"
import { getAdminToken } from "../../../services/CookieService"
import toast from "react-hot-toast"
import { Editor } from "@tinymce/tinymce-react"
import AIContentGenerator from "../../Home/courses/AIContentGenrator"
import { base64ToFile } from "../../../utils/toFileObject"
import PermissionWrapper from "../../../context/PermissionWrapper"
import AdminLoader from "../AdminLoader"

// Mobile Header Component
const MobileHeader = ({ assignmentData, categoryDisplayName, navigate, hasUnsavedChanges, isLoadingUpdateAssignment, handleSaveAllQuestions, editingQuestionId, handleAddQuestion, currentQuestions, handleUseGeneratedQuestions }) => {
  return (
    <div className="block md:hidden">
      {/* Top Row - Title and Back Button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1"></div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-forestGreen">
            {assignmentData.title}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Category: {categoryDisplayName}
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="flex border border-gray-300 items-center gap-2 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Row - AI and Save Buttons */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {((assignmentData.category == "paragraph_writing" && currentQuestions.length == 0) || assignmentData.category != "paragraph_writing") &&
          <AIContentGenerator
            contentType="assignment_questions"
            onUseGenerated={handleUseGeneratedQuestions}
            modalTitle="Generate Assignment Questions with AI"
            placeholderText="Describe what kind of assignment questions you want to create..."
            questionType={assignmentData.category}
            allowMultipleSelection={true}
          />}

        {/* Add Question/Prompt Button */}
        {!editingQuestionId && assignmentData.category !== "paragraph_writing" && (
          <PermissionWrapper section={assignmentData.category === "matching" ? "Matching Question" : assignmentData.category === "true_false" ? "True/False Question" : assignmentData.category === "fill_in_the_blanks" ? "Fill-in-the-Blank Question" : ""} action="create">
            <button
              onClick={handleAddQuestion}
              className="inline-flex items-center sm:px-4 p-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-leafGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add</span>
            </button>
          </PermissionWrapper>
        )}

        {!editingQuestionId && assignmentData.category === "paragraph_writing" && currentQuestions.length === 0 && (
          <button
            onClick={handleAddQuestion}
            className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-leafGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-xs">Add</span>
          </button>
        )}

        {/* Save All Button */}
        {hasUnsavedChanges && (
          <button
            onClick={handleSaveAllQuestions}
            disabled={isLoadingUpdateAssignment}
            className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-leafGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoadingUpdateAssignment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                <span className="text-xs">Save</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                <span className="text-xs">Save</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Mobile Questions List Component
const MobileQuestionsList = ({
  currentQuestions,
  assignmentData,
  categoryDisplayName,
  editingQuestionId,
  setEditingQuestionId,
  handleViewQuestion,
  handleDeleteQuestion,
  handleEditQuestion,
  deletingQuestionId,
  updateQuestion,
  setQuestions,
  setHasUnsavedChanges,
  addMatchingOption,
  removeMatchingOption,
  updateMatchingOption,
  renderMobileMatchingQuestionForm,
  renderTrueFalseQuestionForm,
  renderFillBlanksQuestionForm,
  renderMobileParagraphWritingForm
}) => {
  if (currentQuestions.length === 0) {
    return (
      <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-2">No questions yet</h3>
        <p className="text-xs text-gray-500 mb-4 px-4">
          Get started by adding your first {categoryDisplayName?.toLowerCase()} question.
        </p>

      </div>
    )
  }

  return (
    <div className="space-y-4">
      {currentQuestions.map((question, index) => (
        <div key={question.id || index} className="space-y-4">
          {/* Question Display Card - Mobile Optimized */}
          {editingQuestionId !== question.id && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-grow min-w-0"> {/* Added min-w-0 to prevent overflow */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {assignmentData.category === "paragraph_writing" ? "Writing Prompt" : `Q${index + 1}`}
                      </h4>
                      {question.isNew && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-lightGreen text-forestGreen flex-shrink-0">
                          New
                        </span>
                      )}
                      {question.hasChanges && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                          Unsaved
                        </span>
                      )}
                    </div>

                    {/* Question type specific preview - Mobile optimized */}
                    {assignmentData.category === "matching" && (
                      <>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2 break-words">{question.question_text || "No question text"}</p>
                        <div className="text-xs text-gray-500 mb-3">
                          <span className="font-medium">{question.MatchingOptions?.length || 0} pairs</span>
                        </div>

                        {/* Mobile optimized matching pairs display */}
                        <div className="space-y-2">
                          {question.MatchingOptions?.slice(0, 3).map((option, optIndex) => (
                            <div key={optIndex} className="bg-gray-50 p-2 rounded-lg">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs font-medium text-gray-700 flex-shrink-0">Option:</span>
                                <span className="text-xs text-gray-600 truncate break-words">
                                  {option.option_type === "image" ? "[Image]" : (option.option_text || "Empty")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium text-gray-700 flex-shrink-0">Match:</span>
                                <span className="text-xs text-gray-600 truncate break-words">
                                  {option.match_type === "image" ? "[Image]" : (option.match_text || "Empty")}
                                </span>
                              </div>
                            </div>
                          ))}
                          {question.MatchingOptions?.length > 3 && (
                            <div className="text-xs text-gray-500 text-center pt-2">
                              +{question.MatchingOptions.length - 3} more pairs
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {assignmentData.category === "true_false" && (
                      <div className="space-y-2">
                        {/* Question text with proper word breaking */}
                        <p className="text-sm text-gray-700 break-words leading-relaxed">
                          {question.question_text || "No question text"}
                        </p>

                        {/* Answer section - optimized for mobile */}
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                          <span className="text-xs font-medium text-gray-700 flex-shrink-0">Answer:</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${question.correct_answer
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}>
                            {question.correct_answer ? "True" : "False"}
                          </span>
                        </div>
                      </div>
                    )}

                    {assignmentData.category === "fill_in_the_blanks" && (
                      <div>
                        <div
                          className="text-sm text-gray-700 mb-2 line-clamp-3 break-words"
                          dangerouslySetInnerHTML={{ __html: question.question_text?.replace(/<[^>]*>/g, '') || "No question text" }}
                        />
                        {question.answers && question.answers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-gray-700">Answers:</p>
                            <span className="text-xs text-gray-500">{question.answers.length} blanks</span>
                          </div>
                        )}
                      </div>
                    )}

                    {assignmentData.category === "paragraph_writing" && (
                      <div
                        className="text-sm text-gray-700 line-clamp-4 break-words"
                        dangerouslySetInnerHTML={{ __html: question.paragraph_prompt?.replace(/<[^>]*>/g, '') || "No prompt text" }}
                      />
                    )}
                  </div>

                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    <button
                      onClick={() => handleViewQuestion(question, assignmentData.category)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <PermissionWrapper section={assignmentData.category === "matching" ? "Matching Question" : assignmentData.category === "true_false" ? "True/False Question" : assignmentData.category === "fill_in_the_blanks" ? "Fill-in-the-Blank Question" : ""} action="edit">
                      <button
                        onClick={() => handleEditQuestion(assignmentData.category, question)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors flex-shrink-0"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </PermissionWrapper>
                    {assignmentData.category !== "paragraph_writing" && (
                      <PermissionWrapper section={assignmentData.category === "matching" ? "Matching Question" : assignmentData.category === "true_false" ? "True/False Question" : assignmentData.category === "fill_in_the_blanks" ? "Fill-in-the-Blank Question" : ""} action="delete">
                        <button
                          onClick={() => handleDeleteQuestion(index)}
                          disabled={deletingQuestionId === question.id}
                          className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors flex-shrink-0"
                        >
                          {deletingQuestionId === question.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </PermissionWrapper>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question Edit Form - Mobile Optimized */}
          {editingQuestionId === question.id && (
            <div className="bg-white border-2 border-leafGreen/30 rounded-xl shadow-lg overflow-hidden">
              <div className="p-4">
                {/* Header with gradient background */}
                <div className=" bg-lightGreen rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {question.isNew
                        ? assignmentData.category === "paragraph_writing"
                          ? "Add Writing Prompt"
                          : "Add New Question"
                        : assignmentData.category === "paragraph_writing"
                          ? "Edit Writing Prompt"
                          : "Edit Question"}
                    </h4>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingQuestionId(null)
                          if (question.isNew) {
                            setQuestions((prev) => ({
                              ...prev,
                              [assignmentData.category]: prev[assignmentData.category].filter((_, i) => i !== index),
                            }))
                            setHasUnsavedChanges(false)
                          }
                        }}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-xs text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingQuestionId(null)}
                        className="inline-flex items-center p-2 border border-transparent text-xs rounded-lg text-white  bg-leafGreen   transition-colors shadow-sm"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Render appropriate form based on category - Mobile optimized */}
                <div className="space-y-4">
                  {/* {assignmentData.category === "matching" && renderMobileMatchingQuestionForm(question, index)} */}
                  {/* {assignmentData.category === "true_false" && renderTrueFalseQuestionForm(question, index)}
                  {assignmentData.category === "fill_in_the_blanks" && renderFillBlanksQuestionForm(question, index)} */}
                  {/* {assignmentData.category === "paragraph_writing" && renderMobileParagraphWritingForm(question, index)} */}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const AssignmentQuestion = () => {
  const { assignmentId } = useLocation().state
  const { access_token } = getAdminToken()
  const navigate = useNavigate()
  const { id } = useSelector((state) => state.user)

  // API hooks
  const {
    data: assignmentData,
    isLoading: isLoadingAssignment,
    refetch: refetchAssignment,
  } = useGetAssignmentByIdQuery({
    id: assignmentId,
    access_token,
  })

  const [updateAssignment, { isLoading: isLoadingUpdateAssignment }] = useUpdateAssignmentMutation()

  const [createTrueFalseQuestion, { isLoading: isLoadingCreateTrueFalseQuestion }] = useCreateTrueFalseQuestionMutation();
  const [editTrueFalseQuestion, { isLoading: isLoadingEditTrueFalseQuestion }] = useEditTrueFalseQuestionMutation();
  const [deleteTrueFalseQuestion, { isLoading: isLoadingDeleteTrueFalseQuestion }] = useDeleteTrueFalseQuestionMutation();

  const [createFillBlanksQuestion, { isLoading: isLoadingCreateFillBlanksQuestion }] = useCreateFillBlanksQuestionMutation();
  const [editFillBlanksQuestion, { isLoading: isLoadingEditFillBlanksQuestion }] = useEditFillBlanksQuestionMutation();
  const [deleteFillBlanksQuestion, { isLoading: isLoadingDeleteFillBlanksQuestion }] = useDeleteFillBlanksQuestionMutation();

  const [createMatchingQuestion, { isLoading: isLoadingCreateMatchingQuestion }] = useCreateMatchingQuestionMutation();
  const [editMatchingQuestion, { isLoading: isLoadingEditMatchingQuestion }] = useEditMatchingQuestionMutation();
  const [deleteMatchingQuestion, { isLoading: isLoadingDeleteMatchingQuestion }] = useDeleteMatchingQuestionMutation();

  // Core state
  const [questions, setQuestions] = useState({
    matching: [],
    true_false: [],
    fill_in_the_blanks: [],
    paragraph_writing: [],
  })

  // UI state
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [savingQuestionId, setSavingQuestionId] = useState(null)
  const [deletingQuestionId, setDeletingQuestionId] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [showTrueFalseModal, setShowTrueFalseModal] = useState(false)
  const [editingTrueFalseQuestion, setEditingTrueFalseQuestion] = useState(null)
  const [trueFalseModalMode, setTrueFalseModalMode] = useState('create') // 'create' or 'edit'

  const [showFillBlanksModal, setShowFillBlanksModal] = useState(false)
  const [editingFillBlanksQuestion, setEditingFillBlanksQuestion] = useState(null)
  const [fillBlanksModalMode, setFillBlanksModalMode] = useState('create') // 'create' or 'edit'

  const [showMatchingModal, setShowMatchingModal] = useState(false)
  const [editingMatchingQuestion, setEditingMatchingQuestion] = useState(null)
  const [matchingModalMode, setMatchingModalMode] = useState('create') // 'create' or 'edit'

  const [showParagraphModal, setShowParagraphModal] = useState(false)
  const [editingParagraphQuestion, setEditingParagraphQuestion] = useState(null)
  const [paragraphModalMode, setParagraphModalMode] = useState('create') // 'create' or 'edit'

  const [isBulkCreating, setIsBulkCreating] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!id) {
      navigate("/admin/dashboard")
      return
    }
  }, [id, navigate])

  // Transform matching questions from flattened structure to grouped structure
  const transformMatchingQuestions = (flatData) => {
    if (!flatData || flatData.length === 0) return []

    const grouped = {}
    flatData.forEach((item) => {
      if (!grouped[item.question_id]) {
        grouped[item.question_id] = {
          question_id: item.question_id,
          question_text: item.question_text,
          MatchingOptions: [],
          isNew: false,
        }
      }

      grouped[item.question_id].MatchingOptions.push({
        option_id: item.option_id,
        option_text: item.option_text,
        option_type: item.option_type,
        match_text: item.match_text,
        match_type: item.match_type,
      })
    })

    return Object.values(grouped)
  }

  const handleUseGeneratedQuestions = (generatedData) => {
    if (!generatedData) {
      toast.error("No generated data received");
      return;
    }

    // Check if it's single or multiple questions
    const isMultiple = Array.isArray(generatedData) && generatedData.length > 1;
    const questionsArray = Array.isArray(generatedData) ? generatedData : [generatedData];

    // Get the current assignment category
    const currentCategory = assignmentData?.category;
    if (!currentCategory) {
      toast.error("Assignment category not found");
      return;
    }

    // Special handling for paragraph_writing (only one prompt allowed)
    if (currentCategory === "paragraph_writing" && questionsArray.length > 1) {
      toast.error("Only one writing prompt is allowed. Please select only one prompt.");
      return;
    }

    // If single question, open appropriate modal for verification
    if (!isMultiple) {
      const question = Array.isArray(generatedData) ? generatedData[0] : generatedData;

      // Set up the question based on category and open modal
      switch (currentCategory) {
        case "true_false":
          setEditingTrueFalseQuestion({
            question_text: question.question_text || "",
            correct_answer: Boolean(question.correct_answer),
          });
          setTrueFalseModalMode('create');
          setShowTrueFalseModal(true);
          break;

        case "fill_in_the_blanks":
          setEditingFillBlanksQuestion({
            question_text: question.question_text || "",
            answers: question.answers || [],
          });
          setFillBlanksModalMode('create');
          setShowFillBlanksModal(true);
          break;

        case "matching":
          setEditingMatchingQuestion({
            question_text: question.question_text || "",
            MatchingOptions: (question.MatchingOptions || []).map(option => ({
              option_id: null,
              option_text: option.option_text || "",
              match_text: option.match_text || "",
              option_type: option.option_type || "text",
              match_type: option.match_type || "text",
            })),
          });
          setMatchingModalMode('create');
          setShowMatchingModal(true);
          break;

        case "paragraph_writing":
          setEditingParagraphQuestion({
            paragraph_prompt: question.paragraph_prompt || "",
          });
          setParagraphModalMode('create');
          setShowParagraphModal(true);
          break;

        default:
          toast.error("Unsupported question type");
          return;
      }

      toast.success("Generated question loaded for verification");
      return;
    }

    // If multiple questions, create them directly via API
    const createMultipleQuestions = async () => {
      setIsBulkCreating(true);
      try {
        let successCount = 0;

        for (const question of questionsArray) {
          try {
            const questionData = {
              question_text: question.question_text || "",
              assignment_id: assignmentId
            };

            switch (currentCategory) {
              case "true_false":
                const trueFalseData = {
                  ...questionData,
                  correct_answer: Boolean(question.correct_answer),
                };
                await createTrueFalseQuestion({
                  body: trueFalseData,
                  access_token: access_token
                }).unwrap();
                break;

              case "fill_in_the_blanks":
                const fillBlanksData = {
                  ...questionData,
                  answers: question.answers || [],
                };
                await createFillBlanksQuestion({
                  body: fillBlanksData,
                  access_token: access_token
                }).unwrap();
                break;

              case "matching":
                const formData = new FormData();
                formData.append('question_text', question.question_text || '');
                formData.append('assignment_id', assignmentId);

                (question.MatchingOptions || []).forEach((option, index) => {
                  formData.append(`options[${index}][option_type]`, option.option_type || 'text');
                  formData.append(`options[${index}][match_type]`, option.match_type || 'text');
                  formData.append(`options[${index}][option_text]`, option.option_text || '');
                  formData.append(`options[${index}][match_text]`, option.match_text || '');
                });

                await createMatchingQuestion({
                  formData: formData,
                  access_token: access_token
                }).unwrap();
                break;

              case "paragraph_writing":
                // For paragraph writing, only one is allowed
                if (successCount === 0) {
                  const formDataToSubmit = new FormData();
                  formDataToSubmit.append("category", currentCategory);
                  formDataToSubmit.append("paragraph_prompt", question.paragraph_prompt || "");

                  await updateAssignment({
                    id: assignmentId,
                    formData: formDataToSubmit,
                    access_token: access_token,
                  }).unwrap();
                }
                break;
            }

            successCount++;
          } catch (error) {
            console.error(`Error creating question:`, error);
            // Continue with next question even if one fails
          }
        }

        // Refresh the assignment data
        await refetchAssignment();

        // Show success message
        const categoryDisplayName = currentCategory.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        toast.success(`Successfully created ${successCount} out of ${questionsArray.length} ${categoryDisplayName.toLowerCase()} questions`);

      } catch (error) {
        console.error("Error in bulk creation:", error);
        toast.error("Error creating some questions");
      } finally {
        setIsBulkCreating(false);
      }
    };

    // Start the bulk creation process
    createMultipleQuestions();
  };

  // Load assignment data and questions
  useEffect(() => {
    if (assignmentData) {
      // Load existing questions based on category
      switch (assignmentData.category) {
        case "matching":
          const transformedMatching = transformMatchingQuestions(assignmentData.matchingQuestions)
          setQuestions((prev) => ({ ...prev, matching: transformedMatching }))
          break
        case "true_false":
          setQuestions((prev) => ({
            ...prev,
            true_false:
              assignmentData.trueFalseQuestions?.map((q) => ({
                question_id: q.id,
                question_text: q.question_text || q.question,
                correct_answer: Boolean(q.correct_answer) || false,
                isNew: false,
              })) || [],
          }))
          break
        case "fill_in_the_blanks":
          setQuestions((prev) => ({
            ...prev,
            fill_in_the_blanks:
              assignmentData.fillTheBlanksQuestions?.map((q) =>
                processFillInTheBlanksQuestion({
                  question_id: q.id,
                  question_text: q.question_text,
                  answers: q.answers,
                }),
              ) || [],
          }))
          break
        case "paragraph_writing":
          setQuestions((prev) => ({
            ...prev,
            paragraph_writing:
              assignmentData.paragraphWritings?.map((p) => ({
                question_id: p.id,
                paragraph_prompt: p.paragraph,
                isNew: false,
              })) || [],
          }))
          break
        default:
          break
      }
    }
  }, [assignmentData])

  // Get current category questions
  const currentQuestions = questions[assignmentData?.category] || []
  const categoryDisplayName = assignmentData?.category?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  const processFillInTheBlanksQuestion = (question) => {
    // If question already has answers array, reconstruct the HTML with underlined text
    if (question.answers && question.answers.length > 0) {
      let questionText = question.question_text
      let answerIndex = 0

      // Replace blanks with underlined answers for editing
      questionText = questionText.replace(/_{2,}\s*/g, () => {
        if (answerIndex < question.answers.length) {
          const answer = question.answers[answerIndex]
          answerIndex++
          return `<span style="text-decoration: underline">${answer}</span> `
        }
        return "_____ "
      })

      return {
        ...question,
        question_text: questionText,
        originalAnswers: question.answers, // Keep original answers for reference
        isNew: false,
      }
    }

    return {
      ...question,
      originalAnswers: question.answers || [],
      isNew: false,
    }
  }

  // Create new question based on type
  const createNewQuestion = (type) => {
    const baseQuestion = {
      id: `new_${Date.now()}`,
      question_id: null,
      isNew: true,
    }

    switch (type) {
      case "matching":
        return {
          ...baseQuestion,
          question_text: "",
          MatchingOptions: [
            {
              option_id: null,
              option_text: "",
              match_text: "",
              option_type: "text",
              match_type: "text",
            },
          ],
        }
      case "true_false":
        return {
          ...baseQuestion,
          question_text: "",
          correct_answer: false,
        }
      case "fill_in_the_blanks":
        return {
          ...baseQuestion,
          question_text: "",
          answers: [],
          originalAnswers: [],
        }
      case "paragraph_writing":
        return {
          ...baseQuestion,
          paragraph_prompt: "",
        }
      default:
        return baseQuestion
    }
  }

  // Add new question
  const handleAddQuestion = () => {
    // For true/false, open modal instead of inline form
    if (assignmentData.category === "true_false") {
      setEditingTrueFalseQuestion(null)
      setTrueFalseModalMode('create')
      setShowTrueFalseModal(true)
      return
    } else if (assignmentData.category === "fill_in_the_blanks") {
      setEditingFillBlanksQuestion(null)
      setFillBlanksModalMode('create')
      setShowFillBlanksModal(true)
      return
    } else if (assignmentData.category === "matching") {
      setEditingMatchingQuestion(null)
      setMatchingModalMode('create')
      setShowMatchingModal(true)
      return
    } else {
      // Existing code for other question types...
      const newQuestion = createNewQuestion(assignmentData.category)
      setQuestions((prev) => ({
        ...prev,
        [assignmentData.category]: [...prev[assignmentData.category], newQuestion],
      }))
      setEditingQuestionId(newQuestion.id)
      setHasUnsavedChanges(true)
    }
  }

  const handleEditQuestion = (category, question) => {
    if (category === "true_false") {
      setEditingTrueFalseQuestion(question)
      setTrueFalseModalMode('edit')
      setShowTrueFalseModal(true)
    } else if (category === "fill_in_the_blanks") {
      setEditingFillBlanksQuestion(question)
      setFillBlanksModalMode('edit')
      setShowFillBlanksModal(true)
    } else if (category === "paragraph_writing") {
      setEditingParagraphQuestion(question)
      setParagraphModalMode('edit')
      setShowParagraphModal(true)
    } else if (category === "matching") {
      setEditingMatchingQuestion(question)
      setMatchingModalMode('edit')
      setShowMatchingModal(true)
    } else {
      setEditingQuestionId(question.id)
    }
  }

  // Save all questions (using the original API structure)
  const handleSaveAllQuestions = async () => {
    if (!assignmentData) return

    const formDataToSubmit = new FormData()
    setSavingQuestionId("all")
    formDataToSubmit.append("category", assignmentData.category)

    try {
      const category = assignmentData.category

      if (category === "matching") {
        const validQuestionIds = []
        const matchingQuestions = questions.matching.map((question, qIndex) => {
          if (question.question_id) {
            validQuestionIds.push(question.question_id)
          }

          return {
            question_id: question.question_id || null,
            question_text: question.question_text,
            MatchingOptions: question.MatchingOptions.map((option, oIndex) => {
              let optionText = option.option_text
              let matchText = option.match_text

              if (option.option_type === "image" && option.option_text instanceof File) {
                const optionKey = `matching_option_image_${qIndex}_${oIndex}`
                formDataToSubmit.append(optionKey, option.option_text)
                optionText = optionKey
              }

              if (option.match_type === "image" && option.match_text instanceof File) {
                const matchKey = `matching_match_image_${qIndex}_${oIndex}`
                formDataToSubmit.append(matchKey, option.match_text)
                matchText = matchKey
              }

              return {
                option_id: option.option_id ?? null,
                option_text: optionText,
                match_text: matchText,
                option_type: option.option_type,
                match_type: option.match_type,
              }
            }),
          }
        })

        formDataToSubmit.append("matching_questions", JSON.stringify(matchingQuestions || []))
        formDataToSubmit.append("valid_matching_question_ids", JSON.stringify(validQuestionIds || []))
      }

      if (category === "true_false") {
        const validQuestionIds = questions.true_false.filter((q) => q.question_id).map((q) => q.question_id)
        formDataToSubmit.append("true_false_questions", JSON.stringify(questions.true_false || []))
        formDataToSubmit.append("valid_true_false_question_ids", JSON.stringify(validQuestionIds || []))
      }

      if (category === "fill_in_the_blanks") {
        const validQuestionIds = questions.fill_in_the_blanks.filter((q) => q.question_id).map((q) => q.question_id)
        formDataToSubmit.append("fill_the_blanks_questions", JSON.stringify(questions.fill_in_the_blanks || []))
        formDataToSubmit.append("valid_fill_blanks_question_ids", JSON.stringify(validQuestionIds || []))
      }

      if (category === "paragraph_writing") {
        // For paragraph writing, we send the prompt directly
        const paragraphPrompt = questions.paragraph_writing[0]?.paragraph_prompt || ""
        formDataToSubmit.append("paragraph_prompt", paragraphPrompt)
      }

      const response = await updateAssignment({
        id: assignmentId,
        formData: formDataToSubmit,
        access_token: access_token,
      }).unwrap()

      toast.success("Questions updated successfully!")
      setHasUnsavedChanges(false)
      setEditingQuestionId(null)

      // Mark all questions as saved
      setQuestions((prev) => ({
        ...prev,
        [category]: prev[category].map((q) => ({ ...q, isNew: false, hasChanges: false })),
      }))

      refetchAssignment()
    } catch (error) {
      console.error("Error updating questions:", error)
      const errorMessage =
        error?.data?.error || error?.data?.message || error?.error || error?.message || "Failed to update questions"
      toast.error(errorMessage)
    } finally {
      setSavingQuestionId(null)
    }
  }

  // Delete question
  const handleDeleteQuestion = (questionIndex) => {
    setQuestionToDelete({ index: questionIndex, category: assignmentData.category, question: currentQuestions[questionIndex] })
    setShowDeleteDialog(true)
  }

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return

    const { index, question } = questionToDelete
    setDeletingQuestionId(question.id)

    try {
      if (questionToDelete.category === 'true_false') {
        await deleteTrueFalseQuestion({
          id: question.question_id,
          access_token: access_token
        }).unwrap()
      } else if (questionToDelete.category === 'fill_in_the_blanks') {
        await deleteFillBlanksQuestion({
          id: question.question_id,
          access_token: access_token
        }).unwrap()
      } else if (questionToDelete.category === 'matching') {
        await deleteMatchingQuestion({
          id: question.question_id,
          access_token: access_token
        }).unwrap()
      } else {
        // Remove from state immediately for better UX
        setQuestions((prev) => ({
          ...prev,
          [assignmentData.category]: prev[assignmentData.category].filter((_, i) => i !== index),
        }))
        setHasUnsavedChanges(true)
      }
    } catch (error) {
      console.error("Error deleting question:", error)
      toast.error("Error removing question")
    } finally {
      setDeletingQuestionId(null)
      setShowDeleteDialog(false)
      setQuestionToDelete(null)
      refetchAssignment();
    }
  }

  // Update question
  const updateQuestion = (questionIndex, updatedQuestion) => {
    setQuestions((prev) => ({
      ...prev,
      [assignmentData.category]: prev[assignmentData.category].map((q, index) =>
        index === questionIndex ? { ...updatedQuestion, hasChanges: true } : q,
      ),
    }))
    setHasUnsavedChanges(true)
  }

  // Matching question helpers
  const addMatchingOption = (questionIndex) => {
    const question = currentQuestions[questionIndex]
    const updatedQuestion = {
      ...question,
      MatchingOptions: [
        ...question.MatchingOptions,
        {
          option_id: null,
          option_text: "",
          match_text: "",
          option_type: "text",
          match_type: "text",
        },
      ],
    }
    updateQuestion(questionIndex, updatedQuestion)
  }

  const removeMatchingOption = (questionIndex, optionIndex) => {
    const question = currentQuestions[questionIndex]
    const updatedQuestion = {
      ...question,
      MatchingOptions: question.MatchingOptions.filter((_, index) => index !== optionIndex),
    }
    updateQuestion(questionIndex, updatedQuestion)
  }

  const updateMatchingOption = (questionIndex, optionIndex, field, value, type) => {
    const question = currentQuestions[questionIndex]
    const updatedOptions = [...question.MatchingOptions]
    const currentOption = { ...updatedOptions[optionIndex] }
    const fieldType = `${field.split("_")[0]}_type`

    const updatedOption = {
      ...currentOption,
      [fieldType]: currentOption[fieldType], // Preserve existing type
    }

    // Handle type change
    if (type) {
      updatedOption[fieldType] = type
      // Only clear content when switching from image to text
      if (type === "text" && currentOption[fieldType] === "image") {
        updatedOption[field] = ""
      }
    }

    // Handle value change
    if (value !== undefined) {
      updatedOption[field] = value
      // Set type to image if uploading a file
      if (value instanceof File) {
        updatedOption[fieldType] = "image"
      }
    }

    updatedOptions[optionIndex] = updatedOption

    updateQuestion(questionIndex, {
      ...question,
      MatchingOptions: updatedOptions,
    })
  }

  // View question modal
  const handleViewQuestion = (question, type) => {
    setSelectedQuestion({ ...question, type })
    setShowViewModal(true)
  }

  // True/False Modal Component
  const TrueFalseModal = () => {
    const [questionText, setQuestionText] = useState('')
    const [correctAnswer, setCorrectAnswer] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
      if (editingTrueFalseQuestion) {
        setQuestionText(editingTrueFalseQuestion.question_text || '')
        setCorrectAnswer(editingTrueFalseQuestion.correct_answer || false)
      } else {
        setQuestionText('')
        setCorrectAnswer(false)
      }
    }, [editingTrueFalseQuestion])

    const handleSubmit = async () => {
      if (!questionText.trim()) {
        toast.error('Please enter question text')
        return
      }

      setIsSubmitting(true)
      try {
        const questionData = {
          question_text: questionText,
          correct_answer: correctAnswer,
          assignment_id: assignmentId
        }

        let response
        if (trueFalseModalMode === 'edit' && editingTrueFalseQuestion?.question_id) {
          response = await editTrueFalseQuestion({
            questionId: editingTrueFalseQuestion.question_id,
            body: questionData,
            access_token: access_token
          }).unwrap()

          // Update state for edited question
          setQuestions(prev => ({
            ...prev,
            true_false: prev.true_false.map(q =>
              q.question_id === editingTrueFalseQuestion.question_id
                ? { ...q, question_text: questionText, correct_answer: correctAnswer }
                : q
            )
          }))
        } else {
          response = await createTrueFalseQuestion({
            body: questionData,
            access_token: access_token
          }).unwrap()
        }

        toast.success(`Question ${trueFalseModalMode === 'edit' ? 'updated' : 'created'} successfully!`)

        // Close modal
        setShowTrueFalseModal(false)
        setEditingTrueFalseQuestion(null)
      } catch (error) {
        console.error(error);
      } finally {
        refetchAssignment();
        setIsSubmitting(false)
      }
    }

    if (!showTrueFalseModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-forestGreen">
              {trueFalseModalMode === 'edit' ? 'Edit True/False Question' : 'Create True/False Question'}
            </h2>
            <button
              onClick={() => {
                setShowTrueFalseModal(false)
                setEditingTrueFalseQuestion(null)
              }}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                placeholder="Enter your true/false question"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Correct Answer
              </label>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="correctAnswer"
                    value="true"
                    checked={correctAnswer === true}
                    onChange={() => setCorrectAnswer(true)}
                    className="form-radio h-4 w-4 accent-leafGreen focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">True</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="correctAnswer"
                    value="false"
                    checked={correctAnswer === false}
                    onChange={() => setCorrectAnswer(false)}
                    className="form-radio h-4 w-4 accent-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">False</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
            <button
              type="button"
              onClick={() => {
                setShowTrueFalseModal(false)
                setEditingTrueFalseQuestion(null)
              }}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !questionText.trim()}
              className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? "Saving..." : trueFalseModalMode === 'edit' ? "Update Question" : "Create Question"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Fill-in-the-Blanks Modal Component
  const FillBlanksModal = () => {
    const [questionText, setQuestionText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
      if (editingFillBlanksQuestion) {
        // Extract plain text without HTML tags for editing
        const plainText = editingFillBlanksQuestion.question_text || ''
        setQuestionText(plainText)
      } else {
        setQuestionText('')
      }
    }, [editingFillBlanksQuestion])

    const handleSubmit = async () => {
      if (!questionText.trim()) {
        toast.error('Please enter question text')
        return
      }

      const hasUnderline =
        questionText.includes("<u>") ||
        questionText.includes("text-decoration: underline")

      if (!hasUnderline) {
        toast.error("Please underline at least one word in the question.")
        return
      }

      setIsSubmitting(true)
      try {
        // Process question text to extract answers (text between underscores)
        const answers = []
        let processedText = questionText
        let answerIndex = 0

        // Replace underscores with blanks and collect answers
        processedText = processedText.replace(/_{2,}\s*/g, (match) => {
          const answerId = `answer_${answerIndex++}`
          answers.push({
            id: answerId,
            text: match.trim() // You might want to collect actual answers from the user
          })
          return `[${answerId}]`
        })

        const questionData = {
          question_text: processedText,
          answers: answers.map(a => a.text),
          assignment_id: assignmentId
        }

        let response
        if (fillBlanksModalMode === 'edit' && editingFillBlanksQuestion?.question_id) {
          response = await editFillBlanksQuestion({
            questionId: editingFillBlanksQuestion.question_id,
            body: questionData,
            access_token: access_token
          }).unwrap()

          // Update state for edited question
          setQuestions(prev => ({
            ...prev,
            fill_in_the_blanks: prev.fill_in_the_blanks.map(q =>
              q.question_id === editingFillBlanksQuestion.question_id
                ? { ...q, question_text: questionText, answers: questionData.answers }
                : q
            )
          }))
        } else {
          response = await createFillBlanksQuestion({
            body: questionData,
            access_token: access_token
          }).unwrap()
        }

        toast.success(`Question ${fillBlanksModalMode === 'edit' ? 'updated' : 'created'} successfully!`)

        // Close modal
        setShowFillBlanksModal(false)
        setEditingFillBlanksQuestion(null)
      } catch (error) {
        console.error('Error saving fill-in-the-blanks question:', error)
        const errorMessage = error?.data?.error || error?.data?.message || error?.error || error?.message || 'Failed to save question'
        toast.error(errorMessage)
      } finally {
        refetchAssignment()
        setIsSubmitting(false)
      }
    }

    if (!showFillBlanksModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              {fillBlanksModalMode === 'edit' ? 'Edit Fill-in-the-Blanks Question' : 'Create Fill-in-the-Blanks Question'}
            </h2>
            <button
              onClick={() => {
                setShowFillBlanksModal(false)
                setEditingFillBlanksQuestion(null)
              }}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {/* Instructions */}
            <div className="p-3 bg-lightGreen border border-leafGreen/30 rounded-md">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-forestGreen mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-forestGreen">
                  Use the editor below and <strong>underline</strong> text to mark it as a blank that students need to
                  fill.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text with Blanks
              </label>
              <Editor
                apiKey={import.meta.env.VITE_TINYMCE_API}
                value={questionText}
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
                onEditorChange={(content) =>
                  setQuestionText(content)
                }
              />
            </div>

            {/* Preview Section */}
            {/* {questionText && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: questionText?.replace(/<[^>]*>/g, '') || "No prompt text" }}
                  >
                  </div>
                </div>
              </div>
            )} */}
          </div>

          <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
            <button
              type="button"
              onClick={() => {
                setShowFillBlanksModal(false)
                setEditingFillBlanksQuestion(null)
              }}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !questionText.trim()}
              className="px-6 py-2.5 text-sm font-medium text-white  bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : fillBlanksModalMode === 'edit' ? "Update Question" : "Create Question"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Matching Modal Component
  const MatchingModal = () => {
    const [questionText, setQuestionText] = useState('')
    const [matchingOptions, setMatchingOptions] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
      if (editingMatchingQuestion) {
        setQuestionText(editingMatchingQuestion.question_text || '')
        setMatchingOptions(editingMatchingQuestion.MatchingOptions || [])
      } else {
        setQuestionText('')
        setMatchingOptions([{
          option_id: null,
          option_text: '',
          option_type: 'text',
          match_text: '',
          match_type: 'text'
        }])
      }
    }, [editingMatchingQuestion])

    const addMatchingOptionInModal = () => {
      setMatchingOptions([...matchingOptions, {
        option_id: null,
        option_text: '',
        option_type: 'text',
        match_text: '',
        match_type: 'text'
      }])
    }

    const removeMatchingOptionInModal = (index) => {
      if (matchingOptions.length > 1) {
        const newOptions = [...matchingOptions]
        newOptions.splice(index, 1)
        setMatchingOptions(newOptions)
      }
    }

    const updateMatchingOptionInModal = (index, field, value, type) => {
      const newOptions = [...matchingOptions]
      const currentOption = { ...newOptions[index] }
      const fieldType = `${field.split("_")[0]}_type`

      // Handle type change
      if (type) {
        currentOption[fieldType] = type
        // Clear content when switching from image to text
        if (type === "text" && currentOption[fieldType] === "image") {
          currentOption[field] = ""
        }
      }

      // Handle value change
      if (value !== undefined) {
        currentOption[field] = value
        // Set type to image if uploading a file
        if (value instanceof File) {
          currentOption[fieldType] = "image"
        }
      }

      newOptions[index] = currentOption
      setMatchingOptions(newOptions)
    }

    const handleSubmit = async () => {
      if (!questionText.trim()) {
        toast.error('Please enter question text')
        return
      }

      if (matchingOptions.length === 0) {
        toast.error('Please add at least one matching pair')
        return
      }

      // Validate all options
      for (let i = 0; i < matchingOptions.length; i++) {
        const option = matchingOptions[i]
        if (!option.option_text) {
          toast.error(`Please enter option ${i + 1} ${option.option_type}`)
          return
        }
        if (!option.match_text) {
          toast.error(`Please enter match ${i + 1} ${option.match_type}`)
          return
        }
      }

      setIsSubmitting(true)
      try {
        const formData = new FormData()

        // Add question data
        formData.append('question_text', questionText)
        formData.append('assignment_id', assignmentId)

        // Add matching options
        matchingOptions.forEach((option, index) => {
          if (option?.option_id) formData.append(`options[${index}][option_id]`, option.option_id)
          formData.append(`options[${index}][option_type]`, option.option_type)
          formData.append(`options[${index}][match_type]`, option.match_type)

          // Handle file uploads
          if (option.option_type === 'image' && option.option_text instanceof File) {
            formData.append(`option_images[${index}]`, option.option_text)
          } else {
            formData.append(`options[${index}][option_text]`, option.option_text)
          }

          if (option.match_type === 'image' && option.match_text instanceof File) {
            formData.append(`match_images[${index}]`, option.match_text)
          } else {
            formData.append(`options[${index}][match_text]`, option.match_text)
          }
        })

        let response
        if (matchingModalMode === 'edit' && editingMatchingQuestion?.question_id) {
          response = await editMatchingQuestion({
            questionId: editingMatchingQuestion.question_id,
            formData: formData,
            access_token: access_token
          }).unwrap()

          // Update state for edited question
          setQuestions(prev => ({
            ...prev,
            matching: prev.matching.map(q =>
              q.question_id === editingMatchingQuestion.question_id
                ? {
                  ...q,
                  question_text: questionText,
                  MatchingOptions: matchingOptions,
                  hasChanges: false
                }
                : q
            )
          }))
        } else {
          response = await createMatchingQuestion({
            formData: formData,
            access_token: access_token
          }).unwrap()

          // Add new question to state
          const newQuestion = {
            id: `new_${Date.now()}`,
            question_id: response.id,
            question_text: questionText,
            MatchingOptions: matchingOptions,
            isNew: false,
            hasChanges: false
          }

          setQuestions(prev => ({
            ...prev,
            matching: [...prev.matching, newQuestion]
          }))
        }

        toast.success(`Matching question ${matchingModalMode === 'edit' ? 'updated' : 'created'} successfully!`)

        // Close modal
        setShowMatchingModal(false)
        setEditingMatchingQuestion(null)
      } catch (error) {
        console.error('Error saving matching question:', error)
        const errorMessage = error?.data?.error || error?.data?.message || error?.error || error?.message || 'Failed to save question'
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
        refetchAssignment()
      }
    }

    if (!showMatchingModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl overflow-hidden w-full max-w-5xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              {matchingModalMode === 'edit' ? 'Edit Matching Question' : 'Create Matching Question'}
            </h2>
            <button
              onClick={() => {
                setShowMatchingModal(false)
                setEditingMatchingQuestion(null)
              }}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                  placeholder="Enter your matching question"
                  rows={3}
                />
              </div>

              {/* Matching Pairs */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Matching Pairs
                  </label>
                  <button
                    type="button"
                    onClick={addMatchingOptionInModal}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-leafGreen   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Pair
                  </button>
                </div>

                {matchingOptions.map((option, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 relative">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Option Side */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-gray-700">
                            Option {index + 1}
                          </label>
                          <div className="flex gap-3">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`modal-option-type-${index}`}
                                value="text"
                                checked={option.option_type === "text" || !option.option_type}
                                onChange={() => updateMatchingOptionInModal(index, "option_text", "", "text")}
                                className="form-radio h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                              />
                              <span className="ml-2 text-xs text-gray-700">Text</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`modal-option-type-${index}`}
                                value="image"
                                checked={option.option_type === "image"}
                                onChange={() => updateMatchingOptionInModal(index, "option_text", "", "image")}
                                className="form-radio h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                              />
                              <span className="ml-2 text-xs text-gray-700">Image</span>
                            </label>
                          </div>
                        </div>

                        {option.option_type === "text" ? (
                          <input
                            type="text"
                            value={option.option_text}
                            onChange={(e) => updateMatchingOptionInModal(index, "option_text", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                            placeholder="Enter option text"
                          />
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => updateMatchingOptionInModal(index, "option_text", e.target.files[0])}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                            />
                            {option.option_text && (
                              <div className="border border-gray-200 rounded p-2">
                                <img
                                  src={
                                    option.option_text instanceof File
                                      ? URL.createObjectURL(option.option_text)
                                      : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_text || "/placeholder.png"}`
                                  }
                                  alt={`Option ${index + 1}`}
                                  className="h-20 object-contain mx-auto"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Match Side */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-gray-700">
                            Match {index + 1}
                          </label>
                          <div className="flex gap-3">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`modal-match-type-${index}`}
                                value="text"
                                checked={option.match_type === "text" || !option.match_type}
                                onChange={() => updateMatchingOptionInModal(index, "match_text", "", "text")}
                                className="form-radio h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                              />
                              <span className="ml-2 text-xs text-gray-700">Text</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`modal-match-type-${index}`}
                                value="image"
                                checked={option.match_type === "image"}
                                onChange={() => updateMatchingOptionInModal(index, "match_text", "", "image")}
                                className="form-radio h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                              />
                              <span className="ml-2 text-xs text-gray-700">Image</span>
                            </label>
                          </div>
                        </div>

                        {option.match_type === "text" ? (
                          <input
                            type="text"
                            value={option.match_text}
                            onChange={(e) => updateMatchingOptionInModal(index, "match_text", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                            placeholder="Enter match text"
                          />
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => updateMatchingOptionInModal(index, "match_text", e.target.files[0])}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                            />
                            {option.match_text && (
                              <div className="border border-gray-200 rounded p-2">
                                <img
                                  src={
                                    option.match_text instanceof File
                                      ? URL.createObjectURL(option.match_text)
                                      : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.match_text || "/placeholder.png"}`
                                  }
                                  alt={`Match ${index + 1}`}
                                  className="h-20 object-contain mx-auto"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remove Option Button */}
                    {matchingOptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMatchingOptionInModal(index)}
                        className="absolute -top-7 -right-3 h-6 w-6 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
            <button
              type="button"
              onClick={() => {
                setShowMatchingModal(false)
                setEditingMatchingQuestion(null)
              }}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !questionText.trim() || matchingOptions.length === 0}
              className="px-6 py-2.5 text-sm font-medium text-white  bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : matchingModalMode === 'edit' ? "Update Question" : "Create Question"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Paragraph Writing Modal Component
  const ParagraphWritingModal = () => {
    const [paragraphPrompt, setParagraphPrompt] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
      if (editingParagraphQuestion) {
        setParagraphPrompt(editingParagraphQuestion.paragraph_prompt || '')
      } else {
        setParagraphPrompt('')
      }
    }, [editingParagraphQuestion])

    const handleSubmit = async () => {
      if (!paragraphPrompt.trim()) {
        toast.error('Please enter a writing prompt')
        return
      }

      setIsSubmitting(true)
      try {
        const formDataToSubmit = new FormData()

        if (paragraphModalMode === 'edit' && editingParagraphQuestion?.question_id) {
          formDataToSubmit.append("category", assignmentData.category)
          // For paragraph writing, we send the prompt directly
          formDataToSubmit.append("paragraph_prompt", paragraphPrompt)

          const response = await updateAssignment({
            id: assignmentId,
            formData: formDataToSubmit,
            access_token: access_token,
          }).unwrap()
        } else {
          // Create new paragraph question
          const newQuestion = {
            id: `new_${Date.now()}`,
            question_id: null,
            paragraph_prompt: paragraphPrompt,
            isNew: true,
            hasChanges: true,
          }
          setQuestions((prev) => ({
            ...prev,
            paragraph_writing: [...prev.paragraph_writing, newQuestion],
          }))
          setHasUnsavedChanges(true)
        }

        toast.success(`Writing prompt ${paragraphModalMode === 'edit' ? 'updated' : 'created'} successfully!`)

        // Close modal
        setShowParagraphModal(false)
        setEditingParagraphQuestion(null)
      } catch (error) {
        console.error('Error saving paragraph writing prompt:', error)
        const errorMessage = error?.data?.error || error?.data?.message || error?.error || error?.message || 'Failed to save writing prompt'
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
        refetchAssignment()
      }
    }

    if (!showParagraphModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl overflow-hidden w-full max-w-4xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              {paragraphModalMode === 'edit' ? 'Edit Writing Prompt' : 'Create Writing Prompt'}
            </h2>
            <button
              onClick={() => {
                setShowParagraphModal(false)
                setEditingParagraphQuestion(null)
              }}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {/* Instructions */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-4">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Create a writing prompt that will guide students to write a paragraph response. Be clear and specific about what you want them to address.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Writing Prompt
              </label>
              <div className="border border-gray-300 rounded-lg w-full overflow-hidden">
                <Editor
                  apiKey={import.meta.env.VITE_TINYMCE_API}
                  value={paragraphPrompt}
                  init={{
                    height: 300,
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
                      "bullist numlist outdent indent | link | removeformat | help",
                    content_style: "body { font-family:Arial,Helvetica,sans-serif; font-size:14px }",
                    placeholder: "Enter your writing prompt here...",
                  }}
                  onEditorChange={(content) => setParagraphPrompt(content)}
                />
              </div>
            </div>

            {/* Preview Section */}
            {/* {paragraphPrompt && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div
                    className="text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: paragraphPrompt }}
                  />
                </div>
              </div>
            )} */}
          </div>

          <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
            <button
              type="button"
              onClick={() => {
                setShowParagraphModal(false)
                setEditingParagraphQuestion(null)
              }}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !paragraphPrompt.trim()}
              className="px-6 py-2.5 text-sm font-medium text-white  bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : paragraphModalMode === 'edit' ? "Update Prompt" : "Create Prompt"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Mobile-optimized matching question form
  const renderMobileMatchingQuestionForm = (question, questionIndex) => (
    <div key={questionIndex} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
        <input
          type="text"
          value={question.question_text}
          onChange={(e) => updateQuestion(questionIndex, { ...question, question_text: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen text-sm"
          placeholder="Enter question text"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Matching Pairs</label>

        {question.MatchingOptions?.map((option, optionIndex) => (
          <div key={optionIndex} className="p-3 border border-gray-200 rounded-lg space-y-3 relative">
            {/* Option Section - Stacked vertically */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-gray-700">Option {optionIndex + 1}</label>
                <div className="flex gap-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`mobile-option-type-${questionIndex}-${optionIndex}`}
                      value="text"
                      checked={option.option_type === "text" || !option.option_type}
                      onChange={() => updateMatchingOption(questionIndex, optionIndex, "option_text", "", "text")}
                      className="form-radio h-3 w-3 accent-leafGreen focus:ring-leafGreen border-gray-300"
                    />
                    <span className="ml-1 text-xs text-gray-700">Text</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`mobile-option-type-${questionIndex}-${optionIndex}`}
                      value="image"
                      checked={option.option_type === "image"}
                      onChange={() => updateMatchingOption(questionIndex, optionIndex, "option_text", "", "image")}
                      className="form-radio h-3 w-3 accent-leafGreen focus:ring-leafGreen border-gray-300"
                    />
                    <span className="ml-1 text-xs text-gray-700">Image</span>
                  </label>
                </div>
              </div>

              {option.option_type === "text" ? (
                <input
                  type="text"
                  value={option.option_text}
                  onChange={(e) =>
                    updateMatchingOption(questionIndex, optionIndex, "option_text", e.target.value, "text")
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-leafGreen focus:border-leafGreen"
                  placeholder="Enter option text"
                />
              ) : (
                <div className="space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      updateMatchingOption(questionIndex, optionIndex, "option_text", e.target.files[0])
                    }
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                  />
                  {option.option_text && (
                    <div className="border border-gray-200 rounded p-1">
                      <img
                        src={
                          option.option_text instanceof File
                            ? URL.createObjectURL(option.option_text)
                            : typeof option.option_text === "string" && option.option_text.startsWith("/")
                              ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_text || "/placeholder.png"}`
                              : `/placeholder.svg?height=60&width=80&text=Option`
                        }
                        alt={`Option ${optionIndex + 1}`}
                        className="h-12 object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Match Section - Stacked vertically */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-gray-700">Match {optionIndex + 1}</label>
                <div className="flex gap-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`mobile-match-type-${questionIndex}-${optionIndex}`}
                      value="text"
                      checked={option.match_type === "text" || !option.match_type}
                      onChange={() => updateMatchingOption(questionIndex, optionIndex, "match_text", "", "text")}
                      className="form-radio h-3 w-3 accent-leafGreen focus:ring-leafGreen border-gray-300"
                    />
                    <span className="ml-1 text-xs text-gray-700">Text</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`mobile-match-type-${questionIndex}-${optionIndex}`}
                      value="image"
                      checked={option.match_type === "image"}
                      onChange={() => updateMatchingOption(questionIndex, optionIndex, "match_text", "", "image")}
                      className="form-radio h-3 w-3 accent-leafGreen focus:ring-leafGreen border-gray-300"
                    />
                    <span className="ml-1 text-xs text-gray-700">Image</span>
                  </label>
                </div>
              </div>

              {option.match_type === "text" ? (
                <input
                  type="text"
                  value={option.match_text}
                  onChange={(e) =>
                    updateMatchingOption(questionIndex, optionIndex, "match_text", e.target.value, "text")
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-leafGreen focus:border-leafGreen"
                  placeholder="Enter match text"
                />
              ) : (
                <div className="space-y-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      updateMatchingOption(questionIndex, optionIndex, "match_text", e.target.files[0])
                    }
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                  />
                  {option.match_text && (
                    <div className="border border-gray-200 rounded p-1">
                      <img
                        src={
                          option.match_text instanceof File
                            ? URL.createObjectURL(option.match_text)
                            : typeof option.match_text === "string" && option.match_text.startsWith("/")
                              ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.match_text || "/placeholder.png"}`
                              : `/placeholder.svg?height=60&width=80&text=Match`
                        }
                        alt={`Match ${optionIndex + 1}`}
                        className="h-12 object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Remove Option Button */}
            {question.MatchingOptions.length > 1 && (
              <button
                type="button"
                onClick={() => removeMatchingOption(questionIndex, optionIndex)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => addMatchingOption(questionIndex)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-leafGreen focus:border-leafGreen flex items-center justify-center"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Option Pair
        </button>
      </div>
    </div>
  )

  // Render question forms - Original Desktop versions (unchanged)
  const renderMatchingQuestionForm = (question, questionIndex) => (
    <div key={questionIndex} className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <div className="flex gap-2 items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
              {question.hasChanges && (
                <span className="hidden sm:inline items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Unsaved
                </span>
              )}
              {question.isNew && (
                <span className="hidden sm:inline items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lightGreen text-forestGreen">
                  New
                </span>
              )}
            </div>
            <input
              type="text"
              value={question.question_text}
              onChange={(e) => updateQuestion(questionIndex, { ...question, question_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
              placeholder="Enter question text"
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {question.MatchingOptions?.map((option, optionIndex) => (
            <div key={optionIndex} className="grid grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg relative">
              {/* Option Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Option {optionIndex + 1}</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`option-type-${questionIndex}-${optionIndex}`}
                      value="text"
                      checked={option.option_type === "text" || !option.option_type}
                      onChange={() => updateMatchingOption(questionIndex, optionIndex, "option_text", "", "text")}
                      className="form-radio h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Text</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`option-type-${questionIndex}-${optionIndex}`}
                      value="image"
                      checked={option.option_type === "image"}
                      onChange={() => updateMatchingOption(questionIndex, optionIndex, "option_text", "", "image")}
                      className="form-radio h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Image</span>
                  </label>
                </div>

                {option.option_type === "text" ? (
                  <input
                    type="text"
                    value={option.option_text}
                    onChange={(e) =>
                      updateMatchingOption(questionIndex, optionIndex, "option_text", e.target.value, "text")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                    placeholder="Enter option text"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateMatchingOption(questionIndex, optionIndex, "option_text", e.target.files[0])
                      }
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                    />
                    {option.option_text && (
                      <div className="border border-gray-200 rounded p-2">
                        <img
                          src={
                            option.option_text instanceof File
                              ? URL.createObjectURL(option.option_text)
                              : typeof option.option_text === "string" && option.option_text.startsWith("/")
                                ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_text || "/placeholder.png"}`
                                : `/placeholder.svg?height=80&width=120&text=Option+${optionIndex + 1}`
                          }
                          alt={`Option ${optionIndex + 1}`}
                          className="h-20 object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Match Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Match {optionIndex + 1}</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`match-type-${questionIndex}-${optionIndex}`}
                      value="text"
                      checked={option.match_type === "text" || !option.match_type}
                      onChange={() => updateMatchingOption(questionIndex, optionIndex, "match_text", "", "text")}
                      className="form-radio h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Text</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`match-type-${questionIndex}-${optionIndex}`}
                      value="image"
                      checked={option.match_type === "image"}
                      onChange={() => updateMatchingOption(questionIndex, optionIndex, "match_text", "", "image")}
                      className="form-radio h-4 w-4 accent-leafGreen focus:ring-leafGreen border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Image</span>
                  </label>
                </div>

                {option.match_type === "text" ? (
                  <input
                    type="text"
                    value={option.match_text}
                    onChange={(e) =>
                      updateMatchingOption(questionIndex, optionIndex, "match_text", e.target.value, "text")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
                    placeholder="Enter match text"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateMatchingOption(questionIndex, optionIndex, "match_text", e.target.files[0])
                      }
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                    />
                    {option.match_text && (
                      <div className="border border-gray-200 rounded p-2">
                        <img
                          src={
                            option.match_text instanceof File
                              ? URL.createObjectURL(option.match_text)
                              : typeof option.match_text === "string" && option.match_text.startsWith("/")
                                ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.match_text || "/placeholder.png"}`
                                : `/placeholder.svg?height=80&width=120&text=Match+${optionIndex + 1}`
                          }
                          alt={`Match ${optionIndex + 1}`}
                          className="h-20 object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Remove Option Button */}
              {question.MatchingOptions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMatchingOption(questionIndex, optionIndex)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => addMatchingOption(questionIndex)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option Pair
          </button>
        </div>
      </div>
    </div>
  )

  const renderTrueFalseQuestionForm = (question, questionIndex) => (
    <div key={questionIndex} className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <div className="flex gap-2 items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
              {question.hasChanges && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Unsaved
                </span>
              )}
              {question.isNew && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lightGreen text-forestGreen">
                  New
                </span>
              )}
            </div>

            <textarea
              value={question.question_text}
              onChange={(e) => updateQuestion(questionIndex, { ...question, question_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen"
              placeholder="Enter your true/false question"
              rows={2}
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Correct Answer</label>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name={`answer-${questionIndex}`}
                value="true"
                checked={question.correct_answer === true}
                onChange={() => updateQuestion(questionIndex, { ...question, correct_answer: true })}
                className="form-radio h-4 w-4 accent-leafGreen focus:ring-green-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">True</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name={`answer-${questionIndex}`}
                value="false"
                checked={question.correct_answer === false}
                onChange={() => updateQuestion(questionIndex, { ...question, correct_answer: false })}
                className="form-radio h-4 w-4 accent-red-600 focus:ring-red-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">False</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFillBlanksQuestionForm = (question, questionIndex) => (
    <div key={questionIndex} className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <div className="flex gap-2 items-center">
              <div className="block text-sm font-medium text-gray-700 mb-2">Question Text</div>
              {question.hasChanges && (
                <span className="hidden sm:inline items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Unsaved
                </span>
              )}
              {question.isNew && (
                <span className="hidden sm:inline items-center px-2.5 py-1 rounded-full text-xs font-medium bg-lightGreen text-forestGreen">
                  New
                </span>
              )}
            </div>
            <div className="mb-4 p-3 bg-lightGreen border border-leafGreen/30 rounded-md">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-forestGreen mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-forestGreen">
                  Use the editor below and <strong>underline</strong> text to mark it as a blank that students need to
                  fill.
                </p>
              </div>
            </div>
            <div className="border border-gray-300 rounded-lg">
              <Editor
                apiKey={import.meta.env.VITE_TINYMCE_API}
                value={question.question_text}
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
                onEditorChange={(content) =>
                  updateQuestion(questionIndex, {
                    ...question,
                    question_text: content,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Mobile-optimized paragraph writing form
  // In your main component, define this function:
  const renderMobileParagraphWritingForm = (question, questionIndex) => (
    <div key={questionIndex} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Writing Prompt</label>
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md hidden sm:block">
          <div className="flex">
            <AlertCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-green-800">
              Create a writing prompt that will guide students to write a paragraph response.
            </p>
          </div>
        </div>
        <div className="border border-gray-300 rounded-lg w-full overflow-hidden">
          <Editor
            apiKey={import.meta.env.VITE_TINYMCE_API}
            value={question.paragraph_prompt}
            init={{
              height: 250,
              menubar: false,
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "charmap",
                "visualblocks",
                "paste",
                "help",
                "wordcount",
                "emoticons",
              ],
              toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link | removeformat",
              content_style: `
              body { 
                font-family: Arial, Helvetica, sans-serif; 
                font-size: 16px; 
                line-height: 1.4;
                margin: 8px;
                -webkit-text-size-adjust: 100%;
              }
              * {
                max-width: 100%;
              }
            `,
              mobile: {
                theme: 'mobile',
                toolbar: [
                  'undo', 'redo', 'bold', 'italic', 'underline',
                  'bullist', 'numlist', 'link', 'removeformat'
                ]
              },
              responsive: true,
              width: '100%',
              max_width: '100%',
              resize: false,
              branding: false,
              statusbar: false,
              placeholder: "Enter your writing prompt here...",
            }}
            onEditorChange={(content) =>
              updateQuestion(questionIndex, {
                ...question,
                paragraph_prompt: content,
              })
            }
          />
        </div>
      </div>
    </div>
  )

  const renderParagraphWritingForm = (question, questionIndex) => (
    <div key={questionIndex} className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-grow w-full">
            <div className="flex gap-2 items-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">Writing Prompt</label>
              {question.hasChanges && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Unsaved
                </span>
              )}
              {question.isNew && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lightGreen text-forestGreen">
                  New
                </span>
              )}
            </div>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Create a writing prompt that will guide students to write a paragraph response. Be clear and specific
                  about what you want them to address.
                </p>
              </div>
            </div>
            <div className="border border-gray-300 rounded-lg w-full overflow-hidden">
              <Editor
                apiKey={import.meta.env.VITE_TINYMCE_API}
                value={question.paragraph_prompt}
                init={{
                  height: 300,
                  menubar: false, // Hide menubar on mobile to save space
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
                    window.innerWidth < 768
                      ? "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link | removeformat | help"
                      : "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link | removeformat | help",
                  content_style: `
                  body { 
                    font-family: Arial, Helvetica, sans-serif; 
                    font-size: 14px; 
                    line-height: 1.4;
                    margin: 8px;
                  }
                  @media (max-width: 768px) {
                    body {
                      font-size: 16px; /* Larger font for mobile */
                    }
                  }
                `,
                  mobile: {
                    theme: 'mobile',
                    toolbar: [
                      'undo', 'redo', 'bold', 'italic', 'underline',
                      'styleselect', 'bullist', 'numlist', 'link',
                      'removeformat'
                    ]
                  },
                  responsive: true,
                  width: '100%',
                  max_width: '100%',
                  resize: false,
                  branding: false,
                  placeholder: "Enter your writing prompt here...",
                }}
                onEditorChange={(content) =>
                  updateQuestion(questionIndex, {
                    ...question,
                    paragraph_prompt: content,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render question list - Original Desktop version
  const renderQuestionsList = () => {
    if (currentQuestions.length === 0) {
      return (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
          <p className="text-gray-500 mb-6">
            Get started by adding your first {categoryDisplayName?.toLowerCase()} question.
          </p>
          <PermissionWrapper section={assignmentData.category === "matching" ? "Matching Question" : assignmentData.category === "true_false" ? "True/False Question" : assignmentData.category === "fill_in_the_blanks" ? "Fill-in-the-Blank Question" : ""} action="create">
            <button
              onClick={handleAddQuestion}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-leafGreen   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Question
            </button>
          </PermissionWrapper>
        </div>
      )
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {currentQuestions.map((question, index) => (
          <div key={question.id || index} className="space-y-4">
            {/* Question Display Card */}
            {editingQuestionId !== question.id && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {assignmentData.category === "paragraph_writing" ? "Writing Prompt" : `Question ${index + 1}`}
                          </h4>
                          {question.isNew && (
                            <span className="hidden sm:inline items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lightGreen text-forestGreen">
                              New
                            </span>
                          )}
                          {question.hasChanges && (
                            <span className="hidden sm:inline items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Unsaved Changes
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleViewQuestion(question, assignmentData.category)}
                            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <PermissionWrapper section={assignmentData.category === "matching" ? "Matching Question" : assignmentData.category === "true_false" ? "True/False Question" : assignmentData.category === "fill_in_the_blanks" ? "Fill-in-the-Blank Question" : ""} action="edit">
                            <button
                              onClick={() => handleEditQuestion(assignmentData.category, question)}
                              className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </PermissionWrapper>
                          {assignmentData.category !== "paragraph_writing" && (
                            <PermissionWrapper section={assignmentData.category === "matching" ? "Matching Question" : assignmentData.category === "true_false" ? "True/False Question" : assignmentData.category === "fill_in_the_blanks" ? "Fill-in-the-Blank Question" : ""} action="delete">
                              <button
                                onClick={() => handleDeleteQuestion(index)}
                                disabled={deletingQuestionId === question.id}
                                className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingQuestionId === question.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </PermissionWrapper>
                          )}
                        </div>
                      </div>

                      {/* Question type specific preview */}
                      {assignmentData.category === "matching" && (
                        <>
                          <p className="text-gray-600 mb-2 sm:mb-3">{question.question_text || "No question text"}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Options:</p>
                              {question.MatchingOptions?.map((option, optIndex) => (
                                <p key={optIndex} className="text-gray-600">
                                  • {option.option_type === "image" ? "[Image]" : option.option_text}
                                </p>
                              ))}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Matches:</p>
                              {question.MatchingOptions?.map((option, optIndex) => (
                                <p key={optIndex} className="text-gray-600">
                                  • {option.match_type === "image" ? "[Image]" : option.match_text}
                                </p>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {assignmentData.category === "true_false" && (
                        <>
                          <p className="text-gray-600 mb-2 sm:mb-3">{question.question_text || "No question text"}</p>
                          <p className="text-sm">
                            <span className="font-medium">Correct Answer: </span>
                            <span
                              className={`font-medium ${question.correct_answer ? "text-green-600" : "text-red-600"}`}
                            >
                              {question.correct_answer ? "True" : "False"}
                            </span>
                          </p>
                        </>
                      )}

                      {assignmentData.category === "fill_in_the_blanks" && (
                        <div>
                          <div
                            className="text-sm text-gray-600 mb-2 sm:mb-3"
                            dangerouslySetInnerHTML={{ __html: question.question_text }}
                          />
                          {question.answers && question.answers.length > 0 && (
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-700 mr-1">Answers:</p>
                              <div className="flex flex-wrap gap-2">
                                {question.answers.map((answer, ansIndex) => (
                                  <span
                                    key={ansIndex}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    {answer}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {assignmentData.category === "paragraph_writing" && (
                        <div>
                          <div
                            className="text-sm text-gray-600 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: question.paragraph_prompt || "No prompt text" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Question Edit Form */}
            {editingQuestionId === question.id && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-medium text-gray-900">
                    {question.isNew
                      ? assignmentData.category === "paragraph_writing"
                        ? "Add Prompt"
                        : "Add New Question"
                      : assignmentData.category === "paragraph_writing"
                        ? "Edit Prompt"
                        : "Edit Question"}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingQuestionId(null)
                        if (question.isNew) {
                          // Remove unsaved new question
                          setQuestions((prev) => ({
                            ...prev,
                            [assignmentData.category]: prev[assignmentData.category].filter((_, i) => i !== index),
                          }))
                          setHasUnsavedChanges(false)
                        }
                      }}
                      className="inline-flex items-center sm:px-4 p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen"
                    >
                      <X className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                    <button
                      onClick={() => setEditingQuestionId(null)}
                      className="inline-flex items-center sm:px-4 p-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-leafGreen   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen"
                    >
                      <Save className="h-4 w-4 sm:mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Done <span className="hidden md:inline">Editing</span></span>
                    </button>
                  </div>
                </div>

                {/* Render appropriate form based on category */}
                {/* {assignmentData.category === "matching" && renderMatchingQuestionForm(question, index)} */}
                {/* {assignmentData.category === "true_false" && renderTrueFalseQuestionForm(question, index)} */}
                {/* {assignmentData.category === "fill_in_the_blanks" && renderFillBlanksQuestionForm(question, index)} */}
                {/* {assignmentData.category === "paragraph_writing" && renderMobileParagraphWritingForm(question, index)} */}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // View Modal
  const renderViewModal = () => {
    if (!showViewModal || !selectedQuestion) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {selectedQuestion.type === "paragraph_writing" ? "Writing Prompt Details" : "Question Details"}
            </h2>
            <button
              onClick={() => {
                setShowViewModal(false)
                setSelectedQuestion(null)
              }}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-4">
              {selectedQuestion.type === "matching" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question</label>
                    <p className="mt-1 text-lg text-gray-700">{selectedQuestion.question_text}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                      {selectedQuestion.MatchingOptions?.map((option, index) => (
                        <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                          {option.option_type === "image" ? (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.option_text || "/placeholder.png"}`}
                              alt={`Option ${index + 1}`}
                              className="h-20 object-contain"
                            />
                          ) : (
                            <p className="text-sm">{option.option_text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Matches</label>
                      {selectedQuestion.MatchingOptions?.map((option, index) => (
                        <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                          {option.match_type === "image" ? (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${option.match_text || "/placeholder.png"}`}
                              alt={`Match ${index + 1}`}
                              className="h-20 object-contain"
                            />
                          ) : (
                            <p className="text-sm">{option.match_text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedQuestion.type === "true_false" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question</label>
                    <p className="mt-1 text-lg text-gray-700">{selectedQuestion.question_text}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Correct Answer</label>
                    <p
                      className={`mt-1 text-lg font-medium ${selectedQuestion.correct_answer ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      {selectedQuestion.correct_answer ? "True" : "False"}
                    </p>
                  </div>
                </>
              )}

              {selectedQuestion.type === "fill_in_the_blanks" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Question</label>
                    <div
                      className="mt-1 text-lg text-gray-700"
                      dangerouslySetInnerHTML={{ __html: selectedQuestion.question_text }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Correct Answers</label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedQuestion.answers?.map((answer, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          {answer}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedQuestion.type === "paragraph_writing" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Writing Prompt</label>
                  <div
                    className="mt-1 text-lg text-gray-700 prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedQuestion.paragraph_prompt }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 p-4 sm:p-6 sm:flex-row sm:justify-end sticky bottom-0">
            <button
              onClick={() => {
                setShowViewModal(false)
                setSelectedQuestion(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoadingAssignment) {
    return <AdminLoader fullScreen message="Loading assignment questions..." />;
  }

  // Error state
  if (!assignmentData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Assignment not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Mobile Header Component */}
          <MobileHeader
            assignmentData={assignmentData}
            categoryDisplayName={categoryDisplayName}
            navigate={navigate}
            hasUnsavedChanges={hasUnsavedChanges}
            isLoadingUpdateAssignment={isLoadingUpdateAssignment}
            handleSaveAllQuestions={handleSaveAllQuestions}
            editingQuestionId={editingQuestionId}
            handleAddQuestion={handleAddQuestion}
            currentQuestions={currentQuestions}
            handleUseGeneratedQuestions={handleUseGeneratedQuestions}
          />

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="grid">
              <h1 className="text-2xl font-bold text-forestGreen truncate">
                {assignmentData.title}
              </h1>
              <p className="text-gray-600 mt-1">
                Category: {categoryDisplayName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>

              {((assignmentData.category == "paragraph_writing" && currentQuestions.length == 0) || assignmentData.category != "paragraph_writing") &&
                <AIContentGenerator
                  contentType="assignment_questions"
                  onUseGenerated={handleUseGeneratedQuestions}
                  modalTitle="Generate Assignment Questions with AI"
                  placeholderText="Describe what kind of assignment questions you want to create..."
                  questionType={assignmentData.category}
                  allowMultipleSelection={true}
                />
              }

              {/* Add Question/Prompt Button */}
              {!editingQuestionId && assignmentData.category !== "paragraph_writing" && (
                <PermissionWrapper section={assignmentData.category === "matching" ? "Matching Question" : assignmentData.category === "true_false" ? "True/False Question" : assignmentData.category === "fill_in_the_blanks" ? "Fill-in-the-Blank Question" : ""} action="create">
                  <button
                    onClick={handleAddQuestion}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-leafGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen transition-colors whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </button>
                </PermissionWrapper>
              )}

              {!editingQuestionId && assignmentData.category === "paragraph_writing" && currentQuestions.length === 0 && (
                <button
                  onClick={handleAddQuestion}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-leafGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen transition-colors whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Prompt
                </button>
              )}

              {/* Save All Button */}
              {hasUnsavedChanges && (
                <button
                  onClick={handleSaveAllQuestions}
                  disabled={isLoadingUpdateAssignment}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-leafGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {isLoadingUpdateAssignment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save {assignmentData.category === "paragraph_writing" ? "Prompt" : "All Questions"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full p-4 sm:p-6 flex-1 overflow-y-auto">

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
              <p className="text-sm text-yellow-800 font-medium">
                You have unsaved changes. Make sure to save your{" "}
                {assignmentData.category === "paragraph_writing" ? "prompt" : "questions"} before leaving this page.
              </p>
            </div>
          </div>
        )}

        {/* Questions Section */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="p-4 sm:p-6">
            {/* Mobile Questions List */}
            <div className="block md:hidden">
              <MobileQuestionsList
                currentQuestions={currentQuestions}
                assignmentData={assignmentData}
                categoryDisplayName={categoryDisplayName}
                editingQuestionId={editingQuestionId}
                setEditingQuestionId={setEditingQuestionId}
                handleViewQuestion={handleViewQuestion}
                handleDeleteQuestion={handleDeleteQuestion}
                handleEditQuestion={handleEditQuestion}
                deletingQuestionId={deletingQuestionId}
                updateQuestion={updateQuestion}
                setQuestions={setQuestions}
                setHasUnsavedChanges={setHasUnsavedChanges}
                addMatchingOption={addMatchingOption}
                removeMatchingOption={removeMatchingOption}
                updateMatchingOption={updateMatchingOption}
                renderMobileMatchingQuestionForm={renderMobileMatchingQuestionForm}
                renderTrueFalseQuestionForm={renderTrueFalseQuestionForm}
                renderFillBlanksQuestionForm={renderFillBlanksQuestionForm}
                renderMobileParagraphWritingForm={renderMobileParagraphWritingForm}
              />
            </div>

            {/* Desktop Questions List - Original */}
            <div className="hidden md:block">
              {renderQuestionsList()}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold text-forestGreen mb-4">Delete Question</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-leafGreen"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteQuestion}
                  disabled={deletingQuestionId}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingQuestionId ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Question"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {renderViewModal()}

        <TrueFalseModal />
        <FillBlanksModal />
        <MatchingModal />
        <ParagraphWritingModal />
      </div>
    </div>
  )
}

export default AssignmentQuestion