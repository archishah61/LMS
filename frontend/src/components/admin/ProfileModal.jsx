"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, X, Edit3, Save } from "lucide-react";
import {
  useGetCurrentAdminQuery,
  useUpdateAdminMutation,
} from "../../services/adminAuthApi";
import toast from "react-hot-toast";
import ChangePasswordModal from "./ChangePasswordModal";

export default function ProfileModal({ showProfileModal, closeProfileModal }) {
  const { data, isLoading, refetch } = useGetCurrentAdminQuery();
  const admin = data?.data;

  const getProfileImg = () => {
    if (admin?.profile_image) {
      return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${admin.profile_image}`;
    }
    return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`;
    // return "/api/placeholder/400/250";
  };

  const [updateAdmin, { isLoading: isUpdating }] = useUpdateAdminMutation();

  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (admin) {
      setUsername(admin.username);
      setPreviewImage(admin.profile_image_admin || null);
    }
  }, [admin]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file)); // preview before upload
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", username);

      if (profileImage) formData.append("profile_image_admin", profileImage);

      await updateAdmin({ id: admin.id, formData }).unwrap();

      toast.success("Profile updated successfully!");
      setEditMode(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || err?.data?.error || "Failed to update profile");
    }
  };

  return (
    <AnimatePresence>
      {showProfileModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeProfileModal}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-xl overflow-hidden w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Details
              </h2>
              <button
                onClick={closeProfileModal}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center text-center gap-2">
                <label className="relative cursor-pointer">
                  <img
                    src={previewImage || getProfileImg()}
                    className="w-24 h-24 rounded-full object-cover border shadow"
                    alt="Profile"
                  />

                  {editMode && (
                    <div className="absolute bottom-0 right-0 bg-leafGreen text-white text-xs px-2 py-1 rounded">
                      Change
                    </div>
                  )}

                  {editMode && (
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  )}
                </label>

                <h3 className="text-lg font-semibold text-gray-900">
                  {isLoading ? "Loading..." : admin?.username}
                </h3>
                <p className="text-sm text-gray-500">{admin?.role_name}</p>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                    <User size={16} />
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!editMode}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg ${editMode
                      ? "bg-white border-gray-300 focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                      : "bg-gray-50 border-gray-300 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                    <Mail size={16} />
                    Email (Cannot Change)
                  </label>
                  <p className="text-gray-800 font-medium">{admin?.email}</p>
                </div>

                {!editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium bg-leafGreen   text-white rounded-lg transition-all duration-200"
                    >
                      <Edit3 size={16} />
                      Edit Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowChangePassword(true)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
                    >
                      <Lock size={16} />
                      Change Password
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium bg-leafGreen   text-white rounded-lg transition-all duration-200"
                  >
                    <Save size={16} />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </form>
            </div>

            <ChangePasswordModal
              showChangePassword={showChangePassword}
              setShowChangePassword={setShowChangePassword}
              adminId={admin?.id}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
