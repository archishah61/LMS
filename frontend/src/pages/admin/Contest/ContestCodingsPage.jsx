"use client";

import { useState } from "react";
import AdminLoader from "../../../components/admin/AdminLoader";
import {
    Plus,
    Edit2,
    Trash2,
    X,
    BookOpen,
    Clock,
    Target,
    Trophy,
    Calendar,
    Filter,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    FileText,
    AlertCircle,
    Code,
    HardDrive,
    Award,
    Zap,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    useGetContestCodingByActivityQuery,
    useDeleteContestCodingMutation,
    useToggleContestCodingStatusMutation,
} from "../../../services/Contest/contestCodingAPI";
import toast from "react-hot-toast";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { slugify } from "../../../utils/slugify";

const ContestCodingsPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { activity_id, activity } = state || {};

    const [sortBy, setSortBy] = useState("createdAt");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterDifficulty, setFilterDifficulty] = useState("all");

    const isAnyFilterApplied = () => {
        return filterStatus !== "all" || sortBy !== "createdAt" || filterDifficulty !== "all";
    }

    const {
        data: apiResponse,
        isLoading,
        error,
        refetch,
    } = useGetContestCodingByActivityQuery(activity_id);

    const [deleteContestCoding] = useDeleteContestCodingMutation();
    const [toggleContestCodingStatus] = useToggleContestCodingStatusMutation();

    const codings = apiResponse?.data || [];

    const [showFilters, setShowFilters] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        show: false,
        id: null,
        title: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(null);

    const difficultyColors = {
        easy: "bg-green-100 text-green-700",
        medium: "bg-yellow-100 text-yellow-700",
        hard: "bg-red-100 text-red-700",
    };

    const handleAddCoding = () => {
        navigate(`/admin/dashboard/contests/activity/${slugify(activity?.title)}/coding/create`, {
            state: { activity_id },
        });
    };

    const handleEditCoding = (coding) => {
        navigate(`/admin/dashboard/contests/activity/${slugify(activity?.title)}/coding/update`, {
            state: { coding_id: coding?.id, activity_id },
        });
        setMobileMenuOpen(null);
    };

    const handleDeleteCoding = (coding) => {
        setDeleteConfirmation({
            show: true,
            id: coding.id,
            title: coding.problem_statement.substring(0, 50) + "...",
        });
        setMobileMenuOpen(null);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteContestCoding(deleteConfirmation.id).unwrap();
            refetch();
            setDeleteConfirmation({ show: false, id: null, title: "" });
            toast.success("Coding Challenge Deleted Successfully");
        } catch (error) {
            console.error("Failed to delete coding challenge:", error);
            toast.error(
                error?.data?.error ||
                "Failed to delete coding challenge. Please try again."
            );
        }
    };

    const handleToggleStatus = async (codingId) => {
        try {
            await toggleContestCodingStatus(codingId).unwrap();
            refetch();
            toast.success("Coding Challenge Status Updated Successfully");
        } catch (error) {
            console.error("Failed to toggle coding status:", error);
            toast.error(
                error?.data?.error ||
                "Failed to update coding challenge status. Please try again."
            );
        }
    };

    const handleCodingClick = (coding) => {
        navigate(`/admin/dashboard/contests/activity/${slugify(activity?.title)}/coding/update`, {
            state: { coding_id: coding?.id, activity_id },
        });
    };

    const filteredCodings = codings
        .filter((coding) => {
            if (filterStatus !== "all") {
                if (filterStatus === "active" && !coding.is_active) return false;
                if (filterStatus === "inactive" && coding.is_active) return false;
            }
            if (filterDifficulty !== "all" && coding.difficulty_level !== filterDifficulty) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "createdAt")
                return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === "difficulty") {
                const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
                return difficultyOrder[a.difficulty_level] - difficultyOrder[b.difficulty_level];
            }
            if (sortBy === "title") return a.problem_statement.localeCompare(b.problem_statement);
            return 0;
        });

    const totalPages = Math.ceil(filteredCodings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCodings = filteredCodings.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (isLoading) {
        return <AdminLoader fullScreen={true} message="Loading coding challenges..." />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <X size={48} className="mx-auto" />
                    </div>
                    <p className="text-gray-600 mb-4">Failed to load coding challenges</p>
                    <button
                        onClick={() => refetch()}
                        className="bg-leafGreen   text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                <div className="w-full p-4 sm:px-6">
                    {/* Desktop Header */}
                    <div className="hidden sm:flex items-center justify-between">
                        <div className="flex-1 grid min-w-0">
                            <h1 className="text-2xl font-bold  text-forestGreen">
                                Coding Management
                            </h1>
                            <p className="text-gray-600 mt-1 truncate">
                                Manage coding problems for "{activity?.title || "Activity"}"
                            </p>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-2 md:gap-3">
                            {/* <button
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
                            </button> */}

                            <PermissionWrapper section="Contest Coding" action="create">
                                <button
                                    onClick={handleAddCoding}
                                    className=" bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                                >
                                    <Plus size={18} />
                                    Add
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

                    {/* Mobile Header */}
                    <div className="sm:hidden">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-8"></div>
                            <div className="flex-1 grid text-center">
                                <h1 className="text-xl font-bold  text-forestGreen">
                                    Coding Challenges
                                </h1>
                                <p className="text-gray-600 text-sm mt-0.5 truncate">
                                    For "{activity?.title || "Activity"}"
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex border items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors flex-1 justify-center text-sm"
                            >
                                <Filter size={16} />
                                <span className="font-medium">Filters</span>
                            </button> */}

                            <PermissionWrapper section="Contest Coding" action="create">
                                <button
                                    onClick={handleAddCoding}
                                    className=" bg-leafGreen   text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                    >
                                        <option value="createdAt">Newest First</option>
                                        <option value="difficulty">By Difficulty</option>
                                        <option value="title">By Problem Title</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Difficulty
                                    </label>
                                    <select
                                        value={filterDifficulty}
                                        onChange={(e) => setFilterDifficulty(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                    >
                                        <option value="all">All Difficulties</option>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                            {isAnyFilterApplied() && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setFilterStatus("all");
                                            setSortBy("createdAt");
                                            setFilterDifficulty("all");
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

            {/* Main content */}
            <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-0">
                    {/* List Header - Hidden on mobile */}
                    <div className="hidden sm:block bg-lightGreen px-6 py-3 border-b border-gray-200">
                        <div className="grid grid-cols-12 gap-4 text-xs uppercase font-semibold text-gray-700">
                            <div className="col-span-4">Problem Details</div>
                            <div className="col-span-2">Time / Memory</div>
                            <div className="col-span-2">Difficulty</div>
                            <div className="col-span-1">Languages</div>
                            <div className="col-span-1">Status</div>
                            <div className="col-span-2 text-center">Actions</div>
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="divide-y divide-gray-200">
                        {paginatedCodings.map((coding) => (
                            <div
                                key={coding.id}
                                onClick={() => handleCodingClick(coding)}
                                className="group px-3 sm:px-6 py-3 sm:py-5 hover:bg-lightGreen/20 transition-all duration-200 cursor-pointer min-w-0"
                            >
                                {/* Mobile View */}
                                <div className="sm:hidden">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <div className="flex-shrink-0 w-8 h-8 bg-lightGreen rounded-lg flex items-center justify-center mt-0.5">
                                                <Code size={14} className="text-forestGreen" />
                                            </div>
                                            <div className="flex-1 grid">
                                                <h3 className="font-semibold text-gray-900 truncate mb-1 group-hover:text-forestGreen transition-colors text-sm">
                                                    {coding.problem_statement.substring(0, 60)}...
                                                </h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full inline-block w-fit ${difficultyColors[coding.difficulty_level]}`}>
                                                    {coding.difficulty_level}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mobile Menu Button */}
                                        <div className="relative flex-shrink-0 ml-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMobileMenuOpen(mobileMenuOpen === coding.id ? null : coding.id);
                                                }}
                                                className="h-7 w-7 p-0 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                                            >
                                                <MoreVertical size={14} />
                                            </button>

                                            {/* Mobile Dropdown Menu */}
                                            {mobileMenuOpen === coding.id && (
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1">
                                                    <PermissionWrapper section="Contest Coding" action="edit">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditCoding(coding);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-lightGreen/20 flex items-center gap-2"
                                                        >
                                                            <Edit2 size={12} />
                                                            Edit Challenge
                                                        </button>
                                                    </PermissionWrapper>
                                                    <PermissionWrapper section="Contest Coding" action="toggle">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleStatus(coding.id);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-lightGreen/20 flex items-center gap-2"
                                                        >
                                                            <Zap size={12} />
                                                            {coding.is_active ? "Deactivate" : "Activate"}
                                                        </button>
                                                    </PermissionWrapper>
                                                    <PermissionWrapper section="Contest Coding" action="delete">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteCoding(coding);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={12} />
                                                            Delete Challenge
                                                        </button>
                                                    </PermissionWrapper>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <Clock size={12} className="text-gray-500 flex-shrink-0" />
                                                <span className="text-gray-700 truncate">
                                                    {coding.time_limit_seconds}s
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <HardDrive size={12} className="text-gray-500 flex-shrink-0" />
                                                <span className="text-gray-700 truncate">
                                                    {coding.memory_limit_mb} MB
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <Code size={12} className="text-gray-500 flex-shrink-0" />
                                                <span className="text-gray-700 truncate">
                                                    {coding.allowed_languages?.join(", ")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <Award size={12} className="text-leafGreen flex-shrink-0" />
                                                <span className="text-gray-700 truncate">
                                                    Points: {coding.points_reward || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Calendar size={10} />
                                            <span className="text-xs">
                                                {new Date(coding.createdAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PermissionWrapper section="Contest Coding" action="toggle">
                                                <label
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="relative inline-flex items-center cursor-pointer"
                                                    title={coding.is_active ? "Deactivate" : "Activate"}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={coding.is_active}
                                                        onChange={() => handleToggleStatus(coding.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-7 h-4 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-3"></div>
                                                </label>
                                            </PermissionWrapper>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop View */}
                                <div className="hidden sm:grid sm:grid-cols-12 gap-4 items-center">
                                    <div className="col-span-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 bg-lightGreen rounded-lg flex items-center justify-center">
                                                <Code size={16} className="text-forestGreen" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-forestGreen transition-colors truncate">
                                                    {coding.problem_statement.substring(0, 80)}...
                                                </h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                                    <Calendar size={12} />
                                                    <span>
                                                        Created:{" "}
                                                        {new Date(coding.createdAt).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            }
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} className="text-gray-500" />
                                                <span className="text-sm text-gray-900">
                                                    {coding.time_limit_seconds}s
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <HardDrive size={14} className="text-gray-500" />
                                                <span className="text-sm text-gray-900">
                                                    {coding.memory_limit_mb} MB
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[coding.difficulty_level]}`}>
                                            {coding.difficulty_level}
                                        </span>
                                    </div>

                                    <div className="col-span-1">
                                        <span className="text-sm text-gray-900">
                                            {coding.allowed_languages?.length || 0}
                                        </span>
                                    </div>

                                    <div className="col-span-1">
                                        <span className={`text-sm font-medium ${coding.is_active ? "text-green-600" : "text-gray-400"}`}>
                                            {coding.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="col-span-2">
                                        <div className="flex items-center justify-center gap-2 transition-opacity">
                                            <PermissionWrapper section="Contest Coding" action="edit">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditCoding(coding);
                                                    }}
                                                    className="h-8 w-8 p-0 hover:bg-lightGreen rounded-lg flex items-center justify-center text-forestGreen transition-colors"
                                                    title="Edit Challenge"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </PermissionWrapper>
                                            <PermissionWrapper section="Contest Coding" action="toggle">
                                                <label
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="relative inline-flex items-center cursor-pointer"
                                                    title={coding.is_active ? "Deactivate" : "Activate"}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={coding.is_active}
                                                        onChange={() => handleToggleStatus(coding.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                </label>
                                            </PermissionWrapper>
                                            <PermissionWrapper section="Contest Coding" action="delete">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCoding(coding);
                                                    }}
                                                    className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors"
                                                    title="Delete Challenge"
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
                    {filteredCodings.length === 0 && (
                        <div className="px-4 py-12 text-center">
                            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Code size={20} className="text-gray-400" />
                            </div>
                            <div className="text-gray-500 text-base font-medium mb-2">
                                No coding challenges found
                            </div>
                            <p className="text-gray-400 text-sm">
                                Try adjusting your filters or add a new coding challenge.
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredCodings.length > 0 && totalPages > 1 && (
                        <div className="px-3 sm:px-6 py-3 border-t border-gray-200 bg-white">
                            <div className="flex flex-col xs:flex-row items-center justify-between gap-2">
                                <div className="text-xs text-gray-700 order-2 xs:order-1">
                                    Showing {startIndex + 1} to{" "}
                                    {Math.min(endIndex, filteredCodings.length)} of{" "}
                                    {filteredCodings.length} challenges
                                </div>
                                <div className="flex items-center gap-1 order-1 xs:order-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-1 sm:p-2 rounded-lg border border-gray-200 bg-white hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                    >
                                        <ChevronLeft size={12} className="sm:w-4 sm:h-4" />
                                    </button>

                                    <div className="flex items-center gap-1 flex-wrap justify-center">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                            (page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0 min-w-[32px] ${currentPage === page
                                                        ? "bg-leafGreen text-white"
                                                        : "bg-white border border-gray-200 text-gray-700 hover:bg-lightGreen/20"
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-1 sm:p-2 rounded-lg border border-gray-200 bg-white hover:bg-lightGreen/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                    >
                                        <ChevronRight size={12} className="sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete confirmation modal */}
            {deleteConfirmation.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm mx-auto shadow-2xl">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Trash2 size={18} className="text-red-600 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                        Delete Challenge
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                                        This action cannot be undone
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setDeleteConfirmation({
                                            show: false,
                                            id: null,
                                            title: "",
                                        })
                                    }
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                                >
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="mb-4 sm:mb-6">
                                <p className="text-sm sm:text-base text-gray-600 mb-3">
                                    Are you sure you want to delete this coding challenge?
                                </p>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
                                        "{deleteConfirmation.title}"
                                    </p>
                                </div>
                                <p className="text-xs sm:text-sm text-red-600 mt-3 flex items-center gap-1">
                                    <AlertCircle size={14} className="flex-shrink-0" />
                                    This action cannot be undone and all associated test cases will be lost.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() =>
                                        setDeleteConfirmation({
                                            show: false,
                                            id: null,
                                            title: "",
                                        })
                                    }
                                    className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} className="sm:w-4 sm:h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContestCodingsPage;