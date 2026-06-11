import { motion, AnimatePresence } from "framer-motion";
import { SearchX } from "lucide-react";

const renderNotFoundModal = ({ isOpen, onClose }) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="bg-white rounded-lg p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl border border-slate-100"
                >
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-6 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                        <SearchX className="w-8 h-8 text-amber-500" />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        No Results Found
                    </h2>

                    {/* Message */}
                    <p className="text-sm text-slate-500 mb-8 font-medium px-4 leading-relaxed">
                        Sorry, we couldn’t find any interview content for the selected
                        category or role. Try adjusting your inputs and search again.
                    </p>

                    {/* Button */}
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-slate-900 text-white rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        Try Again
                    </button>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default renderNotFoundModal;