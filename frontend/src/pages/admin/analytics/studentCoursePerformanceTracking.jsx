/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import CoursesAnalytics from './CoursesAnalytics';
import StudentsAnalytics from './StudentsAnalytics';
import { ArrowLeft } from 'lucide-react';
import { useGetAdminCoursesQuery } from '../../../services/Course_Management/courseApi';
import { getAdminToken } from '../../../services/CookieService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function StudentCoursePerformanceTracking() {
    // Get user role and id from redux store
    const { role, id: userId } = useSelector((state) => state.user || { role: null, id: null })

    const navigate = useNavigate();

    const { access_token } = getAdminToken();

    const [activeTab, setActiveTab] = useState('courses');

    const [selectedCourse, setSelectedCourse] = useState("all")
    // State for creator type filter (admin, partner, all)
    const [creatorTypeFilter, setCreatorTypeFilter] = useState("all")

    const {
        data: coursesData, isLoading: loading, error, refetch: refetchCourses
    } = useGetAdminCoursesQuery({ limit: "all", access_token, creatorType: creatorTypeFilter })

    // Re-fetch whenever creatorTypeFilter changes
    useEffect(() => {
        if (creatorTypeFilter) refetchCourses();
    }, [creatorTypeFilter, refetchCourses]);

    const tabList = [
        { key: 'courses', label: 'Courses' },
        { key: 'students', label: 'Students' }
    ];

    const handleCourseChange = (e) => {
        setSelectedCourse(e.target.value)
    }

    // Handler for creator type filter changes
    const handleCreatorTypeChange = (e) => {
        setCreatorTypeFilter(e.target.value)
        // Reset course selection to "all" when changing creator type filter
        setSelectedCourse("all")
    }

    return (
        <div className="flex flex-col h-screen w-screen md:w-[calc(100vw-80px)] bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="w-full p-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 mx-2">
                            <h1 className="text-xl text-center md:text-start md:text-2xl font-bold  text-forestGreen">
                                {activeTab === 'students' ? "Student Analytics" : "Course Selection"}{activeTab === 'students' && <span className='hidden sm:inline'> Dashboard</span>}
                            </h1>
                            <p className="text-sm text-center md:text-start md:text-md text-gray-600 mt-1">
                                {activeTab === 'students' ? "Comprehensive performance insights and learning analytics" : "Choose a course to analyze or view all courses"}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            {role == "admin" && activeTab === 'courses' && (
                                <div className="hidden sm:inline-flex flex gap-4">
                                    <select
                                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                        value={creatorTypeFilter}
                                        onChange={handleCreatorTypeChange}
                                    >
                                        <option value="all">All</option>
                                        <option value="admin">Admin</option>
                                        <option value="partner">Partner</option>
                                    </select>

                                    <select
                                        className="flex items-center gap-2 px-4 py-2 truncate max-w-[180px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                        value={selectedCourse}
                                        onChange={handleCourseChange}
                                    >
                                        <option value="all">🌟 All Courses Overview</option>
                                        {coursesData?.data?.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                📚 {course.title}
                                            </option>
                                        ))}
                                    </select>

                                </div>
                            )}

                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={18} />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        </div>
                    </div>
                    {role == "admin" && activeTab === 'courses' && (
                        <div className="sm:hidden flex justify-between gap-4">
                            <select
                                className="flex w-full items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                value={creatorTypeFilter}
                                onChange={handleCreatorTypeChange}
                            >
                                <option value="all">All</option>
                                <option value="admin">Admin</option>
                                <option value="partner">Partner</option>
                            </select>

                            <select
                                className="flex w-full items-center gap-2 px-4 py-2 truncate max-w-[180px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                value={selectedCourse}
                                onChange={handleCourseChange}
                            >
                                <option value="all">All Courses</option>
                                {coursesData?.data?.map((course) => (
                                    <option key={course.id} value={course.id}>
                                        📚 {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div
                className="
        flex border-b border-gray-200 space-x-1 bg-gray-100 p-1 sm:pl-6 
        sticky top-0 z-10 
        overflow-x-auto whitespace-nowrap custom-scrollbar
      "
            >
                {tabList.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === tab.key
                            ? "text-indigo-600 border-b-2 border-indigo-600"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {activeTab === 'courses' && <CoursesAnalytics selectedCourse={selectedCourse} />}
                {activeTab === 'students' && <StudentsAnalytics />}
            </div>

            <style global>{`
            .custom-scrollbar {
                scrollbar-width: none; /* Firefox */
                -ms-overflow-style: none; /* Internet Explorer 10+ */
            }

            .custom-scrollbar::-webkit-scrollbar {
                width: 0;
                height: 0;
                display: none; /* Safari and Chrome */
            }
            `}</style>
        </div>
    );
}

export default StudentCoursePerformanceTracking; 