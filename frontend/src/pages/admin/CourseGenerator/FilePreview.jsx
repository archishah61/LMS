import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  File,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  AlertCircle,
  FileImage,
  FileCode,
  Archive,
} from "lucide-react";

const FilePreview = ({ file, isOpen, onClose }) => {
  const [previewContent, setPreviewContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      loadFilePreview();
    }
    return () => {
      // Cleanup object URLs
      if (
        previewContent &&
        typeof previewContent === "string" &&
        previewContent.startsWith("blob:")
      ) {
        URL.revokeObjectURL(previewContent);
      }
    };
  }, [isOpen, file]);

  const loadFilePreview = async () => {
    setLoading(true);
    setError(null);
    setZoom(100);
    setRotation(0);

    try {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      if (fileType.startsWith("image/")) {
        // Handle images
        const objectUrl = URL.createObjectURL(file);
        setPreviewContent({ type: "image", url: objectUrl });
      } else if (fileType === "application/pdf") {
        // Handle PDFs with proper viewer
        const objectUrl = URL.createObjectURL(file);
        setPreviewContent({ type: "pdf", url: objectUrl });
      } else if (
        fileType === "text/plain" ||
        fileType === "text/csv" ||
        fileName.endsWith(".txt") ||
        fileName.endsWith(".csv") ||
        fileName.endsWith(".log") ||
        fileName.endsWith(".md") ||
        fileName.endsWith(".json") ||
        fileName.endsWith(".xml") ||
        fileName.endsWith(".js") ||
        fileName.endsWith(".css") ||
        fileName.endsWith(".html")
      ) {
        // Handle text files
        const text = await file.text();
        setPreviewContent({ type: "text", content: text, fileName });
      } else if (
        fileType === "application/msword" ||
        fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileType === "application/vnd.ms-excel" ||
        fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        fileType === "application/vnd.ms-powerpoint" ||
        fileType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) {
        // Handle Office documents
        setPreviewContent({ type: "office", fileType });
      } else if (
        fileType.startsWith("video/") ||
        fileType.startsWith("audio/")
      ) {
        // Handle media files
        const objectUrl = URL.createObjectURL(file);
        setPreviewContent({
          type: fileType.startsWith("video/") ? "video" : "audio",
          url: objectUrl,
        });
      } else {
        setPreviewContent({ type: "unsupported" });
      }
    } catch (err) {
      setError("Failed to load file preview");
      console.error("Preview error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const getFileIcon = (fileType, fileName = "") => {
    const name = fileName.toLowerCase();

    if (fileType.startsWith("image/"))
      return <FileImage className="w-6 h-6 text-green-500" />;
    if (fileType === "application/pdf")
      return <FileText className="w-6 h-6 text-red-500" />;
    if (
      fileType.startsWith("text/") ||
      name.endsWith(".txt") ||
      name.endsWith(".log")
    )
      return <FileText className="w-6 h-6 text-blue-500" />;
    if (
      name.endsWith(".js") ||
      name.endsWith(".css") ||
      name.endsWith(".html") ||
      name.endsWith(".json")
    )
      return <FileCode className="w-6 h-6 text-purple-500" />;
    if (fileType.startsWith("video/"))
      return <Eye className="w-6 h-6 text-pink-500" />;
    if (fileType.startsWith("audio/"))
      return <Eye className="w-6 h-6 text-orange-500" />;
    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("archive")
    )
      return <Archive className="w-6 h-6 text-yellow-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const resetView = () => {
    setZoom(100);
    setRotation(0);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? "p-0" : "p-4"
        }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl ${isFullscreen
            ? "w-full h-full rounded-none"
            : "max-w-7xl max-h-[95vh] w-full mx-4"
          } flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {getFileIcon(file.type, file.name)}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate text-lg">
                {file.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {file.type || "Unknown type"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 ml-4">
            {/* Image controls */}
            {previewContent?.type === "image" && (
              <>
                <div className="flex items-center space-x-1 border-r border-gray-300 pr-2 mr-2">
                  <button
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 font-medium min-w-[3rem] text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={() => setZoom(Math.min(300, zoom + 25))}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Rotate"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetView}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Reset view"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* General controls */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-gray-600 font-medium">Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Preview Error
                </h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                  onClick={loadFilePreview}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              </div>
            </div>
          ) : previewContent ? (
            <div className="h-full overflow-hidden flex flex-col">
              {previewContent.type === "image" && (
                <div className="flex items-center justify-center min-h-full p-6 bg-gray-100 overflow-auto">
                  <img
                    src={previewContent.url || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain transition-transform duration-200 shadow-lg rounded-lg"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    }}
                  />
                </div>
              )}

              {previewContent.type === "pdf" && (
                <div className="h-full bg-gray-200">
                  <iframe
                    src={`${previewContent.url}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={file.name}
                    style={{ minHeight: "600px", height: "100%" }}
                  />
                </div>
              )}

              {previewContent.type === "text" && (
                <div className="flex-1 overflow-auto bg-gray-100">
                  <div className="bg-white rounded-lg shadow-sm border max-h-[calc(95vh-120px)] overflow-auto m-6">
                    <div className="p-4 border-b bg-gray-50 sticky top-0 z-10">
                      <h4 className="font-medium text-gray-900">
                        File Content
                      </h4>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono p-6 overflow-auto">
                      {previewContent.content}
                    </pre>
                  </div>
                </div>
              )}

              {previewContent.type === "video" && (
                <div className="flex items-center justify-center h-full p-6 bg-black">
                  <video
                    src={previewContent.url}
                    controls
                    className="max-w-full max-h-full rounded-lg shadow-lg"
                    style={{ maxHeight: "80vh" }}
                  />
                </div>
              )}

              {previewContent.type === "audio" && (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Eye className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {file.name}
                    </h3>
                    <audio
                      src={previewContent.url}
                      controls
                      className="w-full max-w-md"
                    />
                  </div>
                </div>
              )}

              {previewContent.type === "office" && (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Office Document
                    </h3>
                    <p className="text-gray-500 mb-6">
                      This file type requires an external application to view.
                      Download the file to open it with the appropriate
                      software.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download to View
                    </button>
                  </div>
                </div>
              )}

              {previewContent.type === "unsupported" && (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <File className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Unsupported File Type
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Preview is not available for this file format. You can
                      download the file to view it with an appropriate
                      application.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download File
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
