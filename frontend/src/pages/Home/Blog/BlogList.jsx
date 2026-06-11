import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetAllBlogsQuery, useGetAllBlogCategoriesQuery } from "../../../services/blogs/blogApi";
import { Search, Calendar, User, ArrowRight, BookOpen, Clock, Filter } from 'lucide-react';
import PrimaryLoader from "../../../components/ui/PrimaryLoader";

const BlogList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const { data: categoriesData } = useGetAllBlogCategoriesQuery();
  const { data: blogsData, isLoading } = useGetAllBlogsQuery({ 
    searchTerm, 
    category: selectedCategory === "All" ? undefined : selectedCategory,
    status: 'published' 
  });

  const blogs = blogsData?.data || [];
  const categories = ["All", ...(categoriesData?.data?.filter(c => c.status).map(c => c.name) || [])];

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Hero Section with Integrated Search & Filter */}
      <section className="relative bg-forestGreen pt-20 md:pt-24 pb-12 md:pb-16 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-white/5 -skew-x-12 -translate-x-10" />
        
        <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left side: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-leafGreen/20 text-leafGreen text-[10px] font-bold uppercase tracking-widest mb-4 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-leafGreen animate-pulse" />
                Insights & Knowledge
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                Explore Our <span className="text-leafGreen">Blog</span>
              </h1>
              <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-xl">
                Stay updated with the latest industry insights, expert tutorials, and community stories.
              </p>
            </div>

            {/* Right side: Search & Filter */}
            <div className="flex lg:justify-end items-center">
              <div className="w-full max-w-md bg-white/10 backdrop-blur-lg p-2 rounded-lg border border-white/20 shadow-xl">
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Search */}
                  <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 group-focus-within:text-leafGreen transition-colors" />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 md:py-2.5 rounded-md bg-white/5 border border-transparent focus:bg-white/10 focus:border-leafGreen/50 outline-none transition-all text-xs md:text-sm text-white placeholder:text-white/30 font-medium"
                    />
                  </div>
                  
                  {/* Divider - Hidden on Mobile */}
                  <div className="hidden sm:block w-px h-8 bg-white/10 self-center" />

                  {/* Category Dropdown */}
                  <div className="relative min-w-[140px] group">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-3.5 h-3.5 group-focus-within:text-leafGreen transition-colors" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 md:py-2.5 rounded-md bg-white/5 border border-transparent focus:bg-white/10 focus:border-leafGreen/50 outline-none transition-all text-xs md:text-sm text-white appearance-none cursor-pointer font-medium"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="text-gray-900 bg-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 group-hover:text-white/50 transition-colors">
                      <ArrowRight size={12} className="rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <PrimaryLoader />
            <p className="mt-4 text-gray-400 font-medium animate-pulse">Fetching latest stories...</p>
          </div>
        ) : blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {blogs.map((blog) => (
              <article 
                key={blog.id} 
                className="group bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-500 border border-gray-100 flex flex-col h-full"
              >
                {/* Image Container */}
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${blog.image || "/placeholder.png"}`}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.src = `${import.meta.env.VITE_BACKEND_MEDIA_URL}/placeholder.png`; }}
                  />
                  {/* Category Badge */}
                  {blog.category && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-forestGreen text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm">
                        {blog.category}
                      </span>
                    </div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content Container */}
                <div className="p-5 md:p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-3 md:gap-4 text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 md:mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-leafGreen" />
                      {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1.5 text-leafGreen">
                      <User size={14} />
                      {blog.author || 'Admin'}
                    </span>
                  </div>

                  <h2 className="text-lg md:text-xl font-extrabold text-gray-900 mb-3 md:mb-4 group-hover:text-leafGreen transition-colors line-clamp-2 leading-tight">
                    <Link to={`/blogs/${blog.slug}`}>{blog.title}</Link>
                  </h2>
                  
                  <div 
                    className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-8 flex-1"
                    dangerouslySetInnerHTML={{ __html: blog.content.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...' }}
                  />

                  <div className="pt-6 border-t border-gray-50 mt-auto flex items-center justify-between">
                    <Link 
                      to={`/blogs/${blog.slug}`}
                      className="inline-flex items-center gap-2 text-forestGreen font-extrabold text-sm hover:text-leafGreen transition-colors group/btn"
                    >
                      Read More
                      <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <Clock size={12} />
                      5 Min
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
            <div className="w-24 h-24 bg-white shadow-xl shadow-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
              <BookOpen size={40} className="text-gray-200" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No matching articles</h3>
            <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
              We couldn't find any articles matching "{searchTerm}" in {selectedCategory}. Try adjusting your filters.
            </p>
            <button 
              onClick={() => {setSearchTerm(""); setSelectedCategory("All");}}
              className="mt-8 px-6 py-3 bg-forestGreen text-white font-bold rounded-xl hover:bg-leafGreen transition-all shadow-lg shadow-forestGreen/20"
            >
              Show All Articles
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
