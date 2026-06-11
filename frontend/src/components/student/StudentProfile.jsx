/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  useGetUserByIdQuery,
  useUpdateUserProfileMutation,
  useDeleteProfileImageMutation,
  useChangePasswordMutation,
} from "../../services/userAuthApi";
import { getStudentToken } from "../../services/CookieService";
import toast from "react-hot-toast";
import { jwtDecode } from 'jwt-decode';
import {
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Lock,
  AlertCircle,
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Trash2,
  User,
  Globe,
  Map,
  Building,
  Eye,
  EyeOff,
} from "lucide-react";
import { useGetAllActiveCountriesQuery } from "../../services/Masters/countryAPI";
import { useGetAllActiveStatesQuery } from "../../services/Masters/stateAPI";
import { useGetAllActiveCitiesQuery } from "../../services/Masters/cityAPI";

const StudentProfile = () => {
  let { id } = useSelector((state) => state.user);
  const { access_token } = getStudentToken();

  if (!id) {
    try {
      const decodedToken = jwtDecode(access_token);
      id = decodedToken.id;
    } catch (e) {
      // Handle token error
    }
  }

  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUserByIdQuery({ id, access_token }, { skip: !id });

  const [countryId, setCountryId] = useState(0)
  const [stateId, setStateId] = useState(0)

  // API hooks
  const { data: countriesData } = useGetAllActiveCountriesQuery({
    limit: "ALL",
  })

  // Queries
  const { data: statesResponse } = useGetAllActiveStatesQuery(
    {
      limit: "ALL",
      country_id: countryId,
    },
    {
      skip: !countryId, // Skip fetching if countryId is undefined/null
    }
  )

  // RTK Query hooks
  const { data: citiesData, refetch: refetchCity } = useGetAllActiveCitiesQuery(
    {
      state_id: stateId,
    },
    {
      skip: !stateId, // Skip fetching if countryId is undefined/null
    }
  )

  const [updateUserProfile] = useUpdateUserProfileMutation();
  const [deleteProfileImage] = useDeleteProfileImageMutation();
  const [changePassword] = useChangePasswordMutation();

  const [profileState, setProfileState] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const fileInputRef = useRef(null);

  const [validationErrors, setValidationErrors] = useState({
    full_name: false,
    username: false,
    mobile_no: false,
    country_id: false,
    state_id: false,
    city_id: false,
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (profileData) {
      setProfileState(profileData);
      setValidationErrors({
        full_name: !profileData.full_name,
        username: !profileData.username,
        mobile_no: !profileData.mobile_no,
        country_id: !profileData.country_id,
        state_id: !profileData.state_id,
        city_id: !profileData.city_id,
      });

      setCountryId(profileData.country_id);
      setStateId(profileData.state_id);

      if (profileData.profile_image) {
        setPreviewImage(getProfileImageUrl(profileData));
      }
    }
  }, [profileData]);

  // Sync countryId and stateId when entering edit mode to ensure dropdown options load
  useEffect(() => {
    if (editMode && profileState) {
      if (profileState.country_id) setCountryId(profileState.country_id);
      if (profileState.state_id) setStateId(profileState.state_id);
    }
  }, [editMode, profileState]);

  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleDeleteImage = async () => {
    try {
      await deleteProfileImage({ userId: id }).unwrap();
      setPreviewImage(null);
      setProfileState((prev) => ({ ...prev, profile_image: null }));
      toast.success("Profile image deleted successfully!");
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

  if (isLoading)
    return (
      <p className="text-center text-gray-600 animate-pulse py-8">
        Loading profile...
      </p>
    );
  if (isError)
    return (
      <p className="text-center text-red-500 py-8">
        {error?.data?.message || "Error loading profile. Please try again."}
      </p>
    );

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "profile_image" && files.length > 0) {
      const file = files[0];
      setProfileImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setImageScale(1);
      setImageRotation(0);
    } else {
      setProfileState((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "state_id") {
      setStateId(value);
    } else if (name === "country_id") {
      setCountryId(value);
      setStateId(0);
    }

    if (["full_name", "username", "mobile_no", "country_id", "state_id", "city_id"].includes(name)) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: !value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {
      full_name: !profileState?.full_name?.trim(),
      username: !profileState?.username?.trim(),
      mobile_no: !profileState?.mobile_no?.trim(),
      country_id: !profileState?.country_id,
      state_id: !profileState?.state_id,
      city_id: !profileState?.city_id,
    };

    setValidationErrors((prev) => ({ ...prev, ...errors }));

    if (Object.values(errors).some((err) => err)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("full_name", profileState.full_name);
      formData.append("username", profileState.username);
      formData.append("email", profileState.email);
      formData.append("mobile_no", profileState.mobile_no || "");
      formData.append("location", "");
      formData.append("country_id", profileState.country_id);
      formData.append("state_id", profileState.state_id);
      formData.append("city_id", profileState.city_id);

      if (profileImageFile) {
        formData.append("profile_image", profileImageFile);
      }

      await updateUserProfile({ id, updatedData: formData }).unwrap();
      refetch();
      toast.success("Profile updated successfully! ✅");
      setEditMode(false);
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

  const getFirstLetter = (name) => {
    return name ? name.charAt(0).toUpperCase() : "N";
  };

  const getProfileImageUrl = (user) => {
    if (user?.profile_image) {
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${user.profile_image || "/placeholder.png"}`;
    }
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`;
  };

  const handleChangePassword = async () => {
    const isSocialLoginWithoutPassword =
      profileState?.login_type === "social" && profileState?.isPasswordSet === 0;

    const errors = {
      currentPassword: !isSocialLoginWithoutPassword && !currentPassword.trim(),
      newPassword: !newPassword.trim(),
      confirmPassword: newPassword !== confirmPassword,
    };

    setValidationErrors((prev) => ({ ...prev, ...errors }));

    if (Object.values(errors).some((err) => err)) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    try {
      const payload = isSocialLoginWithoutPassword
        ? { id, newPassword }
        : { id, currentPassword, newPassword };

      await changePassword(payload).unwrap();
      toast.success("Password updated successfully! ✅");
      setShowChangePasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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

  const handleZoomIn = () => setImageScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setImageScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setImageRotation((prev) => (prev + 90) % 360);

  return (
    <div className="min-h-screen bg-white pt-4 pb-4">
      {/* Fixed container to prevent empty space */}
      <div className="container mx-auto">
        <div className="w-full mx-auto rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {/* Header Section */}
          <div
            className="px-4 sm:px-6 md:px-8 py-6 relative bg-cover bg-center text-white"
            style={{ backgroundImage: "url('/assets/My_Profile_Heading_Background.png')" }}
          >
            {/* Edit Button */}
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1 sm:gap-2 bg-white text-black px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-medium shadow-sm hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  <Edit size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Edit Profile</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="bg-white/20 text-white p-1.5 sm:p-2 rounded-md backdrop-blur-sm transition"
                  >
                    <X size={16} className="sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-1 sm:gap-2 bg-white text-primary px-3 py-1 sm:px-4 sm:py-2 rounded-md font-medium shadow-sm hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    <Save size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Save</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10">
              {/* Profile Image */}
              <div className="relative group">
                <div
                  className="w-20 h-20 xs:w-22 xs:h-22 sm:w-24 sm:h-24 rounded-full overflow-hidden cursor-pointer bg-white"
                  onClick={() => setShowImageModal(true)}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-3xl xs:text-4xl font-bold text-gray-400">
                      {getFirstLetter(profileState?.full_name)}
                    </div>
                  )}
                </div>
                {editMode && (
                  <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 sm:p-2 rounded-full cursor-pointer">
                    <label htmlFor="profile_image" className="cursor-pointer flex items-center justify-center">
                      <Camera size={14} className="sm:w-4 sm:h-4" />
                    </label>
                    <input
                      id="profile_image"
                      ref={fileInputRef}
                      type="file"
                      name="profile_image"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* User Details Header */}
              <div className="text-center sm:text-left mt-4 sm:mt-0">
                <h1 className="text-xl xs:text-2xl font-bold tracking-tight">
                  {profileState?.full_name || "No Name Provided"}
                </h1>
                <p className="text-xs xs:text-sm opacity-90 font-light mt-1">
                  {profileState?.email || "No email"}
                </p>

                {!editMode && (
                  <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                    {profileState?.country_name && (
                      <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded flex items-center border border-white/10 font-medium">
                        <Globe size={10} className="mr-1 sm:w-3 sm:h-3" />
                        {profileState.country_name}
                      </span>
                    )}
                    {profileState?.state_name && (
                      <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded flex items-center border border-white/10 font-medium">
                        <Map size={10} className="mr-1 sm:w-3 sm:h-3" />
                        {profileState.state_name}
                      </span>
                    )}
                    {profileState?.city_name && (
                      <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded flex items-center border border-white/10 font-medium">
                        <Building size={10} className="mr-1 sm:w-3 sm:h-3" />
                        {profileState.city_name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 sm:p-6 md:p-8 bg-white">
            {!editMode ? (
              <div className="space-y-8">
                <ProfileSection title="Personal Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-6 lg:gap-y-8">
                    <ProfileField label="Full Name" value={profileState?.full_name} icon={User} />
                    <ProfileField label="Username" value={profileState?.username} icon={User} />
                  </div>
                </ProfileSection>

                <ProfileSection title="Contact Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-6 lg:gap-y-8">
                    <ProfileField label="Email" value={profileState?.email} icon={Mail} />
                    <ProfileField label="Mobile" value={profileState?.mobile_no} icon={Phone} />
                    <ProfileField label="Country" value={profileState?.country_name} icon={Globe} />
                    <ProfileField label="State" value={profileState?.state_name} icon={Map} />
                    <ProfileField label="City" value={profileState?.city_name} icon={Building} />
                  </div>
                </ProfileSection>

                <ProfileSection title="Security">
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-4 bg-lightGreen/20 rounded-lg gap-4 xs:gap-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-full text-gray-500">
                        <Lock size={16} className="sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-0.5">Password</p>
                        <p className="text-sm font-bold text-gray-800 tracking-widest">********</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowChangePasswordModal(true)}
                      className="text-primary font-bold text-xs uppercase tracking-wide transition-colors text-right"
                    >
                      Change Password
                    </button>
                  </div>
                </ProfileSection>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <ProfileSection title="Personal Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    <FormField
                      label="Full Name"
                      name="full_name"
                      value={profileState?.full_name || ""}
                      onChange={handleInputChange}
                      icon={User}
                      error={validationErrors.full_name}
                      errorMessage="Required"
                    />
                    <FormField
                      label="Username"
                      name="username"
                      value={profileState?.username || ""}
                      onChange={handleInputChange}
                      icon={User}
                      error={validationErrors.username}
                      errorMessage="Required"
                    />
                  </div>
                </ProfileSection>

                <ProfileSection title="Contact Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-6">
                    <FormField
                      label="Email"
                      name="email"
                      value={profileState?.email || ""}
                      onChange={handleInputChange}
                      icon={Mail}
                      readOnly
                    />
                    <FormField
                      label="Mobile"
                      name="mobile_no"
                      value={profileState?.mobile_no || ""}
                      onChange={handleInputChange}
                      icon={Phone}
                      type="tel"
                      error={validationErrors.mobile_no}
                      errorMessage="Required"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Country</label>
                      <select
                        name="country_id"
                        value={profileState?.country_id || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border-b border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors rounded-t-md"
                      >
                        <option value="">Select Country</option>
                        {countriesData?.data?.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">State</label>
                      <select
                        name="state_id"
                        value={profileState?.state_id || ""}
                        onChange={handleInputChange}
                        disabled={!countryId || countryId == 0}
                        className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border-b border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors rounded-t-md disabled:bg-gray-100"
                      >
                        <option value="">Select State</option>
                        {statesResponse?.data?.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">City</label>
                      <select
                        name="city_id"
                        value={profileState?.city_id || ""}
                        onChange={handleInputChange}
                        disabled={!stateId || stateId == 0}
                        className="w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border-b border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors rounded-t-md disabled:bg-gray-100"
                      >
                        <option value="">Select City</option>
                        {citiesData?.data?.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </ProfileSection>

                <div className="flex flex-col xs:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition order-2 xs:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-600 transition font-medium shadow-sm order-1 xs:order-2 mb-3 xs:mb-0"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Image Modal & Password Modal */}
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowImageModal(false)}>
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-xs xs:max-w-sm sm:max-w-md lg:max-w-lg w-full relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowImageModal(false)} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600">
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-gray-800">Profile Image</h3>
              <div className="flex justify-center mb-4 sm:mb-6 bg-gray-50 py-6 sm:py-8 rounded-xl border border-gray-100">
                <div className="w-48 h-48 xs:w-56 xs:h-56 sm:w-64 sm:h-64 overflow-hidden rounded-full border-4 border-white shadow-md flex items-center justify-center bg-gray-200">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="w-full h-full object-cover transition-transform duration-300"
                      style={{ transform: `scale(${imageScale}) rotate(${imageRotation}deg)` }}
                    />
                  ) : (
                    <span className="text-4xl xs:text-5xl sm:text-6xl font-bold text-gray-400">
                      {getFirstLetter(profileState?.full_name)}
                    </span>
                  )}
                </div>
              </div>
              {previewImage && (
                <div className="flex justify-center gap-3 sm:gap-4">
                  <button onClick={handleZoomIn} className="p-2 sm:p-3 bg-lightGreen text-primary rounded-full hover:bg-green-100 transition">
                    <ZoomIn size={16} className="sm:w-5 sm:h-5" />
                  </button>
                  <button onClick={handleZoomOut} className="p-2 sm:p-3 bg-lightGreen text-primary rounded-full hover:bg-green-100 transition">
                    <ZoomOut size={16} className="sm:w-5 sm:h-5" />
                  </button>
                  <button onClick={handleRotate} className="p-2 sm:p-3 bg-lightGreen text-primary rounded-full hover:bg-green-100 transition">
                    <RotateCw size={16} className="sm:w-5 sm:h-5" />
                  </button>
                  <button onClick={handleDeleteImage} className="p-2 sm:p-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition">
                    <Trash2 size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowChangePasswordModal(false)}>
            <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-xs xs:max-w-sm sm:max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowChangePasswordModal(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600">
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Change Password</h3>
              <form className="space-y-4">
                {!(profileState?.login_type === "social" && profileState?.isPasswordSet === 0) && (
                  <FormField
                    label="Current Password"
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    icon={Lock}
                    error={validationErrors.currentPassword}
                    errorMessage="Required"
                    rightElement={
                      <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-0 top-2 text-gray-400 hover:text-gray-600">
                        {showCurrentPass ? <Eye size={16} className="sm:w-4 sm:h-4" /> : <EyeOff size={16} className="sm:w-4 sm:h-4" />}
                      </button>
                    }
                  />
                )}
                <FormField
                  label="New Password"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={Lock}
                  error={validationErrors.newPassword}
                  errorMessage="Required"
                  rightElement={
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-0 top-2 text-gray-400 hover:text-gray-600">
                      {showNewPass ? <Eye size={16} className="sm:w-4 sm:h-4" /> : <EyeOff size={16} className="sm:w-4 sm:h-4" />}
                    </button>
                  }
                />
                <FormField
                  label="Confirm Password"
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={Lock}
                  error={validationErrors.confirmPassword}
                  errorMessage="Missmatch"
                  rightElement={
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-0 top-2 text-gray-400 hover:text-gray-600">
                      {showConfirmPass ? <Eye size={16} className="sm:w-4 sm:h-4" /> : <EyeOff size={16} className="sm:w-4 sm:h-4" />}
                    </button>
                  }
                />
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="w-full bg-primary text-white py-3 rounded-md font-bold mt-4 text-sm sm:text-base"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Section Component with the Green Strip
const ProfileSection = ({ title, children }) => (
  <div className="mb-6 sm:mb-8">
    <div className="bg-lightGreen py-2 px-4 rounded-md mb-4 sm:mb-6 w-full">
      <h3 className="text-sm sm:text-base font-semibold text-gray-800 tracking-wide">
        {title}
      </h3>
    </div>
    <div className="px-1 sm:px-2">{children}</div>
  </div>
);

// Field Component matching the "Rohan" design (Label uppercase small gray, Value dark)
const ProfileField = ({ label, value, icon: Icon }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-gray-500 mb-1">
      {Icon && <Icon size={12} className="sm:w-3.5 sm:h-3.5" />}
      <span className="text-xs font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="text-gray-900 font-medium text-sm sm:text-base border-b border-gray-100 pb-2">
      {value || "Not provided"}
    </div>
  </div>
);

// Form Field Component
const FormField = ({ label, name, value, onChange, icon: Icon, type = "text", error, errorMessage, readOnly = false, rightElement, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
      {Icon && <Icon size={10} className="sm:w-3 sm:h-3" />}
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`
          w-full px-0 py-2 text-sm sm:text-base bg-transparent border-b-2 transition-all duration-200 outline-none
          ${readOnly ? "text-gray-500 border-gray-100 cursor-not-allowed" : "text-gray-900 border-gray-200 focus:border-primary"}
          ${error ? "border-red-500" : ""}
          ${rightElement ? "pr-8" : ""} 
        `}
        {...props}
      />
      {rightElement}
    </div>
    {error && (
      <span className="text-red-500 text-[10px] mt-0.5 flex items-center gap-1">
        <AlertCircle size={10} className="sm:w-3 sm:h-3" />
        {errorMessage}
      </span>
    )}
  </div>
);

export default StudentProfile;