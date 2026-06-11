"use client";

import { memo, useState, useEffect } from "react";

const FieldDisplay = memo(
  ({ label, value, type = "text", multiline = false, isEditing, onChange }) => {
    const [localValue, setLocalValue] = useState(value || "");
    
    // Sync local value when prop changes
    useEffect(() => {
      setLocalValue(value || "");
    }, [value]);

    const handleChange = (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
    };

    const handleBlur = () => {
      if (localValue !== value) {
        onChange(localValue);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        handleBlur();
      }
    };

    if (isEditing) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            {label}
          </label>
          {multiline ? (
            <textarea
              value={localValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              rows={4}
              className="w-full p-2 md:px-4 md:py-3 border border-slate-200 rounded-lg shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 resize-none"
            />
          ) : (
            <input
              type={type}
              value={localValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full p-2 md:px-4 md:py-3 border border-slate-200 rounded-lg shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
            />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
        <div className="p-2 md:px-4 md:py-3 bg-slate-50 border border-slate-200 rounded-lg">
          {multiline ? (
            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {value || "Not specified"}
            </p>
          ) : (
            <span className="text-sm text-slate-800 font-medium">
              {value || "Not specified"}
            </span>
          )}
        </div>
      </div>
    );
  }
);

FieldDisplay.displayName = "FieldDisplay";

export default FieldDisplay;