/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  useAssignPredefinedQuestionToQuizMutation,
  useGetPredefinedQuestionsByQuizIdQuery,
  useRemovePredefinedQuestionFromQuizMutation
} from "../../../services/Masters/quizPreDefinedQuestionsApi";
import toast from "react-hot-toast";
import { useGetPreDefinedQuestionsQuery } from "../../../services/Masters/predefinedQuestionAPI";
import PermissionWrapper from "../../../context/PermissionWrapper";

const PredefinedQuestionModal = ({ isOpen, onClose, onSelect }) => {
  const { quizId } = useParams();
  const { id } = useSelector((state) => state.user);
  const { data: questions, isLoading } = useGetPreDefinedQuestionsQuery();
  const { data: assignedQuestions } = useGetPredefinedQuestionsByQuizIdQuery(quizId);


  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [assignPredefinedQuestionToQuiz] = useAssignPredefinedQuestionToQuizMutation();
  const [removePredefinedQuestion] = useRemovePredefinedQuestionFromQuizMutation();
  const { role } = useSelector((state) => state.user);

  // Track initial assignments to compare against for removals
  const [initialAssignments, setInitialAssignments] = useState([]);

  useEffect(() => {
    if (assignedQuestions?.data) {
      const preSelectedIds = assignedQuestions.data.map(
        question => question.pre_defined_question_id
      );
      setSelectedQuestions(preSelectedIds);
      setInitialAssignments(assignedQuestions.data);
    }
  }, [assignedQuestions]);

  if (!isOpen) return null;

  const handleCheckboxChange = (questionId) => {
    setSelectedQuestions((prevSelected) =>
      prevSelected.includes(questionId)
        ? prevSelected.filter((id) => id !== questionId)
        : [...prevSelected, questionId]
    );
  };

  const handleConfirm = async () => {
    try {
      // Find questions to remove (were initially assigned but now unselected)
      const questionsToRemove = initialAssignments.filter(
        assignment => !selectedQuestions.includes(assignment.pre_defined_question_id)
      );

      // Find questions to add (selected but not initially assigned)
      const initialAssignedIds = initialAssignments.map(q => q.pre_defined_question_id);
      const questionsToAdd = selectedQuestions.filter(
        id => !initialAssignedIds.includes(id)
      );

      // Handle removals
      for (const question of questionsToRemove) {
        try {
          await removePredefinedQuestion(question.pre_defined_question_id).unwrap();
        } catch (error) {
          console.error(`Failed to remove question ${question.id}:`, error);
          toast.error(error?.data?.error || `Failed to remove question ${question.id}`);
        }
      }

      // Handle additions
      if (questionsToAdd.length > 0) {
        const assignments = questionsToAdd.map((questionId) => ({
          quiz_id: parseInt(quizId),
          pre_defined_question_id: questionId,
          created_by: parseInt(id),
          updated_by: parseInt(id),
          created_by_type: role,
          updated_by_type: role,
        }));

        await assignPredefinedQuestionToQuiz(assignments).unwrap();
      }

      // Show success message based on operations performed
      if (questionsToRemove.length > 0 || questionsToAdd.length > 0) {
        toast.success("Questions updated successfully!");
      } else {
        toast.success("No changes made!");
      }

      onSelect(selectedQuestions);
      onClose();
    } catch (error) {
      console.error("Error updating questions:", error);
      toast.error(error?.data?.error || error.data?.message || "Failed to update questions.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-leafGreen/20 w-full max-w-3xl">
        <div className=" bg-lightGreen px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Select Predefined Questions</h2>
          <button onClick={onClose} className="text-white hover:text-lightGreen transition-colors duration-200">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <p className="text-gray-500 text-center">Loading questions...</p>
          ) : questions && questions.length > 0 ? (

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className=" bg-lightGreen">
                  <PermissionWrapper section="Quiz Predefined Questions" action="edit">
                    <th className="px-4 py-2"></th>
                  </PermissionWrapper>
                  <th className="px-4 py-2">Question</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => {
                  const isAlreadyAssigned = initialAssignments.some(
                    aq => aq.pre_defined_question_id === question.id
                  );
                  return (
                    <tr key={question.id} className="border-b hover:bg-lightGreen transition-all">
                      <PermissionWrapper section="Quiz Predefined Questions" action="edit">
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            className="accent-leafGreen"
                            checked={selectedQuestions.includes(question.id)}
                            onChange={() => handleCheckboxChange(question.id)}
                          />
                        </td>
                      </PermissionWrapper>
                      <td className="px-4 py-2">{question.question_text}</td>
                      <td className="px-4 py-2">{question.question_type}</td>
                      <td className="px-4 py-2">
                        {isAlreadyAssigned && (
                          <span className="text-sm text-forestGreen">Already assigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center">No predefined questions available.</p>
          )}
        </div>


        <div className="px-6 py-4 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-lightGreen transition-all duration-200"
          >
            Cancel
          </button>
          <PermissionWrapper section="Quiz Predefined Questions" action="edit">
            <button
              onClick={handleConfirm}
              className="px-6 py-3  from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Update Questions
            </button>
          </PermissionWrapper>
        </div>

      </div>
    </div>
  );
};

export default PredefinedQuestionModal;