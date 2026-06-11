// import React, { useEffect, useMemo } from "react";
// import {
//   ChevronDown,
//   ChevronUp,
//   Clock,
//   Lock,
//   PlayCircle,
// } from "lucide-react";
// import {
//   useGetAccessibleModulesQuery,
//   useGetAccessibleTopicsQuery,
// } from "../../services/progressTracking/newProgressTrackingApi";
// import { getStudentToken } from "../../services/CookieService";
// import { slugify } from "../../utils/slugify";
// import toast from "react-hot-toast";
// import { useNavigate } from "react-router-dom";

// export function ModuleAccordion2({
//   module,
//   moduleNumber,
//   isOpen,
//   onToggle,
//   userId,
//   courseIdIndx,
//   sessionId,
//   courseTitle,
//   user_hash,
//   session,
//   isCourseTracking
// }) {
//   const { access_token } = getStudentToken();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (isOpen) {
//       // Store current scroll position
//       const scrollY = window.scrollY;

//       // Add styles to lock background scroll
//       document.body.style.position = 'fixed';
//       document.body.style.top = `-${scrollY}px`;
//       document.body.style.width = '100%';
//       document.body.style.overflow = 'hidden';
//     } else {
//       // Restore scroll position
//       const scrollY = document.body.style.top;
//       document.body.style.position = '';
//       document.body.style.top = '';
//       document.body.style.width = '';
//       document.body.style.overflow = '';

//       // Restore the scroll position
//       if (scrollY) {
//         window.scrollTo(0, parseInt(scrollY || '0') * -1);
//       }
//     }

//     // Cleanup on unmount
//     return () => {
//       document.body.style.position = '';
//       document.body.style.top = '';
//       document.body.style.width = '';
//       document.body.style.overflow = '';
//     };
//   }, [isOpen]);

//   // 1. Module accessibility
//   const { data: moduleAccessData } = useGetAccessibleModulesQuery(
//     {
//       userId: Number(userId),
//       courseId: Number(courseIdIndx),
//       sessionId: Number(sessionId),
//       access_token,
//     },
//     { skip: !sessionId }
//   );

//   // 2. Topic accessibility
//   const { data: topicAccessData } = useGetAccessibleTopicsQuery(
//     {
//       userId: Number(userId),
//       courseId: Number(courseIdIndx),
//       sessionId: Number(sessionId),
//       moduleId: module.id,
//       access_token,
//     },
//     { skip: !module.id }
//   );

//   // 3. Fast lookup: is this module accessible?
//   const isModuleAccessible = useMemo(() => {
//     if (!moduleAccessData?.modules) return true;
//     const m = moduleAccessData.modules.find((m) => m.id === module.id);
//     return m?.isAccessible ?? true;
//   }, [moduleAccessData, module.id]);

//   // 4. Fast lookup: topicId → isAccessible
//   const topicAccessibleMap = useMemo(() => {
//     const map = new Map();
//     if (topicAccessData?.topics) {
//       topicAccessData.topics.forEach((t) => {
//         map.set(t.id, t.isAccessible);
//       });
//     }
//     return map;
//   }, [topicAccessData]);

//   // 5. Use topics from module (or fallback to accessibility data)
//   const topics = module.topics || topicAccessData?.topics || [];
//   const duration = module.duration_minutes || 0;

//   const handleTopicClick = (topic) => {
//     if (!topicAccessibleMap.get(topic.id)) {
//       console.log("Topic locked, cannot start:", topic.id);
//       return;
//     }

//     if (isCourseTracking) {
//       return;
//     }

//     try {
//       navigate(`/course-content/${slugify(courseTitle)}`, {
//         state: {
//           courseID: user_hash,
//           topicState: topic,
//           sessionState: session,
//           moduleState: module
//         }
//       });
//     } catch (error) {
//       console.error("Error checking access:", error);
//       toast.error("Failed to check course access. Please try again.");
//     }
//   };

