/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useMemo } from 'react';
import { Search, Mail, Users, Download, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft, Filter, ChevronUp, X } from 'lucide-react';
import { useGetAllSubscriptionsQuery, useLazyGetAllSubscriptionsQuery, useUpdateStatusSubscribeMutation } from '../../../services/Support/subscribeApi';
import Papa from "papaparse";
import { getAdminToken } from "../../../services/CookieService";
import { toast } from 'react-hot-toast';
import AdminLoader from "../../../components/admin/AdminLoader";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { useNavigate } from "react-router-dom";

const EnhancedSubscriptions = () => {
    const navigate = useNavigate();
    const { access_token } = getAdminToken();

    const [updateStatus] = useUpdateStatusSubscribeMutation();
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data, isLoading, isError } = useGetAllSubscriptionsQuery({ search_term: searchTerm, status: statusFilter, limit: pageSize, offset: pageSize !== "all" ? pageSize * (currentPage - 1) : 0, access_token });
    const [triggerExport, { isLoading: isExporting }] = useLazyGetAllSubscriptionsQuery();

    const subscriptions = data?.data || [];
    const totalCount = data?.totalCount || 0;

    const filteredSubscriptions = useMemo(() => {
        return subscriptions
        // .filter(sub => {
        //     const matchesSearchTerm = sub.email.toLowerCase().includes(searchTerm.toLowerCase());
        //     const matchesStatusFilter = statusFilter === 'all' || sub.status === statusFilter;
        //     return matchesSearchTerm && matchesStatusFilter;
        // });
    }, [subscriptions, searchTerm, statusFilter]);

    const totalPages = Math.ceil(totalCount / pageSize);
    const paginatedSubscriptions = filteredSubscriptions

    const handleExport = async () => {
        try {
            const result = await triggerExport({
                search_term: searchTerm,
                limit: "all",
                offset: 0,
                access_token
            }).unwrap();

            const allSubscriptions = result.data;

            if (!allSubscriptions.length) return;
            const csvData = allSubscriptions.map((sub, index) => ({
                SNo: index + 1,
                Email: sub.email,
                SubscribedDate: new Date(sub.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
            }));
            const csv = Papa.unparse(csvData);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "subscriptions.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export failed", err);
        }
    };

    const handleStatusToggle = async (id) => {
        try {
            await updateStatus({ id, access_token }).unwrap();
            toast.success('Subscription status updated successfully');
        } catch (err) {
            console.error("Failed to update status", err);
            toast.error(err?.data?.error || 'Failed to update subscription status');
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(e.target.value === "all" ? "all" : Number(e.target.value));
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

    if (isLoading) {
        return (
            <AdminLoader message="Loading subscribers..." />
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load</h2>
                    <p className="text-gray-600 mb-4">Unable to fetch subscription data.</p>
                    <button className="bg-leafGreen text-white px-4 py-2 rounded-lg transition-colors">
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
                    {/* Mobile Header Layout */}
                    <div className="sm:hidden">
                        {/* Top Row: Title and Back Button */}
                        <div className="flex items-center justify-between mb-3">
                            {/* Empty space for balance */}
                            <div className="w-6"></div>

                            {/* Centered Title */}
                            <div className="text-center flex-1">
                                <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                    All Subscriptions
                                </h1>
                            </div>

                            {/* Back Button - Right side */}
                            <button
                                onClick={() => navigate("/admin/dashboard")}
                                className="flex border items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                            >
                                <Filter size={18} />
                                <span className="font-medium">Filters</span>
                                {showFilters ? (
                                    <ChevronUp size={16} />
                                ) : (
                                    <ChevronDown size={16} />
                                )}
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex-1 bg-leafGreen hover:bg-leafGreen/90 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 font-medium shadow-sm"
                            >
                                <Download size={18} />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Desktop Header Layout */}
                    <div className="hidden sm:block">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                    All Subscriptions
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Manage and view all newsletter subscriptions
                                </p>
                            </div>

                            <div className="flex items-center gap-2 lg:gap-4">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center gap-1 lg:gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                >
                                    <Filter size={16} />
                                    <span className="font-medium">Filters</span>
                                    {showFilters ? (
                                        <ChevronUp size={16} />
                                    ) : (
                                        <ChevronDown size={16} />
                                    )}
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="bg-leafGreen hover:bg-leafGreen/90 text-white md:px-4 p-2 rounded-lg flex items-center gap-2 transition-all duration-300 font-medium shadow-sm"
                                >
                                    <Download size={18} />
                                    <span className="hidden md:inline-flex">Export</span>
                                </button>
                                <button
                                    onClick={() => navigate("/admin/dashboard")}
                                    className="flex border items-center gap-2 md:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    <span className="hidden md:inline-flex">Back</span>
                                </button>
                            </div>
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
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search by email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen appearance-none pr-8"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {(searchTerm || statusFilter !== "all") && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
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

            <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {filteredSubscriptions.length === 0 ? (
                        <div className="text-center py-12">
                            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions found</h3>
                            <p className="text-gray-600">Try adjusting your search term or filter.</p>
                        </div>
                    ) : (
                        <>
                            {totalCount > 10 && <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Show</span>
                                    <select
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        className="border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-lightGreen/50 focus:border-leafGreen"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value="all">All</option>
                                    </select>
                                    <span className="text-sm text-gray-600">entries</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={handlePreviousPage}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>}

                            <div className="overflow-x-auto hidden sm:block">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email Address</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subscribed Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedSubscriptions.map((sub, index) => (
                                            <tr key={sub.id} className="hover:bg-lightGreen/20 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {(currentPage - 1) * (pageSize !== 'all' ? pageSize : 0) + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 grid"><p className='truncate'>{sub.email}</p></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(sub.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </td>
                                                <PermissionWrapper section="Subscribe" action="toggle">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <label className="relative inline-flex items-center cursor-pointer w-9 h-5"
                                                            onClick={(e) => e.stopPropagation()} // 👈 prevent row click
                                                            title={sub.status === 'active' ? "Deactivate" : "Activate"}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={sub.status === 'active'}
                                                                onChange={() => handleStatusToggle(sub.id)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                        </label>
                                                    </td>
                                                </PermissionWrapper>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="sm:hidden space-y-4">
                                {paginatedSubscriptions.map((sub, index) => (
                                    <div
                                        key={sub.id}
                                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3"
                                    >
                                        {/* Row 1: Email */}
                                        <p className="text-sm font-semibold text-gray-900 break-all">
                                            {sub.email}
                                        </p>

                                        {/* Row 2: Date + Toggle */}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500">
                                                {new Date(sub.created_at).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>

                                            <PermissionWrapper section="Subscribe" action="toggle">
                                                <label
                                                    className="relative inline-flex items-center cursor-pointer w-9 h-5"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title={sub.status === "active" ? "Deactivate" : "Activate"}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={sub.status === "active"}
                                                        onChange={() => handleStatusToggle(sub.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                </label>
                                            </PermissionWrapper>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancedSubscriptions;