"use client";

import { useState, useEffect } from "react";
import {
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetAllFeatureStatusQuery, useToggleFeatureStatusMutation } from "../../../services/Masters/featureStatusAPI";
import { getAdminToken } from "../../../services/CookieService";
import { useGetAllFeatureInterestsQuery } from "../../../services/Support/featureInterestAPI";
import toast from "react-hot-toast";
import AdminLoader from "../../../components/admin/AdminLoader";

const Features = () => {
  const navigate = useNavigate();
  const { access_token } = getAdminToken();

  const [sortBy, setSortBy] = useState("created_at");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: featureData, isLoading, isError, refetch } = useGetAllFeatureStatusQuery({ sortBy, status: filterStatus, access_token });
  const [toggleFeatureStatus] = useToggleFeatureStatusMutation();

  const isAnyFilterApplied = () => {
    return (
      filterStatus !== "all" ||
      sortBy !== "created_at"
    )
  }

  // Function to format feature names
  const formatFeatureName = (name) => {
    // Handle special cases first
    const specialCases = {
      'cheatsheet': 'Cheatsheet',
      'challenge_quest': 'Challenge Quest',
      'daily_challenge': 'Daily Challenge',
      'contest': 'Contest',
      'maths_solver': 'Maths Solver',
      'interview_ai': 'Interview AI',
      'learning_path_ai': 'Learning Path AI',
      'do_your_own_course_ai': 'Do Your Own Course AI',
      'chatbot_ai': 'Chatbot AI',
      'become_a_partner': 'Become a Partner'
    };

    if (specialCases[name]) {
      return specialCases[name];
    }

    // General formatting for other names
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Transform the feature data to match the expected structure
  const transformedFeatureData = featureData?.map(feature => ({
    id: feature.id,
    category: formatFeatureName(feature.name), // Use formatted name
    originalName: feature.name, // Keep original for reference if needed
    is_active: feature.is_active === 1, // Convert 1/0 to boolean
    created_at: feature.created_at,
    updated_at: feature.updated_at
  })) || [];

  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [updatingId, setUpdatingId] = useState(null);

  // Update categories when featureData changes
  useEffect(() => {
    // if (featureData && featureData.length > 0) {
    setCategories(transformedFeatureData);
    // }
  }, [featureData]);

  const handleToggleStatus = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const newStatus = !category.is_active;

    // Optimistically update UI
    setCategories(prev =>
      prev.map(c =>
        c.id === categoryId ? { ...c, is_active: newStatus } : c
      )
    );

    setUpdatingId(categoryId);

    try {
      // Call API to toggle status - no need to send is_active, the API handles the toggle
      const toggleData = {
        id: categoryId,
        access_token: access_token
      };

      const result = await toggleFeatureStatus(toggleData).unwrap();

      // Refetch data to ensure sync with server
      await refetch();

    } catch (error) {
      console.error("Failed to toggle feature status:", error);

      // Revert optimistic update on error
      setCategories(prev =>
        prev.map(c =>
          c.id === categoryId ? { ...c, is_active: !newStatus } : c
        )
      );

      // Show error message (you can add a toast notification here)
      toast.error(error.data?.error || "Failed to toggle feature status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCategories = categories
  // .filter((category) => {
  //   if (filterStatus === "all") return true;
  //   if (filterStatus === "active") return category.is_active;
  //   if (filterStatus === "inactive") return !category.is_active;
  //   return true;
  // })
  // .sort((a, b) => {
  //   if (sortBy === "created_at")
  //     return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  //   if (sortBy === "name") return a.category.localeCompare(b.category);
  //   if (sortBy === "status")
  //     return a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1;
  //   return 0;
  // });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Loading state
  if (isLoading) {
    return <AdminLoader message="Loading features..." />;
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading features</h3>
          <p className="text-gray-500 mb-4">Please try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-leafGreen text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200">
        <div className="w-full px-4 sm:px-6 py-4">
          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent text-center flex-1 mx-2">
                Features
              </h1>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex border rounded-lg items-center gap-2 text-gray-600 hover:text-gray-900 p-1"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                Features
              </h1>
              <p className="text-gray-600 mt-1">
                Manage Features Active/Inactive for your platform
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {showFilters ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 shadow-sm"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden flex justify-center mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors w-full max-w-xs justify-center"
            >
              <Filter size={16} />
              <span className="font-medium text-sm">Filters</span>
              {showFilters ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>

          {/* Filters */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
          >
            <div className="bg-lightGreen/10 rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen"
                  >
                    <option value="created_at">Newest First</option>
                    <option value="name">By Name</option>
                    <option value="status">By Status</option>
                  </select>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen"
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
                      setFilterStatus("all");
                      setSortBy("created_at");
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-full px-4 py-4 sm:p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop List Header */}
            <div className="bg-lightGreen px-6 py-3 border-b border-gray-200 hidden md:block">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold uppercase text-gray-700">
                <div className="col-span-10">Feature Details</div>
                <div className="col-span-2 text-center">Status</div>
              </div>
            </div>

            {/* List Items */}
            <div className="divide-y divide-gray-100">
              {paginatedCategories.length > 0 ? (
                paginatedCategories.map((category) => (
                  <div
                    key={category.id}
                    className="group px-4 py-4 sm:px-6 hover:bg-lightGreen/20 transition-all duration-200"
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                            <Layers size={16} className="text-leafGreen" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base mb-1">
                              {category.category}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center ml-2">
                          <label
                            className={`relative inline-flex items-center cursor-pointer ${updatingId === category.id ? 'opacity-50' : ''}`}
                            title={category.is_active ? "Deactivate" : "Activate"}
                          >
                            <input
                              type="checkbox"
                              checked={category.is_active}
                              onChange={() => handleToggleStatus(category.id)}
                              disabled={updatingId === category.id}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            {updatingId === category.id && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                      <div className="col-span-10">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                            <Layers size={18} className="text-leafGreen" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mt-2">
                              {category.category}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center justify-center transition-opacity">
                          <label
                            className={`relative inline-flex items-center cursor-pointer ${updatingId === category.id ? 'opacity-50' : ''}`}
                            title={category.is_active ? "Deactivate" : "Activate"}
                          >
                            <input
                              type="checkbox"
                              checked={category.is_active}
                              onChange={() => handleToggleStatus(category.id)}
                              disabled={updatingId === category.id}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                            {updatingId === category.id && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Layers size={24} className="text-gray-400" />
                  </div>
                  <div className="text-gray-500 text-lg font-medium mb-2">
                    No features found
                  </div>
                  <p className="text-gray-400">
                    {filterStatus === "all" ? "No features available." : "Try adjusting your filters."}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredCategories.length > 0 && totalPages > 1 && (
              <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-lightGreen/10">
                {/* Mobile Pagination */}
                <div className="md:hidden">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="text-sm text-gray-600 text-center">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center justify-between w-full max-w-xs">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        Next
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length}
                    </div>
                  </div>
                </div>

                {/* Desktop Pagination */}
                <div className="hidden md:flex md:items-center md:justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredCategories.length)} of{" "}
                    {filteredCategories.length} features
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                              ? "bg-leafGreen text-white"
                              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
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
                      className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;