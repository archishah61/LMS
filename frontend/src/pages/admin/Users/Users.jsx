"use client";
import { useState, useEffect } from "react";
import {
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useToggleUserStatusMutation,
  useLogoutUserMutation,
} from "../../../services/userAuthApi";
import { useGetAllActiveCountriesQuery } from "../../../services/Masters/countryAPI";
import { useGetAllActiveStatesQuery } from "../../../services/Masters/stateAPI";
import { useGetAllActiveCitiesQuery } from "../../../services/Masters/cityAPI";
import toast from "react-hot-toast";
import { getAdminToken, removeToken } from "../../../services/CookieService";
import { useDispatch } from "react-redux";
import { unsetUserInfo } from "../../../features/userSlice";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Filter, Plus, X, Edit, User as UserIcon, ChevronLeft, Edit2, Eye } from "lucide-react";
import PermissionWrapper from "../../../context/PermissionWrapper";
import { useGetAllCourseNameQuery } from "../../../services/Course_Management/courseApi";
import { useGeneratePromoCodesMutation } from "../../../services/promocode/promocodeApi";
import AdminLoader from "../../../components/admin/AdminLoader";
const User = () => {
  const { access_token } = getAdminToken();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showFilter, setShowFilter] = useState(false);
  const [limit, setLimit] = useState(10);
  const limitOptions = [10, 20, 50, 100, 500];
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showGenerateCodeModal, setShowGenerateCodeModal] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    mobile_no: "",
    location: "",
    country_id: 0,
    state_id: 0,
    city_id: 0,
  });
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useGetAllUsersQuery({
    page: currentPage,
    limit,
    search: searchTerm,
  });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [toggleUserStatus] = useToggleUserStatusMutation();
  const [logoutUser] = useLogoutUserMutation();
  const [generatePromoCodes, { isLoading: isGenerating }] = useGeneratePromoCodesMutation();
  const [search, setSearch] = useState(""); // For Course Search in Promo code
  const { data: countriesData } = useGetAllActiveCountriesQuery({
    limit: "ALL",
  });
  const { data: statesData, refetch: refetchStates } =
    useGetAllActiveStatesQuery(
      {
        limit: "ALL",
        country_id: formData.country_id,
      },
      {
        skip: formData.country_id <= 0,
      }
    );
  const { data: citiesData, refetch: refetchCities } =
    useGetAllActiveCitiesQuery(
      {
        state_id: formData.state_id,
      },
      {
        skip: formData.state_id <= 0,
      }
    );
  const { data: coursesData, isLoading: isCoursesLoading } = useGetAllCourseNameQuery({
    access_token,
    search_term: search
  });

  useEffect(() => {
    if (formData.country_id > 0) {
      refetchStates();
    }
  }, [formData.country_id, refetchStates]);
  useEffect(() => {
    if (formData.state_id > 0) {
      refetchCities();
    }
  }, [formData.state_id, refetchCities]);
  useEffect(() => {
    setCurrentPage(1);
  }, [limit]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const resetForm = () => {
    setFormData({
      full_name: "",
      username: "",
      email: "",
      password: "",
      mobile_no: "",
      location: "",
      country_id: 0,
      state_id: 0,
      city_id: 0,
    });
  };
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (
      !formData.full_name ||
      !formData.username ||
      !formData.email ||
      !formData.password ||
      formData.country_id === 0 ||
      formData.state_id === 0 ||
      formData.city_id === 0
    ) {
      toast.error("All required fields must be filled");
      return;
    }
    try {
      await createUser({
        userData: {
          ...formData,
          country_id: Number.parseInt(formData.country_id),
          state_id: Number.parseInt(formData.state_id),
          city_id: Number.parseInt(formData.city_id),
        },
        access_token,
      }).unwrap();
      toast.success("User created successfully");
      setShowCreateModal(false);
      resetForm();
      refetch();
    } catch (error) {
      const errorMessage =
        error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "An unexpected error occurred";
      toast.error(errorMessage);
    }
  };
  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      mobile_no: user.mobile_no || "",
      location: user.location || "",
      country_id: user.country_id || 0,
      state_id: user.state_id || 0,
      city_id: user.city_id || 0,
    });
    setShowEditModal(true);
  };
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (
      !formData.full_name ||
      !formData.username ||
      !formData.email ||
      formData.country_id === 0 ||
      formData.state_id === 0 ||
      formData.city_id === 0
    ) {
      toast.error("All required fields must be filled");
      return;
    }
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      await updateUser({
        id: editingUser.id,
        userData: {
          ...updateData,
          country_id: Number.parseInt(formData.country_id),
          state_id: Number.parseInt(formData.state_id),
          city_id: Number.parseInt(formData.city_id),
        },
        access_token,
      }).unwrap();
      toast.success("User updated successfully");
      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
      refetch();
    } catch (error) {
      const errorMessage =
        error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "An unexpected error occurred";
      toast.error(errorMessage);
    }
  };
  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatus({
        id: user.id,
        is_active: user.is_active === 0 ? true : false,
        access_token,
      }).unwrap();
      toast.success(
        `User ${user.is_active === 0 ? "activated" : "deactivated"
        } successfully`
      );
      if (user.is_active === 1) {
        try {
          await logoutUser(access_token).unwrap();
          sessionStorage.removeItem("chatHistory");
          dispatch(
            unsetUserInfo({
              id: "",
              email: "",
              username: "",
              profile_image: "",
              points: "",
              role: "",
            })
          );
          removeToken();
        } catch (error) {
          console.error("Logout failed", error);
          const errorMessage =
            error?.data?.error ||
            error?.data?.message ||
            error?.error ||
            error?.message ||
            "An unexpected error occurred";
          toast.error(errorMessage);
        }
      }
      refetch();
    } catch (error) {
      const errorMessage =
        error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "An unexpected error occurred";
      toast.error(errorMessage);
    }
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingUser(null);
    resetForm();
  };
  const handleGeneratePromoCodes = async () => {
    if (selectedCourses.length === 0) {
      toast.error("Please select at least one course");
      return;
    }
    // Replace this with the actual user_id you want to use
    // For example: selectedUsers[0] or a specific user_id
    if (!selectedUsers || selectedUsers.length === 0) {
      toast.error("Please select a user");
      return;
    }
    try {
      const response = await generatePromoCodes({
        course_ids: selectedCourses,
        user_ids: selectedUsers,
        access_token,
      }).unwrap();
      toast.success(
        `Promo codes generated successfully`
      );
      setShowGenerateCodeModal(false);
      setSelectedCourses([]);
      setSelectedUsers([]);
    } catch (error) {
      const errorMessage =
        error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      refetch();
    }
  };
  const users = usersData?.data || [];
  const pagination = usersData?.pagination || {};
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Large Desktop Header (≥1170px) */}
          <div className="hidden xl:flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-gray-600 mt-1 truncate">
                Manage users, their status, and information
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

              <PermissionWrapper section="Promo Code" action="create">
                <button
                  onClick={() => setShowGenerateCodeModal(true)}
                  className="bg-leafGreen  text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 18l6-6-6-6" />
                    <path d="M8 6l-6 6 6 6" />
                    <path d="M21 12H3" />
                  </svg>
                  Generate verification code
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate("/admin/dashboard/batch/list")}
                className="bg-leafGreen  text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
              >
                <Eye size={18} />
                View Batches
              </button>

              <PermissionWrapper section="User" action="create">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-leafGreen  text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                >
                  <Plus size={18} />
                  Add User
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* Medium Desktop Header (768px to 1169px) */}
          <div className="hidden md:flex xl:hidden items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">
                Users
              </h1>
              {/* No subtitle for medium screens */}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <Filter size={16} />
                <span className="font-medium">Filters</span>
                {showFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <PermissionWrapper section="Promo Code" action="create">
                <button
                  onClick={() => setShowGenerateCodeModal(true)}
                  className="bg-leafGreen  text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm text-sm"
                >
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
                  >
                    <path d="M16 18l6-6-6-6" />
                    <path d="M8 6l-6 6 6 6" />
                    <path d="M21 12H3" />
                  </svg>
                  Generate Code
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate("/admin/dashboard/batch/list")}
                className="bg-leafGreen  text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm text-sm"
              >
                <Eye size={16} />
                View Batches
              </button>

              <PermissionWrapper section="User" action="create">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-leafGreen  text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm text-sm"
                >
                  <Plus size={16} />
                  <span>Add User</span>
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm"
              >
                <ArrowLeft size={16} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* Mobile Header (≤767px) */}
          <div className="md:hidden">
            {/* Title Row - Centered with back button on right */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-8"></div> {/* Spacer for balance */}
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold bg-forestGreen bg-clip-text text-transparent">
                  Users
                </h1>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="flex border items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            {/* Action Buttons Row - Smaller size */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors flex-1 justify-center text-sm"
              >
                <Filter size={16} />
                <span className="font-medium">Filters</span>
              </button>

              <PermissionWrapper section="User" action="create">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-leafGreen  text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </PermissionWrapper>
            </div>

            {/* Additional Mobile Buttons */}
            <div className="flex items-center gap-2">
              <PermissionWrapper section="Promo Code" action="create">
                <button
                  onClick={() => setShowGenerateCodeModal(true)}
                  className="bg-leafGreen  text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
                >
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
                  >
                    <path d="M16 18l6-6-6-6" />
                    <path d="M8 6l-6 6 6 6" />
                    <path d="M21 12H3" />
                  </svg>
                  <span>Generate Code</span>
                </button>
              </PermissionWrapper>
              <button
                onClick={() => navigate("/admin/dashboard/batch/list")}
                className="bg-leafGreen  text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
              >
                <Eye size={16} />
                <span>View Batches</span>
              </button>
            </div>
          </div>

          {/* Filters Section - This stays the same */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilter ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
          >
            <div className="p-4 bg-lightGreen/20 rounded-lg border border-leafGreen/20">
              <div className="grid grid-cols-1 gap-4">
                <div className={`w-full`}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Users
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
                      placeholder="Search by name, username, email, or mobile..."
                      className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                </div>
              </div>
              {searchTerm && (
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

      {/* Main Content */}
      <div className="w-full flex-1 overflow-y-auto max-w-full p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <AdminLoader message="Loading users list..." />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead className="bg-lightGreen border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users?.filter(user => user.isPromoCodeGenerated !== 1)?.length && users?.filter(user => user.isPromoCodeGenerated !== 1)?.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(
                                users
                                  .filter(user => user.isPromoCodeGenerated !== 1)
                                  .map(user => user.id)
                              );
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          className="w-4 h-4 accent-leafGreen rounded focus:ring-leafGreen"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        User Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                      <PermissionWrapper section="User" action="toggle">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </PermissionWrapper>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users?.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-lightGreen/20 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            disabled={user.isPromoCodeGenerated === 1} // 🔥 disable checkbox
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                              }
                            }}
                            className={`w-4 h-4 rounded accent-leafGreen focus:ring-leafGreen
    ${user.isPromoCodeGenerated === 1
                                ? "cursor-not-allowed opacity-50"
                                : "text-leafGreen"
                              }`}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="hidden lg:flex w-10 h-10 bg-leafGreen rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="lg:ml-4 grid">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 grid">
                          <div className="text-sm text-gray-900 truncate">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.mobile_no || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.location || "N/A"}
                          </div>
                        </td>
                        <PermissionWrapper section="User" action="toggle">
                          <td className="px-6 py-4">
                            <label
                              className="relative inline-flex items-center cursor-pointer w-9 h-5"
                              onClick={(e) => e.stopPropagation()}
                              title={
                                user.is_active === 1 ? "Deactivate" : "Activate"
                              }
                            >
                              <input
                                type="checkbox"
                                checked={user.is_active === 1}
                                onChange={() => handleToggleStatus(user)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                              <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                            </label>
                          </td>
                        </PermissionWrapper>
                        <td className="p-4 space-x-3">
                          <PermissionWrapper section="User" action="edit">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-leafGreen hover:text-forestGreen font-medium text-sm transition-colors duration-200"
                            >
                              Edit
                            </button>
                          </PermissionWrapper>
                          <PermissionWrapper
                            section="User Activity Logs"
                            action="view"
                          >
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/dashboard/activity/logs?user_id=${user.id}`
                                )
                              }
                              className="text-leafGreen hover:text-forestGreen font-medium text-sm transition-colors duration-200"
                              title="View Activity Logs"
                            >
                              Logs
                            </button>
                          </PermissionWrapper>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {users?.map((user) => (
                  <div key={user.id} className="p-4 hover:bg-lightGreen/20 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                            }
                          }}
                          className="w-4 h-4 accent-leafGreen rounded focus:ring-leafGreen mt-1"
                        />
                        <div className="flex-shrink-0 w-10 h-10 bg-leafGreen rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="grid">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {user.full_name}
                              </h3>
                            </div>
                            <PermissionWrapper section="User" action="toggle">
                              <label
                                className="relative inline-flex items-center cursor-pointer w-9 h-5"
                                onClick={(e) => e.stopPropagation()}
                                title={
                                  user.is_active === 1 ? "Deactivate" : "Activate"
                                }
                              >
                                <input
                                  type="checkbox"
                                  checked={user.is_active === 1}
                                  onChange={() => handleToggleStatus(user)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                              </label>
                            </PermissionWrapper>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">@{user.username}</p>
                          <p className="text-sm text-gray-700 mb-1">{user.email}</p>
                          {user.mobile_no && (
                            <p className="text-sm text-gray-600 mb-1">{user.mobile_no}</p>
                          )}
                          {user.location && (
                            <p className="text-sm text-gray-600">{user.location}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                      <PermissionWrapper section="User" action="edit">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="flex items-center gap-1 text-leafGreen hover:text-forestGreen font-medium text-sm transition-colors duration-200"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper
                        section="User Activity Logs"
                        action="view"
                      >
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/dashboard/activity/logs?user_id=${user.id}`
                            )
                          }
                          className="flex items-center gap-1 text-leafGreen hover:text-forestGreen font-medium text-sm transition-colors duration-200"
                          title="View Activity Logs"
                        >
                          <UserIcon size={14} />
                          Logs
                        </button>
                      </PermissionWrapper>
                    </div>
                  </div>
                ))}
              </div>
              {/* Empty State */}
              {users.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon size={24} className="text-gray-400" />
                  </div>
                  <div className="text-gray-500 text-lg font-medium mb-2">
                    No users found
                  </div>
                  <p className="text-gray-400">
                    {searchTerm ? "Try adjusting your search" : "Get started by adding a new user"}
                  </p>
                </div>
              )}
              {/* Pagination */}
              {pagination.total > 10 && (
                <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-lightGreen/20">
                  {/* Mobile Pagination */}
                  <div className="md:hidden">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-sm text-gray-600 text-center">
                        Page {currentPage} of {pagination.totalPages}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Users per page:</label>
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
                      <div className="flex items-center justify-between w-full max-w-xs">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          <ChevronLeft size={16} />
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === pagination.totalPages}
                          className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          Next
                          <ChevronUp size={16} className="rotate-90" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        Showing {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, pagination.total)} of {pagination.total}
                      </div>
                    </div>
                  </div>
                  {/* Desktop Pagination */}
                  <div className="hidden md:flex md:items-center md:justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(currentPage - 1) * limit + 1} to{" "}
                      {Math.min(currentPage * limit, pagination.total)} of{" "}
                      {pagination.total} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">Users per page:</label>
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
      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-xl font-semibold text-forestGreen">
                Create New User
              </h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form
                onSubmit={handleCreateUser}
                id="createUserForm"
                className="space-y-6"
              >
                {/* Personal Information Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter full name"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.full_name.length}/100 characters
                    </p>
                  </div>
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter username"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.username.length}/50 characters
                    </p>
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter email address"
                      maxLength={255}
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter password"
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 6 characters required
                    </p>
                  </div>
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      name="mobile_no"
                      value={formData.mobile_no}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter mobile number"
                      maxLength={15}
                    />
                  </div>
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter location"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.location.length}/100 characters
                    </p>
                  </div>
                </div>
                {/* Geographic Location Section - Full Width */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-forestGreen mb-4">Geographic Location *</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <select
                        name="country_id"
                        value={formData.country_id}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      >
                        <option value="0">Select Country</option>
                        {countriesData?.data?.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <select
                        name="state_id"
                        value={formData.state_id}
                        onChange={handleInputChange}
                        required
                        disabled={formData.country_id === 0}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <option value="0">Select State</option>
                        {statesData?.data?.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      {formData.country_id === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Please select a country first
                        </p>
                      )}
                    </div>
                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <select
                        name="city_id"
                        value={formData.city_id}
                        onChange={handleInputChange}
                        required
                        disabled={formData.state_id === 0}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <option value="0">Select City</option>
                        {citiesData?.data?.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {formData.state_id === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Please select a state first
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            {/* Fixed Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={closeModals}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="createUserForm"
                disabled={isCreating}
                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen  rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="flex-shrink-0" />
                    Create User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-2xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-xl font-semibold text-forestGreen">
                Edit User
              </h2>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form
                onSubmit={handleUpdateUser}
                id="editUserForm"
                className="space-y-6"
              >
                {/* Personal Information Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter full name"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.full_name.length}/100 characters
                    </p>
                  </div>
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter username"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.username.length}/50 characters
                    </p>
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter email address"
                      maxLength={255}
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password (leave empty to keep current)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter new password"
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 6 characters required
                    </p>
                  </div>
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      name="mobile_no"
                      value={formData.mobile_no}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter mobile number"
                      maxLength={15}
                    />
                  </div>
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      placeholder="Enter location"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.location.length}/100 characters
                    </p>
                  </div>
                </div>
                {/* Geographic Location Section - Full Width */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-forestGreen mb-4">Geographic Location *</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Country */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <select
                        name="country_id"
                        value={formData.country_id}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      >
                        <option value="0">Select Country</option>
                        {countriesData?.data?.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <select
                        name="state_id"
                        value={formData.state_id}
                        onChange={handleInputChange}
                        required
                        disabled={formData.country_id === 0}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <option value="0">Select State</option>
                        {statesData?.data?.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      {formData.country_id === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Please select a country first
                        </p>
                      )}
                    </div>
                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <select
                        name="city_id"
                        value={formData.city_id}
                        onChange={handleInputChange}
                        required
                        disabled={formData.state_id === 0}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <option value="0">Select City</option>
                        {citiesData?.data?.map((city) => (
                          <option key={city.id} value={city.id}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {formData.state_id === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Please select a state first
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            {/* Fixed Footer Buttons */}
            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={closeModals}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editUserForm"
                disabled={isUpdating}
                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen  rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit2 size={16} className="flex-shrink-0" />
                    Update User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {showGenerateCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              {/* Left Section: Title + Close Button */}
              <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
                <h2 className="text-lg sm:text-xl font-semibold text-forestGreen whitespace-nowrap">
                  Generate Code
                </h2>
                <button
                  onClick={() => setShowGenerateCodeModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 sm:hidden"
                >
                  <X size={18} />
                </button>
              </div>
              {/* Right Section: Search Bar */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-leafGreen/20 w-full sm:w-[250px]"
                />
                <button
                  onClick={() => setShowGenerateCodeModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 hidden sm:flex ml-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isCoursesLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-lightGreen border-t-leafGreen rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:gap-3 max-h-96 sm:max-h-64 ">
                  {coursesData?.data
                    ?.filter((course) =>
                      course.title.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-3 p-3 sm:p-2 border border-gray-200 rounded-lg hover:bg-lightGreen/20 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCourses([...selectedCourses, course.id]);
                            } else {
                              setSelectedCourses(selectedCourses.filter((id) => id !== course.id));
                            }
                          }}
                          className="w-4 h-4 accent-leafGreen rounded focus:ring-leafGreen flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-700 break-words flex-1">
                          {course.title}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-xl">
              <button
                onClick={() => setShowGenerateCodeModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePromoCodes}
                disabled={isGenerating}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-leafGreen  rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  "Generate Codes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default User;