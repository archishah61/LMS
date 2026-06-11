/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { X, Eye, Plus, Trash2, Link, ToggleLeft, ToggleRight, Sparkles, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useGetQuizByModuleIdQuery,
  useUpdateQuizStatusMutation
} from "../../../services/Course_Management/quizApi";
import { useDispatch, useSelector } from "react-redux"
import toast from "react-hot-toast"
import { setQuizzes } from "../../../features/Course_Management/quizSlice"
import AIContentGenerator from "../../Home/courses/AIContentGenrator";
import { slugify } from "../../../utils/slugify";
import PermissionWrapper from "../../../context/PermissionWrapper";

const Quiz = ({ showQuizForm, setShowQuizForm, moduleId }) => {
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate()
  const { access_token } = useSelector((state) => state.auth)
  const { id } = useSelector((state) => state.user)
  const [quiz, setQuiz] = useState([]);
  const dispatch = useDispatch()

  const { data: quizzesData, refetch } = useGetQuizByModuleIdQuery({ id: moduleId, access_token });
  const [createQuiz] = useCreateQuizMutation();
  const [updateQuiz] = useUpdateQuizMutation();
  const [quizType, setQuizType] = useState("normal"); // Default to "normal"
  const notifySuccess = (message) => toast.success(message);
  const notifyError = (error) => toast.error(error);
  const [updateQuizStatus] = useUpdateQuizStatusMutation()
  const { role } = useSelector((state) => state.user);


  const [quizFormData, setQuizFormData] = useState({
    title: "",
    duration_minutes: 30,
    passing_score: 60,
    max_attempts: 1,
    attempts_gap: 0, // Added attempts_gap field
    attempts_renew_days: 0, // New field for days after which attempts are renewed
    module_id: moduleId,
    isQuizCompulsory: false, // 👈 new field
    isWarning: false,
    no_of_warning: 1,
  });

  const clearFormData = () => {
    setQuizFormData({
      title: "",
      duration_minutes: 30,
      passing_score: 60,
      max_attempts: 1,
      attempts_gap: 0, // Added attempts_gap field
      attempts_renew_days: 0, // New field for days after which attempts are renewed
      module_id: moduleId,
      isQuizCompulsory: false, // 👈 new field
      isWarning: false,
      no_of_warning: 1,
    });
  }

  useEffect(() => {
    if (quizzesData) {
      setQuiz(quizzesData);
      dispatch(setQuizzes({ quizzes: quizzesData }));
    }
  }, [quizzesData, dispatch]);

  const handleUseGeneratedQuiz = (generatedQuiz) => {
    setQuizFormData({
      title: generatedQuiz.title,
      duration_minutes: generatedQuiz.duration_minutes || 30,
      passing_score: generatedQuiz.passing_score || 60,
      max_attempts: generatedQuiz.max_attempts || 1,
      attempts_gap: generatedQuiz.attempts_gap || 0,
      attempts_renew_days: generatedQuiz.attempts_renew_days || 0,
      module_id: moduleId,
      isQuizCompulsory: generatedQuiz.isQuizCompulsory ?? false,
      isWarning: generatedQuiz.isWarning ?? false,
      no_of_warning: generatedQuiz.no_of_warning || 1,
    });

    if (generatedQuiz.quizType) {
      setQuizType(generatedQuiz.quizType);
    }

    toast.success("Quiz data populated!");
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = {
        ...quizFormData,
        quizType, // Include quiz type in form data
      };


      if (isEditing && selectedItem) {
        await updateQuiz({
          id: selectedItem.id,
          quizData: formDataToSend,
          access_token,
        }).unwrap();
        toast.success("Quiz updated successfully")
      } else {
        try {
          if (isEditing && selectedItem) {
            await updateQuiz({
              id: selectedItem.id,
              quizData: quizFormData,
              access_token,
            }).unwrap();
            toast.success("Quiz update successfully")
          } else {
            try {
              const response = await createQuiz({ quizData: formDataToSend, access_token });

              // Check if the response has an error message
              if (response?.error || response?.message?.includes("Limit exceeded")) {
                toast.error(response.error.data.error || "Failed to create quiz");
              } else {
                toast.success("Quiz added successfully");
              }
            } catch (error) {
              const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'An unexpected error occurred';
              toast.error(errorMessage);
            }

          }
          setShowQuizForm(false);
          setSelectedItem(null);
          setIsEditing(false);
          refetch();
        } catch (error) {
          const errorMessage = error?.data?.error ||
            error?.data?.message ||
            error?.error ||
            error?.message ||
            'An unexpected error occurred';
          toast.error(errorMessage);
        }
      }
      setShowQuizForm(false);
      setSelectedItem(null);
      setIsEditing(false);
      refetch();
      clearFormData();
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'An unexpected error occurred';
      toast.error(errorMessage);
    }
  };

  const handleQuizInputChange = (e) => {
    const { name, value } = e.target;
    setQuizFormData({ ...quizFormData, [name]: value });
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
    setQuizFormData(item);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowViewModal(false);
    setShowQuizForm(true);
  };

  const handleAddQuestion = (id, quizType) => {
    if (quizType == "normal") {
      navigate(`/admin/dashboard/quiz/quiz-question/${slugify(quizType)}`, {
        state: { quizId: id }
      })
    } else {
      navigate(`/admin/dashboard/text-based-quiz/quiz-question/${slugify(quizType)}`, {
        state: { quizId: id }
      })
    }
  }

  const handleStatusToggle = async (quizItem) => {
    try {
      if (quizItem?.included_topic_id) {
        notifyError(`This quiz is included in topic: ${quizItem.included_topic_title}`);
        return;
      }

      const quizId = quizItem.id;
      const currentStatus = quizItem.status || "active";
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      await updateQuizStatus({
        quizId,
        status: newStatus,
        access_token,
      }).unwrap();

      // Update the local state directly
      const updatedQuizzes = quizzesData.map(q =>
        q.id === quizId ? { ...q, status: newStatus } : q
      );

      // Update both local states
      setQuiz(updatedQuizzes);

      // Force a refetch to ensure UI is in sync with backend
      refetch();

      notifySuccess(`Quiz ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error("Status update failed", error);
      notifyError(error?.data?.message || error?.data?.error || "Failed to update quiz status");
    }
  };

  return (
    <div>
      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-forestGreen">
                Quiz Details
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedItem(null);
                  clearFormData();
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Info grid */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="grid grid-cols-2 gap-3">

                {/* Title */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-2">
                  <label className="block text-sm font-medium text-gray-600">Title</label>
                  <p className="mt-1 text-lg  text-forestGreen font-semibold">
                    {selectedItem.title}
                  </p>
                </div>

                {/* Quiz Type */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-2">
                  <label className="block text-sm font-medium text-gray-600">Quiz Type</label>
                  <p className="mt-1 text-lg text-gray-800">
                    {selectedItem.quizType === "text_based" ? "Text Based" : "Normal"}
                  </p>
                </div>

                {/* Duration */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-1">
                  <label className="block text-sm font-medium text-gray-600">Duration</label>
                  <p className="mt-1 text-lg text-gray-800">
                    {selectedItem.duration_minutes} minutes
                  </p>
                </div>

                {/* Passing Score */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-1">
                  <label className="block text-sm font-medium text-gray-600">Passing Score</label>
                  <p className="mt-1 text-lg text-gray-800">
                    {selectedItem.passing_score}%
                  </p>
                </div>

                {/* Max Attempts */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-1">
                  <label className="block text-sm font-medium text-gray-600">Max Attempts</label>
                  <p className="mt-1 text-lg text-gray-800">
                    {selectedItem.max_attempts}
                  </p>
                </div>

                {/* Attempts Gap */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-1">
                  <label className="block text-sm font-medium text-gray-600">Attempts Gap</label>
                  <p className="mt-1 text-lg text-gray-800">
                    {selectedItem.attempts_gap} hours
                  </p>
                </div>

                {/* Compulsory Flag */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-1">
                  <label className="block text-sm font-medium text-gray-600">Is Quiz Compulsory?</label>
                  <p className={`mt-1 text-lg font-semibold ${selectedItem.isQuizCompulsory ? "text-green-600" : "text-red-600"}`}>
                    {selectedItem.isQuizCompulsory ? "Yes" : "No"}
                  </p>
                </div>

                {/* Warning Enabled */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm col-span-1">
                  <label className="block text-sm font-medium text-gray-600">Warnings Enabled?</label>
                  <p className={`mt-1 text-lg font-semibold ${selectedItem.isWarning ? "text-green-600" : "text-red-600"}`}>
                    {selectedItem.isWarning ? `Yes (Limit: ${selectedItem.no_of_warning})` : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedItem(null);
                  clearFormData();
                }}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <PermissionWrapper section="Quiz" action="edit">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen hover:bg-forestGreen rounded-lg transition-colors duration-200 shadow-sm"
                >
                  Edit
                </button>
              </PermissionWrapper>
            </div>

          </div>
        </div>
      )}

      {/* Quiz Form Modal */}
      {showQuizForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-forestGreen">
                {isEditing ? "Edit Quiz" : "Add New Quiz"}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <AIContentGenerator
                    contentType="quiz"
                    onUseGenerated={handleUseGeneratedQuiz}
                  />
                )}
                <button
                  onClick={() => {
                    setShowQuizForm(false);
                    setIsEditing(false);
                    setSelectedItem(null);
                    clearFormData();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <form id="quizForm" onSubmit={handleQuizSubmit} className="space-y-4">

                {/* Title */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={quizFormData.title}
                    onChange={handleQuizInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    placeholder="Enter quiz title"
                  />
                </div>

                {/* Duration, Passing Score, Max Attempts */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Quiz Type *
                    </label>
                    <select
                      value={quizType}
                      disabled={isEditing}
                      onChange={(e) => setQuizType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    >
                      <option value="normal">Normal Quiz</option>
                      <option value="text_based">Text-Based Quiz</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      name="duration_minutes"
                      required
                      min="1"
                      value={quizFormData.duration_minutes}
                      onChange={handleQuizInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter duration"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Passing Score (%) *
                    </label>
                    <input
                      type="number"
                      name="passing_score"
                      required
                      min="35"
                      max="100"
                      value={quizFormData.passing_score}
                      onChange={handleQuizInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter passing score"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Attempts Gap (hrs) *
                    </label>
                    <input
                      type="number"
                      name="attempts_gap"
                      required
                      min="0"
                      value={quizFormData.attempts_gap}
                      onChange={handleQuizInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter attempts gap in hours"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Attempts Renew Days *
                    </label>
                    <input
                      type="number"
                      name="attempts_renew_days"
                      required
                      min="0"
                      value={quizFormData.attempts_renew_days}
                      onChange={handleQuizInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter renew days"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Max Attempts *
                    </label>
                    <input
                      type="number"
                      name="max_attempts"
                      required
                      min="1"
                      value={quizFormData.max_attempts}
                      onChange={handleQuizInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter max attempts"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Compulsory Quiz */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isQuizCompulsory"
                        name="isQuizCompulsory"
                        checked={quizFormData.isQuizCompulsory}
                        onChange={(e) =>
                          setQuizFormData({
                            ...quizFormData,
                            isQuizCompulsory: e.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded"
                      />
                      <label htmlFor="isQuizCompulsory" className="ml-2 block text-xs sm:text-sm text-gray-700">
                        Quiz is compulsory
                      </label>
                    </div>

                    {/* Number of Warnings */}
                    {!!quizFormData.isWarning && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Number of warnings allowed
                        </label>
                        <input
                          type="number"
                          name="no_of_warning"
                          min="1"
                          value={quizFormData.no_of_warning}
                          onChange={(e) => setQuizFormData({
                            ...quizFormData,
                            no_of_warning: Number(e.target.value) < 1 ? 1 : Number(e.target.value)
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                          placeholder="Enter number of warnings"
                        />
                      </div>
                    )}
                  </div>

                  {/* Compulsory Quiz */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isWarning"
                      name="isWarning"
                      checked={quizFormData.isWarning}
                      onChange={(e) =>
                        setQuizFormData({
                          ...quizFormData,
                          isWarning: e.target.checked,
                          no_of_warning: e.target.checked ? Math.max(1, quizFormData.no_of_warning) : 1
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded"
                    />
                    <label htmlFor="isWarning" className="ml-2 block text-xs sm:text-sm text-gray-700">
                      Enable Warnings (Tab switch / ESC / Fullscreen exit)
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setShowQuizForm(false);
                  setIsEditing(false);
                  setSelectedItem(null);
                  clearFormData();
                }}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="quizForm"
                className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen hover:bg-forestGreen rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isEditing ? "Update Quiz" : "Create Quiz"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quiz Form Modal */}
      {/* {showQuizForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold  text-forestGreen">
                {isEditing ? "Edit Quiz" : "Add New Quiz"}
              </h2>
              <div className="flex items-center gap-3">
                {!isEditing && <AIContentGenerator
                  contentType="quiz"
                  onUseGenerated={handleUseGeneratedQuiz}
                />}
                <button
                  onClick={() => {
                    setShowQuizForm(false);
                    setIsEditing(false);
                    setSelectedItem(null);
                    clearFormData();
                  }}
                  className="text-gray-500 hover:text-leafGreen transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleQuizSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="quizTitle"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="quizTitle"
                  name="title"
                  required
                  value={quizFormData.title}
                  onChange={handleQuizInputChange}
                  className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                  placeholder="Enter quiz title"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Type*
                </label>
                <select
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                >
                  <option value="normal">Normal Quiz</option>
                  <option value="text_based">Text-Based Quiz</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="duration_minutes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="duration_minutes"
                    name="duration_minutes"
                    required
                    min="1"
                    value={quizFormData.duration_minutes}
                    onChange={handleQuizInputChange}
                    className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                    placeholder="Enter duration"
                  />
                </div>

                <div>
                  <label
                    htmlFor="passing_score"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    id="passing_score"
                    name="passing_score"
                    required
                    min="0"
                    max="100"
                    value={quizFormData.passing_score}
                    onChange={handleQuizInputChange}
                    className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                    placeholder="Enter passing score"
                  />
                </div>

                <div>
                  <label
                    htmlFor="max_attempts"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    id="max_attempts"
                    name="max_attempts"
                    required
                    min="1"
                    value={quizFormData.max_attempts}
                    onChange={handleQuizInputChange}
                    className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                    placeholder="Enter max attempts"
                  />
                </div>

                <div>
                  <label
                    htmlFor="attempts_gap"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Attempts Gap (hours)
                  </label>
                  <input
                    type="number"
                    id="attempts_gap"
                    name="attempts_gap"
                    required
                    min="0"
                    value={quizFormData.attempts_gap}
                    onChange={handleQuizInputChange}
                    className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                    placeholder="Enter attempts gap in hours"
                  />
                </div>

                <div>
                  <label
                    htmlFor="attempts_renew_days"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Attempts Renew Days
                  </label>
                  <input
                    type="number"
                    id="attempts_renew_days"
                    name="attempts_renew_days"
                    required
                    min="0"
                    value={quizFormData.attempts_renew_days}
                    onChange={handleQuizInputChange}
                    className="mt-1 block w-full px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                    placeholder="Enter days after which attempts are renewed"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isQuizCompulsory"
                  name="isQuizCompulsory"
                  checked={quizFormData.isQuizCompulsory}
                  onChange={(e) =>
                    setQuizFormData({
                      ...quizFormData,
                      isQuizCompulsory: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                />
                <label htmlFor="isQuizCompulsory" className="text-sm text-gray-700">
                  Quiz is compulsory
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isWarning"
                  name="isWarning"
                  checked={quizFormData.isWarning}
                  onChange={(e) =>
                    setQuizFormData({
                      ...quizFormData,
                      isWarning: e.target.checked,
                      no_of_warning: e.target.checked ? Math.max(1, quizFormData.no_of_warning) : 1
                    })
                  }
                  className="h-4 w-4 text-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                />
                <label htmlFor="isWarning" className="text-sm text-gray-700">
                  Enable Warnings (Tab switch / ESC / Fullscreen exit)
                </label>
              </div>

              {!!quizFormData.isWarning && (
                <div className="mt-2">
                  <label
                    htmlFor="no_of_warning"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Number of warnings allowed
                  </label>
                  <input
                    type="number"
                    id="no_of_warning"
                    name="no_of_warning"
                    min="1"
                    value={quizFormData.no_of_warning}
                    onChange={(e) => setQuizFormData({ ...quizFormData, no_of_warning: Number(e.target.value) < 1 ? 1 : Number(e.target.value) })}
                    className="mt-1 block px-3 py-2  bg-lightGreen border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300 hover:shadow-md"
                    placeholder="Enter number of warnings"
                  />
                </div>
              )}


              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuizForm(false);
                    setIsEditing(false);
                    setSelectedItem(null);
                    clearFormData();
                  }}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover: hover:bg-lightGreen/50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3  from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  {isEditing ? "Update Quiz" : "Add Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}

      <div className="mt-8">
        {!quizzesData || quizzesData?.length === 0 ? (
          <div className="bg-white shadow-lg rounded-xl p-8 text-center border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl mb-8">
            <p className="text-gray-500">
              No quizzes available. Add your first quiz to get started.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-lightGreen">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Duration (mins)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Passing Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Marks</th>
                    <PermissionWrapper section="Quiz" action="toggle">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    </PermissionWrapper>
                    <PermissionWrapper section="Quiz" action="edit|view">
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </PermissionWrapper>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quizzesData &&
                    quizzesData.length > 0 &&
                    quizzesData.map((quiz, index) => (
                      <tr key={quiz.id} className="hover:bg-lightGreen/20 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>

                        {/* Title */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-forestGreen block truncate max-w-[28ch]">
                            {quiz.title.charAt(0).toUpperCase() + quiz.title.slice(1)}
                          </span>
                          {quiz.included_topic_id && (
                            <p className="mt-0.5 text-xs text-amber-700">
                              Included in topic: {quiz.included_topic_title}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{quiz.duration_minutes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{quiz.passing_score}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{quiz.totalMarks}</td>

                        <PermissionWrapper section="Quiz" action="toggle">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleStatusToggle(quiz)}
                              disabled={!!quiz.included_topic_id}
                              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${quiz.status !== 'inactive' ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={quiz.included_topic_id ? `Included in topic: ${quiz.included_topic_title}` : (quiz.status !== 'inactive' ? "Deactivate" : "Activate")}
                            >
                              <span className={`absolute top-1/2 left-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${quiz.status !== 'inactive' ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                            </button>
                          </td>
                        </PermissionWrapper>

                        <PermissionWrapper section="Quiz" action="edit|view">
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleAddQuestion(quiz.id, quiz.quizType)}
                                className="text-forestGreen hover:text-leafGreen transition-colors duration-200"
                              >
                                <Plus className="w-5 h-5 inline-block mr-1" />
                                Add
                              </button>
                              <button
                                onClick={() => handleView(quiz)}
                                className="text-forestGreen hover:text-leafGreen transition-colors duration-200"
                              >
                                <Eye className="w-5 h-5 inline-block mr-1" />
                                View
                              </button>
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
                {quizzesData &&
                  quizzesData.length > 0 &&
                  quizzesData.map((quiz, index) => (
                    <div
                      className={"p-4 bg-white transition-all duration-300"}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 mr-2">
                          <h3 className="text-base font-semibold  text-forestGreen">
                            {quiz.title.charAt(0).toUpperCase() + quiz.title.slice(1)}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {quiz.totalMarks}
                          </p>
                          {quiz.included_topic_id && (
                            <p className="text-xs text-amber-700 mt-1">
                              Included in topic: {quiz.included_topic_title}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <PermissionWrapper section="Quiz" action="toggle">
                          <button
                            onClick={() => handleStatusToggle(quiz)}
                            disabled={!!quiz.included_topic_id}
                            className={`relative w-7 h-4 rounded-full transition-colors duration-300 ${quiz.status !== 'inactive' ? 'bg-green-500' : 'bg-gray-300'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={quiz.included_topic_id ? `Included in topic: ${quiz.included_topic_title}` : (quiz.status !== 'inactive' ? "Activate" : "Deactivate")}
                          >
                            <span
                              className={`absolute top-1/2 left-[3px] w-2.5 h-2.5 rounded-full bg-white shadow-sm transform transition-transform duration-300 -translate-y-1/2 ${quiz.status !== 'inactive' ? 'translate-x-[13px]' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </PermissionWrapper>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <PermissionWrapper section="Quiz" action="edit|view">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleAddQuestion(quiz.id, quiz.quizType)
                                }
                                className="text-forestGreen hover:text-leafGreen mr-5 transition-colors duration-200"
                              >
                                <Plus className="w-5 h-5 inline-block mr-1" />
                                Add
                              </button>
                              <button
                                onClick={() => handleView(quiz)}
                                className="text-emerald-600 hover:text-teal-600 transition-colors duration-200"
                              >
                                <Eye className="w-5 h-5 inline-block mr-1" />
                                View
                              </button>
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
  );
};

export default Quiz;
