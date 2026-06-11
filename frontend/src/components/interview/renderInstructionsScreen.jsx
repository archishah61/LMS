import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, AlertCircle, Monitor, Video, X, ArrowRight, Play } from "lucide-react";

const scrollClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const renderInstructionsScreen = ({ onAccept, toggleCamera, showCameraView, videoRef }) => {
    return (
        <div className={`h-screen flex flex-col overflow-y-auto ${scrollClass} p-4`}>
            <div className="container mx-auto w-full">

                {/* Header Section */}
                <div className="bg-white mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pre-Session Checklist</h1>
                            <p className="text-sm text-slate-500 font-medium mt-1">Please review these essential guidelines to ensure a valid interview session.</p>
                        </div>
                        <button
                            onClick={onAccept}
                            className="px-8 py-3 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-md shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
                        >
                            Start Interview <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-5">
                    {/* Left Column: Integrity & Setup */}
                    <div className="space-y-6">
                        {/* Privacy & Integrity */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1.5 h-4 bg-primary rounded-full" />
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Academic Integrity</h3>
                            </div>

                            <div className="space-y-4">
                                {[
                                    "Do not switch between tabs or navigate away.",
                                    "System monitors activity for automatic failure.",
                                    "Keep this window active at all times."
                                ].map((text, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <p className="text-[13px] text-slate-600 font-semibold leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-md flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                                <p className="text-[11px] text-slate-900 font-bold leading-relaxed uppercase tracking-tight">
                                    Attention: Any disruption detected will result in immediate session termination.
                                </p>
                            </div>
                        </div>

                        {/* Recording Setup */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-1.5 h-4 bg-primary rounded-full" />
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Technical Setup</h3>
                            </div>

                            <div className="space-y-4">
                                {[
                                    "Grant camera and microphone permissions.",
                                    "Select 'Entire Screen' for full session proof.",
                                    "Sessions are stored locally for your review."
                                ].map((text, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <p className="text-[13px] text-slate-600 font-semibold leading-relaxed">{text}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-md flex items-start gap-3">
                                <Monitor className="w-5 h-5 text-primary shrink-0" />
                                <p className="text-[11px] text-primary/80 font-bold leading-relaxed">
                                    Closed video feed will prevent session authentication.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Camera Integration */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-slate-400" />
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Camera Integration</h3>
                            </div>
                            <button
                                onClick={toggleCamera}
                                className={`px-4 py-1.5 rounded-md font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${showCameraView ? 'bg-primary/5 text-primary border border-primary/20' : 'bg-primary text-white shadow-md shadow-primary/20'}`}
                            >
                                {showCameraView ? "Deactivate Feed" : "Activate Feed"}
                            </button>
                        </div>

                        <div className="p-8 flex flex-col items-center justify-center flex-1">
                            {showCameraView ? (
                                <div className="w-full aspect-video bg-slate-900 rounded-lg relative overflow-hidden border-4 border-white shadow-xl">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover mirror"
                                    />
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-primary/90 text-white rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        Live Feed Active
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-100">
                                        <Video className="w-5 h-5" />
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest">Camera Preview Inactive</p>
                                </div>
                            )}
                            <p className="text-xs text-slate-400 font-medium mt-6 max-w-sm text-center">
                                Test your camera position and lighting here. Make sure your face is clearly visible before beginning the session.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
            <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
        </div>
    );
};

export default renderInstructionsScreen;
