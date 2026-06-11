// import { useState } from 'react';
// import { BookOpen, Clock, PlayCircle, X } from 'lucide-react';
// import { useGetModulesByCourseIdQuery } from '../../../services/Course_Management/moduleApi';
// import { getStudentToken } from '../../../services/CookieService';
// import { useGetSessionsByCourseIdQuery } from '../../../services/Course_Management/sessionApi';
// import { useGetTopicsByModuleIdQuery } from '../../../services/Course_Management/topicApi';
// import { SessionAccordion2 } from '../../course-details/SessionAccordion2';
// import { useGetCourseCompletionProgressQuery } from '../../../services/progressTracking/newProgressTrackingApi';

// export default function MyLearningSidebar({
//     courseId,
//     userId,
//     courseIdIndx,
//     user_hash,
//     courseTitle,
//     isCourseTracking = false
// }) {
//     const [isOpen, setIsOpen] = useState(false);
//     const [openSessionId, setOpenSessionId] = useState(null);
//     const [openModuleBySession, setOpenModuleBySession] = useState({});
//     const { access_token } = getStudentToken();
//     const { data: sessionData } = useGetSessionsByCourseIdQuery({
//         courseId,
//         access_token,
//     });

//     const { data: courseFullData } = useGetCourseCompletionProgressQuery({
//         courseId,
//         userId,
//     });

//     console.log("courseFullData", courseFullData);

//     const { data: moduleData } = useGetModulesByCourseIdQuery({
//         id: courseId,
//         access_token,
//     });

//     // Get active session IDs
//     const activeSessionIds = sessionData?.sessions?.filter((s) => s.status === "active").map((s) => s.id) || [];

//     // Filter modules by active sessions
//     const filteredModules = moduleData?.modules?.filter((mod) => activeSessionIds.includes(mod.session_id)) || [];

//     // Group modules by session
//     const groupModulesBySession = () => {
//         const sessionsMap = new Map();
//         filteredModules.forEach((module) => {
//             const sessionId = module.session_id;
//             if (!sessionsMap.has(sessionId)) {
//                 const session = sessionData?.sessions?.find((s) => s.id === sessionId);
//                 const sessionName = session?.name || session?.title || `Session ${sessionId}`;
//                 sessionsMap.set(sessionId, {
//                     session: { id: sessionId, name: sessionName, totalDuration: session?.min_time_in_minute || 0 },
//                     modules: [],
//                 });
//             }
//             sessionsMap.get(sessionId).modules.push(module);
//         });
//         return Array.from(sessionsMap.values());
//     };

//     const groupedSessions = groupModulesBySession();

//     return (
//         <div className="inline-block">
//             {/* Inline Trigger Button - Matching the other button styles */}
//             <button
//                 onClick={() => setIsOpen(true)}
//                 className="flex-1 sm:flex-none px-3 py-2.5 text-sm bg-white border border-indigo-600 text-indigo-600 font-medium rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-indigo-50 min-h-[44px] sm:min-h-0"
//             >
//                 <BookOpen className="w-4 h-4 flex-shrink-0" />
//                 <span className="whitespace-nowrap truncate">My Learning</span>
//             </button>

//             {/* Full-Height Right Sidebar */}
//             {isOpen && (
//                 <>
//                     <div className="fixed inset-y-0 right-0 z-50 w-full max-w-96 bg-white shadow-2xl flex flex-col">
//                         {/* Header */}
//                         <div className="flex items-center justify-between p-4 sm:p-6 border-b">
//                             <div className="flex items-center gap-3">
//                                 <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
//                                 <h2 className="text-lg sm:text-xl font-semibold">My Learning</h2>
//                             </div>
//                             <button
//                                 onClick={() => setIsOpen(false)}
//                                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//                                 aria-label="Close sidebar"
//                             >
//                                 <X className="w-5 h-5" />
//                             </button>
//                         </div>

//                         {/* Course List and Nested Accordion */}
//                         <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
//                             {groupedSessions.map(({ session, modules }) => (
//                                 <SessionAccordion2
//                                     key={session.id}
//                                     session={session}
//                                     modules={modules}
//                                     isOpen={openSessionId === session.id}
//                                     onToggle={() =>
//                                         setOpenSessionId((prev) => (prev === session.id ? null : session.id))
//                                     }
//                                     openModuleId={openModuleBySession[session.id] || null}
//                                     onModuleToggle={(moduleId) =>
//                                         setOpenModuleBySession((prev) => ({
//                                             ...prev,
//                                             [session.id]: prev[session.id] === moduleId ? null : moduleId,
//                                         }))
//                                     }
//                                     userId={userId}
//                                     access_token={access_token}
//                                     courseId={courseId}
//                                     courseIdIndx={courseIdIndx}
//                                     courseTitle={courseTitle}
//                                     user_hash={user_hash}
//                                     isCourseTracking={isCourseTracking}
//                                 />
//                             ))}
//                         </div>

