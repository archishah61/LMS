"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  BookOpen,
  MessageSquare,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  MinusCircle,
} from "lucide-react";
import { getAdminToken } from "../../../services/CookieService";
import AdminLoader from "../../../components/admin/AdminLoader";
import { useSelector } from "react-redux";
import { useGetAllStudentFAQResponsesQuery } from "../../../services/Student_Management/studentFAQResponseApi";
import { useGetPartnersQuery } from "../../../services/Become_partner/becomePartnerApi";
import { useNavigate } from "react-router-dom";

/* ─── Helpers ──────────────────────────────────────────────── */
const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const toCourseArray = (courses) => {
  if (!courses) return [];
  return Array.isArray(courses) ? courses : Object.values(courses);
};

const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/* ─── Question Row ─────────────────────────────────────────── */
const QuestionRow = ({ response, index, isLast }) => {
  const hasSelection = response.selected_option && response.selected_option.trim() !== "";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      className={`py-4 ${!isLast ? "border-b border-gray-100" : ""}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-medium text-gray-800 leading-snug">
          {response.faq_question || "—"}
        </p>
      </div>
      <div className="flex items-center gap-4 pl-5">
        {hasSelection ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-leafGreen bg-lightGreen/60 px-2.5 py-1 rounded-md border border-leafGreen/10">
            <CheckCircle2 className="w-3 h-3" />
            {response.selected_option}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            <MinusCircle className="w-3 h-3" />
            No selection
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3 h-3" />
          {formatDate(response.created_at)}
        </span>
      </div>
    </motion.div>
  );
};

/* ─── Course Block ─────────────────────────────────────────── */
const CourseBlock = ({ course, isOpen, onToggle }) => {
  const questions = Array.isArray(course.questions) ? course.questions : [];
  return (
    <div className={`rounded-lg border ${isOpen ? "border-leafGreen/20" : "border-gray-200"}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <BookOpen className="w-4 h-4 text-leafGreen flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{course.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-leafGreen flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 border-t border-gray-100">
              {questions.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No questions answered</p>
              ) : (
                questions.map((q, i) => (
                  <QuestionRow
                    key={q.id ?? i}
                    response={q}
                    index={i}
                    isLast={i === questions.length - 1}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function FAQResponse() {
  const { access_token } = getAdminToken();
  const { role } = useSelector((s) => s.user);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [createdByType, setCreatedByType] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const limitOptions = [10, 20, 50, 100, 500];

  // Only ONE user open at a time
  const [expandedUser, setExpandedUser] = useState(null);
  // Only ONE course open at a time (global key `userId_courseId`)
  const [expandedCourse, setExpandedCourse] = useState(null);

  const isAnyFilterApplied = () => createdByType !== "all" || searchTerm !== "";

  /* Queries */
  const { data, error, isLoading } = useGetAllStudentFAQResponsesQuery({
    search_term: searchTerm,
    limit,
    offset: limit * (currentPage - 1),
    createdBy: createdByType,
    createdById: selectedPartner,
    access_token,
  });
  const { data: partnersData } = useGetPartnersQuery({ limit: "all", access_token });

  const users = data?.responses ?? [];
  const pagination = data?.pagination ?? { totalPages: 1, totalCount: 0 };

  /* Toggles — exclusive accordion */
  const toggleUser = (id) => {
    setExpandedUser((prev) => (prev === id ? null : id));
    // Collapse all courses when switching users
    setExpandedCourse(null);
  };

  const toggleCourse = (cid, uid) => {
    const key = `${uid}_${cid}`;
    setExpandedCourse((prev) => (prev === key ? null : key));
  };

  const handlePageChange = (page) => setCurrentPage(page);

  const clearFilters = () => {
    setSearchTerm("");
    setCreatedByType("all");
    setSelectedPartner("");
    setCurrentPage(1);
  };

  if (isLoading) return <AdminLoader message="Loading FAQ responses…" />;

  if (error)
    return (
      <div className="text-center py-12 text-red-500">Error fetching data!</div>
    );

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen bg-white">

      {/* ════ HEADER — matches Users / Payments exactly ═════ */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 py-4">

          {/* Mobile Header */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent text-center flex-1 mx-2">
                FAQ Responses
              </h1>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-2 p-2 border text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            {role !== "partner" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors flex-1 justify-center"
                >
                  <Filter size={16} />
                  <span className="font-medium text-sm">Filters</span>
                  {showFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                  FAQ Response Management
                </h1>
                <p className="text-gray-600 mt-1">Manage and review student FAQ responses</p>
              </div>

              <div className="flex items-center gap-3">
                {role !== "partner" && (
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                  >
                    <Filter size={18} />
                    <span className="font-medium">Filters</span>
                    {showFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="font-medium">Back</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel — matches Users / Payments */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showFilter ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-4 bg-lightGreen/20 rounded-lg border border-leafGreen/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute top-3 left-3 text-gray-400"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="search"
                      placeholder="Search by student, course or question..."
                      className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                {/* Created By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created By Type
                  </label>
                  <select
                    value={createdByType}
                    onChange={(e) => {
                      setCreatedByType(e.target.value);
                      setSelectedPartner("");
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="admin">Admin</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>

                {/* Partner */}
                {createdByType === "partner" && partnersData?.partners && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partner
                    </label>
                    <select
                      value={selectedPartner}
                      onChange={(e) => {
                        setSelectedPartner(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    >
                      <option value="">All Partners</option>
                      {partnersData.partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={clearFilters}
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

      {/* ════ MAIN CONTENT ═══════════════════════════════════ */}
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

          {/* Empty state */}
          {users.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <div className="text-gray-500 text-lg font-medium mb-2">
                No FAQ responses found
              </div>
              <p className="text-gray-400">
                {searchTerm ? "Try adjusting your search criteria" : "No responses submitted yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user, uIdx) => {
                const courses = toCourseArray(user.courses);
                const isOpen = expandedUser === user.id;
                const totalQ = courses.reduce(
                  (s, c) => s + (Array.isArray(c.questions) ? c.questions.length : 0),
                  0
                );

                return (
                  <React.Fragment key={user.id}>
                    {/* User row */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: uIdx * 0.025 }}
                      className="hover:bg-lightGreen/10 transition-colors duration-200 cursor-pointer"
                      onClick={() => toggleUser(user.id)}
                    >
                      <div className="flex items-center gap-4 px-4 sm:px-6 py-4">
                        {/* Chevron */}
                        <div className="flex-shrink-0">
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-leafGreen" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0 w-9 h-9 bg-leafGreen rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {initials(user.name) || "?"}
                        </div>

                        {/* Name + email */}
                        <div className="flex-1 min-w-0 grid">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{user.email}</div>
                        </div>

                        {/* Meta */}
                        <div className="hidden sm:flex items-center gap-4 flex-shrink-0 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-leafGreen" />
                            <span className="font-medium text-gray-700">{courses.length}</span>
                            {courses.length === 1 ? "Course" : "Courses"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-leafGreen" />
                            <span className="font-medium text-gray-700">{totalQ}</span>
                            {totalQ === 1 ? "Answer" : "Answers"}
                          </span>
                        </div>

                        {/* Mobile meta */}
                        <div className="sm:hidden flex-shrink-0 text-xs text-gray-500">
                          {courses.length}C · {totalQ}A
                        </div>
                      </div>
                    </motion.div>

                    {/* Expanded courses */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-6 py-4 bg-lightGreen/10 border-t border-gray-100 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700">Course FAQs</h4>
                            {courses.length === 0 ? (
                              <p className="text-sm text-gray-400">No enrolled courses with FAQ responses</p>
                            ) : (
                              courses.map((course) => (
                                <CourseBlock
                                  key={course.id}
                                  course={course}
                                  isOpen={expandedCourse === `${user.id}_${course.id}`}
                                  onToggle={() => toggleCourse(course.id, user.id)}
                                />
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* ════ PAGINATION — matches Users / Payments exactly ═ */}
          {pagination.totalCount > 10 && (
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-lightGreen/20">
              {/* Mobile Pagination */}
              <div className="md:hidden">
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-sm text-gray-600 text-center">
                    Page {currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Responses per page:</label>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    >
                      {limitOptions.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between w-full max-w-xs">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Next
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, pagination.totalCount)} of {pagination.totalCount}
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
                    <label className="text-sm font-medium text-gray-700">Responses per page:</label>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    >
                      {limitOptions.map((o) => (
                        <option key={o} value={o}>{o}</option>
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
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          currentPage === page
                            ? "bg-leafGreen text-white"
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
          )}

        </div>
      </div>
    </div>
  );
}