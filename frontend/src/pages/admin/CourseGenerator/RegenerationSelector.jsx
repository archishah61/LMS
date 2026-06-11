"use client";

import { useState, useMemo, useCallback, memo } from "react";
import {
  ChevronDown,
  Search,
  X,
  Wand2,
  Check,
  Settings,
  ChevronUp,
  Eye,
  FileQuestion,
  ClipboardList,
} from "lucide-react";

// Memoized item component to prevent unnecessary re-renders
const ItemComponent = memo(({ item, isSelected, onToggle }) => {
  const getTypeColor = useCallback((type) => {
    const colors = {
      course: "bg-purple-100 text-purple-800",
      session: "bg-green-100 text-green-800",
      module: "bg-blue-100 text-blue-800",
      topic: "bg-orange-100 text-orange-800",
      quiz: "bg-pink-100 text-pink-800",
      assignment: "bg-indigo-100 text-indigo-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  }, []);

  const getTypeIcon = useCallback((type) => {
    const icons = {
      course: "🎓",
      session: "🎯",
      module: "📘",
      topic: "📄",
      quiz: "❓",
      assignment: "📝",
    };
    return icons[type] || "📄";
  }, []);

  return (
    <div
      className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-l-4 transition-all duration-200 ${
        isSelected ? "bg-blue-50 border-l-blue-500" : "border-l-transparent"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <span className="text-lg flex-shrink-0">{getTypeIcon(item.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {item.label}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(
                item.type
              )}`}
            >
              {item.type}
            </span>
          </div>
          {item.fullLabel && (
            <div className="text-xs text-gray-500 truncate mt-1">
              {item.fullLabel}
            </div>
          )}
          {item.parentInfo && (
            <div className="text-xs text-gray-400 truncate">
              {item.parentInfo}
            </div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
      </div>
    </div>
  );
});

ItemComponent.displayName = "ItemComponent";

const RegenerationSelector = memo(
  ({
    courseData,
    selectedItems = [],
    onSelectionChange,
    onOpenRegenerationModal,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [groupBy, setGroupBy] = useState("type");
    const [isExpanded, setIsExpanded] = useState(false);

    // Memoized flattened items to prevent recalculation
    const flattenedItems = useMemo(() => {
      if (!courseData) return [];

      const items = [];

      // Add course level
      items.push({
        id: `course_${courseData.id || 'course'}`,
        type: "course",
        label: courseData.title,
        fullLabel: `Course: ${courseData.title}`,
        value: courseData,
        path: "course",
        level: 0,
        icon: "🎓",
        searchText: `course ${courseData.title}`.toLowerCase(),
      });

      // Add sessions, modules, topics, quizzes, and assignments
      courseData.sessions?.forEach((session, sessionIndex) => {
        const sessionId = session.session_number || session.id;
        
        items.push({
          id: `session_${sessionId}`,
          type: "session",
          label: session.title,
          fullLabel: `Session: ${session.title}`,
          value: session,
          path: `sessions[${sessionIndex}]`,
          level: 1,
          icon: "🎯",
          parentId: `course_${courseData.id || 'course'}`,
          searchText: `session ${session.title}`.toLowerCase(),
        });

        session.modules?.forEach((module, moduleIndex) => {
          const moduleId = module.module_number || module.id;
          
          items.push({
            id: `module_${moduleId}`,
            type: "module",
            label: module.title,
            fullLabel: `Module: ${session.title} > ${module.title}`,
            value: module,
            path: `sessions[${sessionIndex}].modules[${moduleIndex}]`,
            level: 2,
            icon: "📘",
            parentId: `session_${sessionId}`,
            sessionTitle: session.title,
            searchText: `module ${session.title} ${module.title}`.toLowerCase(),
          });

          // Add topics
          module.topics?.forEach((topic, topicIndex) => {
            const topicId = topic.topic_number || topic.id;
            
            items.push({
              id: `topic_${topicId}`,
              type: "topic",
              label: topic.title,
              fullLabel: `Topic: ${session.title} > ${module.title} > ${topic.title}`,
              value: topic,
              path: `sessions[${sessionIndex}].modules[${moduleIndex}].topics[${topicIndex}]`,
              level: 3,
              icon: "📄",
              parentId: `module_${moduleId}`,
              sessionTitle: session.title,
              moduleTitle: module.title,
              searchText: `topic ${session.title} ${module.title} ${topic.title} ${topic.content_type}`.toLowerCase(),
            });
          });

          // Add quizzes
          module.quizzes?.forEach((quiz, quizIndex) => {
            const quizId = quiz.quiz_number || quiz.id;
            
            items.push({
              id: `quiz_${quizId}`,
              type: "quiz",
              label: quiz.title,
              fullLabel: `Quiz: ${session.title} > ${module.title} > ${quiz.title}`,
              value: quiz,
              path: `sessions[${sessionIndex}].modules[${moduleIndex}].quizzes[${quizIndex}]`,
              level: 3,
              icon: "❓",
              parentId: `module_${moduleId}`,
              sessionTitle: session.title,
              moduleTitle: module.title,
              parentInfo: `Module: ${module.title}`,
              searchText: `quiz ${session.title} ${module.title} ${quiz.title} ${quiz.description || ''}`.toLowerCase(),
            });
          });

          // Add assignments
          module.assignments?.forEach((assignment, assignmentIndex) => {
            const assignmentId = assignment.assignment_number || assignment.id;
            
            items.push({
              id: `assignment_${assignmentId}`,
              type: "assignment",
              label: assignment.title,
              fullLabel: `Assignment: ${session.title} > ${module.title} > ${assignment.title}`,
              value: assignment,
              path: `sessions[${sessionIndex}].modules[${moduleIndex}].assignments[${assignmentIndex}]`,
              level: 3,
              icon: "📝",
              parentId: `module_${moduleId}`,
              sessionTitle: session.title,
              moduleTitle: module.title,
              parentInfo: `Module: ${module.title}`,
              searchText: `assignment ${session.title} ${module.title} ${assignment.title} ${assignment.description || ''} ${assignment.type || ''}`.toLowerCase(),
            });
          });
        });
      });

      return items;
    }, [courseData]);

    // Memoized filtered items
    const filteredItems = useMemo(() => {
      if (!searchTerm.trim()) return flattenedItems;

      const searchLower = searchTerm.toLowerCase();
      return flattenedItems.filter((item) =>
        item.searchText.includes(searchLower)
      );
    }, [flattenedItems, searchTerm]);

    // Memoized grouped items
    const groupedItems = useMemo(() => {
      if (groupBy === "type") {
        return {
          Course: filteredItems.filter((item) => item.type === "course"),
          Sessions: filteredItems.filter((item) => item.type === "session"),
          Modules: filteredItems.filter((item) => item.type === "module"),
          Topics: filteredItems.filter((item) => item.type === "topic"),
          Quizzes: filteredItems.filter((item) => item.type === "quiz"),
          Assignments: filteredItems.filter((item) => item.type === "assignment"),
        };
      } else {
        // Group by hierarchy
        const grouped = {};
        
        filteredItems.forEach((item) => {
          if (item.type === "course") {
            grouped["Course"] = grouped["Course"] || [];
            grouped["Course"].push(item);
          } else if (item.type === "session") {
            const sessionKey = `📚 ${item.label}`;
            grouped[sessionKey] = grouped[sessionKey] || [];
            grouped[sessionKey].push(item);
          } else if (item.type === "module") {
            const sessionKey = `📚 ${item.sessionTitle}`;
            grouped[sessionKey] = grouped[sessionKey] || [];
            grouped[sessionKey].push(item);
          } else if (item.type === "topic") {
            const sessionKey = `📚 ${item.sessionTitle}`;
            grouped[sessionKey] = grouped[sessionKey] || [];
            grouped[sessionKey].push(item);
          } else if (item.type === "quiz") {
            const sessionKey = `📚 ${item.sessionTitle}`;
            grouped[sessionKey] = grouped[sessionKey] || [];
            grouped[sessionKey].push(item);
          } else if (item.type === "assignment") {
            const sessionKey = `📚 ${item.sessionTitle}`;
            grouped[sessionKey] = grouped[sessionKey] || [];
            grouped[sessionKey].push(item);
          }
        });
        
        return grouped;
      }
    }, [filteredItems, groupBy]);

    // Memoized callbacks
    const handleItemToggle = useCallback(
      (item) => {
        const newSelections = selectedItems.some(
          (selected) => selected.id === item.id
        )
          ? selectedItems.filter((selected) => selected.id !== item.id)
          : [...selectedItems, item];

        onSelectionChange(newSelections);
      },
      [selectedItems, onSelectionChange]
    );

    const handleSelectAll = useCallback(
      (items) => {
        const newSelections = items.filter(
          (item) => !selectedItems.some((selected) => selected.id === item.id)
        );
        onSelectionChange([...selectedItems, ...newSelections]);
      },
      [selectedItems, onSelectionChange]
    );

    const handleDeselectAll = useCallback(
      (items) => {
        const itemIds = items.map((item) => item.id);
        onSelectionChange(
          selectedItems.filter((selected) => !itemIds.includes(selected.id))
        );
      },
      [selectedItems, onSelectionChange]
    );

    const handleClearAll = useCallback(() => {
      onSelectionChange([]);
    }, [onSelectionChange]);

    const toggleOpen = useCallback(() => {
      setIsOpen((prev) => !prev);
    }, []);

    const toggleExpanded = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    const getTypeColor = useCallback((type) => {
      const colors = {
        course: "bg-purple-100 text-purple-800",
        session: "bg-green-100 text-green-800",
        module: "bg-blue-100 text-blue-800",
        topic: "bg-orange-100 text-orange-800",
        quiz: "bg-pink-100 text-pink-800",
        assignment: "bg-indigo-100 text-indigo-800",
      };
      return colors[type] || "bg-gray-100 text-gray-800";
    }, []);

    const handleOpenRegenerationModal = useCallback(() => {
      if (selectedItems.length > 0) {
        onOpenRegenerationModal(selectedItems);
        setIsOpen(false);
      }
    }, [selectedItems, onOpenRegenerationModal]);

    const removeSelectedItem = useCallback(
      (item) => {
        handleItemToggle(item);
      },
      [handleItemToggle]
    );

    // Don't render if no course data
    if (!courseData) return null;

    const visibleItems = selectedItems.slice(0, 3);
    const hiddenItemsCount = selectedItems.length - 3;
    const hasHiddenItems = hiddenItemsCount > 0;

    return (
      <div className="relative">
        {/* Trigger Button */}
        <button
          onClick={toggleOpen}
          className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Wand2 className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">
              {selectedItems.length > 0
                ? `${selectedItems.length} item${
                    selectedItems.length > 1 ? "s" : ""
                  } selected for regeneration`
                : "Select items to regenerate"}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Selected Items Preview */}
        {selectedItems.length > 0 && (
          <div className="mt-2 space-y-3">
            {/* Selected Items Display */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Selected Items ({selectedItems.length})
                </h4>
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Always visible first 3 items */}
              <div className="space-y-2">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-colors group"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-sm flex-shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {item.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(
                              item.type
                            )}`}
                          >
                            {item.type}
                          </span>
                        </div>
                        {item.fullLabel && (
                          <div className="text-xs text-gray-500 truncate">
                            {item.fullLabel}
                          </div>
                        )}
                        {item.parentInfo && (
                          <div className="text-xs text-gray-400 truncate">
                            {item.parentInfo}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeSelectedItem(item)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Expandable section for remaining items */}
                {hasHiddenItems && (
                  <>
                    {!isExpanded ? (
                      <button
                        onClick={toggleExpanded}
                        className="w-full flex items-center justify-center space-x-2 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md border border-blue-200 hover:border-blue-300 transition-all duration-200 group"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          View {hiddenItemsCount} more item
                          {hiddenItemsCount !== 1 ? "s" : ""}
                        </span>
                        <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                      </button>
                    ) : (
                      <div className="space-y-2 animate-slideDown">
                        {selectedItems.slice(3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-colors group"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className="text-sm flex-shrink-0">
                                {item.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {item.label}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(
                                      item.type
                                    )}`}
                                  >
                                    {item.type}
                                  </span>
                                </div>
                                {item.fullLabel && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {item.fullLabel}
                                  </div>
                                )}
                                {item.parentInfo && (
                                  <div className="text-xs text-gray-400 truncate">
                                    {item.parentInfo}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeSelectedItem(item)}
                              className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove from selection"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {/* Collapse button */}
                        <button
                          onClick={toggleExpanded}
                          className="w-full flex items-center justify-center space-x-2 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md border border-gray-300 transition-all duration-200 group"
                        >
                          <span className="text-sm font-medium">Show less</span>
                          <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Configure Regeneration Button */}
            <button
              onClick={handleOpenRegenerationModal}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <Settings className="w-4 h-4" />
              <span>Configure Regeneration</span>
            </button>
          </div>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search course content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="type">Group by Type</option>
                  <option value="hierarchy">Group by Hierarchy</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {filteredItems.length} items • {selectedItems.length} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleClearAll}
                    className="text-red-600 hover:text-red-700 text-xs"
                    disabled={selectedItems.length === 0}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {Object.entries(groupedItems).map(([groupName, items]) => {
                if (items.length === 0) return null;

                const selectedInGroup = items.filter((item) =>
                  selectedItems.some((selected) => selected.id === item.id)
                );

                return (
                  <div
                    key={groupName}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">
                          {groupName} ({items.length})
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSelectAll(items)}
                            className="text-xs text-purple-600 hover:text-purple-700"
                            disabled={selectedInGroup.length === items.length}
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => handleDeselectAll(items)}
                            className="text-xs text-gray-600 hover:text-gray-700"
                            disabled={selectedInGroup.length === 0}
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      {items.map((item) => (
                        <ItemComponent
                          key={item.id}
                          item={item}
                          isSelected={selectedItems.some(
                            (selected) => selected.id === item.id
                          )}
                          onToggle={() => handleItemToggle(item)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No items found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Styles */}
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              max-height: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              max-height: 500px;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          .animate-slideDown {
            animation: slideDown 0.3s ease-out;
          }
        `}</style>
      </div>
    );
  }
);

RegenerationSelector.displayName = "RegenerationSelector";

export default RegenerationSelector;