//                     </div>

//                     {/* Backdrop */}
//                     <div
//                         className="fixed inset-0 bg-black bg-opacity-50 z-40"
//                         onClick={() => setIsOpen(false)}
//                     />
//                 </>
//             )}
//         </div>
//     );
// }


import { useState } from 'react';
import { BookOpen, Clock, PlayCircle, X } from 'lucide-react';
import { useGetModulesByCourseIdQuery } from '../../../services/Course_Management/moduleApi';
import { getStudentToken } from '../../../services/CookieService';
import { useGetSessionsByCourseIdQuery } from '../../../services/Course_Management/sessionApi';
import { useGetTopicsByModuleIdQuery } from '../../../services/Course_Management/topicApi';
import { SessionAccordion2 } from '../../course-details/SessionAccordion2';
import { useGetAccessibleSessionsQuery, useGetCourseCompletionProgressQuery } from '../../../services/progressTracking/newProgressTrackingApi';

export default function MyLearningSidebar({
    courseId,
    userId,
    courseIdIndx,
    user_hash,
    courseTitle,
    isCourseTracking = false,
    customTrigger
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [openSessionId, setOpenSessionId] = useState(null);
    const [openModuleBySession, setOpenModuleBySession] = useState({});
    const { access_token } = getStudentToken();
    const { data: sessionData } = useGetSessionsByCourseIdQuery({
        courseId,
        access_token,
    });

    const { data: courseFullData } = useGetCourseCompletionProgressQuery({
        courseId,
        userId,
    });

    // Fetch accessibility data
    const { data: sessionsAccessData } = useGetAccessibleSessionsQuery({
        userId: Number(userId),
        courseId: Number(courseIdIndx),
        access_token,
    });

    const { data: moduleData } = useGetModulesByCourseIdQuery({
        id: courseId,
        access_token,
    });

    // Group all modules by session (no filtering)
    const groupModulesBySession = () => {
        const sessionsMap = new Map();
        moduleData?.modules?.forEach((module) => {
            const sessionId = module.session_id;
            if (!sessionsMap.has(sessionId)) {
                const session = sessionData?.sessions?.find((s) => s.id === sessionId);
                if (session) {
                    const sessionName = session?.name || session?.title || `Session ${sessionId}`;
                    sessionsMap.set(sessionId, {
                        session: { id: sessionId, name: sessionName, totalDuration: session?.min_time_in_minute || 0 },
                        modules: [],
                    });
                }
            }
            if (sessionsMap.has(sessionId)) {
                sessionsMap.get(sessionId).modules.push(module);
            }
        });
        return Array.from(sessionsMap.values());
    };

    const groupedSessions = groupModulesBySession();

    return (
        <div className="inline-block">
            {customTrigger ? (
                <div onClick={() => setIsOpen(true)} className="cursor-pointer">
                    {customTrigger}
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex-1 w-full px-3 py-2.5 text-sm bg-white border border-leafGreen/30 text-leafGreen font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:bg-lightGreen/20 hover:border-leafGreen/50 shadow-sm hover:shadow-md min-h-[44px] sm:min-h-0 active:scale-95"
                >
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap truncate uppercase tracking-wide">My Learning</span>
                </button>
            )}

            {/* Full-Height Right Sidebar */}
            {isOpen && (
                <>
                    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-96 bg-white shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-lightGreen/10 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-leafGreen rounded-lg shadow-sm">
                                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-forestGreen tracking-tight">My Learning</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Close sidebar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Course List and Nested Accordion */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                            {sessionsAccessData?.sessions?.map((session) => (
                                <SessionAccordion2
                                    key={session.id}
                                    session={session}
                                    // modules={modules}
                                    isOpen={openSessionId === session.id}
                                    onToggle={() =>
                                        setOpenSessionId((prev) => (prev === session.id ? null : session.id))
                                    }
                                    openModuleId={openModuleBySession[session.id] || null}
                                    onModuleToggle={(moduleId) =>
                                        setOpenModuleBySession((prev) => ({
                                            ...prev,
                                            [session.id]: prev[session.id] === moduleId ? null : moduleId,
                                        }))
                                    }
                                    userId={userId}
                                    access_token={access_token}
                                    courseId={courseId}
                                    courseIdIndx={courseIdIndx}
                                    courseTitle={courseTitle}
                                    user_hash={user_hash}
                                    isCourseTracking={isCourseTracking}
                                />
                            ))}
                        </div>

                    </div>

                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />
                </>
            )}
        </div>
    );
}