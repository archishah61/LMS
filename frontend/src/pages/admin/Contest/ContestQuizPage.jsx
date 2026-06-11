"use client";

import { useState } from "react";
import AdminLoader from "../../../components/admin/AdminLoader";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  BookOpen,
  Clock,
  Target,
  Trophy,
  Calendar,
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  MoreVertical,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useGetQuizzesByActivityQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useToggleQuizStatusMutation,
} from "../../../services/Contest/contestQuizAPI";
import toast from "react-hot-toast";
import PermissionWrapper from "../../../context/PermissionWrapper";

const ContestQuizPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { activity_id, activity } = state || {};

  const [sortBy, setSortBy] = useState("created_at");
  const [filterStatus, setFilterStatus] = useState("all");

  const isAnyFilterApplied = () => {
    return filterStatus !== "all" || sortBy !== "created_at";
  }

  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useGetQuizzesByActivityQuery({ activityId: activity_id, sortBy, status: filterStatus });

  const quizzes = apiResponse?.quizzes || [];

  const [createQuiz] = useCreateQuizMutation();
  const [updateQuiz] = useUpdateQuizMutation();
  const [deleteQuiz] = useDeleteQuizMutation();
  const [toggleQuizStatus] = useToggleQuizStatusMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    quizId: null,
    quizTitle: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    time_limit_seconds: null,
    max_attempts: null,
    is_warning: false,
    no_of_warning: 3,
    qualify_percentage: null,
    show_answer: true,
    points_reward: null,
  });

  const handleAddQuiz = () => {
    setEditingQuiz(null);
    setFormData({
      title: "",
      description: "",
      time_limit_seconds: null,
      max_attempts: null,
      is_warning: false,
      no_of_warning: 3,
      qualify_percentage: null,
      show_answer: true,
      points_reward: null,
    });
    setShowForm(true);
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description || "",
      time_limit_seconds: quiz.time_limit_seconds || null,
      max_attempts: quiz.max_attempts || null,
      is_warning: quiz.is_warning || false,
      no_of_warning: quiz.no_of_warning || null,
      qualify_percentage: quiz.qualify_percentage || null,
      show_answer: quiz.show_answer || false,
      points_reward: quiz.points_reward || null,
    });
    setShowForm(true);
    setMobileMenuOpen(null);
  };

  const handleDeleteQuiz = (quiz) => {
    setDeleteConfirmation({
      show: true,
      quizId: quiz.id,
      quizTitle: quiz.title,
    });
    setMobileMenuOpen(null);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await deleteQuiz(deleteConfirmation.quizId).unwrap();
      refetch();
      setDeleteConfirmation({ show: false, quizId: null, quizTitle: "" });
      if (response.success) toast.success("Quiz Deleted Successfully");
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      toast.error(
        error?.data?.message ||
        error?.data?.error ||
        "Failed to delete quiz. Please try again."
      );
    }
  };

  const handleToggleStatus = async (quizId) => {
    try {
      const response = await toggleQuizStatus(quizId).unwrap();
      refetch();
      if (response.success) toast.success("Quiz Status Updated Successfully");
    } catch (error) {
      console.error("Failed to toggle quiz status:", error);
      toast.error(
        error?.data?.message ||
        error?.data?.error ||
        "Failed to update quiz status. Please try again."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingQuiz) {
        // Update existing quiz
        const response = await updateQuiz({
          id: editingQuiz.id,
          ...formData,
        }).unwrap();
        if (response.success) toast.success("Quiz Saved Successfully");
      } else {
        // Add new quiz
        const response = await createQuiz({
          ...formData,
          activity_id: activity_id,
        }).unwrap();
        if (response.success) toast.success("Quiz Created Successfully");
      }
      setShowForm(false);
      refetch();
    } catch (error) {
      console.error("Failed to save quiz:", error);
      toast.error(
        error?.data?.message ||
        error?.data?.error ||
        "Failed to save quiz. Please try again."
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: [
        "time_limit_seconds",
        "max_attempts",
        "qualify_percentage",
        "points_reward",
      ].includes(name)
        ? Number.parseInt(value) || null
        : [
          "is_warning",
        ].includes(name)
          ? checked
          : value,
    }));
  };

  const handleManageQuestions = (quiz) => {
    navigate(`/admin/dashboard/challenges/contest-quiz/questions`, {
      state: { id: quiz.id },
    });
  };

  const handleQuizClick = (quiz) => {
    navigate(`/admin/dashboard/challenges/contest-quiz/questions`, {
      state: { id: quiz.id, quiz: quiz },
    });
  };

  const filteredQuizzes = quizzes
  // .filter((quiz) => {
  //   if (
  //     filterStatus !== "all" &&
  //     (filterStatus === "active" ? !quiz.is_active : quiz.is_active)
  //   )
  //     return false;
  //   return true;
  // })
  // .sort((a, b) => {
  //   if (sortBy === "created_at")
  //     return new Date(b.created_at) - new Date(a.created_at);
  //   if (sortBy === "points_reward") return b.points_reward - a.points_reward;
  //   if (sortBy === "title") return a.title.localeCompare(b.title);
  //   return 0;
  // });

  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuizzes = filteredQuizzes.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return <AdminLoader fullScreen={true} message="Loading quizzes..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">Failed to load quizzes</p>
          <button
            onClick={() => refetch()}
            className="bg-leafGreen   text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1 grid min-w-0">
              <h1 className="text-2xl font-bold  text-forestGreen">
                Quiz Management
              </h1>
              <p className="text-gray-600 mt-1 truncate">
                Manage quizzes for "{activity?.title || "Activity"}"
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-2 md:gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors sm:px-3"
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {showFilters ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              <PermissionWrapper section="Contest Quiz" action="create">
                <button
                  onClick={handleAddQuiz}
                  className=" bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                >
                  <Plus size={18} />
                  Add Quiz
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
                <h1 className="text-xl font-bold  text-forestGreen">
                  Quizzes
                </h1>
                <p className="text-gray-600 text-sm mt-0.5 truncate">
                  For "{activity?.title || "Activity"}"
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors flex-1 justify-center text-sm"
              >
                <Filter size={16} />
                <span className="font-medium">Filters</span>
              </button>

              <PermissionWrapper section="Contest Quiz" action="create">
                <button
                  onClick={handleAddQuiz}
                  className=" bg-leafGreen   text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </PermissionWrapper>
            </div>
          </div>

          {/* Filters Section */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="created_at">Newest First</option>
                    <option value="points_reward">By Points</option>
                    <option value="title">By Title</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setFilterStatus("all")
                      setSortBy("created_at")
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

      {/* Main content */}
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-0">
          {/* List Header - Hidden on mobile */}
          <div className="hidden sm:block bg-lightGreen px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-xs uppercase font-semibold text-gray-700">
              <div className="col-span-4">Quiz Details</div>
              <div className="col-span-2">Time Limit</div>
              <div className="col-span-2">Attempts</div>
              <div className="col-span-1">Pass %</div>
              <div className="col-span-1">Points</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-200">
            {paginatedQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => handleQuizClick(quiz)}
                className="group px-3 sm:px-6 py-3 sm:py-5 hover:bg-lightGreen/20 transition-all duration-200 cursor-pointer min-w-0"
              >
                {/* Mobile View */}
                <div className="sm:hidden">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-lightGreen rounded-lg flex items-center justify-center mt-0.5">
                        <BookOpen size={14} className="text-forestGreen" />
                      </div>
                      <div className="flex-1 grid">
                        <h3 className="font-semibold text-gray-900 truncate mb-1 group-hover:text-forestGreen transition-colors text-sm truncate">
                          {quiz.title}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2 truncate leading-relaxed break-words">
                          {quiz.description || "No description provided"}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="relative flex-shrink-0 ml-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileMenuOpen(mobileMenuOpen === quiz.id ? null : quiz.id);
                        }}
                        className="h-7 w-7 p-0 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Mobile Dropdown Menu */}
                      {mobileMenuOpen === quiz.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                          <PermissionWrapper section="Contest Quiz" action="edit">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditQuiz(quiz);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 size={12} />
                              Edit Quiz
                            </button>
                          </PermissionWrapper>
                          <PermissionWrapper section="Contest Quiz" action="toggle">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(quiz.id);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Settings size={12} />
                              {quiz.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </PermissionWrapper>
                          <PermissionWrapper section="Contest Quiz" action="delete">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuiz(quiz);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={12} />
                              Delete Quiz
                            </button>
                          </PermissionWrapper>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <Clock size={12} className="text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 truncate">
                          {quiz.time_limit_seconds
                            ? `${quiz.time_limit_seconds}s`
                            : "No limit"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <Target size={12} className="text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 truncate">
                          {quiz.max_attempts
                            ? `${quiz.max_attempts} attempts`
                            : "Unlimited"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-gray-600 whitespace-nowrap text-xs">Pass%:</span>
                        <span className="font-semibold text-gray-900 whitespace-nowrap text-xs">
                          {quiz.qualify_percentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-gray-600 whitespace-nowrap text-xs">Points:</span>
                        <div className="flex items-center gap-1">
                          <Trophy size={10} className="text-leafGreen flex-shrink-0" />
                          <span className="font-semibold text-gray-900 whitespace-nowrap text-xs">
                            {quiz.points_reward || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={10} />
                      <span className="text-xs">
                        {new Date(quiz.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PermissionWrapper section="Contest Quiz" action="toggle">
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="relative inline-flex items-center cursor-pointer"
                          title={quiz.is_active ? "Deactivate" : "Activate"}
                        >
                          <input
                            type="checkbox"
                            checked={quiz.is_active}
                            onChange={() => handleToggleStatus(quiz.id)}
                            className="sr-only peer"
                          />
                          <div className="w-7 h-4 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                          <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-3"></div>
                        </label>
                      </PermissionWrapper>
                    </div>
                  </div>
                </div>

                {/* Desktop View - Unchanged */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-lightGreen rounded-lg flex items-center justify-center">
                        <BookOpen size={16} className="text-forestGreen" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-forestGreen transition-colors truncate">
                          {quiz.title}
                        </h3>

                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {quiz.description || "No description provided"}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                          <Calendar size={12} />
                          <span>
                            Created:{" "}
                            {new Date(quiz.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {quiz.time_limit_seconds
                          ? `${quiz.time_limit_seconds} seconds`
                          : "No limit"}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Target size={14} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {quiz.max_attempts
                          ? `${quiz.max_attempts} attempts`
                          : "Unlimited"}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {quiz.qualify_percentage}%
                    </span>
                  </div>

                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <Trophy size={14} className="text-leafGreen" />
                      <span className="font-semibold text-gray-900">
                        {quiz.points_reward || 0}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center justify-center gap-2 transition-opacity">
                      <PermissionWrapper section="Contest Quiz" action="edit">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditQuiz(quiz);
                          }}
                          className="h-8 w-8 p-0 hover:bg-lightGreen rounded-lg flex items-center justify-center text-forestGreen transition-colors"
                          title="Edit Quiz"
                        >
                          <Edit2 size={14} />
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper section="Contest Quiz" action="toggle">
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="relative inline-flex items-center cursor-pointer"
                          title={quiz.is_active ? "Deactivate" : "Activate"}
                        >
                          <input
                            type="checkbox"
                            checked={quiz.is_active}
                            onChange={() => handleToggleStatus(quiz.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                        </label>
                      </PermissionWrapper>
                      <PermissionWrapper section="Contest Quiz" action="delete">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz);
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors"
                          title="Delete Quiz"
                        >
                          <Trash2 size={14} />
                        </button>
                      </PermissionWrapper>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredQuizzes.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen size={20} className="text-gray-400" />
              </div>
              <div className="text-gray-500 text-base font-medium mb-2">
                No quizzes found
              </div>
              <p className="text-gray-400 text-sm">
                Try adjusting your filters or add a new quiz.
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredQuizzes.length > 0 && totalPages > 1 && (
            <div className="px-3 sm:px-6 py-3 border-t border-gray-200 bg-white">
              <div className="flex flex-col xs:flex-row items-center justify-between gap-2">
                <div className="text-xs text-gray-700 order-2 xs:order-1">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredQuizzes.length)} of{" "}
                  {filteredQuizzes.length} quizzes
                </div>
                <div className="flex items-center gap-1 order-1 xs:order-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1 sm:p-2 rounded-lg border border-gray-200 bg-white hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <ChevronLeft size={12} className="sm:w-4 sm:h-4" />
                  </button>

                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0 min-w-[32px] ${currentPage === page
                            ? "bg-leafGreen text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-lightGreen/20"
                            }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1 sm:p-2 rounded-lg border border-gray-200 bg-white hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <ChevronRight size={12} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm mx-auto shadow-2xl">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-600 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    Delete Quiz
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={() =>
                    setDeleteConfirmation({
                      show: false,
                      quizId: null,
                      quizTitle: "",
                    })
                  }
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-gray-600 mb-3">
                  Are you sure you want to delete this quiz?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                    "{deleteConfirmation.quizTitle}"
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-red-600 mt-3 flex items-center gap-1">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  This action cannot be undone and all associated data will be lost.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row gap-2 sm:gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirmation({
                      show: false,
                      quizId: null,
                      quizTitle: "",
                    })
                  }
                  className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} className="sm:w-4 sm:h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {editingQuiz ? "Edit Quiz" : "Add New Quiz"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form
                onSubmit={handleSubmit}
                id="contestQuizForm"
                className="space-y-4 sm:space-y-6"
              >
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter quiz title"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.title?.length || 0}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none text-sm sm:text-base"
                    placeholder="Enter quiz description"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description?.length || 0}/500 characters
                  </p>
                </div>

                {/* Qualify Percentage and Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qualify Percentage *
                    </label>
                    <input
                      type="number"
                      name="qualify_percentage"
                      value={formData.qualify_percentage}
                      onChange={handleInputChange}
                      required
                      min="35"
                      max="100"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                      placeholder="Enter percentage"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum score required to qualify (35-100%)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points Reward *
                    </label>
                    <input
                      type="number"
                      name="points_reward"
                      value={formData.points_reward}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="10000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                      placeholder="Enter points"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Points awarded for successful completion
                    </p>
                  </div>
                </div>

                {/* Time Limit and Max Attempts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      name="time_limit_seconds"
                      value={formData.time_limit_seconds}
                      onChange={handleInputChange}
                      min="0"
                      // max="3600"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                      placeholder="Enter seconds"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave this field blank for no time limit.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      name="max_attempts"
                      value={formData.max_attempts}
                      onChange={handleInputChange}
                      min="0"
                      // max="10"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                      placeholder="Enter attempts"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave this field blank for unlimited attempts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center p-3">
                    <input
                      id="is_warning"
                      type="checkbox"
                      checked={formData.is_warning}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_warning: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-leafGreen text-forestGreen focus:ring-leafGreen border-gray-300 rounded"
                    />
                    <label
                      htmlFor="is_warning"
                      className="ml-3 block text-sm text-gray-700 cursor-pointer"
                    >
                      Restrict Full Screen Exit
                    </label>
                  </div>

                  {Boolean(formData.is_warning) && <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Warning
                    </label>
                    <input
                      type="number"
                      name="no_of_warning"
                      value={formData.no_of_warning}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                      placeholder="Enter Number of Warning"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to submit without warnings.
                    </p>
                  </div>}
                </div>

                {/* Show Answer Checkbox */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    id="show_answer"
                    type="checkbox"
                    checked={formData.show_answer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        show_answer: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-leafGreen text-forestGreen focus:ring-leafGreen border-gray-300 rounded"
                  />
                  <label
                    htmlFor="show_answer"
                    className="ml-3 block text-sm text-gray-700 cursor-pointer"
                  >
                    Show answers to users after quiz completion
                  </label>
                </div>

                {/* Spacer for mobile to ensure content doesn't get hidden behind fixed buttons */}
                <div className="h-4 sm:h-0"></div>
              </form>
            </div>

            {/* Fixed Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="contestQuizForm"
                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} className="flex-shrink-0" />
                {editingQuiz ? "Update " : "Create "}<span className="hidden sm:inline">Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestQuizPage;