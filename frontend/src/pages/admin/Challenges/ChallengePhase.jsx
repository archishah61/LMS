import React, { useState, useEffect } from 'react';
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
    Lock,
    CheckCircle2,
    ClipboardList,
    Layers,
    Flag,
    Loader2,
    AlertTriangle,
    MoreVertical,
    Search,
} from 'lucide-react';
import AdminLoader from '../../../components/admin/AdminLoader';
import {
    useGetPhasesByChallengeIdQuery,
    useCreatePhaseMutation,
    useUpdatePhaseMutation,
    useDeletePhaseMutation,
    useTogglePhaseStatusMutation
} from '../../../services/Challenge/challengePhaseAPI';
import PermissionWrapper from "../../../context/PermissionWrapper";
import { slugify } from '../../../utils/slugify';

export default function ChallengePhase() {
    const { id } = useLocation().state;
    const navigate = useNavigate();

    const [showForm, setShowForm] = useState(false);
    const [editingPhase, setEditingPhase] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        show: false,
        phaseId: null,
        phaseTitle: ""
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        phaseType: 'All',
        status: 'All'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const challengeId = id;

    // RTK Query hooks
    const { data: phasesData, isLoading, refetch } = useGetPhasesByChallengeIdQuery({ challengeId, searchTerm: searchQuery, phaseType: filters.phaseType, status: filters.status });
    const [createPhase, { isLoading: isCreating }] = useCreatePhaseMutation();
    const [updatePhase, { isLoading: isUpdating }] = useUpdatePhaseMutation();
    const [deletePhase, { isLoading: isDeleting }] = useDeletePhaseMutation();
    const [togglePhaseStatus] = useTogglePhaseStatusMutation();

    const [formData, setFormData] = useState({
        challenge_id: challengeId,
        title: "",
        description: "",
        phase_type: "Easy",
        bonus_reward: 0,
    });

    const isAnyFilterApplied = () => {
        return (
            filters.phaseType !== "All" ||
            filters.status !== "All" ||
            searchQuery !== ""
        );
    };

    // Filter phases
    const filteredPhases = React.useMemo(() => {
        if (!phasesData?.data) return [];

        return phasesData.data
        // .filter(phase => {
        //     const typeMatch = filters.phaseType === 'All' || phase.phase_type === filters.phaseType;
        //     const statusMatch = filters.status === 'All' ||
        //         (filters.status === 'Active' && phase.is_active) ||
        //         (filters.status === 'Inactive' && !phase.is_active);
        //     const searchMatch = phase.title.toLowerCase().includes(searchQuery.toLowerCase());

        //     return typeMatch && statusMatch && searchMatch;
        // });
    }, [phasesData, filters, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredPhases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPhases = filteredPhases.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleAddPhase = () => {
        setEditingPhase(null);
        setFormData({
            challenge_id: challengeId,
            title: "",
            description: "",
            phase_type: "Easy",
            bonus_reward: 0,
        });
        setShowForm(true);
    };

    const handleEditPhase = (phase) => {
        setEditingPhase(phase);
        setFormData({
            challenge_id: phase.challenge_id,
            title: phase.title,
            description: phase.description,
            phase_type: phase.phase_type,
            bonus_reward: phase.bonus_reward,
        });
        setShowForm(true);
    };

    const handleDeletePhase = (phase) => {
        setDeleteConfirmation({
            show: true,
            phaseId: phase.id,
            phaseTitle: phase.title,
        });
    };

    const handleConfirmDelete = async () => {
        try {
            await deletePhase(deleteConfirmation.phaseId).unwrap();
            toast.success("Phase deleted successfully!");
            refetch();
            setDeleteConfirmation({ show: false, phaseId: null, phaseTitle: "" });
        } catch (error) {
            console.error("Failed to delete phase:", error);
            toast.error(error?.data?.message || error?.data?.error || "Failed to delete phase. Please try again.");
        }
    };

    const handleToggleStatus = async (phaseId) => {
        try {
            await togglePhaseStatus(phaseId).unwrap();
            toast.success("Phase status updated successfully!");
            refetch();
        } catch (error) {
            console.error("Failed to toggle phase status:", error);
            toast.error(error?.data?.message || error?.data?.error || "Failed to update phase status. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPhase) {
                await updatePhase({
                    id: editingPhase.id,
                    ...formData,
                }).unwrap();
                toast.success("Phase updated successfully!");
            } else {
                await createPhase(formData).unwrap();
                toast.success("Phase created successfully!");
            }
            setShowForm(false);
            refetch();
        } catch (error) {
            console.error("Failed to save phase:", error);
            toast.error(error?.data?.message || error?.data?.error || "Failed to save phase. Please try again.");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "bonus_reward" ? parseInt(value) || 0 : value,
        }));
    };

    const handleManageTasks = (phase) => {
        navigate(`/admin/dashboard/challenges/${slugify(phase.title)}/task`, {
            state: { phaseId: phase.id }
        });
    };

    const getPhaseTypeColor = (type) => {
        switch (type) {
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
        return <AdminLoader fullScreen={true} message="Loading phases..." />;
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
                                Challenge Phases
                            </h1>
                            <p className="text-gray-600 mt-1 truncate">
                                Manage phases for this challenge
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

                            <PermissionWrapper section="Challenge Phase" action="create">
                                <button
                                    onClick={handleAddPhase}
                                    className="bg-leafGreen hover:bg-leafGreen/90 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                                >
                                    <Plus size={18} />
                                    Add Phase
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
                                    Phases
                                </h1>
                                <p className="text-gray-600 text-sm mt-0.5 truncate">
                                    Manage phases for this challenge
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

                            <PermissionWrapper section="Challenge Phase" action="create">
                                <button
                                    onClick={handleAddPhase}
                                    className="bg-leafGreen hover:bg-leafGreen/90 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
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
                                            placeholder="Search phases..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg 
                  placeholder-gray-400 focus:outline-none focus:ring-2 
                  focus:ring-leafGreen focus:border-transparent transition duration-150 ease-in-out"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phase Type</label>
                                    <select
                                        value={filters.phaseType}
                                        onChange={(e) => setFilters(prev => ({ ...prev, phaseType: e.target.value }))}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                    >
                                        <option value="All">All Types</option>
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
                                                phaseType: 'All',
                                                status: 'All'
                                            })
                                            setSearchQuery("")
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* List Header - Hidden on mobile */}
                    <div className="hidden lg:block bg-lightGreen px-6 py-3 border-b border-gray-200">
                        <div className="grid grid-cols-12 gap-4 text-xs font-semibold uppercase text-gray-700">
                            <div className="col-span-4">Phase Details</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-1">Bonus</div>
                            <div className="col-span-3 text-center">Actions</div>
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="bg-white divide-y divide-gray-200">
                        {paginatedPhases.map((phase) => (
                            <div
                                key={phase.id}
                                onClick={() => handleManageTasks(phase)}
                                className="group px-4 lg:px-6 py-4 hover:bg-lightGreen/20 transition-all duration-200 cursor-pointer"
                            >
                                {/* Mobile Layout */}
                                <div className="lg:hidden">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="flex-shrink-0 w-8 h-8 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                                                <Layers size={16} className="text-leafGreen" />
                                            </div>
                                            <div className="flex-1 grid">
                                                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 transition-colors text-sm">
                                                    {phase.title}
                                                </h3>
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                    {phase.description || "No description provided"}
                                                </p>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPhaseTypeColor(phase.phase_type)}`}
                                            >
                                                {phase.phase_type}
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(phase.is_active)}`}
                                            >
                                                {phase.is_active ? (
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
                                            <span className="font-semibold text-gray-900 text-xs">{phase.bonus_reward || 0}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                        <Calendar size={10} />
                                        <span>Phase {phase.phase_number}</span>
                                        <span className="mx-1">•</span>
                                        <span>Tasks: {phase.tasks_count || 0}</span>
                                    </div>

                                    {/* Mobile Action Buttons */}
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                        <PermissionWrapper section="Challenge Phase" action="edit">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditPhase(phase);
                                                }}
                                                className="h-7 px-3 py-1 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 transition-colors text-xs font-medium"
                                                title="Edit Phase"
                                            >
                                                <Edit2 size={12} className="mr-1" />
                                                Edit
                                            </button>
                                        </PermissionWrapper>

                                        <PermissionWrapper section="Challenge Phase" action="toggle">
                                            <label
                                                className="relative inline-flex items-center cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                                title={phase.is_active ? "Deactivate" : "Activate"}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={phase.is_active}
                                                    onChange={() => handleToggleStatus(phase.id)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                            </label>
                                        </PermissionWrapper>

                                        <PermissionWrapper section="Challenge Phase" action="delete">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePhase(phase);
                                                }}
                                                className="h-7 px-3 py-1 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors text-xs font-medium"
                                                title="Delete Phase"
                                            >
                                                <Trash2 size={12} className="mr-1" />
                                                Delete
                                            </button>
                                        </PermissionWrapper>
                                    </div>
                                </div>

                                {/* Desktop Layout - Unchanged */}
                                <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                                    {/* Phase Info */}
                                    <div className="col-span-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                                                <Layers size={18} className="text-leafGreen" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 mb-1 transition-colors">
                                                    {phase.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                    {phase.description || "No description provided"}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                                    <Calendar size={12} />
                                                    <span>Phase {phase.phase_number}</span>
                                                    <span className="mx-1">•</span>
                                                    <span>Tasks: {phase.tasks_count || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPhaseTypeColor(phase.phase_type)}`}
                                            >
                                                {phase.phase_type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(phase.is_active)}`}
                                            >
                                                {phase.is_active ? (
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

                                    {/* Bonus Points */}
                                    <div className="col-span-1">
                                        <div className="flex items-center gap-1">
                                            <Award size={14} className="text-leafGreen" />
                                            <span className="font-semibold text-gray-900">{phase.bonus_reward || 0}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-3">
                                        <div className="flex items-center justify-center gap-2 transition-opacity">
                                            <PermissionWrapper section="Challenge Phase" action="edit">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditPhase(phase);
                                                    }}
                                                    className="h-8 w-8 p-0 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 transition-colors"
                                                    title="Edit Phase"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </PermissionWrapper>

                                            <PermissionWrapper section="Challenge Phase" action="toggle">
                                                <label
                                                    className="relative inline-flex items-center cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title={phase.is_active ? "Deactivate" : "Activate"}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={phase.is_active}
                                                        onChange={() => handleToggleStatus(phase.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                </label>
                                            </PermissionWrapper>

                                            <PermissionWrapper section="Challenge Phase" action="delete">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePhase(phase);
                                                    }}
                                                    className="h-8 w-8 p-0 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors"
                                                    title="Delete Phase"
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
                    {filteredPhases.length === 0 && (
                        <div className="px-4 lg:px-6 py-12 lg:py-16 text-center">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Flag size={20} className="lg:w-6 lg:h-6 text-gray-400" />
                            </div>
                            <div className="text-gray-500 text-base lg:text-lg font-medium mb-2">No phases found</div>
                            <p className="text-gray-400 text-sm lg:text-base">
                                {searchQuery || filters.phaseType !== 'All' || filters.status !== 'All'
                                    ? "Try adjusting your filters to see more results."
                                    : "Get started by creating your first phase."}
                            </p>
                            {(searchQuery || filters.phaseType !== 'All' || filters.status !== 'All') && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilters({ phaseType: 'All', status: 'All' });
                                    }}
                                    className="mt-4 px-4 py-2 bg-lightGreen text-forestGreen rounded-lg hover:bg-lightGreen/80 transition-colors text-sm font-medium"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredPhases.length > 0 && totalPages > 1 && (
                        <div className="px-4 lg:px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-700 text-center lg:text-left">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredPhases.length)} of{" "}
                                    {filteredPhases.length} phases
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
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Delete Phase</h2>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">This action cannot be undone</p>
                                </div>
                                <button
                                    onClick={() => setDeleteConfirmation({ show: false, phaseId: null, phaseTitle: "" })}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
                                >
                                    <X size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                                Are you sure you want to delete "<span className="font-medium">{deleteConfirmation.phaseTitle}</span>"?
                            </p>

                            <div className="flex flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() => setDeleteConfirmation({ show: false, phaseId: null, phaseTitle: "" })}
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
                                    <span className="hidden sm:inline"> Phase</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Phase Form Modal - Mobile Optimized */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                                {editingPhase ? "Edit Phase" : "Add New Phase"}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            <form onSubmit={handleSubmit} id="phaseForm" className="space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Title - Full width on mobile, 2/3 on desktop */}
                                    <div className="lg:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phase Title *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                            placeholder="Enter phase title"
                                        />
                                    </div>

                                    {/* Phase Type - Full width on mobile, 1/3 on desktop */}
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phase Type *</label>
                                        <select
                                            name="phase_type"
                                            value={formData.phase_type}
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
                                        placeholder="Enter phase description"
                                    />
                                </div>

                                {/* Bonus Reward */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Reward</label>
                                    <input
                                        type="number"
                                        name="bonus_reward"
                                        value={formData.bonus_reward || 0}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                                        placeholder="Enter bonus reward points"
                                    />
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
                                form="phaseForm"
                                disabled={isCreating || isUpdating}
                                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {(isCreating || isUpdating) ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        {editingPhase ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    editingPhase ? "Update" : "Create"
                                )}
                                <span className="hidden sm:inline"> Phase</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}