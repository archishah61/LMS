"use client";

import { memo } from "react";
import { Edit3, Trash2, Check, X } from "lucide-react";

const ArrayItem = memo(
  ({
    item,
    index,
    field,
    isEditing,
    editValue,
    onEdit,
    onSave,
    onCancel,
    onRemove,
    onEditValueChange,
    IconComponent,
  }) => {
    return (
      <div className="group">
        <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          {IconComponent && (
            <IconComponent className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onSave}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center"
                    disabled={!editValue.trim()}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={onCancel}
                    className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400 flex items-center"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-800 leading-relaxed">{item}</p>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                title="Edit item"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={onRemove}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                title="Delete item"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ArrayItem.displayName = "ArrayItem";

export default ArrayItem;
