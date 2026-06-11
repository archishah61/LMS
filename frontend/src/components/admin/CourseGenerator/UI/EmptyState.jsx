"use client";

import {
  BookOpen,
  Sparkles,
  Upload,
  FileText,
  ArrowRight,
  Zap,
  Users,
  Clock,
} from "lucide-react";

const EmptyState = ({ onGenerateClick, onUploadClick, className = "" }) => {
  return (
    <div
      className={`flex items-center justify-center min-h-[600px] bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40 ${className}`}
    >
      <div className="text-center max-w-2xl mx-auto p-8">
        {/* Animated Hero Section */}
        <div className="relative mb-12">
          {/* Main Icon with Floating Elements */}
          <div className="relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-200/50 transform hover:scale-105 transition-all duration-300">
              <BookOpen className="w-16 h-16 text-white" />
            </div>

            {/* Floating Icons */}
            <div className="absolute -top-4 -left-6 md:-left-8 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div
              className="absolute -bottom-2 -right-4 md:-right-8 w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg"
              style={{ animation: "bounce 2s infinite 1s" }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div
              className="absolute top-8 -right-6 md:-right-12 w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg"
              style={{ animation: "bounce 2s infinite 0.5s" }}
            >
              <Users className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-purple-200/20 rounded-full blur-lg"></div>
          </div>
        </div>

        {/* Enhanced Main Message */}
        <div className="mb-12">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 leading-tight">
            Ready to Create Amazing
            <br />
            <span className="text-3xl md:text-5xl">Course Content?</span>
          </h1>
          <p className="text-base md:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto">
            Transform your ideas into engaging learning experiences with
            AI-powered content generation or upload your existing materials.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button
            onClick={onGenerateClick}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between space-x-3">
              <Sparkles className="w-5 h-5" />
              <span>Generate with AI</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>

          <button
            onClick={onUploadClick}
            className="group px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between space-x-3">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>Upload Content</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>
        </div>

        {/* Enhanced Feature Grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">
              AI-Powered Generation
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Create comprehensive course content instantly with advanced AI
              technology
            </p>
          </div>

          <div className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Multiple Formats</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Support for documents, presentations, videos, and interactive
              content
            </p>
          </div>

          <div className="group p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">
              Structured Learning
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Organize content into progressive modules for optimal learning
              outcomes
            </p>
          </div>
        </div> */}

        {/* Stats/Benefits Bar */}
        {/* <div className="mt-16 flex flex-wrap justify-center gap-8 text-center">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">5 min</span>
            <span className="text-sm">setup time</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">10k+</span>
            <span className="text-sm">educators trust us</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">50%</span>
            <span className="text-sm">faster content creation</span>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default EmptyState;
