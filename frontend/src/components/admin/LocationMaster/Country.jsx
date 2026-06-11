/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import AdminLoader from "../AdminLoader";
import {
    Plus,
    Edit2,
    Trash2,
    X,
    Search,
    Filter,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Eye,
    Globe,
    MapPin,
    Phone,
    Clock,
    Currency,
    Loader2,
    MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
    useCreateCountryMutation,
    useGetAllCountriesQuery,
    useUpdateCountryMutation,
    useDeleteCountryMutation,
    useToggleCountryStatusMutation,
} from "../../../services/Masters/countryAPI";
import { getAdminToken } from "../../../services/CookieService";
import PermissionWrapper from "../../../context/PermissionWrapper";

export default function Country() {
    const { id } = useSelector((state) => state.user);
    const navigate = useNavigate();

    // State management similar to ContestActivitiesPage
    const [showForm, setShowForm] = useState(false);
    const [editingCountry, setEditingCountry] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        show: false,
        countryId: null,
        countryName: ""
    });

    // Mobile specific state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Filter and sort state
    const [sortBy, setSortBy] = useState("name");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterRegion, setFilterRegion] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { access_token } = getAdminToken();

    // API hooks with search and pagination
    const { data: countriesData, isLoading, error, refetch } = useGetAllCountriesQuery({
        search_term: searchTerm,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
    });

    const isAnyFilterApplied = () => {
        return (
            searchTerm !== ""
        )
    }

    const countries = countriesData?.data?.countries || [];
    const totalCount = countriesData?.data?.total_count || 0;

    const [createCountry, { isLoading: isCreating }] = useCreateCountryMutation();
    const [updateCountry, { isLoading: isUpdating }] = useUpdateCountryMutation();
    const [deleteCountry] = useDeleteCountryMutation();
    const [toggleCountryStatus] = useToggleCountryStatusMutation();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        currency: '',
        phone_code: '',
        timezone: '',
        region: '',
        subregion: '',
        created_by: parseInt(id),
        updated_by: parseInt(id),
    });

    // Handlers similar to ContestActivitiesPage
    const handleAddCountry = () => {
        setEditingCountry(null);
        setFormData({
            name: '',
            code: '',
            currency: '',
            phone_code: '',
            timezone: '',
            region: '',
            subregion: '',
            created_by: parseInt(id),
            updated_by: parseInt(id),
        });
        setShowForm(true);
    };

    const handleEditCountry = (country) => {
        setEditingCountry(country);
        setFormData({
            name: country.name,
            code: country.code,
            currency: country.currency,
            phone_code: country.phone_code,
            timezone: country.timezone,
            region: country.region,
            subregion: country.subregion,
            created_by: parseInt(id),
            updated_by: parseInt(id),
        });
        setShowForm(true);
        setShowViewModal(false);
        setMobileMenuOpen(false);
    };

    const handleViewCountry = (country) => {
        setSelectedCountry(country);
        setShowViewModal(true);
        setMobileMenuOpen(false);
    };

    const handleDeleteCountry = (country) => {
        setDeleteConfirmation({
            show: true,
            countryId: country.id,
            countryName: country.name,
        });
        setMobileMenuOpen(false);
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteCountry(deleteConfirmation.countryId).unwrap();
            refetch();
            setDeleteConfirmation({ show: false, countryId: null, countryName: "" });
            toast.success("Country Deleted Successfully");
        } catch (error) {
            console.error("Failed to delete country:", error);
            toast.error(error?.data?.message || error?.data?.error || "Failed to delete country. Please try again.");
        }
    };

    const handleToggleStatus = async (countryId) => {
        try {
            await toggleCountryStatus(countryId).unwrap();
            refetch();
            toast.success("Country Status Updated Successfully");
        } catch (error) {
            console.error("Failed to toggle country status:", error);
            toast.error(error?.data?.message || error?.data?.error || "Failed to update country status. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCountry) {
                await updateCountry({
                    id: editingCountry.id,
                    ...formData,
                }).unwrap();
                toast.success("Country Updated Successfully");
            } else {
                await createCountry({
                    ...formData,
                    access_token,
                }).unwrap();
                toast.success("Country Created Successfully");
            }
            setShowForm(false);
            refetch();
        } catch (error) {
            const errorMessage = error?.data?.error ||
                error?.data?.message ||
                error?.error ||
                error?.message ||
                'Failed to save country. Please try again.';
            toast.error(errorMessage);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'code' || name === 'currency') {
            setFormData({ ...formData, [name]: value.toUpperCase() });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    // Filter and sort logic
    const filteredCountries = countries
        .filter((country) => {
            if (filterStatus !== "all" &&
                ((filterStatus === "active" && !country.is_active) ||
                    (filterStatus === "inactive" && country.is_active)))
                return false;
            if (filterRegion !== "all" && country.region !== filterRegion)
                return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "code") return a.code.localeCompare(b.code);
            if (sortBy === "created_at") return new Date(b.created_at) - new Date(a.created_at);
            return 0;
        });

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // UI helper functions
    const getStatusColor = (isActive) => {
        return isActive
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
    };

    const getRegionColor = (region) => {
        const colors = {
            'Asia': 'bg-lightGreen text-forestGreen',
            'Europe': 'bg-lightGreen text-forestGreen',
            'Africa': 'bg-orange-100 text-orange-800',
            'Americas': 'bg-green-100 text-green-800',
            'Oceania': 'bg-indigo-100 text-indigo-800',
        };
        return colors[region] || 'bg-gray-100 text-gray-800';
    };

    const getFieldIcon = (field) => {
        const icons = {
            phone: <Phone size={14} />,
            currency: <Currency size={14} />,
            timezone: <Clock size={14} />,
            region: <MapPin size={14} />,
        };
        return icons[field] || <Globe size={14} />;
    };

    if (isLoading) {
        return <AdminLoader message="Loading countries..." />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <X size={48} className="mx-auto" />
                    </div>
                    <p className="text-gray-600 mb-4">Failed to load countries</p>
                    <button
                        onClick={() => refetch()}
                        className="bg-leafGreen   text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
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
            <div className="bg-white border-b border-gray-200 flex-shrink-0">
                <div className="w-full px-4 sm:px-6 py-4">
                    {/* Mobile View */}
                    <div className="sm:hidden">
                        {/* Top Row - Title and Back Button */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex-1"></div> {/* Spacer for centering */}
                            <div className="flex-1 flex justify-center">
                                <h1 className="text-lg font-bold  text-forestGreen text-center">
                                    Countries
                                </h1>
                            </div>
                            <div className="flex-1 flex justify-end">
                                <button
                                    onClick={() => navigate("/admin/dashboard")}
                                    className="flex items-center gap-1 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                >
                                    <ArrowLeft size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row - Two Buttons in Columns */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Filter Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center justify-center gap-1.5 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors font-medium text-sm"
                            >
                                <Filter size={14} />
                                <span>Filters</span>
                                {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {/* Add Country Button */}
                            <PermissionWrapper section="Country" action="create">
                                <button
                                    onClick={handleAddCountry}
                                    className=" bg-leafGreen   text-white p-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors font-medium shadow-sm text-sm"
                                >
                                    <Plus size={14} />
                                    <span>Add New</span>
                                </button>
                            </PermissionWrapper>
                        </div>
                    </div>

                    {/* Tablet and Desktop View */}
                    <div className="hidden sm:block">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0 ml-10 md:ml-10 lg:ml-0">
                                <h1 className="text-xl md:text-2xl font-bold  text-forestGreen">
                                    Country Management
                                </h1>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">Manage all countries in the system</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                {/* Filter Button - Icon only on large screens, text with icon on right on tablet/desktop */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center gap-1.5 md:gap-2 md:px-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors text-sm md:text-base"
                                >
                                    <Filter size={16} className="md:w-5 md:h-5" />
                                    <span className="font-medium hidden md:inline-flex">Filters</span>
                                    {showFilters ? (
                                        <ChevronUp size={14} className="hidden md:block md:w-4 md:h-4" />
                                    ) : (
                                        <ChevronDown size={14} className="hidden md:block md:w-4 md:h-4" />
                                    )}
                                </button>

                                {/* Add Country Button - Icon only on large screens, text with icon on right on tablet/desktop */}
                                <PermissionWrapper section="Country" action="create">
                                    <button
                                        onClick={handleAddCountry}
                                        className="flex items-center gap-1.5 md:gap-2 md:px-3 p-2  bg-leafGreen   text-white rounded-lg transition-colors font-medium shadow-sm text-sm md:text-base"
                                    >
                                        <Plus size={16} className="md:w-5 md:h-5" />
                                        <span className="hidden md:inline-flex">Add Country</span>
                                    </button>
                                </PermissionWrapper>

                                {/* Back Button - Icon only on large screens, text with icon on right on tablet/desktop */}
                                <button
                                    onClick={() => navigate("/admin/dashboard")}
                                    className="flex items-center gap-1 xl:gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors whitespace-nowrap"
                                >
                                    <ArrowLeft size={18} />
                                    <span className="font-medium hidden sm:inline">Back</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters - Works for both mobile and desktop */}
                    <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search countries..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className="block w-full pl-8 md:pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {isAnyFilterApplied() && (
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setSearchTerm("");
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
            <div className="w-full flex-1 overflow-y-auto p-4 md:p-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Tablet and Desktop List Header */}
                    <div className="hidden sm:grid bg-lightGreen px-4 md:px-6 py-3 border-b border-gray-200">
                        <div className="grid grid-cols-12 gap-3 md:gap-4 text-xs font-semibold uppercase text-gray-700">
                            <div className="col-span-4">Country Name</div>
                            <div className="col-span-2 md:col-span-1">Code</div>
                            <div className="col-span-2 md:col-span-1">Phone</div>
                            <div className="col-span-2 md:col-span-1">Currency</div>
                            <div className="col-span-2 lg:col-span-1 hidden md:block">Timezone</div>
                            <div className="col-span-2 lg:col-span-1 hidden md:block">Region</div>
                            <div className="col-span-2 hidden lg:block">Sub Region</div>
                            <PermissionWrapper section="Country" action="edit|toggle">
                                <div className="col-span-2 md:col-span-1 text-center">Actions</div>
                            </PermissionWrapper>
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="bg-white divide-y divide-gray-200">
                        {filteredCountries.map((country) => (
                            <div
                                key={country.id}
                                className="group p-4 md:p-4 lg:px-6 lg:py-4 hover:bg-lightGreen/20 transition-all duration-200"
                            >
                                {/* Desktop and Tablet View */}
                                <div className="hidden sm:grid grid-cols-12 gap-3 md:gap-4 items-center">
                                    {/* Country Info */}
                                    <div className="col-span-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 group-hover:text-forestGreen transition-colors text-sm md:text-base">
                                                    {country.name}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Code & Phone */}
                                    <div className="col-span-2 md:col-span-1">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {country.code}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-2 md:col-span-1">
                                        {country.phone_code && (
                                            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                                                <Phone size={12} className="md:w-4 md:h-4" />
                                                <span>{country.phone_code}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Currency */}
                                    <div className="col-span-2 md:col-span-1">
                                        {country.currency && (
                                            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                                                <Currency size={12} className="md:w-4 md:h-4" />
                                                <span>{country.currency}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Timezone - Hidden on small tablets, shown on medium+ */}
                                    <div className="col-span-2 lg:col-span-1 hidden md:block">
                                        {country.timezone && (
                                            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                                                <Clock size={12} className="md:w-4 md:h-4" />
                                                <span className="truncate">{country.timezone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Region - Hidden on small tablets, shown on medium+ */}
                                    <div className="col-span-2 lg:col-span-1 hidden md:block">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getRegionColor(country.region)}`}
                                            >
                                                {country.region || "Global"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Sub Region - Hidden on tablets, shown on desktop */}
                                    <div className="lg:col-span-2 hidden lg:block">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize bg-gray-50 text-gray-700`}
                                            >
                                                {country.subregion || "Global"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 md:col-span-1">
                                        <div className="flex items-center justify-center gap-2 transition-opacity">
                                            <PermissionWrapper section="Country" action="edit">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditCountry(country);
                                                    }}
                                                    className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-green-100 rounded-lg flex items-center justify-center text-green-600 transition-colors"
                                                    title="Edit Country"
                                                >
                                                    <Edit2 size={12} className="md:w-4 md:h-4" />
                                                </button>
                                            </PermissionWrapper>
                                            <PermissionWrapper section="Country" action="toggle">
                                                <label
                                                    className="relative inline-flex items-center cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title={country.is_active ? "Deactivate" : "Activate"}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={country.is_active}
                                                        onChange={() => handleToggleStatus(country.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-8 h-4 md:w-9 md:h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                    <div className="absolute left-0.5 top-0.5 w-3 h-3 md:left-1 md:top-1 md:w-3 md:h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 md:peer-checked:translate-x-4"></div>
                                                </label>
                                            </PermissionWrapper>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile View */}
                                <div className="sm:hidden space-y-3">
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-base">
                                                {country.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {country.code}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                        country.is_active
                                                    )}`}
                                                >
                                                    {country.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mobile Actions Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMobileMenuOpen(mobileMenuOpen === country.id ? false : country.id);
                                                }}
                                                className="h-8 w-8 p-0 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {mobileMenuOpen === country.id && (
                                                <div className="absolute right-0 top-10 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-32">
                                                    <PermissionWrapper section="Country" action="edit">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditCountry(country);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                        >
                                                            <Edit2 size={14} />
                                                            Edit
                                                        </button>
                                                    </PermissionWrapper>
                                                    <PermissionWrapper section="Country" action="toggle">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleStatus(country.id);
                                                                setMobileMenuOpen(false);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                        >
                                                            {country.is_active ? (
                                                                <>
                                                                    <X size={14} />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Check size={10} />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </button>
                                                    </PermissionWrapper>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewCountry(country);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        {country.phone_code && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                <span className="text-gray-600">{country.phone_code}</span>
                                            </div>
                                        )}

                                        {country.currency && (
                                            <div className="flex items-center gap-2">
                                                <Currency size={14} className="text-gray-400" />
                                                <span className="text-gray-600">{country.currency}</span>
                                            </div>
                                        )}

                                        {country.timezone && (
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-gray-400" />
                                                <span className="text-gray-600 truncate">{country.timezone}</span>
                                            </div>
                                        )}

                                        {country.region && (
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" />
                                                <span className="text-gray-600">{country.region}</span>
                                            </div>
                                        )}

                                        {country.subregion && (
                                            <div className="col-span-2 flex items-center gap-2">
                                                <Globe size={14} className="text-gray-400" />
                                                <span className="text-gray-600">{country.subregion}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Toggle - Mobile */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                        <PermissionWrapper section="Country" action="toggle">
                                            <label
                                                className="relative inline-flex items-center cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={country.is_active}
                                                    onChange={() => handleToggleStatus(country.id)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                            </label>
                                        </PermissionWrapper>
                                        <span className="text-xs text-gray-500">
                                            {country.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty state */}
                    {filteredCountries.length === 0 && (
                        <div className="px-4 md:px-6 py-12 md:py-16 text-center">
                            <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Globe size={20} className="md:w-6 md:h-6 text-gray-400" />
                            </div>
                            <div className="text-gray-500 text-base md:text-lg font-medium mb-2">No countries found</div>
                            <p className="text-gray-400 text-sm md:text-base">Try adjusting your filters or add a new country.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-white">
                            {/* Mobile Pagination */}
                            <div className="md:hidden">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600 text-center">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label className="text-sm font-medium text-gray-700">Countries per page:</label>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(1); // Reset to first page when limit changes
                                                }}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
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
                                            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                                        </div>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
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
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                    {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                                    {totalCount} countries
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium text-gray-700">Countries per page:</label>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1); // Reset to first page when limit changes
                                            }}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        Previous
                                    </button>
                                    {(() => {
                                        const visiblePages = 4;
                                        let startPage = Math.max(currentPage - Math.floor(visiblePages / 2), 1);
                                        let endPage = startPage + visiblePages - 1;

                                        if (endPage > totalPages) {
                                            endPage = totalPages;
                                            startPage = Math.max(endPage - visiblePages + 1, 1);
                                        }

                                        return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-2 py-1 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${currentPage === page
                                                    ? "bg-leafGreen text-white"
                                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ));
                                    })()}
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete confirmation modal */}
            {deleteConfirmation.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md mx-auto shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 size={16} className="md:size-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-base md:text-lg font-semibold text-gray-900">Delete Country</h3>
                                <p className="text-xs md:text-sm text-gray-600">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-4 md:mb-6 text-sm md:text-base">
                            Are you sure you want to delete "<span className="font-medium">{deleteConfirmation.countryName}</span>"?
                        </p>

                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <button
                                onClick={() => setDeleteConfirmation({ show: false, countryId: null, countryName: "" })}
                                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="w-full sm:flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                            >
                                Delete Country
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Country Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl lg:max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[85vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                {editingCountry ? "Edit Country" : "Add New Country"}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="w-5 h-5 md:w-5 md:h-5" />
                            </button>
                        </div>

                        {/* Form Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            <form onSubmit={handleSubmit} id="countryForm" className="space-y-4 md:space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                    <div>
                                        <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">Country Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                                            placeholder="Enter country name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">Country Code (ISO) *</label>
                                        <input
                                            type="text"
                                            name="code"
                                            required
                                            maxLength="3"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent uppercase text-sm md:text-base"
                                            placeholder="e.g., USA"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                    <div>
                                        <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">Currency</label>
                                        <input
                                            type="text"
                                            name="currency"
                                            value={formData.currency}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                                            placeholder="e.g., USD"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">Phone Code</label>
                                        <input
                                            type="text"
                                            name="phone_code"
                                            value={formData.phone_code}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                                            placeholder="e.g., 1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                    <div>
                                        <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">Timezone</label>
                                        <input
                                            type="text"
                                            name="timezone"
                                            value={formData.timezone}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                                            placeholder="e.g., UTC-5"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">Region</label>
                                        <select
                                            name="region"
                                            value={formData.region}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                                        >
                                            <option value="">Select Region</option>
                                            <option value="Asia">Asia</option>
                                            <option value="Europe">Europe</option>
                                            <option value="Africa">Africa</option>
                                            <option value="Americas">Americas</option>
                                            <option value="Oceania">Oceania</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">Subregion</label>
                                    <input
                                        type="text"
                                        name="subregion"
                                        value={formData.subregion}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                                        placeholder="Enter subregion"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer Buttons */}
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
                                form="countryForm"
                                disabled={isCreating || isUpdating}
                                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingCountry ? "Update Country" : "Create Country"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && selectedCountry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[85vh]">
                        {/* Fixed Header */}
                        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
                            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Country Details</h2>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="w-5 h-5 md:w-5 md:h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            <div className="space-y-4 md:space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700">Country Name</label>
                                        <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCountry.name}</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700">Country Code</label>
                                        <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCountry.code}</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700">Currency</label>
                                        <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCountry.currency || "N/A"}</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700">Phone Code</label>
                                        <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCountry.phone_code || "N/A"}</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700">Timezone</label>
                                        <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCountry.timezone || "N/A"}</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700">Status</label>
                                        <p className="mt-1">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                                                    selectedCountry.is_active
                                                )}`}
                                            >
                                                {selectedCountry.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700">Region</label>
                                        <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCountry.region || "N/A"}</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs md:text-sm font-medium text-gray-700">Subregion</label>
                                        <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCountry.subregion || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="flex flex-col gap-2 md:flex-row md:justify-end md:space-x-3 p-4 md:p-6 border-t border-gray-200 bg-white sticky bottom-0 rounded-b-xl">
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="w-full md:w-auto px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                            >
                                Close
                            </button>
                            <PermissionWrapper section="Country" action="edit">
                                <button
                                    onClick={() => handleEditCountry(selectedCountry)}
                                    className="w-full md:w-auto px-4 py-2.5 bg-leafGreen text-white rounded-lg   transition-colors font-medium text-sm"
                                >
                                    Edit Country
                                </button>
                            </PermissionWrapper>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Add missing Check icon component
function Check(props) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}