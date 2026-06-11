// const fs = require('fs');
// const path = require('path');
// const { exec } = require('child_process');
// const ffmpeg = require('@ffmpeg-installer/ffmpeg');
// const wav = require('wav');
// const { GoogleGenAI } = require('@google/genai');

// const uploadsDir = path.resolve(__dirname, '../../uploads/text-to-speech');
// const audioDir = path.resolve(__dirname, '../../uploads/audio');

// // Ensure necessary directories exist
// if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
// if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

// async function saveWaveFile(filename, pcmData, channels = 1, rate = 24000, sampleWidth = 2) {
//     return new Promise((resolve, reject) => {
//         const writer = new wav.FileWriter(filename, {
//             channels,
//             sampleRate: rate,
//             bitDepth: sampleWidth * 8,
//         });

//         writer.on('finish', resolve);
//         writer.on('error', reject);
//         writer.write(pcmData);
//         writer.end();
//     });
// }

// // Helper function to add delay between API calls
// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// // 🧠 Generate audio using Gemini TTS
// const generateAudioFile = async (text) => {
//     const timestamp = Date.now();
//     const wavFile = path.join(uploadsDir, `temp_${timestamp}.wav`);
//     const mp3File = path.join(uploadsDir, `speech_${timestamp}.mp3`);
//     const finalFileName = `audio_${timestamp}.mp3`;
//     const finalPath = path.join(audioDir, finalFileName);
//     const publicPath = `/uploads/audio/${finalFileName}`;

//     const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash-preview-tts",
//         contents: [{ parts: [{ text }] }],
//         config: {
//             responseModalities: ['AUDIO'],
//             speechConfig: {
//                 voiceConfig: {
//                     prebuiltVoiceConfig: { voiceName: 'Kore' }, // or any other supported voice
//                 },
//             },
//         },
//     });

//     const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
//     if (!data) throw new Error("No audio data returned from Gemini.");

//     const audioBuffer = Buffer.from(data, 'base64');
//     await saveWaveFile(wavFile, audioBuffer);

//     await delay(7000);

//     // Convert WAV to MP3
//     return new Promise((resolve, reject) => {
//         exec(`"${ffmpeg.path}" -y -i "${wavFile}" "${mp3File}"`, (err) => {
//             if (fs.existsSync(wavFile)) fs.unlinkSync(wavFile);
//             if (err) return reject(err);

//             fs.rename(mp3File, finalPath, (err) => {
//                 if (err) return reject(err);
//                 resolve({
//                     fileName: finalFileName,
//                     filePath: publicPath,
//                     fullPath: finalPath,
//                 });
//             });
//         });
//     });
// };

// --------------------------------------------------------------------------------------------------------

// const say = require('say');
// const fs = require('fs');
// const { exec } = require('child_process');
// const ffmpeg = require('@ffmpeg-installer/ffmpeg');
// const path = require('path');

// const uploadsDir = path.resolve(__dirname, '../../uploads/text-to-speech');
// const audioDir = path.resolve(__dirname, '../../uploads/audio');

// // Ensure necessary directories exist
// if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
// if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

// // Helper function to generate audio file from text
// const generateAudioFile = async (text) => {
//     return new Promise((resolve, reject) => {
//         const timestamp = Date.now();
//         const wavFile = path.join(uploadsDir, `temp_${timestamp}.wav`);
//         const mp3File = path.join(uploadsDir, `speech_${timestamp}.mp3`);
//         const finalFileName = `audio_${timestamp}.mp3`;
//         const finalPath = path.join(audioDir, finalFileName);
//         const publicPath = `/uploads/audio/${finalFileName}`;

//         // Speak and export to WAV
//         say.export(text, null, 1.0, wavFile, (err) => {
//             if (err) return reject(err);

//             // Convert WAV to MP3
//             exec(`"${ffmpeg.path}" -y -i "${wavFile}" "${mp3File}"`, (err) => {
//                 if (err) {
//                     if (fs.existsSync(wavFile)) fs.unlinkSync(wavFile);
//                     return reject(err);
//                 }

//                 // Move MP3 to permanent location
//                 fs.rename(mp3File, finalPath, (err) => {
//                     if (err) return reject(err);
//                     if (fs.existsSync(wavFile)) fs.unlinkSync(wavFile);

//                     resolve({
//                         fileName: finalFileName,
//                         filePath: publicPath,
//                         fullPath: finalPath,
//                     });
//                 });
//             });
//         });
//     });
// };

// // Express API handler
// const textToSpeech = async (req, res, next) => {
//     const { text } = req.body;

//     if (!text || typeof text !== 'string' || !text.trim()) {
//         return res.status(400).json({ error: 'Text is required' });
//     }

//     try {
//         const { fileName, filePath, fullPath } = await generateAudioFile(text);

//         // Send the audio file
//         fs.readFile(fullPath, (err, data) => {
//             if (err) {
//                 console.error('File read error:', err);
//                 return next(err);
//             }

//             res.set({
//                 "Content-Type": "audio/mpeg",
//                 "Content-Disposition": `attachment; filename="${fileName}"`,
//             });

//             res.send(data);
//         });
//     } catch (error) {
//         console.error('Text-to-Speech Error:', error);
//         next(error);
//     }
// };

// module.exports = {
//     textToSpeech,
//     generateAudioFile,
// };

// --------------------------------------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const gTTS = require('gtts');
const dns = require('dns');

const uploadsDir = path.resolve(__dirname, '../../uploads/text-to-speech');
const audioDir = path.resolve(__dirname, '../../uploads/audio');

// Ensure necessary directories exist
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

const isOnline = async () => new Promise((resolve) => dns.lookup('google.com', (err) => resolve(!err)));

// Helper function to generate audio file from text
const generateAudioFile = async (text) => {
    try {
        if (!(await isOnline())) {
            throw new Error('Internet connection required for text-to-speech.');
        }

        const timestamp = Date.now();
        const finalFileName = `audio_${timestamp}.mp3`;
        const finalPath = path.join(audioDir, finalFileName);
        const publicPath = `/uploads/audio/${finalFileName}`;

        const gtts = new gTTS(text, 'en'); // 'en' = English (you can change language)

        // Wrap gtts.save in a Promise
        return await new Promise((resolve, reject) => {
            gtts.save(finalPath, (err) => {
                if (err) {
                    console.error("GTTS error:", err.message);
                    // Don’t crash, just reject gracefully
                    return reject(new Error("Failed to generate audio due to network issue."));
                }

                resolve({
                    fileName: finalFileName,
                    filePath: publicPath,
                    fullPath: finalPath,
                });
            });
        });
    } catch (error) {
        console.error("Error generating audio file:", error);
        return { error };
    }
};

// Express API handler
const textToSpeech = async (req, res, next) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const result = await generateAudioFile(text);

        if (result.error) return next(result.error);

        // Send the audio file
        fs.readFile(result.fullPath, (err, data) => {
            if (err) {
                console.error('File read error:', err);
                return next(err);
            }

            res.set({
                "Content-Type": "audio/mpeg",
                "Content-Disposition": `attachment; filename="${result.fileName}"`,
            });

            res.send(data);
        });
    } catch (error) {
        console.error('Text-to-Speech Error:', error);
        next(error);
    }
};

module.exports = {
    textToSpeech,
    generateAudioFile,
};
