/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetAllReviewsQuery, useDeleteReviewMutation } from "../../../services/Reviews/reviewApi";
import { getAdminToken } from "../../../services/CookieService";
import { Star, Search, Trash2, Eye, Calendar, BookOpen, AlertTriangle, X, ChevronLeft, ChevronRight, Filter, ChevronUp, ChevronDown, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AdminLoader from "../../../components/admin/AdminLoader";
import PermissionWrapper from "../../../context/PermissionWrapper";

const Reviews = () => {
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [showFilter, setShowFilter] = useState(false)
  const [ratingFilter, setRatingFilter] = useState('all');

  const { access_token } = getAdminToken() || {};
  const { data: reviewsResponse, isLoading, error: reviewsError, refetch: refetchReviews } = useGetAllReviewsQuery(
    {
      access_token,
      search_term: searchTerm || undefined,
      rating: ratingFilter,
      page: currentPage,
      limit: pageSize,
    },
    {
      skip: !access_token,
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, ratingFilter]);

  const [deleteReview, { isLoading: deleteLoading }] = useDeleteReviewMutation();

  const handleDeleteReview = async () => {
    if (!reviewToDelete || !access_token) return;
    try {
      await deleteReview({
        id: reviewToDelete.id,
        access_token,
      }).unwrap();
      toast.success("Review deleted successfully!");
      setDeleteModalOpen(false);
      setReviewToDelete(null);
      refetchReviews();
    } catch (err) {
      console.error("Failed to delete review:", err);
      const errorMessage = err?.data?.error || err?.data?.message || err?.error || err?.message || "Failed to delete review";
      toast.error(errorMessage);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={16} className={`${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({rating}/5)</span>
      </div>
    );
  };

  const renderStarsMobile = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={12} className={`${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
        <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">({rating}/5)</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateMobile = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const Pagination = ({ pagination }) => {
    if (!pagination || pagination.total_pages <= 1) return null;
    const { current_page, total_pages, has_prev, has_next, total_count } = pagination;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
          <span>
            Showing {(current_page - 1) * pageSize + 1} to {Math.min(current_page * pageSize, total_count)} of {total_count} results
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(current_page - 1)}
            disabled={!has_prev}
            className="p-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {current_page} / {total_pages}
          </span>
          <button
            onClick={() => setCurrentPage(current_page + 1)}
            disabled={!has_next}
            className="p-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (!access_token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center max-w-sm w-full">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in as an admin to access this page.</p>
        </div>
      </div>
    );
  }

  const reviews = reviewsResponse?.reviews || [];
  const pagination = reviewsResponse?.pagination || {};

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 py-4">
          {/* Mobile View */}
          <div className="sm:hidden">
            {/* Top Row - Title and Back Button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1"></div>
              <div className="flex-1 flex justify-center">
                <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent text-center">
                  Reviews
                </h1>
              </div>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex items-center gap-1 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeft size={14} />
                </button>
              </div>
            </div>

            {/* Bottom Row - Filter Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center justify-center gap-1.5 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm w-full min-w-0"
              >
                <Filter size={14} />
                <span>Filters</span>
                {showFilter ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent truncate">
                  Reviews Management
                </h1>
                <p className="text-gray-600 mt-1 truncate">Manage and moderate course reviews</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  <Filter size={18} />
                  <span className="font-medium">Filters</span>
                  {showFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  <ArrowLeft size={18} />
                  <span className="font-medium">Back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilter ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
          >
            <div className="bg-lightGreen/10 rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Input */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by Review, User Name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen text-sm"
                    />
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="relative w-full">
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen appearance-none pr-8"
                    >
                      <option value="all">All Ratings</option>
                      <option value={1}>{">=1"}</option>
                      <option value={2}>{">=2"}</option>
                      <option value={3}>{">=3"}</option>
                      <option value={4}>{">=4"}</option>
                      <option value={5}>{">=5"}</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || ratingFilter !== "all") && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setRatingFilter("all");
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
      <div className="flex-1 overflow-hidden w-full">
        <div className="h-full overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <AdminLoader message="Loading reviews..." />
          ) : reviewsError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 mx-auto max-w-2xl">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-50 mr-2 flex-shrink-0" />
                <span className="text-red-700 dark:text-red-400 text-sm">
                  {reviewsError?.data?.error || reviewsError?.data?.message || "Failed to load reviews"}
                </span>
              </div>
            </div>
          ) : (
            <>
              {reviews.length === 0 ? (
                <div className="text-center py-12 max-w-sm mx-auto">
                  <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reviews found</h3>
                  <p className="text-gray-600 dark:text-gray-400">Try adjusting your search criteria</p>
                </div>
              ) : (
                <>
                  {/* Desktop Grid View */}
                  <div className="hidden sm:block">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence>
                        {reviews.map((review, index) => (
                          <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6 hover:shadow-md transition-shadow break-words"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-10 h-10 bg-forestGreen rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                  {review.user_full_name?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {review.user_full_name || "Unknown User"}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">@{review.username}</p>
                                </div>
                              </div>
                              <PermissionWrapper section="Reviews" action="delete">
                                <button
                                  onClick={() => {
                                    setReviewToDelete(review);
                                    setDeleteModalOpen(true);
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0 ml-2"
                                  title="Delete Review"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </PermissionWrapper>
                            </div>
                            {/* Course Title - Allow text wrapping */}
                            <div className="mb-3 p-3 bg-lightGreen/10 rounded-lg">
                              <div className="flex items-start text-sm text-forestGreen dark:text-lightGreen">
                                <BookOpen size={14} className="mr-2 flex-shrink-0 mt-0.5" />
                                <span className="font-medium break-words leading-relaxed">{review.course_title}</span>
                              </div>
                            </div>
                            <div className="mb-4">{renderStars(review.rating)}</div>
                            {review.review && (
                              <div className="mb-4">
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 break-words">
                                  {review.review}
                                </p>
                              </div>
                            )}
                            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <Calendar size={12} className="mr-2 flex-shrink-0" />
                                <span className="truncate">Created: {formatDate(review.created_at)}</span>
                              </div>
                              {review.updated_at !== review.created_at && (
                                <div className="flex items-center">
                                  <Calendar size={12} className="mr-2 flex-shrink-0" />
                                  <span className="truncate">Updated: {formatDate(review.updated_at)}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Mobile List View */}
                  <div className="sm:hidden space-y-4">
                    <AnimatePresence>
                      {reviews.map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition-shadow break-words w-full"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-forestGreen rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                {review.user_full_name?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                  {review.user_full_name || "Unknown User"}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{review.username}</p>
                              </div>
                            </div>
                            <PermissionWrapper section="Reviews" action="delete">
                              <button
                                onClick={() => {
                                  setReviewToDelete(review);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0 ml-2"
                                title="Delete Review"
                              >
                                <Trash2 size={14} />
                              </button>
                            </PermissionWrapper>
                          </div>

                          {/* Course Title - Allow text wrapping on mobile */}
                          <div className="mb-3 p-2 bg-lightGreen/10 rounded-lg">
                            <div className="flex items-start text-xs text-forestGreen dark:text-lightGreen">
                              <BookOpen size={12} className="mr-1 flex-shrink-0 mt-0.5" />
                              <span className="font-medium break-words leading-relaxed text-left">{review.course_title}</span>
                            </div>
                          </div>

                          <div className="mb-3">
                            {renderStarsMobile(review.rating)}
                          </div>

                          {review.review && (
                            <div className="mb-3">
                              <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed line-clamp-2 break-words">
                                {review.review}
                              </p>
                            </div>
                          )}

                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <Calendar size={10} className="mr-1 flex-shrink-0" />
                              <span className="text-xs truncate">{formatDateMobile(review.created_at)}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <Pagination pagination={pagination} />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && reviewToDelete && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Review</h3>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-forestGreen rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {reviewToDelete.user_full_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {reviewToDelete.user_full_name || "Unknown User"}
                    </p>
                    <div className="flex items-center">{renderStars(reviewToDelete.rating)}</div>
                  </div>
                </div>
                {/* Course Title in Modal - Allow text wrapping */}
                <div className="mb-3 p-2 bg-lightGreen/10 rounded-lg">
                  <div className="flex items-start text-sm text-forestGreen dark:text-lightGreen">
                    <BookOpen size={14} className="mr-2 flex-shrink-0 mt-0.5" />
                    <span className="font-medium break-words leading-relaxed">{reviewToDelete.course_title}</span>
                  </div>
                </div>
                {reviewToDelete.review && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">&quot;{reviewToDelete.review}&quot;</p>
                  </div>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete this review? This action cannot be undone.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <PermissionWrapper section="Reviews" action="delete">
                  <button
                    onClick={handleDeleteReview}
                    disabled={deleteLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center w-full sm:w-auto"
                  >
                    {deleteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} className="mr-2" />
                        Delete Review
                      </>
                    )}
                  </button>
                </PermissionWrapper>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reviews;