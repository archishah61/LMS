/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { StarRating } from "../../components/course-details/StarRating";
import { Helmet } from "react-helmet-async";
import { ModuleAccordion } from "../../components/course-details/ModuleAccordion";

import { StudentReviews } from "../../components/course-details/StudentReviews";
import { Clock, Users, CheckCircle, ChevronDown, ChevronUp, Play, Award, BarChart, Globe, Layout, Server, Cloud, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetCourseByIdQuery } from "../../services/Course_Management/courseApi";
import { useGetModulesByCourseIdQuery } from "../../services/Course_Management/moduleApi";
import { useGetReviewsByCourseIdQuery } from "../../services/Reviews/reviewApi";
import { useGetEnrollmentsQuery, useGetUserCourseQuery } from "../../services/Enrollment/enrollAPI";
import { getStudentToken } from "../../services/CookieService";
import { useGetSessionsByCourseIdQuery } from "../../services/Course_Management/sessionApi";
import { SessionAccordion } from "../../components/course-details/SessionAccordion";
import { toast } from "react-hot-toast";
import { useCheckIsPromoCodeVerifiedMutation, useVerifyPromoCodeMutation } from "../../services/promocode/promocodeApi";
import { useGetUserPointsByIdQuery, useUpdateUserPointsMutation } from "../../services/Challenge/userChallenge";
import { useCreateEnrollmentMutation, useCreatePaymentMutation } from "../../services/Enrollment/enrollAPI";
import RazorpayButton from "../../components/razorpay/RazorpayButton";
import { slugify } from "../../utils/slugify";
import { formatDuration } from "../../utils/timeFormatting";
import FAQ from "../../components/Home/LandingPage/FAQ";
import { useLazyGetCourseFAQsByCourseIdQuery } from "../../services/Course_Management/courseFAQApi";
import { useGetFAQOptionsByFAQIdsQuery } from "../../services/Course_Management/courseFAQOptionApi";
import { useCreateStudentFAQResponseMutation } from "../../services/Student_Management/studentFAQResponseApi";
import PrimaryLoader from "../../components/ui/PrimaryLoader";
import RewardPopup from "../../components/modal/RewardPopup";

