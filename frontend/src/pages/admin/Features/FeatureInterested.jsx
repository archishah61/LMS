/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Mail, Users, Download, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft, Filter, ChevronUp, X, Trash2 } from 'lucide-react';
import Papa from "papaparse";
import { getAdminToken } from "../../../services/CookieService";
import { toast } from 'react-hot-toast';
import AdminLoader from "../../../components/admin/AdminLoader";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { useNavigate } from "react-router-dom";
import { useDeleteFeatureInterestMutation, useGetAllFeatureInterestsQuery } from '../../../services/Support/featureInterestAPI';
import { useGetAllFeatureStatusQuery } from '../../../services/Masters/featureStatusAPI';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-4 sm:p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <button onClick={onClose} className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="w-5 h-5 text-red-600" />
                        </button>
                        <div>
                            <h3 className="text-lg font-semibold text-red-900">Delete Record</h3>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-gray-600 mb-2">
                            Are you sure you want to delete the record:
                        </p>
                        <p className="text-sm text-red-600 mt-2">
                            This action cannot be undone.
                        </p>
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-3 font-medium rounded-lg transition-all duration-200 bg-red-600 text-white hover:bg-red-700 shadow-sm`}
                        >
                            Delete <span className='hidden sm:inline'>Record</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const FeatureInterests = () => {
    const navigate = useNavigate();
    const { access_token } = getAdminToken();

    // State for pagination and filtering
    const [featureFilter, setFeatureFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [debouncedFeatureFilter, setDebouncedFeatureFilter] = useState('all');
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        id: null,
    });

    // Get feature list for filter dropdown
    const { data: features } = useGetAllFeatureStatusQuery({ access_token });

    // API call with all filters
    const { data, isLoading, isError, refetch } = useGetAllFeatureInterestsQuery({
        access_token,
        search_term: debouncedSearchTerm,
        feature_filter: debouncedFeatureFilter,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
    });

    const [deleteInterest] = useDeleteFeatureInterestMutation();

    const allInterests = data?.data || [];
    const totalInterests = data?.total || 0;
    const totalPages = Math.ceil(totalInterests / pageSize);

    // Function to format feature names
    const formatFeatureName = (name) => {
        // Handle special cases first
        const specialCases = {
            'cheatsheet': 'Cheatsheet',
            'challenge_quest': 'Challenge Quest',
            'daily_challenge': 'Daily Challenge',
            'contest': 'Contest',
            'maths_solver': 'Maths Solver',
            'interview_ai': 'Interview AI',
            'learning_path_ai': 'Learning Path AI',
            'do_your_own_course_ai': 'Do Your Own Course AI',
            'chatbot_ai': 'Chatbot AI',
            'become_a_partner': 'Become a Partner'
        };

        if (specialCases[name]) {
            return specialCases[name];
        }

        // General formatting for other names
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Debounce search term and feature filter
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setDebouncedFeatureFilter(featureFilter);
            setCurrentPage(1); // Reset to first page when filters change
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm, featureFilter]);

    const handleExport = () => {
        // For export, fetch all data with current filters but no pagination
        const exportData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/feature-interest/all?search_term=${debouncedSearchTerm}&feature_filter=${debouncedFeatureFilter}&limit=ALL&offset=0`, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                });
                const result = await response.json();

                const csvData = result.data.map((interest, index) => ({
                    SNo: index + 1,
                    Email: interest.email,
                    UserName: interest.user_name || 'Guest User',
                    Feature: formatFeatureName(interest.feature_name),
                    InterestDate: new Date(interest.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }),
                    InterestTime: new Date(interest.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                }));

                const csv = Papa.unparse(csvData);
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `feature_interests_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Data exported successfully');
            } catch (error) {
                console.error("Export failed:", error);
                toast.error('Failed to export data');
            }
        };

        exportData();
    };

    // Helper function to fetch all data for export
    const fetchAllInterestsForExport = async () => {
        // You might need to create a separate endpoint for exporting all filtered data
        // For now, this is a placeholder implementation
        const response = await fetch(`/api/feature-interests/export?search_term=${debouncedSearchTerm}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });
        return await response.json();
    };

    const handleDeleteInterest = (id) => {
        setDeleteConfirmation({ isOpen: true, id });
    };

    const handleDeleteInterestConfirm = async (id) => {
        try {
            await deleteInterest({ id, access_token }).unwrap();
            toast.success('Interest entry deleted successfully');
            refetch(); // Refresh the data
        } catch (err) {
            console.error("Failed to delete interest", err);
            toast.error(err?.data?.error || 'Failed to delete interest entry');
        } finally {
            setDeleteConfirmation({ isOpen: false, id: null })
        }
    };

    const handlePageSizeChange = (e) => {
        const newSize = e.target.value === "all" ? totalInterests : Number(e.target.value);
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Reset to first page when page size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [pageSize]);

    if (isLoading) {
        return <AdminLoader message="Loading interest data..." />;
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load</h2>
                    <p className="text-gray-600 mb-4">Unable to fetch feature interest data.</p>
                    <button
                        onClick={() => refetch()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                <div className="w-full px-4 sm:px-6 py-4">
                    {/* Mobile Header - Back button on right side with short title */}
                    <div className="sm:hidden flex items-center justify-between">
                        <div className="flex-1"></div> {/* Spacer for left side */}
                        <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent text-center ">
                            Feature Interests
                        </h1>
                        <div className="flex-1 flex justify-end gap-2"> {/* Spacer for right side with back button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors text-sm"
                            >
                                <Filter size={16} />
                            </button>
                            <button
                                onClick={handleExport}
                                className="bg-leafGreen text-white p-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={() => navigate("/admin/dashboard")}
                                className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 lg:gap-4">
                        <div className="flex-1 min-w-0">
                            {/* Desktop Title - Hidden on mobile */}
                            <h1 className="hidden sm:block text-xl md:text-2xl font-bold bg-forestGreen bg-clip-text text-transparent text-center sm:text-left">
                                Feature Interests
                            </h1>
                            <p className="hidden sm:block text-gray-600 mt-1 text-sm sm:text-base text-center sm:text-left">
                                Manage user interests in upcoming features
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
                            >
                                <Filter size={16} />
                                <span className="font-medium">Filters</span>
                                {showFilters ? (
                                    <ChevronUp size={14} />
                                ) : (
                                    <ChevronDown size={14} />
                                )}
                            </button>
                            <button
                                onClick={handleExport}
                                className="bg-leafGreen text-white px-4 md:px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base flex-1 sm:flex-none justify-center"
                            >
                                <Download size={16} />
                                <span className="hidden md:inline-flex">Export</span>
                            </button>
                            {/* Desktop Back Button - Hidden on mobile */}
                            <button
                                onClick={() => navigate("/admin/dashboard")}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 shadow-sm"
                            >
                                <ArrowLeft size={18} />
                                <span className="font-medium hidden md:inline-flex">Back</span>
                            </button>
                        </div>
                    </div>
                    {/* Filters Section */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
                    >
                        <div className="bg-lightGreen/10 rounded-lg border border-gray-200 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search by email, name, or feature..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Feature
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={featureFilter}
                                            onChange={(e) => setFeatureFilter(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen appearance-none pr-8"
                                        >
                                            <option value="all">All Features</option>
                                            {features.map(feature => (
                                                <option key={feature.id} value={feature.name}>
                                                    {formatFeatureName(feature.name)}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {(searchTerm || featureFilter !== "all") && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setFeatureFilter("all");
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

            <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6">
                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {allInterests.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No feature interests found</h3>
                            <p className="text-gray-600">Try adjusting your search term or filter.</p>
                        </div>
                    ) : (
                        <>

                            <div className="overflow-x-auto">
                                {/* Mobile Card View */}
                                <div className="sm:hidden space-y-4 p-4">
                                    {allInterests?.map((interest, index) => (
                                        <div key={interest.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        #{(currentPage - 1) * pageSize + index + 1}
                                                    </div>
                                                    <PermissionWrapper section="Feature Interest" action="delete">
                                                        <button
                                                            onClick={() => handleDeleteInterest(interest.id)}
                                                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete interest entry"
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete
                                                        </button>
                                                    </PermissionWrapper>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Email Address</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-900 break-all">{interest.email}</span>
                                                        {!interest.user_id && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 shrink-0">
                                                                Guest
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Feature</div>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {formatFeatureName(interest.feature_name)}
                                                    </span>
                                                </div>

                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Interest Date</div>
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(interest.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(interest.created_at).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                                    <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                                        <tr>
                                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email Address</th>
                                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Feature</th>
                                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Interest Date</th>
                                            <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {allInterests?.map((interest, index) => {
                                            return (
                                                <tr key={interest.id} className="hover:bg-lightGreen/20 transition-colors">
                                                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {(currentPage - 1) * pageSize + index + 1}
                                                    </td>
                                                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 grid">
                                                        <div className="grid gap-2">
                                                            <p className='truncate'>{interest.email}</p>
                                                            {!interest.user_id && (
                                                                <p>
                                                                    <span className="px-2 py-1 w-auto rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                        Guest
                                                                    </span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-lightGreen text-forestGreen">
                                                            {formatFeatureName(interest.feature_name)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div>
                                                            <div>{new Date(interest.created_at).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {new Date(interest.created_at).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <PermissionWrapper section="Feature Interest" action="delete">
                                                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleDeleteInterest(interest.id)}
                                                                className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete interest entry"
                                                            >
                                                                <Trash2 size={16} />
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </PermissionWrapper>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center px-4 sm:px-6 py-4 gap-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Show</span>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        className="border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-leafGreen focus:border-leafGreen"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value="all">All</option>
                                    </select>
                                    <span className="text-sm text-gray-600">entries</span>
                                </div>
                                <div className="flex items-center justify-between sm:justify-normal space-x-2">
                                    <span className="text-sm text-gray-600 hidden sm:block">
                                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalInterests)} of {totalInterests} entries
                                    </span>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                        <span className="text-sm text-gray-600 px-2">
                                            {currentPage}/{totalPages}
                                        </span>
                                        <button
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <DeleteConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() =>
                    setDeleteConfirmation({ isOpen: false, id: null })
                }
                onConfirm={() =>
                    handleDeleteInterestConfirm(deleteConfirmation.id)
                }
            />
        </div>
    );
};

export default FeatureInterests;