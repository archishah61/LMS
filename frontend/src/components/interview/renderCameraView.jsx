import { motion, AnimatePresence } from "framer-motion";
import { Video, VideoOff, Minimize2, Maximize2, Save } from "lucide-react";
import Tooltip from "./Tooltip";

const renderCameraView = ({ showCameraView, toggleCamera, isCameraExpanded, toggleCameraSize, videoRef, isRecording, stopRecording }) => (
  <>
    <AnimatePresence>
      {showCameraView ? (
        <motion.div
          className={`fixed bottom-20 right-4 md:bottom-24 md:right-8 z-[100] bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 border-2 border-[#00BB6E]/20 ${isCameraExpanded ? 'w-[80vw] h-[60vw] md:w-96 md:h-72' : 'w-36 h-28 md:w-64 md:h-48'}`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-full h-full group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />

            {/* Camera Overlay Controls */}
            <div className="absolute inset-0 bg-[#00BB6E]/5 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 pointer-events-none">
              <div className="flex justify-between items-start pointer-events-auto">
                <div className="px-2 py-1 bg-[#00BB6E]/90 text-white text-[8px] font-black uppercase tracking-widest rounded shadow-sm">
                  Live Preview
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={toggleCameraSize}
                    className="p-1.5 bg-[#00BB6E]/90 backdrop-blur-md rounded-md hover:bg-[#00BB6E] transition-colors text-white"
                  >
                    {isCameraExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className="p-1.5 bg-[#00BB6E]/90 backdrop-blur-md rounded-md hover:bg-[#00BB6E] transition-colors text-white"
                  >
                    <VideoOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center pointer-events-auto">
                {isRecording && (
                  <div className="px-3 py-1 bg-rose-500/90 text-white text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    Recording Session
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="fixed bottom-20 right-4 md:bottom-24 md:right-8 z-[100]">
          <Tooltip text="Activate Camera" position="left">
            <motion.button
              onClick={toggleCamera}
              className="w-14 h-14 bg-[#00BB6E] text-white rounded-md shadow-sm shadow-[#00BB6E]/30 flex items-center justify-center hover:bg-[#00A05E] transition-all active:scale-95 group"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
            >
              <Video className="w-6 h-6 transition-transform group-hover:scale-110" />
            </motion.button>
          </Tooltip>
        </div>
      )}
    </AnimatePresence>
    <style>{`
      .mirror {
        transform: scaleX(-1);
      }
    `}</style>
  </>
);

export default renderCameraView;