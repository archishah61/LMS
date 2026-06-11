/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetEnrollmentsQuery } from "../../services/Enrollment/enrollAPI";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  Clock,
  Download,
  Filter,
  X,
  ArrowLeft,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminToken } from "../../services/CookieService";
import { slugify } from "../../utils/slugify";
import PermissionWrapper from "../../context/PermissionWrapper";
import AdminLoader from "../admin/AdminLoader";

export const EnrollmentTable = () => {
  const navigate = useNavigate();
  const { access_token } = getAdminToken();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const {
    data: enrollments,
    error,
    isLoading,
  } = useGetEnrollmentsQuery({ searchTerm, status: statusFilter, dateFrom, dateTo, access_token }, { skip: !access_token });
  const [expandedRows, setExpandedRows] = useState([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState([]);
  const [groupedEnrollments, setGroupedEnrollments] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (enrollments) {
      let filtered = enrollments
      // .filter((enrollment) => {
      //   const matchesSearch =
      //     (enrollment.user?.full_name || "")
      //       .toLowerCase()
      //       .includes(searchTerm.toLowerCase()) ||
      //     (enrollment.user?.email || "")
      //       .toLowerCase()
      //       .includes(searchTerm.toLowerCase()) ||
      //     (enrollment.course?.title || "")
      //       .toLowerCase()
      //       .includes(searchTerm.toLowerCase());
      //   const matchesStatus =
      //     statusFilter === "all" ||
      //     enrollment.status.toLowerCase() === statusFilter.toLowerCase();
      //   let matchesDate = true;
      //   if (dateFrom && dateTo) {
      //     const enrollmentDate = new Date(enrollment.enrollment_date);
      //     const fromDate = new Date(dateFrom);
      //     const toDate = new Date(dateTo);
      //     const toDateObj = new Date(dateTo);
      //     toDateObj.setHours(23, 59, 59, 999);
      //     matchesDate =
      //       enrollmentDate >= fromDate && enrollmentDate <= toDateObj;
      //   }
      //   return matchesSearch && matchesStatus && matchesDate;
      // });

      const grouped = filtered.reduce((acc, enrollment) => {
        const userId = enrollment.user?.id;
        if (!acc[userId]) {
          acc[userId] = {
            user: enrollment.user,
            courses: [],
            latestEnrollment: enrollment.enrollment_date,
          };
        }
        acc[userId].courses.push({
          ...enrollment,
          enrollment_date: enrollment.enrollment_date,
          expiry_date: enrollment.expiry_date,
          status: enrollment.status,
        });
        if (
          new Date(enrollment.enrollment_date) >
          new Date(acc[userId].latestEnrollment)
        ) {
          acc[userId].latestEnrollment = enrollment.enrollment_date;
        }
        return acc;
      }, {});

      const groupedArray = Object.values(grouped).sort(
        (a, b) => new Date(b.latestEnrollment) - new Date(a.latestEnrollment)
      );
      setGroupedEnrollments(groupedArray);
      setFilteredEnrollments(filtered);
    }
  }, [enrollments, searchTerm, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const toggleRow = (userId) => {
    setExpandedRows((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [userId]
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-700 ring-green-200";
      case "expired":
        return "bg-red-100 text-red-700 ring-red-200";
      case "completed":
        return "bg-lightGreen text-leafGreen ring-lightGreen";
      default:
        return "bg-amber-100 text-amber-700 ring-amber-200";
    }
  };

  const downloadCSV = () => {
    const rows = [];
    const headers = [
      "Student Name",
      "Student Email",
      "Student Phone",
      "Course Title",
      "Course ID",
      "Status",
      "Enrollment Date",
      "Expiry Date",
    ];
    const formatPhoneNumber = (phone) => {
      if (!phone) return "N/A";
      try {
        const phoneStr =
          typeof phone === "number"
            ? BigInt(Math.floor(phone)).toString()
            : String(phone).replace(/\D/g, "");
        return phoneStr || "N/A";
      } catch (error) {
        console.error("Error formatting phone number:", error);
        return String(phone) || "N/A";
      }
    };
    groupedEnrollments.forEach((group) => {
      group.courses.forEach((course) => {
        const phoneNumber = formatPhoneNumber(group.user?.mobile_no);
        rows.push([
          group.user?.full_name || "N/A",
          group.user?.email || "N/A",
          `="${phoneNumber}"`,
          course.course?.title || "N/A",
          course.course?.id || "N/A",
          course.status || "N/A",
          formatDate(course.enrollment_date),
          formatDate(course.expiry_date),
        ]);
      });
    });
    const processCell = (cell) => {
      const stringValue = String(cell || "");
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(processCell).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `enrollments_${formatDate(new Date())}.csv`;
    link.click();
  };

  const total = groupedEnrollments.length;
  const totalPages = Math.ceil(total / limit);
  const displayedGroups = groupedEnrollments.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0 overflow-hidden">
        <div className="w-full px-3 sm:px-6 py-3 sm:py-4">
          {/* Mobile Header */}
          <div className="block sm:hidden">
            <div className="relative flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-forestGreen absolute left-1/2 -translate-x-1/2">
                Enrollments
              </h1>
              <button
                onClick={() => navigate(-1)}
                className="border flex-shrink-0 flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative z-10 ml-auto"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors flex-1 justify-center min-w-0"
              >
                <Filter size={14} />
                <span className="font-medium text-xs truncate">Filters</span>
                {isFilterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              <PermissionWrapper section="Enrollment" action="export">
                <button
                  onClick={downloadCSV}
                  className="flex-shrink-0 bg-leafGreen text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm text-xs"
                >
                  <Download size={14} />
                  <span className="hidden xs:inline">Export</span>
                </button>
              </PermissionWrapper>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-forestGreen">
                  Enrollment Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage student enrollments and their status
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <Filter size={18} />
                  <span className="font-medium">Filters</span>
                  {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <PermissionWrapper section="Enrollment" action="export">
                  <button
                    onClick={downloadCSV}
                    className="bg-leafGreen text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                </PermissionWrapper>

                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="font-medium">Back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Enrollments
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute top-3 left-3 text-gray-400"
                      size={16}
                    />
                    <input
                      type="search"
                      placeholder="Search by student name, email or course..."
                      className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              {(searchTerm ||
                dateFrom ||
                dateTo ||
                statusFilter !== "all") && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setDateFrom("");
                        setDateTo("");
                        setStatusFilter("all");
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
      <div className="w-full flex-1 overflow-y-auto p-3 sm:p-6">
        {/* Mobile Cards View */}
        <div className="block sm:hidden">
          {isLoading ? (
            <AdminLoader message="Loading Enrollment Details..." />
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Error fetching enrollments!
                  </p>
                </div>
              </div>
            </div>
          ) : displayedGroups.length > 0 ? (
            <div className="space-y-3">
              {displayedGroups.map((group) => (
                <div
                  key={group.user?.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Header Row */}
                  <div
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleRow(group.user?.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 grid">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {group.user?.full_name || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {group.user?.email || "N/A"}
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          {group.courses.length} Course(s) • {formatDate(group.latestEnrollment)}
                        </div>
                      </div>
                      <motion.div
                        animate={{
                          rotate: expandedRows.includes(group.user?.id)
                            ? 180
                            : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0 text-leafGreen ml-2"
                      >
                        <ChevronDown size={18} />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedRows.includes(group.user?.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-lightGreen/10 border-t border-gray-200"
                      >
                        <div className="p-4 space-y-3">
                          <h4 className="text-sm font-bold text-forestGreen flex items-center gap-2 mb-4">
                            <BookOpen size={16} /> Enrolled Courses
                          </h4>
                          <div className="space-y-3">
                            {group.courses.map((enrollment, idx) => (
                              <PermissionWrapper key={idx} section="Student Course Tracking" action="view">
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 border-l-4 border-l-leafGreen hover:shadow-md transition-all duration-200 cursor-pointer group"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/admin/dashboard/students/courseProgress/${slugify(
                                        enrollment.course?.title
                                      )}`,
                                      {
                                        state: {
                                          courseId: enrollment.course?.id,
                                          coursePublicHash: enrollment.course?.public_hash,
                                          courseTitle: enrollment.course?.title,
                                          userId: group.user?.id,
                                        },
                                      }
                                    );
                                  }}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                      <h5 className="text-sm font-bold text-forestGreen flex-1 pr-2 group-hover:text-leafGreen transition-colors">
                                        {enrollment.course?.title}
                                      </h5>
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                                        enrollment.status
                                      )}`}
                                    >
                                      {enrollment.status}
                                    </span>
                                  </div>
                                  <div className="space-y-2 text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                      <Calendar size={12} className="text-gray-400" />
                                      <p>Enrolled: <span className="font-semibold text-gray-700">{formatDate(enrollment.enrollment_date)}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock size={12} className="text-gray-400" />
                                      <p>Expires: <span className="font-semibold text-gray-700">{formatDate(enrollment.expiry_date)}</span></p>
                                    </div>
                                  </div>
                                </motion.div>
                              </PermissionWrapper>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="flex flex-col items-center justify-center py-6">
                <Search className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-base font-medium text-gray-600">
                  No enrollments found
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search criteria
                </p>
              </div>
            </div>
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="text-sm text-gray-700 text-center">
                  Showing {(currentPage - 1) * limit + 1} to{" "}
                  {Math.min(currentPage * limit, total)} of {total} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Prev
                  </button>
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block bg-white rounded-lg border border-gray-200 overflow-hidden flex-col h-full">
          {isLoading ? (
            <AdminLoader message="Loading Enrollment Details..." />
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    Error fetching enrollments!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Table Container - Scrollable */}
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  {/* Sticky Table Header */}
                  <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Courses Enrolled
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Latest Enrollment
                      </th>
                    </tr>
                  </thead>
                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-200">
                    <AnimatePresence>
                      {displayedGroups.map((group) => (
                        <React.Fragment key={group.user?.id}>
                          <motion.tr
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="hover:bg-lightGreen/20 transition-colors duration-200 cursor-pointer"
                            onClick={() => toggleRow(group.user?.id)}
                          >
                            <td className="px-6 py-4 w-10">
                              <motion.div
                                animate={{
                                  rotate: expandedRows.includes(group.user?.id) ? 180 : 0,
                                }}
                                className="flex items-center justify-center w-6 h-6 text-leafGreen"
                              >
                                <ChevronDown className="h-5 w-5" />
                              </motion.div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col min-w-0">
                                <div className="text-sm font-medium truncate text-gray-900">
                                {group.user?.full_name || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {group.user?.email || "N/A"}
                              </div>
                            </div>
                          </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {group.courses.length} Course(s)
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(group.latestEnrollment)}
                            </td>
                          </motion.tr>

                          <AnimatePresence>
                            {expandedRows.includes(group.user?.id) && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{
                                  opacity: 0,
                                  height: 0,
                                  transition: {
                                    opacity: { duration: 0.25 },
                                    height: { duration: 0.35 },
                                  },
                                }}
                                transition={{
                                  duration: 0.4,
                                  ease: [0.04, 0.62, 0.23, 0.98],
                                }}
                              >
                                <td colSpan="4" className="px-6 py-4 bg-lightGreen/10">
                                  <motion.div
                                    className="space-y-4"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{
                                      opacity: 1,
                                      y: 0,
                                      transition: {
                                        delay: 0.1,
                                        duration: 0.3,
                                      },
                                    }}
                                    exit={{
                                      opacity: 0,
                                      y: -10,
                                      transition: {
                                        duration: 0.2,
                                      },
                                    }}
                                  >
                                    <div className="space-y-4">
                                      <h4 className="text-lg font-bold text-forestGreen flex items-center gap-2 mb-6">
                                        <BookOpen size={20} /> Enrolled Courses Management
                                      </h4>
                                      <div className="space-y-3">
                                        {group.courses.map((enrollment, idx) => (
                                          <PermissionWrapper key={idx} section="Student Course Tracking" action="view">
                                            <motion.div
                                              initial={{
                                                opacity: 0,
                                                x: -20,
                                              }}
                                              animate={{
                                                opacity: 1,
                                                x: 0,
                                                transition: {
                                                  delay: 0.1 + idx * 0.05,
                                                  duration: 0.35,
                                                },
                                              }}
                                              className="bg-white rounded-lg p-4 border border-lightGreen hover:shadow-md transition-shadow duration-300"
                                            >
                                              <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                  <h5 className="text-base font-medium text-gray-900 mb-2">
                                                    {enrollment.course?.title}
                                                  </h5>
                                                  <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                                                    <span>
                                                      Enrollment: <span className="font-medium text-gray-800">
                                                        {formatDate(enrollment.enrollment_date)}
                                                      </span>
                                                    </span>
                                                    <span>
                                                      Expiry: <span className="font-medium text-gray-800">
                                                        {formatDate(enrollment.expiry_date)}
                                                      </span>
                                                    </span>
                                                    {enrollment.completed_at && (
                                                      <span>
                                                        Completion: <span className="font-medium text-gray-800">
                                                          {formatDate(enrollment.completed_at)}
                                                        </span>
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-4 ml-4">
                                                  <span
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${getStatusBadgeColor(
                                                      enrollment.status
                                                    )}`}
                                                  >
                                                    {enrollment.status}
                                                  </span>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      navigate(
                                                        `/admin/dashboard/students/courseProgress/${slugify(
                                                          enrollment.course?.title
                                                        )}`,
                                                        {
                                                          state: {
                                                            courseId: enrollment.course?.id,
                                                            coursePublicHash: enrollment.course?.public_hash,
                                                            courseTitle: enrollment.course?.title,
                                                            userId: group.user?.id,
                                                          },
                                                        }
                                                      );
                                                    }}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-leafGreen rounded-lg transition-colors duration-200"
                                                  >
                                                    Track
                                                  </button>
                                                </div>
                                              </div>
                                            </motion.div>
                                          </PermissionWrapper>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
                {groupedEnrollments.length === 0 && (
                  <div className="text-center py-12 text-gray-500 flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center py-6">
                      <Search className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-600">
                        No enrollments found matching the current filters.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Try adjusting your search criteria or date range.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pagination - Fixed at bottom */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(currentPage - 1) * limit + 1} to{" "}
                      {Math.min(currentPage * limit, total)} of {total} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${currentPage === page
                              ? "bg-primary text-white"
                              : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};