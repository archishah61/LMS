"use client";

import { useState } from "react";
import AdminLoader from "../../../components/admin/AdminLoader";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  BookOpen,
  Code,
  Puzzle,
  Shield,
  HelpCircle,
  Trophy,
  Calendar,
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  useGetActivitiesByContestQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
  useToggleActivityStatusMutation,
} from "../../../services/Contest/contestActivityAPI";
import { slugify } from "../../../utils/slugify";
import toast from "react-hot-toast";
import PermissionWrapper from "../../../context/PermissionWrapper";

const ContestActivitiesPage = () => {
  const { id } = useLocation().state;
  const { contest_name } = useParams();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState("created_at");
  const [filterType, setFilterType] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  const isAnyFilterApplied = () => {
    return filterDifficulty !== "all" || filterType !== "all" || sortBy !== "created_at";
  }

  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useGetActivitiesByContestQuery({ contestId: id, sortBy, type: filterType, difficulty: filterDifficulty });

  const activities = apiResponse?.activities || [];

  const [createActivity] = useCreateActivityMutation();
  const [updateActivity] = useUpdateActivityMutation();
  const [deleteActivity] = useDeleteActivityMutation();
  const [toggleActivityStatus] = useToggleActivityStatusMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    activityId: null,
    activityTitle: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [mobileActionMenu, setMobileActionMenu] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "quiz",
    difficulty: "easy",
    points_reward: null,
  });

  const handleAddActivity = () => {
    setEditingActivity(null);
    setFormData({
      title: "",
      description: "",
      type: "quiz",
      difficulty: "easy",
      points_reward: null,
    });
    setShowForm(true);
  };

  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description,
      type: activity.type,
      difficulty: activity.difficulty,
      points_reward: activity.points_reward,
    });
    setShowForm(true);
    setMobileActionMenu(null);
  };

  const handleDeleteActivity = (activity) => {
    setDeleteConfirmation({
      show: true,
      activityId: activity.id,
      activityTitle: activity.title,
    });
    setMobileActionMenu(null);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await deleteActivity(
        deleteConfirmation.activityId
      ).unwrap();
      refetch();
      setDeleteConfirmation({
        show: false,
        activityId: null,
        activityTitle: "",
      });
      if (response.success) toast.success("Activity Deleted Successfully");
    } catch (error) {
      console.error("Failed to delete activity:", error);
      toast.error(
        error?.data?.message ||
        error?.data?.error ||
        "Failed to delete activity. Please try again."
      );
    }
  };

  const handleToggleStatus = async (activityId) => {
    try {
      const response = await toggleActivityStatus(activityId).unwrap();
      refetch();
      if (response.success)
        toast.success("Activity Status Updated Successfully");
    } catch (error) {
      console.error("Failed to toggle activity status:", error);
      toast.error(
        error?.data?.message ||
        error?.data?.error ||
        "Failed to update activity status. Please try again."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingActivity) {
        // Update existing activity
        const response = await updateActivity({
          id: editingActivity.id,
          ...formData,
          contest_id: id,
        }).unwrap();
        if (response.success) toast.success("Activity Saved Successfully");
      } else {
        // Add new activity
        const response = await createActivity({
          ...formData,
          contest_id: id,
        }).unwrap();
        if (response.success) toast.success("Activity Created Successfully");
      }
      setShowForm(false);
      refetch();
    } catch (error) {
      console.error("Failed to save activity:", error);
      toast.error(
        error?.data?.message ||
        error?.data?.error ||
        "Failed to save activity. Please try again."
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "points_reward" ? Number.parseInt(value) : value,
    }));
  };

  const filteredActivities = activities
  // .filter((activity) => {
  //   if (filterType !== "all" && activity.type !== filterType) return false;
  //   if (
  //     filterDifficulty !== "all" &&
  //     activity.difficulty !== filterDifficulty
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

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleActivityClick = (activity) => {
    const activityTitle = activity.title.toLowerCase().replace(/\s+/g, "-");

    switch (activity.type) {
      case "coding":
        navigate(
          `/admin/dashboard/contests/activity/${slugify(activityTitle)}/coding`,
          {
            state: {
              activity_id: activity.id,
              activity: activity,
            },
          }
        );
        break;
      case "quiz":
        navigate(
          `/admin/dashboard/contests/activity/${slugify(activityTitle)}/quiz`,
          {
            state: {
              activity_id: activity.id,
              activity: activity,
            },
          }
        );
        break;
      default:
        break;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-orange-100 text-orange-800";
      case "expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "quiz":
        return "bg-lightGreen text-forestGreen";
      case "coding":
        return "bg-lightGreen text-forestGreen";
      case "escape_room":
        return "bg-leafGreen text-forestGreen";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "quiz":
        return <BookOpen size={14} />;
      case "coding":
        return <Code size={14} />;
      case "escape_room":
        return <Shield size={14} />;
      default:
        return <HelpCircle size={14} />;
    }
  };

  if (isLoading) {
    return <AdminLoader fullScreen={true} message="Loading activities..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">Failed to load activities</p>
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
    <div className="flex flex-col h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1 grid">
              <h1 className="text-2xl font-bold  text-forestGreen">
                Contest Activities
              </h1>
              <p className="text-gray-600 mt-1 truncate">
                Manage activities for "{contest_name}"
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

              <PermissionWrapper section="Contest Activity" action="create">
                <button
                  onClick={handleAddActivity}
                  className=" bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                >
                  <Plus size={18} />
                  Add Activity
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
                  Activities
                </h1>
                <p className="text-gray-600 text-sm mt-0.5 truncate">
                  For "{contest_name}"
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

              <PermissionWrapper section="Contest Activity" action="create">
                <button
                  onClick={handleAddActivity}
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
              <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4`}>
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
                    Activity Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="quiz">Quiz</option>
                    <option value="coding">Coding</option>
                    <option value="escape_room">Escape Room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setFilterType("all")
                      setFilterDifficulty("all")
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden max-w-full">
          {/* List Header - Hidden on mobile */}
          <div className="bg-lightGreen px-4 sm:px-6 py-3 border-b border-gray-200 hidden sm:block">
            <div className="grid grid-cols-11 gap-4 text-xs font-semibold uppercase text-gray-700">
              <div className="col-span-4">Activity Details</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-1">Points</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-gray-200">
            {paginatedActivities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className="group px-4 sm:px-6 py-4 hover:bg-lightGreen/20 transition-all duration-200 cursor-pointer"
              >
                {/* Desktop View */}
                <div className="hidden sm:grid sm:grid-cols-11 gap-4 items-center">
                  {/* Activity Info */}
                  <div className="col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-lightGreen/30 rounded-lg flex items-center justify-center">
                        {getTypeIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-forestGreen transition-colors truncate">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                          <Calendar size={12} />
                          <span>
                            Created:{" "}
                            {new Date(activity.created_at).toLocaleDateString(
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

                  {/* Type */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(
                          activity.type
                        )}`}
                      >
                        {getTypeIcon(activity.type)}
                        {activity.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(
                          activity.difficulty
                        )}`}
                      >
                        {activity.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <Trophy size={14} className="text-leafGreen" />
                      <span className="font-semibold text-gray-900">
                        {activity.points_reward}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-center gap-2 transition-opacity">
                      <PermissionWrapper
                        section="Contest Activity"
                        action="edit"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditActivity(activity);
                          }}
                          className="h-8 w-8 p-0 hover:bg-lightGreen rounded-lg flex items-center justify-center text-forestGreen transition-colors"
                          title="Edit Activity"
                        >
                          <Edit2 size={14} />
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper
                        section="Contest Activity"
                        action="toggle"
                      >
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                          title={activity.is_active ? "Deactivate" : "Activate"}
                        >
                          <input
                            type="checkbox"
                            checked={activity.is_active}
                            onChange={() => handleToggleStatus(activity.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                        </label>
                      </PermissionWrapper>
                      <PermissionWrapper
                        section="Contest Activity"
                        action="delete"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteActivity(activity);
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors"
                          title="Delete Activity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </PermissionWrapper>
                    </div>
                  </div>
                </div>

                {/* Mobile View */}
                <div className="sm:hidden">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-lightGreen/30 rounded-lg flex items-center justify-center">
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-forestGreen transition-colors line-clamp-2 break-words">
                            {activity.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2 break-words">
                            {activity.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(
                                activity.type
                              )}`}
                            >
                              {getTypeIcon(activity.type)}
                              <span className="max-w-[80px] truncate">
                                {activity.type.replace("_", " ")}
                              </span>
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(
                                activity.difficulty
                              )}`}
                            >
                              <span className="max-w-[60px] truncate">
                                {activity.difficulty}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                              <Trophy size={12} className="text-leafGreen flex-shrink-0" />
                              <span>{activity.points_reward} pts</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={12} />
                            <span>
                              {new Date(activity.created_at).toLocaleDateString(
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

                        {/* Mobile Actions Menu */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMobileActionMenu(
                                mobileActionMenu === activity.id
                                  ? null
                                  : activity.id
                              );
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {mobileActionMenu === activity.id && (
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-32">
                              <PermissionWrapper section="Contest Activity" action="edit">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditActivity(activity);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit2 size={14} />
                                  Edit
                                </button>
                              </PermissionWrapper>
                              <PermissionWrapper section="Contest Activity" action="toggle">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(activity.id);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  {activity.is_active ? "Deactivate" : "Activate"}
                                </button>
                              </PermissionWrapper>
                              <PermissionWrapper section="Contest Activity" action="delete">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteActivity(activity);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </PermissionWrapper>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredActivities.length === 0 && (
            <div className="px-4 sm:px-6 py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-gray-400" />
              </div>
              <div className="text-gray-500 text-lg font-medium mb-2">
                No activities found
              </div>
              <p className="text-gray-400 text-sm sm:text-base px-4">
                Try adjusting your filters or add a new activity.
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredActivities.length > 0 && totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredActivities.length)} of{" "}
                  {filteredActivities.length} activities
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1 flex-wrap justify-center max-w-[200px] sm:max-w-none">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-w-[32px] ${currentPage === page
                            ? "bg-leafGreen text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-lightGreen/20"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
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
              {/* Header with Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-600 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                    Delete Activity
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={() =>
                    setDeleteConfirmation({
                      show: false,
                      activityId: null,
                      activityTitle: "",
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
                  Are you sure you want to delete this activity?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                    "{deleteConfirmation.activityTitle}"
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
                      activityId: null,
                      activityTitle: "",
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

      {/* Activity Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {editingActivity ? "Edit Activity" : "Add New Activity"}
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
                id="contestActivityForm"
                className="space-y-4 sm:space-y-6"
              >
                {/* Title and Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                      placeholder="Enter activity title"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.title?.length || 0}/100 characters
                    </p>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      disabled={editingActivity}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="quiz">Quiz</option>
                      <option value="coding">
                        Coding
                      </option>
                    </select>
                  </div>
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
                    placeholder="Enter activity description"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description?.length || 0}/500 characters
                  </p>
                </div>

                {/* Points and Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points Awarded *
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
                      placeholder="Enter points awarded"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Points users earn for completing this activity
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty *
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose the difficulty level
                    </p>
                  </div>
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
                form="contestActivityForm"
                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* {!editingActivity && <Plus size={16} className="flex-shrink-0" />} */}
                {editingActivity ? "Update " : "Create "}<span className="hidden sm:inline">Activity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestActivitiesPage;