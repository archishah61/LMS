/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  useGetSessionByIdQuery,
  useUpdateSessionMutation,
} from "../../../services/Course_Management/sessionApi";
import { getAdminToken } from "../../../services/CookieService";
import toast from "react-hot-toast";
import { X, Upload, Loader2 } from "lucide-react"; // Importing icons
import { Editor } from "@tinymce/tinymce-react";
import PermissionWrapper from "../../../context/PermissionWrapper";

export default function EditSession() {
  const { sessionId } = useLocation().state;
  const { access_token } = getAdminToken();

  const navigate = useNavigate();
  const {
    data: session,
    error,
    isLoading,
  } = useGetSessionByIdQuery({ id: sessionId, access_token });
  const [updateSession, { isLoading: isLoadingUpdateSession }] =
    useUpdateSessionMutation();

  const [formData, setFormData] = useState({
    title: "",
    min_time_in_minute: "",
    course_id: "",
    status: "active",
    sequence_no: ""
  });

  useEffect(() => {
    if (session) {
      setFormData({
        title: session.title || "",
        min_time_in_minute: session.min_time_in_minute || "",
        course_id: session.course_id || "",
        status: session.status || "active",
        sequence_no: session.sequence_no || ""
      });
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateSession({
        id: sessionId,
        formData: formData,
        access_token,
      }).unwrap();
      toast.success("Session updated successfully!");
      setTimeout(() => navigate(-1), 2000);
    } catch (error) {
      console.error("Failed to update session. Please try again. ", error);
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to update session. Please try again.';
      toast.error(errorMessage);
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
        <p className="text-error">Failed to load session details</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-10">
      <header className="sticky top-0 z-10 bg-white border-b border-leafGreen/30 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center ">
          <h1 className="text-2xl font-bold text-forestGreen">
            Edit Session
          </h1>
          <div className="flex gap-4">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-lightGreen/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            <PermissionWrapper section="Session" action="edit">
              <button
                type="submit"
                form="session-form"
                className="px-4 py-2 text-sm font-medium text-white bg-leafGreen rounded-lg shadow-sm   transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                disabled={isLoadingUpdateSession}
              >
                {isLoadingUpdateSession ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Update Session"
                )}
              </button>
            </PermissionWrapper>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form
          id="session-form"
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-lightGreen/20 via-white to-lightGreen/10 shadow-lg rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-xl"
          encType="multipart/form-data"
        >
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Details Section */}
            <section className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border relative overflow-hidden group transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-forestGreen relative">
                Session Details
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
                    htmlFor="min_time_in_minute"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Minimum Time (minutes)
                  </label>
                  <input
                    type="number"
                    id="min_time_in_minute"
                    name="min_time_in_minute"
                    value={formData.min_time_in_minute}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-lightGreen/10 border border-leafGreen/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-leafGreen transition-all duration-300"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Hidden fields to maintain form structure */}
          <input type="hidden" name="course_id" value={formData.course_id} />
          <input type="hidden" name="status" value={formData.status} />
          <input type="hidden" name="sequence_no" value={formData.sequence_no} />
        </form>
      </main>
    </div>
  );
}