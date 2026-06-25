/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useGetUserCoursesQuery } from "../../services/Enrollment/enrollAPI";
import { getStudentToken } from "../../services/CookieService";
import { Book, Clock, GraduationCap, Award, PlayCircle, Info, Filter, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useGetCourseCategoriesQuery } from "../../services/Course_Management/courseCatagoryApi";
import { slugify } from "../../utils/slugify";
import { useGetUserGeneratedCoursesQuery } from "../../services/Course_Management/courseApi";
import CertificateViewModal from "../../components/modal/CertificateViewModal";
import CertificateModal from "../../components/modal/CertificateModal";
import { jwtDecode } from "jwt-decode";
import PrimaryLoader from "../../components/ui/PrimaryLoader";

const FilteredCourses = () => {
  const { id: reduxId } = useSelector((state) => state.user);
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

  const [finalList, setFinalList] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  const [certificateUrl, setCertificateUrl] = useState('')

  const openCertificateModal = (url) => {
    setCertificateUrl(url)
    setIsCertificateModalOpen(true)
  }

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedCourseForCert, setSelectedCourseForCert] = useState(null);

  // Fetch enrolled courses
  const { data: userEnrolledCourses, isLoading: isEnrolledLoading, refetch: refetchEnrolled } = useGetUserCoursesQuery({
    userId,
    access_token,
    status: filter === 'generated' ? 'all' : filter // If generated tab, fetch all and filter in UI, else fetch specific status
  }, {
    skip: !userId,
  });

  // Fetch all course categories with error handling
  const { data: allCategories = [] } =
    useGetCourseCategoriesQuery({ access_token });

  const { data: userGeneratedCourses, isLoading: isGeneratedLoading } = useGetUserGeneratedCoursesQuery({ access_token });

  useEffect(() => {
    window.scrollTo(0, 0);

    let processedList = [];

    let generatedList = [];
    if (userGeneratedCourses) {
      generatedList = userGeneratedCourses.map((course) => ({
        ...course,
        duration_hours: course.duration_minutes, // normalize
        isEnrolled: false,
      }));
    }

    // Step 1: Get enrolled course hashes
    const enrolledHashes = new Set(
      userEnrolledCourses?.courses?.map(
        (enrollment) => enrollment.course.public_hash
      ) || []
    );

    // Step 2: Add enrolled courses first
    if (userEnrolledCourses?.courses) {
      const generatedHashes = new Set(generatedList.map(c => c.public_hash));

      const enrolledCourses = userEnrolledCourses.courses.map((enrollment) => ({
        ...enrollment.course,
        status: enrollment.status,
        certificate_url: enrollment.certificate_url,
        user_hash: enrollment.user_hash,
        isEnrolled: !generatedHashes.has(enrollment.course.public_hash),
      }));

      processedList = [...enrolledCourses];
    }

    // Step 3: Add generated courses that are NOT already enrolled
    if (userGeneratedCourses) {
      const generatedCourses = userGeneratedCourses
        .filter((course) => !enrolledHashes.has(course.public_hash))
        .map((course) => ({
          ...course,
          duration_hours: course.duration_minutes, // normalize
          isEnrolled: false,
        }));

      processedList = [...processedList, ...generatedCourses];
    }

    setFinalList(processedList);
  }, [userEnrolledCourses, userGeneratedCourses]);

  // Function to handle filter change
  const handleFilterChange = (value) => {
    setFilter(value);
    setShowMobileFilters(false); // Close mobile filters after selection
  };

  // Filter courses based on selected filter
  const filteredCourses = finalList.filter((course) => {
    if (filter === "all") return true;
    if (filter === "generated") return !course.isEnrolled; // Show only generated courses
    return course.status && course.status.toLowerCase() === filter;
  });

  // Function to get thumbnail URL
  const getThumbnailUrl = (course) => {
    if (course.thumbnail) {
      if (course.thumbnail.startsWith("/api/placeholder") || course.thumbnail.startsWith("http")) {
        return course.thumbnail
      }
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${course.thumbnail}`;
    }
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/assets/placeholder2.png"}`;
  };

  const isLoading = isEnrolledLoading || isGeneratedLoading;

  return (
    <div className="min-h-screen bg-white pt-4 pb-4">
      {/* FIXED: Removed fixed constraints to prevent empty space */}
      <div className="container mx-auto">
        <div className="w-full mx-auto rounded-2xl overflow-hidden shadow-sm mb-6">
          {/* Header Section */}
          <div
            className="px-6 sm:px-8 py-6 sm:py-8 relative bg-cover bg-center text-white"
            style={{ backgroundImage: "url('/assets/My_Profile_Heading_Background.png')" }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                  My Learning Journey
                  <GraduationCap className="inline ml-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white text-opacity-80" />
                </h1>
              </div>
              <p className="text-indigo-100 text-xs sm:text-sm md:text-base opacity-90 font-light max-w-xl">
                Track your progress and continue your educational path
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="w-full mx-auto">
          {/* Mobile Filter Toggle Button - Only on mobile */}
          <div className="mb-4 md:hidden">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-center gap-2 bg-lightGreen px-4 py-3 rounded-lg text-gray-700 font-medium"
            >
              <Filter size={18} />
              <span>Filter Courses</span>
              <span className="ml-auto text-xs bg-primary text-white px-2 py-1 rounded-full">
                {filter === "all" ? "ALL" : filter.toUpperCase()}
              </span>
            </button>
          </div>

          {/* Mobile Filter Dropdown - Only on mobile */}
          {showMobileFilters && (
            <div className="mb-6 md:hidden">
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                {[
                  { label: "ALL COURSES", value: "all" },
                  { label: "ACTIVE COURSES", value: "active" },
                  { label: "COMPLETED COURSES", value: "completed" },
                  { label: "GENERATED COURSES", value: "generated" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => handleFilterChange(tab.value)}
                    className={`
                      w-full px-4 py-3 text-sm text-left transition-all
                      ${filter === tab.value
                        ? "text-black font-bold bg-lightGreen"
                        : "text-gray-500 font-medium"
                      }
                      hover:bg-gray-50
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span>{tab.label}</span>
                      {filter === tab.value && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Desktop Filter Tabs - Unchanged */}
          <div className="hidden md:flex bg-lightGreen rounded-lg justify-between gap-1 mb-8">
            {[
              { label: "ALL COURSES", value: "all" },
              { label: "ACTIVE COURSES", value: "active" },
              { label: "COMPLETED COURSES", value: "completed" },
              { label: "GENERATED COURSES", value: "generated" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleFilterChange(tab.value)}
                className={`
                  flex-1 px-4 py-3 text-sm text-center transition-all relative
                  ${filter === tab.value
                    ? "text-black font-bold"
                    : "text-gray-500 font-medium"
                  }
                `}
              >
                <div className="relative z-10">{tab.label}</div>
                {filter === tab.value && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-primary rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <PrimaryLoader />
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredCourses.map((course, index) => {
                const categoryName = allCategories?.find((cat) => `${cat.id}` === `${course.category_id}`)?.category || "Professional";
                const isCompleted = course.status?.toLowerCase() === "completed";
                const isActive = course.status?.toLowerCase() === "active";

                return (
                  <div
                    key={course.id || index}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-4 h-full"
                  >
                    {/* Top Section: Image & Metadata */}
                    <div className="flex gap-4">
                      {/* Thumbnail - Responsive sizing */}
                      <div className="w-28 sm:w-32 md:w-36 lg:w-40 h-20 sm:h-24 md:h-28 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                        <img
                          src={getThumbnailUrl(course)}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/assets/placeholder2.png";
                          }}
                        />
                      </div>

                      {/* Header Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm sm:text-md font-bold text-black leading-tight mb-1 line-clamp-2">
                            {course.title}
                          </h3>
                          {categoryName && (
                            <span className="text-xs sm:text-sm text-gray-500 font-medium truncate block mb-1">
                              {categoryName}
                            </span>
                          )}
                        </div>

                        {/* Status Pills */}
                        <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
                          {/* Time Pill */}
                          <div className="flex items-center gap-1.5 bg-lightGreen px-2 py-0.5 rounded-md text-xs font-medium text-primary border border-primary">
                            <Clock size={12} className="text-primary" />
                            <span>
                              {course.duration_hours
                                ? `${Math.floor(course.duration_hours / 60)} hr ${course.duration_hours % 60} min`
                                : `${Math.floor(course.duration_minutes / 60)} hr ${course.duration_minutes % 60} min`
                              }
                            </span>
                          </div>

                          {/* Status Text */}
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-[#22C55E]" : isActive ? "bg-blue-500" : "bg-gray-400"}`}></div>
                            <span className={`text-xs font-bold capitalize ${isCompleted ? "text-[#22C55E]" : isActive ? "text-blue-500" : "text-gray-500"}`}>
                              {course.status || "Active"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="flex-1">
                      <p
                        className="text-xs text-gray-600 line-clamp-2 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: course.description }}
                      />
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      {isCompleted ? (
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/course/${slugify(course.title)}`}
                            state={{ public_hash: course.public_hash }}
                            className="p-2 sm:p-2.5 rounded-lg text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <Info size={20} />
                          </Link>

                          {course.certificate_url ? (
                            <button
                              onClick={() => openCertificateModal(course.certificate_url)}
                              className="flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold text-green-600 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                            >
                              <Award size={16} />
                              <span>View Certificate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedCourseForCert({ id: course.id, title: course.title });
                                setIsGenerateModalOpen(true);
                              }}
                              className="flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                            >
                              <Sparkles size={16} />
                              <span>Generate Certificate</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <Link
                            to={`/course/${slugify(course.title)}`}
                            state={{ public_hash: course.public_hash }}
                            className="flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                          >
                            <Info size={16} />
                            <span className="hidden xs:inline">View Details</span>
                            <span className="xs:hidden">Details</span>
                          </Link>

                          {course.user_hash && <Link
                            to={`/course-content/${slugify(course.title)}`}
                            state={{ courseID: course.user_hash }}
                            className="flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                          >
                            <PlayCircle size={16} />
                            <span className="hidden xs:inline">Continue</span>
                            <span className="xs:hidden">Play</span>
                          </Link>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-20 rounded-lg border border-gray-100">
              <div className="w-16 h-16 bg-lightGreen rounded-full flex items-center justify-center mx-auto mb-4 text-primary border border-primary">
                <Book size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Courses Found</h3>
              <p className="text-sm text-gray-500 mt-1">You haven&apos;t enrolled in any courses yet.</p>
              <button onClick={() => setFilter('all')} className="mt-4 text-primary font-medium text-sm hover:underline">
                View All Courses
              </button>
            </div>
          )}
        </div>

        <CertificateViewModal
          certificateUrl={certificateUrl}
          isOpen={isCertificateModalOpen}
          onClose={() => {
            setIsCertificateModalOpen(false)
            setCertificateUrl(null)
          }}
        />

        {isGenerateModalOpen && selectedCourseForCert && (
          <CertificateModal
            isOpen={isGenerateModalOpen}
            onClose={() => {
              setIsGenerateModalOpen(false);
              setSelectedCourseForCert(null);
            }}
            courseId={selectedCourseForCert.id}
            courseName={selectedCourseForCert.title}
            refetchUserCourse={refetchEnrolled}
          />
        )}
      </div>
    </div>
  );
};

export default FilteredCourses;