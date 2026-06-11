import React from "react";
import AdminLoader from "../../../components/admin/AdminLoader";
import { FiEye, FiPackage, FiUsers, FiCalendar, FiArrowLeft } from "react-icons/fi";
import { getAdminToken } from "../../../services/CookieService";
import { useGetAllBatchesQuery } from "../../../services/promocode/promocodeApi";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronUp, Filter } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";

export default function Batches() {
    const navigate = useNavigate();
    const { access_token } = getAdminToken();

    const [showFilter, setShowFilter] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data, isLoading, isError, error } = useGetAllBatchesQuery({
        limit: itemsPerPage,
        offset: itemsPerPage !== "all" ? itemsPerPage * (currentPage - 1) : 0,
        searchTerm,
        dateFrom,
        dateTo,
        access_token,
    });

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFrom, dateTo]);

    useEffect(() => {
        if (data?.data?.length == 0 && currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }, [data?.data]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const isAnyFilterApplied = () => {
        return (
            dateFrom !== "" || dateTo !== "" || searchTerm !== ""
        )
    }

    const batches = data?.data || [];
    const pagination = data?.pagination;

    // Calculate statistics
    const totalBatches = batches.length;
    const totalUsers = batches?.reduce((sum, batch) => sum + (batch.total_assigned_users || 0), 0);

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header with White Background */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="mx-auto px-4 sm:px-6 py-4">
                    {/* Mobile Header - Title centered, arrow on right side */}
                    <div className="md:hidden">
                        <div className="flex items-center justify-between">
                            {/* Empty div to balance the layout */}
                            <div className="w-8"></div>

                            {/* Centered Title */}
                            <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                Batch Management
                            </h1>
                            {/* Arrow on right side */}
                            <button
                                onClick={() => navigate(-1)}
                                className="flex border rounded-md items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <FiArrowLeft size={20} />
                            </button>
                        </div>

                        {/* Stats below title on mobile */}
                        {!isLoading && !isError && (
                            <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                                <span className="px-2 py-1 bg-lightGreen text-forestGreen text-xs font-semibold rounded-full">
                                    {totalBatches} Batches
                                </span>
                                <span className="px-2 py-1 bg-lightGreen text-forestGreen text-xs font-semibold rounded-full">
                                    {totalUsers} Users Assigned
                                </span>
                            </div>
                        )}

                    </div>
                    {/* Desktop Header */}
                    <div className="hidden md:block">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                        Batch Management
                                    </h1>
                                    {/* Subtext */}
                                    <p className="text-gray-600 mt-1 truncate">
                                        View and manage all promotional code batches
                                    </p>
                                </div>

                                {/* Stats */}
                                {!isLoading && !isError && (
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-lightGreen text-forestGreen text-sm font-semibold rounded-full">
                                            {totalBatches} Batches
                                        </span>
                                        <span className="px-3 py-1 bg-lightGreen text-forestGreen text-sm font-semibold rounded-full">
                                            {totalUsers} Users Assigned
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Back Button - Centered vertically */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowFilter(!showFilter)}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                >
                                    <Filter size={18} />
                                    <span className="font-medium">Filters</span>
                                    {showFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

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

                    {/* Filters Section - This stays the same */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilter ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="p-4 bg-lightGreen/20 rounded-lg border border-leafGreen/20">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Search Batches
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
                                            placeholder="Search by Batch Number or Courses..."
                                            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                    </div>
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        max={new Date().toISOString().split("T")[0]}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        max={new Date().toISOString().split("T")[0]}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                    />
                                </div>
                            </div>
                            {isAnyFilterApplied() && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setDateFrom("");
                                            setDateTo("");
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
            <div className="w-full flex-1 overflow-y-auto max-w-full px-4 py-4 sm:px-6">
                {/* Loading State */}
                {isLoading && <AdminLoader message="Loading batches..." />}

                {/* Error State */}
                {isError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-red-800 font-semibold mb-1 text-sm sm:text-base">
                                    Failed to load batches
                                </h3>
                                <p className="text-red-600 text-xs sm:text-sm">
                                    There was an error loading the batch data. Please try again later.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Section */}
                {!isLoading && !isError && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-lightGreen">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Batch Number
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <FiUsers size={14} />
                                                Assigned Users
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <FiCalendar size={14} />
                                                Created Date
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {batches.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                                                        <FiPackage className="text-gray-400" size={32} />
                                                    </div>
                                                    <p className="text-gray-500 font-medium mb-1">
                                                        No batches found
                                                    </p>
                                                    <p className="text-gray-400 text-sm">
                                                        Create your first batch to get started
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        batches.map((batch, index) => (
                                            <tr
                                                key={index}
                                                className="hover:bg-lightGreen/20 transition-colors duration-200"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-lightGreen rounded-lg flex items-center justify-center">
                                                            <FiPackage className="text-forestGreen" size={18} />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {batch.batch_number}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="px-3 py-1 text-sm font-medium text-forestGreen bg-lightGreen rounded-full">
                                                            {batch.total_assigned_users}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700">
                                                        {new Date(batch.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(batch.created_at).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-leafGreen  text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                                        onClick={() =>
                                                            navigate(`/admin/dashboard/batches/users/list/${batch.id}`)
                                                        }
                                                        title="View batch details"
                                                    >
                                                        <FiEye size={16} />
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-3">
                            {batches.length === 0 ? (
                                <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="p-3 bg-gray-50 rounded-full mb-3">
                                            <FiPackage className="text-gray-400" size={20} />
                                        </div>
                                        <p className="text-gray-600 font-medium mb-1 text-sm">
                                            No batches found
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            Create your first batch to get started
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                batches.map((batch, index) => (
                                    <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-leafGreen/30 transition-all duration-200">
                                        {/* Header with Batch Info */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-12 h-12 bg-leafGreen rounded-xl flex items-center justify-center">
                                                    <FiPackage className="text-white" size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-base font-bold text-gray-900">
                                                        {batch.batch_number}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        Batch ID
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-lightGreen/50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FiUsers size={14} className="text-forestGreen" />
                                                    <span className="text-xs font-medium text-forestGreen">Users</span>
                                                </div>
                                                <div className="text-lg font-bold text-forestGreen">
                                                    {batch.total_assigned_users}
                                                </div>
                                            </div>

                                            <div className="bg-lightGreen/50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FiCalendar size={14} className="text-forestGreen" />
                                                    <span className="text-xs font-medium text-forestGreen">Created</span>
                                                </div>
                                                <div className="text-sm font-semibold text-forestGreen">
                                                    {new Date(batch.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-xs text-forestGreen mt-1">
                                                    {new Date(batch.created_at).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-leafGreen  text-white text-sm font-semibold rounded-xl transition-colors duration-200 active:scale-95 shadow-sm"
                                            onClick={() =>
                                                navigate(`/admin/dashboard/batches/users/list/${batch.id}`)
                                            }
                                        >
                                            <FiEye size={16} />
                                            View Batch Details
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {pagination?.totalCount > 10 && (
                            <Pagination
                                pagination={pagination}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                limit={itemsPerPage}
                                setLimit={setItemsPerPage}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Pagination({ pagination, currentPage, setCurrentPage, limit, setLimit }) {
    const limitOptions = [10, 20, 50, 100, 500];

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-white">
            {/* Mobile Pagination */}
            <div className="md:hidden">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 text-center">
                            Page {currentPage} of {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Contests per page:</label>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setCurrentPage(1); // Reset to first page when limit changes
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                            >
                                {limitOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        <div className="text-xs text-gray-500 text-center">
                            Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, pagination.totalCount)} of {pagination.totalCount}
                        </div>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === pagination.totalPages}
                            className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                            Next
                            <ChevronUp size={16} className="rotate-90" />
                        </button>
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
                        <label className="text-sm font-medium text-gray-700">Contests per page:</label>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setCurrentPage(1); // Reset to first page when limit changes
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                        >
                            {limitOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
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
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${currentPage === page
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
    );
}