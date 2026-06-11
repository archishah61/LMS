/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Upload,
  X,
  FileText,
  Clock,
  BookOpen,
  Layers,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Zap,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileUp,
  Timer,
  LayoutList,
  Video,
  Headphones,
  AlignLeft,
  ListTree,
  Presentation,
  Edit2,
  Trash2,
  ExternalLink,
  Trophy,
  Smile,
  MessageSquare,
  Banknote,
  Percent,
  Search,
  Share2,
  Link,
  HelpCircle,
  Briefcase,
  Circle,
  Layout,
  Lock,
} from "lucide-react";

// ─── Helpers ───────────────────────────────────────────────────────────────

const stripHtmlStructured = (html) => {
  if (!html) return "";
  let clean = html.replace(/<br\s*\/?>/gi, "\n");
  clean = clean.replace(/<\/p>/gi, "\n\n");
  clean = clean.replace(/<h[1-6][^>]*>/gi, "\n\n");
  clean = clean.replace(/<\/h[1-6]>/gi, "\n");
  clean = clean.replace(/<\/li>/gi, "\n");
  clean = clean.replace(/<\/tr>/gi, "\n");
  clean = clean.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  const doc = new DOMParser().parseFromString(clean, 'text/html');
  return doc.documentElement.textContent;
};

const formatErrorMsg = (err, defaultMsg) => {
  let msg = err?.data?.error || err?.error || err?.message || err;
  if (typeof msg !== 'string') msg = defaultMsg || "An error occurred.";

  if (msg.includes("503 Service Unavailable") || msg.includes("503")) {
    return "Service is unavailable. Try again later.";
  }
  if (msg.includes("429 Too Many Requests") || msg.includes("429")) {
    return "Service is busy. Try again later.";
  }
  if (msg.includes("[GoogleGenerativeAI Error]")) {
    const match = msg.match(/\[(\d{3})\s+([^\]]+)\]/);
    if (match && match[2]) {
      return `${match[2].trim()}. Try again later.`;
    }
  }

  const bracketMatch = msg.match(/\[(\d{3})\s*([^\]]*)\]/);
  if (bracketMatch && bracketMatch[2]) {
     return `${bracketMatch[2].trim()}. Try again later.`;
  }
  
  if (msg.length > 100) {
    const firstSentence = msg.split(/(?<=[.?!])\s/)[0];
    if (firstSentence) return firstSentence;
  }

  return msg;
};

import "./TopicContent.css";
import { toast } from "react-hot-toast";
import {
  useNewCourseGenerateMutation,
  useNewCourseSaveMutation,
  useNewCourseGenerateContentMutation,
  useNewCourseSaveContentMutation,
  useNewCourseRegenerateNodeMutation,
  useNewCourseRegenerateNodeContentMutation,
  useNewCourseSaveQuizContentMutation,
  useNewCourseRegenerateQuizMutation,
  useNewCourseSaveAssignmentContentMutation,
  useNewCourseRegenerateAssignmentMutation,
} from "../../../services/AIServices";

// ─── Styles (Tailwind classes organized as constants for readability) ────────

const CARD_BASE =
  "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg";

const GRADIENT_TEXT =
  "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-primary/10 hover:shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

const INPUT_BASE =
  "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all duration-200";

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * Reusable inline editable title component
 */
