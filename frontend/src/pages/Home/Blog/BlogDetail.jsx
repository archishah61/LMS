import { useParams, Link } from "react-router-dom";
import { useGetBlogBySlugQuery, useGetAllBlogsQuery } from "../../../services/blogs/blogApi";
import { Calendar, User, ArrowLeft, Clock, Share2, Facebook, Twitter, Linkedin, ChevronRight, MessageCircle } from 'lucide-react';
import PrimaryLoader from "../../../components/ui/PrimaryLoader";

const BlogDetail = () => {
  const { slug } = useParams();
  const { data: blogResponse, isLoading, error } = useGetBlogBySlugQuery(slug);
  const { data: recentBlogs } = useGetAllBlogsQuery({ status: 'published' });

  const blog = blogResponse?.data;
  const relatedPosts = recentBlogs?.data?.filter(p => p.slug !== slug).slice(0, 3) || [];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50/30"><PrimaryLoader /></div>;

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50/30">
        <div className="w-24 h-24 bg-red-50 text-red-200 rounded-3xl flex items-center justify-center mb-6">
          <ArrowLeft size={48} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Post Not Found</h2>
        <p className="text-gray-500 mb-8 text-center max-w-sm">The article you're looking for might have been moved or deleted.</p>
        <Link to="/blogs" className="px-6 py-3 bg-forestGreen text-white font-bold rounded-xl shadow-lg shadow-forestGreen/20 flex items-center gap-2 hover:bg-leafGreen transition-all">
          <ArrowLeft size={20} /> Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-20 pb-10 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Content Column */}
          <main className="lg:col-span-8">
            {/* Breadcrumb & Navigation */}
            <nav className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6 md:mb-8 overflow-hidden">
              <Link to="/" className="hover:text-leafGreen transition-colors flex-shrink-0">Home</Link>
              <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
              <Link to="/blogs" className="hover:text-leafGreen transition-colors flex-shrink-0">Blogs</Link>
              <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
              <span className="text-leafGreen truncate max-w-[150px] md:max-w-[250px]">{blog.title}</span>
            </nav>

            {/* Article Header */}
            <header className="mb-10">
              {blog.category && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-leafGreen/10 text-leafGreen text-[9px] font-bold uppercase tracking-widest mb-4">
                  <span className="w-1 h-1 rounded-full bg-leafGreen" />
                  {blog.category}
                </div>
              )}
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 py-4 md:py-6 border-y border-gray-100">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg bg-forestGreen text-white flex items-center justify-center text-lg md:text-xl font-bold shadow-lg shadow-forestGreen/10 ring-4 ring-gray-50">
                    {blog.author ? blog.author[0] : 'A'}
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">Written by</p>
                    <p className="text-sm md:text-base font-extrabold text-gray-900">{blog.author || 'Admin'}</p>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-8 bg-gray-100" />

                <div className="flex items-center gap-4 md:gap-6">
                  <div>
                    <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">Published on</p>
                    <p className="text-sm md:text-base font-extrabold text-gray-900">
                      {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {blog.image && (
              <div className="mb-10 md:mb-16 group">
                <div className="rounded-xl overflow-hidden shadow-xl shadow-gray-200 aspect-video relative">
                  <img 
                    src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${blog.image}`} 
                    alt={blog.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    onError={(e) => { e.target.src = `${import.meta.env.VITE_BACKEND_MEDIA_URL}/placeholder.png`; }}
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl" />
                </div>
              </div>
            )}

            {/* Article Body */}
            <article className="max-w-none">
              <div 
                className="blog-content text-gray-700"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </article>

            {/* Share & Feedback */}
            <div className="mt-10 pt-10 lg:mt-20 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">Share this story</span>
                <div className="flex items-center gap-2">
                  {[
                    { icon: Facebook, color: 'hover:bg-blue-600', text: 'text-blue-600' },
                    { icon: Twitter, color: 'hover:bg-sky-500', text: 'text-sky-500' },
                    { icon: Linkedin, color: 'hover:bg-blue-700', text: 'text-blue-700' }
                  ].map((social, i) => (
                    <button key={i} className={`w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center ${social.text} hover:text-white ${social.color} transition-all duration-300`}>
                      <social.icon size={18} />
                    </button>
                  ))}
                  <button className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-forestGreen hover:text-white transition-all duration-300">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
              
              <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                <MessageCircle size={20} className="text-leafGreen" />
                Join the Discussion
              </button>
            </div>
          </main>

          {/* Sidebar / Related Posts Column */}
          <aside className="lg:col-span-4 mt-12 lg:mt-0">
            <div className="lg:sticky lg:top-32 space-y-10 md:space-y-12">
              
              {/* Sidebar Header */}
              <div className="p-8 bg-forestGreen rounded-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10" />
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 relative z-10">Subscribe to our newsletter</h3>
                <p className="text-gray-300 text-xs md:text-sm mb-4 md:mb-6 relative z-10 leading-relaxed">Get the latest insights and news delivered straight to your inbox.</p>
                <div className="space-y-3 relative z-10">
                  <input type="email" placeholder="Email Address" className="w-full px-4 py-2.5 md:py-3 bg-white/10 border border-white/20 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-leafGreen/50 transition-all placeholder:text-white/40" />
                  <button className="w-full py-2.5 md:py-3 bg-leafGreen text-white text-sm md:text-base font-bold rounded-lg hover:bg-white hover:text-forestGreen transition-all">Join Now</button>
                </div>
              </div>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-extrabold text-gray-900">Recommended</h3>
                    <Link to="/blogs" className="text-xs font-bold text-leafGreen uppercase tracking-widest hover:underline">View All</Link>
                  </div>
                  <div className="space-y-8">
                    {relatedPosts.map((post) => (
                      <Link key={post.id} to={`/blogs/${post.slug}`} className="group flex gap-4 items-center">
                        <div className="w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-100 relative">
                          <img 
                            src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${post.image || "/placeholder.png"}`} 
                            alt={post.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => { e.target.src = `${import.meta.env.VITE_BACKEND_MEDIA_URL}/placeholder.png`; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-leafGreen uppercase tracking-widest mb-1 block">{post.category || 'Insights'}</span>
                          <h4 className="font-bold text-gray-900 group-hover:text-leafGreen transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags Cloud (Visual only) */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Popular Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {['Technology', 'Education', 'Tutorials', 'Insights', 'Community', 'Future'].map(tag => (
                    <span key={tag} className="px-4 py-2 bg-gray-50 text-gray-500 text-xs font-bold rounded-lg hover:bg-leafGreen/10 hover:text-leafGreen transition-all cursor-pointer border border-transparent hover:border-leafGreen/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
