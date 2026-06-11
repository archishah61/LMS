/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from "react";
import { useGetUserCoursesQuery } from "../../services/Enrollment/enrollAPI";
import {
  useAddToWishlistMutation,
  useGetWishlistByUserIdQuery,
  useRemoveFromWishlistMutation,
} from "../../services/Course_Management/wishlistApi";

import { Star, ArrowRight, Sparkles, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getStudentToken } from "../../services/CookieService";
import { useGetCourseCategoriesQuery } from "../../services/Course_Management/courseCatagoryApi";
import { toast } from "react-hot-toast";
import { slugify } from "../../utils/slugify";
import { useAuthModal } from "../../context/AuthModalContext";
import PrimaryLoader from "../ui/PrimaryLoader";

const RecommendedCourses = ({ userId, allCourses }) => {
  const navigate = useNavigate();
  const { access_token } = getStudentToken();

  // Fetch enrolled courses
  const { data: enrolledCourses, isLoading } = useGetUserCoursesQuery(
    { userId },
    { skip: !userId }
  );

  const { data: allCategories = [] } = useGetCourseCategoriesQuery({ access_token });

  // Fetch wishlist courses
  const { data: wishlistData } = useGetWishlistByUserIdQuery(
    { user_id: userId, limit: 'all', access_token },
    { skip: !userId }
  );

  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const wishlistCourses = wishlistData?.data?.map((item) => item.course_id) || [];

  const handleFavoriteClick = async (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!access_token) {
      toast.error("Please log in first.");
      navigate("/?login=true");
      return;
    }
    const isFavorite = wishlistCourses.includes(courseId);
    try {
      if (isFavorite) {
        await removeFromWishlist({
          course_id: courseId,
          user_id: userId,
          access_token,
        }).unwrap();
        toast.success("Course removed from wishlist.");
      } else {
        const wishlistData = { course_id: courseId, user_id: userId };
        await addToWishlist({
          wishlistData,
          access_token,
        }).unwrap();
        toast.success("Course added to wishlist!");
      }
    } catch (error) {
      if (error.status === 401) {
        toast.error("Please log in first.");
        navigate("/?login=true");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  if (isLoading) {
    return <PrimaryLoader />;
  }

  const enrolledCourseIds = new Set(
    enrolledCourses?.courses?.map((enrolled) => enrolled.course.id) || []
  );

  const recommendedCourses = allCourses
    .filter(
      (course) =>
        !enrolledCourseIds.has(course.id) && course.status === "published"
    )
    .slice(0, 3);

  const getCategoryName = (id) => {
    return allCategories?.find((cat) => `${cat.id}` === `${id}`)?.category || "Professional Certification";
  };

  return (
    <div className="relative">
      {recommendedCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {recommendedCourses.map((course) => {
            const totalReviews = course.review_count || 0;
            const averageRating = totalReviews > 0
              ? parseFloat(course.average_rating).toFixed(1)
              : "4.8"; // Default mock rating for visual match if none exists

            return (
              <div
                key={course.id}
                className="flex flex-col bg-white border border-gray-200 rounded-2xl p-3 sm:p-4"
              >
                {/* Image Section */}
                <div className="relative h-36 xs:h-40 sm:h-44 md:h-48 lg:h-48 w-full rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 bg-gray-100">
                  <img
                    src={course.thumbnail ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.thumbnail}` : "/assets/placeholder2.png"}
                    alt={course.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = "/assets/placeholder2.png"; }}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content Section */}
                <div className="flex flex-col flex-1 px-0.5 sm:px-1">
                  {/* Title */}
                  <h3 className="text-base xs:text-lg sm:text-lg lg:text-lg font-bold text-gray-900 leading-tight mb-1 xs:mb-1.5 sm:mb-1.5 lg:mb-1.5 line-clamp-1">
                    {course.title}
                  </h3>

                  {/* Meta Row */}
                  <div className="mb-4 xs:mb-5 sm:mb-6 lg:mb-6 flex items-center gap-2 flex-wrap text-xs">
                    <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] xs:text-xs sm:text-xs lg:text-xs font-medium text-emerald-700 leading-none">
                      {getCategoryName(course.category_id)}
                    </span>

                    {totalReviews > 0 && (
                      <>
                        <div className="flex items-center gap-0.5 px-2 py-1.5 border border-amber-200 rounded text-[10px] font-semibold text-amber-600 bg-amber-50 leading-none">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {averageRating}
                        </div>

                        <div className="px-2 py-1.5 border border-gray-200 rounded text-[10px] font-medium text-gray-500 whitespace-nowrap bg-white leading-none">
                          {`${totalReviews.toLocaleString()}+ ratings`}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Enroll Link */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <Link
                      to={{ pathname: `/course/${slugify(course.title)}` }}
                      state={{ public_hash: course.public_hash }}
                      className="inline-flex items-center gap-1 xs:gap-1.5 sm:gap-1.5 lg:gap-1.5 text-emerald-600 font-semibold text-xs xs:text-sm sm:text-sm lg:text-sm"
                    >
                      Enroll Now
                      <ArrowRight size={14} xs:size={16} sm:size={16} lg:size={16} />
                    </Link>

                    <button
                      onClick={(e) => handleFavoriteClick(e, course.id)}
                      className="p-[0.25rem]"
                      aria-label="Add to wishlist"
                    >
                      <Heart
                        className={`w-[1rem] h-[1rem] sm:w-[1.25rem] sm:h-[1.25rem] ${wishlistCourses.includes(course?.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl p-5 xs:p-6 sm:p-7 md:p-8 border border-slate-200 text-center">
          <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 xs:mb-4 sm:mb-4 border border-emerald-200 bg-emerald-50">
            <Sparkles className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-emerald-500" />
          </div>
          <h3 className="text-base xs:text-lg sm:text-lg lg:text-lg font-bold text-gray-900 mb-1.5 xs:mb-2 sm:mb-2">
            You're all caught up!
          </h3>
          <p className="text-xs xs:text-sm sm:text-base lg:text-base text-gray-500">
            You've enrolled in all our top recommended courses.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendedCourses;