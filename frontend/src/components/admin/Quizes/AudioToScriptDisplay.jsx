/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import {
  useUpdateAudioToScriptQuestionMutation,
  useDeleteAudioToScriptQuestionMutation,
} from "../../../services/Content_Management/quizType/audioToScriptApi";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../../services/CookieService";
import {
  Headphones,
  FileText,
  FileAudio,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  AlertCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import PermissionWrapper from "../../../context/PermissionWrapper";

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <PermissionWrapper section="Audio To Script Question" action="delete">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all">
          <div className="flex items-center text-red-600 mb-4">
            <AlertTriangle size={24} className="mr-2" />
            <h3 className="text-lg font-semibold">Delete Audio Question</h3>
          </div>

          <p className="mb-6 text-gray-600">
            Are you sure you want to delete this audio question? This action
            cannot be undone.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition-all duration-300"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Audio
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PermissionWrapper>
  );
};

const AudioToScriptDisplay = ({ audioToScriptData, quizId, createdBy, onDataChange }) => {
  const [editId, setEditId] = useState(null);
  const [editedScript, setEditedScript] = useState("");
  const [editedMarks, setEditedMarks] = useState("");
  const [newAudioFile, setNewAudioFile] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [fileName, setFileName] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [localAudioData, setLocalAudioData] = useState(audioToScriptData || []);

  const { access_token } = getAdminToken();

  const [updateAudioToScript] = useUpdateAudioToScriptQuestionMutation();
  const [deleteAudioToScript] = useDeleteAudioToScriptQuestionMutation();

  React.useEffect(() => {
    setLocalAudioData(audioToScriptData || []);
  }, [audioToScriptData]);

  const handleEditClick = (item) => {
    setEditId(item.id);
    setEditedScript(item.script);
    setEditedMarks(item.marks);
    setNewAudioFile(null);
    setFileName("No new file selected");
  };

  const handleCancel = () => {
    setEditId(null);
    setEditedScript("");
    setEditedMarks("");
    setNewAudioFile(null);
    setFileName("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAudioFile(file);
      setFileName(file.name);
    }
  };

  const handleUpdate = async (id) => {
    if (!editedScript) {
      toast.error("Script cannot be empty", {
        icon: "⚠️",
        duration: 3000,
      });
      return;
    }

    setIsUpdating(true);
    const formData = new FormData();
    formData.append("script", editedScript);
    formData.append("quiz_id", quizId);
    formData.append("updated_by", createdBy);
    formData.append("marks", editedMarks);

    if (newAudioFile) {
      formData.append("audiotoScript", newAudioFile);
    }

    try {
      const res = await updateAudioToScript({
        id,
        formData,
        access_token,
      }).unwrap();

      setLocalAudioData(prevData =>
        prevData.map(item =>
          item.id === id
            ? { ...item, script: editedScript, marks: editedMarks }
            : item
        )
      );

      toast.success(res.message || "Updated successfully", {
        icon: "✅",
        duration: 3000,
      });
      setEditId(null);
      setNewAudioFile(null);
      setFileName("");

      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        err?.message ||
        'Failed to update audio question';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const initiateDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(itemToDelete);
    try {
      const res = await deleteAudioToScript({
        id: itemToDelete,
        access_token: access_token,
      }).unwrap();

      setLocalAudioData(prevData =>
        prevData.filter(item => item.id !== itemToDelete)
      );

      toast.success(res.message || "Deleted successfully", {
        icon: "🗑️",
        duration: 3000,
      });
      setDeleteModalOpen(false);
      setItemToDelete(null);

      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      const errorMessage = err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        err?.message ||
        'Failed to delete audio question';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  if (!localAudioData?.length) {
    return (
      <div className="space-y-6 mt-7 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center border-b border-leafGreen/20 pb-4">
          <h2 className="text-xl font-bold text-forestGreen flex items-center gap-2">
            <Headphones size={24} className="text-forestGreen" />
            Audio to Script Questions
          </h2>
        </div>
        <div className="text-center py-8 border border-dashed border-leafGreen/30 rounded-lg bg-lightGreen">
          <FileAudio size={48} className="mx-auto text-leafGreen/60 mb-3" />
          <p className="text-gray-600">
            No audio to script questions found for this quiz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PermissionWrapper
      section="Audio To Script Question"
      action="view|edit|delete|toggle"
    >
      <div className="space-y-6 mt-7 bg-white p-6 rounded-lg shadow-md">
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting === itemToDelete}
        />

        <div className="flex justify-between items-center border-b border-leafGreen/20 pb-4">
          <h2 className="text-xl font-bold text-forestGreen flex items-center gap-2">
            <Headphones size={24} className="text-forestGreen" />
            Audio to Script Questions
          </h2>
        </div>

        <div className="space-y-6">
          {localAudioData.map((item, i) => (
            <div
              key={item.id}
              className="border border-leafGreen/20 rounded-lg p-5 space-y-4 bg-white shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold text-lg text-forestGreen flex items-center gap-1.5">
                  <FileAudio size={18} />
                  Audio Question {i + 1}
                </h3>
              </div>

              {editId === item.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText size={18} className="text-forestGreen" />
                      Script
                    </label>
                    <textarea
                      value={editedScript}
                      onChange={(e) => setEditedScript(e.target.value)}
                      className="w-full border border-leafGreen/30 rounded-lg p-3 focus:ring-2 focus:ring-leafGreen focus:outline-none transition-all duration-300 resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      Marks
                    </label>
                    <input
                      type="number"
                      value={editedMarks}
                      onChange={(e) => setEditedMarks(e.target.value)}
                      className="w-full border border-leafGreen/30 rounded-lg p-3 focus:ring-2 focus:ring-leafGreen focus:outline-none transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileAudio size={18} className="text-forestGreen" />
                      Update Audio (Optional)
                    </label>
                    <div className="relative">
                      <label className="w-full flex flex-col items-center px-4 py-4 bg-gray-50 rounded-lg border-2 border-dashed border-leafGreen/50 cursor-pointer hover:border-leafGreen transition-colors duration-300">
                        <div className="flex flex-col items-center justify-center">
                          <Upload size={24} className="text-leafGreen" />
                          <p className="mt-2 text-sm text-gray-500">
                            Click to select new audio file
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {fileName}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="audio/*"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(item.id)}
                      disabled={isUpdating}
                      className="px-3 py-1.5  bg-leafGreen text-white rounded-lg flex items-center gap-1.5   transition-all duration-300 text-sm"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1.5 hover:bg-gray-300 transition-all duration-300 text-sm"
                      disabled={isUpdating}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-forestGreen flex items-center gap-1.5 mb-2">
                        <FileText size={18} />
                        Script
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {item.script}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-forestGreen flex items-center gap-1.5 mb-2">
                        <FileAudio size={18} />
                        Audio Recording
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <audio
                          controls
                          className="w-full rounded-md"
                          style={{
                            accentColor: "#3b82f6",
                          }}
                        >
                          <source
                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}/audiotoScript${item.url}`}
                            type="audio/mpeg"
                          />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-forestGreen flex items-center gap-1.5 mb-2">
                        Marks
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {item.marks}
                        </p>
                      </div>
                    </div>
                  </div>

                  <PermissionWrapper
                    section="Audio To Script Question"
                    action="edit|delete"
                  >
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <PermissionWrapper
                        section="Audio To Script Question"
                        action="edit"
                      >
                        <button
                          onClick={() => handleEditClick(item)}
                          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg flex items-center gap-1.5 hover:bg-amber-600 transition-all duration-300 text-sm"
                        >
                          <Edit2 size={16} />
                        </button>
                      </PermissionWrapper>
                      <PermissionWrapper
                        section="Audio To Script Question"
                        action="delete"
                      >
                        <button
                          onClick={() => initiateDelete(item.id)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg flex items-center gap-1.5 hover:bg-red-600 transition-all duration-300 text-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </PermissionWrapper>
                    </div>
                  </PermissionWrapper>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </PermissionWrapper>
  );
};

export default AudioToScriptDisplay;