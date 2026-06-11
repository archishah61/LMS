import { useEffect } from "react"
import { X } from "lucide-react"

const Modal = ({ isOpen, onClose, title, children }) => {

  // ⬇︎ 1. lock / unlock the page scroll
  useEffect(() => {
    if (isOpen) {
      // save any previous inline style so we can restore it
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"

      // restore on cleanup
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose} // ← close when clicking outside
    >
      <div
        className="bg-white rounded-xl w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()} // ← prevent close when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {children}
        </div>

        <style>{`
      .custom-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .custom-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
      </div>
    </div>
  )
}

export default Modal
