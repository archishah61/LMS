import { useEffect, useState } from "react";
import TextToAudioConverter from "../../AIServices/TextToAudioConverter"; // Import the TextToAudioConverter component
import { Camera, Upload, X } from "lucide-react";

/* eslint-disable react/prop-types */
export default function AudioContent({
  formData,
  handleChange,
  handleFileChange,
}) {
  const [audioPreview, setAudioPreview] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageObjectUrl, setImageObjectUrl] = useState(null);

  const secondsToDecimalMinutes = (seconds) =>
    Number((Math.max(0, Number(seconds) || 0) / 60).toFixed(2));

  const decimalMinutesToMmSs = (minutes) => {
    const totalSeconds = Math.round((Number(minutes) || 0) * 60);
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const decimalMinutesToHhMmSs = (minutes) => {
    const totalSeconds = Math.round((Number(minutes) || 0) * 60);
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  useEffect(() => {
    // Clean up previous object URL to prevent memory leaks
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    if (formData.audioFile instanceof File) {
      const previewUrl = URL.createObjectURL(formData.audioFile);
      setAudioPreview(previewUrl);
      setObjectUrl(previewUrl);
      // Auto compute duration using a temporary audio element
      const el = document.createElement('audio');
      el.preload = 'metadata';
      el.src = previewUrl;
      const onLoaded = () => {
        const sec = Number.isFinite(el.duration) ? el.duration : 0;
        const minutes = secondsToDecimalMinutes(sec);
        handleChange({ target: { name: 'audioDuration', value: minutes } });
        cleanup();
      };
      const onError = () => cleanup();
      const cleanup = () => {
        el.removeEventListener('loadedmetadata', onLoaded);
        el.removeEventListener('error', onError);
        el.src = '';
      };
      el.addEventListener('loadedmetadata', onLoaded);
      el.addEventListener('error', onError);
    } else if (typeof formData.audioFile === 'string' && formData.audioFile) {
      setAudioPreview(formData.audioFile);
      // Try to compute duration from remote URL as well
      const el = document.createElement('audio');
      el.preload = 'metadata';
      el.src = formData.audioFile;
      const onLoaded = () => {
        const sec = Number.isFinite(el.duration) ? el.duration : 0;
        const minutes = secondsToDecimalMinutes(sec);
        handleChange({ target: { name: 'audioDuration', value: minutes } });
        cleanup();
      };
      const onError = () => cleanup();
      const cleanup = () => {
        el.removeEventListener('loadedmetadata', onLoaded);
        el.removeEventListener('error', onError);
        el.src = '';
      };
      el.addEventListener('loadedmetadata', onLoaded);
      el.addEventListener('error', onError);
    } else {
      setAudioPreview(null);
    }

    // Cleanup on unmount
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [formData.audioFile]);

  // In the useEffect, add similar logic for imageFile:
  useEffect(() => {

    if (imageObjectUrl) {
      URL.revokeObjectURL(imageObjectUrl);
      setImageObjectUrl(null);
    }

    // Add image file preview logic
    if (formData.audioImageFile instanceof File) {
      const previewUrl = URL.createObjectURL(formData.audioImageFile);
      setImagePreview(previewUrl);
      setImageObjectUrl(previewUrl);
    } else if (typeof formData.audioImageFile === 'string' && formData.audioImageFile) {
      setImagePreview(formData.audioImageFile);
    } else {
      setImagePreview(null);
    }

    // Cleanup on unmount - update to include imageObjectUrl
    return () => {
      if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
    };
  }, [formData.audioImageFile]); // Add formData.audioImageFile dependency


  return (
    <div className="space-y-4 md:space-y-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Audio Content
      </h2>

      <div className="relative group">
        {/* Image Preview or Upload Box */}
        <div className="bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="audioImageFile">
            Audio Image Preview (optional)
          </label>
          {imagePreview ? (
            <div className="relative w-full h-64 border-2 border-gray-300 rounded-lg overflow-hidden hover:border-gray-400 transition-colors flex items-center justify-center bg-white">
              {/* Preview Image */}
              <img
                src={
                  imagePreview
                }
                alt="Audio Image preview"
                className="max-w-full max-h-full object-contain"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-4">
                {/* Change Image */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <input
                    id="audioImageFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "audioImageFile")}
                    className="hidden"
                  />
                  <label
                    htmlFor="audioImageFile"
                    className="cursor-pointer bg-black bg-opacity-70 text-white p-3 rounded-full shadow-lg hover:bg-opacity-80 transition-all duration-200 flex items-center justify-center"
                  >
                    <Camera className="h-6 w-6" />
                  </label>
                </div>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 flex items-center justify-center"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                id="audioImageFile"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "audioImageFile")}
                className="hidden"
              />
              <label htmlFor="audioImageFile" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload audio image</p>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Audio Upload/Text-to-Speech Section - Using TextToAudioConverter */}
      <TextToAudioConverter
        handleFileChange={handleFileChange}
        audioPreview={audioPreview}
        setAudioPreview={setAudioPreview}
        fieldName="audioFile" // Pass the correct field name for AudioContent
        isExistingFile={audioPreview !== null}
        existingFileUrl={typeof formData.audioFile === 'string' ? formData.audioFile : null}
      />

      {/* Audio Duration */}
      <div className="bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes)*
        </label>
        <input
          type="number"
          name="audioDuration"
          min="0"
          step="0.01"
          value={formData.audioDuration}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
          placeholder="Auto-filled when audio is selected or generated; you can adjust"
          required
          disabled
        />
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
          <p className="font-mono text-xs text-slate-700">
            mm:ss {decimalMinutesToMmSs(formData.audioDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(formData.audioDuration || 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">stored value uses decimal minutes; use hh:mm:ss for readability (hh hours, mm minutes, ss seconds).</p>
        </div>
        <p className="mt-2 text-sm text-gray-500">*This field is disabled because the audio duration is auto-captured.</p>
      </div>
    </div>
  );
}
