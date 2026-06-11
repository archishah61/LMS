import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from "react-hot-toast";
import {
    Plus,
    Edit2,
    Trash2,
    X,
    Filter,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Award,
    Clock,
    CheckCircle2,
    Lock,
    BookOpen,
    Percent,
    Info,
    AlertTriangle,
    Loader2,
    Flag,
    MoreVertical,
    Search,
} from 'lucide-react';
import AdminLoader from '../../../components/admin/AdminLoader';
import {
    useGetTasksByPhaseIdQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useToggleTaskStatusMutation
} from '../../../services/Challenge/challengeTaskAPI';
import PermissionWrapper from "../../../context/PermissionWrapper";

export default function ChallengeTask() {
    const { phaseId } = useLocation().state;
    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        show: false,
        taskId: null,
        taskTitle: ""
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        difficulty: 'All',
        status: 'All'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // RTK Query hooks
    const { data: tasksData, isLoading, refetch } = useGetTasksByPhaseIdQuery({ phaseId, searchTerm: searchQuery, difficulty: filters.difficulty, status: filters.status });
    const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
    const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
    const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
    const [toggleTaskStatus] = useToggleTaskStatusMutation();

    const [formData, setFormData] = useState({
        challenge_phase_id: phaseId,
        title: "",
        description: "",
        difficulty_level: "Moderate",
        qualify_percentage: 0,
        revive_attempt_time: 0,
        is_mandatory: true,
        show_answer: true,
        is_warning: false,
        no_of_warning: 0,
        max_attempts: 3,
        reward_points: 10,
        time_limit: 5,
        dependency_task_id: null,
    });

    const isAnyFilterApplied = () => {
        return (
            filters.difficulty !== "All" ||
            filters.status !== "All" ||
            searchQuery !== ""
        );
    };

    // Filter tasks
    const filteredTasks = React.useMemo(() => {
        if (!tasksData?.data) return [];

        return tasksData.data
        // .filter(task => {
        //     const difficultyMatch = filters.difficulty === 'All' || task.difficulty_level === filters.difficulty;
        //     const statusMatch = filters.status === 'All' ||
        //         (filters.status === 'Active' && task.is_active) ||
        //         (filters.status === 'Inactive' && !task.is_active);
        //     const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase());

        //     return difficultyMatch && statusMatch && searchMatch;
        // });
    }, [tasksData, filters, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleAddTask = () => {
        setEditingTask(null);
        setFormData({
            challenge_phase_id: phaseId,
            title: "",
            description: "",
            difficulty_level: "Moderate",
            qualify_percentage: 0,
            revive_attempt_time: 0,
            is_mandatory: true,
            show_answer: true,
            is_warning: false,
            no_of_warning: 0,
            max_attempts: 3,
            reward_points: 10,
            time_limit: 5,
            dependency_task_id: null,
        });
        setShowForm(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setFormData({
            challenge_phase_id: task.challenge_phase_id,
            title: task.title,
            description: task.description,
            difficulty_level: task.difficulty_level,
            qualify_percentage: task.qualify_percentage,
            revive_attempt_time: task.revive_attempt_time,
            is_mandatory: task.is_mandatory,
            show_answer: task.show_answer,
            is_warning: task.is_warning,
            no_of_warning: task.no_of_warning,
            max_attempts: task.max_attempts,
            reward_points: task.reward_points,
            time_limit: task.time_limit,
            dependency_task_id: task.dependency_task_id,
        });
        setShowForm(true);
    };

    const handleDeleteTask = (task) => {
        setDeleteConfirmation({
            show: true,
            taskId: task.id,
            taskTitle: task.title,
        });
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteTask(deleteConfirmation.taskId).unwrap();
            toast.success("Task deleted successfully!");
            refetch();
            setDeleteConfirmation({ show: false, taskId: null, taskTitle: "" });
        } catch (error) {
            console.error("Failed to delete task:", error);
            toast.error(error?.data?.message || error?.data?.error || "Failed to delete task. Please try again.");
        }
    };

    const handleToggleStatus = async (taskId) => {
        try {
            await toggleTaskStatus(taskId).unwrap();
            toast.success("Task status updated successfully!");
            refetch();
        } catch (error) {
            console.error("Failed to toggle task status:", error);
            toast.error(error?.data?.message || error?.data?.error || "Failed to update task status. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await updateTask({
                    id: editingTask.id,
                    ...formData,
                    revive_attempt_time: formData.revive_attempt_time > 0 ? formData.revive_attempt_time : null
                }).unwrap();
                toast.success("Task updated successfully!");
            } else {
                await createTask(formData).unwrap();
                toast.success("Task created successfully!");
            }
            setShowForm(false);
            refetch();
        } catch (error) {
            console.error("Failed to save task:", error);
            toast.error(error?.data?.message || error?.data?.error || "Failed to save task. Please try again.");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'max_attempts' || name === 'reward_points' || name === 'time_limit' || name === 'revive_attempt_time' || name === 'qualify_percentage'
                ? parseInt(value) || 0
                : value
        }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleManageQuestions = (task) => {
        navigate(`/admin/dashboard/challenges/task/questions`, {
            state: { id: task.id }
        });
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case "Easy":
                return "bg-green-100 text-green-800";
            case "Moderate":
                return "bg-yellow-100 text-yellow-800";
            case "Hard":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-blue-100 text-blue-800";
        }
    };

    const getStatusColor = (isActive) => {
        return isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
    };

    if (isLoading) {
        return <AdminLoader fullScreen={true} message="Loading tasks..." />;
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                <div className="w-full p-4 sm:px-6">
                    {/* Desktop Header */}
                    <div className="hidden sm:flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-forestGreen">
                                Challenge Tasks
                            </h1>
                            <p className="text-gray-600 mt-1 truncate">
                                Manage tasks for this phase
                            </p>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-2 md:gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors sm:px-3"
                            >
                                <Filter size={18} />
                                <span className="font-medium">Filters</span>
                                {showFilters ? (
                                    <ChevronUp size={16} />
                                ) : (
                                    <ChevronDown size={16} />
                                )}
                            </button>

                            <PermissionWrapper section="Challenge Task" action="create">
                                <button
                                    onClick={handleAddTask}
                                    className="bg-leafGreen hover:bg-leafGreen/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                                >
                                    <Plus size={18} />
                                    Add Task
                                </button>
                            </PermissionWrapper>

                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm sm:px-3"
                            >
                                <ArrowLeft size={18} />
                                <span className="font-medium">Back</span>
                            </button>
                        </div>
                    </div>
                    <div className="sm:hidden">
                        {/* Title Row - Centered with back button on right */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-8"></div> {/* Spacer for balance */}
                            <div className="flex-1 text-center">
                                <h1 className="text-xl font-bold text-forestGreen">
                                    Tasks
                                </h1>
                                <p className="text-gray-600 text-sm mt-0.5 truncate">
                                    Manage tasks for this phase
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex border items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        </div>

                        {/* Action Buttons Row - Smaller size */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors flex-1 justify-center text-sm"
                            >
                                <Filter size={16} />
                                <span className="font-medium">Filters</span>
                            </button>

                            <PermissionWrapper section="Challenge Task" action="create">
                                <button
                                    onClick={handleAddTask}
                                    className="bg-leafGreen text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
                                >
                                    <Plus size={16} />
                                    <span>Add</span>
                                </button>
                            </PermissionWrapper>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <Search
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search tasks..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg 
                  placeholder-gray-400 focus:outline-none focus:ring-2 
                  focus:ring-leafGreen focus:border-transparent transition duration-150 ease-in-out"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                    <select
                                        value={filters.difficulty}
                                        onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                    >
                                        <option value="All">All Difficulties</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Moderate">Moderate</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            {isAnyFilterApplied() && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setFilters({
                                                difficulty: 'All',
                                                status: 'All'
                                            })
                                            setSearchQuery("")
                                        }}
                                        className="text-sm text-leafGreen hover:text-leafGreen/80 font-medium"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* List Header - Hidden on mobile */}
                    <div className="hidden lg:block bg-lightGreen px-6 py-3 border-b border-gray-200">
                        <div className="grid grid-cols-12 gap-4 text-xs uppercase font-semibold text-gray-700">
                            <div className="col-span-4">Task Details</div>
                            <div className="col-span-2">Difficulty</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-1">Reward</div>
                            <div className="col-span-3 text-center">Actions</div>
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="divide-y divide-gray-200">
                        {paginatedTasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => handleManageQuestions(task)}
                                className="group px-4 lg:px-6 py-4 hover:bg-lightGreen/20 transition-all duration-200 cursor-pointer"
                            >
                                {/* Mobile Layout */}
                                <div className="lg:hidden">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="flex-shrink-0 w-8 h-8 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                                                <BookOpen size={16} className="text-leafGreen" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 mb-1 transition-colors text-sm">
                                                    {task.title}
                                                </h3>
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                    {task.description || "No description provided"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty_level)}`}
                                            >
                                                {task.difficulty_level}
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.is_active)}`}
                                            >
                                                {task.is_active ? (
                                                    <>
                                                        <CheckCircle2 size={10} />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={10} />
                                                        Inactive
                                                    </>
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Award size={12} className="text-leafGreen" />
                                            <span className="font-semibold text-gray-900 text-xs">{task.reward_points}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                        <Clock size={10} />
                                        <span>{task.time_limit} mins</span>
                                        <span className="mx-1">•</span>
                                        <span>{task.max_attempts} attempts</span>
                                        <span className="mx-1">•</span>
                                        <span>{task.is_mandatory ? "Mandatory" : "Optional"}</span>
                                    </div>

                                    {/* Mobile Action Buttons */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <PermissionWrapper section="Challenge Task" action="edit">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditTask(task);
                                                }}
                                                className="h-7 px-3 py-1 hover:bg-lightGreen/20 rounded-lg flex items-center justify-center text-leafGreen transition-colors text-xs font-medium"
                                                title="Edit Task"
                                            >
                                                <Edit2 size={12} className="mr-1" />
                                                Edit
                                            </button>
                                        </PermissionWrapper>

                                        <PermissionWrapper section="Challenge Task" action="toggle">
                                            <label
                                                className="relative inline-flex items-center cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                                title={task.is_active ? "Deactivate" : "Activate"}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={task.is_active}
                                                    onChange={() => handleToggleStatus(task.id)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                            </label>
                                        </PermissionWrapper>

                                        <PermissionWrapper section="Challenge Task" action="delete">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTask(task);
                                                }}
                                                className="h-7 px-3 py-1 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors text-xs font-medium"
                                                title="Delete Task"
                                            >
                                                <Trash2 size={12} className="mr-1" />
                                                Delete
                                            </button>
                                        </PermissionWrapper>
                                    </div>
                                </div>

                                {/* Desktop Layout - Unchanged */}
                                <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                                    {/* Task Info */}
                                    <div className="col-span-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                                                <BookOpen size={18} className="text-leafGreen" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 transition-colors">
                                                    {task.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                    {task.description || "No description provided"}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                                    <Clock size={12} />
                                                    <span>{task.time_limit} mins</span>
                                                    <span className="mx-1">•</span>
                                                    <span>{task.max_attempts} attempts</span>
                                                    <span className="mx-1">•</span>
                                                    <span>{task.is_mandatory ? "Mandatory" : "Optional"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Difficulty */}
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty_level)}`}
                                            >
                                                {task.difficulty_level}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.is_active)}`}
                                            >
                                                {task.is_active ? (
                                                    <>
                                                        <CheckCircle2 size={12} />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock size={12} />
                                                        Inactive
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Reward Points */}
                                    <div className="col-span-1">
                                        <div className="flex items-center gap-1">
                                            <Award size={14} className="text-leafGreen" />
                                            <span className="font-semibold text-gray-900">{task.reward_points}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-3">
                                        <div className="flex items-center justify-center gap-2 transition-opacity">
                                            <PermissionWrapper section="Challenge Task" action="edit">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditTask(task);
                                                    }}
                                                    className="h-8 w-8 p-0 hover:bg-lightGreen/20 rounded-lg flex items-center justify-center text-leafGreen transition-colors"
                                                    title="Edit Task"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </PermissionWrapper>

                                            <PermissionWrapper section="Challenge Task" action="toggle">
                                                <label
                                                    className="relative inline-flex items-center cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title={task.is_active ? "Deactivate" : "Activate"}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={task.is_active}
                                                        onChange={() => handleToggleStatus(task.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                </label>
                                            </PermissionWrapper>

                                            <PermissionWrapper section="Challenge Task" action="delete">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTask(task);
                                                    }}
                                                    className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </PermissionWrapper>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty state */}
                    {filteredTasks.length === 0 && (
                        <div className="px-4 lg:px-6 py-12 lg:py-16 text-center">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Flag size={20} className="lg:w-6 lg:h-6 text-gray-400" />
                            </div>
                            <div className="text-gray-500 text-base lg:text-lg font-medium mb-2">No tasks found</div>
                            <p className="text-gray-400 text-sm lg:text-base">
                                {searchQuery || filters.difficulty !== 'All' || filters.status !== 'All'
                                    ? "Try adjusting your filters to see more results."
                                    : "Get started by creating your first task."}
                            </p>
                            {(searchQuery || filters.difficulty !== 'All' || filters.status !== 'All') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilters({ difficulty: 'All', status: 'All' });
                                    }}
                                    className="mt-4 px-4 py-2 bg-lightGreen/20 text-forestGreen rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredTasks.length > 0 && totalPages > 1 && (
                        <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-700 text-center lg:text-left">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredTasks.length)} of{" "}
                                    {filteredTasks.length} tasks
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                    ? "bg-leafGreen text-white"
                                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete confirmation modal - Mobile Optimized */}
            {deleteConfirmation.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm mx-auto shadow-2xl">
                        <div className="p-4 sm:p-6">

                            {/* Header with Icon */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Trash2 size={18} className="text-red-600 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Delete Task</h2>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">This action cannot be undone</p>
                                </div>
                                <button
                                    onClick={() => setDeleteConfirmation({ show: false, taskId: null, taskTitle: "" })}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                                >
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                                Are you sure you want to delete "<span className="font-medium">{deleteConfirmation.taskTitle}</span>"?
                            </p>

                            <div className="flex flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() => setDeleteConfirmation({ show: false, taskId: null, taskTitle: "" })}
                                    className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="animate-spin h-4 w-4" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                    <span className="hidden sm:inline"> Task</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Form Modal - Mobile Optimized */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl overflow-hidden w-full max-w-4xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                {editingTask ? "Edit Task" : "Add New Task"}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            <form onSubmit={handleSubmit} id="taskForm" className="space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Title - Full width on mobile, 2/3 on desktop */}
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                            placeholder="Enter task title"
                                        />
                                    </div>

                                    {/* Difficulty - Full width on mobile, 1/3 on desktop */}
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
                                        <select
                                            name="difficulty_level"
                                            value={formData.difficulty_level}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Moderate">Moderate</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none text-sm sm:text-base"
                                        placeholder="Enter task description"
                                    />
                                </div>

                                {/* Points and Settings - Stack on mobile, grid on desktop */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reward Points</label>
                                        <input
                                            type="number"
                                            name="reward_points"
                                            value={formData.reward_points}
                                            onChange={handleInputChange}
                                            // required
                                            min="0"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Attempts *</label>
                                        <input
                                            type="number"
                                            name="max_attempts"
                                            value={formData.max_attempts}
                                            onChange={handleInputChange}
                                            required
                                            min="1"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (mins) *</label>
                                        <input
                                            type="number"
                                            name="time_limit"
                                            value={formData.time_limit}
                                            onChange={handleInputChange}
                                            required
                                            min="1"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualify % *</label>
                                        <input
                                            type="number"
                                            name="qualify_percentage"
                                            value={formData.qualify_percentage}
                                            onChange={handleInputChange}
                                            required
                                            min="35"
                                            max="100"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                        />
                                    </div>
                                </div>

                                {/* Additional Settings */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Revive Time (mins)</label>
                                    <input
                                        type="number"
                                        name="revive_attempt_time"
                                        value={formData.revive_attempt_time}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                    />
                                </div>

                                {/* Checkboxes */}
                                <div className="space-y-3 pt-2">
                                    <div className='grid grid-cols-2'>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="is_mandatory"
                                                name="is_mandatory"
                                                checked={formData.is_mandatory}
                                                onChange={handleCheckboxChange}
                                                className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_mandatory" className="ml-2 block text-sm text-gray-700">
                                                This task is mandatory for completing the challenge
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="show_answer"
                                                name="show_answer"
                                                checked={formData.show_answer}
                                                onChange={handleCheckboxChange}
                                                className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded"
                                            />
                                            <label htmlFor="show_answer" className="ml-2 block text-sm text-gray-700">
                                                Show answers to user in results
                                            </label>
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2'>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="is_warning"
                                                name="is_warning"
                                                checked={formData.is_warning}
                                                onChange={handleCheckboxChange}
                                                className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_warning" className="ml-2 block text-sm text-gray-700">
                                                Restrict Full Screen Exit
                                            </label>
                                        </div>

                                        {Boolean(formData.is_warning) && <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Number Of Warning</label>
                                            <input
                                                type="number"
                                                name="no_of_warning"
                                                value={formData.no_of_warning}
                                                onChange={handleInputChange}
                                                min="0"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                            />
                                        </div>}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="taskForm"
                                disabled={isCreating || isUpdating}
                                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {(isCreating || isUpdating) ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        {editingTask ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    editingTask ? "Update" : "Create"
                                )}
                                <span className="hidden sm:inline"> Task</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}