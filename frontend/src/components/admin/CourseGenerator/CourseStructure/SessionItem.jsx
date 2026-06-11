"use client"

import { memo, useCallback, useState } from "react"
import { ChevronRight, Edit3, Save, Plus, Wand2, Target, Clock, Trash2, MoreVertical } from "lucide-react"
import StatusBadge from "../UI/StatusBadge"
import FieldDisplay from "../UI/FieldDisplay"
import ModuleItem from "./ModuleItem"

const SessionItem = memo(
  ({
    session,
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
    updateQuizField,
    updateAssignmentField,
    accordionState,
    toggleAccordion,
    openDeleteModal,
  }) => {
    const [openMenu, setOpenMenu] = useState(false)

    const sessionId = session.session_number || session.id
    const key = `session_${sessionId}`
    const isExpanded = expandedItems[key]
    const isEditing = editingItems[key]
    const isSelectedForRegen = isSelectedForRegeneration("session", sessionId)

    const handleToggleExpanded = useCallback(() => {
      toggleExpanded("session", sessionId)
    }, [toggleExpanded, sessionId])

    const handleToggleEditing = useCallback(() => {
      toggleEditing("session", sessionId)
    }, [toggleEditing, sessionId])

    const handleRegenerate = useCallback(() => {
      regenerateContent("session", sessionId)
    }, [regenerateContent, sessionId])

    const handleAddModule = useCallback(() => {
      openAddItemModal("module", sessionId, session.title)
    }, [openAddItemModal, sessionId, session.title])

    const handleDelete = useCallback(() => {
      const id = session.session_number || session.id
      openDeleteModal("session", id, session.title)
    }, [openDeleteModal, session])

    const handleUpdateField = useCallback(
      (field, value) => {
        updateSessionField(sessionId, field, value)
      },
      [updateSessionField, sessionId],
    )

    return (
      <div className="group bg-white border-2 border-slate-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div
          className="flex items-center justify-between p-4 lg:p-6 cursor-pointer hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200"
          onClick={handleToggleExpanded}
        >
          <div className="flex w-full items-center md:space-x-5">
            <div className="flex-shrink-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isExpanded ? "bg-emerald-100 rotate-90 shadow-md" : "bg-slate-100 group-hover:bg-emerald-50"
                  }`}
              >
                <ChevronRight
                  className={`w-6 h-6 transition-colors duration-200 ${isExpanded ? "text-emerald-600" : "text-slate-500 group-hover:text-emerald-500"
                    }`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 md:space-x-5 flex-1 min-w-0">
              <div className="hidden md:inline-flex flex-shrink-0">
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="grid">
                <h3 className="text-xl font-bold text-slate-800 truncate">{session.title}</h3>
                <div className="flex items-center space-x-1 md:space-x-4 mt-1 md:mt-3">
                  <span className="inline-flex whitespace-nowrap items-center px-2 md:px-3 py-1 md:py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-700">
                    Session #{sessionId}
                  </span>
                  {/* {session.min_time_in_minute && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-100 text-emerald-700">
                      <Clock className="w-4 h-4 mr-1.5" />
                      {session.min_time_in_minute}min
                    </span>
                  )} */}
                  {session?.status && <StatusBadge status={session.status} />}
                  <span className="text-sm text-slate-600 font-semibold whitespace-nowrap">{session.modules?.length || 0} modules</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile dropdown */}
          <div
            className="relative md:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenMenu((p) => !p)}
              className="p-2 sm:p-3 rounded-xl hover:bg-slate-100 text-slate-600"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {openMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                <button
                  onClick={handleToggleEditing}
                  className="flex w-full items-center gap-3 px-4 py-2 hover:bg-slate-100 text-sm"
                >
                  {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? "Save" : "Edit"}
                </button>

                <button
                  onClick={handleAddModule}
                  className="flex w-full items-center gap-3 px-4 py-2 hover:bg-slate-100 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Module
                </button>

                <button
                  onClick={handleRegenerate}
                  className="flex w-full items-center gap-3 px-4 py-2 hover:bg-slate-100 text-sm"
                >
                  <Wand2 className="w-4 h-4" /> Regenerate
                </button>

                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>

          <div
            className="hidden md:flex items-center space-x-3 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleToggleEditing}
              className={`p-3 rounded-xl transition-all duration-200 ${isEditing
                ? "bg-emerald-100 text-emerald-700 shadow-md"
                : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              title={isEditing ? "Save changes" : "Edit session"}
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleAddModule}
              className="p-3 rounded-xl hover:bg-emerald-100 text-slate-500 hover:text-emerald-600 transition-all duration-200"
              title="Add module"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={handleRegenerate}
              className={`p-3 rounded-xl transition-all duration-200 ${isSelectedForRegen
                ? "bg-purple-100 text-purple-700 shadow-md"
                : "hover:bg-slate-100 text-slate-500 hover:text-purple-600"
                }`}
              title={isSelectedForRegen ? "Remove from regeneration" : "Add to regeneration"}
            >
              <Wand2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-3 rounded-xl hover:bg-red-100 text-slate-500 hover:text-red-600 transition-all duration-200"
              title="Delete session"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50">
            <div className="p-2 sm:p-4 md:p-8 space-y-4 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <FieldDisplay
                  label="Title"
                  value={session.title}
                  isEditing={isEditing}
                  onChange={(value) => handleUpdateField("title", value)}
                />
                {session.overview && (
                  <FieldDisplay
                    label="Overview"
                    value={session.overview}
                    isEditing={isEditing}
                    onChange={(value) => handleUpdateField("overview", value)}
                    multiline={true}
                  />
                )}
                {(isEditing || session.min_time_in_minute) && (
                  <FieldDisplay
                    label="Minimum Time (minutes)"
                    value={session.min_time_in_minute || ""}
                    isEditing={isEditing}
                    onChange={(value) => handleUpdateField("min_time_in_minute", value)}
                    type="number"
                  />
                )}
              </div>

              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <h4 className="text-lg md:text-xl font-bold text-slate-800">Modules ({session.modules?.length || 0})</h4>
                  <div className="h-px bg-gradient-to-r from-slate-300 via-slate-200 to-transparent flex-1"></div>
                </div>
                <div className="space-y-4 md:pl-6">
                  {session.modules?.map((module) => (
                    <ModuleItem
                      key={module.module_number || module.id}
                      module={module}
                      sessionId={sessionId}
                      expandedItems={expandedItems}
                      editingItems={editingItems}
                      toggleExpanded={toggleExpanded}
                      toggleEditing={toggleEditing}
                      regenerateContent={regenerateContent}
                      isSelectedForRegeneration={isSelectedForRegeneration}
                      openAddItemModal={openAddItemModal}
                      updateModuleField={updateModuleField}
                      updateTopicField={updateTopicField}
                      updateQuizField={updateQuizField}
                      updateAssignmentField={updateAssignmentField}
                      accordionState={accordionState}
                      toggleAccordion={toggleAccordion}
                      openDeleteModal={openDeleteModal}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

SessionItem.displayName = "SessionItem"

export default SessionItem
