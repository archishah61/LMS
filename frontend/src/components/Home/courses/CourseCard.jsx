/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Heart, Star, Clock, Book, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "./Button";
import {
  useAddToWishlistMutation,
  useGetWishlistByUserIdQuery,
  useRemoveFromWishlistMutation,
} from "../../../services/Course_Management/wishlistApi";
import { useGetReviewsByCourseIdQuery } from "../../../services/Reviews/reviewApi";
import { useSelector } from "react-redux";
import { getStudentToken } from "../../../services/CookieService";
import { useGetCourseCategoriesQuery } from "../../../services/Course_Management/courseCatagoryApi";
import { slugify } from "../../../utils/slugify";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const { id: userId } = useSelector((state) => state.user);
  const { access_token } = getStudentToken();

  // Only fetch wishlist if user is logged in
  const { data: wishlistData } = useGetWishlistByUserIdQuery(
    { user_id: userId, limit: 'all', access_token },
    {
      skip: !userId,
    }
  );

  // Initialize wishlistCourses with empty array if data is undefined
  const wishlistCourses =
    wishlistData?.data?.map((item) => item.course_id) || [];

  // Handle reviews data with error handling
  const { data: reviewsData, error: reviewsError } =
    useGetReviewsByCourseIdQuery(
      { courseId: course.public_hash, access_token },
      {
        skip: !course.public_hash,
      }
    );

  // Initialize reviews with empty array if data is undefined or there's an error
  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (
        reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
      ).toFixed(1)
      : 0;

  // Check if the course is in the wishlist
  const isCourseInWishlist = wishlistCourses.includes(course.id);

  useEffect(() => {
    setIsFavorite(isCourseInWishlist);
  }, [isCourseInWishlist]);

  const handleFavoriteClick = async (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!access_token) {
      toast.error("Please log in first.");
      navigate("/?login=true");
      return;
    }
    try {
      if (isFavorite) {
        await removeFromWishlist({
          course_id: courseId,
          user_id: userId,
          access_token,
        }).unwrap();
        setIsFavorite(false);
        toast.success("Course removed from wishlist.");
      } else {
        const wishlistData = { course_id: courseId, user_id: userId };
        await addToWishlist({
          wishlistData,
          access_token,
        }).unwrap();
        setIsFavorite(true);
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

  const handleBuyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/course/${slugify(course.title)}`, {
      state: { public_hash: course.public_hash }
    });
  };

  // Properly construct the thumbnail URL
  const getThumbnailUrl = () => {
    if (course.thumbnail) {
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.thumbnail}`;
    }
    return "/assets/placeholder2.png";
  };

  // category related code
  const { data: categories } = useGetCourseCategoriesQuery({
    access_token,
    status: "active",
    sort: "created_at"
  });

  const categoryData = categories?.find(cat => cat.id === course.category_id);

  // Function to strip HTML tags and truncate text
  const truncateDescription = (html, maxLength = 100) => {
    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, '');

    // Truncate to maxLength and add ellipsis if needed
    if (text.length > maxLength) {
      return text.substring(0, maxLength).trim() + '...';
    }
    return text;
  };

  return (
    <div
      className="group bg-white rounded-2xl p-3 sm:p-4 mx-auto flex flex-col shadow-sm border border-gray-100 transition-all duration-300 h-full w-full overflow-hidden"
    >
      {/* Course Image */}
      <div className="relative mb-[0.75rem] md:mb-[1rem] overflow-hidden rounded-[0.5rem] shrink-0">
        <img
          src={getThumbnailUrl()}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/assets/placeholder2.png";
          }}
          alt={course.title}
          className="w-full h-40 sm:h-48 object-cover"
        />
      </div>

      <div className="flex flex-col flex-1">
        {/* Title and Price Row */}
        <div className="flex justify-between items-center gap-2 mb-2 md:mb-3">
          <div className="min-w-0 flex-1">
            <h2
              className="text-sm sm:text-base font-bold text-gray-900 truncate"
              title={course.title}
            >
              {course.title}
            </h2>
            {course.partner_name && (
              <p className="text-xs text-gray-500 truncate mt-0.5" title={`Course by : ${course.partner_name}`}>
                Course by : {course.partner_name}
              </p>
            )}
          </div>
          {(() => {
            const price = parseFloat(course.price);
            const discount = course.discount ? parseInt(course.discount) : 0;
            const discountedPrice = discount > 0 ? price - (price * discount / 100) : price;

            if (discount > 0) {
              return (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end sm:items-center sm:gap-0">
                    <span className="text-[10px] sm:text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {discount}% OFF
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-400 line-through decoration-gray-400">
                      ₹{price.toFixed(2)}
                    </span>
                  </div>
                  <div className="shrink-0 border border-primary text-primary bg-white px-2 py-1.5 rounded text-xs sm:text-sm font-bold tracking-wide shadow-sm">
                    ₹{discountedPrice.toFixed(2)}
                  </div>
                </div>
              );
            }

            return (
              <div className="shrink-0 border border-primary text-primary bg-white px-2 py-1 rounded text-xs sm:text-sm font-bold tracking-wide shadow-sm">
                ₹{price.toFixed(2)}
              </div>
            );
          })()}
        </div>

        {/* Explore Button */}
        <button
          onClick={handleBuyClick}
          className="w-full bg-leafGreen text-white py-[0.375rem] rounded-[0.375rem] font-medium text-[0.75rem] sm:text-[0.875rem] mb-[0.5rem] md:mb-[0.75rem] transition-colors"
        >
          Explore More
        </button>

        {/* Description */}
        <p className="text-gray-600 text-[0.625rem] sm:text-[0.75rem] mb-[0.75rem] line-clamp-2 leading-relaxed">
          {truncateDescription(course.description || 'Simple, structured, and beginner-focused driver training.', 80)}
        </p>

        {/* Category Link */}
        <div className="flex items-center gap-[0.375rem] text-blue-500 text-[0.625rem] sm:text-[0.75rem] mb-auto border border-blue-200 rounded-full px-[0.5rem] py-[0.125rem] w-max transition-colors">
          <img src="/assets/share.png" alt="Share" className="w-[0.75rem] h-[0.75rem] object-contain" />
          <span className="truncate max-w-[7.5rem]">{categoryData?.category || "Driver Education Program"}</span>
        </div>

        {/* Footer: Duration and Wishlist */}
        <div className="flex items-center justify-between mt-auto pt-[0.5rem] border-t border-gray-50">
          <div className="flex items-center gap-[0.375rem] text-gray-600 text-[0.625rem] sm:text-[0.75rem]">
            <img src="/assets/player.png" alt="Duration" className="w-[1rem] h-[1rem] object-contain opacity-70" />
            <span>{(() => {
              if (!course.duration_minutes) return "20 hrs";
              const hrs = Math.floor(course.duration_minutes / 60);
              const mins = course.duration_minutes % 60;
              return mins === 0 ? `${hrs} hr` : `${hrs}h ${mins}m`;
            })()}</span>
          </div>

          <button
            onClick={(e) => handleFavoriteClick(e, course.id)}
            className={`transition-colors duration-300 p-[0.25rem]`}
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-[1rem] h-[1rem] sm:w-[1.25rem] sm:h-[1.25rem] transition-colors duration-300 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
                }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;