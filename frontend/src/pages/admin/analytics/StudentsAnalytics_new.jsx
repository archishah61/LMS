import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    useGetEnrolledStudentsQuery,
    useGetStudentEnrollmentsQuery,
    useGetStudentAnalyticsQuery,
    useGetStudentVersionsQuery,
    useGetTopicStrengthAnalysisQuery,
    useGetTimeSpentAnalysisQuery,
    useGetModuleCompletionQuery,
    useGetModulesByCourseQuery,
    useGetTopicsByModuleQuery
} from '../../../services/Ai_performace_tracking/adminStudentPerformanceAnalyticsApi';
import { formatTimeDisplay, secondsToMinutes } from '../../../utils/timeFormatting';
import {
    setSelectedStudent,
    setStudentEnrollments,
    setSelectedCourseId,
    setCurrentAnalytics,
    setAvailableVersions,
    setModules,
    setSelectedModuleId,
    setTopics,
    setSelectedTopicId,
    toggleFilterPanel
} from '../../../features/Ai_performance_tracking/adminStudentPerformanceAnalyticsSlice';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip,
    Legend, ResponsiveContainer, PieChart, Pie,
    Cell, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter
} from 'recharts';
import { User, GraduationCap, Clock, TrendingUp, ClipboardList, Filter, X } from 'lucide-react';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#EC7063', '#5499C7', '#45B39D'];

// Tab panel component
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`student-analytics-tabpanel-${index}`}
            aria-labelledby={`student-analytics-tab-${index}`}
            {...other}
        >
            {value === index && (
                <div className="p-3">
                    {children}
                </div>
            )}
        </div>
    );
}

// Placeholder component for when no student is selected
const NoStudentSelected = () => (
    <div
        className="flex flex-col items-center justify-center h-[60vh] text-center p-4"
    >
        <User size={80} color="#666" className="mb-4" />
        <h5 className="text-lg text-gray-700 mb-2">
            No Student Selected
        </h5>
        <p className="text-gray-600">
            Please select a student from the list to view their performance analytics.
        </p>
    </div>
);

// Loading indicator component
const LoadingIndicator = () => (
    <div className="flex justify-center my-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-leafGreen/20"></div>
    </div>
);

