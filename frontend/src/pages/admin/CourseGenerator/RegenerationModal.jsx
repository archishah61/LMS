"use client";

import { useState, useCallback, memo } from "react";
import { X, Wand2, Plus, Trash2, Sparkles, AlertCircle } from "lucide-react";

const RegenerationInputFields = memo(({ item, onUpdate, onRemove }) => {
  const [reason, setReason] = useState(item.reason || "");
  const [focusAreas, setFocusAreas] = useState(item.focus_areas || []);
  const [newFocusArea, setNewFocusArea] = useState("");

  const handleReasonChange = useCallback(
    (value) => {
      setReason(value);
      onUpdate(item.id, { ...item, reason: value });
    },
    [item, onUpdate]
  );

  const handleAddFocusArea = useCallback(() => {
    if (newFocusArea.trim() && !focusAreas.includes(newFocusArea.trim())) {
      const updatedAreas = [...focusAreas, newFocusArea.trim()];
      setFocusAreas(updatedAreas);
      onUpdate(item.id, { ...item, focus_areas: updatedAreas });
      setNewFocusArea("");
    }
  }, [newFocusArea, focusAreas, item, onUpdate]);

  const handleRemoveFocusArea = useCallback(
    (index) => {
      const updatedAreas = focusAreas.filter((_, i) => i !== index);
      setFocusAreas(updatedAreas);
      onUpdate(item.id, { ...item, focus_areas: updatedAreas });
    },
    [focusAreas, item, onUpdate]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddFocusArea();
      }
    },
    [handleAddFocusArea]
  );

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{item.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{item.label}</h4>
            <p className="text-sm text-gray-600">{item.type}</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove from regeneration"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Reason Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason for Regeneration{" "}
          <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => handleReasonChange(e.target.value)}
          placeholder="Describe why you want to regenerate this content..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
        />
      </div>

      {/* Focus Areas Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Focus Areas <span className="text-gray-400">(Optional)</span>
        </label>

        {/* Existing Focus Areas */}
        {focusAreas.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {focusAreas.map((area, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
              >
                {area}
                <button
                  onClick={() => handleRemoveFocusArea(index)}
                  className="ml-2 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add New Focus Area */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newFocusArea}
            onChange={(e) => setNewFocusArea(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add focus area (e.g., 'practical examples', 'code samples')"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
          />
          <button
            onClick={handleAddFocusArea}
            disabled={!newFocusArea.trim()}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

RegenerationInputFields.displayName = "RegenerationInputFields";

const RegenerationModal = memo(
  ({
    isOpen,
    onClose,
    selectedItems,
    onUpdateItem,
    onRemoveItem,
    onRegenerate,
    isRegenerating,
  }) => {
    const [prompt, setPrompt] = useState("");

    const handleRegenerate = useCallback(() => {
      if (selectedItems.length === 0) return;

      onRegenerate({
        selectedItems,
        prompt: prompt.trim(),
      });
    }, [selectedItems, prompt, onRegenerate]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Content Regeneration
              <p className="text-sm text-gray-600">
                {selectedItems.length} item
                {selectedItems.length !== 1 ? "s" : ""} selected for
                regeneration
              </p>
            </h2>
            <button
              onClick={onClose}
              disabled={isRegenerating}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Global Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Instructions{" "}
                <span className="text-gray-400">(Optional)</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Provide additional context or instructions for the regeneration..."
                rows={3}
                disabled={isRegenerating}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none disabled:opacity-50"
              />
            </div>

            {/* Selected Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selected Items
              </h3>
              <div className="space-y-4">
                {selectedItems.map((item) => (
                  <RegenerationInputFields
                    key={item.id}
                    item={item}
                    onUpdate={onUpdateItem}
                    onRemove={onRemoveItem}
                  />
                ))}
              </div>
            </div>

            {selectedItems.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  No items selected for regeneration
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="text-sm text-gray-600">
              {selectedItems.length > 0 && (
                <span>
                  Ready to regenerate {selectedItems.length} item
                  {selectedItems.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                disabled={isRegenerating}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={selectedItems.length === 0 || isRegenerating}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                {isRegenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start Regeneration</span>
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

RegenerationModal.displayName = "RegenerationModal";

export default RegenerationModal;