//   return (
//     <div className="border-b border-gray-200 last:border-b-0 bg-white hover:bg-gray-50 transition-colors duration-200">
//       {/* MODULE HEADER */}
//       <button
//         className={`
//           flex items-center justify-between w-full p-4 text-left transition-all duration-200 cursor-pointer
//           ${isOpen ? 'bg-gray-50 border-l-4 border-l-indigo-500' : 'hover:bg-gray-50'}
//           lg:pl-6 pl-4
//         `}
//         onClick={onToggle}
//         aria-expanded={isOpen}
//         aria-controls={`module-panel-${module.id}`}
//       >
//         <div className="flex items-center gap-3 flex-1 min-w-0">
//           <div className={`
//             flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold flex-shrink-0
//             ${isModuleAccessible
//               ? 'bg-indigo-100 text-indigo-600'
//               : 'bg-gray-200 text-gray-500'
//             }
//           `}>
//             {moduleNumber}
//           </div>

//           <div className="flex flex-col min-w-0 flex-1">
//             <span className={`
//               font-semibold text-sm truncate max-w-[200px]
//               ${isModuleAccessible ? 'text-gray-900' : 'text-gray-500'}
//             `}>
//               {module.title}
//             </span>
//             <div className="flex items-center gap-2 mt-1">
//               <span className="text-xs text-gray-500">
//                 {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2 flex-shrink-0 ml-2">
//           {/* Lock icon for module */}
//           {!isModuleAccessible && (
//             <Lock className="w-4 h-4 text-gray-400" title="Module locked" />
//           )}

//           {isOpen ? (
//             <ChevronUp className="w-5 h-5 text-gray-500" />
//           ) : (
//             <ChevronDown className="w-5 h-5 text-gray-500" />
//           )}
//         </div>
//       </button>

//       {/* MODULE CONTENT - Now with overflow-y-auto for scrolling */}
//       {isOpen && (
//         <div
//           id={`module-panel-${module.id}`}
//           role="region"
//           aria-label={module.title}
//           className="bg-white border-t border-gray-100 max-h-[60vh] overflow-y-auto"
//         >
//           <div className="py-2">
//             {topics.length === 0 ? (
//               <div className="px-4 py-6 text-center">
//                 <div className="text-gray-400 text-sm">No topics available</div>
//                 <div className="text-gray-400 text-xs mt-1">Check back later for updates</div>
//               </div>
//             ) : (
//               <div className="space-y-1 px-2">
//                 {topics.map((topic, index) => {
//                   const isTopicAccessible = topicAccessibleMap.get(topic.id) ?? true;

//                   return (
//                     <div
//                       key={topic.id}
//                       className={`
//                         group flex items-center gap-3 p-3 rounded-lg transition-all duration-200
//                         ${isTopicAccessible
//                           ? 'hover:bg-indigo-50 cursor-pointer'
//                           : 'opacity-60 cursor-not-allowed'
//                         }
//                       `}
//                       onClick={() => isTopicAccessible && handleTopicClick(topic)}
//                     >
//                       {/* Topic Number with Play Indicator */}
//                       <div className={`
//                         relative flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-colors
//                         ${isTopicAccessible
//                           ? 'bg-gray-100 group-hover:bg-indigo-100 text-gray-600 group-hover:text-indigo-600'
//                           : 'bg-gray-100 text-gray-400'
//                         }
//                       `}>
//                         {isTopicAccessible ? (
//                           <>
//                             <span className="text-xs font-medium group-hover:hidden">
//                               {index + 1}
//                             </span>
//                             <PlayCircle className="w-4 h-4 hidden group-hover:block fill-current" />
//                           </>
//                         ) : (
//                           <>
//                             <span className="text-xs font-medium">
//                               {index + 1}
//                             </span>
//                             <Lock className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />
//                           </>
//                         )}
//                       </div>

