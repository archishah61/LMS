import React, { useState, useEffect } from 'react';
import AdminLoader from '../AdminLoader';
import {
    useGetRoleByIdQuery
} from '../../../services/RoleAndPermission/roleApi';
import {
    useGetAllPermissionsQuery,
} from '../../../services/RoleAndPermission/permissionApi';
import {
    useManageRolePermissionsMutation,
    useGetPermissionsByRoleIdQuery,
} from '../../../services/RoleAndPermission/rolePermissionApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAdminToken } from '../../../services/CookieService';
import { X, Check, AlertCircle, Search, ArrowLeft, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from "react-hot-toast";

// Permission status indicator component
const PermissionStatus = React.memo(function PermissionStatus({ checked, onChange, id }) {
    return (
        <div
            onClick={() => onChange(id)}
            className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full cursor-pointer transition-all duration-200 shadow-sm ${checked
                ? 'bg-green-100 hover:bg-green-200 border-2 border-green-300'
                : 'bg-red-100 hover:bg-red-200 border-2 border-red-300'
                }`}
        >
            {checked ? (
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            ) : (
                <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
            )}
        </div>
    );
});

const Permission = () => {
    const navigate = useNavigate();
    const { roleId } = useLocation().state;
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [permissionsBySection, setPermissionsBySection] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filteredPermissionsBySection, setFilteredPermissionsBySection] = useState([]);
    const { access_token } = getAdminToken();
    const tokenString = typeof access_token === 'string' ? access_token : access_token?.access_token || '';

    // Fetch role data
    const { data: roleData } = useGetRoleByIdQuery(
        {
            id: roleId,
            access_token: tokenString
        },
        { skip: !roleId }
    );

    // Fetch all permissions
    const { data: permissionsData, isLoading: permissionsLoading } = useGetAllPermissionsQuery({
        search_term: searchTerm,
        limit: 100,
        offset: 0,
        access_token: tokenString
    });

    // Fetch role permissions
    const { data: rolePermissions, refetch: refetchRolePermissions } = useGetPermissionsByRoleIdQuery(
        {
            roleId,
            access_token: tokenString
        },
        { skip: !roleId }
    );

    // Mutation for updating permissions
    const [manageRolePermissions, { isLoading: savingPermissions }] = useManageRolePermissionsMutation();

    // Update selected permissions when role permissions data changes
    useEffect(() => {
        if (rolePermissions?.data) {
            setSelectedPermissions(rolePermissions.data.map(p => p.permissionId));
        }
    }, [rolePermissions]);

    // Group permissions by section
    useEffect(() => {
        if (permissionsData?.data) {
            const permissions = permissionsData.data || [];
            const groupedPermissions = permissions.reduce((acc, permission) => {
                const section = permission.section || 'Other';
                if (!acc[section]) {
                    acc[section] = {
                        name: section,
                        view: null,
                        create: null,
                        update: null,
                        delete: null,
                        toggle: null,
                        additionalPermissions: [],
                        allPermissions: []
                    };
                }
                acc[section].allPermissions.push(permission);
                const action = permission.action?.toLowerCase() || '';
                if (action.includes('view')) acc[section].view = permission;
                else if (action.includes('create')) acc[section].create = permission;
                else if (action.includes('edit') || action.includes('update')) acc[section].update = permission;
                else if (action.includes('delete')) acc[section].delete = permission;
                else if (action.includes('toggle')) acc[section].toggle = permission;
                else acc[section].additionalPermissions.push(permission);
                return acc;
            }, {});

            setPermissionsBySection(Object.values(groupedPermissions));
        }
    }, [permissionsData]);

    // Filter permissions based on search term
    useEffect(() => {
        // if (!searchTerm.trim()) {
        //     setFilteredPermissionsBySection(permissionsBySection);
        // } else {
        //     const filtered = permissionsBySection.filter(section => {
        //         const sectionNameMatch = section.name.toLowerCase().includes(searchTerm.toLowerCase());
        //         const permissionMatch = section.allPermissions.some(permission =>
        //             permission.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        //             permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
        //         );
        //         return sectionNameMatch || permissionMatch;
        //     });
        //     setFilteredPermissionsBySection(filtered);
        // }

        setFilteredPermissionsBySection(permissionsBySection);

    }, [searchTerm, permissionsBySection]);

    // Permission toggle handler
    const handlePermissionToggle = (permissionId) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    // Select all permissions for a section
    const handleSectionSelectAll = (section) => {
        const sectionPermissions = section.allPermissions.map(p => p.id);
        const allSelected = sectionPermissions.every(id => selectedPermissions.includes(id));
        if (allSelected) {
            setSelectedPermissions(prev =>
                prev.filter(id => !sectionPermissions.includes(id))
            );
        } else {
            const newSelectedIds = [...selectedPermissions];
            sectionPermissions.forEach(id => {
                if (!newSelectedIds.includes(id)) {
                    newSelectedIds.push(id);
                }
            });
            setSelectedPermissions(newSelectedIds);
        }
    };

    // Select all permissions
    const handleSelectAllPermissions = () => {
        const allPermissionIds = permissionsData?.data?.map(p => p.id) || [];
        const allSelected = allPermissionIds.length > 0 &&
            allPermissionIds.every(id => selectedPermissions.includes(id));
        if (allSelected) {
            setSelectedPermissions([]);
        } else {
            setSelectedPermissions(allPermissionIds);
        }
    };

    // Save permissions
    const handleSaveRolePermissions = async () => {
        if (!roleId) return;
        try {
            await toast.promise(
                manageRolePermissions({
                    data: {
                        roleId,
                        permissions: selectedPermissions,
                        access_token: tokenString
                    },
                }),
                {
                    loading: 'Saving permissions...',
                    success: 'Permissions saved successfully!',
                    error: 'Failed to save permissions.'
                }
            );
            setTimeout(() => {
                navigate(-1);
                refetchRolePermissions();
            }, 1000);
        } catch (error) {
            console.error('Error updating role permissions:', error);
        }
    };

    // Close modal
    const closePermissionModal = () => {
        navigate(-1);
    };

    // Check if a section has all permissions selected
    const isSectionFullySelected = (sectionPermissions) => {
        return sectionPermissions.every(p => selectedPermissions.includes(p.id));
    };

    const permissions = permissionsData?.data || [];
    const allPermissionsSelected = permissions.length > 0 &&
        permissions.every(permission => selectedPermissions.includes(permission.id));

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="w-full px-4 sm:px-6 py-4">
                    {/* Mobile Header - Centered title with back button on right */}
                    <div className="md:hidden flex items-center justify-between mb-3">
                        <div className="flex-1 text-center">
                            <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                Permissions
                            </h1>
                            <p className="text-xs text-gray-600 mt-1 truncate">
                                {roleData?.data?.name ? `For: ${roleData.data.name}` : "Manage Permissions"}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-gray-600 border hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    {/* Desktop Header - Original layout */}
                    <div className="hidden md:flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                                Role Permissions
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {roleData?.data?.name ? `Managing permissions for: ${roleData?.data?.name}` : "Manage Permissions"}
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

                            <button
                                onClick={handleSaveRolePermissions}
                                disabled={savingPermissions}
                                className=" bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                            >
                                {savingPermissions ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Save Permissions
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleSelectAllPermissions}
                                className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm ${allPermissionsSelected
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                    }`}
                            >
                                {allPermissionsSelected ? (
                                    <>
                                        <X size={18} />
                                        Deselect All
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Select All
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => navigate(-1)}
                                className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                            >
                                <ArrowLeft size={18} />
                                <span className="font-medium">Back</span>
                            </button>
                        </div>
                    </div>
                    {/* Mobile Action Buttons - All three buttons in one row */}
                    <div className="md:hidden flex items-center gap-2 mb-3">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-xs"
                        >
                            <Filter size={14} />
                            <span>Filters</span>
                            {showFilter ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        <button
                            onClick={handleSelectAllPermissions}
                            className={`flex-1 px-2 py-2 rounded-lg flex items-center justify-center gap-1 font-medium shadow-sm text-xs ${allPermissionsSelected
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                        >
                            {allPermissionsSelected ? (
                                <>
                                    <X size={14} />
                                    <span className="hidden xs:inline">Deselect</span>
                                    <span className="xs:hidden">All</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span className="hidden xs:inline">Select</span>
                                    <span className="xs:hidden">All</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleSaveRolePermissions}
                            disabled={savingPermissions}
                            className="flex-1  bg-leafGreen   text-white px-2 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors font-medium shadow-sm text-xs"
                        >
                            {savingPermissions ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="hidden xs:inline">Saving</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span className="hidden xs:inline">Save</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Filters */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilter ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="p-3 bg-lightGreen/20 rounded-lg border border-leafGreen/20">
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Permissions</label>
                                    <div className="relative">
                                        <Search className="absolute top-2.5 left-3 text-gray-400" size={14} />
                                        <input
                                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen"
                                            type="text"
                                            placeholder="Search permissions or modules..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            {searchTerm !== "" && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setSearchTerm("")
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
                {/* Main Content Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
                    {permissionsLoading ? (
                        <AdminLoader message="Loading permissions..." />
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="md:hidden">
                                {filteredPermissionsBySection.length === 0 ? (
                                    <div className="flex flex-col justify-center items-center py-12">
                                        <AlertCircle className="text-gray-300 mb-4" size={40} />
                                        <p className="text-gray-500 text-base font-medium text-center">
                                            {searchTerm ? 'No permissions found matching your search' : 'No permissions found'}
                                        </p>
                                        {searchTerm && (
                                            <p className="text-gray-400 text-sm mt-2 text-center">
                                                Try adjusting your search terms
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {filteredPermissionsBySection.map((section, index) => {
                                            const isFullySelected = isSectionFullySelected(section.allPermissions);
                                            return (
                                                <div key={section.name} className="p-3 bg-white border-b border-gray-100">
                                                    {/* Section Header */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-2 h-2  bg-leafGreen text-white rounded-full"></div>
                                                            <span className="font-semibold text-gray-900 text-sm">
                                                                {section.name}
                                                            </span>
                                                        </div>
                                                        <PermissionStatus
                                                            id={section.name}
                                                            checked={isFullySelected}
                                                            onChange={() => handleSectionSelectAll(section)}
                                                        />
                                                    </div>

                                                    {/* Basic Permissions */}
                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                        {['view', 'create', 'update', 'delete', 'toggle'].map((actionKey) => (
                                                            section[actionKey] && (
                                                                <div key={actionKey} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                                                    <span className="text-xs font-medium text-gray-700 capitalize">
                                                                        {actionKey}
                                                                    </span>
                                                                    <PermissionStatus
                                                                        id={section[actionKey].id}
                                                                        checked={selectedPermissions.includes(section[actionKey].id)}
                                                                        onChange={handlePermissionToggle}
                                                                    />
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>

                                                    {/* Additional Permissions */}
                                                    {section.additionalPermissions.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2 flex items-center">
                                                                <div className="w-1.5 h-1.5 bg-leafGreen rounded-full mr-2"></div>
                                                                Additional Permissions
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {section.additionalPermissions.map(permission => (
                                                                    <div
                                                                        key={permission.id}
                                                                        className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200"
                                                                    >
                                                                        <span className="text-xs text-gray-700 font-medium">
                                                                            {permission.action}
                                                                        </span>
                                                                        <PermissionStatus
                                                                            id={permission.id}
                                                                            checked={selectedPermissions.includes(permission.id)}
                                                                            onChange={handlePermissionToggle}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-y-auto flex-1 max-h-[calc(100vh-230px)]">
                                {/* Table Header */}
                                <div className="bg-lightGreen border-b border-gray-200 sticky top-0 z-20">
                                    <div className="grid grid-cols-7 gap-4 px-6 py-4">
                                        <div className="text-left">
                                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Permission Module
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                All
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Read
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Create
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Update
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Delete
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Toggle
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Body */}
                                {filteredPermissionsBySection.length === 0 ? (
                                    <div className="flex flex-col justify-center items-center py-20">
                                        <AlertCircle className="text-gray-300 mb-4" size={48} />
                                        <p className="text-gray-500 text-lg font-medium">
                                            {searchTerm ? 'No permissions found matching your search' : 'No permissions found'}
                                        </p>
                                        {searchTerm && (
                                            <p className="text-gray-400 text-sm mt-2">
                                                Try adjusting your search terms
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {filteredPermissionsBySection.map((section, index) => {
                                            const isFullySelected = isSectionFullySelected(section.allPermissions);
                                            return (
                                                <div key={section.name} className="transition-all duration-200 hover:bg-lightGreen/20 bg-white">
                                                    {/* Section Row */}
                                                    <div className="grid grid-cols-7 gap-4 px-6 py-5 border-l-4 border-transparent hover:border-leafGreen transition-all duration-200">
                                                        <div className="flex items-center">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-3 h-3  bg-leafGreen text-white rounded-full"></div>
                                                                </div>
                                                                <span className="font-semibold text-gray-900 text-sm">
                                                                    {section.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-center">
                                                            <PermissionStatus
                                                                id={section.name}
                                                                checked={isFullySelected}
                                                                onChange={() => handleSectionSelectAll(section)}
                                                            />
                                                        </div>
                                                        {['view', 'create', 'update', 'delete', 'toggle'].map((actionKey) => (
                                                            <div key={actionKey} className="flex justify-center">
                                                                {section[actionKey] ? (
                                                                    <PermissionStatus
                                                                        id={section[actionKey].id}
                                                                        checked={selectedPermissions.includes(section[actionKey].id)}
                                                                        onChange={handlePermissionToggle}
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 flex items-center justify-center">
                                                                        <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Additional Permissions */}
                                                    {section.additionalPermissions.length > 0 && (
                                                        <div className="bg-lightGreen/10 px-6 py-4 border-t border-gray-100">
                                                            <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3 flex items-center">
                                                                <div className="w-2 h-2 bg-leafGreen rounded-full mr-2"></div>
                                                                Additional Permissions
                                                            </h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                                {section.additionalPermissions.map(permission => (
                                                                    <div
                                                                        key={permission.id}
                                                                        className="flex items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:border-leafGreen/10"
                                                                    >
                                                                        <PermissionStatus
                                                                            id={permission.id}
                                                                            checked={selectedPermissions.includes(permission.id)}
                                                                            onChange={handlePermissionToggle}
                                                                        />
                                                                        <span className="ml-3 text-sm text-gray-700 font-medium">
                                                                            {permission.action}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Statistics */}
                            {!permissionsLoading && permissionsData?.totalCount > 0 && (
                                <div className="bg-lightGreen/20 px-4 sm:px-6 py-3 border-t border-gray-200">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                                            {selectedPermissions.length} of {permissionsData?.totalCount} permissions selected
                                        </div>
                                        <div className="flex items-center space-x-4 sm:space-x-6">
                                            <div className="text-center">
                                                <div className="text-lg sm:text-2xl font-bold text-leafGreen">{selectedPermissions.length}</div>
                                                <div className="text-xs sm:text-sm text-gray-600">Selected</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg sm:text-2xl font-bold text-leafGreen">
                                                    {permissionsData?.totalCount > 0 ? Math.round((selectedPermissions.length / permissionsData?.totalCount) * 100) : 0}%
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-600">Coverage</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Permission;