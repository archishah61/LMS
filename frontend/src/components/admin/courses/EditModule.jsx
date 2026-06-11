/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useGetModuleByIdQuery,
  useUpdateModuleMutation,
} from "../../../services/Course_Management/moduleApi";
import { getAdminToken } from "../../../services/CookieService";
import toast from "react-hot-toast";
import { X, Upload, Loader2 } from "lucide-react"; // Importing icons
import { useSelector } from "react-redux";
import PermissionWrapper from "../../../context/PermissionWrapper";

export default function EditModule() {
  const { moduleId } = useLocation().state;
  const navigate = useNavigate();
  const [updateModule, { isLoading: isLoadingUpdateModule }] =
    useUpdateModuleMutation();
  const { access_token } = useSelector((state) => state.auth);
  const { role, id } = useSelector((state) => state.user);
  const {
    data: module,
    error,
    isLoading,
  } = useGetModuleByIdQuery({ id: moduleId, access_token });

  const [formData, setFormData] = useState({
    title: "",
    duration_minutes: "",
    updated_by: id,
    updated_by_type: role,
  });

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        duration_minutes: module.duration_minutes,
        updated_by: id,
        updated_by_type: role,
      });
    }
  }, [module]);

  const handleChange = (e) => {
    const { name, value } = e.target || {};

    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateModule({
        id: moduleId,
        formData: formData,
        access_token: access_token,
      }).unwrap();
      toast.success("Module updated successfully!");
      setTimeout(() => navigate(-1), 2000);
    } catch (error) {
      toast.error(
        error.data?.message || "Failed to update module. Please try again."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-error">Failed to load module details</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-10">
      <header className="sticky top-0 z-10 bg-white border-b border-leafGreen/30 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center ">
          <h1 className="text-2xl font-bold text-forestGreen">
            Edit Module
          </h1>
          <div className="flex gap-4">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-lightGreen/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            <PermissionWrapper section="Module" action="edit">
              <button
                type="submit"
                form="module-form"
                className="px-4 py-2 text-sm font-medium text-white bg-leafGreen rounded-lg shadow-sm   transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                disabled={isLoadingUpdateModule}
              >
                {isLoadingUpdateModule ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Update Module"
                )}
              </button>
            </PermissionWrapper>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form
          id="module-form"
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-lightGreen/20 via-white to-lightGreen/10 shadow-lg rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-xl"
          encType="multipart/form-data"
        >
          <div className="p-6">
            {/* Module Details Section */}
            <section className="bg-white p-6 rounded-xl shadow-sm border relative overflow-hidden group transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-forestGreen relative">
                Module Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-lightGreen/10 border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300"
                  />
                </div>
                <div>
                  <label
                    htmlFor="duration_minutes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    id="duration_minutes"
                    name="duration_minutes"
                    min="0"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-lightGreen/10 border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300"
                  />
                </div>
              </div>
            </section>
          </div>
        </form>
      </main>
    </div>
  );
}