import React, { useState } from "react";
import {
  Mic,
  FileAudio,
  Type,
  Loader2,
  Volume2,
  X,
  Play,
  Pause,
} from "lucide-react";
import axios from "axios";

const TextToAudioConverter = ({
  handleFileChange,
  audioPreview,
  setAudioPreview,
  fieldName = "generalAudioFile", // Add fieldName prop with default value
  isExistingFile = false, // New prop to check if current audio is from database
  existingFileUrl = null, // New prop for existing file URL
  keyId = null
}) => {
  const [audioInputType, setAudioInputType] = useState("upload"); // 'upload' or 'text-to-speech'
  const [textInput, setTextInput] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);
  const [conversionError, setConversionError] = useState("");


  // Generate unique IDs based on fieldName to avoid conflicts
  const uploadId = keyId || `${fieldName}-upload`;

  // Handle audio file upload
  const handleAudioChange = (e) => {
    const file = e.target.files[0];

    if (file && !file.type.startsWith("audio/")) {
      alert("Please upload a valid audio file.");
      e.target.value = "";
      return;
    }

    handleFileChange(e, fieldName); // Use the fieldName prop

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAudioPreview(previewUrl);
    }
  };

  // Handle text-to-speech conversion
  const handleTextToSpeech = async () => {
    if (!textInput.trim()) {
      alert("Please enter some text to convert to audio.");
      return;
    }

    setIsConverting(true);
    setConversionError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/text-to-speech`,
        { text: textInput },
        { responseType: "blob" } // Important to get audio blob
      );

      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create a File object from the blob
      const audioFile = new File([audioBlob], "generated-audio.mp3", {
        type: "audio/mpeg",
      });

      // Simulate file input event for handleFileChange
      const mockEvent = {
        target: {
          files: [audioFile],
        },
      };

      handleFileChange(mockEvent, fieldName); // Use the fieldName prop
      setAudioPreview(audioUrl);
    } catch (error) {
      console.error("Error converting text to speech:", error);
      setConversionError("Failed to convert text to audio. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  // Remove audio file
  const removeFile = () => {
    const clearEvent = {
      target: {
        files: [],
        value: null,
      },
    };

    setAudioPreview(null);
    handleFileChange(clearEvent, fieldName); // Use the fieldName prop

    // Reset text input if it was generated from text
    if (audioInputType === "text-to-speech") {
      setTextInput("");
    }

    // Reset file input
    const fileInput = document.getElementById(uploadId);
    if (fileInput) fileInput.value = "";
  };

  // Handle audio play/pause
  const togglePlayback = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Determine if we should show the remove button
  const shouldShowRemoveButton =
    !isExistingFile || (isExistingFile && audioPreview !== existingFileUrl);

  return (
    <div className="bg-gray-50 p-4 md:p-6 rounded-lg border border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Audio File*
      </label>

      {/* Audio Input Type Selection */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-x-4 md:space-y-0">
          <button
            type="button"
            onClick={() => setAudioInputType("upload")}
            className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${audioInputType === "upload"
              ? "border-leafGreen bg-green-100 text-primary"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
          >
            <FileAudio className="w-5 h-5 mr-2" />
            Upload Audio File
          </button>

          <button
            type="button"
            onClick={() => setAudioInputType("text-to-speech")}
            className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${audioInputType === "text-to-speech"
              ? "border-leafGreen bg-green-100 text-primary"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
          >
            <Type className="w-5 h-5 mr-2" />
            Text to Speech
          </button>
        </div>
      </div>

      {/* Audio Upload Section */}
      {audioInputType === "upload" && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
            <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <label htmlFor={uploadId} className="cursor-pointer">
              <span className="text-gray-600 font-medium">
                {isExistingFile
                  ? "Click to upload new audio file"
                  : "Click to upload audio file"}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                MP3, WAV, OGG files supported
              </p>
            </label>
            <input
              id={uploadId}
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className="sr-only"
              required={!isExistingFile}
              name="audioFile"
            />
          </div>
        </div>
      )}

      {/* Text to Speech Section */}
      {audioInputType === "text-to-speech" && (
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter the text you want to convert to audio..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen resize-none transition-colors"
              rows={6}
              disabled={isConverting}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              {textInput.length} characters
            </div>
          </div>

          {conversionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {conversionError}
            </div>
          )}

          <button
            type="button"
            onClick={handleTextToSpeech}
            disabled={!textInput.trim() || isConverting}
            className="w-full flex items-center justify-center p-3 bg-leafGreen text-white rounded-lg hover:bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Converting to Audio...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 mr-2" />
                Convert to Audio
              </>
            )}
          </button>
        </div>
      )}

      {/* Audio Preview Section */}
      {audioPreview && (
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700">
              {isExistingFile && audioPreview === existingFileUrl
                ? "Current Audio"
                : "Audio Preview"}
            </h4>
            {shouldShowRemoveButton && (
              <button
                type="button"
                onClick={removeFile}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Remove audio"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="relative">
            <audio
              ref={setAudioRef}
              src={audioPreview}
              controls
              className="w-full rounded-lg"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Custom Play/Pause Button Overlay (Optional) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="bg-black bg-opacity-20 rounded-full p-3 opacity-0 hover:opacity-100 transition-opacity pointer-events-auto cursor-pointer"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToAudioConverter;