function CourseDetails() {
  const courseId = useLocation().state?.public_hash || useParams().courseSlug;
  const navigate = useNavigate();
  const { id: userId } = useSelector((state) => state.user);

  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [reviewsToShow, setReviewsToShow] = useState(3);
  const [imageFit, setImageFit] = useState("cover");
  const [openSessionId, setOpenSessionId] = useState(null);
  const [openModuleBySession, setOpenModuleBySession] = useState({});
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);


  // Promo & Enrollment State
  const [promoCode, setPromoCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
  const [verifiedDiscount, setVerifiedDiscount] = useState(0);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [byPoints, setByPoints] = useState(false);

  // FAQ Modal State
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [faqList, setFaqList] = useState([]);
  const [currentFaqIndex, setCurrentFaqIndex] = useState(0);
  const [selectedFaqOption, setSelectedFaqOption] = useState(null);
  const [isFaqSubmitting, setIsFaqSubmitting] = useState(false);
  const [faqOptionsMap, setFaqOptionsMap] = useState({});

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 200);
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToReviews) {
      setTimeout(() => {
        const reviewsSection = document.getElementById("reviews");
        if (reviewsSection) {
          reviewsSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 500); // Small delay to ensure content loads
    }
  }, [location]);

  const { access_token } = getStudentToken();

  const [checkIsVerified] = useCheckIsPromoCodeVerifiedMutation();
  const [verifyPromo] = useVerifyPromoCodeMutation();
  const [createEnrollment] = useCreateEnrollmentMutation();
  const [createPayment] = useCreatePaymentMutation();
  const [updateUserPoints, { isLoading: isUpdating }] = useUpdateUserPointsMutation();
  const [createStudentFAQResponse] = useCreateStudentFAQResponseMutation();

  const { data: pointsData } = useGetUserPointsByIdQuery(
    { access_token },
    { skip: !access_token }
  );
  const userPoints = pointsData?.userPoints.points || 0;

  const {
    data: courseData,
    isLoading,
    isError,
    error: getCourseError
  } = useGetCourseByIdQuery({ id: courseId, access_token });

  const { data: moduleData } = useGetModulesByCourseIdQuery({
    id: courseId,
    access_token,
  });
  const { data: sessionData } = useGetSessionsByCourseIdQuery({
    courseId,
    access_token,
  });

  const { data: enrolledCourse } = useGetUserCourseQuery(
    { userId, courseId, access_token },
    {
      skip: !userId || !courseId || !access_token,
    }
  );

  const [triggerFaqFetch, { isFetching: isFaqFetching }] = useLazyGetCourseFAQsByCourseIdQuery();

  const faqIds = faqList?.map(faq => faq.id) || [];

  const { data: faqOptionsData } = useGetFAQOptionsByFAQIdsQuery(
    { faq_ids: faqIds, access_token },
    { skip: faqIds.length === 0 }
  );

  useEffect(() => {
    if (faqOptionsData) {
      const mappedOptions = {};
      faqOptionsData.forEach((option) => {
        if (!mappedOptions[option.faq_id]) mappedOptions[option.faq_id] = [];
        mappedOptions[option.faq_id].push(option);
      });
      setFaqOptionsMap(mappedOptions);
    }
  }, [faqOptionsData]);

  const isEnrolled = enrolledCourse && enrolledCourse.userEnrollment;

  const notifyWarn = (warning) => toast.error(warning);

  // Check if promo is already verified
  useEffect(() => {
    const checkVerification = async () => {
      if (!userId || !courseData?.id || !access_token) return;
      try {
        const res = await checkIsVerified({
          userId,
          courseId: courseData.id,
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
    if (courseData) checkVerification();
  }, [userId, courseData?.id, access_token]);

  const verifyPromoCode = async () => {
    if (!promoCode || promoCode.length !== 7) {
      setPromoError("Promo code must be 7 characters.");
      return;
    }
    setPromoError("");
    setIsVerifying(true);
    try {
      const response = await verifyPromo({
        user_id: userId,
        course_id: courseData.id,
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

  const handlePostEnrollmentFlow = async () => {
    // Attempt to fetch FAQs
    try {
      const result = await triggerFaqFetch({
        course_id: courseData.public_hash,
        access_token
      }).unwrap();

      if (result && result.length > 0) {
        setFaqList(result);
        setShowFaqModal(true);
      }
      else {
        navigate("/student-dashboard");
      }
    } catch (err) {
      console.error("Failed to fetch FAQs post-enrollment", err);
      window.location.reload();
    }
  };

  const handleGoToPartner = () => {
    navigate(`/become-partner/register`);
  };

  const handleEnroll = async (razorpayData = null, byPayment = false) => {
    if (!userId) {
      notifyWarn("Please log in to enroll in courses.");
      return;
    }
    try {
      const isPromoEnrollment = promoSuccess || isAlreadyVerified;
      const enrollmentDataPayload = {
        courseId: courseData.public_hash,
        userId,
        isEnrolledByPromoCode: isPromoEnrollment ? true : false,
      };

      const enrollmentResponse = await createEnrollment({
        enrollment: enrollmentDataPayload,
        access_token: { access_token: access_token },
      }).unwrap();

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

        if (courseData.is_points_rewarded && courseData.points_rewarded > 0) {
          await updateUserPoints({
            data: {
              points: courseData.points_rewarded,
              is_add: true,
              source: "course_enroll",
              message: `Enrolled Course ${courseData.title}`,
            },
            access_token,
          }).unwrap();
        }
      }

      toast.success("Enrollment Successful!");

      // Check for rewards
      if (!isPromoEnrollment && !byPoints && byPayment && courseData.is_points_rewarded && courseData.points_rewarded > 0) {
        setRewardPoints(courseData.points_rewarded);
        setShowRewardPopup(true);
        // Flow will continue in handlePostEnrollmentFlow when popup closes
        return;
      }

      // If no reward, proceed directly
      await handlePostEnrollmentFlow();

    } catch (error) {
      console.error("Enrollment failed:", error);
      toast.error(error.data?.message || "Enrollment failed.");
    }
  };

  const hasSufficientPoints = userPoints >= (courseData?.points_to_enroll || 0);

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
            points: courseData.points_to_enroll,
            is_add: false,
            source: "course_enroll",
            message: `Enrolled Course ${courseData.title}`,
          },
          access_token,
        }).unwrap()
        await handleEnroll()
      } catch (error) {
        console.error("Points deduction failed:", error)
        toast.error("Failed to deduct points.")
        setByPoints(false)
      }
    } else {
      toast.error("Insufficient tokens!!")
    }
  }

  const handleRazorpayPayment = async (response) => {
    if (response.success) {
      await handleEnroll(response.data, true)
    } else {
      toast.error("Razorpay payment failed or was cancelled.")
    }
  }

  const activeSessionIds =
    sessionData?.sessions
      ?.filter((s) => s.status === "active")
      .map((s) => s.id) || [];

  const filteredModules =
    moduleData?.modules?.filter((mod) =>
      activeSessionIds.includes(mod.session_id)
    ) || [];

  const { data: reviewsData } = useGetReviewsByCourseIdQuery({
    courseId,
    access_token,
  });
  const { data: enrollmentData } = useGetEnrollmentsQuery({ access_token });

  useEffect(() => {
    if (!courseData) return;
    if (!courseData.preview_video) {
      setIsVideoLoading(false);
      setImageFit('cover');
      return;
    }
    setIsVideoLoading(true);
    setImageFit('cover');
  }, [courseData?.preview_video]);

  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.pagination?.total_count || 0;
  const averageRating = reviewsData?.pagination?.average_rating || 0;

  const totalEnrollmentsForCourse = Array.isArray(enrollmentData)
    ? enrollmentData.filter(
      (enrollment) => enrollment.course_id === courseData?.id
    ).length
    : 0;

  const groupModulesBySession = () => {
    const sessionsMap = new Map();

    filteredModules.forEach((module) => {
      const sessionId = module.session_id;
      if (!sessionsMap.has(sessionId)) {
        const session = sessionData?.sessions?.find((s) => s.id === sessionId);
        const sessionName = session?.name || session?.title || module.title;
        sessionsMap.set(sessionId, {
          session: { id: sessionId, name: sessionName, totalDuration: session?.min_time_in_minute || 0 },
          modules: [],
        });
      }
      sessionsMap.get(sessionId).modules.push(module);
    });

    return Array.from(sessionsMap.values());
  };

  // Function to get full URLs for images
  const getFullUrl = (path) => {
    if (!path) return null;
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${path}`;
  };

  const groupedSessions = groupModulesBySession();

  const hasSetDefaultOpen = React.useRef(false);

  // Reset default open flag when course changes
  useEffect(() => {
    hasSetDefaultOpen.current = false;
  }, [courseId]);

  // Set default open session and module logic
  useEffect(() => {
    if (groupedSessions.length > 0 && !hasSetDefaultOpen.current) {
      const firstSession = groupedSessions[0];
      setOpenSessionId(firstSession.session.id);
      hasSetDefaultOpen.current = true;

      if (firstSession.modules.length > 0) {
        setOpenModuleBySession(prev => ({
          ...prev,
          [firstSession.session.id]: firstSession.modules[0].id
        }));
      }
    }
  }, [groupedSessions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PrimaryLoader />
      </div>
    );
  }

  if (isError || !courseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center text-sm sm:text-base md:text-lg font-bold text-red-500 mt-10">
          {isError && getCourseError?.data?.message ? getCourseError?.data?.message : "Error loading course details."}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 sm:px-6 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all text-xs sm:text-sm md:text-base"
        >
          Try Again
        </button>
      </div>
    );
  }

  const getPreviewMedia = () => {
    let paths = courseData?.preview_video;
    if (!paths) return [];

    // Parse if stringified JSON
    if (typeof paths === 'string') {
      try {
        if (paths.startsWith('[')) {
          paths = JSON.parse(paths);
        } else {
          paths = [paths];
        }
      } catch (e) {
        paths = [paths];
      }
    }

    if (!Array.isArray(paths)) {
      paths = [paths];
    }

    return paths.map(path => {
      if (typeof path !== 'string') return { url: null, type: null };
      const url = `${import.meta.env.VITE_BACKEND_MEDIA_URL}${path}`;
      if (path.includes('/course/preview_image/')) {
        return { url, type: 'image' };
      }
      const lower = path.toLowerCase();
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
      const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.avi'];
      if (imageExts.some(ext => lower.endsWith(ext))) return { url, type: 'image' };
      if (videoExts.some(ext => lower.endsWith(ext))) return { url, type: 'video' };
      return { url, type: 'video' };
    }).filter(m => m.url);
  };

  const mediaList = getPreviewMedia();
  const media = mediaList.length > 0 ? mediaList[currentMediaIndex] : { url: null, type: null };

  // Calculate final price for sticky header
  const finalPrice = courseData.discount !== null && courseData.discount > 0
    ? parseFloat(courseData.price - (courseData.price * courseData.discount) / 100).toFixed(2)
    : parseFloat(courseData.price).toFixed(2);

  const handleGoToCourse = () => {
    navigate(`/course-content/${slugify(courseData.title)}`, {
      state: { courseID: enrolledCourse.userEnrollment.user_hash }
    });
  };

  // FAQ Handlers
  const handleNextFaq = async () => {
    if (!selectedFaqOption) {
      toast.error("Please select an option before proceeding.");
      return;
    }

    const currentFAQId = faqList[currentFaqIndex].id;
    setIsFaqSubmitting(true);

    // Fetch fresh token to ensure it's not stale
    const { access_token: freshToken } = getStudentToken();

    try {
      await createStudentFAQResponse({
        user_id: userId,
        course_id: courseData.public_hash,
        faq_id: currentFAQId,
        selected_option_id: selectedFaqOption,
        created_by: userId,
        access_token: freshToken
      }).unwrap();

      if (currentFaqIndex + 1 >= faqList.length) {
        toast.success("All questions answered!");
        setShowFaqModal(false);
        navigate("/student-dashboard");
      } else {
        setCurrentFaqIndex((prev) => prev + 1);
        setSelectedFaqOption(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save response.");
    } finally {
      setIsFaqSubmitting(false);
    }
  };

  const handleSkipFaq = () => {
    if (currentFaqIndex + 1 < faqList.length) {
      setCurrentFaqIndex((prev) => prev + 1);
      setSelectedFaqOption(null);
    } else {
      setShowFaqModal(false);
      navigate("/student-dashboard");
    }
  };

  const handleSkipAllFaq = () => {
    toast("Skipped all questions.");
    setShowFaqModal(false);
    navigate("/student-dashboard");
  };

  return (
    <div className="min-h-screen">
      {/* Helmet component for SEO */}
      <Helmet>
        <title>{courseData?.meta_title || courseData?.title}</title>
        <meta name="description" content={courseData?.meta_description || courseData?.description?.replace(/<[^>]*>/g, '').substring(0, 160)} />
        <meta name="keywords" content={courseData?.meta_keyword} />
        <link rel="canonical" href={courseData?.seo_canonical} />

        {/* Open Graph tags */}
        <meta property="og:title" content={courseData?.og_title || courseData?.meta_title || courseData?.title} />
        <meta property="og:description" content={courseData?.og_description || courseData?.meta_description || courseData?.description?.replace(/<[^>]*>/g, '').substring(0, 160)} />
        <meta property="og:image" content={getFullUrl(courseData?.seo_image) || getFullUrl(courseData?.og_image) || getFullUrl(courseData?.thumbnail)} />
        <meta property="og:image:alt" content={courseData?.seo_image_alt || courseData?.og_image_alt} />
        <meta property="og:url" content={courseData?.seo_canonical || window.location.href} />
        <meta property="og:type" content="website" />

        {/* Image dimensions for better display */}
        {getFullUrl(courseData?.seo_image) && (
          <>
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
          </>
        )}

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={courseData?.og_title || courseData?.meta_title || courseData?.title} />
        <meta name="twitter:description" content={courseData?.og_description || courseData?.meta_description || courseData?.description?.replace(/<[^>]*>/g, '').substring(0, 160)} />
        <meta name="twitter:image" content={getFullUrl(courseData?.seo_image) || getFullUrl(courseData?.og_image) || getFullUrl(courseData?.thumbnail)} />
        <meta name="twitter:image:alt" content={courseData?.seo_image_alt || courseData?.og_image_alt} />

        {/* Structured Data for Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            "name": courseData?.title,
            "description": courseData?.meta_description || courseData?.description?.replace(/<[^>]*>/g, '').substring(0, 160),
            "image": getFullUrl(courseData?.seo_image) || getFullUrl(courseData?.thumbnail),
            "provider": {
              "@type": "Organization",
              "name": "Queekies",
              "sameAs": "https://website.com"
            },
            "offers": {
              "@type": "Offer",
              "price": courseData?.price,
              "priceCurrency": "INR",
              "availability": "https://schema.org/InStock"
            },
            "timeRequired": `PT${courseData?.duration_minutes}M`,
            "url": courseData?.seo_canonical || window.location.href
          })}
        </script>
      </Helmet>



      {/* Reward Popup */}
      <RewardPopup
        isOpen={showRewardPopup}
        points={rewardPoints}
        onClose={() => {
          setShowRewardPopup(false);
          handlePostEnrollmentFlow();
        }}
      />

      {showFaqModal && faqList.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-0 py-0 sm:p-4 md:p-6 lg:p-8">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity cursor-pointer"
            onClick={() => setShowFaqModal(false)}
          />

          <div className="relative bg-white rounded-t-3xl sm:rounded-lg md:rounded-xl shadow-sm w-full sm:w-[90%] md:w-[85%] lg:w-[75%] xl:w-[60%] max-w-4xl max-h-[85vh] sm:max-h-[90vh] md:max-h-[88vh] lg:max-h-[85vh] min-h-[55vh] sm:min-h-[60vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Main Content Container */}
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header - Sticky */}
              <div className="flex-shrink-0 bg-white border-b border-gray-100 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
                {/* Title */}
                <div className="flex items-center space-x-2 sm:space-x-3 justify-center mb-3 sm:mb-4">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-forestGreen text-center">Course Question</h1>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentFaqIndex + 1) / faqList.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
                {/* Progress text */}
                <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 md:mb-4 font-medium">
                  Question {currentFaqIndex + 1} of {faqList.length}
                </div>

                {/* Question */}
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-forestGreen mb-3 sm:mb-4 md:mb-6 leading-relaxed">
                  {faqList[currentFaqIndex]?.question}
                </h3>

                {/* Options */}
                <div className="space-y-1.5 sm:space-y-2 md:space-y-3 mb-4 sm:mb-6 md:mb-8">
                  {faqOptionsMap[faqList[currentFaqIndex]?.id]?.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedFaqOption === option.id
                        ? 'border-primary bg-lightGreen/10'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      <div className={`flex-shrink-0 relative flex items-center justify-center w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border mt-0.5 sm:mt-1 ${selectedFaqOption === option.id ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                        }`}>
                        {selectedFaqOption === option.id && (
                          <div className="w-1.5 h-1.5 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>
                        )}
                        <input
                          type="radio"
                          name="faq_option"
                          value={option.id}
                          checked={selectedFaqOption === option.id}
                          onChange={() => setSelectedFaqOption(option.id)}
                          className="sr-only"
                        />
                      </div>
                      <span
                        className={`text-xs sm:text-sm leading-relaxed ${selectedFaqOption === option.id
                          ? 'text-forestGreen font-medium'
                          : 'text-gray-700'
                          }`}
                      >
                        {option.option_text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons - Sticky Footer */}
              <div className="flex-shrink-0 bg-white border-t border-gray-100 px-2 sm:px-3 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
                <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 sm:flex-row sm:justify-between sm:items-center">
                  {/* Primary Button - Full Width on Mobile */}
                  <button
                    onClick={handleNextFaq}
                    disabled={isFaqSubmitting || !selectedFaqOption}
                    className="w-full order-first sm:order-last sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-primary text-white text-xs sm:text-sm font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-md active:scale-95 flex items-center justify-center"
                  >
                    {isFaqSubmitting ? "Submitting..." : (currentFaqIndex + 1 < faqList.length ? "Next Question" : "Finish")}
                  </button>

                  {/* Skip Buttons - Flex Row */}
                  <div className="flex w-full sm:w-auto gap-1.5 sm:gap-2 md:gap-3">
                    <button
                      onClick={handleSkipFaq}
                      className="flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors active:scale-95"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleSkipAllFaq}
                      className="flex-1 sm:flex-none px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors active:scale-95"
                    >
                      Skip All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner Section */}
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 xl:pt-10 pb-6 sm:pb-8 lg:pb-10 xl:pb-12">
        <div className="border border-gray-100 rounded-xl sm:rounded-2xl lg:rounded-[1rem] p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {/* Badge */}
              <div className="inline-block">
                <span className="bg-emerald-50 text-emerald-900 text-[10px] xs:text-xs sm:text-sm font-bold px-2 xs:px-3 py-1 xs:py-1.5 rounded uppercase tracking-wider">
                  Most Subscribed
                </span>
              </div>

              {/* Title */}
              <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-tight tracking-tight">
                {courseData.title}
              </h1>

              {/* Description */}
              <div className="text-xs xs:text-sm sm:text-base text-gray-500 leading-relaxed max-w-xl lg:max-w-lg">
                <div
                  dangerouslySetInnerHTML={{
                    __html: courseData.description?.replace(/<[^>]*>/g, '')
                  }}
                />
              </div>

              {/* Meta Info Grid */}
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 sm:gap-x-4 md:gap-x-6 text-[10px] xs:text-[11px] sm:text-xs text-gray-600 font-medium pt-1 sm:pt-2">
                {/* Instructor */}
                {courseData?.created_by_type === 'partner' && courseData?.partner_name && (
                  <div className="flex items-center">
                    <span className="mr-1"><Users className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-black" /></span>
                    <span className="text-gray-500">Instructor : <span className="text-black">{courseData.partner_name}</span></span>
                  </div>
                )}

                {/* Duration */}
                <div className="flex items-center">
                  <span className="mr-1"><Clock className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-black" /></span>
                  <span className="text-gray-500">Duration : <span className="text-black">{formatDuration(courseData.duration_minutes * 60)}</span></span>
                </div>
              </div>

              {/* Ratings and Students */}
              {averageRating > 0 && (
                <div className="flex flex-wrap items-center text-[10px] xs:text-[11px] sm:text-xs text-gray-500 pt-0.5 sm:pt-1 space-x-2 sm:space-x-3">
                  <div className="flex items-center text-amber-500 font-bold">
                    <span className="mr-1 text-xs sm:text-sm">{averageRating}</span>
                    <StarRating value={averageRating} size="sm" />
                  </div>
                  <span>({totalReviews} ratings)</span>
                  {/* {totalEnrollmentsForCourse > 0 && (
                    <span className="text-gray-400">| {totalEnrollmentsForCourse} students</span>
                  )} */}
                </div>
              )}

              {/* Buttons */}
              <div className="pt-3 sm:pt-4 md:pt-6 space-y-3 sm:space-y-4 md:space-y-6">

                {/* Promo Code Section */}
                {!isEnrolled && !promoSuccess && !isAlreadyVerified && courseData.generated_by != userId && (
                  <div className="max-w-xs">
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        type="text"
                        maxLength={7}
                        value={promoCode.toUpperCase()}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Have a promo code?"
                        className="flex-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-md focus:outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white"
                      />
                      <button
                        onClick={verifyPromoCode}
                        disabled={isVerifying}
                        className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-forestGreen text-white text-xs font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap min-w-[60px] sm:min-w-[70px]"
                      >
                        {isVerifying ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs mt-1 font-medium">{promoError}</p>}
                  </div>
                )}

                {/* Success Message */}
                {(promoSuccess || isAlreadyVerified) && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600 bg-emerald-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md w-fit">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-bold">Promo Applied! Course is FREE.</span>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
                  {isEnrolled ? (
                    <>
                      <button
                        onClick={handleGoToCourse}
                        className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-forestGreen text-white font-bold rounded flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base"
                      >
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                        Go to Course
                      </button>

                      {courseData.generated_by == userId && courseData.status == "private" && (
                        <button
                          onClick={handleGoToPartner}
                          className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-forestGreen font-bold rounded flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base border border-secondaryForestGreen"
                        >
                          Become a Partner to Publish
                        </button>
                      )}
                    </>
                  ) : courseData.generated_by == userId ? (
                    <>
                      <button
                        onClick={() => handleEnroll()}
                        className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-forestGreen text-white font-bold rounded flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base transition-all"
                      >
                        Start My Course
                      </button>
                      {courseData.status == "private" && (
                        <button
                          onClick={handleGoToPartner}
                          className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-forestGreen font-bold rounded flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base transition-all border border-forestGreen"
                        >
                          Become a Partner to Publish
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Primary Enrollment (Payment or Free) */}
                      {(promoSuccess || isAlreadyVerified) ? (
                        <button
                          onClick={() => handleEnroll(null)}
                          disabled={enrollLoading}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-forestGreen text-white font-bold rounded shadow-lg transition-all"
                        >
                          {enrollLoading ? "Processing..." : "Enroll Now - Free"}
                        </button>
                      ) : (
                        <div className="flex items-center">
                          <RazorpayButton
                            onResult={handleRazorpayPayment}
                            amount={finalPrice}
                            buttonText="Buy Now"
                            className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base !bg-none !bg-forestGreen text-white font-bold rounded-md shadow-md transition-all"
                          />
                        </div>
                      )}

                      {/* Enroll with Points */}
                      {!promoSuccess && !isAlreadyVerified && courseData.is_points_enrollable === 1 && (
                        <button
                          onClick={completeEnrollByPoints}
                          disabled={!hasSufficientPoints || isUpdating}
                          className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-bold border-2 rounded-md transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap
                             ${hasSufficientPoints
                              ? "border-primary text-primary"
                              : "border-gray-200 text-gray-400 cursor-not-allowed"}`}
                        >
                          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Use {courseData.points_to_enroll} Points
                        </button>
                      )}
                    </>
                  )}

                  {/* Price Display */}
                  {!isEnrolled && !promoSuccess && !isAlreadyVerified && courseData.generated_by != userId && (
                    <div className="flex flex-col ml-2 sm:ml-3 gap-0.5">
                      <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-none">
                        ₹{finalPrice}
                      </span>
                      {courseData.discount > 0 && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium mt-0.5 sm:mt-1">
                          <span className="text-gray-400 line-through">
                            ₹{parseFloat(courseData.price).toFixed(2)}
                          </span>
                          <span className="text-emerald-700 bg-emerald-100 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[10px] xs:text-xs">
                            {courseData.discount}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Media */}
            <div className="relative rounded-lg sm:rounded-xl overflow-hidden bg-gray-900 border border-gray-100 aspect-[16/9] w-full shadow-sm group mt-3 sm:mt-0">
              {isVideoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-10">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-white border-t-transparent"></div>
                </div>
              )}

              {(() => {
                if (!media.url) return null
                if (media.type === 'image') {
                  const handleImageLoad = (e) => {
                    const img = e.currentTarget;
                    const naturalW = img.naturalWidth || 0;
                    const naturalH = img.naturalHeight || 0;
                    if (naturalW > 0 && naturalH > 0) {
                      const imgRatio = naturalW / naturalH;
                      const targetRatio = 16 / 9;
                      const relativeDiff = Math.abs(imgRatio - targetRatio) / targetRatio;
                      setImageFit(relativeDiff <= 0.08 ? 'cover' : 'contain');
                    }
                    setIsVideoLoading(false);
                  };
                  return (
                    <div className="relative w-full h-full flex items-center justify-center bg-black/10">
                      {imageFit === 'contain' && (
                        <>
                          <img
                            src={media.url || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110 opacity-50"
                          />
                          <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
                        </>
                      )}
                      <img
                        src={media.url || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                        alt={courseData?.title}
                        className={`relative z-20 w-full h-full object-${imageFit}`}
                        onLoad={handleImageLoad}
                        onError={() => setIsVideoLoading(false)}
                      />
                    </div>
                  )
                }
                return (
                  <div className="w-full h-full relative">
                    <video
                      key={media.url}
                      src={media.url}
                      width="100%"
                      height="100%"
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster={courseData?.thumbnail ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${courseData?.thumbnail}` : null}
                      onCanPlay={() => setIsVideoLoading(false)}
                      onError={() => setIsVideoLoading(false)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )
              })()}

              {mediaList.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1)); setIsVideoLoading(true); }}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-sm transition-all z-30 flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1)); setIsVideoLoading(true); }}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-sm transition-all z-30 flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                  </button>
                  <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {mediaList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(idx); setIsVideoLoading(true); }}
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${idx === currentMediaIndex ? "bg-white scale-110" : "bg-white/40 hover:bg-white/80"
                          }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Learning Section */}
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">What will you Learn</h2>
              {/* Dynamic Points */}
              {courseData.what_you_will_learn && courseData.what_you_will_learn.some(item => item.trim() !== "") && (
                <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                  {courseData.what_you_will_learn.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black mt-1.5 sm:mt-2 mr-2 sm:mr-3 md:mr-4" />
                      <span className="text-xs sm:text-sm md:text-base text-gray-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Prerequisites Section */}
            {(() => {
              let prerequisites = [];
              try {
                if (typeof courseData.prerequisites === "string") {
                  prerequisites = JSON.parse(courseData.prerequisites);
                } else if (Array.isArray(courseData.prerequisites)) {
                  prerequisites = courseData.prerequisites;
                }
              } catch (e) {
                prerequisites = [];
              }

              // Filter out empty items
              prerequisites = prerequisites?.filter(item => item?.trim() !== "") || [];

              if (prerequisites.length === 0) return null;

              return (
                <div className="pt-4 sm:pt-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">Prerequisites</h2>
                  <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                    {prerequisites.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-black mt-1.5 sm:mt-2 mr-2 sm:mr-3 md:mr-4" />
                        <span className="text-xs sm:text-sm md:text-base text-gray-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>

          {/* Right Column - Skills Upgrade Card */}
          <div className="lg:col-span-1 mt-6 sm:mt-8 lg:mt-0">
            {courseData.skill_development && (
              <div className="border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 bg-white shadow-sm">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">Skills Upgrade</h3>
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  {(() => {
                    let skills = []
                    try {
                      if (typeof courseData.skill_development === "string") {
                        skills = JSON.parse(courseData.skill_development)
                      } else if (Array.isArray(courseData.skill_development)) {
                        skills = courseData.skill_development
                      }
                    } catch (e) {
                      skills = []
                    }

                    // filter out completely empty skill items for cleaner display
                    skills = skills.filter(skill => skill?.title?.trim() || (skill?.statements && skill.statements.some(s => s?.trim())))

                    if (skills.length === 0) return null

                    // Static icons to map conditionally or cycle through
                    const icons = [Layout, Server, Cloud, TrendingUp]

                    return skills.map((skill, i) => {
                      const IconComponent = icons[i % icons.length]
                      return (
                        <div key={i} className="flex gap-2 sm:gap-3 md:gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">{skill.title}</h4>
                            <ul className="space-y-0.5 sm:space-y-1">
                              {skill.statements.filter(sub => sub?.trim()).map((sub, j) => (
                                <li key={j} className="text-xs sm:text-sm text-gray-500 flex items-start">
                                  <span className="mr-1.5 sm:mr-2 text-gray-400 mt-0.5">-</span>
                                  <span className="break-words leading-tight">{sub}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto py-6 sm:py-8 md:py-10 lg:py-12 px-5 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 lg:pb-0">
          {/* Left Column */}
          <div className="lg:col-span-3">
            <div className="mt-0">
              {/* Course Content - Mobile Optimized */}
              {groupedSessions.length > 0 && (
                <div className="mt-3 sm:mt-4 md:mt-6 lg:mt-8">
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-1.5 lg:mb-2">
                    The curriculum is divided into {groupedSessions.length} sections
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-2 sm:mb-3 lg:mb-6 font-medium">
                    {groupedSessions.length} sections • {groupedSessions.reduce((acc, curr) => acc + curr.modules.length, 0)} modules • {Math.floor(courseData.duration_minutes / 60)}h {courseData.duration_minutes % 60}m
                  </p>

                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white divide-y divide-gray-200">
                    {groupedSessions.map(({ session, modules }) => (
                      <SessionAccordion
                        key={session.id}
                        session={session}
                        modules={modules}
                        isOpen={openSessionId === session.id}
                        onToggle={() => {
                          if (openSessionId === session.id) {
                            setOpenSessionId(null);
                          } else {
                            setOpenSessionId(session.id);
                            if (modules.length > 0) {
                              setOpenModuleBySession((prev) => ({
                                ...prev,
                                [session.id]: modules[0].id,
                              }));
                            }
                          }
                        }}
                        openModuleId={openModuleBySession[session.id] || null}
                        onModuleToggle={(moduleId) =>
                          setOpenModuleBySession(prev => ({
                            ...prev,
                            [session.id]: prev[session.id] === moduleId ? null : moduleId,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {(totalReviews > 0 || isEnrolled) && (
                <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10" id="reviews">
                  <StudentReviews
                    courseId={courseData?.public_hash || courseId}
                    isEnrolled={isEnrolled}
                    userId={userId}
                    courseTitle={courseData.title}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <FAQ />
    </div>
  );
}

export default CourseDetails;