//                       {/* Topic Content */}
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-start justify-between gap-2">
//                           <div className="flex-1 min-w-0">
//                             <h3 className={`
//                               text-sm font-medium truncate max-w-[300px]
//                               ${isTopicAccessible
//                                 ? 'text-gray-900 group-hover:text-indigo-700'
//                                 : 'text-gray-500'
//                               }
//                             `}>
//                               {topic.title}
//                             </h3>
//                             <div className="flex items-center gap-2 mt-1 flex-wrap">
//                               {topic.duration_minutes > 0 && (
//                                 <span className={`
//                                   flex items-center text-xs
//                                   ${isTopicAccessible ? 'text-gray-500' : 'text-gray-400'}
//                                 `}>
//                                   <Clock className="w-3 h-3 mr-1" />
//                                   {topic.duration_minutes}m
//                                 </span>
//                               )}
//                             </div>
//                           </div>

//                           {/* Mobile-only play button */}
//                           {isTopicAccessible && (
//                             <button
//                               className="lg:hidden flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors flex-shrink-0"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 handleTopicClick(topic);
//                               }}
//                             >
//                               <PlayCircle className="w-2 h-2 fill-current" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


import React, { useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  PlayCircle,
  FileText,
  BookOpen,
} from "lucide-react";
import {
  useGetAccessibleAssignmentsQuery,
  useGetAccessibleModulesQuery,
  useGetAccessibleQuizzesQuery,
  useGetAccessibleTopicsQuery,
} from "../../services/progressTracking/newProgressTrackingApi";
import { getStudentToken } from "../../services/CookieService";
import { slugify } from "../../utils/slugify";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export function ModuleAccordion2({
  module,
  moduleNumber,
  isOpen,
  onToggle,
  userId,
  courseIdIndx,
  sessionId,
  courseTitle,
  user_hash,
  session,
  isCourseTracking
}) {
  const { access_token } = getStudentToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;

      // Add styles to lock background scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      // Restore the scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 1. Module accessibility
  const { data: moduleAccessData } = useGetAccessibleModulesQuery(
    {
      userId: Number(userId),
      courseId: Number(courseIdIndx),
      sessionId: Number(sessionId),
      access_token,
    },
    { skip: !sessionId }
  );

  // 2. Topic accessibility
  const { data: topicAccessData } = useGetAccessibleTopicsQuery(
    {
      userId: Number(userId),
      courseId: Number(courseIdIndx),
      sessionId: Number(sessionId),
      moduleId: module.id,
      access_token,
    },
    { skip: !module.id }
  );

  const { data: quizData, isLoading: quizLoading, isError: quizError, refetch: refetchQuizData } = useGetAccessibleQuizzesQuery({
    userId: Number(userId),
    courseId: Number(courseIdIndx),
    moduleId: module?.id,
    access_token
  }, {
    skip: !module?.id
  });

  const { data: assignmentData, isLoading: assignmentLoading, isError: assignmentError, refetch: refetchAssignmentData } = useGetAccessibleAssignmentsQuery({
    userId: Number(userId),
    courseId: Number(courseIdIndx),
    moduleId: module?.id,
    access_token
  }, {
    skip: !module?.id
  });

  // 3. Fast lookup: is this module accessible?
  const isModuleAccessible = useMemo(() => {
    if (!moduleAccessData?.modules) return true;
    const m = moduleAccessData.modules.find((m) => m.id === module.id);
    return m?.isAccessible ?? true;
  }, [moduleAccessData, module.id]);

  // 4. Fast lookup: topicId → isAccessible
  const topicAccessibleMap = useMemo(() => {
    const map = new Map();
    if (topicAccessData?.topics) {
      topicAccessData.topics.forEach((t) => {
        map.set(t.id, t.isAccessible);
      });
    }
    return map;
  }, [topicAccessData]);

  // 5. Use topics from accessibility data (assumes it includes all with flags) or fallback
  const topics = topicAccessData?.topics || module.topics || [];
  const duration = module.duration_minutes || 0;

  const handleTopicClick = (topic) => {
    const isTopicAccessible = topicAccessibleMap.get(topic.id) ?? true;
    if (!isTopicAccessible) {
      console.log("Topic locked, cannot start:", topic.id);
      return;
    }

    if (isCourseTracking) {
      return;
    }

    try {
      navigate(`/course-content/${slugify(courseTitle)}`, {
        state: {
          courseID: user_hash,
          topicState: topic,
          sessionState: session,
          moduleState: module
        }
      });
    } catch (error) {
      console.error("Error checking access:", error);
      toast.error("Failed to check course access. Please try again.");
    }
  };

  // Inside your component, add this function to render quizzes/assignments
  const renderTopicActivities = (topic) => {
    const hasQuizzes = topic.quizzes?.length > 0;
    const hasAssignments = topic.assignments?.length > 0;

    if (!hasQuizzes && !hasAssignments) return null;

    console.log("topic ", topic);

    return (
      <div className="ml-11 mt-2 space-y-2">
        {/* Quizzes */}
        {hasQuizzes && topic.quizzes.map((quiz) => (
          <div
            key={`quiz-${quiz.id}`}
            className="flex items-center gap-2 text-xs text-gray-600"
          >
            <BookOpen className="w-3 h-3" />
            <span className="font-medium">Quiz:</span>
            <span className="flex-1 truncate">{quiz.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${quiz.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {quiz.isCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>
        ))}

        {/* Assignments */}
        {hasAssignments && topic.assignments.map((assignment) => (
          <div
            key={`assignment-${assignment.id}`}
            className="flex items-center gap-2 text-xs text-gray-600"
          >
            <FileText className="w-3 h-3" />
            <span className="font-medium">Assignment:</span>
            <span className="flex-1 truncate">{assignment.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${assignment.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {assignment.isCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Then create a function to render module activities (quizzes/assignments)
  const renderModuleActivities = () => {
    const quizzes = quizData?.quizzes || [];
    const assignments = assignmentData?.assignments || [];

    if (quizzes.length === 0 && assignments.length === 0) return null;

    return (
      <div className="space-y-1 px-2 mt-2">
        {/* Module Quizzes */}
        {quizzes.map((quiz) => (
          <div
            key={`module-quiz-${quiz.id}`}
            className={`
            group flex items-center gap-3 p-3 rounded-lg transition-all duration-200
            ${quiz.isAccessible
                ? 'hover:bg-purple-50 cursor-pointer'
                : 'opacity-60 cursor-not-allowed'
              }
          `}
            onClick={() => quiz.isAccessible && handleModuleActivityClick(quiz, 'quiz')}
          >
            <div className={`
            relative flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0
            ${quiz.isAccessible
                ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
                : 'bg-gray-100 text-gray-400'
              }
          `}>
              <BookOpen className="w-4 h-4" />
              {!quiz.isAccessible && (
                <Lock className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`
                  text-sm font-medium truncate max-w-[300px]
                  ${quiz.isAccessible
                      ? 'text-gray-900 group-hover:text-purple-700'
                      : 'text-gray-500'
                    }
                `}>
                    {quiz.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${quiz.isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }
                  `}>
                      {quiz.isCompleted ? 'Completed' : 'Quiz'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Module Assignments */}
        {assignments.map((assignment) => (
          <div
            key={`module-assignment-${assignment.id}`}
            className={`
            group flex items-center gap-3 p-3 rounded-lg transition-all duration-200
            ${assignment.isAccessible
                ? 'hover:bg-orange-50 cursor-pointer'
                : 'opacity-60 cursor-not-allowed'
              }
          `}
            onClick={() => assignment.isAccessible && handleModuleActivityClick(assignment, 'assignment')}
          >
            <div className={`
            relative flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0
            ${assignment.isAccessible
                ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-200'
                : 'bg-gray-100 text-gray-400'
              }
          `}>
              <FileText className="w-4 h-4" />
              {!assignment.isAccessible && (
                <Lock className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`
                  text-sm font-medium truncate max-w-[300px]
                  ${assignment.isAccessible
                      ? 'text-gray-900 group-hover:text-orange-700'
                      : 'text-gray-500'
                    }
                `}>
                    {assignment.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${assignment.isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                      }
                  `}>
                      {assignment.isCompleted ? 'Completed' : 'Assignment'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Add this handler function for module activities
  const handleModuleActivityClick = (activity, type) => {
    if (isCourseTracking) {
      return;
    }

    // You'll need to implement navigation for quizzes/assignments
    // This is just a placeholder - adjust based on your routing
    console.log(`Navigate to ${type}:`, activity);

    // toast(`Navigating to ${activity.title}`);
    // navigate(`/course/${courseIdIndx}/${type}/${activity.id}`);
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0 bg-white hover:bg-gray-50 transition-colors duration-200">
      {/* MODULE HEADER */}
      <button
        className={`
          flex items-center justify-between w-full p-4 text-left transition-all duration-200 cursor-pointer
          ${isOpen ? 'bg-lightGreen/10 border-l-4 border-l-leafGreen' : 'hover:bg-lightGreen/5'}
          lg:pl-6 pl-4
        `}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`module-panel-${module.id}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold flex-shrink-0
            ${isModuleAccessible
              ? 'bg-lightGreen text-forestGreen'
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {moduleNumber}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className={`
              font-semibold text-sm truncate max-w-[200px]
              ${isModuleAccessible ? 'text-gray-900' : 'text-gray-500'}
            `}>
              {module.title}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Lock icon for module */}
          {!isModuleAccessible && (
            <Lock className="w-4 h-4 text-gray-400" title="Module locked" />
          )}

          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* MODULE CONTENT - Now with overflow-y-auto for scrolling */}
      {isOpen && (
        <div
          id={`module-panel-${module.id}`}
          role="region"
          aria-label={module.title}
          className="bg-white border-t border-gray-100 max-h-[60vh] overflow-y-auto"
        >
          <div className="py-2">
            {topics.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <div className="text-gray-400 text-sm">No topics available</div>
                <div className="text-gray-400 text-xs mt-1">Check back later for updates</div>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                {topics.map((topic, index) => {
                  const isTopicAccessible = topicAccessibleMap.get(topic.id) ?? true;

                  return (
                    <div key={topic.id}>
                      <div
                        className={`
                        group flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                        ${isTopicAccessible
                            ? 'hover:bg-lightGreen/20 cursor-pointer'
                            : 'opacity-60 cursor-not-allowed'
                          }
                      `}
                        onClick={() => handleTopicClick(topic)}
                      >
                        {/* Topic Number with Play Indicator */}
                        <div className={`
                        relative flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-colors
                        ${isTopicAccessible
                            ? 'bg-gray-100 group-hover:bg-lightGreen group-hover:text-leafGreen text-gray-600'
                            : 'bg-gray-100 text-gray-400'
                          }
                      `}>
                          {isTopicAccessible ? (
                            <>
                              <span className="text-xs font-medium group-hover:hidden">
                                {index + 1}
                              </span>
                              <PlayCircle className="w-4 h-4 hidden group-hover:block fill-current" />
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-medium">
                                {index + 1}
                              </span>
                              <Lock className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />
                            </>
                          )}
                        </div>

                        {/* Topic Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className={`
                              text-sm font-semibold truncate max-w-[300px]
                              ${isTopicAccessible
                                  ? 'text-forestGreen group-hover:text-leafGreen'
                                  : 'text-gray-500'
                                }
                            `}>
                                {topic.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {topic.duration_minutes > 0 && (
                                  <span className={`
                                  flex items-center text-xs
                                  ${isTopicAccessible ? 'text-gray-500' : 'text-gray-400'}
                                `}>
                                    <Clock className="w-3 h-3 mr-1" />
                                    {topic.duration_minutes}m
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Mobile-only play button */}
                            {isTopicAccessible && (
                              <button
                                className="lg:hidden flex items-center justify-center w-4 h-4 rounded-full bg-lightGreen text-forestGreen hover:bg-leafGreen hover:text-white transition-colors flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTopicClick(topic);
                                }}
                              >
                                <PlayCircle className="w-2 h-2 fill-current" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Add this line to show quizzes and assignments */}
                      {renderTopicActivities(topic)}
                    </div>
                  );
                })}

                {renderModuleActivities()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}