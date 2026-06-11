import React, { useState } from 'react';
import {
    Clock, Timer, TrendingUp, Flag, Zap, Target, Calendar, BookOpen,
    CheckCircle, Activity, ArrowRight, Monitor, Video,
    Smartphone, ExternalLink, Star, Download, RefreshCw, ChevronRight,
    Award, Shield, Users, Wallet, Briefcase, GraduationCap,
    Lightbulb, BarChart, Layers, Brain, Radio, Newspaper, Medal
} from 'lucide-react';
import RoadmapPDFGenerator from './RoadmapPDFGenerator';

const UniversalRoadmapDisplay = ({ finalRoadmap }) => {
    const roadmap = finalRoadmap?.roadmap;
    const nextSteps = finalRoadmap?.nextSteps;
    const [activeResourceTab, setActiveResourceTab] = useState("books");
    const [expandedPhase, setExpandedPhase] = useState(0);

    // Helpers to safely render lists
    const renderList = (items) => {
        if (!items) return null;
        const listItems = Array.isArray(items) ? items : [items];
        if (listItems.length === 0) return null;

        const renderTextWithMarkdown = (text) => {
            if (typeof text !== 'string') return text;
            return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
                }
                return part;
            });
        };

        return (
            <ul className="space-y-2">
                {listItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 tracking-normal">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="leading-relaxed break-words">
                            {typeof item === 'object' ? JSON.stringify(item) : renderTextWithMarkdown(item)}
                        </span>
                    </li>
                ))}
            </ul>
        );
    };

    const renderChips = (items) => {
        if (!items) return null;
        const listItems = Array.isArray(items) ? items : [items];
        if (listItems.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2">
                {listItems.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-md tracking-wide">
                        {typeof item === 'object' ? JSON.stringify(item) : item}
                    </span>
                ))}
            </div>
        );
    };

    if (!roadmap) return null;

    // Resource tabs configuration
    const mapResourceData = () => {
        const tabs = [];
        const lib = roadmap.resourceLibrary || {};
        if (lib.essentialBooks?.length) tabs.push({ id: "books", label: "Books", icon: BookOpen, data: lib.essentialBooks });
        if (lib.onlinePlatforms?.length) tabs.push({ id: "platforms", label: "Platforms", icon: Monitor, data: lib.onlinePlatforms });
        if (lib.youtubeChannels?.length) tabs.push({ id: "youtube", label: "YouTube", icon: Video, data: lib.youtubeChannels });
        if (lib.podcastsAndAudiobooks?.length) tabs.push({ id: "podcasts", label: "Audio", icon: Radio, data: lib.podcastsAndAudiobooks });
        if (lib.blogs?.length) tabs.push({ id: "blogs", label: "Blogs", icon: Newspaper, data: lib.blogs });
        if (lib.mobileApps?.length) tabs.push({ id: "apps", label: "Apps", icon: Smartphone, data: lib.mobileApps });
        if (lib.certificationPrograms?.length) tabs.push({ id: "certs", label: "Certs", icon: GraduationCap, data: lib.certificationPrograms });
        return tabs;
    };

    const resourceTabs = mapResourceData();
    const activeTab = resourceTabs.find(t => t.id === activeResourceTab) ? activeResourceTab : resourceTabs[0]?.id;
    const activeTabData = resourceTabs.find(t => t.id === activeTab)?.data;

    const hasMainContent = roadmap.executiveSummary ||
        roadmap.goalDetails ||
        (roadmap.learningPath?.phases?.length > 0) ||
        roadmap.practiceStrategy ||
        roadmap.overcomingChallenges ||
        roadmap.successMetrics ||
        roadmap.mentorshipAndNetworking ||
        roadmap.careerAndFutureOpportunities;

    return (
        <div className="w-full py-4 xs:py-4 md:py-6 min-h-screen text-gray-900 lpa-no-scrollbar">
            <div className="container mx-auto space-y-4 xs:space-y-6">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 xs:p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 xs:gap-5">
                        <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                            <Target className="w-5 h-5 xs:w-6 xs:h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base xs:text-xl font-bold text-gray-900 tracking-tight">Your Personalized Roadmap</h2>
                            <p className="text-xs xs:text-sm text-gray-500 font-medium tracking-normal">Designed for mastery and continuous growth</p>
                        </div>
                    </div>
                    <div className="flex gap-2 xs:gap-3 shrink-0">
                        <RoadmapPDFGenerator finalRoadmap={finalRoadmap} />
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-white border border-gray-200 text-gray-700 font-semibold py-1.5 xs:py-2 px-3 xs:px-5 rounded-md transition-colors hover:bg-gray-50 flex items-center gap-1.5 xs:gap-2 text-xs xs:text-sm"
                        >
                            <RefreshCw className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                            <span>Regenerate</span>
                        </button>
                    </div>
                </div>

                {/* Quick Stats Dashboard */}
                {nextSteps?.quickSummary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
                        {[
                            { label: "Total Duration", value: nextSteps.quickSummary.totalJourneyTime, icon: Clock },
                            { label: "Daily Effort", value: nextSteps.quickSummary.dailyCommitment, icon: Timer },
                            { label: "Success Possibility", value: nextSteps.quickSummary.successProbability, icon: TrendingUp },
                            { label: "First Milestone", value: nextSteps.quickSummary.firstMilestone, icon: Flag },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-3 xs:p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 xs:gap-3 mb-1.5 xs:mb-2">
                                    <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-md bg-primary/5 flex items-center justify-center shrink-0">
                                        <stat.icon className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-primary" />
                                    </div>
                                    <span className="text-[9px] xs:text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">{stat.label}</span>
                                </div>
                                <p className="text-sm xs:text-base font-bold text-gray-900 truncate tracking-tight" title={stat.value}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className={`grid grid-cols-1 ${hasMainContent ? 'lg:grid-cols-3' : ''} gap-6`}>
                    {/* Left Column: Learning Path & Strategy */}
                    {hasMainContent && (
                        <div className="lg:col-span-2 space-y-6">

                            {/* Executive Summary */}
                            {roadmap.executiveSummary && (
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/30">
                                        <Activity className="w-4 h-4 text-primary" />
                                        <h3 className="font-bold text-gray-900 text-sm tracking-wide uppercase">Strategic Overview</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Goal Analysis</h4>
                                                <p className="text-sm text-gray-600 leading-relaxed font-medium tracking-normal">
                                                    {roadmap.executiveSummary.goalOverview}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Timeline Reality</h4>
                                                <p className="text-sm text-gray-600 leading-relaxed tracking-normal">
                                                    {roadmap.executiveSummary.timelineReality}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Expanded Executive Summary Data */}
                                        <div className="pt-4 border-t border-gray-100 grid md:grid-cols-2 gap-8">
                                            {roadmap.executiveSummary.personalizedAssessment && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personal Assessment</h4>
                                                    <p className="text-sm text-gray-600 leading-relaxed tracking-normal">{roadmap.executiveSummary.personalizedAssessment}</p>
                                                </div>
                                            )}
                                            {roadmap.executiveSummary.keySuccessFactors && (
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Key Success Factors</h4>
                                                    {renderList(roadmap.executiveSummary.keySuccessFactors)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Strengths and Challenges Grid */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {roadmap.executiveSummary.competitiveAdvantages?.length > 0 && (
                                                <div className="bg-primary/5 rounded-md p-4 border border-primary/10">
                                                    <h5 className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide mb-3">
                                                        <Star className="w-3.5 h-3.5" /> Your Advantages
                                                    </h5>
                                                    {renderList(roadmap.executiveSummary.competitiveAdvantages)}
                                                </div>
                                            )}
                                            {roadmap.executiveSummary.uniqueChallenges?.length > 0 && (
                                                <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                                                    <h5 className="flex items-center gap-2 text-gray-700 font-bold text-xs uppercase tracking-wide mb-3">
                                                        <Shield className="w-3.5 h-3.5" /> Challenges to Navigate
                                                    </h5>
                                                    {renderList(roadmap.executiveSummary.uniqueChallenges)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Goal Details Deep Dive */}
                            {roadmap.goalDetails && (
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/30">
                                        <Target className="w-4 h-4 text-primary" />
                                        <h3 className="font-bold text-gray-900 text-sm tracking-wide uppercase">Goal Deep Dive</h3>
                                    </div>
                                    <div className="p-6 grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">What it Involves</h4>
                                                <p className="text-sm text-gray-600 tracking-normal">{roadmap.goalDetails.whatItInvolves}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Skills Required</h4>
                                                <div className="space-y-2">
                                                    {roadmap.goalDetails.skillsRequired?.map((skill, i) => (
                                                        <div key={i} className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700 shadow-sm leading-relaxed">
                                                            {typeof skill === 'string' ? skill.split(/(\*\*.*?\*\*)/g).map((part, index) => {
                                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                                    return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
                                                                }
                                                                return part;
                                                            }) : JSON.stringify(skill)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Knowledge Areas</h4>
                                                {renderList(roadmap.goalDetails.knowledgeAreas)}
                                            </div>
                                            {roadmap.goalDetails.certifications?.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Recommended Certifications</h4>
                                                    <div className="grid gap-3">
                                                        {roadmap?.goalDetails?.certifications?.map((cert, i) => {
                                                            if (typeof cert === 'string') {
                                                                return (
                                                                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                                        <span>{cert}</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div key={i} className="bg-white p-4 rounded-md border border-gray-200 text-sm shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
                                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                                                    <div className="mb-2">
                                                                        <h5 className="font-bold text-gray-900 leading-tight text-base">{cert.certificationName}</h5>
                                                                        <p className="text-xs text-gray-500 mt-0.5">{cert.provider}</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-3">
                                                                        {cert.cost && <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">{cert.cost}</span>}
                                                                        {cert.difficulty && <span className="bg-gray-100 px-2 py-0.5 rounded">{cert.difficulty}</span>}
                                                                        {cert.duration && <span className="bg-gray-100 px-2 py-0.5 rounded">{cert.duration}</span>}
                                                                    </div>
                                                                    {cert.examFormat && (
                                                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">Format: {cert.examFormat}</p>
                                                                    )}
                                                                    {cert.websiteUrl && (
                                                                        <a href={cert.websiteUrl} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline inline-flex items-center gap-1">
                                                                            View Certification <ExternalLink className="w-3 h-3" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {roadmap.goalDetails.careerPathways?.length > 0 && (
                                            <div className="md:col-span-2 pt-4 border-t border-gray-100">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Future Pathways</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {renderChips(roadmap.goalDetails.careerPathways)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Learning Stages Accordion */}
                            {roadmap.learningPath?.phases?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4 px-1">
                                        <Layers className="w-5 h-5 text-primary" />
                                        <h3 className="font-bold text-lg text-gray-900 tracking-tight">Learning Path Phases</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {roadmap.learningPath.phases.map((phase, index) => {
                                            const isExpanded = expandedPhase === index;
                                            return (
                                                <div key={index} className={`bg-white rounded-lg border transition-all duration-200 overflow-hidden ${isExpanded ? 'border-primary shadow-sm' : 'border-gray-200'}`}>
                                                    <button
                                                        onClick={() => setExpandedPhase(isExpanded ? -1 : index)}
                                                        className="w-full flex items-center justify-between p-3 xs:p-4 text-left cursor-pointer focus:outline-none"
                                                    >
                                                        <div className="flex items-center gap-2 xs:gap-4 min-w-0">
                                                            <div className={`w-8 h-8 xs:w-9 xs:h-9 rounded-md flex items-center justify-center font-bold text-xs xs:text-sm transition-colors shrink-0 ${isExpanded ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                                {index + 1}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className={`font-bold text-sm xs:text-base transition-colors truncate ${isExpanded ? 'text-primary' : 'text-gray-900'}`}>{phase.phaseName}</h4>
                                                                <div className="flex items-center gap-1.5 xs:gap-2 text-[10px] xs:text-xs text-gray-500 font-medium mt-0.5">
                                                                    <Clock className="w-2.5 h-2.5 xs:w-3 xs:h-3 shrink-0" />
                                                                    {phase.duration}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`w-6 h-6 xs:w-7 xs:h-7 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${isExpanded ? 'bg-primary/10 rotate-180' : 'bg-gray-50'}`}>
                                                            <ChevronRight className={`w-3.5 h-3.5 xs:w-4 xs:h-4 transition-colors ${isExpanded ? 'text-primary' : 'text-gray-400'}`} />
                                                        </div>
                                                    </button>

                                                    <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                        <div className="px-3 xs:px-6 pb-4 xs:pb-6 pt-2 border-t border-gray-50">
                                                            <div className="grid sm:grid-cols-2 gap-4 xs:gap-8 pt-3 xs:pt-4">
                                                                {/* Objectives & Activities */}
                                                                <div>
                                                                    <div className="mb-6">
                                                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                            <Target className="w-3 h-3" /> Key Objectives
                                                                        </h5>
                                                                        <ul className="space-y-3">
                                                                            {phase.objectives?.map((obj, i) => (
                                                                                <li key={i} className="text-sm text-gray-700 flex items-start gap-3 bg-gray-50/50 p-2.5 rounded-md border border-gray-100/50">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                                                    <span className="leading-snug">{obj}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>

                                                                    {/* Knowledge To Gain */}
                                                                    {phase.knowledgeToGain?.length > 0 && (
                                                                        <div className="mb-6">
                                                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                                <Brain className="w-3 h-3" /> Core Concepts
                                                                            </h5>
                                                                            {renderChips(phase.knowledgeToGain)}
                                                                        </div>
                                                                    )}

                                                                    {/* Projects */}
                                                                    {phase.practicalProjects?.length > 0 && (
                                                                        <div>
                                                                            <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                                <Briefcase className="w-3 h-3" /> Practical Projects
                                                                            </h5>
                                                                            <div className="space-y-3">
                                                                                {phase.practicalProjects.map((proj, i) => {
                                                                                    if (typeof proj === 'string') {
                                                                                        const parts = proj.split(':');
                                                                                        return (
                                                                                            <div key={i} className="p-3 bg-primary/5 rounded-md border border-primary/10">
                                                                                                <p className="text-sm font-bold text-primary mb-1">Project: {parts[0] || "Project"}</p>
                                                                                                <p className="text-xs text-gray-600 leading-relaxed">{parts[1] || proj}</p>
                                                                                            </div>
                                                                                        );
                                                                                    }

                                                                                    // Handle detailed object structure
                                                                                    return (
                                                                                        <div key={i} className="p-3 bg-primary/5 rounded-md border border-primary/10 space-y-2">
                                                                                            <div>
                                                                                                <p className="text-sm font-bold text-primary mb-0.5">{proj.projectName || proj.title || `Project ${i + 1}`}</p>
                                                                                                {proj.difficulty && <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-primary/20 text-primary font-medium">{proj.difficulty}</span>}
                                                                                                {proj.timeRequired && <span className="text-[10px] ml-2 text-gray-500 font-medium"><Clock className="w-3 h-3 inline mr-1" />{proj.timeRequired}</span>}
                                                                                            </div>

                                                                                            {proj.expectedOutcome && (
                                                                                                <p className="text-xs text-gray-600 leading-relaxed border-l-2 border-primary/20 pl-2">
                                                                                                    {proj.expectedOutcome}
                                                                                                </p>
                                                                                            )}

                                                                                            {proj.skillsUsed && (
                                                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                                                    {Array.isArray(proj.skillsUsed) && proj.skillsUsed.map((skill, si) => (
                                                                                                        <span key={si} className="text-[9px] bg-white text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">{skill}</span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Skills, Schedule and Milestones */}
                                                                <div className="space-y-6">
                                                                    <div className="bg-primary/5 rounded-lg p-5 border border-primary/10">
                                                                        <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                            <Calendar className="w-3.5 h-3.5" /> Weekly Focus
                                                                        </h5>
                                                                        <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-primary/10">
                                                                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Daily Commitment</span>
                                                                            <span className="font-medium text-gray-900 text-sm bg-white p-3 rounded-md border border-primary/5 shadow-sm leading-relaxed">
                                                                                {phase.dailySchedule?.recommendedHours}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {phase.dailySchedule?.timeAllocation && Object.entries(phase.dailySchedule.timeAllocation).map(([activity, time], i) => (
                                                                                <div key={i} className="flex justify-between text-xs items-center">
                                                                                    <span className="capitalize text-gray-600 flex items-center gap-2">
                                                                                        <div className="w-1 h-1 bg-primary rounded-full" /> {activity}
                                                                                    </span>
                                                                                    <span className="font-bold text-gray-900 ml-4">{time}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {phase.dailySchedule?.weeklyPlan && (
                                                                            <div className="mt-4 pt-3 border-t border-primary/10">
                                                                                <p className="text-xs text-gray-600 leading-relaxed">{phase.dailySchedule.weeklyPlan}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Skills Gained</h5>
                                                                        {renderChips(phase.skillsToAcquire)}
                                                                    </div>

                                                                    {phase.milestones?.length > 0 && (
                                                                        <div>
                                                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Milestones</h5>
                                                                            <div className="space-y-2">
                                                                                {phase.milestones.map((m, i) => (
                                                                                    <div key={i} className="flex gap-2 items-start text-xs border border-gray-200 p-2.5 rounded-md bg-gray-50/50">
                                                                                        <Flag className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                                                                        <div>
                                                                                            <span className="font-bold text-gray-900 block">{m.milestone}</span>
                                                                                            <span className="text-gray-500 block">Target: {m.targetDate}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Key Activities Footer */}
                                                            {phase.keyActivities && (
                                                                <div className="mt-6 pt-4 border-t border-gray-100">
                                                                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Core Activities</h5>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {phase.keyActivities.map((act, i) => (
                                                                            <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                                                                                <CheckCircle className="w-4 h-4 text-primary/60 shrink-0" />
                                                                                <span>{act}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Strategy & Support Sections */}
                            {(roadmap.practiceStrategy || roadmap.overcomingChallenges || roadmap.successMetrics || roadmap.mentorshipAndNetworking) && (
                                <div className="grid sm:grid-cols-2 gap-4 xs:gap-6">

                                    {/* Practice Strategy */}
                                    {roadmap.practiceStrategy && (
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                                <Award className="w-4 h-4 text-primary" />
                                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Practice Strategy</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {roadmap.practiceStrategy.skillBuilding?.dailyPractice && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Daily Routine</h4>
                                                        <p className="text-sm text-gray-600 tracking-normal">{roadmap.practiceStrategy.skillBuilding.dailyPractice}</p>
                                                    </div>
                                                )}
                                                {roadmap.practiceStrategy.assessmentMethods && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Assessment Methods</h4>
                                                        <ul className="space-y-2">
                                                            {roadmap.practiceStrategy.assessmentMethods.map((m, i) => (
                                                                <li key={i} className="text-sm text-gray-600 flex justify-between items-center">
                                                                    <span>{m.methodName}</span>
                                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium">{m.frequency}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Overcoming Challenges */}
                                    {roadmap.overcomingChallenges && (
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                                <Shield className="w-4 h-4 text-primary" />
                                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Overcoming Challenges</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {roadmap.overcomingChallenges.commonObstacles?.slice(0, 2).map((obs, i) => (
                                                    <div key={i} className="bg-red-50/50 border border-red-100 p-3 rounded-md">
                                                        <p className="text-sm font-bold text-gray-800 mb-1">{obs.obstacle}</p>
                                                        <p className="text-xs text-gray-600 leading-relaxed">Strategy: {obs.resolutionStrategy}</p>
                                                    </div>
                                                ))}
                                                {roadmap.overcomingChallenges.motivationMaintenance?.techniques && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Motivation Tips</h4>
                                                        {renderList(roadmap.overcomingChallenges.motivationMaintenance.techniques)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Success Metrics */}
                                    {roadmap.successMetrics && (
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                                <BarChart className="w-4 h-4 text-primary" />
                                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Success Metrics</h3>
                                            </div>
                                            <div className="space-y-6">
                                                {roadmap.successMetrics.quantitativeMetrics && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quantitative</h4>
                                                        <div className="space-y-3">
                                                            {roadmap.successMetrics.quantitativeMetrics.map((m, i) => (
                                                                <div key={i} className="grid grid-cols-12 gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0 items-baseline">
                                                                    <div className="col-span-5 text-sm text-gray-700 font-medium leading-snug">
                                                                        {m.metric}
                                                                    </div>
                                                                    <div className="col-span-7 text-xs text-primary font-bold bg-primary/5 p-2 rounded-md leading-relaxed">
                                                                        {m.improvementRate || 'Track Progress'}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {roadmap.successMetrics.celebrationPoints && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Celebration Points</h4>
                                                        <div className="space-y-2">
                                                            {roadmap.successMetrics.celebrationPoints.map((p, i) => (
                                                                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 items-start">
                                                                    <div className="p-1.5 bg-white rounded shadow-sm shrink-0 mt-0.5">
                                                                        <Medal className="w-3.5 h-3.5 text-yellow-500" />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-gray-700 leading-relaxed">
                                                                        {p.achievement}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mentorship & Networking */}
                                    {roadmap.mentorshipAndNetworking && (
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                                                <Users className="w-4 h-4 text-primary" />
                                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Community & Network</h3>
                                            </div>
                                            <div className="space-y-4">
                                                {roadmap.mentorshipAndNetworking.findingMentors && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Finding Mentors</h4>
                                                        <p className="text-sm text-gray-600 tracking-normal">{roadmap.mentorshipAndNetworking.findingMentors.approachStrategy}</p>
                                                    </div>
                                                )}
                                                {roadmap.mentorshipAndNetworking.peerCommunities && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Communities</h4>
                                                        <div className="space-y-2">
                                                            {roadmap.mentorshipAndNetworking.peerCommunities.map((c, i) => (
                                                                <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md border border-gray-100">
                                                                    <span className="font-medium text-gray-700">{c.communityName}</span>
                                                                    {c.joinUrl && <a href={c.joinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">Join <ExternalLink className="w-3 h-3" /></a>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}

                            {/* Career & Future Opportunities */}
                            {roadmap.careerAndFutureOpportunities && (
                                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 xs:p-6 text-white shadow-sm border border-gray-800">
                                    <div className="flex items-center gap-2 mb-4 xs:mb-6 border-b border-gray-700 pb-3 xs:pb-4">
                                        <Briefcase className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                                        <h3 className="font-bold text-base xs:text-lg tracking-tight">Future Opportunities</h3>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-4 xs:gap-8">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Immediate Prospects</h4>
                                            <ul className="space-y-3">
                                                {roadmap.careerAndFutureOpportunities.immediateOpportunities?.map((op, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                                                        <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                        <span className="leading-relaxed">{op}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Long Term Vision</h4>
                                            <ul className="space-y-3">
                                                {roadmap.careerAndFutureOpportunities.longTermProspects?.map((op, i) => (
                                                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                                                        <Star className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                                        <span className="leading-relaxed">{op}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* Right Column: Sidebar */}
                    <div className={!hasMainContent ? 'grid sm:grid-cols-2 gap-4 xs:gap-6 w-full' : 'space-y-4 xs:space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto scrollbar-hide'}>

                        {/* Immediate Actions */}
                        {nextSteps?.immediateActions && (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-primary/10 rounded-md">
                                        <Zap className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-base">Immediate Steps</h3>
                                </div>

                                <div className="relative space-y-6">
                                    <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-gray-100" />
                                    {nextSteps.immediateActions.slice(0, 5).map((action, i) => (
                                        <div key={i} className="relative pl-10">
                                            <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${i === 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <span className="text-xs font-bold">{i + 1}</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-primary/5 text-primary">
                                                    {action.timeframe}
                                                </span>
                                                <h4 className="font-bold text-gray-900 text-sm leading-tight">{action.action}</h4>
                                                <p className="text-xs text-gray-500 leading-relaxed">{action.expectedOutcome}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weekly Goals Widget */}
                        {nextSteps?.weeklyGoals && (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">First Week Goals</h3>
                                </div>
                                <div className="space-y-2.5">
                                    {nextSteps.weeklyGoals[0]?.goals?.map((g, i) => (
                                        <div key={i} className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50 p-2.5 rounded-md border border-gray-100">
                                            <input type="checkbox" className="mt-0.5 rounded text-primary focus:ring-primary border-gray-300 w-4 h-4" />
                                            <span className="leading-snug">{g}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resource Library Tabbed Widget */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-fit">
                            <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <BookOpen className="w-4 h-4 text-primary" /> Recommended Resources
                                </h3>
                            </div>

                            {activeTabData ? (
                                <>
                                    <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
                                        {resourceTabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveResourceTab(tab.id)}
                                                className={`flex-shrink-0 py-2.5 xs:py-3 px-2 xs:px-3 text-[10px] xs:text-xs font-bold transition-colors whitespace-nowrap border-b-2 flex items-center gap-1.5 xs:gap-2 justify-center ${activeTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                                            >
                                                {tab.icon && <tab.icon className="w-3 h-3 xs:w-3.5 xs:h-3.5" />}
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-5 max-h-[600px] overflow-y-auto custom-scrollbar space-y-3">
                                        {activeTabData.map((item, i) => (
                                            <div key={i} className="group p-4 rounded-md border border-gray-200 bg-white transition-all">
                                                {activeTab === "books" && (
                                                    <>
                                                        <h5 className="font-bold text-gray-900 text-sm mb-1 leading-snug">{item.title}</h5>
                                                        <p className="text-xs text-gray-500 mb-2 font-medium">by {item.author}</p>
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{item.difficulty}</span>
                                                            {item.purchaseLink && <a href={item.purchaseLink} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">View <ExternalLink className="w-3 h-3" /></a>}
                                                        </div>
                                                    </>
                                                )}
                                                {activeTab === "platforms" && (
                                                    <>
                                                        <h5 className="font-bold text-gray-900 text-sm mb-1">{item.platformName}</h5>
                                                        <p
                                                            className="text-xs text-gray-500 mb-2 truncate"
                                                            title={item.specialization}
                                                        >
                                                            {item.specialization}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                            <span className="text-[10px] font-bold text-gray-500">{item.priceRange}</span>
                                                            {item.platformUrl && <a href={item.platformUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">Visit <ExternalLink className="w-3 h-3" /></a>}
                                                        </div>
                                                    </>
                                                )}
                                                {(activeTab === "youtube") && (
                                                    <>
                                                        <h5 className="font-bold text-gray-900 text-sm mb-1">{item.channelName}</h5>
                                                        <p className="text-xs text-gray-500 mb-2 line-clamp-2 leading-relaxed">{item.focus}</p>
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                            <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{item.subscribers} subs</span>
                                                            {item.channelUrl && <a href={item.channelUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">Watch <ExternalLink className="w-3 h-3" /></a>}
                                                        </div>
                                                    </>
                                                )}
                                                {(activeTab === "apps") && (
                                                    <>
                                                        <h5 className="font-bold text-gray-900 text-sm mb-1">{item.appName}</h5>
                                                        <p className="text-xs text-gray-500 mb-2">{item.bestFor}</p>
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><Star className="w-3 h-3 text-primary fill-current" /> {item.rating}</span>
                                                            {item.downloadUrl && <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">Get <ExternalLink className="w-3 h-3" /></a>}
                                                        </div>
                                                    </>
                                                )}
                                                {(activeTab === "podcasts") && (
                                                    <>
                                                        <h5 className="font-bold text-gray-900 text-sm mb-1">{item.name}</h5>
                                                        <p className="text-xs text-gray-500 mb-2 truncate">Host: {item.host}</p>
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                            <span className="text-[10px] font-bold text-gray-500">{item.averageLength}</span>
                                                            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">Listen <ExternalLink className="w-3 h-3" /></a>}
                                                        </div>
                                                    </>
                                                )}
                                                {(activeTab === "blogs") && (
                                                    <>
                                                        <h5 className="font-bold text-gray-900 text-sm mb-1">{item.blogName}</h5>
                                                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.expertise}</p>
                                                        {item.blogUrl && <a href={item.blogUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 mt-2 justify-end transition-colors">Read <ExternalLink className="w-3 h-3" /></a>}
                                                    </>
                                                )}
                                                {(activeTab === "certs") && (
                                                    <>
                                                        <h5 className="font-bold text-gray-900 text-sm mb-1 leading-snug">{item.certificationName}</h5>
                                                        <p className="text-xs text-gray-500 mb-2 truncate">{item.provider}</p>
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{item.cost}</span>
                                                            {item.websiteUrl && <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">Info <ExternalLink className="w-3 h-3" /></a>}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">No resources available.</div>
                            )}
                        </div>

                        {/* Budget Optimization */}
                        {roadmap.budgetOptimization && (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Wallet className="w-5 h-5 text-primary" />
                                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Budget & ROI</h3>
                                </div>
                                <div className="space-y-4">
                                    {roadmap.budgetOptimization.freeResources?.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Top Free Resources</h4>
                                            {renderList(roadmap.budgetOptimization.freeResources)}
                                        </div>
                                    )}
                                    {roadmap.budgetOptimization.costSavingTips?.length > 0 && (
                                        <div className="pt-3 border-t border-gray-100">
                                            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Smart Saving Tips</h4>
                                            {renderList(roadmap.budgetOptimization.costSavingTips)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}

export default UniversalRoadmapDisplay;
