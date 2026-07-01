import React, { useState, useRef, useEffect } from 'react';
import { Calculator, Palette, RotateCcw, Play, History, Trash2, Minus, Plus, Brush, Pen, Circle, ChevronDown, ChevronUp, CheckCircle, Upload, FileImage, Eraser, Home, ArrowLeft, Menu, X, MessageSquare, Settings, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useSolveMathMutation, useGetUserMathSolverHistoryQuery } from "../../../services/AIServices";
import { useNavigate } from "react-router-dom";
import useStudentAuthTokenRefresh from '../../../hooks/useStudentAuthTokenRefresh';
import { useGetFeatureStatusByNameQuery } from "../../../services/Masters/featureStatusAPI";
import ComingSoonModal from '../../modal/ComingSoonModal';
import { useAuthModal } from '../../../context/AuthModalContext';
import { useSelector } from 'react-redux';
import { getStudentToken } from '../../../services/CookieService';
import DefaultSEOMeta from '../../../context/DefaultSEOMeta';

const COLORS = [
    '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ff8000',
    '#800080', '#008000', '#000080', '#808080'
];

const BRUSH_TYPES = [
    { id: 'round', name: 'Round', icon: Pen },
    { id: 'eraser', name: 'Eraser', icon: Eraser }
];

// Enhanced responsive PromptSidebar
const PromptSidebar = ({ showPromptSidebar, customPrompt, setCustomPrompt, setShowPromptSidebar, isMobile, isTablet }) => {
    const isMobileFlag = isMobile?.() || false;
    const isTabletFlag = isTablet?.() || false;

    const getWidth = () => {
        if (isMobileFlag) return 'w-full';
        if (isTabletFlag) return 'w-96';
        return 'w-80';
    };

    return (
        <div className={`fixed top-16 bottom-4 right-0 z-40 bg-white border-l border-gray-200 shadow-xl transition-transform duration-300 ${getWidth()} ${showPromptSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <h3 className="text-base md:text-lg font-semibold text-gray-800">AI Instructions</h3>
                    </div>
                    <button
                        onClick={() => setShowPromptSidebar(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-5 overflow-y-auto flex flex-col justify-between">
                    <div>
                        <label
                            htmlFor="customPrompt"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Additional Instructions for AI
                        </label>
                        <textarea
                            id="customPrompt"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="E.g., 'Explain like I'm 5', 'Show detailed steps', etc."
                            className="w-full h-32 md:h-40 p-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary resize-none outline-none text-sm md:text-base"
                            rows={isMobileFlag ? 4 : 6}
                        />
                    </div>

                    {/* Clear Button */}
                    <button
                        onClick={() => setCustomPrompt('')}
                        className="w-full mt-4 px-4 py-2.5 md:py-3 text-sm bg-gray-50 text-gray-600 rounded-lg transition-colors hover:bg-gray-100 flex items-center justify-center space-x-2 border border-gray-100"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear Instructions</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 space-y-1">
                        <p><Info className="w-4 h-4 inline-block mr-1" /> Instructions will be sent with your math problem.</p>
                        <p className="ml-5">Clear the field if you want standard solving.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mobile History Drawer Component
const MobileHistoryDrawer = ({ showHistory, setShowHistory, history, setResult, setCustomPrompt, setHistory }) => {
    if (!showHistory) return null;

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/50 flex items-end justify-center animate-in fade-in duration-200"
            onClick={() => setShowHistory(false)}
        >
            <div
                className="bg-white w-full rounded-t-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">History</h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setHistory([])}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                            title="Clear History"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowHistory(false)}
                            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400">No history yet</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setResult(item.solution);
                                    setShowHistory(false);
                                    if (item.prompt) {
                                        setCustomPrompt(item.prompt);
                                    }
                                }}
                                className="p-4 bg-white hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-gray-100 active:bg-gray-100"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-400">{item.timestamp}</span>
                                    <div className="flex items-center space-x-1 text-xs text-primary bg-primary/5 px-2 py-1 rounded-full">
                                        {item.inputMode === 'canvas' ?
                                            <Brush className="w-3 h-3" /> :
                                            <FileImage className="w-3 h-3" />
                                        }
                                        <span>{item.inputMode === 'canvas' ? 'Draw' : 'Image'}</span>
                                    </div>
                                </div>
                                <div className="text-gray-700 font-mono text-sm line-clamp-2">
                                    {item.equation}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Close handle */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setShowHistory(false)}
                        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Tablet History Dropdown Component
const TabletHistoryDropdown = ({ showHistory, setShowHistory, history, setResult, setCustomPrompt, setHistory, historyRef }) => {
    return (
        <div className="relative" ref={historyRef}>
            <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 ${showHistory ? 'bg-primary text-white' : 'bg-gray-50 hover:bg-gray-100'} border border-gray-100 text-gray-600 rounded-md transition-colors`}
            >
                <History className="w-4 h-4" />
                {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                        {history.length > 9 ? '9+' : history.length}
                    </span>
                )}
            </button>

            {/* History Dropdown */}
            {showHistory && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg border border-gray-100 shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h3 className="text-gray-800 font-semibold text-sm">History</h3>
                        {/* <button
                            onClick={() => setHistory([])}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                            title="Clear History"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button> */}

                        <></>
                    </div>
                    <div className="overflow-y-auto max-h-80 p-2 space-y-2">
                        {history.length === 0 ? (
                            <p className="text-gray-400 p-8 text-center text-sm">No history yet</p>
                        ) : (
                            history.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        setResult(item.solution);
                                        setShowHistory(false);
                                        if (item.prompt) {
                                            setCustomPrompt(item.prompt);
                                        }
                                    }}
                                    className="p-3 bg-white hover:bg-gray-50 rounded-md cursor-pointer transition-colors border border-gray-100"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-400">{item.timestamp}</span>
                                        <div className="flex items-center space-x-1 text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                                            {item.inputMode === 'canvas' ?
                                                <Brush className="w-3 h-3" /> :
                                                <FileImage className="w-3 h-3" />
                                            }
                                            <span>{item.inputMode === 'canvas' ? 'Draw' : 'Image'}</span>
                                        </div>
                                    </div>
                                    <div className="text-gray-700 font-mono text-sm line-clamp-2">
                                        {item.equation}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const MathSolver = () => {
    const navigate = useNavigate();
    const { openLogin } = useAuthModal();
    const { access_token } = getStudentToken();
    const { id, isLoaded } = useSelector((state) => state.user);

    // Feature status query
    const { data: featureData, isLoading: featureDataLoading, error: featureDataError } =
        useGetFeatureStatusByNameQuery({ name: "maths_solver" });

    useEffect(() => {
        if (!access_token && Boolean(featureData?.is_active)) {
            navigate("/");
            openLogin();
        }
    }, [access_token, navigate, featureData, openLogin]);

    useEffect(() => {
        if (isLoaded && !id && Boolean(featureData?.is_active)) {
            navigate("/");
            openLogin();
        }
    }, [isLoaded, id, navigate, featureData, openLogin]);

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const historyRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);
    const [brushType, setBrushType] = useState('round');
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const [history, setHistory] = useState([]);

    const { data: historyData, error: historyError, isLoading: isLoadingHistory, refetch: refetchHistory } = useGetUserMathSolverHistoryQuery({ access_token });

    // Update history when data from API arrives
    useEffect(() => {
        if (historyData?.data) {
            setHistory(historyData.data);
        }
    }, [historyData]);

    // Optional: Keep localStorage as fallback
    useEffect(() => {
        if (history.length > 0 && !historyData?.data) {
            localStorage.setItem('mathSolverHistory', JSON.stringify(history));
        }
    }, [history]);

    const [isLoading, setIsLoading] = useState(false);
    const [showSteps, setShowSteps] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [inputMode, setInputMode] = useState('image');
    const [selectedLanguage, setSelectedLanguage] = useState("english");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showMobileTools, setShowMobileTools] = useState(false);
    const [showPromptSidebar, setShowPromptSidebar] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [activeProblem, setActiveProblem] = useState(null);

    // Responsive breakpoints
    const [screenSize, setScreenSize] = useState({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
    });

    useEffect(() => {
        const handleResize = () => {
            setScreenSize({
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (result?.data && !result.data.problemType && !result.data.problemStatement) {
            const keys = Object.keys(result.data).filter(k => k.toLowerCase().includes('problem'));
            if (keys.length > 0) {
                setActiveProblem(keys[0]);
            }
        }
    }, [result]);

    // Close history when clicking outside (for tablet/desktop)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (historyRef.current && !historyRef.current.contains(event.target)) {
                setShowHistory(false);
            }
        };

        if (showHistory && (isTablet() || isDesktop())) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showHistory, screenSize]);

    useStudentAuthTokenRefresh();

    const languages = [
        { code: "en", name: "English" },
        { code: "hi", name: "Hindi" },
        { code: "gu", name: "Gujarati" },
        { code: "mr", name: "Marathi" },
        { code: "bn", name: "Bengali" },
        { code: "ta", name: "Tamil" },
        { code: "te", name: "Telugu" },
        { code: "kn", name: "Kannada" },
        { code: "pa", name: "Punjabi" },
        { code: "ur", name: "Urdu" },
        { code: "or", name: "Odia" },
        { code: "ml", name: "Malayalam" },
        { code: "as", name: "Assamese" }
    ];

    const isMobile = () => screenSize.isMobile;
    const isTablet = () => screenSize.isTablet;
    const isDesktop = () => screenSize.isDesktop;

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setSelectedLanguage(newLanguage);
    };

    const [solveMath] = useSolveMathMutation();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && inputMode === 'canvas') {
            const resizeCanvas = () => {
                const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

                // Responsive canvas height based on device
                let topOffset = 64; // header
                if (isMobile()) {
                    topOffset = 64; // mobile header
                } else if (isTablet()) {
                    topOffset = 70; // tablet header
                }

                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - topOffset;

                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw responsive grid
                ctx.strokeStyle = '#f0f0f0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                const gridSize = isMobile() ? 15 : 20;
                for (let x = 0; x <= canvas.width; x += gridSize) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                }
                for (let y = 0; y <= canvas.height; y += gridSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                }
                ctx.stroke();

                ctx.putImageData(imageData, 0, 0);
            };

            if (inputMode === 'canvas') {
                const topOffset = isMobile() ? 64 : (isTablet() ? 70 : 64);
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - topOffset;

                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw grid
                ctx.strokeStyle = '#f0f0f0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                const gridSize = isMobile() ? 15 : 20;
                for (let x = 0; x <= canvas.width; x += gridSize) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                }
                for (let y = 0; y <= canvas.height; y += gridSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                }
                ctx.stroke();
            }

            window.addEventListener('resize', resizeCanvas);
            return () => window.removeEventListener('resize', resizeCanvas);
        }
    }, [inputMode, screenSize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && inputMode === 'canvas') {
            const ctx = canvas.getContext('2d');
            ctx.lineCap = brushType === 'square' ? 'square' : 'round';
            ctx.lineJoin = 'round';
        }
    }, [brushType, inputMode]);

    const getEventPos = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        if (inputMode !== 'canvas') return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const { x, y } = getEventPos(e);

            ctx.beginPath();
            ctx.moveTo(x, y);
            setIsDrawing(true);
        }
    };

    const draw = (e) => {
        if (!isDrawing || inputMode !== 'canvas') return;
        e.preventDefault();

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const { x, y } = getEventPos(e);

            if (brushType === 'eraser') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = brushSize * 5;
                ctx.lineCap = 'round';
                ctx.globalAlpha = 1;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = color;
                ctx.lineWidth = brushSize;
                ctx.lineCap = brushType === 'square' ? 'square' : 'round';
                ctx.globalAlpha = 1;
            }

            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const stopDrawing = (e) => {
        if (e) e.preventDefault();
        setIsDrawing(false);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.globalCompositeOperation = 'source-over';
        }
    };

    const resetCanvas = () => {
        if (inputMode === 'canvas') {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw grid
                ctx.strokeStyle = '#f0f0f0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                const gridSize = isMobile() ? 15 : 20;
                for (let x = 0; x <= canvas.width; x += gridSize) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                }
                for (let y = 0; y <= canvas.height; y += gridSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                }
                ctx.stroke();
            }
        } else {
            setUploadedImage(null);
        }
        setResult(null);
        setError('');
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage({
                    file: file,
                    dataUrl: event.target.result
                });
                setResult(null);
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    const solveMathProblem = async () => {
        setError('');
        setIsLoading(true);

        try {
            let file;

            if (inputMode === 'canvas') {
                const canvas = canvasRef.current;
                if (!canvas) {
                    throw new Error('Canvas not available');
                }

                const blob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/png');
                });
                file = new File([blob], 'canvas-math.png', { type: 'image/png' });
            } else if (inputMode === 'image' && uploadedImage) {
                file = uploadedImage.file;
            } else {
                throw new Error('No image or canvas drawing available');
            }

            const formData = new FormData();
            formData.append('mathImage', file);
            formData.append('language', selectedLanguage);
            formData.append('dict_of_vars', JSON.stringify(dictOfVars));

            if (customPrompt.trim()) {
                formData.append('custom_prompt', customPrompt.trim());
            }

            const response = await solveMath(formData).unwrap();

            if (!response.success) {
                throw new Error(response.error || 'Failed to solve equation');
            }

            setResult(response);
            setShowSteps(false);

            if (response.data && response.data.assign) {
                const newVars = { ...dictOfVars, ...response.data.assign };
                setDictOfVars(newVars);
            }

            // Remove the localStorage history item creation
            // The API should automatically save the history on the backend
            // Then refresh history from API
            await refetchHistory();

        } catch (err) {
            console.error('Error:', err);
            setError(err.message || err?.data?.error || 'Failed to solve equation');
        } finally {
            setIsLoading(false);
        }
    };

    const adjustBrushSize = (delta) => {
        setBrushSize(prev => Math.max(1, Math.min(50, prev + delta)));
    };

    const switchInputMode = (mode) => {
        setInputMode(mode);
        setResult(null);
        setError('');
        if (mode === 'canvas') {
            setUploadedImage(null);
            setTimeout(() => resetCanvas(), 100);
        }
        if (isMobile() || isTablet()) {
            setMobileMenuOpen(false);
        }
    };

    function stripOuterDollarSigns(str) {
        if (typeof str === 'object' && str !== null) {
            return JSON.stringify(str).replace(/"/g, '').replace(/,/g, ', ').replace(/{|}/g, '');
        }
        if (typeof str !== 'string') return str;
        return str.replace(/\$(.+?)\$/g, (_, math) => math);
    }

    const renderSimplifiedSolution = (data) => {
        if (!data) return null;

        return (
            <div className={`flex ${isMobile() ? 'flex-col' : (isTablet() ? 'flex-col lg:flex-row' : 'flex-row')} gap-4 md:gap-6`}>
                {/* Left Side: Question & Answer */}
                <div className={`${isDesktop() ? 'lg:w-5/12' : 'w-full'} space-y-4`}>
                    <div className="bg-lightGreen/50 rounded-lg p-4 md:p-5 border border-primary/10 shadow-sm">
                        <h3 className="text-base md:text-lg font-semibold text-forestGreen mb-2 md:mb-3 flex items-center">
                            <Calculator className="w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                            Question
                        </h3>
                        <div className="text-gray-800 text-sm md:text-base lg:text-lg font-mono bg-white rounded-md p-3 md:p-4 border border-gray-100 shadow-sm break-words">
                            {stripOuterDollarSigns(data.expr || data.problemStatement || "Math problem from input")}
                        </div>
                    </div>

                    <div className="bg-lightGreen rounded-lg p-4 md:p-5 border border-primary/20 shadow-sm">
                        <h3 className="text-base md:text-lg font-semibold text-primary mb-2 md:mb-3 flex items-center">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                            Answer
                        </h3>
                        <div className="text-primary text-xl md:text-2xl lg:text-3xl font-bold font-mono bg-white rounded-md p-3 md:p-4 text-center border border-primary/10 shadow-sm break-words">
                            {stripOuterDollarSigns(data.result || data.finalAnswer || "Solution calculated")}
                        </div>
                    </div>
                </div>

                {/* Right Side: Steps */}
                {(data.stepByStepSolution || data.steps) && (
                    <div className={`${isDesktop() ? 'lg:w-7/12' : 'w-full'}`}>
                        {/* Mobile & Tablet View: Collapsible */}
                        <div className={`${isDesktop() ? 'lg:hidden' : 'block'} bg-white rounded-lg border border-gray-200 shadow-sm`}>
                            <details className="group">
                                <summary className="flex items-center justify-between p-4 md:p-5 cursor-pointer list-none text-gray-800 font-semibold select-none">
                                    <span className="text-sm md:text-base">Step-by-Step Solution</span>
                                    <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-500 transition-transform duration-300 group-open:rotate-180" />
                                </summary>
                                <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-2 md:space-y-3 border-t border-gray-100">
                                    {renderSteps(data)}
                                </div>
                            </details>
                        </div>

                        {/* Desktop View: Always Visible */}
                        <div className="hidden lg:flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm h-full">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                                <h3 className="text-base md:text-lg font-semibold text-gray-800">Step-by-Step Solution</h3>
                            </div>
                            <div className="p-4 md:p-5 overflow-y-auto max-h-[calc(100vh-250px)] space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {renderSteps(data)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSteps = (data) => {
        const steps = data.stepByStepSolution || data.steps || [];

        if (Array.isArray(steps) && steps.length > 0) {
            return steps.map((step, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-100">
                    <div className="flex items-start space-x-2 md:space-x-3">
                        <div className="bg-primary text-white rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-xs md:text-sm font-bold flex-shrink-0 shadow-sm">
                            {step.stepNumber || index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-gray-800 font-medium text-sm md:text-base mb-1 md:mb-2 break-words">
                                {step.title || step.description || `Step ${index + 1}`}
                            </h4>

                            {step.explanation && (
                                <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-3 break-words">{step.explanation}</p>
                            )}

                            {step.calculation && (
                                <div className="bg-white rounded p-2 md:p-3 mb-2 border">
                                    <div className="text-secondaryForestGreen text-xs font-medium mb-1">CALCULATION:</div>
                                    <pre className="text-forestGreen font-mono text-xs md:text-sm whitespace-pre-wrap break-words">
                                        {stripOuterDollarSigns(step.calculation)}
                                    </pre>
                                </div>
                            )}

                            {step.result && (
                                <div className="bg-lightGreen rounded p-2 md:p-3 border border-primary/20">
                                    <span className="text-primary text-xs font-medium">RESULT: </span>
                                    <span className="text-forestGreen text-sm md:text-base font-medium break-words">{stripOuterDollarSigns(step.result)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ));
        }

        return (
            <div className="text-gray-600 p-3 md:p-4 bg-gray-50 rounded-lg text-sm md:text-base">
                <p>Steps will be displayed here based on the solution method.</p>
            </div>
        );
    };

    // Show coming soon page if feature is inactive
    if (featureData?.is_active === 0) {
        return <ComingSoonModal featureData={featureData} />;
    }

    // Show loading state for other data
    if (featureDataLoading)
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-4">
                    <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-sm md:text-base text-gray-600">Loading Math Solver...</p>
                </div>
            </div>
        );

    // Show error state for other data
    if (featureDataError)
        return (
            <div className="text-red-500 text-center p-4 bg-red-50 min-h-screen flex items-center justify-center">
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md mx-4">
                    <h2 className="text-xl md:text-2xl font-bold mb-4">Oops! Something went wrong</h2>
                    <p className="text-sm md:text-base">Error loading feature status: {featureDataError?.toString()}</p>
                </div>
            </div>
        );

    // Tablet Toolbar Component
    const TabletToolbar = () => (
        <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
            <div className="flex items-center justify-between space-x-4">
                {/* Input Mode Toggle */}
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => switchInputMode('image')}
                        className={`px-4 py-2.5 rounded-md transition-colors flex items-center space-x-2 ${inputMode === 'image'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <FileImage className="w-4 h-4" />
                        <span className="text-sm font-medium">Upload</span>
                    </button>
                    <button
                        onClick={() => switchInputMode('canvas')}
                        className={`px-4 py-2.5 rounded-md transition-colors flex items-center space-x-2 ${inputMode === 'canvas'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <Brush className="w-4 h-4" />
                        <span className="text-sm font-medium">Draw</span>
                    </button>
                </div>

                {/* Drawing Tools */}
                {inputMode === 'canvas' && (
                    <div className="flex items-center space-x-3 flex-1 justify-end">
                        {/* Brush Types */}
                        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                            {BRUSH_TYPES.map((brush) => {
                                const IconComponent = brush.icon;
                                return (
                                    <button
                                        key={brush.id}
                                        onClick={() => setBrushType(brush.id)}
                                        className={`p-2.5 rounded-md transition-colors ${brushType === brush.id
                                            ? 'bg-primary text-white'
                                            : 'text-gray-500 hover:bg-gray-200'
                                            }`}
                                        title={brush.name}
                                    >
                                        <IconComponent className="w-4 h-4" />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Brush Size */}
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                            <button
                                onClick={() => adjustBrushSize(-1)}
                                className="text-gray-600 hover:text-gray-800 p-1"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-gray-800 font-mono min-w-[2.5rem] text-center">
                                {brushSize}
                            </span>
                            <button
                                onClick={() => adjustBrushSize(1)}
                                className="text-gray-600 hover:text-gray-800 p-1"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Color Picker */}
                        {brushType !== 'eraser' && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowColorPalette(!showColorPalette)}
                                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg"
                                >
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                                        style={{ backgroundColor: color }}
                                    />
                                </button>

                                {showColorPalette && (
                                    <div className="absolute bottom-full mb-2 right-0 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
                                        <div className="grid grid-cols-6 gap-2">
                                            {COLORS.map((col) => (
                                                <button
                                                    key={col}
                                                    onClick={() => {
                                                        setColor(col);
                                                        setShowColorPalette(false);
                                                    }}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === col ? 'border-primary scale-110' : 'border-gray-200 hover:scale-105'
                                                        }`}
                                                    style={{ backgroundColor: col }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Upload Button for Image Mode */}
                {inputMode === 'image' && (
                    <button
                        onClick={triggerImageUpload}
                        className="px-4 py-2.5 bg-lightGreen text-primary rounded-lg flex items-center space-x-2 border border-primary/20"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="font-medium">Choose Image</span>
                    </button>
                )}

                {/* Solve Button */}
                <button
                    onClick={solveMathProblem}
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-primary disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 font-semibold shadow-sm"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            <span>Solving...</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            <span>Solve</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const MobileToolbar = () => (
        <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-100 p-3 z-50">
            <div className="flex flex-col space-y-3">
                {/* First Row: Input Mode and Actions */}
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                    {/* Input Mode Toggle */}
                    <div className="flex items-center flex-1 bg-gray-100 rounded-lg p-0.5 sm:p-1">
                        <button
                            onClick={() => switchInputMode('image')}
                            className={`flex-1 px-1.5 sm:px-2 py-2 sm:py-2.5 rounded-md transition-colors flex items-center justify-center space-x-0.5 sm:space-x-1 ${inputMode === 'image'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            <FileImage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-[10px] sm:text-xs font-medium truncate">Upload</span>
                        </button>
                        <button
                            onClick={() => switchInputMode('canvas')}
                            className={`flex-1 px-1.5 sm:px-2 py-2 sm:py-2.5 rounded-md transition-colors flex items-center justify-center space-x-0.5 sm:space-x-1 ${inputMode === 'canvas'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            <Brush className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-[10px] sm:text-xs font-medium truncate">Draw</span>
                        </button>
                    </div>

                    {/* Tools Toggle Button */}
                    {inputMode === 'canvas' && (
                        <button
                            onClick={() => setShowMobileTools(!showMobileTools)}
                            className={`p-2 sm:p-2.5 rounded-md transition-colors ${showMobileTools
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            aria-label="Toggle tools"
                        >
                            <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    )}

                    {/* Solve Button */}
                    <button
                        onClick={solveMathProblem}
                        disabled={isLoading}
                        className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary disabled:opacity-50 text-white rounded-md flex items-center space-x-0.5 sm:space-x-1 font-semibold shadow-sm hover:bg-primary/90 active:bg-primary/95 transition-colors"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white border-t-transparent" />
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="text-[10px] sm:text-xs">Solve</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Mobile Tools Expanded */}
                {showMobileTools && inputMode === 'canvas' && (
                    <div className="pt-3 border-t border-gray-200 space-y-3">
                        {/* Brush Types */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Brush:</span>
                            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                                {BRUSH_TYPES.map((brush) => {
                                    const IconComponent = brush.icon;
                                    return (
                                        <button
                                            key={brush.id}
                                            onClick={() => setBrushType(brush.id)}
                                            className={`p-2 rounded-md transition-colors ${brushType === brush.id
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-gray-500'
                                                }`}
                                            title={brush.name}
                                        >
                                            <IconComponent className="w-4 h-4" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Brush Size */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Size:</span>
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                                <button
                                    onClick={() => adjustBrushSize(-1)}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-gray-800 text-sm font-mono min-w-[2rem] text-center">
                                    {brushSize}
                                </span>
                                <button
                                    onClick={() => adjustBrushSize(1)}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Color Picker */}
                        {brushType !== 'eraser' && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Color:</span>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowColorPalette(!showColorPalette)}
                                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        aria-label="Select color"
                                    >
                                        <div
                                            className={`${isMobile() ? 'w-7 h-7' : isTablet() ? 'w-7 h-7 md:w-8 md:h-8' : 'w-6 h-6'} rounded-full border-2 border-gray-300 shadow-sm`}
                                            style={{ backgroundColor: color }}
                                        />
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showColorPalette ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showColorPalette && (
                                        <div className={`
                    absolute bottom-full mb-2 right-0 p-3 bg-white rounded-lg shadow-xl border border-gray-200 z-50 
                    animate-in fade-in zoom-in-95 duration-150
                    ${isMobile() ? 'w-64' : isTablet() ? 'w-80' : 'w-48'}
                `}>
                                            {/* Responsive grid */}
                                            <div className={`
                        grid gap-2
                        ${isMobile() ? 'grid-cols-4' : isTablet() ? 'grid-cols-6' : 'grid-cols-4'}
                    `}>
                                                {COLORS.map((col) => (
                                                    <button
                                                        key={col}
                                                        onClick={() => {
                                                            setColor(col);
                                                            setShowColorPalette(false);
                                                        }}
                                                        className={`
                                    rounded-full border-2 transition-all duration-150
                                    ${isMobile() ? 'w-10 h-10' : isTablet() ? 'w-9 h-9 md:w-10 md:h-10' : 'w-8 h-8'}
                                    ${color === col
                                                                ? 'border-primary scale-110 ring-2 ring-primary/20'
                                                                : 'border-gray-200 hover:scale-105 hover:border-gray-300'
                                                            }
                                    shadow-sm hover:shadow
                                `}
                                                        style={{ backgroundColor: col }}
                                                        title={`Select color ${col}`}
                                                        aria-label={`Select color ${col}`}
                                                    />
                                                ))}
                                            </div>

                                            {/* Show color preview only on mobile/tablet for better UX */}
                                            {(isMobile() || isTablet()) && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">Selected:</span>
                                                    <div className="flex items-center space-x-2">
                                                        <div
                                                            className="w-5 h-5 rounded-full border-2 border-gray-200"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        <span className="text-xs font-mono text-gray-600">{color.toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Image Upload Button for Image Mode */}
                {inputMode === 'image' && !uploadedImage && (
                    <button
                        onClick={triggerImageUpload}
                        className="w-full py-3 bg-lightGreen text-primary rounded-lg flex items-center justify-center space-x-2 border border-primary/20"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="font-medium">Choose Image</span>
                    </button>
                )}
            </div>
        </div>
    );

    const MobileHeader = () => (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-3 py-2.5">
                {/* Back Button and Title */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-1">
                        <Calculator className="w-5 h-5 text-primary" />
                        <h1 className="text-base font-semibold text-gray-800">Math Solver</h1>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center space-x-2">
                    {/* History Button */}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 relative"
                    >
                        <History className="w-5 h-5" />
                        {history.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                                {history.length > 9 ? '9+' : history.length}
                            </span>
                        )}
                    </button>

                    {/* Language Selector */}
                    <select
                        value={selectedLanguage}
                        onChange={handleLanguageChange}
                        className="text-xs px-2 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 max-w-[100px]"
                    >
                        {languages.map((lang) => (
                            <option key={lang.code} value={lang.name}>
                                {lang.name}
                            </option>
                        ))}
                    </select>

                    {/* Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
                    <div className="p-3 space-y-2">
                        {/* Clear Button */}
                        <button
                            onClick={() => {
                                resetCanvas();
                                setMobileMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg"
                        >
                            <span className="text-sm text-red-700">Clear</span>
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                        {/* AI Instructions Button */}
                        <button
                            onClick={() => {
                                setShowPromptSidebar(true);
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-lg ${customPrompt.trim() ? 'bg-purple-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                            <span className={`text-sm ${customPrompt.trim() ? 'text-purple-700' : 'text-gray-700'}`}>
                                AI Instructions
                            </span>
                            <MessageSquare className={`w-4 h-4 ${customPrompt.trim() ? 'text-purple-500' : 'text-gray-500'}`} />
                        </button>

                        {/* Variables Display */}
                        {Object.keys(dictOfVars).length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="text-primary text-xs font-medium mb-2">Variables:</div>
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(dictOfVars).map(([key, value]) => (
                                        <span key={key} className="text-gray-800 text-xs bg-white px-2 py-1 rounded border">
                                            {key} = {typeof value === 'object' ? JSON.stringify(value) : value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const TabletHeader = () => (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center space-x-4">
                    {/* App Title */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 mr-1"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <Calculator className="w-5 h-5 text-primary" />
                        <h1 className="text-lg font-semibold text-gray-800">Math Solver</h1>
                    </div>

                    {/* Input Mode Toggle */}
                    <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <button
                            onClick={() => switchInputMode('image')}
                            className={`px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1 ${inputMode === 'image'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <FileImage className="w-4 h-4" />
                            <span className="text-xs font-medium">Upload</span>
                        </button>
                        <button
                            onClick={() => switchInputMode('canvas')}
                            className={`px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1 ${inputMode === 'canvas'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <Brush className="w-4 h-4" />
                            <span className="text-xs font-medium">Draw</span>
                        </button>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-3">
                    {/* Language Selector */}
                    <select
                        value={selectedLanguage}
                        onChange={handleLanguageChange}
                        className="text-sm px-2 py-1.5 border border-gray-200 rounded-md bg-white text-gray-700"
                    >
                        {languages.map((lang) => (
                            <option key={lang.code} value={lang.name}>
                                {lang.name}
                            </option>
                        ))}
                    </select>

                    {/* History with Dropdown */}
                    <TabletHistoryDropdown
                        showHistory={showHistory}
                        setShowHistory={setShowHistory}
                        history={history}
                        setResult={setResult}
                        setCustomPrompt={setCustomPrompt}
                        setHistory={setHistory}
                        historyRef={historyRef}
                    />

                    {/* Clear Button */}
                    <button
                        onClick={resetCanvas}
                        className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 border border-red-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    {/* AI Instructions Button */}
                    <button
                        onClick={() => setShowPromptSidebar(true)}
                        className={`p-2 rounded-md border ${customPrompt.trim()
                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                            : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const DesktopHeader = () => (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm h-16">
            <div className="flex items-center justify-between px-6 h-full">
                <div className="flex items-center space-x-6">
                    {/* App Title */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Calculator className="w-6 h-6 text-primary" />
                            <h1 className="text-xl font-semibold text-gray-800">Math Solver</h1>
                        </div>
                    </div>

                    {/* Input Mode Toggle */}
                    <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <button
                            onClick={() => switchInputMode('image')}
                            className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${inputMode === 'image'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500'
                                }`}
                        >
                            <FileImage className="w-4 h-4" />
                            <span className="text-sm font-medium">Upload</span>
                        </button>
                        <button
                            onClick={() => switchInputMode('canvas')}
                            className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${inputMode === 'canvas'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-500'
                                }`}
                        >
                            <Brush className="w-4 h-4" />
                            <span className="text-sm font-medium">Draw</span>
                        </button>
                    </div>

                    {/* Drawing Tools - Only show when in canvas mode */}
                    {inputMode === 'canvas' && (
                        <>
                            {/* Color Picker - Hide when eraser is selected */}
                            {brushType !== 'eraser' && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowColorPalette(!showColorPalette)}
                                        className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md transition-colors"
                                    >
                                        <div
                                            className="w-5 h-5 rounded-full border border-gray-200"
                                            style={{ backgroundColor: color }}
                                        />
                                        <Palette className="w-4 h-4 text-gray-500" />
                                    </button>

                                    {showColorPalette && (
                                        <div className="absolute top-full w-48 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
                                            <div className="grid grid-cols-4 gap-2">
                                                {COLORS.map((col) => (
                                                    <button
                                                        key={col}
                                                        onClick={() => {
                                                            setColor(col);
                                                            setShowColorPalette(false);
                                                        }}
                                                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === col ? 'border-primary ring-1 ring-primary' : 'border-gray-200'
                                                            }`}
                                                        style={{ backgroundColor: col }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Brush Type */}
                            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                                {BRUSH_TYPES.map((brush) => {
                                    const IconComponent = brush.icon;
                                    return (
                                        <button
                                            key={brush.id}
                                            onClick={() => setBrushType(brush.id)}
                                            className={`p-2 rounded-md transition-colors ${brushType === brush.id
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'text-gray-500'
                                                }`}
                                            title={brush.name}
                                        >
                                            <IconComponent className="w-4 h-4" />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Brush Size */}
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                                <button
                                    onClick={() => adjustBrushSize(-1)}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-gray-800 text-sm font-mono min-w-[2rem] text-center">
                                    {brushSize}
                                </span>
                                <button
                                    onClick={() => adjustBrushSize(1)}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}

                    {/* Upload Button - Only show when in image mode */}
                    {inputMode === 'image' && (
                        <button
                            onClick={triggerImageUpload}
                            className="px-4 py-2 bg-lightGreen text-primary rounded-md transition-colors flex items-center space-x-2 border border-primary/20"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="font-medium">Choose Image</span>
                        </button>
                    )}
                </div>

                {/* Right Section - Action Buttons */}
                <div className="flex items-center space-x-3">
                    {/* Variables Display */}
                    {Object.keys(dictOfVars).length > 0 && (
                        <div className="bg-gray-50 border border-gray-100 rounded-md px-3 py-2 max-w-xs">
                            <div className="text-primary text-xs font-medium mb-1">Variables:</div>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(dictOfVars).map(([key, value]) => (
                                    <span key={key} className="text-gray-800 text-xs bg-white px-2 py-1 rounded border">
                                        {key} = {typeof value === 'object' ? JSON.stringify(value) : value}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative" ref={historyRef}>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`px-4 py-2 bg-gray-50 border ${showHistory ? 'border-primary ring-1 ring-primary' : 'border-gray-100'} text-gray-600 rounded-md transition-colors flex items-center space-x-2`}
                        >
                            <History className="w-4 h-4" />
                            <span className="hidden sm:block font-medium">History</span>
                            {history.length > 0 && (
                                <span className="ml-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                                    {history.length > 9 ? '9+' : history.length}
                                </span>
                            )}
                        </button>

                        {/* History Dropdown */}
                        {showHistory && (
                            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg border border-gray-100 shadow-xl z-50 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <h3 className="text-gray-800 font-semibold text-sm">History</h3>
                                    {/* <button
                                        onClick={() => setHistory([])}
                                        className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                                        title="Clear History"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button> */}
                                    <></>
                                </div>
                                <div className="overflow-y-auto max-h-80 p-2 space-y-2">
                                    {history.length === 0 ? (
                                        <p className="text-gray-400 p-8 text-center text-sm">No history yet</p>
                                    ) : (
                                        history.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    setResult(item.solution);
                                                    setShowHistory(false);
                                                    if (item.prompt) {
                                                        setCustomPrompt(item.prompt);
                                                    }
                                                }}
                                                className="p-3 bg-white hover:bg-gray-50 rounded-md cursor-pointer transition-colors border border-gray-100 group"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-gray-400">{item.timestamp}</span>
                                                    <div className="flex items-center space-x-1 text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                                                        {item.inputMode === 'canvas' ? <Brush className="w-3 h-3" /> : <FileImage className="w-3 h-3" />}
                                                        <span>{item.inputMode === 'canvas' ? 'Draw' : 'Image'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-gray-700 font-mono text-sm line-clamp-2">
                                                    {item.equation}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={resetCanvas}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-md transition-colors flex items-center space-x-2 border border-red-100"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:block font-medium">Clear</span>
                    </button>

                    <button
                        onClick={solveMathProblem}
                        disabled={isLoading}
                        className="px-6 py-2 bg-primary disabled:opacity-50 text-white rounded-md transition-colors flex items-center space-x-2 font-semibold shadow-sm"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                <span>Solving...</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                <span>Solve</span>
                            </>
                        )}
                    </button>

                    <div className="relative">
                        <select
                            id="language-select"
                            value={selectedLanguage}
                            onChange={handleLanguageChange}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white text-gray-700"
                        >
                            {languages.map((lang) => (
                                <option key={lang.code} value={lang.name}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setShowPromptSidebar(true)}
                        className={`px-3 py-2 border rounded-md transition-colors flex items-center space-x-2 ${customPrompt.trim() ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'}`}
                        title="AI Instructions"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm font-medium">AI Instructions</span>
                        {customPrompt.trim() && (
                            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        )}
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="px-3 py-2 bg-gray-50 border border-gray-100 text-gray-500 rounded-md transition-colors hover:bg-gray-100"
                        title="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );

    const getTopOffset = () => {
        if (isMobile()) return 56;
        if (isTablet()) return 64;
        return 64;
    };

    const getBottomOffset = () => {
        if (isMobile()) return 80;
        if (isTablet()) return 84;
        return 0;
    };

    return (
        <div className="fixed inset-0 bg-white overflow-hidden">
            <DefaultSEOMeta />

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />

            {/* Conditional Header */}
            {isDesktop() ? (
                <DesktopHeader />
            ) : isTablet() ? (
                <TabletHeader />
            ) : (
                <MobileHeader />
            )}

            {/* Mobile History Drawer */}
            {isMobile() && (
                <MobileHistoryDrawer
                    showHistory={showHistory}
                    setShowHistory={setShowHistory}
                    history={history}
                    setResult={setResult}
                    setCustomPrompt={setCustomPrompt}
                    setHistory={setHistory}
                />
            )}

            {/* Conditional Toolbar */}
            {!isDesktop() && (
                isTablet() ? <TabletToolbar /> : <MobileToolbar />
            )}

            {/* Error Message */}
            {error && (
                <div className={`absolute ${isMobile() ? 'top-14 left-3 right-3' : (isTablet() ? 'top-20 left-4 right-4' : 'top-20 left-6 right-6 max-w-md mx-auto')} bg-red-50 rounded-lg border border-red-200 shadow-sm z-40`}>
                    <div className="p-3 md:p-4 flex items-center space-x-2 md:space-x-3">
                        <div className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0">⚠️</div>
                        <div className="text-red-800 text-xs md:text-sm flex-1">{error}</div>
                        <button
                            onClick={() => setError('')}
                            className="text-red-600 hover:text-red-800 transition-colors text-lg md:text-xl ml-auto"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div
                className="absolute inset-0 overflow-hidden"
                style={{
                    top: `${getTopOffset()}px`,
                    bottom: `${getBottomOffset()}px`
                }}
            >
                {inputMode === 'canvas' ? (
                    /* Canvas */
                    <canvas
                        ref={canvasRef}
                        className={`w-full h-full touch-none ${brushType === 'eraser' ? 'cursor-crosshair' : 'cursor-crosshair'}`}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        onTouchCancel={stopDrawing}
                    />
                ) : (
                    /* Image Upload Area */
                    <div className="w-full h-full flex items-center justify-center p-3 md:p-6 lg:p-8">
                        {uploadedImage ? (
                            <div className="max-w-full max-h-full">
                                <img
                                    src={uploadedImage.dataUrl}
                                    alt="Uploaded math problem"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-gray-200"
                                />
                            </div>
                        ) : (
                            <div
                                onClick={triggerImageUpload}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 lg:p-12 text-center cursor-pointer transition-colors w-full max-w-sm md:max-w-md lg:max-w-lg mx-4"
                            >
                                <Upload className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-600 mb-1 md:mb-2">Upload Math Problem</h3>
                                <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">Click here or drag and drop an image</p>
                                <div className="text-xs text-gray-400">
                                    Supported: JPG, PNG, GIF, WebP
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Solution Overlay */}
            {result && result.data && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 shadow-sm bg-white shrink-0">
                        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center space-x-2">
                            <Calculator className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            <span>Math Solution</span>
                        </h2>
                        <button
                            onClick={() => setResult(null)}
                            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-50/30 p-3 md:p-6 lg:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="max-w-7xl mx-auto">
                            {/* Check if response is a multi-problem object */}
                            {(!result.data.problemType && !result.data.problemStatement && Object.keys(result.data).some(k => k.toLowerCase().includes('problem'))) ? (
                                <div className="space-y-3 md:space-y-4">
                                    {Object.entries(result.data).map(([key, problemData]) => (
                                        <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <button
                                                onClick={() => setActiveProblem(activeProblem === key ? null : key)}
                                                className="w-full flex items-center justify-between p-3 md:p-4 lg:p-5 bg-white hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <h3 className="font-bold text-base md:text-lg text-primary">{key}</h3>
                                                {activeProblem === key ? (
                                                    <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                                )}
                                            </button>

                                            {activeProblem === key && (
                                                <div className="p-3 md:p-4 lg:p-6 border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
                                                    {renderSimplifiedSolution(problemData)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 md:p-4 lg:p-6">
                                    {renderSimplifiedSolution(result.data)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            {!result && isDesktop() && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-gray-400 z-40">
                    <p className="text-sm">
                        {inputMode === 'canvas'
                            ? 'Draw your math problem on the canvas and click "Solve" to get the answer'
                            : 'Upload an image of your math problem and click "Solve" to get the answer'
                        }
                    </p>
                </div>
            )}

            {/* Prompt Sidebar */}
            <PromptSidebar
                showPromptSidebar={showPromptSidebar}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                setShowPromptSidebar={setShowPromptSidebar}
                isMobile={isMobile}
                isTablet={isTablet}
            />
        </div>
    );
};

export default MathSolver;