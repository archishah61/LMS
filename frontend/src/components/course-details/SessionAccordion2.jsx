import React, { useMemo } from "react";
import { ChevronDown, ChevronUp, Clock, FolderOpen, Lock } from "lucide-react";
import { ModuleAccordion2 } from "./ModuleAccordion2";
import { useGetAccessibleModulesQuery, useGetAccessibleSessionsQuery } from "../../services/progressTracking/newProgressTrackingApi";

export function SessionAccordion2({
  session,
  modules,
  isOpen,
  onToggle,
  openModuleId,
  onModuleToggle,
  userId,
  access_token,
  courseIdIndx,
  courseTitle,
  user_hash,
  isCourseTracking
}) {
  const sessionName = session?.name || session?.title || `Session ${session?.id}`;
  const totalDuration = session?.totalDuration || 0;

  // Fetch accessibility data
  const { data: sessionData } = useGetAccessibleSessionsQuery({
    userId: Number(userId),
    courseId: Number(courseIdIndx),
    access_token,
  });

  // 1. Module accessibility
  const { data: modulesAccessData } = useGetAccessibleModulesQuery(
    {
      userId: Number(userId),
      courseId: Number(courseIdIndx),
      sessionId: Number(session.id),
      access_token,
    },
    { skip: !session.id }
  );

  // Build lookup map: sessionId → isAccessible
  const isAccessibleMap = useMemo(() => {
    const map = new Map();
    if (sessionData?.sessions) {
      sessionData.sessions.forEach((s) => {
        map.set(s.id, s.isAccessible);
      });
    }
    return map;
  }, [sessionData]);

  const isAccessible = isAccessibleMap.get(session.id) ?? true;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Session Header - Always clickable */}
      <button
        className={`
          flex items-center justify-between w-full p-4 text-left
          transition-colors hover:bg-lightGreen/10 cursor-pointer
          ${!isAccessible ? "opacity-75" : ""}
        `}
        onClick={onToggle} // Always allow toggle
        aria-expanded={isOpen}
        aria-controls={`session-panel-${session.id}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-lightGreen text-forestGreen shadow-sm">
            <FolderOpen className="w-4 h-4" />
          </div>

          <span className="font-semibold text-forestGreen truncate max-w-[200px]">{sessionName}</span>

          {/* Lock Icon - Visual indicator only */}
          {!isAccessible && <Lock className="w-4 h-4 ml-2 text-gray-500" title="Not yet unlocked" />}
        </div>

        <div className="flex items-center gap-4 text-sm">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Session Content - Always shown when open */}
      {isOpen && (
        <div
          id={`session-panel-${session.id}`}
          role="region"
          aria-label={sessionName}
          className="border-t border-gray-100"
        >
          <div className="divide-y divide-gray-100">
            {modulesAccessData?.modules?.map((module, index) => (
              <ModuleAccordion2
                key={module.id}
                sessionId={session.id}
                module={module}
                moduleNumber={index + 1}
                isOpen={openModuleId === module.id}
                onToggle={() => onModuleToggle?.(module.id)}
                userId={userId}
                courseIdIndx={courseIdIndx}
                courseTitle={courseTitle}
                user_hash={user_hash}
                session={session}
                // Optionally pass isAccessible down if modules need to be disabled
                isSessionAccessible={isAccessible}
                isCourseTracking={isCourseTracking}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}