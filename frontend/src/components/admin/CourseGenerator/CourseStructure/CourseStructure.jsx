"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import SessionItem from "./SessionItem";
import EmptyState from "../UI/EmptyState";

const CourseStructure = memo(
  ({
    sessions = [],
    stats,
    expandedItems,
    editingItems,
    toggleExpanded,
    toggleEditing,
    regenerateContent,
    isSelectedForRegeneration,
    openAddItemModal,
    updateSessionField,
    updateModuleField,
    updateTopicField,
    accordionState,
    toggleAccordion,
    openDeleteModal,
    onGenerateClick,
  }) => {
    // Show empty state if no sessions
    if (!sessions || sessions.length === 0) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-800">
                Course Structure
              </h3>
              <p className="text-slate-600 font-medium">
                No sessions created yet
              </p>
            </div>
            <button
              onClick={() => openAddItemModal("session", null, "")}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Session
            </button>
          </div>
          <EmptyState
            onGenerateClick={onGenerateClick}
            className="min-h-[400px]"
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800">
              Course Structure
            </h3>
            <p className="text-slate-600 font-medium">
              {stats.sessions} Sessions • {stats.modules} Modules •{" "}
              {stats.topics} Topics
            </p>
          </div>
          <button
            onClick={() => openAddItemModal("session", null, "")}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Session
          </button>
        </div>

        <div className="space-y-6">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              expandedItems={expandedItems}
              editingItems={editingItems}
              toggleExpanded={toggleExpanded}
              toggleEditing={toggleEditing}
              regenerateContent={regenerateContent}
              isSelectedForRegeneration={isSelectedForRegeneration}
              openAddItemModal={openAddItemModal}
              updateSessionField={updateSessionField}
              updateModuleField={updateModuleField}
              updateTopicField={updateTopicField}
              accordionState={accordionState}
              toggleAccordion={toggleAccordion}
              openDeleteModal={openDeleteModal}
            />
          ))}
        </div>
      </div>
    );
  }
);

CourseStructure.displayName = "CourseStructure";

export default CourseStructure;
