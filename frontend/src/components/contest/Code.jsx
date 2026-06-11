import { useRef, useCallback } from "react";

const LINE_HEIGHT = 16;

function CodeEditor({
    value = "",
    onChange,
    theme = "light",
    placeholder = "// Write your code here...",
    className = "",
}) {
    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);

    const lines = value ? value.split("\n").length : 1;

    const handleScroll = useCallback(() => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newValue = value.substring(0, start) + "  " + value.substring(end);
            onChange(newValue);
            requestAnimationFrame(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 2;
            });
        }
    };

    const isDark = theme === "dark";

    const wrapper = isDark
        ? "border border-gray-700 rounded overflow-hidden"
        : "border border-gray-200 rounded overflow-hidden";

    const lineNumBg = isDark
        ? "bg-gray-900 border-r border-gray-700 text-gray-600"
        : "bg-gray-50 border-r border-gray-200 text-gray-400";

    const textareaBg = isDark
        ? "bg-black text-white"
        : "bg-white text-gray-800";

    return (
        <div className={`flex h-full w-full font-mono text-sm ${wrapper} ${className}`}>
            {/* Line numbers */}
            <div
                ref={lineNumbersRef}
                className={`select-none overflow-hidden text-right ${lineNumBg}`}
                style={{
                    minWidth: "2.5rem",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                }}
                aria-hidden="true"
            >
                {Array.from({ length: lines }, (_, i) => (
                    <div
                        key={i + 1}
                        className="px-2 text-xs"
                        style={{ height: `${LINE_HEIGHT}px`, lineHeight: `${LINE_HEIGHT}px` }}
                    >
                        {i + 1}
                    </div>
                ))}
            </div>

            {/* Textarea */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                className={`flex-1 resize-none outline-none px-3 ${textareaBg}`}
                style={{
                    lineHeight: `${LINE_HEIGHT}px`,
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                }}
                placeholder={placeholder}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
            />
        </div>
    );
}

export default CodeEditor;