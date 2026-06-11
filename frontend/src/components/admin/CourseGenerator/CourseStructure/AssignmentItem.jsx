"use client"

import { memo, useCallback, useState } from "react"
import { ChevronRight, Edit3, Save, Wand2, Trash2, ClipboardList, MoreVertical } from "lucide-react"
import FieldDisplay from "../UI/FieldDisplay"

const AssignmentItem = memo(
    ({
        assignment,
        moduleId,
        sessionId,
        expandedItems,
        editingItems,
        toggleExpanded,
        toggleEditing,
        regenerateContent,
        isSelectedForRegeneration,
        updateAssignmentField,
        openDeleteModal,
    }) => {
        const [openMenu, setOpenMenu] = useState(false)

        const assignmentId = assignment.assignment_number || assignment.id
        const key = `assignment_${assignmentId}`
        const isExpanded = expandedItems[key]
        const isEditing = editingItems[key]
        const isSelectedForRegen = isSelectedForRegeneration("assignment", assignmentId)

        const handleToggleExpanded = useCallback(() => {
            toggleExpanded("assignment", assignmentId)
        }, [toggleExpanded, assignmentId])

        const handleToggleEditing = useCallback(() => {
            toggleEditing("assignment", assignmentId)
        }, [toggleEditing, assignmentId])

        const handleRegenerate = useCallback(() => {
            regenerateContent("assignment", assignmentId)
        }, [regenerateContent, assignmentId])

        const handleDelete = useCallback(() => {
            openDeleteModal("assignment", assignmentId, assignment.title, `${sessionId}_${moduleId}`)
        }, [openDeleteModal, assignment, sessionId, moduleId, assignmentId])

        const handleUpdateField = useCallback(
            (field, value) => {
                updateAssignmentField(sessionId, moduleId, assignmentId, field, value)
            },
            [updateAssignmentField, sessionId, moduleId, assignmentId],
        )

        return (
            <div className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200"
                    onClick={handleToggleExpanded}
                >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 ${isExpanded ? "bg-blue-100 rotate-90" : "bg-slate-100 group-hover:bg-blue-50"
                                    }`}
                            >
                                <ChevronRight
                                    className={`w-4 h-4 transition-colors duration-200 ${isExpanded ? "text-blue-600" : "text-slate-500 group-hover:text-blue-500"
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center md:space-x-3 flex-1 min-w-0">
                            <div className="hidden md:inline-flex flex-shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                                    <ClipboardList className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="grid">
                                <h5 className="font-semibold text-slate-800 truncate text-sm">{assignment.title}</h5>
                                <div className="flex items-center md:space-x-3 mt-1">
                                    <span className="hidden md:inline text-xs text-slate-500">Assignment</span>
                                    {assignment.type && (
                                        <span className="text-xs text-slate-500 capitalize">{assignment.type}</span>
                                    )}
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
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
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
                            className={`p-2 rounded-lg transition-all duration-200 ${isEditing
                                ? "bg-emerald-100 text-emerald-700 shadow-sm"
                                : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                                }`}
                            title={isEditing ? "Save changes" : "Edit assignment"}
                        >
                            {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleRegenerate}
                            className={`p-2 rounded-lg transition-all duration-200 ${isSelectedForRegen
                                ? "bg-purple-100 text-purple-700 shadow-sm"
                                : "hover:bg-slate-100 text-slate-500 hover:text-purple-600"
                                }`}
                            title={isSelectedForRegen ? "Remove from regeneration" : "Add to regeneration"}
                        >
                            <Wand2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-lg hover:bg-red-100 text-slate-500 hover:text-red-600 transition-all duration-200"
                            title="Delete assignment"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                        <div className="p-2 md:p-6 space-y-4 md:space-y-6">
                            <FieldDisplay
                                label="Title"
                                value={assignment.title}
                                isEditing={isEditing}
                                onChange={(value) => handleUpdateField("title", value)}
                            />
                            <FieldDisplay
                                label="Description"
                                value={assignment.description || ""}
                                isEditing={isEditing}
                                onChange={(value) => handleUpdateField("description", value)}
                                multiline={true}
                            />

                            <FieldDisplay
                                label="Type"
                                value={assignment.type || ""}
                                isEditing={isEditing}
                                onChange={(value) => handleUpdateField("type", value)}
                            />
                        </div>
                    </div>
                )}
            </div>
        )
    },
)

AssignmentItem.displayName = "AssignmentItem"

export default AssignmentItem