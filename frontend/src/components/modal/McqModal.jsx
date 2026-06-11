/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
"use client"
import { X, Plus, Info } from "lucide-react"
import { toast } from "react-hot-toast"
// import AIContentGenerator from "../Home/courses/AIContentGenrator"

const MCQModal = ({
  showQuestionForm,
  setShowQuestionForm,
  isEditing,
  setIsEditing,
  selectedQuestion,
  setSelectedQuestion,
  quizType,
  formData,
  setFormData,
  handleSubmit,
  handleInputChange,
  handleFileChange,
}) => {
  // Function to populate form with generated MCQ question data
  const handleUseGeneratedMCQQuestion = (generatedQuestion) => {
    setFormData({
      ...formData,
      sequence_no: generatedQuestion.sequence_no || formData.sequence_no,
      question_type: generatedQuestion.question_type || "multiple-choice",
      marks: generatedQuestion.marks || generatedQuestion.options?.length || 1,
      question_text: generatedQuestion.question_text || generatedQuestion.question,
      options: generatedQuestion.options || [],
      correct_answer: generatedQuestion.correct_answer || generatedQuestion.correctAnswer,
      explanation: generatedQuestion.explanation || "",
    })
    toast.success("MCQ question data populated from AI!")
  }

  if (!showQuestionForm) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Question" : "Add New Question"}
          </h2>
          <button
            onClick={() => {
              setShowQuestionForm(false)
              setIsEditing(false)
              setSelectedQuestion(null)
            }}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <form id="textForm" onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {quizType === "text_based" ? "Text" : "Question Text"}
              </label>
              <textarea
                id="question_text"
                name="question_text"
                required
                value={formData?.question_text || selectedQuestion?.question_text}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-leafGreen/20 focus:border-leafGreen resize-none"
                rows={6}
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation (Optional)
              </label>
              <textarea
                id="explanation"
                name="explanation"
                value={formData.explanation || ""}
                onChange={handleInputChange}
                rows={3}
                placeholder="Provide an explanation for the correct answer..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-leafGreen/20 focus:border-leafGreen resize-none"
              />
            </div> */}
          </form>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
          <button
            type="button"
            onClick={() => {
              setShowQuestionForm(false)
              setIsEditing(false)
              setSelectedQuestion(null)
            }}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="textForm"
            className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen hover:bg-forestGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? "Update Question" : quizType === "text_based" ? "Add Text" : "Add Question"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MCQModal
