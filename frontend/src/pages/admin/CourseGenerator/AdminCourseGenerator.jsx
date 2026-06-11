"use client"

import { useCallback, useMemo, useState } from "react"
import { Trash2, Pencil, Save, Wand2, Upload, FileText, Plus, X, ChevronDown } from "lucide-react"
import { useAdminCourseStructureGenerateMutation } from "../../../services/AIServices"

const difficultyOptions = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
]

// Simple Accordion Component
function Accordion({
    children,
    type = "multiple",
    className = "",
}) {
    return <div className={className}>{children}</div>
}

function AccordionItem({ children, value }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border-b border-border">
            {children && typeof children === "object" && "map" in children
                ? children.map((child) => {
                    if (child?.type?.name === "AccordionTrigger") {
                        return (
                            <div key="trigger" onClick={() => setIsOpen(!isOpen)}>
                                {child}
                            </div>
                        )
                    }
                    if (child?.type?.name === "AccordionContent") {
                        return isOpen ? <div key="content">{child}</div> : null
                    }
                    return child
                })
                : children}
        </div>
    )
}

function AccordionTrigger({ children, className = "" }) {
    return (
        <button
            className={`flex w-full items-center justify-between py-4 font-medium transition-all hover:underline ${className}`}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
    )
}

function AccordionContent({ children }) {
    return <div className="pb-4 pt-0">{children}</div>
}

