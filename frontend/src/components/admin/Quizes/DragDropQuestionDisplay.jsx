import React, { useState } from "react";
import { useDeleteDragDropQuestionMutation } from "../../../services/Content_Management/quizType/dragDropQuestionApi";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../../services/CookieService";
import {
  FileText,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle
} from "lucide-react";
import DragDropQuestionForm from "./DragDropQuestionForm";
import PermissionWrapper from "../../../context/PermissionWrapper";


const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting,
  itemType
}) => {
  if (!isOpen) return null;

  return (
    <PermissionWrapper section="Drag Drop Question" action="delete">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all">
          <div className="flex items-center text-red-600 mb-4">
            <AlertTriangle size={24} className="mr-2" />
            <h3 className="text-lg font-semibold">{title || "Confirm Deletion"}</h3>
          </div>

          <p className="mb-6 text-gray-600">{message || "Are you sure you want to delete this drag & drop question? This action cannot be undone."}</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition-all duration-300"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete {itemType || "Question"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PermissionWrapper>
  );
};

const DragDropQuestionDisplay = ({
  dragDropQuestions,
  quizId,
  createdBy,
  refetchDragDropQuestions,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  const { access_token } = getAdminToken();
  const [deleteDragDropQuestion] = useDeleteDragDropQuestionMutation();

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEditClick = (question) => {
    setQuestionToEdit(question);
    setEditFormOpen(true);
  };

  const closeEditForm = () => {
    setEditFormOpen(false);
    setQuestionToEdit(null);
  };

  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const res = await deleteDragDropQuestion({
        id: itemToDelete,
        access_token,
      }).unwrap();
      refetchDragDropQuestions();
      toast.success(res.message || "Question deleted successfully", {
        icon: "🗑️",
        duration: 3000,
      });
      closeDeleteModal();
    } catch (err) {
      toast.error(err?.data?.error || "Failed to delete question", {
        icon: "⚠️",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to determine if a blank has multiple correct answers
  const hasMultipleAnswers = (blank) => {
    return Array.isArray(blank.correct) && blank.correct.length > 1;
  };

  // Helper function to get correct answers (handles both string and array formats)
  const getCorrectAnswers = (blank) => {
    if (Array.isArray(blank.correct)) {
      return blank.correct;
    }
    return [blank.correct]; // Convert single string to array for consistent handling
  };

  if (!dragDropQuestions?.length) {
    return (
      <div className="text-center text-gray-500 mt-6 p-8 bg-lightGreen rounded-lg border border-leafGreen/30 flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-leafGreen mb-2" />
        <p className="text-lg font-medium">
          No Drag & Drop Questions found for this quiz.
        </p>
      </div>
    );
  }

  return (
    <PermissionWrapper section="Drag Drop Question" action="view|edit|delete|toggle">
      <div className="space-y-6 mt-7 bg-white p-6 rounded-lg shadow-md">
        {/* Edit Modal */}
        <PermissionWrapper section="Drag Drop Question" action="edit">
          {editFormOpen && questionToEdit && (
            <DragDropQuestionForm
              isOpen={editFormOpen}
              onClose={closeEditForm}
              quizId={quizId}
              createdBy={createdBy}
              isEditing={true}
              questionData={questionToEdit}
            />
          )}
        </PermissionWrapper>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
          isDeleting={isDeleting}
          title="Delete Drag & Drop Question"
          message="Are you sure you want to delete this drag & drop question? This action cannot be undone."
          itemType="Question"
        />

        <div className="flex justify-between items-center border-b border-leafGreen/20 pb-4">
          <h2 className="text-xl font-bold text-forestGreen flex items-center gap-2">
            <BookOpen size={24} className="text-leafGreen" />
            Drag & Drop Questions
          </h2>
        </div>

        <div className="space-y-6">
          {dragDropQuestions.map((question, questionIndex) => (
            <div
              key={question.id}
              className="border border-leafGreen/20 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Question Header - Always Visible */}
              <div
                className="p-4  bg-lightGreen/50 flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpand(question.id)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lightGreen text-forestGreen font-medium text-sm">
                    {questionIndex + 1}
                  </div>
                  <div className="flex flex-col flex-grow">
                    <div className="font-medium text-gray-800 line-clamp-2">
                      {question.prompt.split("___").map((part, i, arr) => (
                        <React.Fragment key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="px-2 py-0.5 mx-1 bg-lightGreen text-forestGreen rounded text-sm font-medium">
                              [...]
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {question.blanks.length} blank
                      {question.blanks.length !== 1 ? "s" : ""} •{" "}
                      {question.options.length} option
                      {question.options.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <PermissionWrapper section="Drag Drop Question" action="edit">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(question);
                      }}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg flex items-center gap-1.5 hover:bg-amber-600 transition-all duration-300 text-sm"
                      aria-label="Edit question"
                    >
                      <Edit size={16} />
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Drag Drop Question" action="delete">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(question.id);
                      }}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg flex items-center gap-1.5 hover:bg-red-600 transition-all duration-300 text-sm"
                      aria-label="Delete question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </PermissionWrapper>
                  {/* Expand/Collapse Button */}
                  <button
                    className="p-2 text-gray-500 rounded-lg hover:bg-gray-100"
                    aria-label="Expand"
                  >
                    {expandedItems[question.id] ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedItems[question.id] && (
                <div className="p-4 border-t border-gray-100 bg-white">
                  {/* Prompt with Blanks Highlighted */}
                  <div className="mb-6">
                    <h4 className="font-medium text-forestGreen flex items-center gap-1.5 mb-3">
                      <FileText size={18} />
                      Question Text
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {question.prompt.split("___").map((part, i, arr) => (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <span className="inline-block mx-1 px-2 py-1 bg-yellow-100 border-2 border-dashed border-yellow-300 text-yellow-800 rounded">
                                Blank #{i + 1}
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </p>
                    </div>
                  </div>

                  {/* Blanks and Answers */}
                  <div className="mb-6">
                    <h4 className="font-medium text-forestGreen flex items-center gap-1.5 mb-3">
                      <AlertCircle size={18} />
                      Correct Answers
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {question.blanks.map((blank, index) => {
                        const correctAnswers = getCorrectAnswers(blank);

                        return (
                          <div
                            key={index}
                            className="bg-lightGreen p-3 rounded-lg border border-leafGreen/20"
                          >
                            <div className="text-forestGreen font-medium mb-2 flex items-center gap-1.5">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-leafGreen text-white font-medium text-xs">
                                {blank.position}
                              </div>
                              <span>Blank #{blank.position}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                              {correctAnswers.map((answer, answerIndex) => (
                                <div
                                  key={answerIndex}
                                  className={`text-gray-700 ${correctAnswers.length > 1
                                      ? "bg-white px-3 py-2 rounded border border-leafGreen/30"
                                      : "font-medium"
                                    }`}
                                >
                                  {correctAnswers.length > 1 && (
                                    <span className="text-forestGreen font-medium mr-1">
                                      #{answerIndex + 1}:
                                    </span>
                                  )}
                                  {answer}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Options */}
                  <div>
                    <h4 className="font-medium text-forestGreen flex items-center gap-1.5 mb-3">
                      <FileText size={18} />
                      Draggable Options
                    </h4>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      {question.options.map((option, index) => (
                        <span
                          key={index}
                          className="bg-lightGreen text-forestGreen px-3 py-2 rounded-lg border border-leafGreen/30"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PermissionWrapper>
  );
};

export default DragDropQuestionDisplay;