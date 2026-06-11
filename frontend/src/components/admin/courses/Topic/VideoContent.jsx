/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useState } from "react";

export default function VideoContent({
  formData,
  handleChange,
  handleFileChange,
}) {
  const [videoPreview, setVideoPreview] = useState(null);
  const [isInternalVideo, setIsInternalVideo] = useState(true); // State to manage internal video selection
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false); // State to manage YouTube video selection

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

  // Util: compute media duration (in mm.ss where ss is seconds) from a File/blob URL using a temporary <video>
  const computeVideoDurationFromUrl = (src) => {
    return new Promise((resolve, reject) => {
      try {
        const el = document.createElement("video");
        el.preload = "metadata";
        const onLoaded = () => {
          const sec = Number.isFinite(el.duration) ? el.duration : 0;
          const minutes = secondsToDecimalMinutes(sec);
          cleanup();
          resolve(minutes);
        };
        const onError = () => {
          cleanup();
          reject(new Error("Failed to load video metadata"));
        };
        const cleanup = () => {
          el.removeEventListener("loadedmetadata", onLoaded);
          el.removeEventListener("error", onError);
          // Must clear src to allow GC
          el.src = "";
        };
        el.addEventListener("loadedmetadata", onLoaded);
        el.addEventListener("error", onError);
        el.src = src;
      } catch (err) {
        reject(err);
      }
    });
  };

  // YouTube helpers
  const extractYouTubeId = (url) => {
    if (!url) return null;
    try {
      const patterns = [
        /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/, // common
      ];
      for (const re of patterns) {
        const m = url.match(re);
        if (m && m[1]) return m[1];
      }
      const u = new URL(url);
      if (u.hostname.includes("youtube.com")) {
        return u.searchParams.get("v");
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadYouTubeIframeAPI = () => {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return;
      }

      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
      };
    });
  };

  const computeYouTubeDuration = async (videoId) => {
    if (!videoId) return null;
    await loadYouTubeIframeAPI();
    // Create offscreen container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.width = "0";
    container.style.height = "0";
    document.body.appendChild(container);

    return new Promise((resolve) => {
      // eslint-disable-next-line no-undef
      const player = new YT.Player(container, {
        height: "0",
        width: "0",
        videoId,
        events: {
          onReady: () => {
            try {
              const dur = player.getDuration();
              const sec = Number.isFinite(dur) ? dur : 0;
              const minutes = secondsToDecimalMinutes(sec);
              player.destroy();
              container.remove();
              resolve(minutes);
            } catch (e) {
              player.destroy();
              container.remove();
              resolve(null);
            }
          },
          onError: () => {
            try { player.destroy(); } catch { }
            container.remove();
            resolve(null);
          },
        },
      });
    });
  };

  useEffect(() => {
    if (formData?.video_type === 'youtube') {
      setIsYouTubeVideo(true);
      setIsInternalVideo(false);
    } else {
      setIsYouTubeVideo(false);
      setIsInternalVideo(true);
    }
  }, [formData?.video_type]);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    handleFileChange(e, "videoFile"); // Call the prop function to update parent state
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      // Auto-calculate duration from selected file
      computeVideoDurationFromUrl(previewUrl)
        .then((mins) => {
          handleChange({ target: { name: "videoDuration", value: mins } });
        })
        .catch(() => {
          // ignore errors; user can still input manually if needed
        });
    }
  };

  const removeVideo = () => {
    setVideoPreview(null);
    // Create a new event-like object to simulate clearing the file input
    const clearEvent = {
      target: {
        files: [],
        value: null,
      },
    };
    handleFileChange(clearEvent, "videoFile");
    // Reset the file input
    document.getElementById("video-upload").value = "";
  };

  const handleVideoTypeChange = (type) => {
    if (type === "internal") {
      setIsInternalVideo(true);
      setIsYouTubeVideo(false);
      // Clear the YouTube link input
      handleChange({ target: { name: "videoUrl", value: "" } });
      // Set the video_type in the parent form
      handleChange({ target: { name: "video_type", value: "internal" } });
      handleChange({ target: { name: "videoDuration", value: 0 } });

    } else if (type === "youtube") {
      setIsInternalVideo(false);
      setIsYouTubeVideo(true);
      // Clear the video preview and file input
      setVideoPreview(null);
      handleFileChange({ target: { files: [], value: null } }, "videoFile");
      document.getElementById("video-upload").value = "";
      // Set the video_type in the parent form
      handleChange({ target: { name: "video_type", value: "youtube" } });
      handleChange({ target: { name: "videoDuration", value: 0 } });
    }
  };

  // When YouTube URL changes, auto-calc duration
  useEffect(() => {
    if (isYouTubeVideo && formData?.videoUrl) {
      const id = extractYouTubeId(formData.videoUrl);
      if (!id) return;
      let cancelled = false;
      computeYouTubeDuration(id).then((mins) => {
        if (!cancelled && mins != null) {
          handleChange({ target: { name: "videoDuration", value: mins } });
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [isYouTubeVideo, formData?.videoUrl]);

  return (
    <div className="space-y-4 md:space-y-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Video Content
      </h2>

      {/* Video Type Selection */}
      <div className="bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Type*
        </label>
        <div className="flex flex-col md:flex-row items-start md:item-center md:space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="internal-video"
              checked={isInternalVideo}
              onChange={() => handleVideoTypeChange("internal")}
              className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
            />
            <label htmlFor="internal-video" className="ml-2 text-sm text-gray-700">
              Internal Video
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="youtube-video"
              checked={isYouTubeVideo}
              onChange={() => handleVideoTypeChange("youtube")}
              className="h-4 w-4 accent-leafGreen text-forestGreen border-gray-300 rounded focus:ring-leafGreen"
            />
            <label htmlFor="youtube-video" className="ml-2 text-sm text-gray-700">
              YouTube Video
            </label>
          </div>
        </div>
      </div>

      {/* Video Upload or YouTube Link */}
      {isInternalVideo && (
        <div className="bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Video File*
          </label>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-lightGreen file:text-forestGreen hover:file:bg-lightGreen"
                required
              />
            </div>

            {videoPreview && (
              <div className="mt-3 flex flex-col items-center">
                <div className="relative w-full max-w-md">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg border border-leafGreen/30 shadow-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                    title="Remove video"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isYouTubeVideo && (
        <>
          <div className="bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              YouTube Video Link*
            </label>
            <input
              type="text"
              name="videoUrl"
              value={formData.videoUrl || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
              placeholder="Enter YouTube video link"
              required
            />
          </div>
          {formData.videoUrl && extractYouTubeId(formData.videoUrl) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Video Preview
              </label>
              <div className="grid grid-cols-1 sm:min-h-[315px]">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(formData.videoUrl)}`}
                  title="YouTube video preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg shadow-md"
                ></iframe>
              </div>
            </div>
          )}
        </>)}

      {/* Video Duration */}
      <div className="bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration (minutes)*
        </label>
        <input
          type="number"
          name="videoDuration"
          min="0"
          step="0.01"
          value={formData.videoDuration}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded focus:ring-leafGreen focus:border-leafGreen"
          placeholder="Auto-filled when video selected; you can adjust"
          required
          disabled
        />
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">clock equivalent</p>
          <p className="font-mono text-xs text-slate-700">
            mm:ss {decimalMinutesToMmSs(formData.videoDuration || 0)} • hh:mm:ss {decimalMinutesToHhMmSs(formData.videoDuration || 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">stored value uses decimal minutes; use hh:mm:ss for readability (hh hours, mm minutes, ss seconds).</p>
        </div>
        <p className="mt-2 text-sm text-gray-500">*This field is disabled because the video duration is auto-captured.</p>
      </div>

    </div>
  );
}