import { motion, AnimatePresence } from "framer-motion";
import { Video, AlertCircle, ShieldAlert, X, CheckCircle2, Monitor } from "lucide-react";

export default function RecordingInstructionsModal({ open, onClose }) {
  const scrollClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`bg-white rounded-lg shadow-xl border border-slate-100 w-full max-w-2xl relative flex flex-col max-h-[90vh] overflow-hidden`}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-none">Session Guidelines</h2>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Important Requirements</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-50 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className={`flex-1 overflow-y-auto p-6 md:p-8 ${scrollClass}`}>

              {/* Integrity Section */}
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1.5 h-4 bg-primary rounded-full" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Academic Integrity</h3>
                </div>

                <div className="space-y-4">
                  {[
                    "Do not switch between tabs or navigate away from this page.",
                    "The system monitors activity; tab switches trigger automatic failure.",
                    "Ensure this window remains active throughout the session."
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="mt-1 flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[13px] md:text-sm text-slate-600 font-medium leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 bg-rose-50/50 border border-rose-100 rounded-md shadow-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-900 uppercase tracking-tight">Focus Requirement</p>
                    <p className="text-[12px] text-rose-800 font-semibold leading-relaxed mt-0.5">
                      Any navigation attempt will lead to an immediate session termination and zero score.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recording Section */}
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1.5 h-4 bg-primary rounded-full" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Recording Procedures</h3>
                </div>

                <div className="space-y-4">
                  {[
                    "Grant permission to activate your camera and microphone.",
                    "Select 'Entire Screen' mode to ensure a valid session recording.",
                    "Your session is stored locally for immediate review after completion."
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="mt-1 flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[13px] md:text-sm text-slate-600 font-medium leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 bg-primary/5 border border-primary/10 rounded-md shadow-sm flex items-start gap-3">
                  <Monitor className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-tight">Display Setting</p>
                    <p className="text-[12px] text-primary/80 font-semibold leading-relaxed mt-0.5">
                      Camera must remain active. Closing the video feed will prevent session authentication.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-md shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                I Understand
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}