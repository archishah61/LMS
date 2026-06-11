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
  Building,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  useCreateCityMutation,
  useGetAllCitiesQuery,
  useUpdateCityMutation,
  useToggleCityStatusMutation,
  useDeleteCityMutation,
} from "../../../services/Masters/cityAPI";

import {
  useGetAllStatesQuery,
} from "../../../services/Masters/stateAPI";

import {
  setCities,
  addCity,
  updateCityInList,
  removeCityFromList,
} from "../../../features/Masters/citySlice";
import PermissionWrapper from "../../../context/PermissionWrapper";

export default function City() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cities } = useSelector((state) => state.city);

  // State management similar to Country page
  const [showForm, setShowForm] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    cityId: null,
    cityName: ""
  });

  // Mobile specific state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter and sort state
  const [sortBy, setSortBy] = useState("name");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // API hooks
  const { data: statesData } = useGetAllStatesQuery({
    limit: "ALL",
  });

  const { data: citiesData, isLoading, error, refetch } = useGetAllCitiesQuery({
    search_term: searchTerm,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    state_id: filterState === "all" ? "" : filterState,
  });

  const isAnyFilterApplied = () => {
    return (
      searchTerm !== "" ||
      filterState !== "all"
    )
  }

  const citiesList = citiesData?.data?.cities || [];
  const totalCount = citiesData?.data?.total_count || 0;

  const [createCity, { isLoading: isCreating }] = useCreateCityMutation();
  const [updateCity, { isLoading: isUpdating }] = useUpdateCityMutation();
  const [deleteCity] = useDeleteCityMutation();
  const [toggleCityStatus] = useToggleCityStatusMutation();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    state_id: '',
    timezone: '',
  });

  // Update Redux store when data changes
  useEffect(() => {
    if (citiesData) {
      dispatch(setCities({ cities: citiesData.data.cities }));
    }
  }, [citiesData, dispatch]);

  // Handlers similar to Country page
  const handleAddCity = () => {
    setEditingCity(null);
    setFormData({
      name: '',
      code: '',
      state_id: '',
      timezone: '',
    });
    setShowForm(true);
  };

  const handleEditCity = (city) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      code: city.code,
      state_id: city.state_id,
      timezone: city.timezone,
    });
    setShowForm(true);
    setShowViewModal(false);
    setMobileMenuOpen(false);
  };

  const handleViewCity = (city) => {
    setSelectedCity(city);
    setShowViewModal(true);
    setMobileMenuOpen(false);
  };

  const handleDeleteCity = (city) => {
    setDeleteConfirmation({
      show: true,
      cityId: city.id,
      cityName: city.name,
    });
    setMobileMenuOpen(false);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCity(deleteConfirmation.cityId).unwrap();
      dispatch(removeCityFromList({ cityId: deleteConfirmation.cityId }));
      setDeleteConfirmation({ show: false, cityId: null, cityName: "" });
      toast.success("City Deleted Successfully");
    } catch (error) {
      console.error("Failed to delete city:", error);
      toast.error(error?.data?.message || error?.data?.error || "Failed to delete city. Please try again.");
    }
  };

  const handleToggleStatus = async (cityId) => {
    try {
      await toggleCityStatus(cityId).unwrap();
      refetch();
      toast.success("City Status Updated Successfully");
    } catch (error) {
      console.error("Failed to toggle city status:", error);
      toast.error(error?.data?.message || error?.data?.error || "Failed to update city status. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCity) {
        const result = await updateCity({
          id: editingCity.id,
          ...formData
        }).unwrap();
        dispatch(updateCityInList({ city: result.data }));
        toast.success("City Updated Successfully");
      } else {
        const result = await createCity(formData).unwrap();
        dispatch(addCity({ city: result.data }));
        toast.success("City Created Successfully");
      }
      setShowForm(false);
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to save city. Please try again.';
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
  const filteredCities = citiesList
    .filter((city) => {
      if (filterStatus !== "all" &&
        ((filterStatus === "active" && !city.is_active) ||
          (filterStatus === "inactive" && city.is_active)))
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "code") return a.code.localeCompare(b.code);
      if (sortBy === "state") return a.state_name.localeCompare(b.state_name);
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

  const getStateColor = (stateName) => {
    const colors = {
      'California': 'bg-lightGreen text-forestGreen',
      'Texas': 'bg-red-100 text-red-800',
      'New York': 'bg-lightGreen text-forestGreen',
      'Florida': 'bg-orange-100 text-orange-800',
      'Illinois': 'bg-green-100 text-green-800',
    };
    return colors[stateName] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <AdminLoader message="Loading cities..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">Failed to load cities</p>
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
                  Cities
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

              {/* Add City Button */}
              <PermissionWrapper section="City" action="create">
                <button
                  onClick={handleAddCity}
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
                  City Management
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">Manage all cities in the system</p>
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

                {/* Add City Button */}
                <PermissionWrapper section="City" action="create">
                  <button
                    onClick={handleAddCity}
                    className="flex items-center gap-1.5 md:gap-2 md:px-3 p-2  bg-leafGreen   text-white rounded-lg transition-colors font-medium shadow-sm text-sm md:text-base"
                  >
                    <Plus size={16} className="md:w-5 md:h-5" />
                    <span className="hidden md:inline-flex">Add City</span>
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
                      placeholder="Search cities..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="block w-full pl-8 md:pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm"
                  >
                    <option value="all">All States</option>
                    {statesData?.data?.states?.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
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
                      setFilterState("all");
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
              <div className="col-span-5 md:col-span-4">City Name</div>
              <div className="col-span-2 md:col-span-1">Code</div>
              <div className="col-span-3 md:col-span-3">State</div>
              <div className="col-span-2 md:col-span-2 hidden md:block">Timezone</div>
              <PermissionWrapper section="City" action="edit|toggle">
                <div className="col-span-2 md:col-span-2 text-center">Actions</div>
              </PermissionWrapper>
            </div>
          </div>

          {/* List Items */}
          <div className="bg-white divide-y divide-gray-200">
            {filteredCities.map((city) => (
              <div
                key={city.id}
                className="group p-4 md:p-4 lg:px-6 lg:py-4 hover:bg-lightGreen/20 transition-all duration-200"
              >
                {/* Desktop and Tablet View */}
                <div className="hidden sm:grid grid-cols-12 gap-3 md:gap-4 items-center">
                  {/* City Info */}
                  <div className="col-span-5 md:col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-forestGreen transition-colors text-sm md:text-base">
                          {city.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Code */}
                  <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {city.code}
                      </span>
                    </div>
                  </div>

                  {/* State */}
                  <div className="col-span-3 md:col-span-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium capitalize ${getStateColor(
                          city.state_name
                        )}`}
                      >
                        <MapPin size={12} className="md:w-4 md:h-4" />
                        {city.state_name}
                      </span>
                    </div>
                  </div>

                  {/* Timezone - Hidden on small tablets, shown on medium+ */}
                  <div className="col-span-2 md:col-span-2 hidden md:block">
                    {city.timezone && (
                      <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                        <Clock size={12} className="md:w-4 md:h-4" />
                        <span className="truncate">{city.timezone}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 md:col-span-2">
                    <div className="flex items-center justify-center gap-2 transition-opacity">
                      <PermissionWrapper section="City" action="edit">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCity(city);
                          }}
                          className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-green-100 rounded-lg flex items-center justify-center text-green-600 transition-colors"
                          title="Edit City"
                        >
                          <Edit2 size={12} className="md:w-4 md:h-4" />
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper section="City" action="toggle">
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                          title={city.is_active ? "Deactivate" : "Activate"}
                        >
                          <input
                            type="checkbox"
                            checked={city.is_active}
                            onChange={() => handleToggleStatus(city.id)}
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
                        {city.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {city.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            city.is_active
                          )}`}
                        >
                          {city.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobileMenuOpen(mobileMenuOpen === city.id ? false : city.id);
                        }}
                        className="h-8 w-8 p-0 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {mobileMenuOpen === city.id && (
                        <div className="absolute right-0 top-10 z-10 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-32">
                          <PermissionWrapper section="City" action="edit">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCity(city);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                          </PermissionWrapper>
                          <PermissionWrapper section="City" action="toggle">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(city.id);
                                setMobileMenuOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              {city.is_active ? (
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
                              handleViewCity(city);
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
                    {city.state_name && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-gray-600">{city.state_name}</span>
                      </div>
                    )}

                    {city.timezone && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-gray-600 truncate">{city.timezone}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle - Mobile */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <PermissionWrapper section="City" action="toggle">
                      <label
                        className="relative inline-flex items-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={city.is_active}
                          onChange={() => handleToggleStatus(city.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                      </label>
                    </PermissionWrapper>
                    <span className="text-xs text-gray-500">
                      {city.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredCities.length === 0 && (
            <div className="px-4 md:px-6 py-12 md:py-16 text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building size={20} className="md:w-6 md:h-6 text-gray-400" />
              </div>
              <div className="text-gray-500 text-base md:text-lg font-medium mb-2">No cities found</div>
              <p className="text-gray-400 text-sm md:text-base">Try adjusting your filters or add a new city.</p>
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
                  {totalCount} cities
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

      {/* Delete confirmation modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={16} className="md:size-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Delete City</h3>
                <p className="text-xs md:text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4 md:mb-6 text-sm md:text-base">
              Are you sure you want to delete "<span className="font-medium">{deleteConfirmation.cityName}</span>"?
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={() => setDeleteConfirmation({ show: false, cityId: null, cityName: "" })}
                className="w-full sm:flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-lightGreen/20 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="w-full sm:flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Delete City
              </button>
            </div>
          </div>
        </div>
      )}

      {/* City Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b sticky top-0 bg-lightGreen/30 z-10">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                {editingCity ? "Edit City" : "Add New City"}
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
              <form onSubmit={handleSubmit} id="cityForm" className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">City Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                      placeholder="Enter city name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">City Code *</label>
                    <input
                      type="text"
                      name="code"
                      required
                      maxLength="3"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent uppercase text-sm md:text-base"
                      placeholder="e.g., NYC"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1 md:mb-2">State *</label>
                    <select
                      name="state_id"
                      value={formData.state_id}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm md:text-base"
                    >
                      <option value="">Select State</option>
                      {statesData?.data?.states?.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name} ({state.code})
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
                      placeholder="e.g., America/New_York"
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
                form="cityForm"
                disabled={isCreating || isUpdating}
                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCity ? "Update City" : "Create City"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedCity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[85vh]">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-lightGreen/30 rounded-t-xl z-10">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">City Details</h2>
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
                    <label className="block text-xs md:text-sm font-medium text-gray-700">City Name</label>
                    <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCity.name}</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">City Code</label>
                    <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCity.code}</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">State</label>
                    <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCity.state_name}</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Timezone</label>
                    <p className="mt-1 text-sm md:text-base text-gray-900 font-medium">{selectedCity.timezone || "N/A"}</p>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          selectedCity.is_active
                        )}`}
                      >
                        {selectedCity.is_active ? "Active" : "Inactive"}
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
              <PermissionWrapper section="City" action="edit">
                <button
                  onClick={() => handleEditCity(selectedCity)}
                  className="w-full md:w-auto px-4 py-2.5 bg-leafGreen text-white rounded-lg   transition-colors font-medium text-sm"
                >
                  Edit City
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