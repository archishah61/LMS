"use client";

import { useState, memo, useEffect } from "react";
import { CheckCircle, X, Eye, ArrowRight, Sparkles } from "lucide-react";

const ContentComparison = memo(({ oldContent, newContent, type }) => {
  const [showOld, setShowOld] = useState(false);

  const renderContent = (content, isOld = false) => {
    if (!content) return <p className="text-gray-500">No content available</p>;

    return (
      <div className={`space-y-3 ${isOld ? "opacity-75" : ""}`}>
        <div>
          <h4 className="font-semibold text-gray-900">{content.title}</h4>
          {(content.description || content.overview) && (
            <p className="text-sm text-gray-600 mt-1">{content.description || content.overview}</p>
          )}
        </div>

        {type === "course" && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Price:</span> ${content.price}
            </div>
            <div>
              <span className="font-medium">Duration:</span>{" "}
              {content.duration_hours}h
            </div>
            {content.what_you_will_learn && (
              <div className="col-span-2">
                <span className="font-medium">Learning outcomes:</span>
                <ul className="list-disc list-inside mt-1 text-gray-600">
                  {content.what_you_will_learn
                    .slice(0, 3)
                    .map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {(type === "session" || type === "module") && (
          <div className="text-sm space-y-1">
            {content.duration_hours && (
              <div>
                <span className="font-medium">Duration:</span>{" "}
                {content.duration_hours}h
              </div>
            )}
            {content.min_time_in_minute && (
              <div>
                <span className="font-medium">Min Time:</span>{" "}
                {content.min_time_in_minute} minutes
              </div>
            )}
          </div>
        )}

        {type === "topic" && (
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Content Type:</span>{" "}
              {content.content_type || content.type}
            </div>
            {/* <div>
              <span className="font-medium">Status:</span> {content.status}
            </div> */}
          </div>
        )}

        {type === "quiz" && (
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Description:</span>{" "}
              {content.description}
            </div>
            <div>
              <span className="font-medium">Type:</span> {content.type}
            </div>
          </div>
        )}

        {type === "assignment" && (
          <div className="text-sm space-y-1">
            <div>
              <span className="font-medium">Description:</span>{" "}
              {content.description}
            </div>
            <div>
              <span className="font-medium">Assignment Type:</span>{" "}
              {content.assignment_type || content.type}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toggle Header */}
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b">
        <h4 className="font-medium text-gray-900 capitalize">{type} Content</h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowOld(true)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${showOld
              ? "bg-gray-200 text-gray-800"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Eye className="w-3 h-3 inline mr-1" />
            Current
          </button>
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <button
            onClick={() => setShowOld(false)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${!showOld
              ? "bg-purple-100 text-purple-800"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            New
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {showOld ? renderContent(oldContent, true) : renderContent(newContent)}
      </div>
    </div>
  );
});

ContentComparison.displayName = "ContentComparison";

const RegenerationConfirmationModal = memo(
  ({
    isOpen,
    onClose,
    onConfirm,
    onDiscard,
    regeneratedItems = [],
    isProcessing = false,
  }) => {
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Auto-select all items when modal opens with new regenerated items
    useEffect(() => {
      if (isOpen && regeneratedItems.length > 0) {
        setSelectedItems(new Set(regeneratedItems.map((item) => item.id)));
      }
    }, [isOpen, regeneratedItems]);

    const handleSelectAll = () => {
      if (selectedItems.size === regeneratedItems.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(regeneratedItems.map((item) => item.id)));
      }
    };

    const handleSelectItem = (itemId) => {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      setSelectedItems(newSelected);
    };

    const handleConfirm = () => {
      const itemsToReplace = regeneratedItems.filter((item) =>
        selectedItems.has(item.id)
      );
      onConfirm(itemsToReplace);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-5xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Regeneration Complete
              <p className="text-sm text-gray-600">
                Review and confirm the changes you want to apply
              </p>
            </h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {regeneratedItems.length > 0 ? (
              <div className="space-y-4">
                {/* Selection Controls */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.size === regeneratedItems.length &&
                        regeneratedItems.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({selectedItems.size} of{" "}
                      {regeneratedItems.length} selected)
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Review each item and select which changes to apply
                  </div>
                </div>

                {/* Regenerated Items */}
                <div className="space-y-6">
                  {regeneratedItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-xl overflow-hidden"
                    >
                      {/* Item Header */}
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{item.icon || "📄"}</span>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {item.label}
                              </h3>
                              <p className="text-sm text-gray-600 capitalize">
                                {item.type}
                              </p>
                            </div>
                          </div>
                        </div>
                        {item.error && (
                          <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                            Error: {item.error}
                          </div>
                        )}
                        {item.success && (
                          <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            Successfully Regenerated
                          </div>
                        )}
                      </div>

                      {/* Content Comparison */}
                      {!item.error && item.newContent && (
                        <div className="p-4">
                          <ContentComparison
                            oldContent={item.oldContent}
                            newContent={item.newContent}
                            type={item.type}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  No regenerated content to review
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="text-sm text-gray-600">
              {selectedItems.size > 0 && (
                <span>
                  {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}{" "}
                  will be updated
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onDiscard}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Discard All
              </button>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedItems.size === 0 || isProcessing}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Applying Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Apply Selected Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

RegenerationConfirmationModal.displayName = "RegenerationConfirmationModal";

export default RegenerationConfirmationModal;