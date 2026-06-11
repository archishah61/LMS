/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Share2,
  BookmarkPlus,
  BookmarkCheck,
  Download,
  Clock,
  FileText,
  Key,
  Smartphone,
  PenTool,
  Award,
} from "lucide-react";
import EnrollmentModal from "../enrollment/EnrollmentModal";
import { useGetUserCourseQuery } from "../../services/Enrollment/enrollAPI";
import { toast } from "react-hot-toast";
import {
  useGetWishlistByUserIdQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from "../../services/Course_Management/wishlistApi";
import { useGetCourseByIdQuery } from "../../services/Course_Management/courseApi";
import { getStudentToken } from "../../services/CookieService";
import { slugify } from "../../utils/slugify";

import { useCreateEnrollmentMutation, useCreatePaymentMutation } from "../../services/Enrollment/enrollAPI"
import { useGetUserPointsByIdQuery, useUpdateUserPointsMutation } from "../../services/Challenge/userChallenge"
import RazorpayButton from "../razorpay/RazorpayButton"
import { useCheckIsPromoCodeVerifiedMutation, useVerifyPromoCodeMutation } from "../../services/promocode/promocodeApi";

export function EnrollmentCard({ course }) {
  const courseId = useLocation().state?.public_hash;
  // Promo code states
  const [promoCode, setPromoCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
  const [verifiedDiscount, setVerifiedDiscount] = useState(0);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const { id: userId } = useSelector((state) => state.user);
  const { access_token } = getStudentToken();

  const { data: enrolledCourse } = useGetUserCourseQuery(
    { userId, courseId, access_token },
    {
      skip: !userId || !courseId || !access_token,
    }
  );
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: wishlistData, isLoading } = useGetWishlistByUserIdQuery(
    { user_id: userId, limit: 'all', access_token },
    {
      skip: !userId,
    }
  );

  const [checkIsVerified, { isLoading: checkingVerification }] =
    useCheckIsPromoCodeVerifiedMutation();

  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [verifyPromo, { isLoading: isPromoLoading }] = useVerifyPromoCodeMutation();

  const { data: courseData } = useGetCourseByIdQuery({
    id: courseId,
    access_token,
  });
  const durationHours = courseData?.duration_minutes || "Self-paced";

  const wishlistCourses =
    wishlistData?.data?.map((item) => item.course_id) || [];

  const isCourseInWishlist = wishlistCourses.includes(course.id);

  useEffect(() => {
    setIsFavorite(isCourseInWishlist);
  }, [isCourseInWishlist]);

  useEffect(() => {
    const checkVerification = async () => {
      if (!userId || !course.id || !access_token) return;

      try {
        const res = await checkIsVerified({
          userId,
          courseId: course.id,
          access_token,
        }).unwrap();

        if (res?.isVerified) {
          setIsAlreadyVerified(true);
          setPromoSuccess(true);
          setVerifiedDiscount(res.discount);
          setDiscountAmount(res.discount);
        }
      } catch (err) {
        console.error("Promo check failed:", err);
      }
    };

    checkVerification();
  }, [userId, course.id, access_token]);


  const notifyWarn = (warning) => toast.error(warning);

  const handleFavoriteClick = async (e, courseId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error("Please log in to use the wishlist feature.");
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
        toast.error("Removed from wishlist!");
      } else {
        await addToWishlist({
          wishlistData: { course_id: courseId, user_id: userId },
          access_token,
        }).unwrap();
        setIsFavorite(true);
        toast.success("Added to wishlist!");
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error(error?.data?.error || "Something went wrong. Please try again.");
    }
  };

  const navigate = useNavigate();

  const getThumbnailUrl = () => {
    if (course.thumbnail) {
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.thumbnail}`;
    }
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`;
  };

  const handleGoToCourse = () => {
    navigate(`/course-content/${slugify(course.title)}`, {
      state: { courseID: enrolledCourse.userEnrollment.user_hash }
    });
  };

  const [byPoints, setByPoints] = useState(false)

  const { data: pointsData, isSuccess: isPointsSuccess } = useGetUserPointsByIdQuery(
    { access_token },
    {
      skip: !access_token,
    },
  )
  const userPoints = pointsData?.userPoints.points || 0

  const [createEnrollment] = useCreateEnrollmentMutation()
  const [createPayment] = useCreatePaymentMutation()
  const [updateUserPoints, { isLoading: isUpdating }] = useUpdateUserPointsMutation()


  const finalPrice = Number.parseFloat(course.price - (course.price * course.discount) / 100)
  const paymentAmount = finalPrice.toFixed(2)

  const hasSufficientPoints = userPoints >= course.points_to_enroll

  const handleEnroll = async (razorpayData = null, byPayment = false) => {
    if (!userId) {
      notifyWarn("Please log in to enroll in courses.");
      return;
    }

    try {
      const isPromoEnrollment = promoSuccess || isAlreadyVerified;

      const enrollmentData = {
        courseId: course.public_hash,
        userId,
        isEnrolledByPromoCode: isPromoEnrollment ? true : false,
      };

      const enrollmentResponse = await createEnrollment({
        enrollment: enrollmentData,
        access_token: { access_token: access_token },
      }).unwrap();

      // 🔥 If PROMO enrollment → no payment entry
      if (!isPromoEnrollment && !byPoints && byPayment) {
        const paymentData = {
          enrollment_id: enrollmentResponse?.data[0].id,
          payment_method: razorpayData?.method,
          amount: razorpayData?.amount / 100,
          currency: razorpayData?.currency,
          userId,
          transactionId: razorpayData?.id,
          reference_id: razorpayData?.order_id,
          payment_gateway: "razorpay",
          gateway_response: razorpayData,
          status: razorpayData?.captured ? "completed" : "failed",
        };

        await createPayment({
          payment: paymentData,
          access_token: { access_token: access_token },
        }).unwrap();

        // Reward Points (only for purchased)
        if (course.is_points_rewarded && course.points_rewarded > 0) {
          await updateUserPoints({
            data: {
              points: course.points_rewarded,
              is_add: true,
              source: "course_enroll",
              message: `Enrolled Course ${course.title}`,
            },
            access_token,
          }).unwrap();
        }
      }

      toast.success("Enrollment Successful! Redirecting to course content...");
      navigate(`/course/${slugify(course.title)}/faq-response`, {
        state: {
          course_id: course.public_hash,
          user_id: userId,
          access_token: access_token,
        },
      });

    } catch (error) {
      console.error("Enrollment or payment failed:", error);
      toast.error(error.data?.message || error?.data?.error || "Enrollment failed. Please try again.");
    }
  };


  const handleRazorpayPayment = async (response) => {
    if (response.success) {
      await handleEnroll(response.data, true)
    } else {
      toast.error("Razorpay payment failed or was cancelled.")
    }
  }

  const handleEnrollGeneratedCourse = async () => {
    try {
      await handleEnroll()
    } catch (error) {
      toast.error(error.data?.message || "Failed to Enroll. Please try again.")
    }
  }

  const handleGoToPartner = async () => {
    navigate(`/become-partner/register`);
  }

  const completeEnrollByPoints = async () => {
    if (!userId) {
      notifyWarn("Please log in to enroll in courses.")
      return
    }

    if (hasSufficientPoints) {
      setByPoints(true)
      try {
        await updateUserPoints({
          data: {
            points: course.points_to_enroll,
            is_add: false,
            source: "course_enroll",
            message: `Enrolled Course ${course.title}`,
          },
          access_token,
        }).unwrap()
        await handleEnroll()
      } catch (error) {
        console.error("Points deduction failed:", error)
        toast.error(error.data?.message || error?.data?.error || "Failed to deduct points. Please try again.")
        setByPoints(false)
      }
    } else {
      toast.error("Insufficient tokens!!")
    }
  }

  const verifyPromoCode = async () => {
    if (!promoCode || promoCode.length !== 7) {
      setPromoError("Promo code must be 6 characters.");
      return;
    }

    setPromoError("");
    setIsVerifying(true);

    try {
      const response = await verifyPromo({
        user_id: userId,
        course_id: course.id,
        code: promoCode,
        access_token,
      }).unwrap();

      if (response?.success) {
        setPromoSuccess(true);
        setDiscountAmount(response.discount);
        toast.success("Promo code applied successfully!");
      } else {
        setPromoError(response?.message || "Invalid promo code.");
      }

    } catch (error) {
      console.error("Promo Error:", error);
      setPromoError(error?.data?.message || "Something went wrong.");
    } finally {
      setIsVerifying(false);
    }
  };


  const courseIncludes = [
    {
      icon: Clock,
      text: `        ${Math.floor(course.duration_minutes / 60)} hr ${course.duration_minutes % 60} mins hours on-demand video`,
      color: "indigo",
    },
    { icon: Smartphone, text: "Access on mobile and TV", color: "purple" },
    { icon: PenTool, text: "Assignments", color: "indigo" },
  ];

  const isEnrolled = enrolledCourse && enrolledCourse.userEnrollment;

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 lg:p-6">
        {/* Mobile-optimized thumbnail */}
        <div className="rounded-xl overflow-hidden shadow-md">
          <img
            className="w-full aspect-[16/9] object-cover transform hover:scale-105 transition-transform duration-300"
            src={getThumbnailUrl()}
            alt={course.title}
          />
        </div>

        {/* Mobile-optimized title */}
        <div className="mt-4 lg:mt-6">
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight truncate max-w-[400px]">
            {course.title}
          </h1>
        </div>

        {course.generated_by != userId && (
          <div className="text-2xl lg:text-3xl font-bold text-gray-900 mt-3 lg:mt-4 flex items-baseline">
            {course.discount !== null && course.discount > 0 ? (
              <>
                {!promoSuccess && !isAlreadyVerified ? (
                  <>
                    <span className="text-gray-500 line-through font-medium text-sm lg:text-base">
                      ₹{parseFloat(course.price).toFixed(2)}
                    </span>

                    <span className="ml-2 text-indigo-600 font-bold">
                      ₹
                      {parseFloat(
                        course.price - (course.price * course.discount) / 100
                      ).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500 font-medium text-sm lg:text-base">
                    promo code is verified
                  </span>
                )}

              </>
            ) : (
              <span className="text-indigo-600 font-bold">
                ₹{parseFloat(course.price).toFixed(2)}
              </span>
            )}
          </div>
        )}

        {/* Promo Code Section */}
        {!promoSuccess && !isAlreadyVerified && (
          <div className="mt-4 lg:mt-6 border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-700">
              Apply Promo Code
            </label>

            <div className="flex gap-2 mt-2 w-full">
              <input
                type="text"
                maxLength={7}
                value={promoCode.toUpperCase()}
                onChange={(e) => setPromoCode(e.target.value)}
                className="min-w-0 flex-1 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Enter 6-letter code"
              />

              <button
                onClick={verifyPromoCode}
                disabled={isVerifying}
                className={`px-4 py-2 rounded-lg text-sm font-medium shadow-md text-white transition
        ${isVerifying ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}
      `}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>

            {promoError && (
              <p className="text-red-500 text-xs mt-2">{promoError}</p>
            )}

            {promoSuccess && (
              <p className="text-green-600 text-xs mt-2">
                Promo applied! You saved ₹{discountAmount}
              </p>
            )}
          </div>
        )}

        {/* Mobile-optimized buttons */}
        {isEnrolled ? (
          <>
            <button
              className="w-full mt-4 lg:mt-6 bg-gray-200 text-gray-600 py-3 px-4 rounded-lg font-medium text-center hover:bg-gray-300 transition text-sm lg:text-base"
              onClick={handleGoToCourse}
            >
              Go to My Course
            </button>
            {course.generated_by == userId && course.status == "private" && (
              <button
                className="w-full mt-3 lg:mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-medium text-center shadow-md hover:from-blue-600 hover:to-indigo-600 transition text-sm lg:text-base"
                onClick={handleGoToPartner}
              >
                Become a Partner to Publish
              </button>
            )}
          </>
        ) : course.generated_by == userId ? (
          <>
            <button
              className="w-full mt-4 lg:mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-medium text-center shadow-md hover:from-blue-600 hover:to-indigo-600 transition text-sm lg:text-base"
              onClick={handleEnrollGeneratedCourse}
            >
              Start My Course
            </button>
            <button
              className="w-full mt-3 lg:mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-medium text-center shadow-md hover:from-blue-600 hover:to-indigo-600 transition text-sm lg:text-base"
              onClick={handleGoToPartner}
            >
              Become a Partner to Publish
            </button>
          </>
        ) : (
          <>
            <div className="mt-4 lg:mt-6">
              <div className={`flex gap-2 lg:gap-3 ${course.is_points_enrollable === 1 ? 'flex-col lg:flex-row' : 'flex-col'}`}>

                {/* ---- PAYMENT / FREE ENROLL BUTTON ---- */}
                <div className={course.is_points_enrollable === 1 ? 'w-full lg:flex-1' : 'w-full'}>

                  {/* If verified → DIRECT ENROLL */}
                  {promoSuccess || isAlreadyVerified ? (
                    <button
                      onClick={async () => {
                        setEnrollLoading(true);
                        await new Promise((res) => setTimeout(res, 2000)); // ⏳ 2s loader
                        await handleEnroll(null);
                        setEnrollLoading(false);
                      }}
                      disabled={enrollLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-sm lg:text-base shadow-md transition-all 
      ${enrollLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} text-white`}
                    >
                      {enrollLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        "Enroll Now – FREE"
                      )}
                    </button>
                  ) : (
                    <RazorpayButton
                      onResult={handleRazorpayPayment}
                      amount={paymentAmount}
                      buttonText={`Enroll Now - Pay ₹${paymentAmount}`}
                      className="w-full text-sm lg:text-base"
                    />
                  )}


                </div>

                {/* ---- POINTS ENROLL SECTION ---- */}
                {course.is_points_enrollable === 1 && (
                  <div className="w-full lg:flex-1">
                    <button
                      className={`w-full py-3 px-4 rounded-lg font-medium text-center transition-all duration-300 shadow-md text-sm lg:text-base ${hasSufficientPoints
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transform hover:translate-y-0.5"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      onClick={completeEnrollByPoints}
                      disabled={!hasSufficientPoints || isUpdating}
                    >
                      {isUpdating ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        `Enroll with ${course.points_to_enroll} Points`
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Mobile-optimized action buttons */}
        <div className="mt-4 lg:mt-6 flex items-center justify-around">
          <button
            className="flex flex-col items-center text-xs lg:text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-300 group"
            onClick={() => {
              const courseUrl = `${window.location.origin}/course/${course.public_hash}`;

              if (navigator.share) {
                navigator
                  .share({
                    title: course.title,
                    text: "Check out this course!",
                    url: courseUrl,
                  })
                  .then(() => toast.success("Shared successfully!"))
                  .catch((error) => console.error("Sharing failed:", error));
              } else {
                navigator.clipboard
                  .writeText(courseUrl)
                  .then(() => toast.success("Link copied to clipboard!"))
                  .catch((error) => toast.error("Failed to copy link."));
              }
            }}
          >
            <div className="p-2 rounded-full bg-gray-100 group-hover:bg-indigo-100 transition-colors duration-300">
              <Share2 className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors duration-300" />
            </div>
            <span className="mt-1">Share</span>
          </button>

          <button
            className="flex flex-col items-center text-xs lg:text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-300 group"
            onClick={(e) => handleFavoriteClick(e, course.id)}
          >
            <div className="p-2 rounded-full bg-gray-100 group-hover:bg-indigo-100 transition-colors duration-300">
              {isFavorite ? (
                <BookmarkCheck className="w-4 h-4 text-indigo-600" />
              ) : (
                <BookmarkPlus className="w-4 h-4 text-gray-500 group-hover:text-indigo-600 transition-colors duration-300" />
              )}
            </div>
            <span className="mt-1">
              {isFavorite ? "Wishlisted" : "Wishlist"}
            </span>
          </button>
        </div>

        {/* Mobile-optimized course includes section */}
        <div className="mt-6 lg:mt-8">
          <h2 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 lg:mb-4">
            This Course Includes
          </h2>
          <ul className="mt-3 lg:mt-4 space-y-3 lg:space-y-4">
            {courseIncludes.map((item, index) => (
              <li key={index} className="flex items-center text-gray-700 group">
                <div
                  className={`w-7 h-7 lg:w-8 lg:h-8 mr-3 flex items-center justify-center rounded-full transition-all duration-300 bg-${item.color}-100 group-hover:bg-${item.color}-200`}
                >
                  <item.icon className={`w-3 h-3 lg:w-4 lg:h-4 text-${item.color}-600`} />
                </div>
                <span className="text-sm lg:text-base group-hover:text-indigo-600 transition-colors duration-300 leading-tight">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}