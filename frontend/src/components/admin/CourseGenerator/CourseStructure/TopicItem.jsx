"use client"

import { memo, useCallback, useState } from "react"
import { ChevronRight, Edit3, Save, Wand2, Trash2, MoreVertical } from "lucide-react"
import ContentTypeIcon from "../UI/ContentTypeIcon"
import StatusBadge from "../UI/StatusBadge"
import FieldDisplay from "../UI/FieldDisplay"
import TopicContent from "./TopicContent"

const TopicItem = memo(
  ({
    topic,
    moduleId,
    sessionId,
    expandedItems,
    editingItems,
    toggleExpanded,
    toggleEditing,
    regenerateContent,
    isSelectedForRegeneration,
    updateTopicField,
    accordionState,
    toggleAccordion,
    openDeleteModal,
  }) => {
    const [openMenu, setOpenMenu] = useState(false)
    const topicId = topic.topic_number || topic.id
    const contentType = topic.type || topic.content_type
    const key = `topic_${topicId}`
    const isExpanded = expandedItems[key]
    const isEditing = editingItems[key]
    const isSelectedForRegen = isSelectedForRegeneration("topic", topicId)

    const handleToggleExpanded = useCallback(() => {
      toggleExpanded("topic", topicId)
    }, [toggleExpanded, topicId])

    const handleToggleEditing = useCallback(() => {
      toggleEditing("topic", topicId)
    }, [toggleEditing, topicId])

    const handleRegenerate = useCallback(() => {
      regenerateContent("topic", topicId)
    }, [regenerateContent, topicId])

    const handleDelete = useCallback(() => {
      const id = topic.topic_number || topic.id
      openDeleteModal("topic", id, topic.title, `${sessionId}_${moduleId}`)
    }, [openDeleteModal, topic, sessionId, moduleId])

    const handleUpdateField = useCallback(
      (field, value) => {
        updateTopicField(sessionId, moduleId, topicId, field, value)
      },
      [updateTopicField, sessionId, moduleId, topicId],
    )

    return (
      <div className="group bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200"
          onClick={handleToggleExpanded}
        >
          <div className="flex items-center md:space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 ${isExpanded ? "bg-purple-100 rotate-90" : "bg-slate-100 group-hover:bg-purple-50"
                  }`}
              >
                <ChevronRight
                  className={`w-4 h-4 transition-colors duration-200 ${isExpanded ? "text-purple-600" : "text-slate-500 group-hover:text-purple-500"
                    }`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="hidden md:inline-flex flex-shrink-0">
                <ContentTypeIcon type={contentType} />
              </div>
              <div className="grid">
                <h5 className="font-semibold text-slate-800 truncate text-sm">{topic.title}</h5>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    #{topicId}
                  </span>
                  {topic.status && <StatusBadge status={topic.status} />}
                  <span className="text-xs text-slate-500 capitalize">{contentType}</span>
                  <span className="hidden md:inline-flex text-xs text-slate-500">Module: {moduleId}</span>
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
              title={isEditing ? "Save changes" : "Edit topic"}
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
              title="Delete topic"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-slate-100 bg-slate-50/50">
            <div className="p-2 md:p-6 space-y-4 md:space-y-6">
              <FieldDisplay label="Topic ID" value={topicId} isEditing={false} />
              <FieldDisplay label="Module ID" value={moduleId} isEditing={false} />
              <FieldDisplay
                label="Title"
                value={topic.title}
                isEditing={isEditing}
                onChange={(value) => handleUpdateField("title", value)}
              />
              <FieldDisplay
                label="Overview"
                value={topic.overview || topic.description || ""}
                isEditing={isEditing}
                onChange={(value) => handleUpdateField("overview", value)}
                multiline={true}
              />
              {isEditing ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => handleUpdateField("type", e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  >
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="accordion">FAQ/Accordion</option>
                    <option value="general">General Text</option>
                    <option value="slide">Slides</option>
                  </select>
                </div>
              ) : (
                <FieldDisplay label="Content Type" value={contentType} isEditing={false} />
              )}

              {(isEditing || topic.status) &&
                (isEditing ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Status</label>
                    <select
                      value={topic.status || "active"}
                      onChange={(e) => handleUpdateField("status", e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                ) : (
                  <FieldDisplay label="Status" value={topic.status} isEditing={false} />
                ))}

              {!isEditing && (topic?.type === "slide" || topic?.content_type === "slide") && (
                <>
                  <div className="border-t border-slate-200 pt-4 md:pt-6">
                    <TopicContent topic={topic} accordionState={accordionState} toggleAccordion={toggleAccordion} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  },
)

TopicItem.displayName = "TopicItem"

export default TopicItem
