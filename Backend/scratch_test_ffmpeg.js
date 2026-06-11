const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);

const videoPath = path.join(__dirname, 'test_blank_video.mp4');
const duration = 10;

console.log("Starting ffmpeg command to generate test video at:", videoPath);

ffmpeg()
    .input('color=c=black:s=640x360')
    .inputOptions('-f', 'lavfi')
    .input('anullsrc=r=44100:cl=mono')
    .inputOptions('-f', 'lavfi')
    .duration(duration)
    .output(videoPath)
    .on('start', (cmd) => {
        console.log("Spawned FFMPEG with command:", cmd);
    })
    .on('end', () => {
        console.log("FFMPEG completed successfully. File exists:", fs.existsSync(videoPath));
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }
        process.exit(0);
    })
    .on('error', (err) => {
        console.error("FFMPEG Error:", err);
        process.exit(1);
    })
    .run();
