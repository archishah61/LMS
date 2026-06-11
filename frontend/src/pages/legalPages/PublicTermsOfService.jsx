import React from 'react';
import AdminLoader from '../../components/admin/AdminLoader';
import { useGetTermsOfServiceByCategoryQuery } from "../../services/LegalPages/termsOfServices";
import { ArrowLeft, FileText, Scale, Clock, ChevronRight, Mail, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const PublicTermsOfService = () => {
    const { data, isLoading } = useGetTermsOfServiceByCategoryQuery({ category: "login" });
    const navigate = useNavigate();

    // The current logic in LoginModal flattens all sentences from all active items
    const activePolicies = data?.data?.filter((item) => item.status === "active") || [];

    // Attempt to get the latest update date
    const lastUpdated = activePolicies.length > 0
        ? (() => {
            const dates = activePolicies.map(p => new Date(p.updated_at || p.updatedAt || p.created_at)).filter(d => !isNaN(d.getTime()));
            return dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
          })()
        : new Date();

    const activeSentences = activePolicies.flatMap((item) => item.sentences) || [];

    const formattedDate = lastUpdated.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Premium Hero Section */}
            <section className="relative bg-forestGreen pt-24 pb-16 overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-20" />
                <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-white/5 -skew-x-12 -translate-x-10" />
                
                <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-leafGreen/20 text-leafGreen text-[10px] font-bold uppercase tracking-widest mb-4 animate-fade-in">
                            <FileText size={14} className="animate-pulse" />
                            Terms of Service
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                            Terms & <span className="text-leafGreen">Conditions</span>
                        </h1>
                        <p className="text-base md:text-lg text-gray-300 leading-relaxed">
                            Please read these terms and conditions carefully before using our platform. By accessing or using the service, you agree to be bound by these terms and all applicable laws.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16">
                    
                    {/* Main Content Column */}
                    <div className="lg:col-span-8">
                        {/* Breadcrumbs & Navigation */}
                        <nav className="flex items-center gap-2 md:gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8 overflow-hidden">
                            <Link to="/" className="hover:text-leafGreen transition-colors flex-shrink-0">Home</Link>
                            <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
                            <span className="text-leafGreen">Terms of Service</span>
                        </nav>


                        <div className="bg-white rounded-xl p-4 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden">
                            {/* Content Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-lightGreen/20 flex items-center justify-center text-leafGreen">
                                        <Scale size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">Usage Agreement</h2>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Clock size={14} className="text-gray-400" />
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                                Last Updated: {formattedDate}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms Content */}
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <AdminLoader message="Loading content..." />
                                </div>
                            ) : activeSentences.length > 0 ? (
                                <div className="prose prose-lg max-w-none">
                                    <div className="space-y-2">
                                        {activeSentences.map((html, index) => (
                                            <div 
                                                key={index} 
                                                className="group flex items-center gap-2 md:gap-4 p-2 rounded-lg hover:bg-gray-50/50 transition-all border border-transparent hover:border-gray-100"
                                            >
                                                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-lightGreen/10 flex items-center justify-center text-leafGreen font-bold text-xs md:text-sm mt-0.5">
                                                    {index + 1}
                                                </div>
                                                <div 
                                                    className="text-gray-600 leading-relaxed text-sm md:text-base md:text-[17px] font-normal"
                                                    dangerouslySetInnerHTML={{ __html: html }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                                    <div className="w-24 h-24 bg-white shadow-xl shadow-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
                                        <FileText size={40} className="text-gray-200" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No content available</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                                        Our legal team is currently finalizing the latest terms and conditions for our platform.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Quick Actions */}
                    <aside className="lg:col-span-4 mt-12 lg:mt-0">
                        <div className="lg:sticky lg:top-32 space-y-10">
                            
                            {/* Navigation Sidebar */}
                            <div className="p-8 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    Legal Quick Links
                                </h3>
                                <div className="space-y-4">
                                    <Link to="/privacy-policy" className="flex items-center justify-between p-4 bg-white rounded-lg hover:bg-leafGreen/10 transition-all group shadow-sm border border-gray-50">
                                        <span className="text-sm font-bold">Privacy Policy</span>
                                        <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>

                            {/* Contact Sidebar */}
                            <div className="p-8 bg-forestGreen rounded-xl text-white relative overflow-hidden shadow-xl shadow-forestGreen/10">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10" />
                                <h3 className="text-lg md:text-xl font-bold mb-4 relative z-10">Questions about Terms?</h3>
                                <p className="text-gray-300 text-xs md:text-sm mb-6 relative z-10 leading-relaxed">
                                    Reach out to our support team if you have any questions regarding our terms of service.
                                </p>
                                <a 
                                    href="mailto:support@yourdomain.com" 
                                    className="flex items-center gap-4 p-4 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-md bg-leafGreen flex items-center justify-center shadow-lg shadow-leafGreen/20">
                                        <Mail size={20} />
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Support Team</p>
                                        <p className="text-sm font-bold truncate">support@domain.com</p>
                                    </div>
                                </a>
                            </div>

                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default PublicTermsOfService;