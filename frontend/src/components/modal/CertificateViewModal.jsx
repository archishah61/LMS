"use client"

import { useRef, useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import "pdfjs-dist/build/pdf.worker.entry"
import PrimaryLoader from "../ui/PrimaryLoader"

function CertificatePreview({ pdfUrl }) {
    const canvasRef = useRef(null)
    const [imageSrc, setImageSrc] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const renderPDF = async () => {
            if (!pdfUrl) return

            setIsLoading(true)
            try {
                const pdf = await pdfjsLib.getDocument(pdfUrl).promise
                const page = await pdf.getPage(1)

                // Render at a decent quality
                const viewport = page.getViewport({ scale: 2 })
                const canvas = document.createElement("canvas")
                const context = canvas.getContext("2d")
                canvas.height = viewport.height
                canvas.width = viewport.width

                await page.render({ canvasContext: context, viewport }).promise

                // Convert canvas to image for better scaling
                const imageUrl = canvas.toDataURL("image/png")
                setImageSrc(imageUrl)
            } catch (error) {
                console.error("Error rendering PDF:", error)
            } finally {
                setIsLoading(false)
            }
        }

        renderPDF()
    }, [pdfUrl])

    return (
        <div
            className="flex justify-center p-3 items-center w-full bg-white overflow-hidden"
            style={{ height: "452px" }}
        >
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                    <PrimaryLoader />
                    <p className="text-sm mt-2">Loading certificate...</p>
                </div>
            ) : imageSrc ? (
                <img
                    src={imageSrc}
                    alt="Certificate"
                    className="w-auto h-full border rounded-xl object-contain"
                />
            ) : (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <X className="w-6 h-6" />
                    </div>
                    <p className="text-sm">Failed to load certificate</p>
                </div>
            )}
        </div>
    )
}

const CertificateViewModal = ({ certificateUrl, isOpen, onClose }) => {
    const [fullUrl, setFullUrl] = useState(null)

    // Construct full URL if certificateUrl is relative
    useEffect(() => {
        if (certificateUrl) {
            const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || ""
            // Check if it's already a full URL
            const isFullUrl = certificateUrl.startsWith('http://') ||
                certificateUrl.startsWith('https://') ||
                certificateUrl.startsWith('blob:') ||
                certificateUrl.startsWith('data:')

            setFullUrl(isFullUrl ? certificateUrl : `${mediaBase}${certificateUrl}`)
        }
    }, [certificateUrl])

    if (!isOpen || !certificateUrl) return null

    const handleDownload = async () => {
        try {
            const response = await fetch(fullUrl, { mode: "cors" })
            if (!response.ok) throw new Error("Failed to fetch certificate")

            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)

            const a = document.createElement("a")
            // Extract filename from URL or use generic name
            const filename = certificateUrl.split('/').pop() || "certificate.pdf"
            a.href = blobUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)

            // Cleanup
            window.URL.revokeObjectURL(blobUrl)
        } catch (error) {
            console.error("Download failed:", error)
            // You can add toast notification here if needed
            // toast.error("Failed to download certificate")
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-md max-w-3xl w-full transform transition-all overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                        Certificate
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-4 py-1 rounded-md bg-primary text-white font-medium"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Download</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Certificate Content */}
                <CertificatePreview pdfUrl={fullUrl} />
            </div>
        </div>
    )
}

export default CertificateViewModal