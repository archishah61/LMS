/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetUserCoursesQuery } from '../../services/Enrollment/enrollAPI';
import CourseList from '../../components/student/StudentCourses';
import { BookOpen, ChevronRight, Calendar, List, LayoutGrid, GraduationCap, Sparkles, Search } from 'lucide-react';
import { useGetCoursesQuery } from '../../services/Course_Management/courseApi';
import RecommendedCourses from '../../components/student/RecommendedCourses';
import { getStudentToken } from '../../services/CookieService';
import PrimaryLoader from '../../components/ui/PrimaryLoader';

function StudentDashboard() {
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const {
    data: coursesData,
    isLoading: coursesLoading,
    isError: coursesError,
  } = useGetCoursesQuery({ limit: "all" }, {
    skip: !user.id
  });

  const [allCourses, setAllCourses] = useState([]);

  const { access_token } = getStudentToken();

  useEffect(() => {
    if (!user.id && !access_token) {
      navigate("/");
    }
  }, [user, navigate, access_token]);

  useEffect(() => {
    if (coursesData?.data) {
      setAllCourses(coursesData?.data);
    }
  }, [coursesData?.data]);

  // Show loader while waiting for user state to hydrate from token
  if ((!user.id && access_token) || coursesLoading) {
    return <PrimaryLoader />;
  }

  if (!user || coursesError) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center px-4">
        <div className="text-center py-8 max-w-md w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Error loading data</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">Please try again later.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary text-white rounded-full text-sm sm:text-base"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const capitalizeFirstLetter = (string) => {
    return string?.charAt(0).toUpperCase() + string?.slice(1);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="container px-4 xs:px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <section className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <h1 className="text-xl xs:text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">
            Welcome back, {capitalizeFirstLetter(user.username)}!
          </h1>
          <p className="text-primary font-medium text-sm sm:text-base md:text-lg lg:text-xl">
            Ready to continue your learning journey today?
          </p>
        </section>

        {/* Courses Section */}
        <section className="mb-8 sm:mb-10 md:mb-12 lg:mb-14">
          <UserCourses userId={user.id} />
        </section>

        {/* Recommended Courses */}
        {allCourses && allCourses.length > 0 && (
          <section className="mt-8 sm:mt-10 md:mt-12 lg:mt-14">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Recommended For You</h2>
              <button
                onClick={() => navigate('/courses')}
                className="text-primary font-semibold flex items-center transition-colors text-xs sm:text-sm md:text-base self-start xs:self-auto mt-1 xs:mt-0"
              >
                View All <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 sm:ml-1" />
              </button>
            </div>
            <RecommendedCourses userId={user.id} allCourses={allCourses} />
          </section>
        )}
      </main>
    </div>
  );
}

