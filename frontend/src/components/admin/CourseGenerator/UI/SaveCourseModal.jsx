import React from "react";
import { Save, CheckCircle } from "lucide-react";

const SaveCourseModal = ({
  isOpen,
  onClose,
  onConfirm,
  courseData,
  stats,
  isSaving = false,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isSaving) {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
          <Save className="w-8 h-8 text-green-600" />
        </div>

        {/* Title and Description */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Save Course to Database
          </h3>
          <p className="text-gray-600">
            Are you sure you want to save this course? This will permanently
            store all course content, sessions, modules, and topics in the
            database.
          </p>
        </div>

        {/* Course Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Course Summary:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Title:</span>
              <span className="font-medium truncate ml-2">
                {courseData?.title || "Untitled Course"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sessions:</span>
              <span className="font-medium">{stats?.sessions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Modules:</span>
              <span className="font-medium">{stats?.modules || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Topics:</span>
              <span className="font-medium">{stats?.topics || 0}</span>
            </div>
            {/* <div className="flex justify-between">
              <span>Duration:</span>
              <span className="font-medium">{stats?.duration || 0} hours</span>
            </div> */}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Save Course</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveCourseModal;
