import { useState, useCallback, useRef } from 'react';

const useScreenRecorder = () => {
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startScreenRecording = useCallback(async (cameraStream) => {
    try {
      // Get screen capture stream with specific constraints for entire screen
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor", // Capture entire screen
          width: { ideal: 1920 },    // Full HD resolution
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Combine screen and camera streams
      const combinedStream = new MediaStream();
      
      // Add screen tracks
      screenStream.getTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      // Add camera tracks if available
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      }

      // Create MediaRecorder with high quality settings
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        setIsScreenRecording(false);
        
        // Stop all tracks
        screenStream.getTracks().forEach(track => track.stop());
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
        }
      };

      // Request data every second
      mediaRecorder.start(1000);
      setIsScreenRecording(true);

      // Handle when user stops sharing screen
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenRecording();
      };

    } catch (error) {
      console.error('Error starting screen recording:', error);
      setIsScreenRecording(false);
    }
  }, []);

  const stopScreenRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    isScreenRecording,
    recordedBlob,
    startScreenRecording,
    stopScreenRecording,
    setRecordedBlob ,
  };
};

export default useScreenRecorder; 