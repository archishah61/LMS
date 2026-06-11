import { motion, AnimatePresence } from "framer-motion";
import { Settings, ArrowRight, Loader2, X } from "lucide-react";

const renderSetupModal = ({
  isModalOpen,
  setIsModalOpen,
  categoryInput,
  setCategoryInput,
  roleInput,
  setRoleInput,
  handleStartInterview,
  isGenerating,
}) => (
  <AnimatePresence>
    {isModalOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-[100]"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-lg p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden"
        >
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Configure Session</h2>
            <p className="text-[13px] text-slate-500 font-medium mt-1">Specify your target expertise and role</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Industry / Category</label>
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="e.g., Technical, Marketing, Sales"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Specific Job Role</label>
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="e.g., Software Engineer, Product Manager"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 text-slate-600 text-[13px] font-bold rounded-md bg-slate-50 border"
            >
              Discard
            </button>
            <button
              onClick={handleStartInterview}
              disabled={!categoryInput.trim() || !roleInput.trim() || isGenerating}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-md font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Begin Session
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default renderSetupModal;