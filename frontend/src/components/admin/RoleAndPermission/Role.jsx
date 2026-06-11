/* eslint-disable no-unused-vars */
import AdminLoader from '../AdminLoader';
import React, { useState, useEffect } from 'react';
import {
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useGetAllRolesQuery,
    useDeleteRoleMutation,
    useToggleRoleMutation
} from '../../../services/RoleAndPermission/roleApi';
import { useNavigate } from 'react-router-dom';
import { getAdminToken } from '../../../services/CookieService';
import { Search, X, Pencil, Trash2, Key, User, ArrowLeft, Filter, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { toast } from "react-hot-toast";
import PermissionWrapper from '../../../context/PermissionWrapper';
import { FaToggleOn } from 'react-icons/fa';
import { motion } from "framer-motion";
import { slugify } from '../../../utils/slugify';
import { useGetCurrentAdminQuery } from '../../../services/adminAuthApi';

const RolePermission = () => {
    const navigate = useNavigate();
    const { access_token } = getAdminToken();
    // Get the access token string (handle both formats)
    const tokenString = typeof access_token === 'string' ? access_token : access_token?.access_token || '';
    // State management
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [roleFormData, setRoleFormData] = useState({
        name: '',
        description: '',
    });
    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);

    const { data: adminData, isLoading, refetch } = useGetCurrentAdminQuery();

    // API hooks
    const { data: rolesData, refetch: refetchRoles, isLoading: rolesLoading } = useGetAllRolesQuery({
        search_term: searchTerm,
        offset: limit !== "all" ? limit * (currentPage - 1) : 0,
        limit: limit,
        access_token: tokenString
    });

    const [createRole, { isLoading: createRoleLoading }] = useCreateRoleMutation();
    const [updateRole, { isLoading: updateRoleLoading }] = useUpdateRoleMutation();
    const [deleteRole] = useDeleteRoleMutation();
    const [toggleRole] = useToggleRoleMutation();

    // Effects
    useEffect(() => {
        if (selectedRole && showRoleModal) {
            setRoleFormData({
                name: selectedRole.name,
                description: selectedRole.description,
            });
        }
    }, [selectedRole, showRoleModal]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRoleFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (selectedRole) {
                response = await updateRole({
                    id: selectedRole.id,
                    data: roleFormData
                }).unwrap();
            } else {
                response = await createRole({
                    data: roleFormData
                }).unwrap();
            }
            toast.success(
                selectedRole
                    ? 'Role updated successfully'
                    : 'Role created successfully'
            );
            closeRoleModal();
            refetchRoles();
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'An unexpected error occurred';
            toast.error(errorMessage);
        }
    };

    const openDeleteModal = (role) => {
        setRoleToDelete(role);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setRoleToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!roleToDelete) return;
        try {
            await deleteRole({ id: roleToDelete.id }).unwrap();
            toast.success('Role deleted successfully');
            closeDeleteModal();
            refetchRoles();
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        }
    };

    const handleDeleteRole = (id) => {
        // This is now unused; modal handles the deletion
    };

    const handleToggleRole = async (id) => {
        try {
            if (adminData?.data?.roleId === id) {
                toast.error('You cannot inactive your own role');
            } else {
                await toggleRole({ id }).unwrap();
                toast.success('Role Status Updated Successfully');
            }
            refetchRoles();
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to Toggle role';
            toast.error(errorMessage);
        }
    };

    const openRoleModal = (role = null) => {
        setSelectedRole(role);
        if (!role) {
            setRoleFormData({ name: '', description: '' });
        }
        setShowRoleModal(true);
    };

    const closeRoleModal = () => {
        setShowRoleModal(false);
        setSelectedRole(null);
        setRoleFormData({ name: '', description: '' });
    };

    const openPermissionModal = (role) => {
        navigate(`/admin/dashboard/role-permissions/${slugify(role.name)}`, {
            state: { roleId: role.id }
        })
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const roles = rolesData?.data || [];
    const pagination = rolesData?.pagination || { total: 0, totalPages: 1 };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="w-full px-4 sm:px-6 py-4">
                    {/* Mobile Header - Centered title with back button on right */}
                    <div className="md:hidden flex items-center justify-between mb-3">
                        <div className="flex-1 text-center">
                            <h1 className="text-xl ml-6 font-bold bg-forestGreen bg-clip-text text-transparent">
                                Role & Permission
                            </h1>
                        </div>
                        <button
                            onClick={() => navigate("/admin/dashboard")}
                            className="p-2 border text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    {/* Desktop Header - Original layout */}
                    <div className="hidden md:flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                Role & Permission Management
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage roles, their permissions, and status
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

                            <PermissionWrapper section="Role" action="create">
                                <button
                                    onClick={() => openRoleModal()}
                                    className=" bg-leafGreen   text-white px-4 lg:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                                >
                                    <Plus size={18} />
                                    <span className="hidden sm:inline-flex">Add<span className="hidden lg:inline-flex ml-1">New Role</span></span>
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

                        <PermissionWrapper section="Role" action="create">
                            <button
                                onClick={() => openRoleModal()}
                                className="flex-1  bg-leafGreen   text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium shadow-sm text-sm"
                            >
                                <Plus size={16} />
                                <span>Add Role</span>
                            </button>
                        </PermissionWrapper>
                    </div>

                    {/* Filters */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilter ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="p-3 bg-lightGreen/20 rounded-lg border border-leafGreen/20">
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Roles</label>
                                    <div className="relative">
                                        <Search className="absolute top-3 left-3 text-gray-400" size={14} />
                                        <input
                                            type="search"
                                            placeholder="Search by name or description..."
                                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen"
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                    </div>
                                </div>
                            </div>
                            {searchTerm && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => setSearchTerm('')}
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
                {/* Roles Table */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                    {rolesLoading ? (
                        <AdminLoader message="Loading roles..." />
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="md:hidden">
                                {roles.length === 0 ? (
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
                                            <p className="text-base font-medium text-gray-600">No roles found.</p>
                                            <p className="text-xs text-gray-500 mt-1">Create your first role!</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {roles.map((role) => (
                                            <motion.div
                                                key={role.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                                className="p-3 hover:bg-lightGreen/20 transition-colors duration-200"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-sm font-semibold text-gray-900">
                                                                {role.name}
                                                            </h3>
                                                            <PermissionWrapper section="Role" action="toggle">
                                                                <label className="relative inline-flex items-center cursor-pointer w-8 h-4"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    title={role.is_active ? "Deactivate" : "Activate"}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={role.is_active}
                                                                        onChange={() => handleToggleRole(role.id)}
                                                                        className="sr-only peer"
                                                                    />
                                                                    <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-leafGreen transition-colors"></div>
                                                                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                                </label>
                                                            </PermissionWrapper>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mb-2">
                                                            {role.description || 'No description'}
                                                        </p>
                                                        <PermissionWrapper section="Permission" action="view">
                                                            <button
                                                                onClick={() => openPermissionModal(role)}
                                                                className="text-leafGreen hover:text-forestGreen flex items-center"
                                                            >
                                                                <Key className="h-3.5 w-3.5 mr-1" />
                                                                Manage Permissions
                                                            </button>
                                                        </PermissionWrapper>
                                                    </div>
                                                    <PermissionWrapper section="Role" action="edit|delete">
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <PermissionWrapper section="Role" action="edit">
                                                                <button
                                                                    onClick={() => openRoleModal(role)}
                                                                    className="p-1.5 rounded-full bg-lightGreen/20 text-leafGreen hover:bg-lightGreen/40 transition-colors duration-200"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                            </PermissionWrapper>
                                                            <PermissionWrapper section="Role" action="delete">
                                                                <button
                                                                    onClick={() => openDeleteModal(role)}
                                                                    className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </PermissionWrapper>
                                                        </div>
                                                    </PermissionWrapper>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full relative">
                                    {/* Sticky Table Header */}
                                    <thead className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Role Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <PermissionWrapper section="Permission" action="view">
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Permissions
                                                </th>
                                            </PermissionWrapper>
                                            <PermissionWrapper section="Role" action="edit|delete|toggle">
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </PermissionWrapper>
                                        </tr>
                                    </thead>
                                    {/* Table Body */}
                                    <tbody className="divide-y divide-gray-200">
                                        {roles.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center">
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
                                                        <p className="text-lg font-medium text-gray-600">No roles found.</p>
                                                        <p className="text-sm text-gray-500 mt-2">Create your first role!</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            roles.map((role) => (
                                                <tr key={role.id} className="hover:bg-lightGreen/20 transition-colors duration-200">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{role.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {role.description || '-'}
                                                    </td>
                                                    <PermissionWrapper section="Permission" action="view">
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            <button
                                                                onClick={() => openPermissionModal(role)}
                                                                className="text-leafGreen hover:text-forestGreen flex items-center"
                                                            >
                                                                <Key className="h-4 w-4 mr-2" />
                                                                Manage Permissions
                                                            </button>
                                                        </td>
                                                    </PermissionWrapper>
                                                    <PermissionWrapper section="Role" action="edit|delete|toggle">
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center gap-2">
                                                            <PermissionWrapper section="Role" action="edit">
                                                                <button
                                                                    onClick={() => openRoleModal(role)}
                                                                    className="p-2 rounded-full bg-lightGreen/20 text-leafGreen hover:bg-lightGreen/40 transition-colors duration-200"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                            </PermissionWrapper>
                                                            <PermissionWrapper section="Role" action="toggle">
                                                                <label className="relative inline-flex items-center cursor-pointer w-9 h-5"
                                                                    onClick={(e) => e.stopPropagation()} // 👈 prevent row click
                                                                    title={role.is_active ? "Deactivate" : "Activate"}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={role.is_active}
                                                                        onChange={() => handleToggleRole(role.id)}
                                                                        className="sr-only peer"
                                                                    />
                                                                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-leafGreen transition-colors"></div>
                                                                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                                                </label>
                                                            </PermissionWrapper>
                                                            <PermissionWrapper section="Role" action="delete">
                                                                <button
                                                                    onClick={() => openDeleteModal(role)}
                                                                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </PermissionWrapper>
                                                        </td>
                                                    </PermissionWrapper>
                                                </tr>
                                            ))
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

                {/* Create Role Modal */}
                {showRoleModal && !selectedRole && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                                <h2 className="text-lg sm:text-xl font-semibold text-forestGreen truncate">
                                    Create New Role
                                </h2>
                                <button
                                    onClick={closeRoleModal}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <form id="roleForm" onSubmit={handleRoleSubmit} className="space-y-4 sm:space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={roleFormData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen transition-all duration-200"
                                            placeholder="Role name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={roleFormData.description}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen transition-all duration-200"
                                            placeholder="Role description"
                                            rows="4"
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                                <button
                                    type="button"
                                    onClick={closeRoleModal}
                                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="roleForm"
                                    disabled={createRoleLoading}
                                    className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create < span className="hidden sm:inline">Role</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Role Modal */}
                {showRoleModal && selectedRole && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                                <h2 className="text-lg sm:text-xl font-semibold text-forestGreen truncate">
                                    Edit Role
                                </h2>
                                <button
                                    onClick={closeRoleModal}
                                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <form id="roleForm" onSubmit={handleRoleSubmit} className="space-y-4 sm:space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={roleFormData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen transition-all duration-200"
                                            placeholder="Role name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={roleFormData.description}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen transition-all duration-200"
                                            placeholder="Role description"
                                            rows="4"
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
                                <button
                                    type="button"
                                    onClick={closeRoleModal}
                                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="roleForm"
                                    disabled={updateRoleLoading}
                                    className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Update < span className="hidden sm:inline">Role</span>
                                </button>
                            </div>
                        </div>
                    </div>

                )}

                {/* Delete Role Modal */}
                {showDeleteModal && roleToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-4 sm:p-6">
                                <div className="flex justify-between items-center mb-4 sm:mb-6">
                                    <h2 className="text-xl sm:text-2xl font-bold text-forestGreen">Delete Role</h2>
                                    <button
                                        onClick={closeDeleteModal}
                                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                            <Trash2 className="h-6 w-6 text-red-600" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                            Are you sure you want to delete <span className="font-semibold text-red-600">"{roleToDelete.name}"</span>?
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            This action cannot be undone. This will permanently delete the role and all associated data.
                                        </p>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeDeleteModal}
                                            className="px-4 sm:px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmDelete}
                                            className="px-4 sm:px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200"
                                        >
                                            Delete Role
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default RolePermission;