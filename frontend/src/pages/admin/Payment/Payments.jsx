"use client";

import { useState } from "react";
import { getAdminToken } from "../../../services/CookieService";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Filter, Eye, X } from "lucide-react";
import { useGetPaymentsQuery } from "../../../services/Enrollment/enrollAPI";
import AdminLoader from "../../../components/admin/AdminLoader";

const Payments = () => {
    const { access_token } = getAdminToken();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
    const [limit] = useState(10);
    const [showFilter, setShowFilter] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const navigate = useNavigate();

    const {
        data: paymentData,
        isLoading,
    } = useGetPaymentsQuery({
        access_token,
        payment_type: paymentTypeFilter,
        offset: limit !== "all" ? limit * (currentPage - 1) : 0,
        limit,
        search_term: searchTerm,
    });

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePaymentTypeChange = (type) => {
        setPaymentTypeFilter(type);
        setCurrentPage(1);
    };

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedPayment(null);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setPaymentTypeFilter("all");
        setCurrentPage(1);
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateCompact = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');
    };

    const getPaymentTypeBadge = (type) => {
        const types = {
            'course-enroll': { label: 'Course', color: 'bg-blue-100 text-blue-800' },
            'contest-enroll': { label: 'Contest', color: 'bg-yellow-100 text-yellow-800' },
            'cheatsheet': { label: 'Cheatsheet', color: 'bg-leafGreen/10 text-leafGreen' },
            'course-generation': { label: 'Course Gen', color: 'bg-forestGreen/10 text-forestGreen' }
        };
        const typeInfo = types[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.color}`}>
                {typeInfo.label}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const statuses = {
            'completed': { label: 'Completed', color: 'bg-green-100 text-green-800' },
            'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
            'failed': { label: 'Failed', color: 'bg-red-100 text-red-800' }
        };
        const statusInfo = statuses[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
            </span>
        );
    };

    const truncateText = (text, maxLength = 30) => {
        if (!text) return 'N/A';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    const getItemTitle = (payment) => {
        return payment.item_title || payment.cheatsheet_title || 'N/A';
    };

    const payments = paymentData?.data || [];
    const pagination = paymentData?.pagination || {};

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="w-full px-4 sm:px-6 py-4">
                    {/* Mobile Header */}
                    <div className="block sm:hidden">
                        <div className="flex items-center justify-between mb-2">

                            <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent text-center flex-1 mx-2">
                                Payments
                            </h1>
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 p-2 border text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors flex-1 justify-center"
                            >
                                <Filter size={16} />
                                <span className="font-medium text-sm">Filters</span>
                                {showFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden sm:block">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                    Payment Management
                                </h1>
                                <p className="text-gray-600 mt-1">View payment transactions</p>
                            </div>

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

                    {/* Filters */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilter ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="p-4 bg-lightGreen/20 rounded-lg border border-leafGreen/20">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Search Payments
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
                                            placeholder="Search by user, email, transaction ID..."
                                            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Type
                                    </label>
                                    <select
                                        value={paymentTypeFilter}
                                        onChange={(e) => handlePaymentTypeChange(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="course-enroll">Course Enrollment</option>
                                        <option value="contest-enroll">Contest Enrollment</option>
                                        <option value="cheatsheet">Cheatsheet</option>
                                        <option value="course-generation">Course Generation</option>
                                    </select>
                                </div>
                            </div>

                            {(searchTerm || paymentTypeFilter !== "all") && (
                                <div className="mt-3">
                                    <button
                                        onClick={clearFilters}
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
            <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Mobile Cards View */}
                <div className="block md:hidden">
                    {isLoading ? (
                        <AdminLoader message="Fetching payments..." />
                    ) : payments.length > 0 ? (
                        <div className="space-y-3">
                            {payments.map((payment) => (
                                <div
                                    key={payment.payment_id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-gray-900 mb-1">
                                                {truncateText(payment.transaction_id, 20)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {payment.payment_method} • {payment.payment_gateway}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {getStatusBadge(payment.payment_status)}
                                            {getPaymentTypeBadge(payment.payment_type)}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {truncateText(getItemTitle(payment), 40)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {payment.username}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="text-lg font-bold text-gray-900">
                                                {formatCurrency(payment.amount, payment.currency)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatDateCompact(payment.transaction_date)}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleViewDetails(payment)}
                                            className="w-full flex items-center justify-center gap-2 py-2 text-leafGreen hover:text-forestGreen font-medium text-sm border border-lightGreen rounded-lg hover:bg-lightGreen/10 transition-colors"
                                        >
                                            <Eye size={16} />
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-500">No payments found</div>
                        </div>
                    )}

                    {/* Mobile Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="text-sm text-gray-700 text-center">
                                    Showing {(currentPage - 1) * limit + 1} to{" "}
                                    {Math.min(currentPage * limit, pagination.total)} of{" "}
                                    {pagination.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        Prev
                                    </button>
                                    <div className="text-sm text-gray-700">
                                        Page {currentPage} of {pagination.totalPages}
                                    </div>
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

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden flex-col">
                    {isLoading ? (
                        <AdminLoader message="Loading payments table..." />
                    ) : (
                        <>
                            <table className="w-full relative">
                                <thead className="bg-lightGreen border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Transaction
                                        </th>
                                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Item & User
                                        </th>
                                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {payments?.map((payment) => (
                                        <tr
                                            key={payment.payment_id}
                                            className="hover:bg-lightGreen/20 transition-colors duration-200"
                                        >
                                            <td className="px-3 lg:px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {payment.transaction_id}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {payment.payment_method} • {payment.payment_gateway}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 lg:px-6 py-4 grid">
                                                <div
                                                    className="text-sm text-gray-900 truncate cursor-help"
                                                    title={getItemTitle(payment)}
                                                >
                                                    {truncateText(getItemTitle(payment))}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {payment.username}
                                                </div>
                                            </td>
                                            <td className="px-3 lg:px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(payment.amount, payment.currency)}
                                                </div>
                                            </td>
                                            <td className="px-3 lg:px-6 py-4">
                                                {getStatusBadge(payment.payment_status)}
                                            </td>
                                            <td className="px-3 lg:px-6 py-4">
                                                {getPaymentTypeBadge(payment.payment_type)}
                                            </td>
                                            <td className="px-3 lg:px-6 py-4">
                                                <div className="text-xs text-gray-900 whitespace-nowrap">
                                                    {formatDateCompact(payment.transaction_date)}
                                                </div>
                                            </td>
                                            <td className="px-3 lg:px-6 py-4">
                                                <button
                                                    onClick={() => handleViewDetails(payment)}
                                                    className="text-leafGreen hover:text-forestGreen font-medium text-sm transition-colors duration-200 flex items-center gap-1"
                                                >
                                                    <Eye size={16} />
                                                    <span className="hidden lg:inline-flex">View</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-lightGreen/20 px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Showing {(currentPage - 1) * limit + 1} to{" "}
                                            {Math.min(currentPage * limit, pagination.total)} of{" "}
                                            {pagination.total} results
                                        </div>
                                        <div className="flex items-center space-x-2">
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
                        </>
                    )}
                </div>
            </div>

            {/* Payment Detail Modal - Mobile Optimized */}
            {showDetailModal && selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-lg sm:text-xl font-semibold text-forestGreen">
                                Payment Details
                            </h2>
                            <button
                                onClick={closeDetailModal}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            <div className="space-y-4">
                                {/* Transaction Information */}
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-forestGreen mb-3">Transaction Information</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Transaction ID</label>
                                            <p className="text-xs sm:text-sm text-gray-900 break-all">{selectedPayment.transaction_id}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Reference ID</label>
                                            <p className="text-xs sm:text-sm text-gray-900 break-all">{selectedPayment.reference_id}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Payment Type</label>
                                            <div className="mt-1">{getPaymentTypeBadge(selectedPayment.payment_type)}</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Status</label>
                                            <div className="mt-1">{getStatusBadge(selectedPayment.payment_status)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Details */}
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-forestGreen mb-3">Payment Details</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Amount</label>
                                            <p className="text-base sm:text-lg font-semibold text-gray-900">
                                                {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Original Price</label>
                                            <p className="text-xs sm:text-sm text-gray-900">
                                                {formatCurrency(selectedPayment.item_price, selectedPayment.currency)}
                                            </p>
                                        </div>
                                        {selectedPayment.item_discount && parseFloat(selectedPayment.item_discount) > 0 && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-600">Discount</label>
                                                <p className="text-xs sm:text-sm text-green-600 font-semibold">
                                                    -{formatCurrency(selectedPayment.item_discount, selectedPayment.currency)}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Payment Method</label>
                                            <p className="text-xs sm:text-sm text-gray-900 capitalize">{selectedPayment.payment_method}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Gateway</label>
                                            <p className="text-xs sm:text-sm text-gray-900 capitalize">{selectedPayment.payment_gateway}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* User Information */}
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-forestGreen mb-3">User Information</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Username</label>
                                            <p className="text-xs sm:text-sm text-gray-900">{selectedPayment.username}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Email</label>
                                            <p className="text-xs sm:text-sm text-gray-900 break-all">{selectedPayment.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Item Information */}
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-forestGreen mb-3">Item Information</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Title</label>
                                            <p className="text-xs sm:text-sm text-gray-900">
                                                {getItemTitle(selectedPayment)}
                                            </p>
                                        </div>
                                        {/* {selectedPayment.course_id && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-600">Course ID</label>
                                                <p className="text-xs sm:text-sm text-gray-900">{selectedPayment.course_id}</p>
                                            </div>
                                        )} */}
                                        {selectedPayment.enrollment_date && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-600">Enrollment Date</label>
                                                <p className="text-xs sm:text-sm text-gray-900">{formatDate(selectedPayment.enrollment_date)}</p>
                                            </div>
                                        )}
                                        {selectedPayment.expiry_date && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium text-gray-600">Expiry Date</label>
                                                <p className="text-xs sm:text-sm text-gray-900">{formatDate(selectedPayment.expiry_date)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold text-forestGreen mb-3">Timestamps</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Transaction Date</label>
                                            <p className="text-xs sm:text-sm text-gray-900">{formatDate(selectedPayment.transaction_date)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-600">Created At</label>
                                            <p className="text-xs sm:text-sm text-gray-900">{formatDate(selectedPayment.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;