export default function CourseGeneratorPage() {
    // request builder
    const [difficulty, setDifficulty] = useState("beginner")
    const [userQuery, setUserQuery] = useState("")
    const [contentFiles, setContentFiles] = useState([])
    const [isGenerating, setIsGenerating] = useState(false)

    // response data
    const [course, setCourse] = useState(null)

    // edit/delete/regenerate states
    const [editing, setEditing] = useState({})
    const [regenerating, setRegenerating] = useState("")

    const totalStats = useMemo(() => {
        if (!course) {
            return { sessions: 0, modules: 0, topics: 0 }
        }
        const s = course.sessions?.length ?? 0
        const m = course.sessions?.reduce((acc, sess) => acc + (sess.modules?.length ?? 0), 0) ?? 0
        const t =
            course.sessions?.reduce(
                (acc, sess) =>
                    acc + (sess.modules?.reduce((mAcc, mod) => mAcc + (mod.topics?.length ?? 0), 0) ?? 0),
                0,
            ) ?? 0
        return { sessions: s, modules: m, topics: t }
    }, [course])

    const [adminCourseStructureGenerate] = useAdminCourseStructureGenerateMutation()

    const toggleEditing = useCallback((type, id) => {
        const key = `${type}_${id}`
        setEditing((prev) => ({ ...prev, [key]: !prev[key] }))
    }, [])

    const onFilesSelected = useCallback((files) => {
        setContentFiles((prev) => [...prev, ...files])
    }, [])

    const removeFileAt = useCallback((index) => {
        setContentFiles((prev) => prev.filter((_, i) => i !== index))
    }, [])

    const clearFiles = useCallback(() => setContentFiles([]), [])

    const handleSubmit = useCallback(async () => {
        if (!userQuery.trim()) return
        setIsGenerating(true)
        try {
            const formData = new FormData()
            formData.append("difficulty_level", difficulty)
            formData.append("userQuery", userQuery)
            contentFiles.forEach((file) => {
                formData.append("contentFiles", file)
                formData.append("fileNames", file.name)
            })
            const response = await adminCourseStructureGenerate(formData)

            const payload = response?.data?.course?.course;
            setCourse(payload)
        } catch (e) {
            console.error("[v0] Generate error:", e)
            alert("Failed to generate course. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }, [difficulty, userQuery, contentFiles, adminCourseStructureGenerate])

    const handleRegenerate = useCallback(
        async (target) => {
            if (!course) return
            const key = `${target.type}_${target.id}`
            setRegenerating((prev) => new Set(prev).add(key))
            try {
                const formData = new FormData()
                formData.append("difficulty_level", difficulty)
                formData.append("userQuery", userQuery || course.title || "")
                contentFiles.forEach((file) => {
                    formData.append("contentFiles", file)
                    formData.append("fileNames", file.name)
                })
                formData.append("target_type", target.type)
                formData.append("target_id", String(target.id))

                const response = await adminCourseStructureGenerate(formData)
                const payload = response?.data ?? response
                setCourse(payload)
            } catch (e) {
                console.error("[v0] Regenerate error:", e)
                alert("Failed to regenerate content for the selected item.")
            } finally {
                setRegenerating((prev) => {
                    const next = new Set(prev)
                    next.delete(key)
                    return next
                })
            }
        },
        [course, difficulty, userQuery, contentFiles, adminCourseStructureGenerate],
    )

    const updateCourseField = useCallback((field, value) => {
        setCourse((prev) => (prev ? { ...prev, [field]: value } : prev))
    }, [])

    const updateSessionField = useCallback((sid, field, value) => {
        setCourse((prev) => {
            if (!prev?.sessions) return prev
            return {
                ...prev,
                sessions: prev.sessions.map((s) => (s.id === sid ? { ...s, [field]: value } : s)),
            }
        })
    }, [])

    const updateModuleField = useCallback((sid, mid, field, value) => {
        setCourse((prev) => {
            if (!prev?.sessions) return prev
            return {
                ...prev,
                sessions: prev.sessions.map((s) => {
                    if (s.id !== sid) return s
                    const modules = s.modules?.map((m) => (m.id === mid ? { ...m, [field]: value } : m)) || []
                    return { ...s, modules }
                }),
            }
        })
    }, [])

    const updateTopicField = useCallback((sid, mid, tid, field, value) => {
        setCourse((prev) => {
            if (!prev?.sessions) return prev
            return {
                ...prev,
                sessions: prev.sessions.map((s) => {
                    if (s.id !== sid) return s
                    const modules =
                        s.modules?.map((m) => {
                            if (m.id !== mid) return m
                            const topics = m.topics?.map((t) => (t.id === tid ? { ...t, [field]: value } : t)) || []
                            return { ...m, topics }
                        }) || []
                    return { ...s, modules }
                }),
            }
        })
    }, [])

    const deleteSession = useCallback((sid) => {
        setCourse((prev) => {
            if (!prev) return prev
            return { ...prev, sessions: prev.sessions?.filter((s) => s.id !== sid) }
        })
    }, [])

    const deleteModule = useCallback((sid, mid) => {
        setCourse((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                sessions: prev.sessions?.map((s) => {
                    if (s.id !== sid) return s
                    return { ...s, modules: s.modules?.filter((m) => m.id !== mid) }
                }),
            }
        })
    }, [])

    const deleteTopic = useCallback((sid, mid, tid) => {
        setCourse((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                sessions: prev.sessions?.map((s) => {
                    if (s.id !== sid) return s
                    return {
                        ...s,
                        modules: s.modules?.map((m) => {
                            if (m.id !== mid) return m
                            return { ...m, topics: m.topics?.filter((t) => t.id !== tid) }
                        }),
                    }
                }),
            }
        })
    }, [])

    return (
        <div className="space-y-6">
            {/* Main Generator Card */}
            <div className="rounded-lg border border-border bg-card shadow-sm">
                <div className="p-6 border-b border-border">
                    <h3 className="text-xl font-semibold">AI Course Generator</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="difficulty" className="text-sm font-medium">
                                Difficulty level
                            </label>
                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {difficultyOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 md:col-span-1">
                            <label htmlFor="files" className="text-sm font-medium">
                                Reference files
                            </label>
                            <div className="flex items-center gap-2">
                                <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 hover:bg-muted cursor-pointer text-sm">
                                    <Upload className="h-4 w-4" />
                                    <span>Choose files</span>
                                    <input
                                        id="files"
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || [])
                                            onFilesSelected(files)
                                            if (e.target) e.target.value = ""
                                        }}
                                        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                                    />
                                </label>
                                {contentFiles.length > 0 && (
                                    <button
                                        onClick={clearFiles}
                                        className="ml-auto inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-2 text-sm hover:bg-secondary/80"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear
                                    </button>
                                )}
                            </div>
                            {contentFiles.length > 0 && (
                                <div className="mt-2 space-y-2 rounded-md border border-border p-2">
                                    {contentFiles.map((f, i) => (
                                        <div key={`${f.name}-${i}`} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                <span className="truncate max-w-[220px]">{f.name}</span>
                                            </div>
                                            <button
                                                onClick={() => removeFileAt(i)}
                                                className="p-1 hover:bg-muted rounded"
                                                aria-label="Remove file"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="prompt" className="text-sm font-medium">
                            Prompt
                        </label>
                        <textarea
                            id="prompt"
                            value={userQuery}
                            onChange={(e) => setUserQuery(e.target.value)}
                            placeholder="Describe the course you want to generate..."
                            rows={4}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isGenerating || !userQuery.trim()}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? "Generating..." : "Generate"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Course Overview Card */}
            {course ? (
                <div className="rounded-lg border border-border bg-card shadow-sm">
                    <div className="p-6 border-b border-border flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold">Course Overview</h3>
                            <div className="flex gap-2 text-sm">
                                <span className="inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs">
                                    {totalStats.sessions} Sessions
                                </span>
                                <span className="inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs">
                                    {totalStats.modules} Modules
                                </span>
                                <span className="inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs">
                                    {totalStats.topics} Topics
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleEditing("course", course.id ?? "0")}
                                className={`p-2 rounded-md ${editing[`course_${course.id ?? "0"}`] ? "bg-secondary" : "hover:bg-muted"}`}
                                aria-label={editing[`course_${course.id ?? "0"}`] ? "Save course" : "Edit course"}
                                title={editing[`course_${course.id ?? "0"}`] ? "Save changes" : "Edit"}
                            >
                                {editing[`course_${course.id ?? "0"}`] ? <Save className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={() => handleRegenerate({ type: "course", id: course.id ?? "0" })}
                                // disabled={regenerating.has(`course_${course.id ?? "0"}`)}
                                className="p-2 rounded-md hover:bg-muted disabled:opacity-50"
                                aria-label="Regenerate course"
                                title="Regenerate"
                            >
                                <Wand2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                {editing[`course_${course.id ?? "0"}`] ? (
                                    <input
                                        type="text"
                                        value={course.title}
                                        onChange={(e) => updateCourseField("title", e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                ) : (
                                    <div className="rounded-md border border-border p-2">{course.title}</div>
                                )}
                            </div>
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                {editing[`course_${course.id ?? "0"}`] ? (
                                    <textarea
                                        value={course.description || ""}
                                        onChange={(e) => updateCourseField("description", e.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                    />
                                ) : (
                                    <div className="rounded-md border border-border p-3 text-sm leading-relaxed">
                                        {course.description || "—"}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* What you'll learn, prerequisites, tags */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">What you'll learn</label>
                                <div className="rounded-md border border-border p-3 text-sm space-y-1">
                                    {(course.what_you_will_learn ?? []).map((it, i) => (
                                        <div key={i}>• {it}</div>
                                    ))}
                                    {(course.what_you_will_learn ?? []).length === 0 && <div>—</div>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prerequisites</label>
                                <div className="rounded-md border border-border p-3 text-sm space-y-1">
                                    {(course.prerequisites ?? []).map((it, i) => (
                                        <div key={i}>• {it}</div>
                                    ))}
                                    {(course.prerequisites ?? []).length === 0 && <div>—</div>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {(course.hashtags ?? []).map((t, i) => (
                                        <span key={i} className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs">
                                            #{t}
                                        </span>
                                    ))}
                                    {(course.hashtags ?? []).length === 0 && <div className="text-sm">—</div>}
                                </div>
                            </div>
                        </div>

                        {/* Nested structure */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold">Course Structure</h3>
                                <button
                                    onClick={() => {
                                        const newId = Date.now()
                                        setCourse((prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    sessions: [...(prev.sessions ?? []), { id: newId, title: "New Session", modules: [] }],
                                                }
                                                : prev,
                                        )
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Session
                                </button>
                            </div>

                            <Accordion type="multiple" className="w-full">
                                {(course.sessions ?? []).map((session) => (
                                    <AccordionItem key={`s_${session.id}`} value={`s_${session.id}`}>
                                        <AccordionTrigger className="text-left">
                                            <div className="flex w-full items-center justify-between">
                                                <span className="font-medium">{session.title}</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toggleEditing("session", session.id)
                                                        }}
                                                        className="p-2 rounded-md hover:bg-muted"
                                                        title={editing[`session_${session.id}`] ? "Save" : "Edit"}
                                                    >
                                                        {editing[`session_${session.id}`] ? (
                                                            <Save className="h-4 w-4" />
                                                        ) : (
                                                            <Pencil className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleRegenerate({ type: "session", id: session.id })
                                                        }}
                                                        className="p-2 rounded-md hover:bg-muted"
                                                        title="Regenerate"
                                                    >
                                                        <Wand2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteSession(session.id)
                                                        }}
                                                        className="p-2 rounded-md hover:bg-muted"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-3 p-3 rounded-md border border-border">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Session title</label>
                                                    {editing[`session_${session.id}`] ? (
                                                        <input
                                                            type="text"
                                                            value={session.title}
                                                            onChange={(e) => updateSessionField(session.id, "title", e.target.value)}
                                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                        />
                                                    ) : (
                                                        <div className="rounded-md border border-border p-2">{session.title}</div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-medium">Modules</h4>
                                                    <button
                                                        onClick={() => {
                                                            const newId = Date.now()
                                                            setCourse((prev) =>
                                                                prev
                                                                    ? {
                                                                        ...prev,
                                                                        sessions: prev.sessions?.map((s) =>
                                                                            s.id === session.id
                                                                                ? {
                                                                                    ...s,
                                                                                    modules: [
                                                                                        ...(s.modules ?? []),
                                                                                        { id: newId, title: "New Module", topics: [] },
                                                                                    ],
                                                                                }
                                                                                : s,
                                                                        ),
                                                                    }
                                                                    : prev,
                                                            )
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        Add Module
                                                    </button>
                                                </div>

                                                <Accordion type="multiple" className="w-full">
                                                    {(session.modules ?? []).map((mod) => (
                                                        <AccordionItem key={`m_${mod.id}`} value={`m_${mod.id}`}>
                                                            <AccordionTrigger className="text-left">
                                                                <div className="flex w-full items-center justify-between">
                                                                    <span className="font-medium">{mod.title}</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                toggleEditing("module", mod.id)
                                                                            }}
                                                                            className="p-2 rounded-md hover:bg-muted"
                                                                            title={editing[`module_${mod.id}`] ? "Save" : "Edit"}
                                                                        >
                                                                            {editing[`module_${mod.id}`] ? (
                                                                                <Save className="h-4 w-4" />
                                                                            ) : (
                                                                                <Pencil className="h-4 w-4" />
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                handleRegenerate({ type: "module", id: mod.id })
                                                                            }}
                                                                            className="p-2 rounded-md hover:bg-muted"
                                                                            title="Regenerate"
                                                                        >
                                                                            <Wand2 className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                deleteModule(session.id, mod.id)
                                                                            }}
                                                                            className="p-2 rounded-md hover:bg-muted"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="space-y-3 p-3 rounded-md border border-border">
                                                                    <div className="space-y-2">
                                                                        <label className="text-sm font-medium">Module title</label>
                                                                        {editing[`module_${mod.id}`] ? (
                                                                            <input
                                                                                type="text"
                                                                                value={mod.title}
                                                                                onChange={(e) => updateModuleField(session.id, mod.id, "title", e.target.value)}
                                                                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                                            />
                                                                        ) : (
                                                                            <div className="rounded-md border border-border p-2">{mod.title}</div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center justify-between">
                                                                        <h5 className="text-sm font-medium">Topics</h5>
                                                                        <button
                                                                            onClick={() => {
                                                                                const newId = Date.now()
                                                                                setCourse((prev) =>
                                                                                    prev
                                                                                        ? {
                                                                                            ...prev,
                                                                                            sessions: prev.sessions?.map((s) =>
                                                                                                s.id === session.id
                                                                                                    ? {
                                                                                                        ...s,
                                                                                                        modules: s.modules?.map((m) =>
                                                                                                            m.id === mod.id
                                                                                                                ? {
                                                                                                                    ...m,
                                                                                                                    topics: [
                                                                                                                        ...(m.topics ?? []),
                                                                                                                        {
                                                                                                                            id: newId,
                                                                                                                            title: "New Topic",
                                                                                                                            description: "",
                                                                                                                            content_type: "general",
                                                                                                                            general_material: { title: "New", description: "" },
                                                                                                                        },
                                                                                                                    ],
                                                                                                                }
                                                                                                                : m,
                                                                                                        ),
                                                                                                    }
                                                                                                    : s,
                                                                                            ),
                                                                                        }
                                                                                        : prev,
                                                                                )
                                                                            }}
                                                                            className="inline-flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-sm hover:bg-secondary/80"
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                            Add Topic
                                                                        </button>
                                                                    </div>

                                                                    <Accordion type="multiple" className="w-full">
                                                                        {(mod.topics ?? []).map((t) => (
                                                                            <AccordionItem key={`t_${t.id}`} value={`t_${t.id}`}>
                                                                                <AccordionTrigger className="text-left">
                                                                                    <div className="flex w-full items-center justify-between">
                                                                                        <span className="font-medium">{t.title}</span>
                                                                                        <div className="flex items-center gap-1">
                                                                                            <span className="inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs mr-2">
                                                                                                {t.content_type}
                                                                                            </span>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    toggleEditing("topic", t.id)
                                                                                                }}
                                                                                                className="p-2 rounded-md hover:bg-muted"
                                                                                                title={editing[`topic_${t.id}`] ? "Save" : "Edit"}
                                                                                            >
                                                                                                {editing[`topic_${t.id}`] ? (
                                                                                                    <Save className="h-4 w-4" />
                                                                                                ) : (
                                                                                                    <Pencil className="h-4 w-4" />
                                                                                                )}
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    handleRegenerate({ type: "topic", id: t.id })
                                                                                                }}
                                                                                                className="p-2 rounded-md hover:bg-muted"
                                                                                                title="Regenerate"
                                                                                            >
                                                                                                <Wand2 className="h-4 w-4" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    deleteTopic(session.id, mod.id, t.id)
                                                                                                }}
                                                                                                className="p-2 rounded-md hover:bg-muted"
                                                                                                title="Delete"
                                                                                            >
                                                                                                <Trash2 className="h-4 w-4" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </AccordionTrigger>
                                                                                <AccordionContent>
                                                                                    <div className="space-y-2 rounded-md border border-border p-3">
                                                                                        <label className="text-sm font-medium">Title</label>
                                                                                        {editing[`topic_${t.id}`] ? (
                                                                                            <input
                                                                                                type="text"
                                                                                                value={t.title}
                                                                                                onChange={(e) =>
                                                                                                    updateTopicField(session.id, mod.id, t.id, "title", e.target.value)
                                                                                                }
                                                                                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                                                                            />
                                                                                        ) : (
                                                                                            <div className="rounded-md border border-border p-2">{t.title}</div>
                                                                                        )}

                                                                                        <label className="text-sm font-medium">Description</label>
                                                                                        {editing[`topic_${t.id}`] ? (
                                                                                            <textarea
                                                                                                value={t.description ?? ""}
                                                                                                rows={3}
                                                                                                onChange={(e) =>
                                                                                                    updateTopicField(
                                                                                                        session.id,
                                                                                                        mod.id,
                                                                                                        t.id,
                                                                                                        "description",
                                                                                                        e.target.value,
                                                                                                    )
                                                                                                }
                                                                                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                                                                            />
                                                                                        ) : (
                                                                                            <div className="rounded-md border border-border p-3 text-sm leading-relaxed">
                                                                                                {t.description ?? "—"}
                                                                                            </div>
                                                                                        )}

                                                                                        {/* Content preview by type */}
                                                                                        <div className="pt-2">
                                                                                            <label className="text-sm font-medium">Content</label>
                                                                                            <div className="mt-2 rounded-md border border-border p-3 text-sm">
                                                                                                {t.content_type === "video" && (
                                                                                                    <div>Video URL: {t.video?.url || "—"}</div>
                                                                                                )}
                                                                                                {t.content_type === "audio" && (
                                                                                                    <div>Audio URL: {t.audio?.url || "—"}</div>
                                                                                                )}
                                                                                                {t.content_type === "general" && (
                                                                                                    <div className="space-y-1">
                                                                                                        <div className="font-medium">
                                                                                                            {t.general_material?.title || "—"}
                                                                                                        </div>
                                                                                                        <div>{t.general_material?.description || "—"}</div>
                                                                                                        {t.general_material?.url && (
                                                                                                            <a
                                                                                                                className="underline text-blue-600"
                                                                                                                href={t.general_material.url}
                                                                                                                target="_blank"
                                                                                                                rel="noreferrer"
                                                                                                            >
                                                                                                                Open link
                                                                                                            </a>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                                {t.content_type === "accordian" && (
                                                                                                    <div className="space-y-2">
                                                                                                        {(t.accordions ?? []).map((a, i) => (
                                                                                                            <div key={i} className="rounded border border-border p-2">
                                                                                                                <div className="font-medium">{a.title}</div>
                                                                                                                <div className="text-sm">{a.content}</div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                        {(t.accordions ?? []).length === 0 && <div>—</div>}
                                                                                                    </div>
                                                                                                )}
                                                                                                {t.content_type === "slide" && (
                                                                                                    <div className="space-y-2">
                                                                                                        {(t.multi_slides ?? []).map((s, i) => (
                                                                                                            <div key={i} className="rounded border border-border p-2">
                                                                                                                <div className="font-medium">{s.title}</div>
                                                                                                                {s.content && <div className="text-sm">{s.content}</div>}
                                                                                                                {(s.accordianSections ?? []).length ? (
                                                                                                                    <div className="mt-2 space-y-1">
                                                                                                                        {s.accordianSections?.map((sec, j) => (
                                                                                                                            <div key={j}>
                                                                                                                                <div className="font-medium">{sec.title}</div>
                                                                                                                                <div className="text-sm">{sec.content}</div>
                                                                                                                            </div>
                                                                                                                        ))}
                                                                                                                    </div>
                                                                                                                ) : null}
                                                                                                            </div>
                                                                                                        ))}
                                                                                                        {(t.multi_slides ?? []).length === 0 && <div>—</div>}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </AccordionContent>
                                                                            </AccordionItem>
                                                                        ))}
                                                                    </Accordion>
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card shadow-sm">
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Generate a course to see the structure here.
                    </div>
                </div>
            )}
        </div>
    )
}
