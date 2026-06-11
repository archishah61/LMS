import AudioPlayer from "./audioPlayer2";

const QuestionMedia = ({ audioUrl, videoUrl }) => {
  const hasAudio = audioUrl && audioUrl.trim() !== "";
  const hasVideo = videoUrl && videoUrl.trim() !== "";

  if (!hasAudio && !hasVideo) return null;

  return (
    <div className="mb-6 space-y-4">
      {hasAudio && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
          <h4 className="text-blue-700 font-medium mb-2">Listen to the audio:</h4>
          <AudioPlayer
            fileUrl={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${audioUrl}`}
          />
        </div>
      )}

      {hasVideo && (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
          <h4 className="text-slate-700 font-medium mb-2">Watch the video:</h4>
          <video
            controls
            className="w-full max-h-[400px] rounded-lg shadow-md"
          >
            <source
              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${videoUrl}`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default QuestionMedia;