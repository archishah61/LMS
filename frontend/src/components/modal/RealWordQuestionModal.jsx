import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../services/CookieService";
import {
  useGetGeneratedRealWordQuizQuery,
  useCreateRealWordQuestionMutation
} from "../../services/Content_Management/quizType/realWordQuestionApi";
import { Loader2, X, BookCheck, Save, RefreshCw } from "lucide-react";
import PermissionWrapper from "../../context/PermissionWrapper";

const RealWordQuestionModal = ({ isOpen, onClose, quizId, createdBy }) => {
  const { access_token } = getAdminToken();
  const [createQuestion] = useCreateRealWordQuestionMutation();
  const [words, setWords] = useState([]);
  const [marks, setMarks] = useState(0); // Single state for marks
  const [isSaving, setIsSaving] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const { data, error, isLoading } = useGetGeneratedRealWordQuizQuery({ access_token }, {
    skip: !shouldFetch,
  });

  useEffect(() => {
    if (data && data.quiz) {
      setWords((prevWords) => [...prevWords, ...data.quiz]);
      setHasFetched(true);
      setHasGenerated(true);
      toast.success("Generated 10 random words", {
        icon: "🎲",
        duration: 3000
      });
    } else if (data && !data.quiz) {
      toast.error("No quiz data found");
    } else if (error) {
      console.error("Quiz fetch error:", error);
      toast.error("Failed to generate words");
    }
  }, [data, error]);

  const handleGenerate = () => {
    setShouldFetch(true);
  };

  const handleMarksChange = (value) => {
    setMarks(parseInt(value, 10) || 0);
  };

  const handleSave = async () => {
    if (!quizId || !createdBy || words.length === 0) return;

    const formData = {
      questions: words.map((q) => ({
        word: q.word,
        correct_answer: q.correct_answer,
        marks: marks, // Use the single marks value for all questions
        quiz_id: quizId,
        created_by: createdBy,
        updated_by: createdBy,
      })),
    };

    setIsSaving(true);
    try {
      const res = await createQuestion({
        formData,
        access_token,
      }).unwrap();
      toast.success(res.message || "Questions saved successfully", {
        icon: "✅",
        duration: 3000,
      });
      setWords([]);
      setMarks(0);
      setHasFetched(false);
      setShouldFetch(false);
      setHasGenerated(false);
      onClose();
    } catch (err) {
      console.error(err);
      const errorMessage = err?.data?.error ||
        err?.data?.message ||
        err?.error ||
        err?.message ||
        'Failed to save questions';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <PermissionWrapper section="Real Word Question" action="create">
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-lg w-[90%] max-w-2xl shadow-xl transform transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-forestGreen flex items-center gap-2">
              <BookCheck size={24} className="text-leafGreen" />
              Generate Real/Fake Word Questions
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 transition-colors duration-300"
              disabled={isSaving}
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex justify-between mb-6">
            {!hasGenerated && (
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-leafGreen text-white rounded-lg flex items-center gap-2 hover:bg-forestGreen transition-all duration-300 transform shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} />
                    Generate 10 Words
                  </>
                )}
              </button>
            )}
          </div>
          {hasFetched && words.length > 0 && (
            <div className="max-h-64 overflow-y-auto border border-leafGreen/20 rounded-lg p-4 space-y-3 mb-6 shadow-inner bg-lightGreen/5">
              {words.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <span className="font-medium">{item.word}</span>
                  <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                    item.correct_answer === "yes"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {item.correct_answer === "yes" ? "Real" : "Fake"}
                  </span>
                </div>
              ))}
            </div>
          )}
          {hasFetched && (
            <div className="flex flex-col items-end space-y-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="marks" className="text-sm text-gray-600">Marks for all questions:</label>
                <input
                  id="marks"
                  type="number"
                  value={marks}
                  onChange={(e) => handleMarksChange(e.target.value)}
                  placeholder="Marks"
                  className="border rounded p-1 w-16 text-center"
                />
              </div>
              <div className="flex justify-between items-center w-full">
                <p className="text-sm text-gray-500">
                  {words.length === 0 && "No words generated yet."}
                </p>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-leafGreen text-white rounded-lg flex items-center gap-2 hover:bg-forestGreen transition-all duration-300 transform shadow-md"
                  disabled={isSaving || words.length === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save to Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PermissionWrapper>
  );
};

export default RealWordQuestionModal;