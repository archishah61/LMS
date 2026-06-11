import React, { useState, useEffect, useRef } from "react"
import Editor from "@monaco-editor/react"
import { io } from "socket.io-client"
import axios from "axios"
import "./CodeEditor.css"
import DEFAULT_CODE_TEMPLATES from "../utils/codeTemplates"

// Import icons
import {
  Play,
  Save,
  Plus,
  X,
  History,
  Terminal,
  Search,
  Filter,
  FileText,
  Trash2
} from "lucide-react"
import DefaultSEOMeta from "../context/DefaultSEOMeta"

// Define backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_MEDIA_URL
const socket = io(BACKEND_URL)

// Language options with icons
const LANGUAGES = [
  {
    id: "python",
    name: "Python",
    extension: "py",
    icon: "🐍"
  },
  {
    id: "javascript",
    name: "JavaScript",
    extension: "js",
    icon: "JS"
  },
  {
    id: "html",
    name: "HTML",
    extension: "html",
    icon: "🌐"
  },
  {
    id: "css",
    name: "CSS",
    extension: "css",
    icon: "🎨"
  },
  {
    id: "typescript",
    name: "TypeScript",
    extension: "ts",
    icon: "TS"
  },
  {
    id: "java",
    name: "Java",
    extension: "java",
    icon: "☕"
  },
  {
    id: "c",
    name: "C",
    extension: "c",
    icon: "C"
  },
  {
    id: "cpp",
    name: "C++",
    extension: "cpp",
    icon: "C++"
  },
  {
    id: "php",
    name: "PHP",
    extension: "php",
    icon: "PHP"
  },
  {
    id: "csharp",
    name: "C#",
    extension: "cs",
    icon: "C#"
  },
  {
    id: "go",
    name: "Go",
    extension: "go",
    icon: "Go"
  },
  {
    id: "dart",
    name: "Dart",
    extension: "dart",
    icon: "🎯"
  }
]

// Combined mode for HTML/CSS/JS
const COMBINED_MODE = {
  id: "combined",
  name: "Combined",
  icon: "🧩",
  files: [
    {
      id: "html",
      name: "index.html",
      language: "html"
    },
    {
      id: "css",
      name: "styles.css",
      language: "css"
    },
    {
      id: "js",
      name: "script.js",
      language: "javascript"
    }
  ]
}

