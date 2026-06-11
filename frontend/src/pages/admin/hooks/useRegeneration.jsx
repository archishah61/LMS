"use client"

import { useState, useCallback } from "react"
import toast from "react-hot-toast"

const useRegeneration = (
  courseData,
  onUpdateCourseData,
  setSelectedForRegeneration,
  adminCourseStructureRegenerate,
) => {
  const [regenerationState, setRegenerationState] = useState({
    isModalOpen: false,
    isRegenerating: false,
    isConfirmationOpen: false,
    selectedItems: [],
    regeneratedItems: [],
    isProcessingConfirmation: false,
  })

  const extractMinimalData = useCallback((item) => {
    if (!item) return null
    return {
      id:
        item.session_number ||
        item.module_number ||
        item.topic_number ||
        item.quiz_number ||
        item.assignment_number ||
        item.id,
      title: item.title,
    }
  }, [])

  const extractCurrentItemData = useCallback((item, type) => {
    if (!item) return null

    const cleanedItem = { ...item }

    // Remove child arrays based on type
    if (type === "course") {
      delete cleanedItem.sessions
      delete cleanedItem.thumbnailData
    } else if (type === "session") {
      delete cleanedItem.modules
    } else if (type === "module") {
      delete cleanedItem.topics
      delete cleanedItem.quizzes
      delete cleanedItem.assignments
    } else if (type === "topic") {
      // Remove audio_file fields from topic content
      if (cleanedItem.audio?.audio_file) {
        delete cleanedItem.audio.audio_file
      }

      if (cleanedItem.general_material?.audio_file) {
        delete cleanedItem.general_material.audio_file
      }

      if (cleanedItem.accordions) {
        cleanedItem.accordions = cleanedItem.accordions.map((accordion) => {
          const cleanedAccordion = { ...accordion }
          if (cleanedAccordion.audio_file) {
            delete cleanedAccordion.audio_file
          }
          return cleanedAccordion
        })
      }

      if (cleanedItem.multi_slides || cleanedItem.slides) {
        const slides = cleanedItem.multi_slides || cleanedItem.slides
        const cleanedSlides = slides.map((slide) => {
          const cleanedSlide = { ...slide }
          if (cleanedSlide.audio_file) {
            delete cleanedSlide.audio_file
          }
          return cleanedSlide
        })

        if (cleanedItem.multi_slides) {
          cleanedItem.multi_slides = cleanedSlides
        } else {
          cleanedItem.slides = cleanedSlides
        }
      }
    }

    return cleanedItem
  }, [])

  const buildContextData = useCallback(
    (selectedItems) => {
      const contextData = {}

      selectedItems.forEach((item) => {
        const context = {
          current_item: null,
          parent_data: {},
          siblings: [],
          children: [],
        }

        const itemId = item.value.id ||
          item.value.session_number ||
          item.value.module_number ||
          item.value.topic_number ||
          item.value.quiz_number ||
          item.value.assignment_number;

        if (item.type === "course") {
          context.current_item = extractCurrentItemData(courseData, "course")
          context.children = (courseData.sessions || []).map(extractMinimalData)
        } else if (item.type === "session") {
          const session = courseData.sessions?.find((s) =>
            (s.session_number || s.id) === itemId
          )
          if (session) {
            context.current_item = extractCurrentItemData(session, "session")
            context.parent_data = {
              course: extractMinimalData(courseData),
            }
            context.siblings = (courseData.sessions?.filter((s) => (s.session_number || s.id) !== itemId) || []).map(
              extractMinimalData,
            )
            context.children = (session.modules || []).map(extractMinimalData)
          }
        } else if (item.type === "module") {
          let foundModule = null
          let parentSession = null

          courseData.sessions?.forEach((session) => {
            const module = session.modules?.find((m) =>
              (m.module_number || m.id) === itemId
            )
            if (module) {
              foundModule = module
              parentSession = session
            }
          })

          if (foundModule && parentSession) {
            context.current_item = extractCurrentItemData(foundModule, "module")
            context.parent_data = {
              course: extractMinimalData(courseData),
              session: extractMinimalData(parentSession),
            }
            context.siblings = (parentSession.modules?.filter((m) => (m.module_number || m.id) !== itemId) || []).map(
              extractMinimalData,
            )
            context.children = [
              ...(foundModule.topics || []).map(extractMinimalData),
              ...(foundModule.quizzes || []).map(extractMinimalData),
              ...(foundModule.assignments || []).map(extractMinimalData),
            ]
          }
        } else if (item.type === "topic") {
          let foundTopic = null
          let parentModule = null
          let parentSession = null

          courseData.sessions?.forEach((session) => {
            session.modules?.forEach((module) => {
              const topic = module.topics?.find((t) =>
                (t.topic_number || t.id) === itemId
              )
              if (topic) {
                foundTopic = topic
                parentModule = module
                parentSession = session
              }
            })
          })

          if (foundTopic && parentModule && parentSession) {
            context.current_item = extractCurrentItemData(foundTopic, "topic")
            context.parent_data = {
              course: extractMinimalData(courseData),
              session: extractMinimalData(parentSession),
              module: extractMinimalData(parentModule),
            }
            context.siblings = (parentModule.topics?.filter((t) => (t.topic_number || t.id) !== itemId) || []).map(
              extractMinimalData,
            )
            context.children = []
          }
        } else if (item.type === "quiz") {
          let foundQuiz = null
          let parentModule = null
          let parentSession = null

          courseData.sessions?.forEach((session) => {
            session.modules?.forEach((module) => {
              const quiz = module.quizzes?.find((q) =>
                (q.quiz_number || q.id) === itemId
              )
              if (quiz) {
                foundQuiz = quiz
                parentModule = module
                parentSession = session
              }
            })
          })

          if (foundQuiz && parentModule && parentSession) {
            context.current_item = extractCurrentItemData(foundQuiz, "quiz")
            context.parent_data = {
              course: extractMinimalData(courseData),
              session: extractMinimalData(parentSession),
              module: extractMinimalData(parentModule),
            }
            context.siblings = (parentModule.quizzes?.filter((q) => (q.quiz_number || q.id) !== itemId) || []).map(
              extractMinimalData,
            )
            context.children = []
          }
        } else if (item.type === "assignment") {
          let foundAssignment = null
          let parentModule = null
          let parentSession = null

          courseData.sessions?.forEach((session) => {
            session.modules?.forEach((module) => {
              const assignment = module.assignments?.find((a) =>
                (a.assignment_number || a.id) === itemId
              )
              if (assignment) {
                foundAssignment = assignment
                parentModule = module
                parentSession = session
              }
            })
          })

          if (foundAssignment && parentModule && parentSession) {
            context.current_item = extractCurrentItemData(foundAssignment, "assignment")
            context.parent_data = {
              course: extractMinimalData(courseData),
              session: extractMinimalData(parentSession),
              module: extractMinimalData(parentModule),
            }
            context.siblings = (
              parentModule.assignments?.filter((a) => (a.assignment_number || a.id) !== itemId) || []
            ).map(extractMinimalData)
            context.children = []
          }
        }

        // Use the appropriate ID for the context key
        const contextKey = itemId?.toString() || item.id
        if (contextKey) {
          contextData[contextKey] = context
        }
      })

      return contextData
    },
    [courseData, extractMinimalData, extractCurrentItemData],
  )

  const openRegenerationModal = useCallback((selectedItems) => {
    setRegenerationState((prev) => ({
      ...prev,
      isModalOpen: true,
      selectedItems: selectedItems.map((item) => ({
        ...item,
        reason: "",
        focus_areas: [],
      })),
    }))
  }, [])

  const closeRegenerationModal = useCallback(() => {
    setRegenerationState((prev) => ({
      ...prev,
      isModalOpen: false,
      selectedItems: [],
    }))
  }, [])

  const updateRegenerationItem = useCallback((itemId, updatedItem) => {
    setRegenerationState((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.map((item) => (item.id === itemId ? updatedItem : item)),
    }))
  }, [])

  const removeRegenerationItem = useCallback((itemId) => {
    setRegenerationState((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.filter((item) => item.id !== itemId),
    }))
  }, [])

  const startRegeneration = useCallback(
    async ({ selectedItems, prompt }) => {
      setRegenerationState((prev) => ({ ...prev, isRegenerating: true }))

      try {
        // Build context data
        const contextData = buildContextData(selectedItems)

        const regenerationTargets = selectedItems.map((item) => {
          const itemId = item.value.id ||
            item.value.session_number ||
            item.value.module_number ||
            item.value.topic_number ||
            item.value.quiz_number ||
            item.value.assignment_number;

          return {
            id: itemId,
            type: item.type,
            reason: item.reason || "",
            focus_areas: item.focus_areas || [],
          }
        })

        const payload = {
          userQuery: prompt || "",
          includeFiles: false,
          regenerationTargets,
          contextData,
          // courseData: courseData,
        }

        console.log("Sending regeneration payload:", payload);

        const response = await adminCourseStructureRegenerate(payload).unwrap()

        console.log("Regeneration response:", response);

        const regeneratedItems = selectedItems.map((item) => {
          const itemId = item.value.id ||
            item.value.session_number ||
            item.value.module_number ||
            item.value.topic_number ||
            item.value.quiz_number ||
            item.value.assignment_number;

          // Find the regenerated content in the response
          let regeneratedData = null

          // Handle different response structures
          if (response?.data?.regeneratedContent) {
            regeneratedData = response.data.regeneratedContent.find(
              (content) => content.id === itemId && content.type === item.type
            )
          } else if (response?.regeneratedContent) {
            regeneratedData = response.regeneratedContent.find(
              (content) => content.id === itemId && content.type === item.type
            )
          } else if (response?.data) {
            // Handle case where response.data is the regenerated content array
            regeneratedData = response.data.find(
              (content) => content.id === itemId && content.type === item.type
            )
          }

          return {
            ...item,
            oldContent: item.value,
            newContent: regeneratedData?.content || regeneratedData || null,
            error: regeneratedData?.error || null,
            success: !!regeneratedData && !regeneratedData.error,
          }
        })

        setRegenerationState((prev) => ({
          ...prev,
          isRegenerating: false,
          isModalOpen: false,
          isConfirmationOpen: true,
          regeneratedItems,
        }))
      } catch (error) {
        console.error("Regeneration error:", error)
        setRegenerationState((prev) => ({
          ...prev,
          isRegenerating: false,
        }))

        const errorMessage =
          error?.data?.error || error?.data?.message || error?.error || error?.message || "Failed to regenerate content"
        alert(`Regeneration failed: ${errorMessage}`)
      }
    },
    [buildContextData, adminCourseStructureRegenerate, courseData],
  )

  const closeConfirmationModal = useCallback(() => {
    setRegenerationState((prev) => ({
      ...prev,
      isConfirmationOpen: false,
      regeneratedItems: [],
    }))
  }, [])

  const confirmChanges = useCallback(
    async (itemsToReplace) => {
      setRegenerationState((prev) => ({
        ...prev,
        isProcessingConfirmation: true,
      }))

      try {
        let updatedCourseData = { ...courseData }

        itemsToReplace.forEach((item) => {
          if (!item.newContent || item.error) return;

          const originalItemId = item.value.id ||
            item.value.session_number ||
            item.value.module_number ||
            item.value.topic_number ||
            item.value.quiz_number ||
            item.value.assignment_number;

          if (item.type === "course") {
            // Update course data
            updatedCourseData = {
              ...updatedCourseData,
              ...item.newContent,
              // Preserve the original ID
              id: updatedCourseData.id,
              sessions: updatedCourseData.sessions // Preserve sessions structure
            };
          } else if (item.type === "session") {
            updatedCourseData.sessions = updatedCourseData.sessions?.map((session) =>
              (session.session_number || session.id) === originalItemId
                ? {
                  ...session,
                  ...item.newContent,
                  // Preserve the original ID and modules
                  session_number: session.session_number,
                  id: session.id,
                  modules: session.modules
                }
                : session
            ) || [];
          } else if (item.type === "module") {
            updatedCourseData.sessions = updatedCourseData.sessions?.map((session) => ({
              ...session,
              modules: session.modules?.map((module) =>
                (module.module_number || module.id) === originalItemId
                  ? {
                    ...module,
                    ...item.newContent,
                    // Preserve the original ID and children
                    module_number: module.module_number,
                    id: module.id,
                    topics: module.topics,
                    quizzes: module.quizzes,
                    assignments: module.assignments
                  }
                  : module
              ) || []
            })) || [];
          } else if (item.type === "topic") {
            updatedCourseData.sessions = updatedCourseData.sessions?.map((session) => ({
              ...session,
              modules: session.modules?.map((module) => ({
                ...module,
                topics: module.topics?.map((topic) =>
                  (topic.topic_number || topic.id) === originalItemId
                    ? {
                      ...topic,
                      ...item.newContent,
                      // Preserve the original ID
                      topic_number: topic.topic_number,
                      id: topic.id
                    }
                    : topic
                ) || []
              })) || []
            })) || [];
          } else if (item.type === "quiz") {
            updatedCourseData.sessions = updatedCourseData.sessions?.map((session) => ({
              ...session,
              modules: session.modules?.map((module) => ({
                ...module,
                quizzes: module.quizzes?.map((quiz) =>
                  (quiz.quiz_number || quiz.id) === originalItemId
                    ? {
                      ...quiz,
                      ...item.newContent,
                      // Preserve the original ID
                      quiz_number: quiz.quiz_number,
                      id: quiz.id
                    }
                    : quiz
                ) || []
              })) || []
            })) || [];
          } else if (item.type === "assignment") {
            updatedCourseData.sessions = updatedCourseData.sessions?.map((session) => ({
              ...session,
              modules: session.modules?.map((module) => ({
                ...module,
                assignments: module.assignments?.map((assignment) =>
                  (assignment.assignment_number || assignment.id) === originalItemId
                    ? {
                      ...assignment,
                      ...item.newContent,
                      // Preserve the original ID
                      assignment_number: assignment.assignment_number,
                      id: assignment.id
                    }
                    : assignment
                ) || []
              })) || []
            })) || [];
          }
        })

        // Update course data
        onUpdateCourseData(updatedCourseData)

        setRegenerationState((prev) => ({
          ...prev,
          isProcessingConfirmation: false,
          isConfirmationOpen: false,
          regeneratedItems: [],
        }))

        // Reset selected items for regeneration
        setSelectedForRegeneration([])

        toast.success("Changes applied successfully!");
      } catch (error) {
        console.error("Error applying changes:", error)
        setRegenerationState((prev) => ({
          ...prev,
          isProcessingConfirmation: false,
        }))
        toast.error("Failed to apply changes. Please try again.")
      }
    },
    [courseData, onUpdateCourseData, setSelectedForRegeneration],
  )

  const discardChanges = useCallback(() => {
    setRegenerationState((prev) => ({
      ...prev,
      isConfirmationOpen: false,
      regeneratedItems: [],
    }))
    setSelectedForRegeneration([])
  }, [setSelectedForRegeneration])

  return {
    regenerationState,
    openRegenerationModal,
    closeRegenerationModal,
    updateRegenerationItem,
    removeRegenerationItem,
    startRegeneration,
    closeConfirmationModal,
    confirmChanges,
    discardChanges,
  }
}

export default useRegeneration