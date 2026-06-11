import React, { useEffect } from "react";
import AdminLoader from "../../../components/admin/AdminLoader";
import { useParams } from "react-router-dom";
import { getAdminToken } from "../../../services/CookieService";
import { useGetUsersByBatchIdMutation } from "../../../services/promocode/promocodeApi";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiMail, FiCode, FiArrowLeft } from "react-icons/fi";
import { ArrowLeft } from "lucide-react";

export default function BatchUsers() {
    const { batchId } = useParams();
    const { access_token } = getAdminToken();
    const navigate = useNavigate();

    const [
        getUsersByBatchId,
        { data, isLoading, isError }
    ] = useGetUsersByBatchIdMutation();

    useEffect(() => {
        if (batchId) {
            getUsersByBatchId({ batchId, access_token });
        }
    }, [batchId]);

    const users = data?.data || [];
    const courses = users?.[0]?.courses || [];

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
                                Batch Users
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
                                    {users.length} Users
                                </span>
                                <span className="px-2 py-1 bg-lightGreen text-forestGreen text-xs font-semibold rounded-full">
                                    Batch ID: <span className="font-semibold text-forestGreen">#{batchId}</span>
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
                                        Batch Users
                                    </h1>
                                    {/* Subtext */}
                                    <p className="text-gray-600 mt-1 truncate">
                                        Viewing all users assigned to Batch ID:{" "}<span className="font-semibold text-gray-700">#{batchId}</span>
                                    </p>
                                </div>

                                {/* Stats */}
                                {!isLoading && !isError && (
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-lightGreen text-forestGreen text-sm font-semibold rounded-full">
                                            {users.length} Users
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Back Button - Centered vertically */}
                            <div className="flex items-center">
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
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full flex-1 overflow-y-auto max-w-full px-4 py-4 sm:px-6">
                {/* COURSE LIST SECTION */}
                {courses?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-forestGreen mb-3">Courses in this Batch</h2>

                        <div className="flex flex-wrap gap-2">
                            {courses.map((c, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 sm:px-3 py-1 bg-green-100 text-leafGreen text-xs sm:text-sm font-medium rounded-full border border-green-200"
                                >
                                    {c.title}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && <AdminLoader message="Loading batch users..." />}

                {/* Error State */}
                {isError && (
                    <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 sm:p-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="bg-red-100 p-2 sm:p-3 rounded-full">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-1">Failed to Load Data</h3>
                                <p className="text-red-600 text-sm sm:text-base">Unable to fetch user data. Please try again later.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                {!isLoading && !isError && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-lightGreen">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            User Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Promo Code
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-100">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-16 text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-gray-500 font-medium text-lg">No users found</p>
                                                    <p className="text-gray-400 text-sm mt-1">This batch doesn't have any assigned users yet.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user, index) => (
                                            <tr
                                                key={index}
                                                className="hover:bg-lightGreen/20 transition-colors duration-200"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 bg-leafGreen rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                            {user?.user?.full_name?.[0]?.toUpperCase() || "U"}
                                                        </div>
                                                        <div className="ml-4 grid">
                                                            <div className="text-sm font-semibold text-gray-900 truncate">
                                                                {user?.user?.full_name || "-"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700 grid">
                                                        <span className="truncate">{user?.user?.email || "-"}</span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm text-forestGreen font-mono font-semibold bg-leafGreen/10 border border-leafGreen/10">
                                                        {user?.promo_code || "-"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="bg-gray-100 p-3 rounded-full mb-3">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 font-medium text-base">No users found</p>
                                        <p className="text-gray-400 text-xs mt-1">This batch doesn't have any assigned users yet.</p>
                                    </div>
                                </div>
                            ) : (
                                users.map((user, index) => (
                                    <div key={index} className="p-4 hover:bg-lightGreen/20 transition-colors duration-200">
                                        {/* User Header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex-shrink-0 w-10 h-10 bg-leafGreen rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                {user?.user?.full_name?.[0]?.toUpperCase() || "U"}
                                            </div>
                                            <div className="flex-1 min-w-0 grid">
                                                <div className="text-sm font-semibold text-gray-900 truncate">
                                                    {user?.user?.full_name || "-"}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {user?.user?.email || "-"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Promo Code */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <FiCode size={12} className="text-forestGreen" />
                                            <span className="text-xs text-gray-600 font-medium">Promo Code:</span>
                                        </div>
                                        <div className="px-3 py-2 bg-leafGreen/10 rounded-lg border border-leafGreen/10 mb-3">
                                            <code className="text-xs font-mono font-semibold text-forestGreen break-all">
                                                {user?.promo_code || "-"}
                                            </code>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}