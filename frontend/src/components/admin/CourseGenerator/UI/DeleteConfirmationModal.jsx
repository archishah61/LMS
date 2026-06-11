"use client";

import { memo } from "react";
import { AlertTriangle, X } from "lucide-react";

const DeleteConfirmationModal = memo(
  ({ isOpen, onClose, onConfirm, itemType, itemTitle, isDeleting }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl animate-slideIn">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Confirmation
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete this {itemType}?
            </p>
            {itemTitle && (
              <p className="font-medium text-gray-900">"{itemTitle}"</p>
            )}
            <p className="text-red-600 text-sm mt-2">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                "Confirm Delete"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

DeleteConfirmationModal.displayName = "DeleteConfirmationModal";

export default DeleteConfirmationModal;
