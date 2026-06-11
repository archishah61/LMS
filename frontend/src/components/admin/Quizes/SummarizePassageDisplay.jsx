import React, { useState } from 'react';
import {
  useUpdateSummarizePassageQuestionMutation,
  useDeleteSummarizePassageQuestionMutation,
} from '../../../services/Content_Management/quizType/summaryPassgaeApi';
import { toast } from 'react-hot-toast';
import { getAdminToken } from '../../../services/CookieService';
import {
  FileText,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  Loader2,
  BookOpen,
  AlertTriangle,
  Timer,
  Tag
} from 'lucide-react';
import PermissionWrapper from "../../../context/PermissionWrapper";

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;
  return (
    <PermissionWrapper section="Summarize Passage Question" action="delete">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all">
          <div className="flex items-center text-red-600 mb-4">
            <AlertTriangle size={24} className="mr-2" />
            <h3 className="text-lg font-semibold">Delete Summary Passage</h3>
          </div>
          <p className="mb-6 text-gray-600">Are you sure you want to delete this passage? This action cannot be undone.</p>
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
                  Delete Passage
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PermissionWrapper>
  );
};

const SummaryPassageDisplay = ({ summaryPassageData, quizId, createdBy }) => {
  const [editId, setEditId] = useState(null);
  const [editedPassage, setEditedPassage] = useState('');
  const [editedTimeLimit, setEditedTimeLimit] = useState('');
  const [editedMarks, setEditedMarks] = useState(''); // State for edited marks
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { access_token } = getAdminToken();
  const [updateSummaryPassage] = useUpdateSummarizePassageQuestionMutation();
  const [deleteSummaryPassage] = useDeleteSummarizePassageQuestionMutation();

  const handleEditClick = (item) => {
    setEditId(item.id);
    setEditedPassage(item.summary);
    setEditedTimeLimit(item.time_limit);
    setEditedMarks(item.marks); // Set edited marks
  };

  const handleCancel = () => {
    setEditId(null);
    setEditedPassage('');
    setEditedTimeLimit('');
    setEditedMarks(''); // Reset edited marks
  };

  const handleUpdate = async (id) => {
    if (!editedPassage || !editedTimeLimit || !editedMarks) {
      toast.error("Passage, time limit, and marks can't be empty", {
        icon: "⚠️",
        duration: 3000
      });
      return;
    }
    setIsUpdating(true);
    try {
      const payload = {
        summary: editedPassage,
        time_limit: editedTimeLimit,
        marks: editedMarks, // Include edited marks in the payload
        quiz_id: quizId,
        updated_by: createdBy,
      };
      const res = await updateSummaryPassage({ id, payload, access_token }).unwrap();
      toast.success(res.message || 'Updated successfully', {
        icon: "✅",
        duration: 3000
      });
      setEditId(null);
    } catch (err) {
      console.error(err);
      const errorMessage = err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        err?.message ||
        'Failed to update';
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
    setIsDeleting(true);
    try {
      const res = await deleteSummaryPassage({ id: itemToDelete, access_token }).unwrap();
      toast.success(res.message || 'Deleted successfully', {
        icon: "🗑️",
        duration: 3000
      });
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      toast.error(err?.data?.error || 'Delete failed', {
        icon: "⚠️",
        duration: 3000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!summaryPassageData?.data?.length) {
    return (
      <div className="space-y-6 mt-7 bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center border-b border-yellow-100 pb-4">
          <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2">
            <BookOpen size={24} className="text-yellow-600" />
            Summary Passages
          </h2>
        </div>
        <div className="text-center py-8 border border-dashed border-yellow-200 rounded-lg bg-yellow-50">
          <FileText size={48} className="mx-auto text-yellow-300 mb-3" />
          <p className="text-gray-600">No summary passages found for this quiz.</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionWrapper section="Summarize Passage Question" action="view|edit|delete|toggle">
      <div className="space-y-6 mt-7 bg-white p-6 rounded-lg shadow-md">
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
        <div className="flex justify-between items-center border-b border-yellow-100 pb-4">
          <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2">
            <BookOpen size={24} className="text-yellow-600" />
            Summary Passages
          </h2>
        </div>
        <div className="space-y-6">
          {summaryPassageData?.data?.map((item, i) => (
            <div
              key={item.id}
              className="border border-yellow-100 rounded-lg p-5 space-y-4 bg-white shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold text-lg text-yellow-700 flex items-center gap-1.5">
                  <BookOpen size={18} />
                  Passage {i + 1}
                </h3>
              </div>
              {editId === item.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editedPassage}
                    onChange={(e) => setEditedPassage(e.target.value)}
                    className="w-full border border-yellow-200 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all duration-300 resize-none"
                    rows={6}
                  />
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Timer size={18} className="text-leafGreen" />
                      Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      value={editedTimeLimit}
                      onChange={(e) => setEditedTimeLimit(e.target.value)}
                      className="w-full border border-yellow-200 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Tag size={18} className="text-leafGreen" />
                      Marks
                    </label>
                    <input
                      type="number"
                      value={editedMarks}
                      onChange={(e) => setEditedMarks(e.target.value)}
                      className="w-full border border-yellow-200 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all duration-300"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(item.id)}
                      disabled={isUpdating}
                      className="px-3 py-1.5  from-yellow-500 to-amber-500 text-white rounded-lg flex items-center gap-1.5 hover:from-yellow-600 hover:to-amber-600 transition-all duration-300 text-sm"
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
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{item.summary}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Timer size={18} className="text-leafGreen" />
                    <span>Time Limit: {item.time_limit} seconds</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Tag size={18} className="text-leafGreen" />
                    <span>Marks: {item.marks}</span>
                  </div>
                </div>
              )}
              <PermissionWrapper section="Summarize Passage Question" action="edit|delete">
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  <PermissionWrapper section="Summarize Passage Question" action="edit">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg flex items-center gap-1.5 hover:bg-amber-600 transition-all duration-300 text-sm"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Summarize Passage Question" action="delete">
                    <button
                      onClick={() => initiateDelete(item.id)}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg flex items-center gap-1.5 hover:bg-red-600 transition-all duration-300 text-sm"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </PermissionWrapper>
                </div>
              </PermissionWrapper>
            </div>
          ))}
        </div>
      </div>
    </PermissionWrapper>
  );
};

export default SummaryPassageDisplay;