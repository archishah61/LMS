/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { PlusCircle, X, Eye, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreateTextBasedQuizTextMutation,
  useUpdateTextBasedQuizTextMutation,
  useGetTextBasedQuizTextByIdQuery,
  useDeleteTextBasedQuizTextMutation,
} from "../../../services/Course_Management/textBasedQuizTextApi";
import { getAdminToken } from "../../../services/CookieService";
import toast from "react-hot-toast";

import MCQModal from "../../modal/McqModal";
import PermissionWrapper from "../../../context/PermissionWrapper";

export default function QuizQuestion() {
  const { access_token } = getAdminToken();

  const [questions, setQuestions] = useState([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { quizId } = useLocation().state;
  useState([]);

  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "multiple-choice",
    marks: "",
    sequence_no: "",
    quiz_id: parseInt(quizId),
    // correct_words: [{ correct_word: "", hint: "" }], // New field for the correct words and hints
  });

  const navigate = useNavigate();
  const quizType = "text_based";
  const [createTextBasedQuizText] = useCreateTextBasedQuizTextMutation();
  const [deleteTextBasedQuizText] = useDeleteTextBasedQuizTextMutation();
  const [updateTextBasedQuizText] = useUpdateTextBasedQuizTextMutation();

  const {
    data: fetchedTextBasedQuestions,
    refetch: refetchTextBasedQuestions,
  } = useGetTextBasedQuizTextByIdQuery({
    id: quizId,
    access_token,
  });

  const fetchedQuestions = fetchedTextBasedQuestions
  const refetch = refetchTextBasedQuestions

  useEffect(() => {
    window.scrollTo(0, 0);
    // Refetch data whenever quizId or quizType changes
    refetch();
  }, [quizId, quizType, refetch]); // Ensure refetch is called when dependencies change

  useEffect(() => {
    if (fetchedQuestions) {
      setQuestions(fetchedQuestions);
    }
  }, [fetchedQuestions]);

  useEffect(() => {
    if (isEditing && selectedQuestion) {
      setFormData({
        question_text: selectedQuestion.question_text || selectedQuestion.text || "",
        question_type: selectedQuestion.question_type || "",
        marks: selectedQuestion.marks || 0,
        sequence_no: selectedQuestion.sequence_no || 0,
        quiz_id: parseInt(quizId),
      });
    }
  }, [isEditing, selectedQuestion, quizId]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const imageUrl = URL.createObjectURL(files[0]);
    setFormData({ ...formData, [name]: files[0], preview: imageUrl });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        // if (key === "correct_words") {
        //   // Stringify the correct_words array before appending
        //   payload.append(key, JSON.stringify(formData[key]));
        // } else {
        payload.append(key, formData[key]);
        // }
      }
    });



    try {
      if (isEditing) {
        if (quizType === "text_based") {
          await updateTextBasedQuizText({
            id: selectedQuestion.id,
            questionData: payload,
            access_token,
          }).unwrap();
          toast.success("Text Updated successfully");
        }
        setIsEditing(false);
      } else {
        if (quizType === "text_based") {
          await createTextBasedQuizText({
            questionData: payload,
            access_token: access_token,
          }).unwrap();
          toast.success("Text Added successfully");
        }
      }
      refetch();
      setShowQuestionForm(false);
      setFormData({
        question_text: "",
        question_type: "multiple-choice",
        marks: "",
        sequence_no: "",
        quiz_id: parseInt(quizId),
        // correct_words: [{ correct_word: "", hint: "" }],
      });
      setSelectedQuestion(null);
    } catch (error) {
      console.error("Error submitting assignment:", error);
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to Create Assignment';
      toast.error(errorMessage);
    }
  };

  const handleView = (question) => {
    setSelectedQuestion(question);
    setShowViewModal(true);
    setFormData(question);
  };

  const handleEdit = () => {
    setFormData({
      question_text: selectedQuestion.text || "",
      question_type: selectedQuestion.question_type || "",
      marks: selectedQuestion.marks || 0,
      sequence_no: selectedQuestion.sequence_no || 0,
      quiz_id: parseInt(quizId),
    });
    setIsEditing(true);
    setShowViewModal(false);
    setShowQuestionForm(true);
  };

  const handleDelete = async (id) => {
    try {
      if (quizType === "text_based") {
        await deleteTextBasedQuizText({ id, access_token }).unwrap();
      }

      // Manually update the local state to remove the deleted question
      setQuestions(prevQuestions => prevQuestions.filter(question => question.id !== id));

      // Close the view modal and reset the selected question
      setShowViewModal(false);
      setSelectedQuestion(null);

      // Optionally refetch the data to ensure consistency
      refetch();
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };


  const optionList = (id) => {
    navigate(`/admin/dashboard/quiz/quiz-option/${id}`, {
      state: { questionId: id }
    });
  };

  const GenerateQuestion = (id) => {
    navigate(`/admin/dashboard/quiz/generate-question`, {
      state: { quizId: id }
    });
  };

  // audio to script related code
  const [showAudioModal, setShowAudioModal] = useState(false);



  // real word related code
  const [showRealWordModal, setShowRealWordModal] = useState(false); // For Real Word Modal
  const [selectedRealWordQuestions, setSelectedRealWordQuestions] = useState(
    []
  );


  //summary passage related code
  const [showSummaryPassageModal, setShowSummaryPassageModal] = useState(false);
  const [showDragDropModal, setShowDragDropModal] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    const tabOrder = [
      "audio_to_script",
      "real_word",
      "summary_passages",
      "drag_drop",
      "best_option",
      "complete_sentence",
    ];

    for (const tab of tabOrder) {
      const sectionMap = {
        audio_to_script: "Audio To Script Question",
        real_word: "Real Word Question",
        summary_passages: "Summarize Passage Question",
        drag_drop: "Drag Drop Question",
        best_option: "Best Option Question",
        complete_sentence: "Complete The Sentences",
      };

      // if (hasPermission(sectionMap[tab], "view")) {
      //   return tab;
      // }
    }

    return "none"; // Return null if no permissions for any tab
  });

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowQuestionForm(false);
    setSelectedQuestion(null);
  };

  // Fetch Complete the Sentence questions


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4">
          <div className="flex items-center justify-between">
            <div className="grid flex-1 mx-2">
              <h1 className="text-2xl font-bold  text-forestGreen">Text Based Questions</h1>
              <p className="text-gray-600 mt-1">Manage Text Based Questions</p>
            </div>

            <div className="flex items-center gap-4 ">
              <PermissionWrapper section="Text Based Quiz Text" action="create">
                {quizType === "text_based" &&
                  (!fetchedTextBasedQuestions ||
                    fetchedTextBasedQuestions.length === 0) && (
                    <button
                      className=" bg-forestGreen    hover: text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedQuestion(null);
                        setShowQuestionForm(true);
                      }}
                    >
                      <PlusCircle size={20} />
                      Add Text
                    </button>
                  )}
              </PermissionWrapper>

              {/* <PermissionWrapper section="Fill-in-the-Blank Generated|Multiple Choice Generated|True/False Generated">
                <button
                  onClick={() => GenerateQuestion(quizId)}
                  className=" bg-forestGreen    hover: text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                >
                  <Plus size={18} /> Quiz Question
                </button>
              </PermissionWrapper> */}

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        {questions && questions.length > 0 ? (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl">
            {quizType === "text_based" ? (
              // Table for text_based quiz
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className=" bg-lightGreen">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Text
                    </th>
                    <PermissionWrapper section="Text Based Quiz Text|Fill-in-the-Blank Generated|Multiple Choice Generated|True/False Generated">
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </PermissionWrapper>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {questions.map((question) => (
                    <tr
                      key={question.id}
                      className="hover: hover:bg-lightGreen/50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 text-sm font-medium  text-forestGreen prose leading-relaxed text-justify">
                        {question.text}
                      </td>
                      <PermissionWrapper section="Text Based Quiz Text|Fill-in-the-Blank Generated|Multiple Choice Generated|True/False Generated">
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <PermissionWrapper
                              section="Text Based Quiz Text"
                              action="edit|delete"
                            >
                              <button
                                className="px-4 py-2  bg-leafGreen text-white rounded-lg flex items-center gap-1 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                onClick={() => handleView(question)}
                              >
                                <Eye size={18} /> View
                              </button>
                            </PermissionWrapper>
                            <PermissionWrapper section="Fill-in-the-Blank Generated|Multiple Choice Generated|True/False Generated">
                              <button
                                onClick={() => GenerateQuestion(quizId)}
                                className="bg-forestGreen hover: text-white px-6 py-2 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm"
                              >
                                <Plus size={18} /> Quiz Question
                              </button>
                            </PermissionWrapper>
                          </div>
                        </td>
                      </PermissionWrapper>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <PermissionWrapper section="Quiz Question" action="view">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className=" bg-lightGreen">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Sequence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Marks
                      </th>
                      <PermissionWrapper
                        section="Quiz Question"
                        action="edit|delete"
                      >
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </PermissionWrapper>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {questions.map((question) => (
                      <tr
                        key={question.id}
                        className="hover: hover:bg-lightGreen/50 transition-all duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {question.sequence_no}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium  text-forestGreen">
                          {question.question_text}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {question.question_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {question.marks}
                        </td>
                        <PermissionWrapper section="Quiz Question|Quiz Option">
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2 justify-end">
                              <PermissionWrapper
                                section="Quiz Question"
                                action="edit|delete"
                              >
                                <button
                                  className="px-4 py-2  bg-lightGreen text-white rounded-lg flex items-center gap-2   transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                  onClick={() => handleView(question)}
                                >
                                  <Eye size={18} /> View
                                </button>
                              </PermissionWrapper>
                              <PermissionWrapper
                                section="Quiz Option"
                                action="create"
                              >
                                <button
                                  onClick={() => optionList(question.question_id)}
                                  className="px-4 py-2  from-green-500 to-emerald-500 text-white rounded-lg flex items-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                >
                                  <Plus size={18} /> Add Options
                                </button>
                              </PermissionWrapper>
                            </div>
                          </td>
                        </PermissionWrapper>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </PermissionWrapper>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg p-8 text-center border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl mb-8">
            <p className="text-gray-500">
              No questions available. Add your first question to get started.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "none" && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl mb-8"></div>
          )}

          <PermissionWrapper section="Text Based Quiz Text" action="view">
            {activeTab === "text_based" && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl mb-8">
                {/* Text-Based Quiz Content */}
                {questions && questions.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className=" bg-lightGreen">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Text
                        </th>
                        <PermissionWrapper section="Text Based Quiz Text|Fill-in-the-Blank Generated|Multiple Choice Generated|True/False Generated">
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </PermissionWrapper>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {questions.map((question) => (
                        <tr
                          key={question.id}
                          className="hover: hover:bg-lightGreen/50 transition-all duration-200"
                        >
                          <td className="px-6 py-4 text-sm font-medium  text-forestGreen">
                            {question.text}
                          </td>
                          <PermissionWrapper section="Text Based Quiz Text|Fill-in-the-Blank Generated|Multiple Choice Generated|True/False Generated">
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2 justify-end">
                                <PermissionWrapper
                                  section="Text Based Quiz Text"
                                  action="edit|delete"
                                >
                                  <button
                                    className="px-4 py-2  bg-lightGreen text-white rounded-lg flex items-center gap-2   transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                    onClick={() => handleView(question)}
                                  >
                                    <Eye size={18} /> View
                                  </button>
                                </PermissionWrapper>
                                <PermissionWrapper section="Fill-in-the-Blank Generated|Multiple Choice Generated|True/False Generated">
                                  <button
                                    onClick={() => GenerateQuestion(quizId)}
                                    className="px-4 py-2  from-green-500 to-emerald-500 text-white rounded-lg flex items-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                  >
                                    <Plus size={18} /> Quiz Question
                                  </button>
                                </PermissionWrapper>
                              </div>
                            </td>
                          </PermissionWrapper>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="bg-white shadow-lg rounded-lg p-8 text-center border border-leafGreen/20 transform transition-all duration-300 hover:shadow-xl mb-8">
                    <p className="text-gray-500">
                      No questions available. Add your first question to get
                      started.
                    </p>
                  </div>
                )}
              </div>
            )}
          </PermissionWrapper>
        </motion.div>
      </AnimatePresence>


      <PermissionWrapper section="Quiz Question|Text Based Quiz Text">
        <MCQModal
          showQuestionForm={showQuestionForm}
          setShowQuestionForm={setShowQuestionForm}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          selectedQuestion={selectedQuestion}
          setSelectedQuestion={setSelectedQuestion}
          quizType={quizType}
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
        />
      </PermissionWrapper>

      {showViewModal && selectedQuestion && quizType === "text_based" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                Question Details
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedQuestion(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Question Text
                </label>
                <p className="mt-1 text-lg text-gray-700">
                  {selectedQuestion.text}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <PermissionWrapper section="Text Based Quiz Text" action="edit">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-6 py-2.5 text-sm font-medium text-white  bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Edit
                </button>
              </PermissionWrapper>

              <PermissionWrapper section="Text Based Quiz Text" action="delete">
                <button
                  type="button"
                  onClick={() => handleDelete(selectedQuestion.id)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-400 rounded-lg transition-all duration-200"
                >
                  Delete
                </button>
              </PermissionWrapper>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
