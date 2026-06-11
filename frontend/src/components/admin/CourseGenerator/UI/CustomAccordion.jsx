"use client";

import { memo, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const CustomAccordion = memo(
  ({ id, title, children, accordionState, toggleAccordion }) => {
    const isOpen = accordionState[id] || false;

    const handleToggle = useCallback(() => {
      toggleAccordion(id);
    }, [id, toggleAccordion]);

    return (
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left"
          onClick={handleToggle}
        >
          <span className="font-medium">{title}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {isOpen && (
          <div className="p-3 border-t border-gray-200">{children}</div>
        )}
      </div>
    );
  }
);

CustomAccordion.displayName = "CustomAccordion";

export default CustomAccordion;
