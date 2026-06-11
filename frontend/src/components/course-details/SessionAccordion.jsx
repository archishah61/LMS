import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ModuleAccordion } from "./ModuleAccordion";
import { formatDuration } from "../../utils/timeFormatting";

export function SessionAccordion({ session, modules, isOpen, onToggle, openModuleId, onModuleToggle }) {
  const sessionName = session?.name || session?.title || `Session ${session?.id}`;
  const totalDuration = session?.totalDuration || 0;
  const moduleCount = modules?.length || 0;

  return (
    <div className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white">
      {/* Session Header */}
      <button
        className={`flex items-center justify-between w-full p-3 lg:p-4 text-left transition-all duration-200 group border-b border-gray-200 ${isOpen ? 'bg-emerald-50' : 'bg-white'}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`session-panel-${session.id}`}
      >
        <div className="flex items-center space-x-3 lg:space-x-4 flex-1 min-w-0">
          {/* Chevron on Left */}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500 flex-shrink-0" />
          )}

          <div className="flex flex-col items-start min-w-0 flex-1">
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-sm lg:text-base text-gray-900 group-hover:text-black transition-colors line-clamp-2 lg:line-clamp-1">
                {sessionName}
              </span>

              {/* Duration on Right - Desktop only */}
              <span className="hidden lg:block text-xs lg:text-sm font-medium text-gray-500 whitespace-nowrap ml-4">
                {moduleCount} modules  • {formatDuration(totalDuration * 60)}
              </span>
            </div>

            {/* Mobile/Tablet Stats */}
            <div className="flex lg:hidden items-center mt-1 text-xs text-gray-500 space-x-2">
              <span>{moduleCount} modules</span>
              <span>•</span>
              <span>{formatDuration(totalDuration * 60)}</span>
            </div>
          </div>
        </div>
      </button>

      {/* Session Content with Animation */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="bg-white border-t border-indigo-100 overflow-hidden"
            id={`session-panel-${session.id}`}
            role="region"
            aria-label={sessionName}
          >
            {/* Modules List */}
            <div className="divide-y divide-gray-200">
              {modules.map((module, index) => (
                <ModuleAccordion
                  key={module.id}
                  module={module}
                  moduleNumber={index + 1}
                  isOpen={openModuleId === module.id}
                  onToggle={() => onModuleToggle && onModuleToggle(module.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}