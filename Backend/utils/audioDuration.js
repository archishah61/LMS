const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * Extracts audio duration from an audio file URL and returns it in minutes (rounded up)
 * @param {string} audioUrl - The audio file URL (e.g., "/audios/video/file.mp3")
 * @returns {Promise<number>} Duration in minutes (rounded up), or 0 if file not found or error
 */
const getAudioDurationInMinutes = async (audioUrl) => {
  if (!audioUrl) return 0;

  try {
    const relativeAudioPath = audioUrl.replace(/^\/+/, "");
    const absoluteAudioPath = path.join(__dirname, "..", "uploads", ...relativeAudioPath.split("/"));

    return await new Promise((resolve) => {
      ffmpeg.ffprobe(absoluteAudioPath, (error, metadata) => {
        if (error || !metadata?.format?.duration) {
          resolve(0);
          return;
        }

        resolve(Number((Number(metadata.format.duration) / 60).toFixed(2)));
      });
    });
  } catch {
    return 0;
  }
};

module.exports = { getAudioDurationInMinutes };
