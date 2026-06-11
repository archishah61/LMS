/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { X, Save } from 'lucide-react';
import { useAssignContentToTopicMutation, useRemoveContentFromTopicMutation, useGetTopicContentByTopicIdQuery, useGetTopicContentByModuleIdQuery } from '../../services/Course_Management/topicContent';
import { useGetQuizByModuleIdQuery } from "../../services/Course_Management/quizApi";
import { useGetAssignmentModuleByIdQuery } from '../../services/Content_Management/assignmentApi';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import PermissionWrapper from '../../context/PermissionWrapper';
import { getAdminToken } from '../../services/CookieService';

const TopicContentModal = ({ isOpen, onClose, topicId, moduleId, activeModuleId }) => {
  const { access_token } = getAdminToken()
  const { id } = useSelector((state) => state.user);


  // Fetch quizzes
  const {
    data: quizzesData,
    isSuccess: isSuccessGetQuizzes,
    isLoading: isLoadingGetQuizzes,
  } = useGetQuizByModuleIdQuery({ id: moduleId, access_token });

  // Fetch assignments
  const {
    data: assignmentsData,
    isSuccess: isSuccessGetAssignments,
    isLoading: isLoadingGetAssignments,
  } = useGetAssignmentModuleByIdQuery({
    moduleId,
    access_token,
  });

  // Fetch current content
  const { data: currentContentResponse } = useGetTopicContentByTopicIdQuery({
    topic_id: topicId,
    access_token,
  });

  // Fetch all topic content for the module to check assignments
  const { data: allModuleContentResponse } = useGetTopicContentByModuleIdQuery({
    module_id: activeModuleId,
    access_token,
  });

  const [assignContentToTopic] = useAssignContentToTopicMutation();
  const [removeContentFromTopic] = useRemoveContentFromTopicMutation();
  const [selectedQuizzes, setSelectedQuizzes] = useState([]);
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes');
  const [pendingChanges, setPendingChanges] = useState({
    quizzes: { toAdd: [], toRemove: [] },
    assignments: { toAdd: [], toRemove: [] }
  });

  // Memoize the filter function
  const filterActiveContent = useCallback((content) => {
    return content?.filter(item => item.status === 'active') || [];
  }, []);

  // Get content already assigned to other topics
  const getAssignedContent = useCallback(() => {
    if (!allModuleContentResponse?.data?.[0]?.data) return { quizzes: [], assignments: [] };

    const assignedContent = allModuleContentResponse.data[0].data;
    const assignedQuizzes = new Set();
    const assignedAssignments = new Set();

    assignedContent.forEach(content => {
      if (content.topic_id !== topicId) {
        if (content.quiz_id) assignedQuizzes.add(content.quiz_id);
        if (content.assignment_id) assignedAssignments.add(content.assignment_id);
      }
    });

    return {
      quizzes: Array.from(assignedQuizzes),
      assignments: Array.from(assignedAssignments)
    };
  }, [allModuleContentResponse, topicId]);

  // Initialize selected content when modal opens or content changes
  useEffect(() => {
    if (isOpen && currentContentResponse?.data?.[0]?.data) {
      const currentContent = currentContentResponse.data[0].data;
      const assignedQuizIds = currentContent
        .filter(item => item.quiz_id)
        .map(item => item.quiz_id);
      const assignedAssignmentIds = currentContent
        .filter(item => item.assignment_id)
        .map(item => item.assignment_id);

      setSelectedQuizzes(assignedQuizIds);
      setSelectedAssignments(assignedAssignmentIds);
      // Reset pending changes when modal opens
      setPendingChanges({
        quizzes: { toAdd: [], toRemove: [] },
        assignments: { toAdd: [], toRemove: [] }
      });
    }
  }, [isOpen, currentContentResponse]);

  const handleCheckboxChange = useCallback((id, type) => {
    if (type === 'quiz') {
      setSelectedQuizzes(prev => {
        if (prev.includes(id)) {
          setPendingChanges(prevChanges => ({
            ...prevChanges,
            quizzes: {
              ...prevChanges.quizzes,
              toRemove: [...prevChanges.quizzes.toRemove, id],
              toAdd: prevChanges.quizzes.toAdd.filter(item => item !== id)
            }
          }));
          return prev.filter(quizId => quizId !== id);
        } else {
          setPendingChanges(prevChanges => ({
            ...prevChanges,
            quizzes: {
              ...prevChanges.quizzes,
              toAdd: [...prevChanges.quizzes.toAdd, id],
              toRemove: prevChanges.quizzes.toRemove.filter(item => item !== id)
            }
          }));
          return [...prev, id];
        }
      });
    } else if (type === 'assignment') {
      setSelectedAssignments(prev => {
        if (prev.includes(id)) {
          setPendingChanges(prevChanges => ({
            ...prevChanges,
            assignments: {
              ...prevChanges.assignments,
              toRemove: [...prevChanges.assignments.toRemove, id],
              toAdd: prevChanges.assignments.toAdd.filter(item => item !== id)
            }
          }));
          return prev.filter(assignmentId => assignmentId !== id);
        } else {
          setPendingChanges(prevChanges => ({
            ...prevChanges,
            assignments: {
              ...prevChanges.assignments,
              toAdd: [...prevChanges.assignments.toAdd, id],
              toRemove: prevChanges.assignments.toRemove.filter(item => item !== id)
            }
          }));
          return [...prev, id];
        }
      });
    }
  }, []);

  const handleSave = async () => {
    try {
      // Handle quiz changes
      for (const quizId of pendingChanges.quizzes.toAdd) {
        await assignContentToTopic({
          body: [{
            module_id: moduleId,
            topic_id: topicId,
            assignment_id: null,
            quiz_id: quizId,
            created_by: parseInt(id),
            updated_by: parseInt(id),
          }],
          access_token,
        }).unwrap();
      }

      for (const quizId of pendingChanges.quizzes.toRemove) {
        await removeContentFromTopic({
          topic_id: topicId,
          body: { quiz_id: quizId },
          access_token,
        }).unwrap();
      }

      // Handle assignment changes
      for (const assignmentId of pendingChanges.assignments.toAdd) {
        await assignContentToTopic({
          body: [
            {
              module_id: moduleId,
              topic_id: topicId,
              assignment_id: assignmentId,
              quiz_id: null,
              created_by: parseInt(id),
              updated_by: parseInt(id),
            },
          ],
          access_token,
        }).unwrap();
      }

      for (const assignmentId of pendingChanges.assignments.toRemove) {
        await removeContentFromTopic({
          topic_id: topicId,
          body: { assignment_id: assignmentId },
          access_token,
        }).unwrap();
      }

      toast.success('Changes saved successfully');
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to save changes');
    }
  };

  if (!isOpen) return null;

  const assignedContent = getAssignedContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            Select Content
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`py-4 px-8 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'quizzes'
                ? 'border-leafGreen text-leafGreen bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Quizzes
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-8 text-center border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'assignments'
                ? 'border-leafGreen text-leafGreen bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Assignments
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {activeTab === 'quizzes' ? (
            isLoadingGetQuizzes ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-leafGreen"></div>
              </div>
            ) : quizzesData && filterActiveContent(quizzesData).length > 0 ? (
              <div className="space-y-4">
                {filterActiveContent(quizzesData).map((quiz) => {
                  const isAssignedToOtherTopic = assignedContent.quizzes.includes(quiz.id);
                  const isSelected = selectedQuizzes.includes(quiz.id);

                  return (
                    <div
                      key={quiz.id}
                      className={`flex items-center p-4 bg-white rounded-lg border ${isAssignedToOtherTopic && !isSelected
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 hover:border-leafGreen/50 hover:shadow-md'
                        } transition-all duration-200`}
                    >
                      <PermissionWrapper section="Topic Content" action="create">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(quiz.id, 'quiz')}
                          disabled={isAssignedToOtherTopic && !isSelected}
                          className={`h-5 w-5 rounded accent-leafGreen focus:ring-leafGreen/20 focus:border-leafGreen border-gray-300 ${isAssignedToOtherTopic && !isSelected
                            ? 'opacity-50 cursor-not-allowed'
                            : 'text-leafGreen'
                            }`}
                        />
                      </PermissionWrapper>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{quiz.title}</h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="capitalize">{quiz.quizType?.replace(/_/g, ' ')}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                          {isAssignedToOtherTopic && !isSelected && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Assigned to another topic
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500 text-lg">No active quizzes available.</p>
              </div>
            )
          ) : (
            isLoadingGetAssignments ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : assignmentsData && filterActiveContent(assignmentsData).length > 0 ? (
              <div className="space-y-4">
                {filterActiveContent(assignmentsData).map((assignment) => {
                  const isAssignedToOtherTopic = assignedContent.assignments.includes(assignment.id);
                  const isSelected = selectedAssignments.includes(assignment.id);

                  return (
                    <div
                      key={assignment.id}
                      className={`flex items-center p-4 bg-white rounded-lg border ${isAssignedToOtherTopic && !isSelected
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 hover:border-leafGreen/50 hover:shadow-md'
                        } transition-all duration-200`}
                    >
                      <PermissionWrapper section="Topic Content" action="create">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(assignment.id, 'assignment')}
                          disabled={isAssignedToOtherTopic && !isSelected}
                          className={`h-5 w-5 rounded accent-leafGreen focus:ring-blue-500 border-gray-300 ${isAssignedToOtherTopic && !isSelected
                            ? 'opacity-50 cursor-not-allowed'
                            : 'text-blue-600'
                            }`}
                        />
                      </PermissionWrapper>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="capitalize">{assignment.category?.replace(/_/g, ' ')}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                          {isAssignedToOtherTopic && !isSelected && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Assigned to another topic
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500 text-lg">No active assignments available.</p>
              </div>
            )
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            Cancel
          </button>
          <PermissionWrapper section="Topic Content" action="create">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen hover:bg-forestGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </PermissionWrapper>
        </div>

      </div>
    </div >
  );
};

export default TopicContentModal; 