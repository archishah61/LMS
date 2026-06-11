/* eslint-disable react/prop-types */
import { useState } from "react";
import { useCreateAudioToScriptQuestionMutation } from "../../services/Content_Management/quizType/audioToScriptApi";
import { toast } from "react-hot-toast";
import { getAdminToken } from "../../services/CookieService";
import { Headphones, X, Upload, Loader2, FileAudio, FileText } from "lucide-react";
import PermissionWrapper from "../../context/PermissionWrapper";
import AIContentGenerator from "../Home/courses/AIContentGenrator";
import { base64ToFile } from "../../utils/toFileObject";

const AudioToScriptModal = ({ isOpen, onClose, quizId, createdBy }) => {
    const [script, setScript] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [marks, setMarks] = useState(""); // State for marks
    const [createQuestion, { isLoading }] = useCreateAudioToScriptQuestionMutation();
    const { access_token } = getAdminToken();
    const [fileName, setFileName] = useState("No file selected");

    const handleUseGeneratedAudioToScriptQuestion = async (generatedQuestion) => {
        setScript(generatedQuestion.script || "");
        if (generatedQuestion.audioFile) {
            const file = base64ToFile(generatedQuestion.audioFile.data, generatedQuestion.audioFile.name, generatedQuestion.audioFile.type);
            setAudioFile(file);
            setFileName(file.name);
        }
        toast.success("Audio to Script question data populated from AI!");
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioFile(file);
            setFileName(file.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!script) {
            toast.error("Please provide a script");
            return;
        }
        if (!audioFile) {
            toast.error("Please select an audio file");
            return;
        }
        if (!marks) {
            toast.error("Please provide marks");
            return;
        }

        const formData = new FormData();
        formData.append("script", script);
        formData.append("audiotoScript", audioFile);
        formData.append("quiz_id", quizId);
        formData.append("created_by", createdBy);
        formData.append("marks", marks); // Append marks to formData

        try {
            const res = await createQuestion({
                formData,
                access_token: access_token,
            }).unwrap();

            toast.success(res.message || "Audio uploaded successfully", {
                icon: "🎧",
                duration: 3000
            });
            setScript("");
            setAudioFile(null);
            setMarks(""); // Reset marks
            setFileName("No file selected");
            onClose();
        } catch (err) {
            console.error(err);
            const errorMessage = err?.data?.errors ||
                err?.data?.message ||
                err?.error ||
                err?.message ||
                'Failed to create question';
            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <PermissionWrapper section="Audio To Script Question" action="create">
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-lg w-[90%] max-w-lg shadow-xl transform transition-all duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
                            <Headphones size={24} className="text-purple-600" />
                            Upload Audio to Script
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-red-500 transition-colors duration-300"
                            disabled={isLoading}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="mb-5 pb-5 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm uppercase tracking-wide text-gray-600 font-medium">
                                AI Assistant
                            </h4>
                        </div>
                        <AIContentGenerator
                            contentType="audio-script"
                            onUseGenerated={handleUseGeneratedAudioToScriptQuestion}
                            buttonText="Generate Script with AI"
                            modalTitle="Generate Audio to Script Questions with AI"
                            placeholderText="Describe what kind of audio to script questions you want to create. For example: 'Create listening comprehension scripts about business conversations' or 'Generate scripts for language learning exercises'..."
                            requiresPDF={true}
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText size={18} className="text-purple-600" />
                                Script
                            </label>
                            <textarea
                                placeholder="Enter the script text here..."
                                className="w-full border border-purple-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300 resize-none"
                                rows={5}
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileAudio size={18} className="text-purple-600" />
                                Audio File
                            </label>
                            <div className="relative">
                                <div className="mt-1 flex items-center">
                                    <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-purple-300 cursor-pointer hover:border-purple-500 transition-colors duration-300">
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload size={28} className="text-purple-500" />
                                            <p className="mt-2 text-sm text-gray-500">Click to select audio file</p>
                                            <p className="text-xs text-gray-500 mt-1">{fileName}</p>
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="audio/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                Marks
                            </label>
                            <input
                                type="number"
                                placeholder="Enter marks"
                                className="w-full border border-purple-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all duration-300"
                                value={marks}
                                onChange={(e) => setMarks(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PermissionWrapper>
    );
};

export default AudioToScriptModal;