const EditableTitle = ({ title, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);

  const handleSave = () => {
    if (value.trim()) onSave(value.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValue(title);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="flex-1 bg-white dark:bg-gray-800 border border-violet-500 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-100 outline-none shadow-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <button
          onClick={handleSave}
          className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
          title="Save"
        >
          <CheckCircle2 className="w-3 h-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group/edit flex-1 min-w-0">
      <span className={`truncate ${className}`} title={title}>
        {title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="p-1 text-gray-400 hover:text-primary transition-opacity"
        title="Edit title"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/**
 * Animated loading skeleton for generation state
 */
const GenerationSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Course title skeleton */}
    <div className={`${CARD_BASE} p-6`}>
      <div className="h-8 bg-gradient-to-r from-violet-200 to-indigo-200 dark:from-violet-800 dark:to-indigo-800 rounded-lg w-2/3 mb-4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
      <div className="flex gap-4 mt-4">
        <div className="h-10 bg-violet-100 dark:bg-forestGreen/20 rounded-lg w-32" />
        <div className="h-10 bg-lightGreen dark:bg-forestGreen/20 rounded-lg w-28" />
        <div className="h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-24" />
      </div>
    </div>

    {/* Sessions skeleton */}
    {[1, 2, 3].map((i) => (
      <div key={i} className={`${CARD_BASE} p-5`}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4 mb-4" />
        <div className="space-y-3 pl-4 border-l-2 border-violet-200 dark:border-violet-800">
          {[1, 2].map((j) => (
            <div key={j} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/5 mb-2" />
              <div className="space-y-2 pl-3">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}

    {/* Floating animation indicator */}
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-violet-500"
            style={{
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        AI is crafting your content...
      </span>
    </div>
  </div>
);

/**
 * Renders dynamically generated deep content for topics & slides
 */
const GeneratedContentDisplay = ({ content }) => {
  if (!content) return null;

  // Merge consecutive timestamps that share the same description
  const mergeTimestamps = (timestamps) => {
    if (!timestamps || timestamps.length === 0) return [];
    const merged = [{ ...timestamps[0] }];
    for (let i = 1; i < timestamps.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = timestamps[i];
      if (curr.description === prev.description) {
        // Merge: keep the start of prev and the end of curr
        const prevStart = prev.timestamp.split(" - ")[0];
        const currEnd = curr.timestamp.split(" - ")[1];
        prev.timestamp = `${prevStart} - ${currEnd}`;
      } else {
        merged.push({ ...curr });
      }
    }
    return merged;
  };

  const mergedTimestamps = content.timestamps ? mergeTimestamps(content.timestamps) : null;

  return (
    <div className="mt-2 w-full text-sm bg-gray-50 dark:bg-gray-800/60 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
      {/* For Video/Audio */}
      {mergedTimestamps && (
        <div className="space-y-2">
          {mergedTimestamps.map((ts, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-mono text-xs px-1.5 py-0.5 bg-violet-100 text-leafGreen dark:bg-forestGreen/20 dark:text-violet-300 rounded border border-violet-200 dark:border-violet-800">{ts.timestamp}</span>
              <span className="text-gray-600 dark:text-gray-300 leading-relaxed text-[13px]">{ts.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* For General */}
      {content.description && !content.subtopics && (
        <div className="space-y-2">
          <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{content.description}</p>
          {(content.duration || (content.audioTimestamps && content.audioTimestamps.length > 0)) && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Completion Content</span>
              {content.duration && <p className="text-[13px] text-gray-500">Duration: {content.duration}</p>}
              {content.audioTimestamps && (
                <div className="mt-1 space-y-1.5">
                  {mergeTimestamps(content.audioTimestamps).map((ts, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">{ts.timestamp}</span>
                      <span className="text-gray-600 dark:text-gray-300 text-xs">{ts.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* For Accordion */}
      {content.subtopics && (
        <div className="space-y-3">
          {content.subtopics.map((sub, sIdx) => (
            <div key={sIdx} className="p-2.5 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 rounded">
              <h5 className="font-semibold text-emerald-800 dark:text-emerald-400 text-[13px] mb-1">{sub.title}</h5>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">{sub.description}</p>
              {sub.audioTimestamps && sub.audioTimestamps.length > 0 && (
                <div className="space-y-1 pl-2 border-l-2 border-emerald-200 dark:border-emerald-800/50">
                  {sub.audioTimestamps.map((ts, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-[10px] px-1 bg-emerald-100 dark:bg-emerald-900/40 rounded text-emerald-700 dark:text-emerald-300">{ts.timestamp}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{ts.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RegenerateCommentModal = ({ isOpen, onClose, onConfirm, title }) => {
  const [comment, setComment] = useState("");
  useEffect(() => {
    if (isOpen) setComment("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className={`${CARD_BASE} w-full max-w-lg p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary dark:text-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title || "Regeneration Details"}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What exactly do you want the AI to change or generate?
          </label>
          <textarea
            autoFocus
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g., 'Make it more detailed', 'Make it funny', 'Focus on practical examples'"
            className={`${INPUT_BASE} resize-none`}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={() => { onConfirm(comment); onClose(); }} className={BTN_PRIMARY}>
            <Sparkles className="w-4 h-4" />
            Regenerate Now
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Topic item in the course structure display
 */
const TopicItem = ({ topic, index, onUpdate, onDelete, isExpanded, onToggle, hideSelection, isContentGenerated, courseContext, onContentRegenerated, contentStyle, forceAudioCourse, onOpenRegenerateModal }) => {
  const isDeselected = topic.isSelected === false;

  const navigate = useNavigate();
  const [regenerateNode, { isLoading }] = useNewCourseRegenerateNodeMutation();
  const [regenerateNodeContent, { isLoading: isGenerating }] = useNewCourseRegenerateNodeContentMutation();

  const handleRegenerate = async (comment) => {
    try {
      const persisted = JSON.parse(sessionStorage.getItem('courseGeneratorState')) || {};
      const topicTypes = persisted.topicTypes || ["video", "audio", "general", "accordion", "multislides"];
      const assignmentTypes = persisted.assignmentTypes || ["regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"];
      const res = await regenerateNode({ courseContext, nodeType: "topic", nodeData: topic, contentStyle, forceAudioCourse, comment, topicTypes, assignmentTypes }).unwrap();
      if (res.success && res.data) {
        onUpdate({ ...topic, ...res.data });
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleRegenerateContent = async (comment) => {
    try {
      const res = await regenerateNodeContent({ nodeType: "topic", nodeData: topic, contentStyle, forceAudioCourse, comment }).unwrap();
      if (res.success && res.data) {
        onUpdate({
          ...topic,
          contentGenerated: res.data.contentGenerated,
          slides: res.data.slides || topic.slides
        });
        if (onContentRegenerated) onContentRegenerated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const typeConfig = {
    video: { icon: Video, color: "text-rose-500 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20", label: "Video" },
    audio: { icon: Headphones, color: "text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20", label: "Audio" },
    general: { icon: AlignLeft, color: "text-gray-500 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700", label: "General" },
    accordion: { icon: ListTree, color: "text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20", label: "Accordion" },
    multislides: { icon: Presentation, color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-500 dark:bg-amber-500/10 dark:border-amber-500/20", label: "Slides" },
  };

  const config = typeConfig[topic.topicType?.toLowerCase()] || typeConfig.general;
  const TypeIcon = config.icon;
  const hasContent = !!topic.contentGenerated;

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center gap-2 py-2.5 px-3 rounded-lg transition-colors group"
      >
        {!hideSelection && (
          <input
            type="checkbox"
            checked={topic.isSelected ?? true}
            onChange={(e) => onUpdate({ ...topic, isSelected: e.target.checked })}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600 outline-none cursor-pointer flex-shrink-0"
          />
        )}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center pl-1">
          <EditableTitle
            title={topic.topicTitle}
            onSave={(newTitle) => onUpdate({ ...topic, topicTitle: newTitle })}
            className="text-sm font-medium text-gray-800 dark:text-gray-200"
          />
          {topic.topicDescription && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 pr-4 leading-relaxed tracking-wide whitespace-pre-wrap">
              {stripHtmlStructured(topic.topicDescription)}
            </p>
          )}

          {/* Tags (Images & Code Blocks) */}
          {topic.tags && Array.isArray(topic.tags) && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {topic.tags.map((tag, tIdx) => (
                <div key={tIdx} className="max-w-full">
                  {tag.type === "image" && (
                    <div className="flex flex-col gap-1 max-w-[280px]">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-lightGreen dark:bg-forestGreen/20 border border-violet-100 dark:border-violet-800 text-[10px] text-leafGreen dark:text-violet-300">
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate" title={tag.prompt}>{tag.prompt}</span>
                      </div>
                      {(tag.detailed_script || tag.imageDescription) && (
                        <p className="text-[9px] text-gray-500 dark:text-gray-400 italic px-1 line-clamp-2 leading-tight" title={tag.detailed_script || tag.imageDescription}>
                          Script: {tag.detailed_script || tag.imageDescription}
                        </p>
                      )}
                    </div>
                  )}
                  {tag.type === "code" && (
                    <div className="flex flex-col gap-1 p-1.5 rounded-md bg-gray-900 border border-gray-700 w-full overflow-hidden min-w-[120px]">
                      <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-1">
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-tighter">{tag.language}</span>
                      </div>
                      <pre className="text-[9px] font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                        <code>{tag.content}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 pl-2">
          {/* Type Badge */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
            <TypeIcon className="w-3 h-3" />
            {config.label}
          </div>

          {topic.isImportant && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-semibold uppercase tracking-wider text-rose-600 bg-rose-100 border-rose-200 dark:bg-rose-900/40 dark:border-rose-800 dark:text-rose-300">
              <Sparkles className="w-3 h-3" />
              Core
            </div>
          )}

          {/* Duration */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 px-2.5 py-1 rounded-full">
            <Timer className="w-3 h-3" />
            {topic.topicDuration}
          </div>

          {isContentGenerated ? (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenRegenerateModal(`Refine Content for "${topic.topicTitle}"`, handleRegenerateContent); }}
              disabled={isGenerating}
              className="p-1 rounded text-orange-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all ml-1"
              title="Regenerate topic deeper content"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenRegenerateModal(`Regenerate "${topic.topicTitle}"`, handleRegenerate); }}
              disabled={isLoading}
              className="p-1 rounded text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all ml-1"
              title="Regenerate topic basic details"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ml-1"
            title="Delete topic"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {hasContent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/generate-course/topic", { state: { topic } });
              }}
              className="p-1 rounded text-primary/80 hover:text-primary hover:bg-lightGreen dark:hover:bg-lightGreen/30 transition-all"
              title="View full topic content"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

        </div>
      </div>

      {/* Topic Quiz Display */}
      {topic.topicQuiz && (
        <div className="ml-10 mt-1 mb-2 p-2.5 rounded border border-amber-200/50 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-900/10 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {!hideSelection && (
                <input
                  type="checkbox"
                  checked={topic.topicQuiz.isSelected ?? true}
                  onChange={(e) => onUpdate({ ...topic, topicQuiz: { ...topic.topicQuiz, isSelected: e.target.checked } })}
                  onClick={e => e.stopPropagation()}
                  className="w-3 h-3 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                />
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {topic.topicQuiz.quizTitle || "Topic Quiz"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-amber-600/80 dark:text-amber-400/80 pl-3">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {topic.topicQuiz.durationMinutes || 10} min</span>
              <span>Pass: {topic.topicQuiz.passingMarks || 60}%</span>
              {topic.topicQuiz.questions && <span className="font-semibold">{topic.topicQuiz.questions.length} Qs</span>}
            </div>
          </div>
          {isContentGenerated && topic.topicQuiz.questions && topic.topicQuiz.questions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/generate-course/quiz", { state: { quiz: topic.topicQuiz } });
              }}
              className="p-1 rounded text-amber-500 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all font-semibold"
              title="View topic quiz content"
            >
              View Topic Quiz
            </button>
          )}
        </div>
      )}

      {/* Topic Assignment Display */}
      {topic.topicAssignment && (
        <div className="ml-10 mt-1 mb-2 p-2.5 rounded border border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-900/10 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {!hideSelection && (
                <input
                  type="checkbox"
                  checked={topic.topicAssignment.isSelected ?? true}
                  onChange={(e) => onUpdate({ ...topic, topicAssignment: { ...topic.topicAssignment, isSelected: e.target.checked } })}
                  onClick={e => e.stopPropagation()}
                  className="w-3 h-3 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {topic.topicAssignment.assignmentTitle || "Topic Assignment"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-emerald-600/80 dark:text-emerald-400/80 pl-3">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {topic.topicAssignment.durationHours || 1} hr</span>
              <span>Score: {topic.topicAssignment.maxScore || 100}</span>
              <span className="capitalize">{(topic.topicAssignment.assignmentType || "Regular").replace(/_/g, ' ')}</span>
            </div>
          </div>
          {isContentGenerated && topic.topicAssignment.description && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/generate-course/assignment", { state: { assignment: topic.topicAssignment } });
              }}
              className="p-1 rounded text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all font-semibold"
              title="View topic assignment content"
            >
              View Topic Assignment
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Utility to format minutes into a human-readable duration string
 */
const formatDuration = (totalMinutes) => {
  if (totalMinutes <= 0) return "0min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let result = "";
  if (hours > 0) {
    result += `${hours}hr`;
  }
  if (minutes > 0) {
    if (result) result += " ";
    result += `${minutes}min`;
  }
  return result || "0min";
};

/**
 * Recalculates all durations in the course structure (Topic -> Module -> Session -> Course)
 */
const recalculateCourseDurations = (courseData) => {
  if (!courseData || !courseData.sessions) return courseData;

  const updatedSessions = courseData.sessions.map(session => {
    const updatedModules = (session.modules || []).map(module => {
      const updatedTopics = (module.topics || []).map(topic => {
        let topicMinutes = 0;
        if (topic.topicType === "multislides" && topic.slides && Array.isArray(topic.slides)) {
          topicMinutes = topic.slides.reduce((sum, slide) => sum + (parseInt(slide.slideDurationMinutes) || 0), 0);
        } else {
          topicMinutes = parseInt(topic.topicDurationMinutes) || 0;
        }
        return {
          ...topic,
          topicDurationMinutes: topicMinutes,
          topicDuration: formatDuration(topicMinutes)
        };
      });
      const moduleMinutes = updatedTopics.reduce((sum, t) => sum + (t.isSelected !== false ? t.topicDurationMinutes : 0), 0);
      return {
        ...module,
        topics: updatedTopics,
        moduleDurationMinutes: moduleMinutes,
        moduleDuration: formatDuration(moduleMinutes)
      };
    });
    const sessionMinutes = updatedModules.reduce((sum, m) => sum + (m.isSelected !== false ? m.moduleDurationMinutes : 0), 0);
    return {
      ...session,
      modules: updatedModules,
      sessionDurationMinutes: sessionMinutes,
      sessionDuration: formatDuration(sessionMinutes)
    };
  });

  const totalCourseMinutes = updatedSessions.reduce((sum, s) => sum + (s.isSelected !== false ? s.sessionDurationMinutes : 0), 0);

  return {
    ...courseData,
    sessions: updatedSessions,
    totalDurationMinutes: totalCourseMinutes,
    totalDuration: formatDuration(totalCourseMinutes)
  };
};

/**
 * Module card inside a session
 */
const ModuleCard = ({ module, moduleIndex, onUpdate, onDelete, isExpanded, onToggle, hideSelection, isContentGenerated, courseContext, onContentRegenerated, contentStyle, forceAudioCourse, onOpenRegenerateModal }) => {
  const isDeselected = module.isSelected === false;

  const navigate = useNavigate();
  const [expandedTopic, setExpandedTopic] = useState(0);
  const [regenerateQuiz, { isLoading: isRegeneratingQuiz }] = useNewCourseRegenerateQuizMutation();
  const [regenerateAssignment, { isLoading: isRegeneratingAssignment }] = useNewCourseRegenerateAssignmentMutation();

  const handleRegenerateAssignment = async (comment) => {
    try {
      const persisted = JSON.parse(sessionStorage.getItem('courseGeneratorState')) || {};
      const assignmentTypes = persisted.assignmentTypes || ["regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"];
      const res = await regenerateAssignment({ moduleData: module, contentStyle, comment, assignmentTypes }).unwrap();
      if (res.success && res.data) {
        onUpdate({ ...module, assignment: res.data });
        if (onContentRegenerated) onContentRegenerated();
        toast.success("Assignment regenerated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(formatErrorMsg(err, "Failed to regenerate assignment"));
    }
  };

  const handleRegenerateQuiz = async (comment) => {
    try {
      const persisted = JSON.parse(sessionStorage.getItem('courseGeneratorState')) || {};
      const quizTypes = persisted.quizTypes || ["mcq", "complete_the_sentence", "dragdrop", "realword", "summarize", "bestoption", "arrangeorder", "audiotoscript", "videotoscript", "imagetoscript", "video_pause", "audio_pause"];
      const res = await regenerateQuiz({ moduleData: module, contentStyle, comment, quizTypes }).unwrap();
      if (res.success && res.data) {
        onUpdate({ ...module, quiz: res.data });
        if (onContentRegenerated) onContentRegenerated();
        toast.success("Quiz regenerated successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error(formatErrorMsg(err, "Failed to regenerate quiz"));
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden bg-white/50 dark:bg-gray-800/30 transition-all duration-200">
      {/* Module header */}
      <div
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-colors cursor-pointer group/module"
      >
        {!hideSelection && (
          <input
            type="checkbox"
            checked={module.isSelected ?? true}
            onChange={(e) => {
              const checked = e.target.checked;
              onUpdate({
                ...module,
                isSelected: checked,
                quiz: module.quiz ? { ...module.quiz, isSelected: checked } : undefined,
                assignment: module.assignment ? { ...module.assignment, isSelected: checked } : undefined,
                topics: module.topics ? module.topics.map(t => ({
                  ...t,
                  isSelected: checked,
                  topicQuiz: t.topicQuiz ? { ...t.topicQuiz, isSelected: checked } : undefined,
                  topicAssignment: t.topicAssignment ? { ...t.topicAssignment, isSelected: checked } : undefined
                })) : []
              });
            }}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 mr-1 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600 outline-none cursor-pointer flex-shrink-0"
          />
        )}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
          M{moduleIndex + 1}
        </div>
        <div className="flex-1 min-w-0 pl-1">
          <EditableTitle
            title={module.moduleTitle}
            onSave={(newTitle) => onUpdate({ ...module, moduleTitle: newTitle })}
            className="text-sm font-semibold text-gray-800 dark:text-gray-200"
          />
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {module.moduleDuration}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <LayoutList className="w-3 h-3" />
              {module.topics?.filter(t => t.isSelected !== false).length || 0} topics
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ml-1"
          title="Delete module"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex-shrink-0 text-gray-400 w-5 flex justify-center ml-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Topics list */}
      {isExpanded && module.topics && module.topics.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-700/30">
          <div className="mt-2 space-y-0.5">
            {module.topics.map((topic, tIdx) => (
              <TopicItem
                key={tIdx}
                topic={topic}
                index={tIdx}
                isExpanded={expandedTopic === tIdx}
                onToggle={() => setExpandedTopic(expandedTopic === tIdx ? null : tIdx)}
                onUpdate={(updatedTopic) => {
                  const newTopics = [...module.topics];
                  newTopics[tIdx] = updatedTopic;
                  onUpdate({ ...module, topics: newTopics });
                }}
                onDelete={() => {
                  const newTopics = module.topics.filter((_, i) => i !== tIdx);
                  onUpdate({ ...module, topics: newTopics });
                }}
                hideSelection={hideSelection}
                isContentGenerated={isContentGenerated}
                courseContext={courseContext}
                onContentRegenerated={onContentRegenerated}
                contentStyle={contentStyle}
                forceAudioCourse={forceAudioCourse}
                onOpenRegenerateModal={onOpenRegenerateModal}
              />
            ))}
          </div>

          {/* Quiz Display */}
          {module.quiz && (
            <div className="mt-3 mx-3 mb-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {!hideSelection && (
                    <input
                      type="checkbox"
                      checked={module.quiz.isSelected ?? true}
                      onChange={(e) => onUpdate({ ...module, quiz: { ...module.quiz, isSelected: e.target.checked } })}
                      onClick={e => e.stopPropagation()}
                      className="w-3.5 h-3.5 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                    />
                  )}
                  <div className="w-6 h-6 rounded-md bg-amber-400/20 dark:bg-amber-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h5 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    {module.quiz.quizTitle || "Module Quiz"}
                  </h5>
                </div>
                <div className="flex items-center gap-1">
                  {isContentGenerated && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenRegenerateModal(`Regenerate Quiz for "${module.moduleTitle}"`, handleRegenerateQuiz); }}
                      disabled={isRegeneratingQuiz}
                      className="p-1 rounded text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all flex items-center gap-1"
                      title="Regenerate quiz questions"
                    >
                      {isRegeneratingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {isContentGenerated && module.quiz.questions && module.quiz.questions.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/generate-course/quiz", { state: { quiz: module.quiz } });
                      }}
                      className="p-1 rounded text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all flex items-center gap-1"
                      title="View full quiz content"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-amber-700 dark:text-amber-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {module.quiz.durationMinutes || 15} min
                </span>
                <span>Pass: {module.quiz.passingMarks || 60}%</span>
                <span>Attempts: {module.quiz.maxAttempts || 3}</span>
                {module.quiz.questions && (
                  <span className="font-semibold">{module.quiz.questions.length} Questions</span>
                )}
              </div>
              {isContentGenerated && module.quiz.questions && module.quiz.questions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/40">
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(module.quiz.questions.map(q => q.type))].map((type, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-200/60 dark:bg-amber-800/30 text-amber-800 dark:text-amber-300">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assignment Display */}
          {module.assignment && (
            <div className="mt-3 mx-3 mb-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 border border-emerald-200 dark:border-emerald-800/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {!hideSelection && (
                    <input
                      type="checkbox"
                      checked={module.assignment.isSelected ?? true}
                      onChange={(e) => onUpdate({ ...module, assignment: { ...module.assignment, isSelected: e.target.checked } })}
                      onClick={e => e.stopPropagation()}
                      className="w-3.5 h-3.5 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  )}
                  <div className="w-6 h-6 rounded-lg bg-emerald-200/50 dark:bg-emerald-800/30 flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    {module.assignment.assignmentTitle || module.assignment.title || "Module Assignment"}
                  </h5>
                </div>
                <div className="flex items-center gap-1">
                  {isContentGenerated && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenRegenerateModal(`Regenerate Assignment for "${module.moduleTitle}"`, handleRegenerateAssignment); }}
                      disabled={isRegeneratingAssignment}
                      className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-1"
                      title="Regenerate assignment details"
                    >
                      {isRegeneratingAssignment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {isContentGenerated && (module.assignment.description || module.assignment.regularInstructions || module.assignment.matchingData || module.assignment.trueFalseData || module.assignment.fillBlanksData || module.assignment.paragraph) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/generate-course/assignment", { state: { assignment: module.assignment } });
                      }}
                      className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center gap-1"
                      title="View full assignment content"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-emerald-700 dark:text-emerald-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {module.assignment.durationHours || module.assignment.daysToComplete || 7} {module.assignment.durationHours ? 'hr' : 'Days'}
                </span>
                <span>Max Score: {module.assignment.maxScore || 100}</span>
                <span className="capitalize">Type: {(module.assignment.assignmentType || module.assignment.category || "Regular").replace(/_/g, ' ')}</span>
              </div>
              {isContentGenerated && (module.assignment.description || module.assignment.regularInstructions) && (
                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/40">
                  <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">{module.assignment.description || module.assignment.regularInstructions}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Session accordion in the course structure
 */
const SessionCard = ({ session, sessionIndex, onUpdate, onDelete, isExpanded, onToggle, hideSelection, isContentGenerated, courseContext, onContentRegenerated, contentStyle, forceAudioCourse, onOpenRegenerateModal }) => {
  const isDeselected = session.isSelected === false;

  const [expandedModule, setExpandedModule] = useState(0);

  const totalModules = session.modules?.filter(m => m.isSelected !== false).length || 0;
  const totalTopics =
    session.modules?.filter(m => m.isSelected !== false).reduce(
      (acc, m) => acc + (m.topics?.filter(t => t.isSelected !== false).length || 0),
      0
    ) || 0;

  return (
    <div
      className={` overflow-hidden transition-all duration-300 rounded-md border border-gray-200`}
      style={{ animationDelay: `${sessionIndex * 150}ms` }}
    >
      {/* Session header */}
      <div
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors cursor-pointer group/session"
      >
        {!hideSelection && (
          <input
            type="checkbox"
            checked={session.isSelected ?? true}
            onChange={(e) => {
              const checked = e.target.checked;
              onUpdate({
                ...session,
                isSelected: checked,
                modules: session.modules ? session.modules.map(m => ({
                  ...m,
                  isSelected: checked,
                  quiz: m.quiz ? { ...m.quiz, isSelected: checked } : undefined,
                  assignment: m.assignment ? { ...m.assignment, isSelected: checked } : undefined,
                  topics: m.topics ? m.topics.map(t => ({
                    ...t,
                    isSelected: checked,
                    topicQuiz: t.topicQuiz ? { ...t.topicQuiz, isSelected: checked } : undefined,
                    topicAssignment: t.topicAssignment ? { ...t.topicAssignment, isSelected: checked } : undefined
                  })) : []
                })) : []
              });
            }}
            onClick={e => e.stopPropagation()}
            className="w-5 h-5 mr-1 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600 outline-none cursor-pointer flex-shrink-0"
          />
        )}
        {/* Session number badge */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md text-white`}>
          <span className="text-lg font-bold">
            {String(sessionIndex + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="flex-1 min-w-0 pl-1">
          <EditableTitle
            title={session.sessionTitle}
            onSave={(newTitle) => onUpdate({ ...session, sessionTitle: newTitle })}
            className="text-lg font-bold text-gray-900 dark:text-white"
          />
          <div className="flex items-center gap-4 mt-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {session.sessionDuration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              {totalModules} modules
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {totalTopics} topics
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all mx-2"
          title="Delete session"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 transition-transform duration-200">
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"
              }`}
          />
        </div>
      </div>

      {/* Modules list */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-700/30 pt-3">
          {session.modules?.map((module, mIdx) => (
            <ModuleCard
              key={mIdx}
              module={module}
              moduleIndex={mIdx}
              isExpanded={expandedModule === mIdx}
              onToggle={() => setExpandedModule(expandedModule === mIdx ? null : mIdx)}
              onUpdate={(updatedModule) => {
                const newModules = [...session.modules];
                newModules[mIdx] = updatedModule;
                onUpdate({ ...session, modules: newModules });
              }}
              onDelete={() => {
                const newModules = session.modules.filter((_, i) => i !== mIdx);
                onUpdate({ ...session, modules: newModules });
              }}
              hideSelection={hideSelection}
              isContentGenerated={isContentGenerated}
              courseContext={courseContext}
              onContentRegenerated={onContentRegenerated}
              contentStyle={contentStyle}
              forceAudioCourse={forceAudioCourse}
              onOpenRegenerateModal={onOpenRegenerateModal}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Stats bar showing course overview metrics
 */
const CourseStats = ({ courseData }) => {
  const selectedSessions = courseData.sessions?.filter(s => s.isSelected !== false) || [];
  const totalSessions = selectedSessions.length;
  
  let totalModules = 0;
  let totalTopics = 0;

  selectedSessions.forEach(s => {
    const selectedModules = (s.modules || []).filter(m => m.isSelected !== false);
    totalModules += selectedModules.length;
    
    selectedModules.forEach(m => {
      const selectedTopics = (m.topics || []).filter(t => t.isSelected !== false);
      totalTopics += selectedTopics.length;
    });
  });

  const stats = [
    {
      label: "DURATION",
      value: courseData.totalDuration || "0 hrs",
    },
    {
      label: "SESSIONS",
      value: totalSessions,
    },
    {
      label: "MODULES",
      value: totalModules,
    },
    {
      label: "TOPICS",
      value: totalTopics,
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`flex-1 flex flex-col justify-center px-5 py-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-md min-w-[110px] ${idx === 0 ? 'border-l-4 border-l-slate-800 dark:border-l-slate-300' : ''}`}
        >
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-2 uppercase">
            {stat.label}
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

function NewCourseGenerator() {
  // ── Helpers to restore persisted state ─────────────────────────────────
  const getPersistedState = () => {
    try {
      const stored = sessionStorage.getItem("courseGeneratorState");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const persisted = getPersistedState();

  // ── State ─────────────────────────────────────────────────────────────
  const allTopicTypes = ["video", "audio", "general", "accordion", "multislides"];
  const allQuizTypes = ["mcq", "complete_the_sentence", "dragdrop", "realword", "summarize", "bestoption", "arrangeorder", "audiotoscript", "videotoscript", "imagetoscript", "video_pause", "audio_pause"];
  const allAssignmentTypes = ["regular", "matching", "true_false", "fill_in_the_blanks", "paragraph_writing"];

  const [prompt, setPrompt] = useState(persisted?.prompt || "");
  const [courseType, setCourseType] = useState(persisted?.courseType || "quick");
  const [topicTypes, setTopicTypes] = useState(persisted?.topicTypes || allTopicTypes);
  const [quizTypes, setQuizTypes] = useState(persisted?.quizTypes || allQuizTypes);
  const [assignmentTypes, setAssignmentTypes] = useState(persisted?.assignmentTypes || allAssignmentTypes);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [courseData, setCourseData] = useState(persisted?.courseData || null);
  const [expandedSession, setExpandedSession] = useState(persisted?.expandedSession ?? 0);
  const [isCourseSaved, setIsCourseSaved] = useState(persisted?.isCourseSaved || false);
  const [courseId, setCourseId] = useState(persisted?.courseId || null);
  const [isContentGenerated, setIsContentGenerated] = useState(persisted?.isContentGenerated || false);
  const [isContentSaved, setIsContentSaved] = useState(persisted?.isContentSaved || false);
  const [contentStyle, setContentStyle] = useState(persisted?.contentStyle || "professional");
  const [forceAudioCourse, setForceAudioCourse] = useState(persisted?.forceAudioCourse || false);
  const [isSavingAllContent, setIsSavingAllContent] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const [currentStep, setCurrentStep] = useState(persisted?.courseData ? 2 : 1);

  const [regenModalConfig, setRegenModalConfig] = useState(null);
  const handleOpenRegenerateModal = useCallback((title, onConfirm) => {
    setRegenModalConfig({ title, onConfirm });
  }, []);

  const fileInputRef = useRef(null);

  // ── Persist state to sessionStorage on change ─────────────────────────
  useEffect(() => {
    const stateToSave = {
      prompt,
      courseType,
      topicTypes,
      quizTypes,
      assignmentTypes,
      courseData,
      expandedSession,
      isCourseSaved,
      courseId,
      isContentGenerated,
      isContentSaved,
      contentStyle,
      forceAudioCourse,
    };
    try {
      sessionStorage.setItem("courseGeneratorState", JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Failed to persist course generator state:", e);
    }
  }, [prompt, courseType, topicTypes, quizTypes, assignmentTypes, courseData, expandedSession, isCourseSaved, courseId, isContentGenerated, isContentSaved, contentStyle, forceAudioCourse]);

  // RTK Query mutation hook
  const [newCourseGenerate, { isLoading }] = useNewCourseGenerateMutation();
  const [newCourseSave, { isLoading: isSaving }] = useNewCourseSaveMutation();
  const [newCourseGenerateContent, { isLoading: isGeneratingContent }] = useNewCourseGenerateContentMutation();
  const [newCourseSaveContent, { isLoading: isSavingContent }] = useNewCourseSaveContentMutation();
  const [newCourseSaveQuiz] = useNewCourseSaveQuizContentMutation();
  const [newCourseSaveAssignment] = useNewCourseSaveAssignmentContentMutation();

  // ── File Handling ─────────────────────────────────────────────────────

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF and DOC/DOCX files are accepted.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      return;
    }

    setUploadedFile(file);
    // Reset file input
    e.target.value = "";
  }, []);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // ── Course Generation ─────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a course prompt.");
      return;
    }

    if (!topicTypes.length) {
      toast.error("Please select at least one topic type.");
      return;
    }

    if (!quizTypes.length) {
      toast.error("Please select at least one quiz question type.");
      return;
    }

    if (!assignmentTypes.length) {
      toast.error("Please select at least one assignment type.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("prompt", prompt.trim());
      formData.append("courseType", courseType);
      formData.append("contentStyle", contentStyle);
      formData.append("forceAudioCourse", forceAudioCourse);
      formData.append("topicTypes", JSON.stringify(topicTypes));
      formData.append("quizTypes", JSON.stringify(quizTypes));
      formData.append("assignmentTypes", JSON.stringify(assignmentTypes));

      if (uploadedFile) {
        formData.append("referenceFile", uploadedFile);
      }

      const response = await newCourseGenerate(formData).unwrap();

      if (response?.success && response?.data) {
        setCourseData(recalculateCourseDurations(response.data));
        setExpandedSession(0);
        setIsCourseSaved(false);
        setCourseId(null);
        setIsContentGenerated(false);
        setIsContentSaved(false);
      } else {
        throw new Error(response?.error || "Failed to generate course");
      }
    } catch (err) {
      console.error("Course generation error:", err);
      toast.error(formatErrorMsg(err, "Failed to generate course. Please try again."));
    }
  }, [prompt, courseType, uploadedFile, newCourseGenerate, contentStyle, forceAudioCourse, topicTypes, quizTypes, assignmentTypes]);

  const handleRegenerate = useCallback(() => {
    setCourseData(null);
    handleGenerate();
  }, [handleGenerate]);

  const handleReset = useCallback(() => {
    setCourseData(null);
    setPrompt("");
    setCourseType("quick");
    setUploadedFile(null);
    setExpandedSession(0);
    setIsCourseSaved(false);
    setCourseId(null);
    setIsContentGenerated(false);
    setIsContentSaved(false);
    setCurrentStep(1);
    sessionStorage.removeItem("courseGeneratorState");
  }, []);

  const handleSaveCourse = async () => {
    if (!courseData) return;

    try {
      const response = await newCourseSave({ courseData, courseId }).unwrap();

      if (response?.success) {
        setIsCourseSaved(true);
        if (response.courseId) setCourseId(response.courseId);
        if (response.data) setCourseData(recalculateCourseDurations(response.data));
      } else {
        throw new Error(response?.error || "Failed to save course structure");
      }
    } catch (err) {
      console.error("Course save error:", err);
      toast.error(formatErrorMsg(err, "Failed to save course."));
    }
  };

  const handleGenerateContent = async () => {
    if (!courseData) return;

    if (!quizTypes.length) {
      toast.error("Please select at least one quiz type before generating content.");
      return;
    }

    if (!assignmentTypes.length) {
      toast.error("Please select at least one assignment type before generating content.");
      return;
    }

    try {
      const response = await newCourseGenerateContent({
        courseData,
        contentStyle,
        forceAudioCourse,
        quizTypes,
        assignmentTypes
      }).unwrap();

      if (response?.success && response?.data) {
        setCourseData(recalculateCourseDurations(response.data));
        setIsContentGenerated(true);
      } else {
        throw new Error(response?.error || "Failed to generate course content");
      }
    } catch (err) {
      console.error("Content generation error:", err);
      toast.error(formatErrorMsg(err, "Failed to generate detailed content."));
    }
  };

  useEffect(() => {
    if (courseData && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [courseData, currentStep]);

  const handleSaveContent = async () => {
    if (!courseData || !courseId) return;

    setIsSavingAllContent(true);
    setSaveProgress("Preparing...");
    try {
      let isSuccess = true;
      let topicsCount = 0;
      let topicsSaved = 0;

      // First count valid topics to display progress
      for (const reqSession of courseData.sessions) {
        for (const reqModule of reqSession.modules) {
          for (const reqTopic of reqModule.topics) {
            if (reqTopic.contentGenerated) topicsCount++;
          }
        }
      }

      if (topicsCount === 0) {
        setIsContentSaved(true);
        setIsSavingAllContent(false);
        setSaveProgress("");
        return;
      }

      for (let sIdx = 0; sIdx < courseData.sessions.length; sIdx++) {
        const sessionData = courseData.sessions[sIdx];
        for (let mIdx = 0; mIdx < sessionData.modules.length; mIdx++) {
          const moduleData = sessionData.modules[mIdx];
          for (let tIdx = 0; tIdx < moduleData.topics.length; tIdx++) {
            const topicData = moduleData.topics[tIdx];

            if (topicData.contentGenerated) {
              topicsSaved++;
              setSaveProgress(`Saving Topic ${topicsSaved}/${topicsCount}...`);
              const payload = {
                courseId,
                courseTitle: courseData.courseTitle,
                sessionIndex: sIdx,
                moduleIndex: mIdx,
                topicIndex: tIdx,
                topicData,
              };

              const response = await newCourseSaveContent(payload).unwrap();
              if (!response?.success) {
                isSuccess = false;
              }
            }
          }
        }
      }

      if (isSuccess && topicsSaved > 0) {
        // Now save quizzes for each module
        setSaveProgress("Saving Quizzes...");
        console.log("📝 Saving quizzes...");
        for (let sIdx = 0; sIdx < courseData.sessions.length; sIdx++) {
          const sessionData = courseData.sessions[sIdx];
          for (let mIdx = 0; mIdx < sessionData.modules.length; mIdx++) {
            const moduleData = sessionData.modules[mIdx];
            const moduleQuizzes = [];
            if (moduleData.quiz && moduleData.quiz.isSelected !== false && moduleData.quiz.questions && moduleData.quiz.questions.length > 0) {
              moduleQuizzes.push(moduleData.quiz);
            }
            if (moduleData.topics) {
              for (let tIdx = 0; tIdx < moduleData.topics.length; tIdx++) {
                const topic = moduleData.topics[tIdx];
                if (topic.isSelected !== false && topic.topicQuiz && topic.topicQuiz.isSelected !== false && topic.topicQuiz.questions && topic.topicQuiz.questions.length > 0) {
                  moduleQuizzes.push({ ...topic.topicQuiz, topicSequenceNo: tIdx + 1 });
                }
              }
            }

            if (moduleQuizzes.length > 0) {
              try {
                await newCourseSaveQuiz({
                  courseId,
                  sessionIndex: sIdx,
                  moduleIndex: mIdx,
                  quizData: moduleQuizzes,
                }).unwrap();
                console.log(`✅ ${moduleQuizzes.length} Quiz(zes) saved for module ${mIdx + 1}`);
              } catch (quizErr) {
                console.error(`Quiz save error for module ${mIdx + 1}:`, quizErr);
              }
            }

            // Now save assignments
            setSaveProgress("Saving Assignments...");
            const moduleAssignments = [];
            if (moduleData.assignment && moduleData.assignment.isSelected !== false) {
              moduleAssignments.push(moduleData.assignment);
            }
            if (moduleData.topics) {
              for (let tIdx = 0; tIdx < moduleData.topics.length; tIdx++) {
                const topic = moduleData.topics[tIdx];
                if (topic.isSelected !== false && topic.topicAssignment && topic.topicAssignment.isSelected !== false) {
                  moduleAssignments.push({ ...topic.topicAssignment, topicSequenceNo: tIdx + 1 });
                }
              }
            }

            if (moduleAssignments.length > 0) {
              try {
                await newCourseSaveAssignment({
                  courseId,
                  sessionIndex: sIdx,
                  moduleIndex: mIdx,
                  assignmentData: moduleAssignments,
                }).unwrap();
                console.log(`✅ ${moduleAssignments.length} Assignment(s) saved for module ${mIdx + 1}`);
              } catch (assignErr) {
                console.error(`Assignment save error for module ${mIdx + 1}:`, assignErr);
              }
            }
          }
        }
        setIsContentSaved(true);
      } else {
        throw new Error("Failed to save all topic contents properly.");
      }
    } catch (err) {
      console.error("Content save error:", err);
      toast.error(formatErrorMsg(err, "Failed to save detailed content."));
    } finally {
      setIsSavingAllContent(false);
      setSaveProgress("");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  // return (
  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full bg-[#fdfdff] dark:bg-gray-950 flex flex-col overflow-x-hidden">
      {/* ─── Global Progress Header ───────────────────────────────────── */}
      <div className="w-full bg-white/70 dark:bg-gray-950/70 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/50 sticky top-0 z-50">
        <div className="w-full mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">AI Course Studio</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Next-Gen Curriculum Builder</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${currentStep === 1 ? 'bg-primary text-white shadow-lg shadow-primary/10 ring-4 ring-primary/10' : 'bg-emerald-500 text-white'}`}>
                {currentStep > 1 ? <CheckCircle2 className="w-3 h-3" /> : "1"}
              </div>
              <span className={`text-sm font-bold transition-colors ${currentStep === 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Setup Details</span>
            </div>
            <div className="w-12 h-[2px] bg-gray-100 dark:bg-gray-800 rounded-full"></div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${currentStep === 2 ? 'bg-primary text-white shadow-lg shadow-primary/10 ring-4 ring-primary/10' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                &ldquo;2&ldquo;
              </div>
              <span className={`text-sm font-bold transition-colors ${currentStep === 2 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Curriculum Plan</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
              title="Restart Builder"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full px-4 sm:px-8 py-4">
        {/* ─── Step 1: Full Page Setup Form ─────────────────────────────── */}

        {currentStep === 1 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* ── Left Column ── */}
              <div className="lg:col-span-8 space-y-5">

                {/* Course Prompt */}
                <div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Course Prompt</p>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the core learning objective, target audience, and key takeaways..."
                    rows={6}
                    className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-4 text-[14px] text-gray-700 dark:text-gray-200 placeholder-slate-300 dark:placeholder-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y shadow-sm"
                    disabled={isLoading}
                  />
                </div>



                {/* Topic Types */}
                <div>
                  <div className="flex items-end justify-between gap-3 mb-3">
                    <p className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Topic Types Selection</p>
                    {!topicTypes.length && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Select at least one</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allTopicTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={topicTypes.includes(type)}
                        onClick={() => {
                          if (topicTypes.includes(type)) setTopicTypes(topicTypes.filter(t => t !== type));
                          else setTopicTypes([...topicTypes, type]);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[13px] font-semibold transition-all duration-200 ${topicTypes.includes(type)
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-primary/60 hover:text-primary'
                          }`}
                      >
                        {type === 'video' && <Video className="w-3.5 h-3.5" />}
                        {type === 'audio' && <Headphones className="w-3.5 h-3.5" />}
                        {type === 'general' && <Layout className="w-3.5 h-3.5" />}
                        {type === 'accordion' && <Layers className="w-3.5 h-3.5" />}
                        {type === 'multislides' && <Presentation className="w-3.5 h-3.5" />}
                        <span className="capitalize">{type === 'multislides' ? 'Multi-slide' : type}</span>
                        {topicTypes.includes(type) ? (
                          <CheckCircle2 className="w-4 h-4 ml-1" />
                        ) : (
                          <Circle className="w-4 h-4 ml-1 opacity-70" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quiz Question Types */}
                <div className="pb-4">
                  <div className="flex items-end justify-between gap-3 mb-3">
                    <p className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Quiz Question Types</p>
                    {!quizTypes.length && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Select at least one</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-x-6">
                    {allQuizTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={quizTypes.includes(type)}
                        onClick={() => {
                          if (quizTypes.includes(type)) setQuizTypes(quizTypes.filter(t => t !== type));
                          else setQuizTypes([...quizTypes, type]);
                        }}
                        className={`w-full flex items-center gap-2.5 py-2.5 text-left border-b rounded-md px-1 transition-all duration-200 group ${quizTypes.includes(type)
                          ? 'border-slate-200 dark:border-gray-700 bg-lightGreen/40 dark:bg-forestGreen/20'
                          : 'border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-900/60'
                          }`}
                      >
                        {quizTypes.includes(type) ? (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-primary" />
                        ) : (
                          <Circle className="w-4 h-4 flex-shrink-0 text-slate-300 dark:text-gray-600" />
                        )}
                        <span className={`text-[13px] font-semibold leading-tight transition-colors ${quizTypes.includes(type) ? 'text-gray-900 dark:text-white' : 'text-slate-400 dark:text-gray-500'}`}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignment Types */}
                <div className="pb-4">
                  <div className="flex items-end justify-between gap-3 mb-3">
                    <p className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Assignment Types</p>
                    {!assignmentTypes.length && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Select at least one</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
                    {allAssignmentTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={assignmentTypes.includes(type)}
                        onClick={() => {
                          if (assignmentTypes.includes(type)) setAssignmentTypes(assignmentTypes.filter(t => t !== type));
                          else setAssignmentTypes([...assignmentTypes, type]);
                        }}
                        className={`w-full flex items-center gap-2.5 py-2.5 text-left border-b rounded-md px-1 transition-all duration-200 group ${assignmentTypes.includes(type)
                          ? 'border-slate-200 dark:border-gray-700 bg-lightGreen/40 dark:bg-forestGreen/20'
                          : 'border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-900/60'
                          }`}
                      >
                        {assignmentTypes.includes(type) ? (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-primary" />
                        ) : (
                          <Circle className="w-4 h-4 flex-shrink-0 text-slate-300 dark:text-gray-600" />
                        )}
                        <span className={`text-[13px] font-semibold leading-tight transition-colors ${assignmentTypes.includes(type) ? 'text-gray-900 dark:text-white' : 'text-slate-400 dark:text-gray-500'}`}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right Sidebar ── */}
              <div className="lg:col-span-4 space-y-4">

                {/* Reference PDF — full-height to match Course Prompt */}
                <div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Knowledge Base</p>
                  <div className="h-[162px]">
                    {!uploadedFile ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-2.5 px-4 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary/60 hover:bg-lightGreen/50 dark:hover:bg-forestGreen/20 transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-lightGreen dark:group-hover:bg-forestGreen/20 transition-colors">
                          <FileUp className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] font-semibold text-slate-600 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-primary transition-colors">Attach Reference PDF</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">PDF or DOCX · Max 10MB</p>
                        </div>
                      </button>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-4 rounded-xl border border-primary/40 dark:border-primary/20 bg-lightGreen/50 dark:bg-forestGreen/30">
                        <div className="w-9 h-9 rounded-lg bg-lightGreen dark:bg-forestGreen/20 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 text-center px-2 truncate w-full">{uploadedFile.name}</p>
                        <button onClick={removeFile} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                </div>

                {/* Course Type */}
                <div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3">Course Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "quick", label: "Quick Course", desc: "5-7 slides" },
                      { id: "complete", label: "Complete Course", desc: "15+ slides" }
                    ].map(type => (
                      <label
                        key={type.id}
                        className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 cursor-pointer transition-all duration-200 gap-2 ${courseType === type.id
                          ? "border-primary/40 bg-lightGreen dark:bg-forestGreen/20 dark:border-primary"
                          : "border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800"
                          }`}
                      >
                        <input type="radio" className="sr-only" checked={courseType === type.id} onChange={() => setCourseType(type.id)} />
                        <div className="text-center">
                          <p className={`text-[11px] font-bold leading-tight ${courseType === type.id ? 'text-leafGreen dark:text-primary/80' : 'text-slate-500 dark:text-gray-500'}`}>{type.label}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5">{type.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Generation Flavor */}
                <div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3">Generation Flavor</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "professional", label: "Professional", icon: Briefcase },
                      { id: "friendly", label: "Friendly", icon: Smile },
                      { id: "tutorial", label: "Tutorial", icon: GraduationCap },
                      { id: "story", label: "Storytelling", icon: BookOpen },
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => setContentStyle(style.id)}
                        className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border-2 transition-all duration-200 gap-2 ${contentStyle === style.id
                          ? "border-primary/40 bg-lightGreen dark:bg-forestGreen/20 dark:border-primary"
                          : "border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800"
                          }`}
                      >
                        <style.icon className={`w-5 h-5 ${contentStyle === style.id ? 'text-primary dark:text-primary' : 'text-slate-400 dark:text-gray-500'}`} />
                        <span className={`text-[11px] font-bold ${contentStyle === style.id ? 'text-leafGreen dark:text-primary/80' : 'text-slate-500 dark:text-gray-500'}`}>{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Toggle */}
                <div className="flex items-center justify-between py-4 px-1 border-t border-b border-slate-100 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-gray-100">Content Audio</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Generate Narration for All</p>
                  </div>
                  <button
                    onClick={() => setForceAudioCourse(!forceAudioCourse)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${forceAudioCourse ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-200 dark:bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${forceAudioCourse ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Generate Button */}
                <div className="space-y-2.5">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim() || !topicTypes.length || !quizTypes.length || !assignmentTypes.length}
                    className="w-full py-3 px-5 rounded-xl bg-primary hover:bg-leafGreen active:scale-[0.99] text-white text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Generating...</span></>
                    ) : (
                      <><Sparkles className="w-4 h-4" /><span>Generate Course Structure</span></>
                    )}
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

        {currentStep === 2 && courseData && (
          <div className="w-full animate-in fade-in zoom-in-95 duration-700">
            {/* Large Glass Morphic Header */}
            <div className="relative mb-12">
              <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-lightGreen0/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="grid grid-cols-1 lg:grid-cols-[65%_1fr] gap-8 lg:gap-10 items-start relative z-10">
                {/* Left Column */}
                <div className="min-w-0 pr-0 lg:pr-4">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">Draft Generated</span>
                    {isCourseSaved && <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800">Saved to Cloud</span>}
                  </div>
                  
                  <EditableTitle
                    title={courseData.courseTitle || "Course Title Missing"}
                    onSave={(newTitle) => {
                      setCourseData({ ...courseData, courseTitle: newTitle });
                      setIsCourseSaved(false);
                    }}
                    className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4"
                  />
                  
                  <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-10 max-w-3xl">
                    {courseData.courseDescription || "Description..."}
                  </p>

                  <CourseStats courseData={courseData} />
                </div>

                {/* Right Column / Preview Card */}
                <div className="w-full bg-[#f1f2ec] dark:bg-slate-800/80 rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex-shrink-0">
                   <div className="flex items-baseline gap-3 mb-2">
                     <span className="text-3xl font-black text-slate-900 dark:text-white">
                        ₹{Math.round((courseData.price || 4999) * (1 - (courseData.discount || 15) / 100))}
                     </span>
                     <span className="text-lg font-semibold text-slate-400 line-through">
                        ₹{courseData.price || 4999}
                     </span>
                     <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-600">
                        {courseData.discount || 15}% OFF
                     </span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">
                     INSTITUTIONAL LICENSE AVAILABLE
                   </p>

                   {/* Preview Video Script */}
                   <div className="bg-white/80 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800 mb-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-emerald-800 dark:text-emerald-500" />
                        <span className="text-xs font-black text-emerald-900 dark:text-emerald-400 tracking-wide">Preview Video Script</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "{courseData.previewVideoDescription || "[0:00-0:15] Inspiring intro scene... [0:15-0:45] Montage of course topics..."}"
                      </p>
                   </div>

                   {/* Thumbnail Script */}
                   <div className="bg-white/80 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-emerald-800 dark:text-emerald-500" />
                        <span className="text-xs font-black text-emerald-900 dark:text-emerald-400 tracking-wide">Thumbnail Script</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                        "{courseData.thumbnailDescription || "A high-contrast macro of a vellum texture overlaid with digital glyphs..."}"
                      </p>
                   </div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="w-full space-y-12">
                {/* Main curriculum structure */}
                <section>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Curriculum Draft v1.4</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">Last autosaved at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-4 sm:mt-0">
                      <button
                        onClick={handleSaveCourse}
                        disabled={isSaving || isCourseSaved}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 ${isCourseSaved ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-400 dark:text-indigo-600': 'bg-[#dce3f8] dark:bg-indigo-900/40 text-[#304880] dark:text-indigo-100 hover:bg-[#c9d3f0] dark:hover:bg-indigo-800/60'}`}
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {isSaving ? "Locking..." : isCourseSaved ? "Locked" : "Lock Blueprint"}
                      </button>

                      <button
                        onClick={handleGenerateContent}
                        disabled={!isCourseSaved || isGeneratingContent || isContentGenerated}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isContentGenerated ? 'hidden' : 'bg-[#0b338a] hover:bg-[#092970] text-white shadow-sm hover:shadow-md'}`}
                      >
                        {isGeneratingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                        {isGeneratingContent ? "Generating..." : isContentGenerated ? "Content Generated" : "Generate Content"}
                      </button>

                      {isContentGenerated && (
                        <button
                          onClick={handleSaveContent}
                          disabled={isSavingAllContent || isContentSaved}
                          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 ${isContentSaved ? 'bg-emerald-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white shadow-md'}`}
                        >
                          {isSavingAllContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          {isSavingAllContent ? (saveProgress || "Deploying...") : isContentSaved ? "Successfully Deployed" : "Finalize & Publish"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {courseData.sessions?.map((session, sIdx) => (
                      <SessionCard
                        key={sIdx}
                        session={session}
                        sessionIndex={sIdx}
                        isExpanded={expandedSession === sIdx}
                        onToggle={() => setExpandedSession(expandedSession === sIdx ? null : sIdx)}
                        onUpdate={(updatedSession) => {
                          const newSessions = [...courseData.sessions];
                          newSessions[sIdx] = updatedSession;
                          const updatedCourse = recalculateCourseDurations({ ...courseData, sessions: newSessions });
                          setCourseData(updatedCourse);
                          setIsCourseSaved(false);
                        }}
                        onDelete={() => {
                          const newSessions = [...courseData.sessions];
                          newSessions.splice(sIdx, 1);
                          const updatedCourse = recalculateCourseDurations({ ...courseData, sessions: newSessions });
                          setCourseData(updatedCourse);
                          setIsCourseSaved(false);
                        }}
                        hideSelection={isContentSaved}
                        isContentGenerated={isContentGenerated}
                        courseContext={{ courseTitle: courseData.courseTitle, courseDescription: courseData.courseDescription }}
                        onContentRegenerated={() => setIsContentSaved(false)}
                        contentStyle={contentStyle}
                        onOpenRegenerateModal={handleOpenRegenerateModal}
                      />
                    ))}
                  </div>
                </section>

                {/* AI Generated Marketing Assets */}
                {(courseData.thumbnailDescription || courseData.previewVideoDescription || courseData.course_faqs?.length > 0) && (
                  <section className="space-y-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4 px-2 mb-2">
                      <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">AI Asset Suite</h3>
                    </div>

                    {/* FAQs */}
                    {courseData.course_faqs?.length > 0 && (
                      <div className={`${CARD_BASE} p-8 border-none bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-950/10 dark:to-gray-900`}>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                            <HelpCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white">Diagnostic MCQ FAQs</h4>
                            <p className="text-sm text-gray-400 font-medium">Smart assessments to gauge student readiness</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {courseData.course_faqs.map((faq, fIdx) => (
                            <div key={fIdx} className="bg-white/50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm h-full flex flex-col">
                              <p className="text-sm font-black text-gray-800 dark:text-gray-200 mb-4">{faq.question}</p>
                              <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {faq.options?.map((opt, oIdx) => (
                                  <div key={oIdx} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-[12px] font-bold text-gray-500 border border-transparent hover:border-violet-200 transition-all flex items-center h-full">
                                    {String.fromCharCode(65 + oIdx)}. {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* SEO & Search Optimization */}
                <section className="space-y-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4 px-2 mb-2">
                    <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Search visibility</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Meta Title */}
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Meta Title</label>
                      <input
                        type="text"
                        value={courseData.meta_title || ""}
                        onChange={(e) => setCourseData({ ...courseData, meta_title: e.target.value })}
                        placeholder="Concise SEO title (max 60 chars)"
                        className="w-full bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-gray-200"
                        maxLength={60}
                      />
                    </div>

                    {/* Canonical Link */}
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Canonical Link</label>
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-bold">
                        <Link className="w-4 h-4" />
                        <span>/</span>
                        <input
                          type="text"
                          value={courseData.seo_canonical || ""}
                          onChange={(e) => setCourseData({ ...courseData, seo_canonical: e.target.value })}
                          placeholder="advanced-course-topic"
                          className="bg-transparent border-none outline-none flex-1 font-mono"
                        />
                      </div>
                    </div>

                    {/* Meta Keywords */}
                    <div className="md:col-span-2 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Meta Keywords</label>
                      <textarea
                        value={courseData.meta_keyword || ""}
                        onChange={(e) => setCourseData({ ...courseData, meta_keyword: e.target.value })}
                        placeholder="Comma-separated SEO keywords"
                        className="w-full bg-transparent text-sm font-bold text-gray-600 dark:text-gray-300 outline-none resize-none"
                        rows={2}
                      />
                    </div>

                    {/* Meta Description */}
                    <div className="md:col-span-2 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Meta Description</label>
                      <textarea
                        value={courseData.meta_description || ""}
                        onChange={(e) => setCourseData({ ...courseData, meta_description: e.target.value })}
                        placeholder="A compelling SEO meta description (max 160 chars)"
                        className="w-full bg-transparent text-sm font-bold text-gray-600 dark:text-gray-300 outline-none resize-none"
                        rows={3}
                        maxLength={160}
                      />
                    </div>

                    {/* SEO Image Alt */}
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">SEO Image Alt</label>
                      <input
                        type="text"
                        value={courseData.seo_image_alt || ""}
                        onChange={(e) => setCourseData({ ...courseData, seo_image_alt: e.target.value })}
                        placeholder="Alt text describing the SEO image"
                        className="w-full bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-gray-200"
                      />
                    </div>

                    {/* Open Graph Title */}
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Open Graph Title</label>
                      <input
                        type="text"
                        value={courseData.og_title || ""}
                        onChange={(e) => setCourseData({ ...courseData, og_title: e.target.value })}
                        placeholder="Open Graph title for social sharing"
                        className="w-full bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-gray-200"
                      />
                    </div>

                    {/* Open Graph Description */}
                    <div className="md:col-span-2 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Open Graph Description</label>
                      <textarea
                        value={courseData.og_description || ""}
                        onChange={(e) => setCourseData({ ...courseData, og_description: e.target.value })}
                        placeholder="Open Graph description for social sharing"
                        className="w-full bg-transparent text-sm font-bold text-gray-600 dark:text-gray-300 outline-none resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Open Graph Image Alt */}
                    <div className="md:col-span-2 p-5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Open Graph Image Alt</label>
                      <input
                        type="text"
                        value={courseData.og_image_alt || ""}
                        onChange={(e) => setCourseData({ ...courseData, og_image_alt: e.target.value })}
                        placeholder="Alt text for the Open Graph image"
                        className="w-full bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-gray-200"
                      />
                    </div>

                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator for transition */}
        {(isLoading || isGeneratingContent) && currentStep === 1 && (
          <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl flex flex-col items-center justify-center">
            <div className="w-32 h-32 relative mb-5">
              <div className="absolute inset-0 border-4 border-lightGreen dark:border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-4 rounded-full bg-lightGreen dark:bg-forestGreen/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Architecting Your Course</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Sit back while we build something incredible...</p>
          </div>
        )}
      </div>

        <RegenerateCommentModal
        isOpen={!!regenModalConfig}
        onClose={() => setRegenModalConfig(null)}
        onConfirm={regenModalConfig?.onConfirm}
        title={regenModalConfig?.title}
      />

      {/* ─── Global Styles ─── */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default NewCourseGenerator;