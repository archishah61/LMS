"use client"

import { memo, useCallback, useState } from "react"
import { ChevronRight, Edit3, Save, Wand2, Trash2, FileText, MoreVertical } from "lucide-react"
import FieldDisplay from "../UI/FieldDisplay"

const QuizItem = memo(
    ({
        quiz,
        moduleId,
        sessionId,
        expandedItems,
        editingItems,
        toggleExpanded,
        toggleEditing,
        regenerateContent,
        isSelectedForRegeneration,
        updateQuizField,
        openDeleteModal,
    }) => {
        const [openMenu, setOpenMenu] = useState(false)

        const quizId = quiz.quiz_number || quiz.id
        const key = `quiz_${quizId}`
        const isExpanded = expandedItems[key]
        const isEditing = editingItems[key]
        const isSelectedForRegen = isSelectedForRegeneration("quiz", quizId)

        const handleToggleExpanded = useCallback(() => {
            toggleExpanded("quiz", quizId)
        }, [toggleExpanded, quizId])

        const handleToggleEditing = useCallback(() => {
            toggleEditing("quiz", quizId)
        }, [toggleEditing, quizId])

        const handleRegenerate = useCallback(() => {
            regenerateContent("quiz", quizId)
        }, [regenerateContent, quizId])

        const handleDelete = useCallback(() => {
            openDeleteModal("quiz", quizId, quiz.title, `${sessionId}_${moduleId}`)
        }, [openDeleteModal, quiz, sessionId, moduleId, quizId])

        const handleUpdateField = useCallback(
            (field, value) => {
                updateQuizField(sessionId, moduleId, quizId, field, value)
            },
            [updateQuizField, sessionId, moduleId, quizId],
        )

        const formatArrayField = (array) => {
            if (!array) return ""
            return Array.isArray(array) ? array.join(", ") : array
        }

        const parseArrayField = (value) => {
            if (!value) return []
            return value.split(",").map(item => item.trim()).filter(item => item)
        }

        return (
            <div className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition-all duration-200"
                    onClick={handleToggleExpanded}
                >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 ${isExpanded ? "bg-orange-100 rotate-90" : "bg-slate-100 group-hover:bg-orange-50"
                                    }`}
                            >
                                <ChevronRight
                                    className={`w-4 h-4 transition-colors duration-200 ${isExpanded ? "text-orange-600" : "text-slate-500 group-hover:text-orange-500"
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center md:space-x-3 flex-1 min-w-0">
                            <div className="hidden md:inline-flex flex-shrink-0">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-slate-800 truncate text-sm">{quiz.title}</h5>
                                <div className="flex items-center md:space-x-3 mt-1">
                                    <span className="hidden md:inline text-xs text-slate-500">Quiz</span>
                                    {quiz.description && (
                                        <span className="text-xs text-slate-500 truncate">{quiz.description}</span>
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
                            title={isEditing ? "Save changes" : "Edit quiz"}
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
                            title="Delete quiz"
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
                                value={quiz.title}
                                isEditing={isEditing}
                                onChange={(value) => handleUpdateField("title", value)}
                            />
                            <FieldDisplay
                                label="Description"
                                value={quiz.description || ""}
                                isEditing={isEditing}
                                onChange={(value) => handleUpdateField("description", value)}
                                multiline={true}
                            />

                            {/* Quiz-specific fields
                            <FieldDisplay
                                label="Skills"
                                value={formatArrayField(quiz.skills)}
                                isEditing={isEditing}
                                onChange={(value) => handleUpdateField("skills", parseArrayField(value))}
                                multiline={true}
                            />

                            <FieldDisplay
                                label="Question Styles"
                                value={formatArrayField(quiz.question_styles)}
                                isEditing={isEditing}
                                onChange={(value) => handleUpdateField("question_styles", parseArrayField(value))}
                                multiline={true}
                            /> */}
                        </div>
                    </div>
                )}
            </div>
        )
    },
)

QuizItem.displayName = "QuizItem"

export default QuizItem