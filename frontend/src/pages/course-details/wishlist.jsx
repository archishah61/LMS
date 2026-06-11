/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Heart, ChevronRight, BookOpen, ShoppingCart, PlayCircle, Clock, User, ChevronLeft, ChevronUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGetWishlistByUserIdQuery } from "../../services/Course_Management/wishlistApi";
import { useGetCoursesQuery } from "../../services/Course_Management/courseApi";
import { useSelector } from "react-redux";
import { useRemoveFromWishlistMutation } from "../../services/Course_Management/wishlistApi";
import { getStudentToken } from "../../services/CookieService";
import { useGetCourseCategoriesQuery } from "../../services/Course_Management/courseCatagoryApi";
import { slugify } from "../../utils/slugify";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import PrimaryLoader from "../../components/ui/PrimaryLoader";

function Wishlist() {
  const navigate = useNavigate();
  const { id: reduxId } = useSelector((state) => state.user);
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const { access_token } = getStudentToken();

  let userId = reduxId;
  if (!userId && access_token) {
    try {
      const decoded = jwtDecode(access_token);
      userId = decoded.id;
    } catch (error) {
      console.error("Failed to decode token:", error);
    }
  }

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch wishlist data
  const {
    data: wishlistData,
    isLoading: isWishlistLoading,
    error: wishlistError,
  } = useGetWishlistByUserIdQuery(
    {
      user_id: userId,
      limit: itemsPerPage,
      offset: itemsPerPage !== "all" ? itemsPerPage * (currentPage - 1) : 0,
      access_token
    },
    {
      skip: !userId,
    }
  );

  // State to hold filtered wishlist courses
  const [wishlistCourses, setWishlistCourses] = useState([]);
  const { data: allCategories = [], error: categoriesError } =
    useGetCourseCategoriesQuery({ access_token });

  const getCategoryName = (id) => {
    return (
      allCategories?.find((cat) => `${cat.id}` === `${id}`)?.category ||
      "Professional"
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    if (wishlistData?.data?.length > 0) {
      setWishlistCourses(wishlistData?.data);
    } else if ((!wishlistData?.data || wishlistData.data.length === 0)) {
      setWishlistCourses([]);
    }
  }, [wishlistData]);

  const getThumbnailUrl = (course) => {
    if (course.thumbnail) {
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.thumbnail}`;
    }
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`
  };

  const handleRemoveFromWishlist = async (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!access_token) {
      alert("Authentication error. Please log in.");
      return;
    }

    try {
      await removeFromWishlist({
        course_id: courseId,
        user_id: userId,
        access_token,
      }).unwrap();
      toast.success("Removed from wishlist");
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to remove from wishlist';
      toast.error(errorMessage);
    }
  };

  if (isWishlistLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <PrimaryLoader />
      </div>
    );
  }

  if (wishlistError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-red-500">Failed to load wishlist. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-4 pb-4">
      <div className="container mx-auto">
        {/* Header Section as Individual Div */}
        <div className="w-full mx-auto rounded-2xl overflow-hidden shadow-sm mb-6">
          <div
            className="px-4 sm:px-6 md:px-8 py-6 md:py-8 relative bg-cover bg-center text-white"
            style={{ backgroundImage: "url('/assets/My_Profile_Heading_Background.png')" }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Your Wishlist <Heart className="inline ml-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white text-opacity-80" /></h1>
              </div>
              <p className="text-indigo-100 text-xs sm:text-sm md:text-base opacity-90 font-light max-w-xl">
                Courses and resources you've saved for later
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full mx-auto">
          {wishlistCourses.length === 0 ? (
            /* Empty State: Keep in a nice card if empty */
            <div className="border border-gray-100 rounded-2xl p-4 sm:p-6 md:p-8 bg-white shadow-sm flex flex-col items-center justify-center py-12 md:py-20 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-lightGreen/20 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 text-sm sm:text-base max-w-md mb-6 sm:mb-8 px-2">
                Save courses you're interested in by clicking the heart icon on any course card.
              </p>
              <button
                onClick={() => navigate("/courses")}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-white rounded-lg font-medium hover:bg-green-600 transition-colors shadow-sm flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                Explore Courses
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          ) : (
            <div>
              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-1 gap-3 sm:gap-0">
                <h3 className="text-lg font-bold text-gray-800">
                  Saved Items <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm ml-2">{wishlistCourses.length}</span>
                </h3>
                <button onClick={() => navigate("/courses")} className="text-black font-medium flex items-center text-sm gap-1 self-start sm:self-auto">
                  Explore Courses <ChevronRight size={16} />
                </button>
              </div>

              {/* Wishlist Items List - Each item is an individual card now */}
              <div className="flex flex-col gap-3 sm:gap-4">
                {wishlistCourses.map((item) => (
                  <div
                    key={item.course_id}
                    className="group relative flex flex-col md:flex-row gap-4 sm:gap-6 p-3 sm:p-4 rounded-xl border border-gray-100 bg-white shadow-sm"
                  >
                    {/* Thumbnail - Wider on mobile */}
                    <div className="w-full md:w-56 lg:w-64 flex-shrink-0">
                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
                        <img
                          src={getThumbnailUrl(item)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/assets/placeholder2.png";
                          }}
                        />
                        {/* Discount Badge on Image */}
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shadow-sm">
                            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="pr-10 sm:pr-12"> {/* Padding right for heart icon space */}
                        <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 line-clamp-1 sm:truncate">{item.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{getCategoryName(item.category_id)}</p>
                        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3" dangerouslySetInnerHTML={{ __html: item.description }} />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-auto gap-3 sm:gap-0">
                        {/* Price Section */}
                        <div className="flex gap-3 sm:gap-4 items-center">
                          {item.discount > 0 ? (
                            <>
                              <span className="text-lg sm:text-xl font-bold text-gray-900">
                                ₹
                                {Math.round(
                                  item.price - (item.price * item.discount) / 100
                                )}
                              </span>
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-xs sm:text-sm text-gray-400 line-through">
                                  ₹{item.price}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-primary">
                                  {item.discount}% OFF
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-lg sm:text-2xl font-bold text-gray-900">
                              ₹{item.price}
                            </span>
                          )}
                        </div>

                        {/* View Button */}
                        <button
                          onClick={() => navigate(`/course/${slugify(item.title)}`, { state: { public_hash: item.public_hash } })}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 text-primary border border-primary rounded-lg text-xs sm:text-sm font-medium hover:bg-lightGreen hover:bg-opacity-20 transition-colors w-fit"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Absolute Heart Icon */}
                    <button
                      className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors"
                      onClick={(e) => handleRemoveFromWishlist(e, item.course_id)}
                      title="Remove from wishlist"
                    >
                      <Heart size={18} className={true ? "text-red-500 fill-red-500 sm:w-5 sm:h-5" : "sm:w-5 sm:h-5"} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Pagination */}
      {wishlistData?.pagination?.totalCount > 10 && (
        <Pagination
          pagination={wishlistData?.pagination}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={itemsPerPage}
          setLimit={setItemsPerPage}
        />
      )}
    </div>
  );
}

// Pagination Component
function Pagination({ pagination, currentPage, setCurrentPage, limit, setLimit }) {
  const limitOptions = [10, 20, 50, 100, 500];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="mt-4 px-4 py-3 sm:px-6 border-t border-gray-200 bg-gray-50">
      {/* Mobile Pagination */}
      <div className="md:hidden">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-600 text-center">
              Page {currentPage} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Per page:</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when limit changes
                }}
                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
              >
                {limitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium"
            >
              <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            <div className="text-xs text-gray-500 text-center">
              {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, pagination.totalCount)} of {pagination.totalCount}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronUp size={14} className="sm:w-4 sm:h-4 rotate-90" />
            </button>
          </div>
        </div>
      </div>
      {/* Desktop Pagination */}
      <div className="hidden md:flex md:items-center md:justify-between">
        <div className="text-sm text-gray-700">
          Showing {(currentPage - 1) * limit + 1} to{" "}
          {Math.min(currentPage * limit, pagination.totalCount)} of{" "}
          {pagination.totalCount} results
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Courses per page:</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when limit changes
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Previous
          </button>
          {[...Array(pagination.totalPages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${currentPage === page
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default Wishlist;