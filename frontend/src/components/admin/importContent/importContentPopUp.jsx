import { useState } from "react";
import {
    useImportAllCoursesQuery,
    useLazyImportSessionsByCourseIdQuery,
    useLazyImportModulesBySessionIdQuery,
    useLazyImportTopicsByModuleIdQuery,
    useImportSelectedSessionsMutation,
    useImportSelectedModulesMutation,
    useImportSelectedTopicsMutation
} from "../../../services/importContent/importContentApi";
import toast from "react-hot-toast";
import { getAdminToken } from "../../../services/CookieService";
import { useEffect } from "react";

export default function ImportContentPopup({ open, onClose, from = "session", Id, refetchSessions, refetchModules, refetchTopics }) {

    const [searchQuery, setSearchQuery] = useState("");
    const [sessionSearchQuery, setSessionSearchQuery] = useState("");
    const [moduleSearchQuery, setModuleSearchQuery] = useState("");
    const [topicSearchQuery, setTopicSearchQuery] = useState("");

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);

    const [selectedSessionIds, setSelectedSessionIds] = useState([]);
    const [selectedModuleIds, setSelectedModuleIds] = useState([]);
    const [selectedTopicIds, setSelectedTopicIds] = useState([]);

    const { access_token } = getAdminToken();

    // Fetch All Courses
    const { data, isLoading, isError } = useImportAllCoursesQuery({ searchQuery, access_token });
    const courseList = data?.data || [];

    // Fetch Sessions
    const [
        triggerGetSessions,
        { data: sessionData, isLoading: sessionLoading, isError: sessionError }
    ] = useLazyImportSessionsByCourseIdQuery();

    // Fetch Modules
    const [
        triggerGetModules,
        { data: moduleData, isLoading: moduleLoading, isError: moduleError }
    ] = useLazyImportModulesBySessionIdQuery();

    // Fetch Topics
    const [
        triggerGetTopics,
        { data: topicData, isLoading: topicLoading, isError: topicError }
    ] = useLazyImportTopicsByModuleIdQuery();

    useEffect(() => {
        if (selectedCourse) {
            triggerGetSessions({
                courseId: selectedCourse.id,
                searchQuery: sessionSearchQuery,
                access_token
            });
        }
    }, [sessionSearchQuery]);

    useEffect(() => {
        if (selectedSession) {
            triggerGetModules({
                sessionId: selectedSession.id,
                searchQuery: moduleSearchQuery,
                access_token
            });
        }
    }, [moduleSearchQuery]);

    useEffect(() => {
        if (selectedModule) {
            triggerGetTopics({
                moduleId: selectedModule.id,
                searchQuery: topicSearchQuery,
                access_token
            });
        }
    }, [topicSearchQuery]);

    const [importSessions] = useImportSelectedSessionsMutation();
    const [importModules] = useImportSelectedModulesMutation();
    const [importTopics] = useImportSelectedTopicsMutation();

    if (!open) return null;

    const sessions = sessionData?.data || [];
    const modules = moduleData?.data || [];
    const topics = topicData?.data || [];

    const showSessionCheckbox = from === "session";
    const showModuleCheckbox = from === "module";
    const showTopicCheckbox = from === "topic";

    // FILTERS
    const filteredCourses = courseList
        ?.filter((course) => !(course.id === Id && from === "session"))   // ⛔ remove current course
    // ?.filter((course) =>
    //     course.title.toLowerCase().includes(searchQuery.toLowerCase())
    // );

    const filteredSessions = sessions
        ?.filter((session) => !(session.id === Id && from === "module"))   // ⛔ remove current session
    // ?.filter((session) =>
    //     session.title.toLowerCase().includes(sessionSearchQuery.toLowerCase())
    // );

    const filteredModules = modules
        ?.filter((m) => !(from === "topic" && m.id === Id))   // ⛔ remove current module
    // ?.filter((m) =>
    //     m.title.toLowerCase().includes(moduleSearchQuery.toLowerCase())
    // );

    const filteredTopics = topics
    // ?.filter((t) =>
    //     t.title.toLowerCase().includes(topicSearchQuery.toLowerCase())
    // );

    const isSessionDisabled = from === "session";
    const isModuleDisabled = from === "module";

    // CLICK HANDLERS
    const handleCourseClick = (course) => {
        setSelectedCourse(course);
        setSelectedSession(null);
        setSelectedModule(null);
        setSessionSearchQuery("");

        triggerGetSessions({ courseId: course.id, searchQuery: sessionSearchQuery, access_token });
    };

    const handleSessionClick = (session) => {
        if (from === "session") return; // ❌ disable
        setSelectedSession(session);
        setSelectedModule(null);

        triggerGetModules({ sessionId: session.id, searchQuery: moduleSearchQuery, access_token });
    };

    const handleModuleClick = (module) => {
        if (from === "module") return; // ❌ disabled
        setSelectedModule(module);
        triggerGetTopics({
            moduleId: module.id,
            searchQuery: topicSearchQuery,
            access_token
        });
    };

    const goBackToCourses = () => {
        setSelectedCourse(null);
        setSelectedSession(null);
        setSelectedModule(null);
    };

    const goBackToSessions = () => {
        setSelectedSession(null);
        setSelectedModule(null);
    };

    const goBackToModules = () => {
        setSelectedModule(null);
    };

    const toggleSessionSelect = (id) => {
        setSelectedSessionIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleModuleSelect = (id) => {
        setSelectedModuleIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleTopicSelect = (id) => {
        setSelectedTopicIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };
    const handleImport = async () => {
        let t;

        try {
            if (from === "session") {
                if (selectedSessionIds.length === 0) {
                    toast.error("Please select at least one session.");
                    return;
                }

                // Show loading toast
                t = toast.loading("Importing sessions...");

                await importSessions({
                    courseId: Id,
                    sessionIds: selectedSessionIds,
                    access_token
                }).unwrap();

                // Success toast
                toast.success("Sessions imported successfully!", { id: t });

                await refetchSessions();
            }

            if (from === "module") {
                if (selectedModuleIds.length === 0) {
                    toast.error("Please select at least one module.");
                    return;
                }

                t = toast.loading("Importing modules...");

                await importModules({
                    sessionId: Id,
                    moduleIds: selectedModuleIds,
                    access_token
                }).unwrap();

                await refetchModules();

                toast.success("Modules imported successfully!", { id: t });
            }

            if (from === "topic") {
                if (selectedTopicIds.length === 0) {
                    toast.error("Please select at least one topic.");
                    return;
                }

                t = toast.loading("Importing topics...");

                await importTopics({
                    moduleId: Id,
                    topicIds: selectedTopicIds,
                    access_token
                }).unwrap();

                await refetchTopics(); // make sure this exists

                toast.success("Topics imported successfully!", { id: t });
            }

            onClose();
            setSelectedSessionIds([]);
            setSelectedModuleIds([]);
            setSelectedTopicIds([]);
        } catch (err) {
            console.error(err);
            toast.error(err?.data?.message || "Import failed. Check console.", { id: t });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-xl w-full max-w-5xl shadow-xl relative max-h-[80vh] min-h-[80vh] flex flex-col">

                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-6 text-gray-500 hover:text-gray-800 text-2xl z-10"
                >
                    ✕
                </button>

                {/* HEADER */}
                <div className="px-6 pt-5 pb-5 border-b bg-lightGreen/10">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xl font-bold text-forestGreen">
                                {!selectedCourse
                                    ? "Import Content"
                                    : !selectedSession
                                        ? "Import Sessions"
                                        : !selectedModule
                                            ? "Import Modules"
                                            : "Import Topics"}
                            </p>

                            {selectedCourse && !selectedSession && (
                                <p className="text-sm text-gray-500">{selectedCourse.title}</p>
                            )}

                            {selectedSession && !selectedModule && (
                                <p className="text-sm text-gray-500">{selectedSession.title}</p>
                            )}

                            {selectedModule && (
                                <p className="text-sm text-gray-500">{selectedModule.title}</p>
                            )}
                        </div>

                        {/* SEARCH BAR */}
                        <div className="relative w-80 mr-10">
                            <input
                                type="text"
                                placeholder={
                                    !selectedCourse
                                        ? "Search courses..."
                                        : !selectedSession
                                            ? "Search sessions..."
                                            : !selectedModule
                                                ? "Search modules..."
                                                : "Search topics..."
                                }
                                value={
                                    !selectedCourse
                                        ? searchQuery
                                        : !selectedSession
                                            ? sessionSearchQuery
                                            : !selectedModule
                                                ? moduleSearchQuery
                                                : topicSearchQuery
                                }
                                onChange={(e) => {
                                    if (!selectedCourse) setSearchQuery(e.target.value);
                                    else if (!selectedSession) setSessionSearchQuery(e.target.value);
                                    else if (!selectedModule) setModuleSearchQuery(e.target.value);
                                    else setTopicSearchQuery(e.target.value);
                                }}
                                className="w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-leafGreen focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto px-6 py-4">

                    {/* COURSES */}
                    {!selectedCourse && (
                        <>
                            {isLoading && <p className="text-center py-10">Loading courses...</p>}
                            {isError && <p className="text-center py-10 text-red-600">Failed to load courses.</p>}

                            {!isLoading && !isError && (
                                filteredCourses.length === 0 ? (
                                    <p className="text-center py-10 text-gray-500">No courses found</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {filteredCourses.map((course) => (
                                            <div
                                                key={course.id}
                                                onClick={() => handleCourseClick(course)}
                                                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-lightGreen/20 hover:border-leafGreen/50 transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <h3 className="font-medium">{course.title}</h3>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </>
                    )}

                    {/* SESSIONS */}
                    {selectedCourse && !selectedSession && (
                        <>
                            <button
                                onClick={goBackToCourses}
                                className="mb-4 text-leafGreen hover:text-forestGreen font-medium flex items-center gap-2 transition-colors"
                            >
                                ← Back to Courses
                            </button>

                            {sessionLoading && <p className="text-center py-10">Loading sessions...</p>}
                            {sessionError && <p className="text-center py-10 text-red-600">Failed to load sessions.</p>}

                            {!sessionLoading && (
                                filteredSessions.length === 0 ? (
                                    <p className="text-center py-10 text-gray-500">No sessions found</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {filteredSessions.map((session) => (
                                            <div
                                                key={session.id}
                                                onClick={() => !isSessionDisabled && handleSessionClick(session)}
                                                className={`p-4 border border-gray-200 rounded-lg transition-all duration-200 shadow-sm 
        ${isSessionDisabled ? "opacity-60" : "cursor-pointer hover:bg-lightGreen/20 hover:border-leafGreen/50 hover:shadow-md"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {showSessionCheckbox && (
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded cursor-pointer"
                                                            checked={selectedSessionIds.includes(session.id)}
                                                            onChange={(e) => toggleSessionSelect(session.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    )}

                                                    <h3 className="font-medium">{session.title}</h3>
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                )
                            )}
                        </>
                    )}

                    {/* MODULES */}
                    {selectedSession && !selectedModule && (
                        <>
                            <button
                                onClick={goBackToSessions}
                                className="mb-4 text-leafGreen hover:text-forestGreen font-medium flex items-center gap-2 transition-colors"
                            >
                                ← Back to Sessions
                            </button>

                            {moduleLoading && <p className="text-center py-10">Loading modules...</p>}
                            {moduleError && <p className="text-center py-10 text-red-600">Failed to load modules.</p>}

                            {!moduleLoading && (
                                filteredModules.length === 0 ? (
                                    <p className="text-center py-10 text-gray-500">No modules found</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {filteredModules.map((module) => (
                                            <div
                                                key={module.id}
                                                onClick={() => !isModuleDisabled && handleModuleClick(module)}
                                                className={`p-4 border border-gray-200 rounded-lg transition-all duration-200 shadow-sm 
        ${isModuleDisabled ? "opacity-60" : "cursor-pointer hover:bg-lightGreen/20 hover:border-leafGreen/50 hover:shadow-md"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {showModuleCheckbox && (
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded cursor-pointer"
                                                            checked={selectedModuleIds.includes(module.id)}
                                                            onChange={(e) => toggleModuleSelect(module.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    )}
                                                    <h3 className="font-medium">{module.title}</h3>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </>
                    )}

                    {/* TOPICS */}
                    {selectedModule && (
                        <>
                            <button
                                onClick={goBackToModules}
                                className="mb-4 text-leafGreen hover:text-forestGreen font-medium flex items-center gap-2 transition-colors"
                            >
                                ← Back to Modules
                            </button>

                            {topicLoading && <p className="text-center py-10">Loading topics...</p>}
                            {topicError && <p className="text-center py-10 text-red-600">Failed to load topics.</p>}

                            {!topicLoading && (
                                filteredTopics.length === 0 ? (
                                    <p className="text-center py-10 text-gray-500">No topics found</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {filteredTopics.map((topic) => (
                                            <div key={topic.id} className="p-4 border border-gray-200 rounded-lg hover:bg-lightGreen/10 transition-all duration-200">
                                                <div className="flex items-center gap-3">
                                                    {showTopicCheckbox && (
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded cursor-pointer"
                                                            checked={selectedTopicIds.includes(topic.id)}
                                                            onChange={(e) => toggleTopicSelect(topic.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />)}
                                                    <h3 className="font-medium">{topic.title}</h3>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </>
                    )}

                </div>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50/50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        className="px-6 py-2 bg-leafGreen hover:bg-leafGreen/90 active:bg-forestGreen text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        Import
                    </button>
                </div>

            </div>
        </div>
    );
}