const UserCourses = ({ userId }) => {
  const { access_token } = getStudentToken();
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [activeFilter, setActiveFilter] = useState('in-progress'); // 'in-progress', 'not-started', 'completed'

  const { data: enrolledCourses, isLoading: isLoadingEnrolled } = useGetUserCoursesQuery({ userId, access_token, status: 'all' }, {
    skip: !userId
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (enrolledCourses?.courses) {
      setCourses(enrolledCourses.courses);
    } else {
      setCourses([]);
    }
  }, [enrolledCourses]);

  const filteredCourses = courses.filter(item => {
    const matchesSearch = item.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isCompleted = item.is_completed === 1 || item.is_completed === true;
    
    let matchesFilter = false;
    if (activeFilter === 'completed') {
      matchesFilter = isCompleted;
    } else if (activeFilter === 'in-progress') {
      matchesFilter = !isCompleted;
    }
    
    return matchesSearch && matchesFilter;
  });

  const renderFilterDropdown = (isSmall = false) => {
    const inProgressCount = courses.filter(item => !(item.is_completed === 1 || item.is_completed === true)).length;
    const completedCount = courses.filter(item => item.is_completed === 1 || item.is_completed === true).length;

    return (
      <select
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
        className={`border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-bold text-gray-700 cursor-pointer ${
          isSmall ? 'text-xs px-2 py-1.5' : 'text-sm px-3 py-2'
        }`}
      >
        <option value="in-progress">In Progress ( {inProgressCount} )</option>
        <option value="completed">Completed ( {completedCount} )</option>
      </select>
    );
  };

  if (isLoadingEnrolled) {
    return <PrimaryLoader />;
  }

  return (
    <div>
      {/* Header & Controls */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        {/* Extra small screens (xs: < 475px) - Stacked */}
        <div className="xs:hidden">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <h2 className="text-base font-bold text-gray-900">Enrolled Courses</h2>
                <Sparkles className="w-3.5 h-3.5 text-green-500 animate-pulse" />
              </div>
              {/* View Mode Toggle - Extra Small */}
              <div className="bg-gray-100 p-0.5 rounded flex items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                  aria-label="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'text-gray-500' : 'bg-white shadow-sm text-primary'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 font-medium mb-2">Continue learning</div>
          </div>

          {/* Search & Filter for extra small mobile */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            {renderFilterDropdown(true)}
          </div>
        </div>

        {/* Small screens (xs: 475px+) - Improved layout */}
        <div className="hidden xs:block sm:hidden">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-gray-900">Enrolled Courses</h2>
                <Sparkles className="w-3.5 h-3.5 text-green-500 animate-pulse" />
              </div>
              {/* View Mode Toggle - Small */}
              <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'text-gray-500' : 'bg-white shadow-sm text-primary'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-medium">Continue learning</div>
          </div>

          {/* Search & Filter for small screens */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search enrolled courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            {renderFilterDropdown(false)}
          </div>
        </div>

        {/* Tablet screens (sm: 640px+) */}
        <div className="hidden sm:block md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">Enrolled Courses</h2>
                  <Sparkles className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Continue learning</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Input - Tablet */}
              <div className="relative group">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-32"
                />
              </div>

              {/* Filter Dropdown - Tablet */}
              {renderFilterDropdown(true)}

              {/* View Mode Toggle - Tablet */}
              <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                  aria-label="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'text-gray-500' : 'bg-white shadow-sm text-primary'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Medium screens (md: 768px+) - Desktop-like but smaller */}
        <div className="hidden md:block lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Enrolled Courses</h2>
                  <Sparkles className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Continue learning</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Input - Medium */}
              <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-40"
                />
              </div>

              {/* Filter Dropdown - Medium */}
              {renderFilterDropdown(false)}

              {/* View Mode Toggle - Medium */}
              <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'text-gray-500' : 'bg-white shadow-sm text-primary'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop layout (lg: 1024px+) - Original unchanged */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Enrolled Courses</h2>
                {/* <Sparkles className="w-4 h-4 text-green-500" /> */}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Continue learning</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-44 md:w-48 lg:w-56"
              />
            </div>

            {/* Filter Dropdown - Desktop */}
            {renderFilterDropdown(false)}

            {/* View Mode Toggle */}
            <div className="bg-gray-100 p-1 rounded-lg flex items-center">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'text-gray-500' : 'bg-white shadow-sm text-primary'}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List/Grid */}
      {filteredCourses && filteredCourses.length > 0 ? (
        <CourseList courses={filteredCourses} userId={userId} viewMode={viewMode} />
      ) : (
        <div className="text-center py-8 sm:py-10 md:py-12 lg:py-16 bg-gray-50 rounded-xl md:rounded-2xl border border-dashed border-gray-200 px-4 sm:px-5 md:px-6">
          {courses.length === 0 ? (
            <>
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gray-100 mb-4 sm:mb-5 md:mb-6">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">No courses enrolled yet</h3>
              <p className="text-gray-500 mb-5 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base max-w-md mx-auto">
                Start your learning journey by exploring our course catalog
              </p>
              <button
                onClick={() => navigate('/courses')}
                className="px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-primary text-white rounded-lg text-xs sm:text-sm md:text-base font-medium shadow-sm"
              >
                Browse Courses
              </button>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gray-100 mb-3 sm:mb-4">
                <Search className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-400" />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2">No courses found</h3>
              <p className="text-gray-500 text-xs sm:text-sm md:text-base">
                {searchQuery 
                  ? `No courses match your search for "${searchQuery}"`
                  : `You have no courses in the "${activeFilter === 'in-progress' ? 'In Progress' : 'Completed'}" category.`}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;