function CodeEditor() {
  // State for editor
  const [language, setLanguage] = useState("python")
  const [code, setCode] = useState(DEFAULT_CODE_TEMPLATES.python)
  const [output, setOutput] = useState("Ready!")
  const [consoleOutput, setConsoleOutput] = useState("")
  const [filename, setFilename] = useState("untitled.py")
  const [files, setFiles] = useState([])
  const [filteredFiles, setFilteredFiles] = useState([])
  const [isCombinedMode, setIsCombinedMode] = useState(false)
  const [combinedFiles, setCombinedFiles] = useState({
    html: DEFAULT_CODE_TEMPLATES.combined.html,
    css: DEFAULT_CODE_TEMPLATES.combined.css,
    js: DEFAULT_CODE_TEMPLATES.combined.js
  })
  const [activeCombinedTab, setActiveCombinedTab] = useState("html")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeOutputTab, setActiveOutputTab] = useState("output")
  const [outputHistory, setOutputHistory] = useState([])
  const [showFileModal, setShowFileModal] = useState(false)
  const [fileSearch, setFileSearch] = useState("")
  const [fileTypeFilter, setFileTypeFilter] = useState("all")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const previewRef = useRef(null)
  const [allowedLanguages, setAllowedLanguages] = useState([])
  const [showCombined, setShowCombined] = useState(false);

  // Connect to socket
  useEffect(() => {
    // Socket event listeners
    socket.on("connect", () => {
      console.log("Connected to server")
    })

    socket.on("execution-result", data => {
      setIsLoading(false)
      setOutput(data.output)
      setOutputHistory(prev => [
        ...prev,
        { type: "result", content: data.output, timestamp: new Date() }
      ])

      if (data.type === "html") {
        // For HTML preview
        const combinedHTML = injectCSSAndJS(data.output)
        setOutput(combinedHTML)
      }
    })

    socket.on("execution-error", data => {
      setIsLoading(false)
      setError(data.error)
      setConsoleOutput(data.stderr || data.error)
      setOutputHistory(prev => [
        ...prev,
        {
          type: "error",
          content: data.stderr || data.error,
          timestamp: new Date()
        }
      ])
    })

    // Cleanup on component unmount
    return () => {
      socket.off("connect")
      socket.off("execution-result")
      socket.off("execution-error")
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem("selectedLanguages")
    if (stored) {
      const selectedNames = JSON.parse(stored) // e.g. ["JavaScript", "Python"]

      // Check if combined mode is requested
      if (selectedNames?.includes("HTML/CSS/JavaScript")) {
        setShowCombined(true);
      }

      // Filter LANGUAGES by selected names
      const filtered = LANGUAGES.filter(lang =>
        selectedNames?.includes(lang.name)
      )

      setAllowedLanguages(filtered)

      // Set default selected language
      if (filtered.length > 0) {
        setLanguage(filtered[0].id)
        setCode(DEFAULT_CODE_TEMPLATES[filtered[0].id])
        setFilename(`untitled.${filtered[0].extension}`)
      }
    }
  }, [])

  // Load file list on component mount
  useEffect(() => {
    fetchFiles()
  }, [])

  // Set default code when language changes
  useEffect(() => {
    if (!isCombinedMode) {
      setCode(DEFAULT_CODE_TEMPLATES[language])
      setFilename(
        `untitled.${LANGUAGES.find(lang => lang.id === language).extension}`
      )
    }
  }, [language, isCombinedMode])

  // Update filtered files when files, search, or filter changes
  useEffect(() => {
    let result = [...files]

    // Apply search filter
    if (fileSearch) {
      result = result.filter(file =>
        file.toLowerCase().includes(fileSearch.toLowerCase())
      )
    }

    // Apply type filter
    if (fileTypeFilter !== "all") {
      result = result.filter(file => {
        const extension = file.split(".").pop()
        return extension === fileTypeFilter
      })
    }

    setFilteredFiles(result)
  }, [files, fileSearch, fileTypeFilter])

  // Update combined preview when combinedFiles change
  useEffect(() => {
    if (isCombinedMode && activeOutputTab === "output") {
      updateCombinedPreview()
    }
  }, [combinedFiles, isCombinedMode, activeOutputTab])

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/files/list`)
      if (response.data.success) {
        setFiles(response.data.files)
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    }
  }

  // Load file content
  const loadFile = async selectedFilename => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/files/${selectedFilename}`
      )
      if (response.data.success) {
        setCode(response.data.content)
        setFilename(selectedFilename)

        // Detect language from file extension
        const extension = selectedFilename.split(".").pop()
        const lang = LANGUAGES.find(l => l.extension === extension)
        if (lang) {
          setLanguage(lang.id)
          setIsCombinedMode(false)
        }

        // Close file modal after selection
        setShowFileModal(false)
      }
    } catch (error) {
      console.error("Error loading file:", error)
      setError("Failed to load file")
    }
  }

  // Delete file
  const deleteFile = async selectedFilename => {
    try {
      const response = await axios.delete(
        `${BACKEND_URL}/api/files/${selectedFilename}`
      )
      if (response.data.success) {
        // Refresh file list
        fetchFiles()
        setConfirmDelete(null)
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      setError("Failed to delete file")
    }
  }

  // Save file
  const saveFile = async () => {
    if (!filename && !isCombinedMode) {
      setError("Please enter a filename")
      return
    }

    try {
      if (isCombinedMode) {
        // Save all combined files
        await Promise.all(
          COMBINED_MODE.files.map(file => {
            return axios.post(`${BACKEND_URL}/api/files/save`, {
              filename: file.name,
              content: combinedFiles[file.id],
              language: file.language
            })
          })
        )
      } else {
        // Save single file
        await axios.post(`${BACKEND_URL}/api/files/save`, {
          filename,
          content: code,
          language
        })
      }

      setError("")
      fetchFiles() // Refresh file list
    } catch (error) {
      console.error("Error saving file:", error)
      setError("Failed to save file")
    }
  }

  // Execute code
  const executeCode = () => {
    setIsLoading(true)
    setOutput("")
    setConsoleOutput("")
    setError("")

    if (isCombinedMode) {
      // For combined mode, we execute the HTML file
      socket.emit("execute", {
        code: combinedFiles.html,
        language: "html",
        filename: "index.html"
      })
    } else {
      // For single language mode
      socket.emit("execute", {
        code,
        language,
        filename
      })
    }
  }

  // Create new file
  const createNewFile = () => {
    if (isCombinedMode) {
      setCombinedFiles({
        html: DEFAULT_CODE_TEMPLATES.combined.html,
        css: DEFAULT_CODE_TEMPLATES.combined.css,
        js: DEFAULT_CODE_TEMPLATES.combined.js
      })
    } else {
      setCode(DEFAULT_CODE_TEMPLATES[language])
      setFilename(
        `untitled.${LANGUAGES.find(lang => lang.id === language).extension}`
      )
    }
    setOutput("Ready!")
    setConsoleOutput("")
    setError("")
  }

  // Toggle between combined mode and single language mode
  const toggleCombinedMode = () => {
    setIsCombinedMode(!isCombinedMode)
    if (!isCombinedMode) {
      setActiveCombinedTab("html")
      // Force an update of the combined preview
      setTimeout(() => {
        updateCombinedPreview()
      }, 100)
    } else {
      setCode(DEFAULT_CODE_TEMPLATES[language])
    }
  }

  // Helper function to inject CSS and JS into HTML for preview
  const injectCSSAndJS = htmlContent => {
    // Simple injection for preview purposes
    return htmlContent
      .replace("</head>", `<style>${combinedFiles.css}</style></head>`)
      .replace("</body>", `<script>${combinedFiles.js}</script></body>`)
  }

  // Update combined preview
  const updateCombinedPreview = () => {
    if (isCombinedMode) {
      const combinedHTML = injectCSSAndJS(combinedFiles.html)
      setOutput(combinedHTML)

      // Force iframe refresh if it exists
      if (previewRef.current) {
        const iframe = previewRef.current
        iframe.srcdoc = combinedHTML
      }
    }
  }

  // Handle code change in combined mode
  const handleCombinedCodeChange = value => {
    setCombinedFiles(prev => ({
      ...prev,
      [activeCombinedTab]: value
    }))

    // Schedule an update to the preview
    setTimeout(() => {
      updateCombinedPreview()
    }, 300)
  }

  // Clear output
  const clearOutput = () => {
    setOutput("Ready!")
    setConsoleOutput("")
    setError("")
  }

  // Toggle file modal
  const toggleFileModal = () => {
    setShowFileModal(!showFileModal)
    if (!showFileModal) {
      fetchFiles()
      setFileSearch("")
      setFileTypeFilter("all")
    }
  }

  // Get unique file extensions for filter dropdown
  const getUniqueExtensions = () => {
    const extensions = files.map(file => file.split(".").pop())
    return ["all", ...new Set(extensions)]
  }

  // Map language IDs to Monaco editor language IDs
  const getMonacoLanguage = languageId => {
    const languageMap = {
      csharp: "csharp",
      go: "go",
      dart: "dart"
    }

    return languageMap[languageId] || languageId
  }

  // Handle editor will mount to load additional language support
  const handleEditorWillMount = monaco => {
    // Monaco editor already has built-in support for C#, Go, and Dart
    // No additional configuration needed
  }

  return (
    <div className="code-editor-container">
      <DefaultSEOMeta />
      <div className="language-sidebar">
        {allowedLanguages.map(lang => (
          <div
            key={lang.id}
            className={`language-icon ${language === lang.id && !isCombinedMode ? "active" : ""
              }`}
            onClick={() => {
              setLanguage(lang.id)
              setIsCombinedMode(false)
            }}
            title={lang.name}
          >
            {lang.icon}
          </div>
        ))}
        {showCombined && (
          <div
            className={`language-icon ${isCombinedMode ? 'active' : ''}`}
            onClick={toggleCombinedMode}
            title="Combined HTML/CSS/JS"
          >
            {COMBINED_MODE.icon}
          </div>
        )}

      </div>

      <div className="editor-main-container">
        <div className="editor-header">
          <div className="file-info">
            <input
              type="text"
              placeholder="Filename"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              disabled={isCombinedMode}
            />
            <div className="file-actions">
              <button onClick={createNewFile} title="New File">
                <Plus size={16} />
                <span>New</span>
              </button>
              <button onClick={saveFile} title="Save File">
                <Save size={16} />
                <span>Save</span>
              </button>
              <button onClick={toggleFileModal} title="Open File">
                <FileText size={16} />
                <span>Open</span>
              </button>
            </div>
          </div>

          <div className="run-controls">
            <button
              className="run-button"
              onClick={executeCode}
              disabled={isLoading}
              title="Run Code"
            >
              {isLoading ? (
                "Running..."
              ) : (
                <>
                  <Play size={16} />
                  <span>Run</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="editor-content">
          <div className="editor-panel">
            {isCombinedMode ? (
              <>
                <div className="combined-tabs">
                  {COMBINED_MODE.files.map(file => (
                    <button
                      key={file.id}
                      className={`tab ${activeCombinedTab === file.id ? "active" : ""
                        }`}
                      onClick={() => setActiveCombinedTab(file.id)}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
                <Editor
                  height="100%"
                  language={
                    COMBINED_MODE.files.find(f => f.id === activeCombinedTab)
                      .language
                  }
                  value={combinedFiles[activeCombinedTab]}
                  onChange={handleCombinedCodeChange}
                  theme="vs-dark"
                  beforeMount={handleEditorWillMount}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: "on",
                    automaticLayout: true,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    roundedSelection: false,
                    padding: { top: 10 }
                  }}
                />
              </>
            ) : (
              <Editor
                height="100%"
                language={getMonacoLanguage(language)}
                value={code}
                onChange={setCode}
                theme="vs-dark"
                beforeMount={handleEditorWillMount}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  wordWrap: "on",
                  automaticLayout: true,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  roundedSelection: false,
                  padding: { top: 10 }
                }}
              />
            )}
          </div>

          <div className="output-panel">
            <div className="output-header">
              <div className="output-tabs">
                <button
                  className={`tab ${activeOutputTab === "output" ? "active" : ""
                    }`}
                  onClick={() => {
                    setActiveOutputTab("output")
                    if (isCombinedMode) {
                      updateCombinedPreview()
                    }
                  }}
                >
                  <Terminal size={14} />
                  <span>Terminal</span>
                </button>
                <button
                  className={`tab ${activeOutputTab === "history" ? "active" : ""
                    }`}
                  onClick={() => setActiveOutputTab("history")}
                >
                  <History size={14} />
                  <span>History</span>
                </button>
              </div>
              <button
                className="clear-button"
                onClick={clearOutput}
                title="Clear Output"
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            </div>

            <div className="output-content">
              {activeOutputTab === "output" ? (
                <>
                  {error && <div className="error-message">{error}</div>}

                  {language === "html" || isCombinedMode ? (
                    <iframe
                      ref={previewRef}
                      title="HTML Preview"
                      className="html-preview"
                      srcDoc={output}
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <pre className="text-output">{output}</pre>
                  )}
                </>
              ) : (
                <div className="output-history">
                  {outputHistory.length === 0 ? (
                    <div className="empty-history">
                      No execution history yet
                    </div>
                  ) : (
                    outputHistory.map((entry, index) => (
                      <div
                        key={index}
                        className={`history-entry ${entry.type}`}
                      >
                        <div className="history-time">
                          {entry.timestamp.toLocaleTimeString()}
                        </div>
                        <pre className="history-content">{entry.content}</pre>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Modal */}
      {showFileModal && (
        <div className="file-modal-overlay">
          <div className="file-modal">
            <div className="file-modal-header">
              <h3>Open File</h3>
              <button className="close-button" onClick={toggleFileModal}>
                <X size={16} />
              </button>
            </div>

            <div className="file-modal-search">
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={fileSearch}
                  onChange={e => setFileSearch(e.target.value)}
                />
              </div>

              <div className="filter-dropdown">
                <Filter size={16} />
                <select
                  value={fileTypeFilter}
                  onChange={e => setFileTypeFilter(e.target.value)}
                >
                  {getUniqueExtensions().map(ext => (
                    <option key={ext} value={ext}>
                      {ext === "all" ? "All Types" : `.${ext}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="file-modal-list">
              {filteredFiles.length === 0 ? (
                <div className="empty-files">No matching files found</div>
              ) : (
                <ul>
                  {filteredFiles.map(file => (
                    <li key={file} className="file-item">
                      <span
                        className="file-name"
                        onClick={() => loadFile(file)}
                      >
                        {file}
                      </span>
                      <button
                        className="delete-button"
                        onClick={() => setConfirmDelete(file)}
                        title="Delete File"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h3>Confirm Delete</h3>
              <button
                className="close-button"
                onClick={() => setConfirmDelete(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="confirm-modal-content">
              <p>
                Are you sure you want to delete <strong>{confirmDelete}</strong>
                ?
              </p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="confirm-modal-actions">
              <button
                className="cancel-button"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-button"
                onClick={() => deleteFile(confirmDelete)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeEditor
