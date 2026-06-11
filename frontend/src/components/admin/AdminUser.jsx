import React, { useState, useEffect } from 'react';
import AdminLoader from './AdminLoader';
import {
    useGetAllAdminsQuery,
    useCreateAdminMutation,
    useUpdateAdminMutation,
    useDeleteAdminMutation,
    useToggleAdminStatusMutation,
    useGetCurrentAdminQuery
} from '../../services/adminAuthApi';
import { useGetAllRolesQuery } from '../../services/RoleAndPermission/roleApi';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "react-hot-toast";
import { Search, Filter, X, ChevronDown, ToggleLeft, ToggleRight, Pencil, ArrowLeft, Plus, ChevronUp } from 'lucide-react';
import PermissionWrapper from '../../context/PermissionWrapper';

const AdminManagement = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleIdFilter, setRoleIdFilter] = useState('');
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [adminFormData, setAdminFormData] = useState({
        name: '',
        email: '',
        password: '',
        roleId: ''
    });

    const { data: adminData, isLoading, refetch } = useGetCurrentAdminQuery();

    // API hooks
    const { data: adminsData, refetch: refetchAdmins, isLoading: adminsLoading } = useGetAllAdminsQuery({
        search_term: searchTerm,
        role_id: roleIdFilter,
        limit: limit,
        offset: limit !== "all" ? limit * (currentPage - 1) : 0,
    });

    const { data: rolesData, isLoading: rolesLoading } = useGetAllRolesQuery({ limit: 'ALL' });
    const [createAdmin, { isLoading: createAdminLoading }] = useCreateAdminMutation();
    const [updateAdmin, { isLoading: updateAdminLoading }] = useUpdateAdminMutation();
    const [deleteAdmin] = useDeleteAdminMutation();
    const [toggleAdminStatus] = useToggleAdminStatusMutation();

    // Effects
    useEffect(() => {
        if (selectedAdmin && showAdminModal) {
            setAdminFormData({
                name: selectedAdmin.username,
                email: selectedAdmin.email,
                password: '',
                roleId: selectedAdmin.roleId
            });
        }
    }, [selectedAdmin, showAdminModal]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAdminFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        const apiData = {
            name: adminFormData.name,
            email: adminFormData.email,
            roleId: parseInt(adminFormData.roleId, 10)
        };
        if (adminFormData.password.trim() !== '') {
            apiData.password = adminFormData.password;
        }
        try {
            let response;
            if (selectedAdmin) {
                response = await updateAdmin({
                    id: selectedAdmin.id,
                    formData: { ...apiData }
                }).unwrap();
            } else {
                if (!apiData.password) {
                    toast.error('Password is required when creating a new admin');
                    return;
                }
                response = await createAdmin(apiData).unwrap();
            }
            toast.success(selectedAdmin ? 'Admin updated successfully' : 'Admin created successfully');
            closeAdminModal();
            refetchAdmins();
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'An unexpected error occurred';
            toast.error(errorMessage);
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (window.confirm('Are you sure you want to delete this admin?')) {
            try {
                await deleteAdmin(id).unwrap();
                toast.success('Admin deleted successfully');
                refetchAdmins();
            } catch (error) {
                const errorMessage = error?.data?.error ||
                    error?.data?.message ||
                    error?.error ||
                    error?.message ||
                    'Failed to delete admin';
                toast.error(errorMessage);
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            if (adminData?.data?.id === id) {
                toast.error('You cannot inactive your own account');
            } else {
                await toggleAdminStatus(id).unwrap();
                toast.success('Status updated successfully');
            }
            refetchAdmins();
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to update status';
            toast.error(errorMessage);
        }
    };

    const openAdminModal = (admin = null) => {
        setSelectedAdmin(admin);
        if (!admin) {
            setAdminFormData({
                name: '',
                email: '',
                password: '',
                roleId: rolesData?.data?.[0]?.id || ''
            });
        }
        setShowAdminModal(true);
    };

    const closeAdminModal = () => {
        setShowAdminModal(false);
        setSelectedAdmin(null);
        setAdminFormData({ name: '', email: '', password: '', roleId: '' });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const admins = adminsData?.data || [];
    const pagination = adminsData?.pagination || { total: 0, totalPages: 1 };
    const roles = rolesData?.data || [];

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="w-full px-4 sm:px-6 py-4">
                    {/* Mobile Header - Centered title with back button on right */}
                    <div className="md:hidden relative flex items-center justify-between mb-3">
                        <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent absolute left-1/2 -translate-x-1/2">
                            Admin
                        </h1>
                        <button
                            onClick={() => navigate("/admin/dashboard")}
                            className="p-2 text-gray-600 border hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative z-10 ml-auto"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    {/* Desktop Header - Original layout */}
                    <div className="hidden md:flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                Admin Management
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage administrators and their roles
                            </p>
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

                            <PermissionWrapper section="Admin" action="create">
                                <button
                                    onClick={() => openAdminModal()}
                                    className="bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                                >
                                    <Plus size={18} />
                                    <span className="hidden sm:inline-flex">Add <span className="hidden lg:inline-flex ml-1">New Admin</span></span>
                                </button>
                            </PermissionWrapper>

                            <button
                                onClick={() => navigate("/admin/dashboard")}
                                className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                            >
                                <ArrowLeft size={18} />
                                <span className="font-medium">Back</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Action Buttons - Both buttons in one row with smaller size */}
                    <div className="md:hidden flex items-center gap-2 mb-3">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm"
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                            {showFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <PermissionWrapper section="Admin" action="create">
                            <button
                                onClick={() => openAdminModal()}
                                className="flex-1 bg-leafGreen   text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium shadow-sm text-sm"
                            >
                                <Plus size={16} />
                                <span>Add Admin</span>
                            </button>
                        </PermissionWrapper>
                    </div>

                    {/* Filters */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilter ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="p-3 bg-lightGreen/20 rounded-lg border border-leafGreen/20">
                            <div className="grid grid-cols-1 sm:grid-cols-5 md:grid-cols-4 gap-3">
                                <div className='col-span-1 sm:col-span-3'>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Admins</label>
                                    <div className="relative">
                                        <Search className="absolute top-3 left-3 text-gray-400" size={14} />
                                        <input
                                            type="search"
                                            placeholder="Search by name or email..."
                                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                    </div>
                                </div>
                                <div className='col-span-1 sm:col-span-2 md:col-span-1'>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                                    <div className="relative">
                                        <select
                                            name="roleIdFilter"
                                            value={roleIdFilter}
                                            onChange={(e) => setRoleIdFilter(e.target.value || "")}
                                            required
                                            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200 appearance-none cursor-pointer pr-10"
                                        >
                                            <option value="">Select a role</option>
                                            {rolesLoading ? (
                                                <option disabled>Loading roles...</option>
                                            ) : (
                                                roles.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {(searchTerm || roleIdFilter) && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setRoleIdFilter('');
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

            <div className="w-full flex-1 overflow-y-auto p-3 sm:p-6">
                {/* Admins Table */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                    {adminsLoading ? (
                        <AdminLoader message="Loading admins..." />
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="md:hidden">
                                {admins.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="40"
                                                height="40"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="text-gray-300 mb-3"
                                            >
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                            <p className="text-base font-medium text-gray-600">No admins found.</p>
                                            <p className="text-xs text-gray-500 mt-1">Create your first admin!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        <div className="divide-y divide-gray-200">
                                            {admins.map((admin) => (
                                                <motion.div
                                                    key={admin.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="p-3 hover:bg-lightGreen/20 transition-colors duration-200"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 grid">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className='grid'>
                                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                                        {admin.username}
                                                                    </h3>
                                                                </div>
                                                                <PermissionWrapper section="Admin" action="toggle">
                                                                    <label className="relative inline-flex items-center cursor-pointer w-8 h-4"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        title={admin.is_active ? "Deactivate" : "Activate"}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={admin.is_active}
                                                                            onChange={() => handleToggleStatus(admin.id)}
                                                                            className="sr-only peer"
                                                                        />
                                                                        <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-leafGreen transition-colors"></div>
                                                                        <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                                    </label>
                                                                </PermissionWrapper>
                                                            </div>
                                                            <p className="text-xs text-gray-600 mb-1 truncate">{admin.email}</p>
                                                            <p className="text-xs text-gray-500">Role: {admin.role_name}</p>
                                                        </div>
                                                        <PermissionWrapper section="Admin" action="edit">
                                                            <button
                                                                onClick={() => openAdminModal(admin)}
                                                                className="p-1.5 rounded-full bg-lightGreen/20 text-leafGreen hover:bg-lightGreen/40 transition-colors duration-200 ml-2"
                                                                title="Edit Admin"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                        </PermissionWrapper>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </AnimatePresence>
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full relative">
                                    {/* Sticky Table Header */}
                                    <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Username
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <PermissionWrapper section="Admin" action="toggle|edit">
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </PermissionWrapper>
                                        </tr>
                                    </thead>
                                    {/* Table Body */}
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {admins.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="48"
                                                            height="48"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="text-gray-300 mb-4"
                                                        >
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="12" cy="7" r="4"></circle>
                                                        </svg>
                                                        <p className="text-lg font-medium text-gray-600">No admins found.</p>
                                                        <p className="text-sm text-gray-500 mt-2">Create your first admin!</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <AnimatePresence>
                                                {admins.map((admin) => (
                                                    <motion.tr
                                                        key={admin.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="hover:bg-lightGreen/20 transition-colors duration-200"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className='grid'>
                                                                <div className="text-sm font-medium text-gray-900 truncate">{admin.username}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className='grid'>
                                                                <div className="text-sm text-gray-500 truncate">{admin.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {admin.role_name}
                                                        </td>
                                                        <PermissionWrapper section="Admin" action="toggle|edit">
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center gap-2">
                                                                <PermissionWrapper section="Admin" action="toggle">
                                                                    <label className="relative inline-flex items-center cursor-pointer w-9 h-5"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        title={admin.is_active ? "Deactivate" : "Activate"}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={admin.is_active}
                                                                            onChange={() => handleToggleStatus(admin.id)}
                                                                            className="sr-only peer"
                                                                        />
                                                                        <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-leafGreen transition-colors"></div>
                                                                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                                    </label>
                                                                </PermissionWrapper>
                                                                <PermissionWrapper section="Admin" action="edit">
                                                                    <button
                                                                        onClick={() => openAdminModal(admin)}
                                                                        className="p-2 rounded-full bg-lightGreen/20 text-leafGreen hover:bg-lightGreen/40 transition-colors duration-200"
                                                                        title="Edit Admin"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </button>
                                                                </PermissionWrapper>
                                                            </td>
                                                        </PermissionWrapper>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="bg-lightGreen/20 px-3 sm:px-6 py-3 border-t border-gray-200">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                                            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, pagination.total)} of {pagination.total} results
                                        </div>
                                        <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap justify-center">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                            >
                                                Previous
                                            </button>
                                            <div className="flex items-center space-x-1">
                                                {[...Array(pagination.totalPages)].map((_, index) => {
                                                    const page = index + 1;
                                                    // Show limited pages on mobile
                                                    if (window.innerWidth < 640 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== pagination.totalPages) {
                                                        if (Math.abs(page - currentPage) === 2) {
                                                            return <span key={page} className="px-1 sm:px-2 text-xs">...</span>;
                                                        }
                                                        return null;
                                                    }
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageChange(page)}
                                                            className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${currentPage === page
                                                                ? "bg-leafGreen text-white"
                                                                : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                                                                }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === pagination.totalPages}
                                                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

                {/* Create Admin Modal */}
                {showAdminModal && !selectedAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
                        <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">

                            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-semibold text-forestGreen">
                                    Create New Admin
                                </h2>
                                <button
                                    onClick={closeAdminModal}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-3">
                                <form onSubmit={handleAdminSubmit} id="createAdminForm" className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={adminFormData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200"
                                            placeholder="Username"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={adminFormData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200"
                                            placeholder="Email address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={adminFormData.password}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200"
                                            placeholder="Password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                                        <div className="relative">
                                            <select
                                                name="roleId"
                                                value={adminFormData.roleId}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200 appearance-none cursor-pointer pr-10"
                                            >
                                                <option value="">Select a role</option>
                                                {rolesLoading ? (
                                                    <option disabled>Loading roles...</option>
                                                ) : (
                                                    roles.map((role) => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.name}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                                <button
                                    type="button"
                                    onClick={closeAdminModal}
                                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form='createAdminForm'
                                    disabled={createAdminLoading}
                                    className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {createAdminLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Creating...
                                        </div>
                                    ) : (
                                        "Create Admin"
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                {/* Edit Admin Modal */}
                {showAdminModal && selectedAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
                        <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">

                            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-semibold text-forestGreen">
                                    Edit Admin
                                </h2>
                                <button
                                    onClick={closeAdminModal}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 py-3">
                                <form onSubmit={handleAdminSubmit} id="editAdminForm" className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={adminFormData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200"
                                            placeholder="Username"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={adminFormData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200"
                                            placeholder="Email address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Password (leave empty to keep current)
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={adminFormData.password}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200"
                                            placeholder="New password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                                        <div className="relative">
                                            <select
                                                name="roleId"
                                                value={adminFormData.roleId}
                                                onChange={handleInputChange}
                                                required
                                                disabled={adminData?.data?.id === selectedAdmin?.id}
                                                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent transition-all duration-200 appearance-none disabled:cursor-not-allowed cursor-pointer pr-10"
                                            >
                                                <option value="">Select a role</option>
                                                {rolesLoading ? (
                                                    <option disabled>Loading roles...</option>
                                                ) : (
                                                    roles.map((role) => (
                                                        <option key={role.id} value={role.id}>
                                                            {role.name}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                                <button
                                    type="button"
                                    onClick={closeAdminModal}
                                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form='editAdminForm'
                                    disabled={updateAdminLoading}
                                    className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {updateAdminLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Updating...
                                        </div>
                                    ) : (
                                        "Update Admin"
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default AdminManagement;