/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useGetAllExtensionRequestsQuery, useHandleExtensionRequestMutation } from '../../../services/Assignment/assignmentExtensionRequestApi';
import { getAdminToken } from '../../../services/CookieService';
import { toast } from 'react-hot-toast';
import { Check, X, Calendar, User, FileText, Clock, MessageSquare, ArrowLeft, ChevronLeft, ChevronUp, Filter, ChevronDown, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PermissionWrapper from '../../../context/PermissionWrapper';
import AdminLoader from '../AdminLoader';

export default function ExtensionRequest() {
    const { access_token } = getAdminToken();

    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const limitOptions = [10, 20, 50, 100, 500];

    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const { data: extensionRequests, isLoading, isError } = useGetAllExtensionRequestsQuery({
        search_term: searchTerm,
        status: statusFilter,
        limit: limit,
        offset: limit !== "all" ? limit * (currentPage - 1) : 0,
        access_token
    });
    const [handleExtensionRequest] = useHandleExtensionRequestMutation();

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // State for modals
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [newDueDate, setNewDueDate] = useState("");
    const [adminResponse, setAdminResponse] = useState("");

    const openApprovalModal = (request) => {
        setSelectedRequest(request);
        setNewDueDate("");
        setAdminResponse("");
        setIsApprovalModalOpen(true);
    };

    const openRejectionModal = (request) => {
        setSelectedRequest(request);
        setAdminResponse("");
        setIsRejectionModalOpen(true);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <Clock className="w-3 h-3" />;
            case 'Approved': return <Check className="w-3 h-3" />;
            case 'Rejected': return <X className="w-3 h-3" />;
            default: return null;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleAction = async (requestId, status, newDueDate = null, adminResponse = null) => {
        try {
            const actionData = {
                status,
                ...(newDueDate && { approved_due_date: newDueDate }),
                ...(adminResponse && { admin_response: adminResponse })
            };

            await handleExtensionRequest({
                requestId,
                actionData,
                access_token
            }).unwrap();
            toast.success(`Request ${status.toLowerCase()} successfully`);
            setIsApprovalModalOpen(false);
            setIsRejectionModalOpen(false);
            setSelectedRequest(null);
        } catch (error) {
            toast.error(error?.data?.error || 'Failed to update request status');
        }
    };

    const pagination = extensionRequests?.pagination || { totalPages: 1, totalCount: 1 };

    if (isLoading) {
        return <AdminLoader className="h-screen" message="Loading extension requests..." />;

        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-leafGreen"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 text-center text-red-500">
                Error loading extension requests
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
                <div className="w-full p-4 sm:px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 mx-2">
                            <h1 className="text-xl text-center md:text-start md:text-2xl font-bold text-forestGreen">
                                Extension Requests
                            </h1>
                            <p className="text-sm text-center md:text-start md:text-lg text-gray-600 mt-1">
                                Manage <span className='hidden sm:inline'>student assignment</span>extension requests
                            </p>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
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
                                onClick={() => navigate("/admin/dashboard")}
                                className="flex border items-center gap-2 sm:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={18} />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"}`}
                    >
                        <div className="bg-lightGreen/5 rounded-lg border border-gray-100 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className='md:col-span-3'>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search by assignment, user name, or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                                <div className='md:col-span-1'>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen appearance-none pr-8"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Rejected">Rejected</option>
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

            {/* Header */}
            {/* <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900">Extension Requests</h1>
                <p className="text-gray-600 mt-2">Manage student assignment extension requests</p>
            </div> */}

            {extensionRequests?.requests?.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium">No extension requests</p>
                    <p className="text-gray-500 text-sm mt-1">Extension requests will appear here when submitted</p>
                </div>
            )}

            {/* Requests Cards */}
            <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {extensionRequests?.requests?.map((request) => (
                    <div key={request.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="sm:flex items-start justify-between">
                            {/* Left Content */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                {/* Student Info */}
                                <div className="space-y-1 grid">
                                    <div className='flex sm:flex-col items-center justify-between sm:items-start'>
                                        <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                                            <User className="w-3 h-3" />
                                            <span>Student</span>
                                        </div>
                                        <div className={`sm:hidden inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(request.status)}`}>
                                            {getStatusIcon(request.status)}
                                            <span>{request.status}</span>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-gray-900">{request.User?.username}</p>
                                    <p className="text-gray-600 text-sm truncate">{request.User?.email}</p>
                                </div>

                                {/* Assignment Info */}
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                                        <FileText className="w-3 h-3" />
                                        <span>Assignment</span>
                                    </div>
                                    <p className="font-semibold text-gray-900">{request.Assignment?.title}</p>
                                    <p className="text-gray-600 text-sm">
                                        Requested: {new Date(request.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>

                                {/* Status & Response */}
                                <div className="space-y-1">
                                    <div className='hidden sm:block'>
                                        <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">
                                            <span>Status</span>
                                        </div>
                                        <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(request.status)}`}>
                                            {getStatusIcon(request.status)}
                                            <span>{request.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    {/* <PermissionWrapper section="Assignment Extension" action="edit"> */}
                                    {/* Actions */}
                                    {request.status === 'Pending' && (
                                        <div className="flex flex-wrap justify-between items-center gap-2">
                                            <button
                                                onClick={() => openApprovalModal(request)}
                                                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                                            >
                                                <Check className="w-4 h-4" />
                                                <span>Approve</span>
                                            </button>

                                            <button
                                                onClick={() => openRejectionModal(request)}
                                                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                                            >
                                                <X className="w-4 h-4" />
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    )}
                                    {/* </PermissionWrapper> */}

                                    {request.admin_response && (
                                        <div>
                                            <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">
                                                <MessageSquare className="w-3 h-3" />
                                                <span>Response</span>
                                            </div>
                                            <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded-lg">
                                                {request.admin_response}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Request Reason */}
                        {request.reason && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-gray-600 text-sm">
                                    <span className="font-medium">Reason:</span> {request.reason}
                                </p>
                            </div>
                        )}
                    </div>
                ))}

                {/* Pagination */}
                {pagination.totalCount > 10 && (
                    <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-white">
                        {/* Mobile Pagination */}
                        <div className="md:hidden">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600 text-center">
                                        Page {currentPage} of {pagination.totalPages}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-gray-700">Requests per page:</label>
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
                                    <label className="text-sm font-medium text-gray-700">Requests per page:</label>
                                    <select
                                        value={limit}
                                        onChange={(e) => {
                                            setLimit(Number(e.target.value));
                                            setCurrentPage(1); // Reset to first page when limit changes
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                )}
            </div>

            {/* Approval Modal */}
            {isApprovalModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Approve Extension</h3>
                                    <p className="text-gray-600 text-sm">Set new due date and optional response</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>New Due Date</span>
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newDueDate}
                                        onChange={(e) => setNewDueDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-2">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>Response Message</span>
                                        <span className="text-gray-400 text-xs">(Optional)</span>
                                    </label>
                                    <textarea
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                                        rows="3"
                                        placeholder="Add a message for the student..."
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => setIsApprovalModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction(selectedRequest.id, 'Approved', newDueDate, adminResponse)}
                                    disabled={!newDueDate}
                                    className={`flex-1 px-4 py-3 font-medium rounded-lg transition-all duration-200 ${!newDueDate
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-leafGreen text-white   shadow-sm'
                                        }`}
                                >
                                    Approve <span className='hidden sm:inline'>Request</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {isRejectionModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <X className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Reject Extension</h3>
                                    <p className="text-gray-600 text-sm">Provide a reason for rejection</p>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-900 mb-2">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Rejection Reason</span>
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                                    rows="4"
                                    placeholder="Explain why this extension request cannot be approved..."
                                    required
                                />
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => setIsRejectionModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction(selectedRequest.id, 'Rejected', null, adminResponse)}
                                    disabled={!adminResponse.trim()}
                                    className={`flex-1 px-4 py-3 font-medium rounded-lg transition-all duration-200 ${!adminResponse.trim()
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                                        }`}
                                >
                                    Reject <span className='hidden sm:inline'>Request</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