// Main component
function StudentsAnalytics() {
    const dispatch = useDispatch();
    const [currentTab, setCurrentTab] = useState(0);

    // Helper function to ensure consistent time formatting throughout the component
    const formatTime = (timeValue, unit = 'seconds') => {
        if (timeValue === undefined || timeValue === null) return 'N/A';

        // Convert to minutes if the input is in seconds
        const timeInMinutes = unit === 'seconds' ? secondsToMinutes(timeValue) : timeValue;
        return formatTimeDisplay(timeInMinutes);
    };

    // Redux state
    const selectedStudent = useSelector((state) => state.adminStudentPerformanceAnalytics.selectedStudent);
    const studentEnrollments = useSelector((state) => state.adminStudentPerformanceAnalytics.studentEnrollments);
    const selectedCourseId = useSelector((state) => state.adminStudentPerformanceAnalytics.selectedCourseId);
    const currentAnalytics = useSelector((state) => state.adminStudentPerformanceAnalytics.currentAnalytics);
    const availableVersions = useSelector((state) => state.adminStudentPerformanceAnalytics.availableVersions);
    const modules = useSelector((state) => state.adminStudentPerformanceAnalytics.modules);
    const selectedModuleId = useSelector((state) => state.adminStudentPerformanceAnalytics.selectedModuleId);
    const topics = useSelector((state) => state.adminStudentPerformanceAnalytics.topics);
    const selectedTopicId = useSelector((state) => state.adminStudentPerformanceAnalytics.selectedTopicId);
    const isFilterOpen = useSelector((state) => state.adminStudentPerformanceAnalytics.isFilterOpen);

    // State for version filter
    const [selectedVersion, setSelectedVersion] = useState('latest');

    // Helper function to extract and normalize summary metrics from analytics data
    const extractSummaryMetrics = () => {
        if (!currentAnalytics || !currentAnalytics.data) return null;

        // Calculate metrics from moduleAnalysis if available
        const moduleAnalysis = currentAnalytics.data.moduleAnalysis || [];

        if (moduleAnalysis.length > 0) {
            // Calculate average module score
            const totalScore = moduleAnalysis.reduce((sum, module) => sum + (module.latestScore || 0), 0);
            const averageScore = moduleAnalysis.length > 0 ? Math.round(totalScore / moduleAnalysis.length) : 0;

            // Count total strong and weak topics
            let strongTopicsCount = 0;
            let weakTopicsCount = 0;

            moduleAnalysis.forEach(module => {
                strongTopicsCount += module.versions?.[module.versions ? Object.keys(module.versions)[0] : '']?.strongTopicsCount || 0;
                weakTopicsCount += module.versions?.[module.versions ? Object.keys(module.versions)[0] : '']?.weakTopicsCount || 0;
            });

            // Calculate total time spent from module data directly
            let totalMinutes = 0;
            moduleAnalysis.forEach(module => {                                                                    // Check if module has direct time spent data (in seconds)
                if (module.timeSpent !== undefined) {
                    totalMinutes += secondsToMinutes(module.timeSpent || 0);
                } else if (module.studentTimeSpent !== undefined) {
                    // Alternative field name in some API responses (in seconds)
                    totalMinutes += secondsToMinutes(module.studentTimeSpent || 0);
                } else {
                    // Fall back to calculating from topic data if available
                    Object.values(module.topicScores || {}).forEach(topicScores => {
                        topicScores.forEach(topic => {
                            totalMinutes += secondsToMinutes(topic.timeSpent || 0);
                        });
                    });
                }
            });

            // Format time based on minutes
            const totalTimeSpent = formatTimeDisplay(totalMinutes); // totalMinutes is already in minutes

            return {
                averageModuleScore: averageScore,
                strongTopicsCount,
                weakTopicsCount,
                totalTimeSpent
            };
        }

        return null;
    };

    // Fetch enrolled students
    const {
        data: enrolledStudentsData,
        isLoading: isLoadingStudents,
        error: enrolledStudentsError
    } = useGetEnrolledStudentsQuery({});

    // Fetch student enrollments when a student is selected
    const {
        data: studentEnrollmentsData,
        isLoading: isLoadingEnrollments
    } = useGetStudentEnrollmentsQuery(selectedStudent?.id, {
        skip: !selectedStudent
    });

    // Fetch student analytics when a student and course are selected
    const {
        data: studentAnalyticsData,
        isLoading: isLoadingAnalytics
    } = useGetStudentAnalyticsQuery({
        studentId: selectedStudent?.id,
        courseId: selectedCourseId,
        moduleId: selectedModuleId,
        topicId: selectedTopicId,
        version: selectedVersion
    }, {
        skip: !selectedStudent || isLoadingEnrollments
    });

    // Fetch available versions for the selected student
    const {
        data: versionsData,
        isLoading: isLoadingVersions
    } = useGetStudentVersionsQuery({
        studentId: selectedStudent?.id,
        courseId: selectedCourseId,
        moduleId: selectedModuleId
    }, {
        skip: !selectedStudent
    });

    // Fetch topic strength analysis
    const {
        data: topicStrengthData,
        isLoading: isLoadingTopics
    } = useGetTopicStrengthAnalysisQuery({
        studentId: selectedStudent?.id,
        courseId: selectedCourseId,
        moduleId: selectedModuleId,
        topicId: selectedTopicId,
        version: selectedVersion
    }, {
        skip: !selectedStudent || !selectedCourseId
    });

    // Fetch time spent analysis
    const {
        data: timeSpentData,
        isLoading: isLoadingTimeSpent
    } = useGetTimeSpentAnalysisQuery({
        studentId: selectedStudent?.id,
        courseId: selectedCourseId,
        moduleId: selectedModuleId,
        topicId: selectedTopicId,
        version: selectedVersion
    }, {
        skip: !selectedStudent || !selectedCourseId
    });

    // Fetch modules for the selected course
    const {
        data: modulesData,
        isLoading: isLoadingModules
    } = useGetModulesByCourseQuery(selectedCourseId, {
        skip: !selectedCourseId
    });

    // Fetch topics for the selected module
    const {
        data: topicsData,
        isLoading: isLoadingTopicsData
    } = useGetTopicsByModuleQuery(selectedModuleId, {
        skip: !selectedModuleId
    });

    // Fetch module completion data
    const {
        data: moduleCompletionData,
        isLoading: isLoadingModuleCompletion
    } = useGetModuleCompletionQuery({
        studentId: selectedStudent?.id,
        courseId: selectedCourseId
    }, {
        skip: !selectedStudent || !selectedCourseId
    });

    // Update student enrollments when data is fetched
    useEffect(() => {
        if (studentEnrollmentsData) {
            dispatch(setStudentEnrollments(studentEnrollmentsData.enrollments));
        }
    }, [studentEnrollmentsData, dispatch]);

    // Update analytics data when fetched
    useEffect(() => {
        if (studentAnalyticsData) {
            dispatch(setCurrentAnalytics(studentAnalyticsData));
        }
    }, [studentAnalyticsData, dispatch]);

    // Update available versions when fetched
    useEffect(() => {
        if (versionsData) {
            dispatch(setAvailableVersions(versionsData.availableVersions));
        }
    }, [versionsData, dispatch]);

    // Update modules when fetched
    useEffect(() => {
        if (modulesData) {
            dispatch(setModules(modulesData.modules));
        }
    }, [modulesData, dispatch]);

    // Update topics when fetched
    useEffect(() => {
        if (topicsData) {
            dispatch(setTopics(topicsData.topics));
        } else {
            dispatch(setTopics([]));
        }
    }, [topicsData, dispatch]);

    // Handle student selection
    const handleStudentSelect = (student) => {
        dispatch(setSelectedStudent(student));
        dispatch(setSelectedCourseId(null));
        dispatch(setSelectedModuleId(null));
        dispatch(setSelectedTopicId(null));
        setSelectedVersion('latest');
    };

    // Handle course selection
    const handleCourseSelect = (event) => {
        const courseId = event.target.value ? parseInt(event.target.value) : null;
        dispatch(setSelectedCourseId(courseId));
        dispatch(setSelectedModuleId(null));
        dispatch(setSelectedTopicId(null));
        setSelectedVersion('latest'); // Reset version when course changes
    };

    // Handle module selection
    const handleModuleSelect = (event) => {
        const moduleId = event.target.value ? parseInt(event.target.value) : null;
        dispatch(setSelectedModuleId(moduleId));
        dispatch(setSelectedTopicId(null));
    };

    // Handle topic selection
    const handleTopicSelect = (event) => {
        const topicId = event.target.value ? parseInt(event.target.value) : null;
        dispatch(setSelectedTopicId(topicId));
    };

    // Toggle filter panel
    const handleToggleFilter = () => {
        dispatch(toggleFilterPanel());
    };

    // Handle version selection
    const handleVersionSelect = (event) => {
        setSelectedVersion(event.target.value);
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    // If there's an error loading students
    if (enrolledStudentsError) {
        return (
            <div className="p-3">
                <h6 className="text-red-600">
                    Error loading student data: {enrolledStudentsError.message || 'Unknown error'}
                </h6>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Left sidebar - Student list */}
            <div className="md:col-span-1">
                <div className="bg-white shadow-md rounded-lg p-4 h-full">
                    <h6 className="text-lg font-semibold mb-3">
                        Enrolled Students
                    </h6>
                    <div className="border-b mb-3"></div>

                    {isLoadingStudents ? (
                        <LoadingIndicator />
                    ) : (
                        <div className="max-h-[70vh] overflow-auto">
                            {enrolledStudentsData?.students?.map((student) => (
                                <div
                                    key={student.id}
                                    className={`flex items-center p-3 mb-2 rounded-lg cursor-pointer 
                                        ${selectedStudent?.id === student.id ? 'bg-lightGreen' : ''}
                                        hover:bg-gray-100
                                    `}
                                    onClick={() => handleStudentSelect(student)}
                                >
                                    <img
                                        src={student.profileImage || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                                        alt={student.name}
                                        className="w-10 h-10 rounded-full mr-3"
                                    />
                                    <div>
                                        <p className={`text-sm font-medium ${selectedStudent?.id === student.id ? 'text-forestGreen' : 'text-gray-800'}`}>
                                            {student.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {student.email}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {student.enrollments.length} course{student.enrollments.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {enrolledStudentsData?.students?.length === 0 && (
                                <p className="text-center text-gray-500 text-sm mt-2">
                                    No enrolled students found.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main content - Student analytics */}
            <div className="md:col-span-2">
                {!selectedStudent ? (
                    <NoStudentSelected />
                ) : (
                    <>
                        {/* Student header with filter icon */}
                        <div className="bg-white shadow-md rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                    <img
                                        src={selectedStudent.profileImage || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                                        alt={selectedStudent.name}
                                        className="w-14 h-14 rounded-full mr-4"
                                    />
                                    <div>
                                        <h5 className="text-xl font-semibold">
                                            {selectedStudent.name}
                                        </h5>
                                        <p className="text-sm text-gray-500">
                                            {selectedStudent.email}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {studentEnrollments.length} enrolled course{studentEnrollments.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleToggleFilter}
                                    className={`p-2 rounded-full ${isFilterOpen ? 'bg-lightGreen text-forestGreen' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    title="Filter analytics"
                                >
                                    {isFilterOpen ? <X size={20} /> : <Filter size={20} />}
                                </button>
                            </div>

                            {/* Stepwise filter panel */}
                            {isFilterOpen && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                                    <h6 className="text-sm font-medium text-gray-700 mb-2">Filter Analytics</h6>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                        {/* Course dropdown */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Course
                                            </label>
                                            <select
                                                value={selectedCourseId || ''}
                                                onChange={handleCourseSelect}
                                                className="block w-full p-2 text-sm border rounded-md shadow-sm focus:ring focus:ring-leafGreen"
                                                disabled={isLoadingEnrollments}
                                            >
                                                <option value="">
                                                    All Courses
                                                </option>
                                                {studentEnrollments.map((enrollment) => (
                                                    <option key={enrollment.courseId} value={enrollment.courseId}>
                                                        {enrollment.courseTitle}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Module dropdown - enabled only when course is selected */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Module
                                            </label>
                                            <select
                                                value={selectedModuleId || ''}
                                                onChange={handleModuleSelect}
                                                className="block w-full p-2 text-sm border rounded-md shadow-sm focus:ring focus:ring-leafGreen"
                                                disabled={!selectedCourseId || isLoadingModules}
                                            >
                                                <option value="">
                                                    All Modules
                                                </option>
                                                {modules.map((module) => (
                                                    <option key={module.id} value={module.id}>
                                                        {module.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Version dropdown */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Version
                                            </label>
                                            <select
                                                value={selectedVersion}
                                                onChange={handleVersionSelect}
                                                className="block w-full p-2 text-sm border rounded-md shadow-sm focus:ring focus:ring-leafGreen"
                                                disabled={isLoadingVersions || !selectedModuleId}
                                            >
                                                <option value="latest">Latest Only</option>
                                                {availableVersions?.map((v) => (
                                                    <option
                                                        key={`${v.moduleId}-${v.version}`}
                                                        value={v.version}
                                                    >
                                                        Version {v.version} {v.isCurrent && '(Current)'} - {new Date(v.created_at).toLocaleDateString()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Topic dropdown - enabled only when module is selected */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Topic
                                            </label>
                                            <select
                                                value={selectedTopicId || ''}
                                                onChange={handleTopicSelect}
                                                className="block w-full p-2 text-sm border rounded-md shadow-sm focus:ring focus:ring-leafGreen"
                                                disabled={!selectedModuleId || isLoadingTopicsData}
                                            >
                                                <option value="">
                                                    All Topics
                                                </option>
                                                {topics.map((topic) => (
                                                    <option key={topic.id} value={topic.id}>
                                                        {topic.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Analytics tabs */}
                        <div className="bg-white shadow-md rounded-lg mb-4">
                            <div className="flex border-b">
                                <button
                                    className={`flex-1 py-3 text-center text-sm font-medium rounded-t-lg 
                                        ${currentTab === 0 ? 'bg-lightGreen text-forestGreen' : 'text-gray-600 hover:bg-gray-100'}`}
                                    onClick={(e) => handleTabChange(e, 0)}
                                >
                                    <span className="flex items-center justify-center">
                                        <TrendingUp size={16} className="mr-1" />
                                        Performance Overview
                                    </span>
                                </button>
                                <button
                                    className={`flex-1 py-3 text-center text-sm font-medium rounded-t-lg
                                        ${currentTab === 1 ? 'bg-lightGreen text-forestGreen' : 'text-gray-600 hover:bg-gray-100'}`}
                                    onClick={(e) => handleTabChange(e, 1)}
                                >
                                    <span className="flex items-center justify-center">
                                        <GraduationCap size={16} className="mr-1" />
                                        Topic & Skill
                                    </span>
                                </button>
                                <button
                                    className={`flex-1 py-3 text-center text-sm font-medium rounded-t-lg
                                        ${currentTab === 2 ? 'bg-lightGreen text-forestGreen' : 'text-gray-600 hover:bg-gray-100'}`}
                                    onClick={(e) => handleTabChange(e, 2)}
                                >
                                    <span className="flex items-center justify-center">
                                        <Clock size={16} className="mr-1" />
                                        Time Analysis
                                    </span>
                                </button>
                                <button
                                    className={`flex-1 py-3 text-center text-sm font-medium rounded-t-lg
                                        ${currentTab === 3 ? 'bg-lightGreen text-forestGreen' : 'text-gray-600 hover:bg-gray-100'}`}
                                    onClick={(e) => handleTabChange(e, 3)}
                                >
                                    <span className="flex items-center justify-center">
                                        <ClipboardList size={16} className="mr-1" />
                                        Module Completion
                                    </span>
                                </button>
                            </div>

                            {/* Rest of the existing content follows - tabs content */}

                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default StudentsAnalytics;
