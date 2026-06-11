"use client";

import { memo, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import ArrayItem from "./ArrayItem";

const EditableArray = memo(
  ({
    label,
    items = [],
    onAdd,
    onUpdate,
    onRemove,
    field,
    icon: IconComponent,
  }) => {
    const [newItemValue, setNewItemValue] = useState("");
    const [editingArrayItems, setEditingArrayItems] = useState({});
    const [editingValues, setEditingValues] = useState({});

    const handleAddItem = useCallback(() => {
      if (newItemValue.trim()) {
        onAdd(newItemValue.trim());
        setNewItemValue("");
      }
    }, [newItemValue, onAdd]);

    const handleKeyPress = useCallback(
      (e) => {
        if (e.key === "Enter") {
          handleAddItem();
        }
      },
      [handleAddItem]
    );

    const toggleArrayItemEdit = useCallback(
      (index) => {
        const key = `${field}_${index}`;
        setEditingArrayItems((prev) => {
          const newState = { ...prev, [key]: !prev[key] };
          if (newState[key]) {
            setEditingValues((prevValues) => ({
              ...prevValues,
              [key]: items[index],
            }));
          } else {
            setEditingValues((prevValues) => {
              const newValues = { ...prevValues };
              delete newValues[key];
              return newValues;
            });
          }
          return newState;
        });
      },
      [field, items]
    );

    const saveArrayItemEdit = useCallback(
      (index) => {
        const key = `${field}_${index}`;
        const newValue = editingValues[key];
        if (newValue && newValue.trim()) {
          onUpdate(index, newValue.trim());
        }
        setEditingArrayItems((prev) => ({ ...prev, [key]: false }));
        setEditingValues((prev) => {
          const newValues = { ...prev };
          delete newValues[key];
          return newValues;
        });
      },
      [field, editingValues, onUpdate]
    );

    const cancelArrayItemEdit = useCallback(
      (index) => {
        const key = `${field}_${index}`;
        setEditingArrayItems((prev) => ({ ...prev, [key]: false }));
        setEditingValues((prev) => {
          const newValues = { ...prev };
          delete newValues[key];
          return newValues;
        });
      },
      [field]
    );

    const handleRemove = useCallback(
      (index) => {
        onRemove(index);
      },
      [onRemove]
    );

    const handleEditValueChange = useCallback(
      (index, value) => {
        const key = `${field}_${index}`;
        setEditingValues((prev) => ({ ...prev, [key]: value }));
      },
      [field]
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
            {label} ({items.length})
          </h4>
        </div>

        <div className="space-y-2">
          {items.map((item, index) => {
            const key = `${field}_${index}`;
            const isEditing = editingArrayItems[key];
            const editValue = editingValues[key] || "";

            return (
              <ArrayItem
                key={index}
                item={item}
                index={index}
                field={field}
                isEditing={isEditing}
                editValue={editValue}
                onEdit={() => toggleArrayItemEdit(index)}
                onSave={() => saveArrayItemEdit(index)}
                onCancel={() => cancelArrayItemEdit(index)}
                onRemove={() => handleRemove(index)}
                onEditValueChange={(value) =>
                  handleEditValueChange(index, value)
                }
                IconComponent={IconComponent}
              />
            );
          })}
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-400 transition-colors">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newItemValue}
              onChange={(e) => setNewItemValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Add new ${label.toLowerCase().slice(0, -1)}...`}
              className="flex-1 p-2 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemValue.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </button>
          </div>
        </div>
      </div>
    );
  }
);

EditableArray.displayName = "EditableArray";

export default EditableArray;
