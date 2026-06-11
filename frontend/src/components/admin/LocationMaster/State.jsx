/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
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
  MapPin,
  Clock,
  Globe,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  useCreateStateMutation,
  useGetAllStatesQuery,
  useUpdateStateMutation,
  useToggleStateStatusMutation,
} from "../../../services/Masters/stateAPI";
import {
  useGetAllCountriesQuery,
} from "../../../services/Masters/countryAPI";
import { getAdminToken } from "../../../services/CookieService";
import PermissionWrapper from "../../../context/PermissionWrapper";

export default function State() {
  const { id } = useSelector((state) => state.user);
  const navigate = useNavigate();

  // State management similar to Country page
  const [showForm, setShowForm] = useState(false);
  const [editingState, setEditingState] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Mobile specific state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter and sort state
  const [sortBy, setSortBy] = useState("name");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { access_token } = getAdminToken();

  // API hooks
  const { data: countriesData } = useGetAllCountriesQuery({
    limit: "ALL",
  });

  const { data: statesData, isLoading, error, refetch } = useGetAllStatesQuery({
    search_term: searchTerm,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    country_id: filterCountry === "all" ? "" : filterCountry,
  });

  const isAnyFilterApplied = () => {
    return (
      searchTerm !== "" ||
      filterCountry !== "all"
    )
  }

  const states = statesData?.data?.states || [];
  const totalCount = statesData?.data?.total_count || 0;

  const [createState, { isLoading: isCreating }] = useCreateStateMutation();
  const [updateState, { isLoading: isUpdating }] = useUpdateStateMutation();
  const [toggleStateStatus] = useToggleStateStatusMutation();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country_id: '',
    timezone: '',
    created_by: parseInt(id),
    updated_by: parseInt(id),
  });

  // Handlers similar to Country page
  const handleAddState = () => {
    setEditingState(null);
    setFormData({
      name: '',
      code: '',
      country_id: '',
      timezone: '',
      created_by: parseInt(id),
      updated_by: parseInt(id),
    });
    setShowForm(true);
  };

  const handleEditState = (state) => {
    setEditingState(state);
    setFormData({
      name: state.name,
      code: state.code,
      country_id: state.country_id,
      timezone: state.timezone,
      created_by: parseInt(id),
      updated_by: parseInt(id),
    });
    setShowForm(true);
    setShowViewModal(false);
    setMobileMenuOpen(false);
  };

  const handleViewState = (state) => {
    setSelectedState(state);
    setShowViewModal(true);
    setMobileMenuOpen(false);
  };

  const handleToggleStatus = async (stateId) => {
    try {
      await toggleStateStatus(stateId).unwrap();
      refetch();
      toast.success("State Status Updated Successfully");
    } catch (error) {
      console.error("Failed to toggle state status:", error);
      toast.error(error?.data?.message || error?.data?.error || "Failed to update state status. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingState) {
        await updateState({
          id: editingState.id,
          ...formData,
        }).unwrap();
        toast.success("State Updated Successfully");
      } else {
        await createState({
          ...formData,
          access_token,
        }).unwrap();
        toast.success("State Created Successfully");
      }
      setShowForm(false);
      refetch();
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to save state. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'code') {
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filter and sort logic
  const filteredStates = states
    .filter((state) => {
      if (filterStatus !== "all" &&
        ((filterStatus === "active" && !state.is_active) ||
          (filterStatus === "inactive" && state.is_active)))
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "code") return a.code.localeCompare(b.code);
      if (sortBy === "country") return a.country_name.localeCompare(b.country_name);
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

  const getCountryColor = (countryName) => {
    const colors = {
      'United States': 'bg-lightGreen text-forestGreen',
      'Canada': 'bg-red-100 text-red-800',
      'India': 'bg-orange-100 text-orange-800',
      'United Kingdom': 'bg-lightGreen text-forestGreen',
      'Australia': 'bg-green-100 text-green-800',
    };
    return colors[countryName] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <AdminLoader message="Loading states..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">Failed to load states</p>
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
                  States
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

              {/* Add State Button */}
              <PermissionWrapper section="State" action="create">
                <button
                  onClick={handleAddState}
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
                  State Management
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">Manage all states in the system</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {/* Filter Button */}
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

                {/* Add State Button */}
                <PermissionWrapper section="State" action="create">
                  <button
                    onClick={handleAddState}
                    className="flex items-center gap-1.5 md:gap-2 md:px-3 p-2  bg-leafGreen   text-white rounded-lg transition-colors font-medium shadow-sm text-sm md:text-base"
                  >
                    <Plus size={16} className="md:w-5 md:h-5" />
                    <span className="hidden md:inline-flex">Add State</span>
                  </button>
                </PermissionWrapper>

                {/* Back Button */}
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

          {/* Filters */}
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
                      placeholder="Search states..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="block w-full pl-8 md:pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm"
                  >
                    <option value="all">All Countries</option>
                    {countriesData?.data?.countries?.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterCountry("all");
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
            <div className="grid grid-cols-12 gap-3 md:gap-4 text-xs uppercase font-semibold text-gray-700">
              <div className="col-span-5 md:col-span-4">State Name</div>
              <div className="col-span-2 md:col-span-1">Code</div>
              <div className="col-span-3 md:col-span-3">Country</div>
              <div className="col-span-2 md:col-span-2 hidden md:block">Timezone</div>
              <PermissionWrapper section="State" action="edit|toggle">
                <div className="col-span-2 md:col-span-2 text-center">Actions</div>
              </PermissionWrapper>
            </div>
          </div>

          {/* List Items */}
          <div className="bg-white divide-y divide-gray-200">
            {filteredStates.map((state) => (
              <div
                key={state.id}
                className="group p-4 md:p-4 lg:px-6 lg:py-4 hover:bg-lightGreen/20 transition-all duration-200"
              >
                {/* Desktop and Tablet View */}
                <div className="hidden sm:grid grid-cols-12 gap-3 md:gap-4 items-center">
                  {/* State Info */}
                  <div className="col-span-5 md:col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-forestGreen transition-colors text-sm md:text-base">
                          {state.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Code */}
                  <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {state.code}
                      </span>
                    </div>
                  </div>

                  {/* Country */}
                  <div className="col-span-3 md:col-span-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium capitalize ${getCountryColor(
                          state.country_name
                        )}`}
                      >
                        <Globe size={12} className="md:w-4 md:h-4" />
                        {state.country_name}
                      </span>
                    </div>
                  </div>

                  {/* Timezone - Hidden on small tablets, shown on medium+ */}
                  <div className="col-span-2 md:col-span-2 hidden md:block">
                    {state.timezone && (
                      <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                        <Clock size={12} className="md:w-4 md:h-4" />
                        <span className="truncate">{state.timezone}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 md:col-span-2">
                    <div className="flex items-center justify-center gap-2 transition-opacity">
                      <PermissionWrapper section="State" action="edit">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditState(state);
                          }}
                          className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-green-100 rounded-lg flex items-center justify-center text-green-600 transition-colors"
                          title="Edit State"
                        >
                          <Edit2 size={12} className="md:w-4 md:h-4" />
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper section="State" action="toggle">
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                          title={state.is_active ? "Deactivate" : "Activate"}
                        >
                          <input
                            type="checkbox"
                            checked={state.is_active}
                            onChange={() => handleToggleStatus(state.id)}
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
                        {state.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {state.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            state.is_active
                          )}`}
                        >
                          {state.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileMenuOpen(mobileMenuOpen === state.id ? false : state.id);
                        }}
                        className="h-8 w-8 p-0 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {mobileMenuOpen === state.id && (
                        <div className="absolute right-0 top-10 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-32">
                          <PermissionWrapper section="State" action="edit">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditState(state);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                          </PermissionWrapper>
                          <PermissionWrapper section="State" action="toggle">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(state.id);
                                setMobileMenuOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              {state.is_active ? (
                                <>
                                  <X size={14} />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Check size={14} />
                                  Activate
                                </>
                              )}
                            </button>
                          </PermissionWrapper>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewState(state);
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
                    {state.country_name && (
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-gray-400" />
                        <span className="text-gray-600">{state.country_name}</span>
                      </div>
                    )}

                    {state.timezone && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-gray-600 truncate">{state.timezone}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle - Mobile */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <PermissionWrapper section="State" action="toggle">
                      <label
                        className="relative inline-flex items-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={state.is_active}
                          onChange={() => handleToggleStatus(state.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                      </label>
                    </PermissionWrapper>
                    <span className="text-xs text-gray-500">
                      {state.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredStates.length === 0 && (
            <div className="px-4 md:px-6 py-12 md:py-16 text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={20} className="md:w-6 md:h-6 text-gray-400" />
              </div>
              <div className="text-gray-500 text-base md:text-lg font-medium mb-2">No states found</div>
              <p className="text-gray-400 text-sm md:text-base">Try adjusting your filters or add a new state.</p>
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
                      <label className="text-sm font-medium text-gray-700">Rows per page:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm"
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
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden md:flex md:items-center md:justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                  {totalCount} states
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Rows per page:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm"
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
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
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

      {/* State Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b sticky top-0 bg-lightGreen/30 z-10">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                {editingState ? "Edit State" : "Add New State"}
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
              <form onSubmit={handleSubmit} id="stateForm" className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">State Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                      placeholder="Enter state name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">State Code *</label>
                    <input
                      type="text"
                      name="code"
                      required
                      maxLength="2"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent uppercase text-sm md:text-base"
                      placeholder="e.g., CA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">Country *</label>
                    <select
                      name="country_id"
                      value={formData.country_id}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                    >
                      <option value="">Select Country</option>
                      {countriesData?.data?.countries?.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">Timezone</label>
                    <input
                      type="text"
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                      placeholder="e.g., America/Los_Angeles"
                    />
                  </div>
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
                form="stateForm"
                disabled={isCreating || isUpdating}
                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingState ? "Update State" : "Create State"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedState && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[85vh]">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">State Details</h2>
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
                    <label className="block text-xs md:text-sm font-medium text-gray-700">State Name</label>
                    <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedState.name}</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">State Code</label>
                    <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedState.code}</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Country</label>
                    <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedState.country_name}</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Timezone</label>
                    <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedState.timezone || "N/A"}</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          selectedState.is_active
                        )}`}
                      >
                        {selectedState.is_active ? "Active" : "Inactive"}
                      </span>
                    </p>
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
              <PermissionWrapper section="State" action="edit">
                <button
                  onClick={() => handleEditState(selectedState)}
                  className="w-full md:w-auto px-4 py-2.5 bg-leafGreen text-white rounded-lg   transition-colors font-medium text-sm"
                >
                  Edit State
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