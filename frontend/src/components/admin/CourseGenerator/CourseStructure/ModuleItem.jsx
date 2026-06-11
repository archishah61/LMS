/* eslint-disable react/prop-types */
"use client"

import { memo, useCallback, useState } from "react"
import { ChevronRight, Edit3, Save, Plus, Wand2, BookOpen, Clock, Trash2, MoreVertical } from "lucide-react"
import StatusBadge from "../UI/StatusBadge"
import FieldDisplay from "../UI/FieldDisplay"
import TopicItem from "./TopicItem"
import AssignmentItem from "./AssignmentItem"
import QuizItem from "./QuizItem"

const ModuleItem = memo(
  ({
    module,
    sessionId,
    expandedItems,
    editingItems,
    toggleExpanded,
    toggleEditing,
    regenerateContent,
    isSelectedForRegeneration,
    openAddItemModal,
    updateModuleField,
    updateTopicField,
    updateQuizField,
    updateAssignmentField,
    accordionState,
    toggleAccordion,
    openDeleteModal,
  }) => {
    const [openMenu, setOpenMenu] = useState(false)

    const moduleId = module.module_number || module.id
    const key = `module_${moduleId}`
    const isExpanded = expandedItems[key]
    const isEditing = editingItems[key]
    const isSelectedForRegen = isSelectedForRegeneration("module", moduleId)

    const handleToggleExpanded = useCallback(() => {
      toggleExpanded("module", moduleId)
    }, [toggleExpanded, moduleId])

    const handleToggleEditing = useCallback(() => {
      toggleEditing("module", moduleId)
    }, [toggleEditing, moduleId])

    const handleRegenerate = useCallback(() => {
      regenerateContent("module", moduleId)
    }, [regenerateContent, moduleId])

    const handleAddTopic = useCallback(() => {
      openAddItemModal("topic", moduleId, module.title)
    }, [openAddItemModal, moduleId, module.title])

    const handleDelete = useCallback(() => {
      const id = module.module_number || module.id
      openDeleteModal("module", id, module.title, sessionId)
    }, [openDeleteModal, module, sessionId])

    const handleUpdateField = useCallback(
      (field, value) => {
        updateModuleField(sessionId, moduleId, field, value)
      },
      [updateModuleField, sessionId, moduleId],
    )

    return (
      <div className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div
          className="flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200"
          onClick={handleToggleExpanded}
        >
          <div className="flex items-center md:space-x-5 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isExpanded ? "bg-blue-100 rotate-90 shadow-sm" : "bg-slate-100 group-hover:bg-blue-50"
                  }`}
              >
                <ChevronRight
                  className={`w-5 h-5 transition-colors duration-200 ${isExpanded ? "text-blue-600" : "text-slate-500 group-hover:text-blue-500"
                    }`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="hidden md:inline-flex flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="grid">
                <h4 className="font-bold text-slate-800 truncate">{module.title}</h4>
                <div className="flex items-center space-x-1 md:space-x-4 mt-1 md:mt-2">
                  <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    Module #{moduleId}
                  </span>
                  {module.duration_hours && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      <Clock className="w-3 h-3 mr-1" />
                      {module.duration_hours}h
                    </span>
                  )}
                  {module.status && <StatusBadge status={module.status} />}
                  <span className="text-sm text-slate-500 font-medium whitespace-nowrap">{module.topics?.length || 0} topics</span>
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
              className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-600"
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
                  onClick={handleAddTopic}
                  className="flex w-full items-center gap-3 px-4 py-2 hover:bg-slate-100 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Topic
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
            className="hidden md:flex items-center space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleToggleEditing}
              className={`p-2.5 rounded-lg transition-all duration-200 ${isEditing
                ? "bg-emerald-100 text-emerald-700 shadow-sm"
                : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              title={isEditing ? "Save changes" : "Edit module"}
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleAddTopic}
              className="p-2.5 rounded-lg hover:bg-emerald-100 text-slate-500 hover:text-emerald-600 transition-all duration-200"
              title="Add topic"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleRegenerate}
              className={`p-2.5 rounded-lg transition-all duration-200 ${isSelectedForRegen
                ? "bg-purple-100 text-purple-700 shadow-sm"
                : "hover:bg-slate-100 text-slate-500 hover:text-purple-600"
                }`}
              title={isSelectedForRegen ? "Remove from regeneration" : "Add to regeneration"}
            >
              <Wand2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-lg hover:bg-red-100 text-slate-500 hover:text-red-600 transition-all duration-200"
              title="Delete module"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50/30">
            <div className="p-2 md:p-6 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <FieldDisplay
                  label="Title"
                  value={module.title}
                  isEditing={isEditing}
                  onChange={(value) => handleUpdateField("title", value)}
                />
                {module.overview && (
                  <FieldDisplay
                    label="Overview"
                    value={module.overview}
                    isEditing={isEditing}
                    onChange={(value) => handleUpdateField("overview", value)}
                    multiline={true}
                  />
                )}
                {(isEditing || module.duration_hours) && (
                  <FieldDisplay
                    label="Duration (hours)"
                    value={module.duration_hours || ""}
                    isEditing={isEditing}
                    onChange={(value) => handleUpdateField("duration_hours", value)}
                    type="number"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-md md:text-lg font-bold text-slate-800">Topics ({module.topics?.length || 0})</h5>
                  <div className="h-px bg-gradient-to-r from-slate-200 to-transparent flex-1 ml-4"></div>
                </div>
                <div className="space-y-3 md:pl-4">
                  {module.topics?.map((topic) => (
                    <TopicItem
                      key={topic.topic_number || topic.id}
                      topic={topic}
                      moduleId={moduleId}
                      sessionId={sessionId}
                      expandedItems={expandedItems}
                      editingItems={editingItems}
                      toggleExpanded={toggleExpanded}
                      toggleEditing={toggleEditing}
                      regenerateContent={regenerateContent}
                      isSelectedForRegeneration={isSelectedForRegeneration}
                      updateTopicField={updateTopicField}
                      accordionState={accordionState}
                      toggleAccordion={toggleAccordion}
                      openDeleteModal={openDeleteModal}
                    />
                  ))}
                </div>
              </div>

              {/* Quizzes Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-md md:text-lg font-bold text-slate-800">Quizzes ({module.quizzes?.length || 0})</h5>
                  <button
                    onClick={() => openAddItemModal("quiz", moduleId, module.title)}
                    className="inline-flex items-center px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add <span className="ml-1 hidden sm:inline">Quiz</span>
                  </button>
                </div>
                <div className="space-y-3 md:pl-4">
                  {module.quizzes?.map((quiz) => (
                    <QuizItem
                      key={quiz.quiz_number || quiz.id}
                      quiz={quiz}
                      moduleId={moduleId}
                      sessionId={sessionId}
                      expandedItems={expandedItems}
                      editingItems={editingItems}
                      toggleExpanded={toggleExpanded}
                      toggleEditing={toggleEditing}
                      regenerateContent={regenerateContent}
                      isSelectedForRegeneration={isSelectedForRegeneration}
                      updateQuizField={updateQuizField}
                      openDeleteModal={openDeleteModal}
                    />
                  ))}
                </div>
              </div>

              {/* Assignments Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-md md:text-lg font-bold text-slate-800">Assignments ({module.assignments?.length || 0})</h5>
                  <button
                    onClick={() => openAddItemModal("assignment", moduleId, module.title)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add <span className="ml-1 hidden sm:inline">Assignment</span>
                  </button>
                </div>
                <div className="space-y-3 md:pl-4">
                  {module.assignments?.map((assignment) => (
                    <AssignmentItem
                      key={assignment.assignment_number || assignment.id}
                      assignment={assignment}
                      moduleId={moduleId}
                      sessionId={sessionId}
                      expandedItems={expandedItems}
                      editingItems={editingItems}
                      toggleExpanded={toggleExpanded}
                      toggleEditing={toggleEditing}
                      regenerateContent={regenerateContent}
                      isSelectedForRegeneration={isSelectedForRegeneration}
                      updateAssignmentField={updateAssignmentField}
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

ModuleItem.displayName = "ModuleItem"

export default ModuleItem
