"use client"

import { useRef } from "react";
import { useEffect, useState } from "react"
import { useCertificateGenerateMutation } from "../../services/Course_Management/courseApi"
import { Download, X, Trophy, Sparkles, CheckCircle } from "lucide-react";

import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import toast from "react-hot-toast";
import { getStudentToken } from "../../services/CookieService";

function CertificatePreview({ pdfUrl }) {
    const canvasRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);

    useEffect(() => {
        const renderPDF = async () => {
            const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
            const page = await pdf.getPage(1);

            // Render at a decent quality
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;

            // Convert canvas to image for better scaling
            const imageUrl = canvas.toDataURL("image/png");
            setImageSrc(imageUrl);
        };

        renderPDF();
    }, [pdfUrl]);

    return (
        <div
            className="flex justify-center items-center w-full max-h-[80vh] bg-white overflow-hidden relative p-3"
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt="Certificate"
                    className="w-auto h-full object-contain rounded-md"
                />
            ) : (
                <div className="flex flex-col items-center justify-center p-12 text-gray-500 w-full aspect-video bg-gray-50">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M4 16.5V7a2 2 0 0 1 2-2h7.5l4.5 4.5V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-1.5Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <path d="M13.5 5v3.5H17" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </div>
                    <p className="text-sm">Loading certificate...</p>
                </div>
            )}
        </div>
    );
}

const CertificateModal = ({ isOpen, onClose, courseId, courseName, certificate_url, refetchUserCourse = () => { } }) => {
    const { access_token } = getStudentToken();

    const [certificateGenerate] = useCertificateGenerateMutation()
    const [showCelebration, setShowCelebration] = useState(true)
    const [showCertificate, setShowCertificate] = useState(false)
    const [certificateUrl, setCertificateUrl] = useState(certificate_url || null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [imgError, setImgError] = useState(false)

    useEffect(() => {
        const generateCertificate = async () => {
            if (isOpen && !certificateUrl) {
                setIsGenerating(true)
                setShowCelebration(true)
                setShowCertificate(false)
                try {
                    const res = await certificateGenerate({ courseId, access_token }).unwrap();
                    if (res.data?.success || res?.success) {
                        setCertificateUrl(res.data?.path || res.path)
                        setShowCelebration(false)
                        setShowCertificate(true)
                    } else {
                        throw new Error("Certificate generation failed")
                    }
                } catch (err) {
                    const errorMessage = err?.data?.error ||
                        err?.data?.message ||
                        err?.error ||
                        err?.message ||
                        'Failed to delete role';
                    toast.error(errorMessage);
                } finally {
                    setIsGenerating(false)
                }
            }
        }
        generateCertificate()
    }, [isOpen, certificateUrl, certificateGenerate])

    if (!isOpen || certificate_url) return null

    const mediaBase = import.meta.env.VITE_BACKEND_MEDIA_URL || ""
    const fullUrl = certificateUrl ? `${mediaBase}${certificateUrl}` : null

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
            {/* Celebration Screen */}
            {showCelebration && (
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 transform transition-all text-center relative border border-gray-100">
                    <button
                        onClick={() => {
                            onClose();
                            refetchUserCourse();
                        }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-md transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>

                    {/* Celebration Icon */}
                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-600">
                        <Trophy className="w-8 h-8" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-2 text-gray-900">
                        Congratulations!
                    </h3>

                    {/* Course Info */}
                    <p className="text-sm text-gray-500 mb-2">You've successfully completed</p>
                    <p className="text-lg font-bold text-gray-900 mb-8">{courseName}</p>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-center gap-2">
                            {isGenerating ? (
                                <>
                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                    Creating your certificate...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Certificate is ready!
                                </>
                            )}
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-blue-600 transition-all duration-500 ${isGenerating ? "w-3/4 animate-pulse" : "w-full"
                                    }`}
                            />
                        </div>
                        {isGenerating && (
                            <p className="mt-2 text-xs text-gray-500 animate-pulse">Preparing something special for you...</p>
                        )}
                    </div>
                </div>
            )}

            {/* Certificate Screen */}
            {showCertificate && (
                <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full transform transition-all overflow-hidden border border-gray-100 max-h-[96vh]">

                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                        <h2 className="text-lg font-semibold text-gray-900">Course Completion Certificate</h2>
                        <div className="flex items-center gap-3">
                            {fullUrl && (
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(fullUrl, { mode: "cors" });
                                            const blob = await response.blob();
                                            const blobUrl = window.URL.createObjectURL(blob);

                                            const a = document.createElement("a");
                                            const suggested = `Certificate-${courseName}`.replace(/\s+/g, "_");
                                            a.href = blobUrl;
                                            a.download = `${suggested}.pdf`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);

                                            // Cleanup
                                            window.URL.revokeObjectURL(blobUrl);
                                        } catch (error) {
                                            console.error("Download failed:", error);
                                            toast.error("Failed to download certificate");
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm"
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    onClose();
                                    refetchUserCourse();
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Certificate Content */}
                    <div className="flex justify-center">
                        <CertificatePreview pdfUrl={fullUrl} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default CertificateModal

// For Share
//     < div className = "flex space-x-3 pt-2" >
//         <button
//             onClick={async () => {
//                 if (!fullUrl) return
//                 if (navigator.share) {
//                     try {
//                         await navigator.share({
//                             title: `I completed ${courseName}!`,
//                             text: `Check out my certificate for completing ${courseName}.`,
//                             url: fullUrl,
//                         })
//                     } catch {
//                         // user canceled or share failed
//                     }
//                 } else {
//                     await navigator.clipboard.writeText(fullUrl)
//                     toast.success("Certificate URL copied to clipboard!")
//                 }
//             }}
//             // className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"

//             className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-gray-200"
//         >
//             <Share className="h-4 w-4" />
//             Share
//         </button>

// {
//     fullUrl && (
//         <button
//             onClick={async () => {
//                 await navigator.clipboard.writeText(fullUrl)
//                 toast.success("Certificate URL copied to clipboard!")
//             }}
//             className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-gray-700 font-medium hover:bg-gray-50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
//         >
//             <Copy className="h-4 w-4" />
//             Copy Link
//         </button>
//     )
// }
//      </div >