import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Clock, Play, Volume2, List, FileText, Layout, BookOpen } from "lucide-react";
import { useGetTopicsByModuleIdQuery } from "../../services/Course_Management/topicApi";
import { getStudentToken } from "../../services/CookieService";
import { formatDuration } from "../../utils/timeFormatting";

export function ModuleAccordion({ module, moduleNumber, isOpen, onToggle }) {
  const { access_token } = getStudentToken();
  const { data: topics, isLoading, isError } = useGetTopicsByModuleIdQuery({
    id: module.public_hash,
    access_token,
  });

  if (module.status !== "active") return null;

  const activeTopics = topics?.filter(topic => topic.status === "active") || [];

  return (
    <div className="bg-white border-b border-gray-200 last:border-b-0">
      {/* Module Header */}
      <button
        className="flex items-center justify-between w-full p-2 sm:p-3 xs:pl-[28px] sm:pl-[28px] lg:pr-4 lg:py-3 lg:pl-[28px] text-left transition-all duration-200 bg-white hover:bg-gray-50"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
          {/* Chevron Left */}
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
          )}

          <div className="flex flex-col items-start min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 w-full">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Module {moduleNumber}:
              </span>
              <span className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                {module.title}
              </span>
            </div>

            {/* Mobile-only duration display (shown below) */}
            <div className="flex items-center mt-0.5 text-[10px] sm:hidden text-gray-500 space-x-1">
              <span>{activeTopics.length} topics</span>
              <span>•</span>
              <span>{formatDuration(module.duration_minutes * 60)}</span>
            </div>
          </div>
        </div>

        {/* Desktop duration display */}
        <div className="hidden sm:flex items-center text-xs text-gray-500 ml-4 flex-shrink-0 whitespace-nowrap">
          <span>{activeTopics.length} topics</span>
          <span className="mx-2">•</span>
          <span className="font-medium">
            {formatDuration(module.duration_minutes * 60)}
          </span>
        </div>
      </button>

      {/* Module Content with Animation */}
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
            className="bg-white border-t border-gray-200 overflow-hidden"
            id={`module-panel-${module.id}`}
            role="region"
            aria-label={module.title}
          >
            {/* Topics List */}
            <div className="divide-y divide-gray-200">
              {isLoading && (
                <div className="p-2 sm:p-3 pl-8 sm:pl-14 lg:pl-[84px] animate-pulse">
                  <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              )}

              {isError && (
                <div className="p-2 sm:p-3 pl-8 sm:pl-14 lg:pl-[84px]">
                  <p className="text-xs text-red-500">Error loading topics.</p>
                </div>
              )}

              {activeTopics.map((topic) => {
                const topicDurationRaw = topic.topic_duration ?? topic.duration_minutes;
                const topicDuration = Number(topicDurationRaw);
                const hasValidDuration = Number.isFinite(topicDuration) && topicDuration > 0;
                const formattedTopicDuration = hasValidDuration
                  ? formatDuration(topicDuration * 60)
                  : null;

                return (
                  <div key={topic.id} className="transition-colors hover:bg-gray-50">
                    <div className="flex items-center justify-between py-2 sm:py-3 pr-2 sm:pr-4 pl-8 sm:pl-[52px] xs:pl-[44px] lg:pl-[58px]">
                      <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
                        {/* Content Icon */}
                        {(() => {
                          const iconProps = { className: "w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" };
                          switch (topic.content_type) {
                            case 'video': return <Play {...iconProps} />;
                            case 'audio': return <Volume2 {...iconProps} />;
                            case 'quiz': return <List {...iconProps} />;
                            case 'accordion': return <Layout {...iconProps} />;
                            case 'slide': return <FileText {...iconProps} />;
                            default: return <BookOpen {...iconProps} />;
                          }
                        })()}
                        <span className="text-xs sm:text-sm text-gray-700 truncate">
                          {topic.title}
                        </span>
                      </div>

                      <div className="flex items-center text-[10px] sm:text-xs text-gray-400 ml-2 sm:ml-4 flex-shrink-0 space-x-2 sm:space-x-3">
                        {/* Topic Type */}
                        {topic.content_type && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium capitalize">
                            {topic.content_type}
                          </span>
                        )}
                        
                        {/* Topic Duration */}
                        {formattedTopicDuration && (
                          <span className="whitespace-nowrap">
                            {formattedTopicDuration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}