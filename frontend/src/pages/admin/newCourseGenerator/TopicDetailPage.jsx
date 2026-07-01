import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Video,
  Headphones,
  AlignLeft,
  ListTree,
  Presentation,
  Timer,
  ChevronDown,
  BookOpen,
  Sparkles,
  FileText,
  Link2,
  Code2,
  Image as ImageIcon,
  File,
} from "lucide-react";
import "./TopicContent.css";


// ─── Helpers ───────────────────────────────────────────────────────────────

const renderHtmlWithTags = (html, tags) => {
  if (!html) return "";
  let processedHtml = html;

  if (tags && Array.isArray(tags)) {
    tags.forEach((tag) => {
      const isImage = tag.type === "image";
      // Using inline styles and standard classes for the pills inside raw HTML
      const pillHtml = `<span class="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-bold border ${
        isImage
          ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800"
          : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800 font-mono"
      }">${tag.name}</span>`;

      const escapedTagName = tag.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(escapedTagName, "g");
      processedHtml = processedHtml.replace(regex, pillHtml);
    });
  }

  return processedHtml;
};


// ─── Tags Display (Images & Code Blocks) ───────────────────────────────────

const TagsDisplay = ({ tags }) => {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
  return (
    <div className="space-y-3 mt-4">
      {tags.map((tag, i) => (
        <div key={i} className="w-full">
          {tag.type === "image" && (
            <div>
              <div className="group relative overflow-hidden rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/50 dark:bg-violet-900/10 p-4 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-800 flex items-center justify-center flex-shrink-0 text-violet-600 dark:text-violet-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400 block mb-1 opacity-70">Visual Concept Prompt</span>
                    <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-relaxed italic font-medium mb-3">"{tag.prompt}"</p>
                    
                    {(tag.detailed_script || tag.imageDescription) && (
                      <div className="mt-4 pt-3 border-t border-violet-100 dark:border-violet-900/30">
                        <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 block mb-2">Detailed AI Generation Script</span>
                        <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed bg-white/50 dark:bg-gray-900/50 p-3 rounded-lg border border-violet-100/50 dark:border-violet-900/20 shadow-sm">
                          {tag.detailed_script || tag.imageDescription}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 block mt-2 opacity-75">
                📷 Image Tag - {tag.name}
              </span>
            </div>
          )}
          {tag.type === "code" && (
            <div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 shadow-inner w-full">
                <div className="flex items-center justify-between mb-3 border-b border-gray-800/50 pb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-500">{tag.language} snippet</span>
                </div>
                <pre className="text-[13px] font-mono text-emerald-300/90 overflow-x-auto custom-scrollbar leading-relaxed">
                  <code>{tag.content}</code>
                </pre>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mt-2 opacity-75">
                {'<>'} Code Tag - {tag.name}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Formatted Description (Handles #tag1# placeholders) ───────────────────

const FormattedDescription = ({ text, tags, className = "text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed" }) => {
  if (!text) return null;

  const processedHtml = renderHtmlWithTags(text, tags);

  return (
    <div
      className={`${className} theme-html-content`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};

// ─── Merge consecutive timestamps with same description ──────────────────────

const mergeTimestamps = (timestamps) => {
  if (!timestamps || timestamps.length === 0) return [];
  const merged = [{ ...timestamps[0] }];
  for (let i = 1; i < timestamps.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = timestamps[i];
    if (curr.description === prev.description) {
      const prevStart = prev.timestamp.split(" - ")[0];
      const currEnd = curr.timestamp.split(" - ")[1];
      prev.timestamp = `${prevStart} - ${currEnd}`;
    } else {
      merged.push({ ...curr });
    }
  }
  return merged;
};

// ─── Type definitions ────────────────────────────────────────────────────────

const TYPES = {
  video: { icon: Video, label: "Video", accent: "#e11d48", bg: "#fff1f2" },
  audio: { icon: Headphones, label: "Audio", accent: "#2563eb", bg: "#eff6ff" },
  general: { icon: AlignLeft, label: "General", accent: "#6b7280", bg: "#f9fafb" },
  accordion: { icon: ListTree, label: "Accordion", accent: "#059669", bg: "#ecfdf5" },
  multislides: { icon: Presentation, label: "Slides", accent: "#d97706", bg: "#fffbeb" },
};

const getType = (type) => TYPES[type?.toLowerCase()] || TYPES.general;

// ─── Collapsible Section ─────────────────────────────────────────────────────

const Section = ({ title, defaultOpen = true, count, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50/80 dark:bg-gray-900/50 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
          {title}
          {count != null && (
            <span className="ml-2 text-[11px] font-normal text-gray-400 dark:text-gray-500">
              ({count})
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="px-5 py-4 bg-white dark:bg-gray-950">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Timestamp List ──────────────────────────────────────────────────────────

const TimestampList = ({ timestamps, accent }) => {
  const merged = mergeTimestamps(timestamps);
  if (!merged.length) return null;

  return (
    <div className="space-y-0">
      {merged.map((ts, i) => (
        <div
          key={i}
          className="flex gap-3 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0"
        >
          <code
            className="flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded h-fit mt-0.5"
            style={{ background: accent + "12", color: accent }}
          >
            {ts.timestamp}
          </code>
          <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
            {ts.description}
          </p>
        </div>
      ))}
    </div>
  );
};

// ─── Content renderer based on type ──────────────────────────────────────────

const ContentBlock = ({ content, type }) => {
  if (!content) return null;
  const { accent } = getType(type);

  return (
    <div className="space-y-5">
      {/* Video / Audio timestamps */}
      {content.timestamps?.length > 0 && (
        <Section title="Timeline" count={mergeTimestamps(content.timestamps).length}>
          <TimestampList timestamps={content.timestamps} accent={accent} />
        </Section>
      )}

      {/* General description */}
      {content.description && !content.subtopics && (
        <div className="space-y-4">
          <FormattedDescription
            text={content.description}
            tags={content.tags}
            className="text-[13px] text-gray-600 dark:text-gray-400 leading-[1.8]"
          />

          {content.audioTimestamps?.length > 0 && (
            <Section title="Audio Breakdown" count={mergeTimestamps(content.audioTimestamps).length} defaultOpen={false}>
              <TimestampList timestamps={content.audioTimestamps} accent="#2563eb" />
            </Section>
          )}

          {content.duration && (
            <div className="flex items-center gap-2 text-[12px] text-gray-400 dark:text-gray-500">
              <Timer className="w-3.5 h-3.5" />
              Duration: {content.duration}
            </div>
          )}
        </div>
      )}

      {/* Accordion subtopics */}
      {content.subtopics?.length > 0 && (
        <div className="space-y-2">
          {content.subtopics.map((sub, i) => (
            <Section key={i} title={sub.title} defaultOpen={i === 0}>
              <div className="space-y-3">
                <div 
                  className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed theme-html-content"
                  dangerouslySetInnerHTML={{ __html: renderHtmlWithTags(sub.description, []) }}
                />
                {sub.audioTimestamps?.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <TimestampList timestamps={sub.audioTimestamps} accent="#059669" />
                  </div>
                )}
                {sub.duration && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-400">
                    <Timer className="w-3.5 h-3.5" />
                    {sub.duration}
                  </div>
                )}
              </div>
            </Section>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Materials Display ───────────────────────────────────────────────────────

const MaterialsDisplay = ({ materials }) => {
  if (!materials || !Array.isArray(materials) || materials.length === 0) return null;

  const getMaterialIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "pdf":
        return { icon: FileText, color: "text-red-500 dark:text-red-400", bg: "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30" };
      case "link":
        return { icon: Link2, color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30" };
      case "code":
        return { icon: Code2, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" };
      case "image":
        return { icon: ImageIcon, color: "text-violet-500 dark:text-violet-400", bg: "bg-violet-50/50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/30" };
      default:
        return { icon: File, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50/50 dark:bg-gray-900/10 border-gray-100 dark:border-gray-800/30" };
    }
  };

  return (
    <div className="space-y-3 mt-5">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        Auxiliary Study Materials
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {materials.map((mat, i) => {
          const { icon: Icon, color, bg } = getMaterialIcon(mat.material_type);
          return (
            <div
              key={i}
              className={`flex flex-col p-4 rounded-xl border ${bg} transition-all duration-300 hover:shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-60 text-gray-500 dark:text-gray-400 block">
                    {mat.material_type} Reference
                  </span>
                  <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-200 truncate block mt-0.5" title={mat.url || mat.codeLanguage || ""}>
                    {mat.url || (mat.codeLanguage ? `${mat.codeLanguage} snippet` : "Reference Code")}
                  </span>
                </div>
              </div>

              {mat.material_type === "code" && mat.code && (
                <div className="mt-3 rounded-lg bg-gray-950 border border-gray-900/50 p-3 overflow-hidden">
                  <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest block mb-1">
                    {mat.codeLanguage || "code"}
                  </span>
                  <pre className="text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-40 custom-scrollbar leading-relaxed">
                    <code>{mat.code}</code>
                  </pre>
                </div>
              )}

              {mat.material_type === "link" && mat.url && (
                <a
                  href={mat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/80 text-[11px] font-semibold text-blue-600 dark:text-blue-400 transition-colors text-center"
                >
                  Visit Reference Link
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Slide Card ──────────────────────────────────────────────────────────────

const SlideCard = ({ slide, index }) => {
  const t = getType(slide.slideType);
  const Icon = t.icon;

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
      {/* Slide header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50/60 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-800">
        <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {slide.slideTitle}
          </h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: t.bg, color: t.accent }}
          >
            <Icon className="w-3 h-3" />
            {t.label}
          </span>
          {slide.slideDuration && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
              <Timer className="w-3 h-3" />
              {slide.slideDuration}
            </span>
          )}
        </div>
      </div>

      {/* Slide description */}
      {slide.slideDescription && (
        <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800/50">
          <FormattedDescription 
            text={slide.slideDescription} 
            tags={slide.tags} 
            className="text-[12px] text-gray-500 dark:text-gray-500 leading-relaxed" 
          />
          <TagsDisplay tags={slide.tags} />
        </div>
      )}

      {/* Slide Materials */}
      {slide.materials && slide.materials.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800/50">
          <MaterialsDisplay materials={slide.materials} />
        </div>
      )}

      {/* Slide generated content */}
      {slide.contentGenerated && (
        <div className="px-5 py-4">
          <ContentBlock content={slide.contentGenerated} type={slide.slideType} />
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

function TopicDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic } = location.state || {};

  // ── Empty state ──────────────────────────────────────────────────────
  if (!topic) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-5 max-w-sm">
          <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
              No topic selected
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Go back and select a topic from the course structure.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const t = getType(topic.topicType);
  const TypeIcon = t.icon;
  const hasSlides = topic.slides?.length > 0;
  const hasContent = !!topic.contentGenerated;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {topic.topicTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: t.bg, color: t.accent }}
            >
              <TypeIcon className="w-3 h-3" />
              {t.label}
            </span>
            {topic.topicDuration && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                <Clock className="w-3 h-3" />
                {topic.topicDuration}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Topic description */}
        {topic.topicDescription && (
          <div className="space-y-4">
            <FormattedDescription text={topic.topicDescription} tags={topic.tags} />
            <TagsDisplay tags={topic.tags} />
          </div>
        )}

        {/* Topic Materials */}
        {topic.materials && topic.materials.length > 0 && (
          <MaterialsDisplay materials={topic.materials} />
        )}

        {/* Topic content (non-multislide) */}
        {hasContent && !hasSlides && (
          <ContentBlock content={topic.contentGenerated} type={topic.topicType} />
        )}

        {/* Topic intro for multislides */}
        {hasContent && hasSlides && topic.contentGenerated?.description && (
          <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
            <div 
              className="text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed theme-html-content"
              dangerouslySetInnerHTML={{ __html: renderHtmlWithTags(topic.contentGenerated.description, topic.tags) }}
            />
          </div>
        )}

        {/* Slides */}
        {hasSlides && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Slides
              </h2>
              <span className="text-[12px] text-gray-400 dark:text-gray-500">
                {topic.slides.length} {topic.slides.length === 1 ? "slide" : "slides"}
              </span>
            </div>

            <div className="space-y-4">
              {topic.slides.map((slide, i) => (
                <SlideCard key={i} slide={slide} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Nothing to show */}
        {!hasContent && !hasSlides && !topic.topicDescription && (
          <div className="text-center py-20">
            <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No content generated for this topic yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default TopicDetailPage;
