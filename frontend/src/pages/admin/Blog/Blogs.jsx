import { useState, useEffect } from "react";
import {
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useGetAllBlogsQuery,
  useDeleteBlogByIdMutation,
  useGetAllBlogCategoriesQuery,
} from "../../../services/blogs/blogApi";
import { Plus, X, Search, Edit2, Trash2, Eye, FileText, Settings, ArrowLeft } from 'lucide-react';
import { getAdminToken } from "../../../services/CookieService";
import AdminLoader from "../../../components/admin/AdminLoader";
import PermissionWrapper from "../../../context/PermissionWrapper";
import toast from "react-hot-toast";
import { Editor } from "@tinymce/tinymce-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Blogs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const { access_token } = useSelector((state) => state.auth);
  const { username, role } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    author: "",
    category: "",
    status: "draft",
    blogImage: null,
    existingImage: null, // Track existing image path
  });

  const [imagePreview, setImagePreview] = useState(null);

  const { data: blogsData, isLoading, refetch } = useGetAllBlogsQuery({ searchTerm });
  const { data: categoriesData } = useGetAllBlogCategoriesQuery();
  const [createBlog, { isLoading: isCreating }] = useCreateBlogMutation();
  const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogMutation();
  const [deleteBlog, { isLoading: isDeleting }] = useDeleteBlogByIdMutation();

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "title") {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const handleEditorChange = (content) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, blogImage: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      author: "",
      category: "",
      status: "draft",
      blogImage: null,
      existingImage: null,
    });
    setImagePreview(null);
    setEditingBlog(null);
  };

  const openAddModal = () => {
    resetForm();
    setFormData((prev) => ({
      ...prev,
      author: role === "admin" ? "Admin" : username || "Partner",
    }));
    setIsModalOpen(true);
  };

  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      author: blog.author || "",
      category: blog.category || "",
      status: blog.status,
      blogImage: null,
      existingImage: blog.image, // Store the existing path
    });
    setImagePreview(blog.image ? `${import.meta.env.VITE_BACKEND_MEDIA_URL}${blog.image}` : `${import.meta.env.VITE_BACKEND_MEDIA_URL}/placeholder.png`);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const blogs = blogsData?.data || [];
    
    // Check for title or slug duplication
    const isDuplicate = blogs.some(
      (blog) => 
        (blog.title.toLowerCase().trim() === formData.title.toLowerCase().trim() || 
         blog.slug.toLowerCase().trim() === formData.slug.toLowerCase().trim()) && 
        blog.id !== editingBlog?.id
    );

    if (isDuplicate) {
      toast.error("A blog with this title or slug already exists");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("slug", formData.slug);
    data.append("content", formData.content);
    data.append("author", formData.author);
    data.append("category", formData.category);
    data.append("status", formData.status);
    
    if (formData.blogImage) {
      data.append("blogImage", formData.blogImage);
    } else if (formData.existingImage) {
      // Send the existing image path back to the server
      data.append("image", formData.existingImage);
    }

    try {
      if (editingBlog) {
        await updateBlog({ id: editingBlog.id, blogData: data, access_token }).unwrap();
        toast.success("Blog updated successfully");
      } else {
        await createBlog({ blogData: data, access_token }).unwrap();
        toast.success("Blog created successfully");
      }
      setIsModalOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  const handleToggleStatus = async (blog) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    const data = new FormData();
    data.append("title", blog.title);
    data.append("slug", blog.slug);
    data.append("content", blog.content);
    data.append("author", blog.author || "");
    data.append("category", blog.category || "");
    data.append("status", newStatus);
    if (blog.image) data.append("image", blog.image);

    try {
      await updateBlog({ id: blog.id, blogData: data, access_token }).unwrap();
      toast.success(`Blog ${newStatus === 'published' ? "published" : "saved as draft"} successfully`);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBlog({ id: blogToDelete.id, access_token }).unwrap();
      toast.success("Blog deleted successfully");
      setIsDeleteModalOpen(false);
      setBlogToDelete(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete blog");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header Area */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 py-4">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between mb-3">
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-forestGreen">Blog Management</h1>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="p-2 border text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-forestGreen">Blog Management</h1>
              <p className="text-gray-600 mt-1">Manage articles, news, and updates for your platform</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen outline-none transition-all w-64 text-sm"
                />
              </div>

              <PermissionWrapper section="Blogs" action="create">
                <button
                  onClick={() => navigate("/admin/dashboard/blogs/categories")}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-leafGreen hover:bg-leafGreen/5 border border-gray-300 rounded-lg shadow-sm transition-all font-medium"
                >
                  <Settings size={18} />
                  Categories
                </button>
              </PermissionWrapper>

              <PermissionWrapper section="Blogs" action="create">
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-4 py-2 bg-leafGreen text-white rounded-lg shadow-sm transition-colors font-medium"
                >
                  <Plus size={18} />
                  Add Post
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-300 rounded-lg shadow-sm"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-lightGreen border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700">Blog Info</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700">Author</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700 text-center">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center">
                      <AdminLoader message="Loading blogs..." />
                    </td>
                  </tr>
                ) : blogsData?.data?.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 font-medium">
                      No blog posts found.
                    </td>
                  </tr>
                ) : (
                  blogsData?.data?.map((blog) => (
                    <tr key={blog.id} className="border-b border-gray-200 hover:bg-lightGreen/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            <img 
                              src={`${import.meta.env.VITE_BACKEND_MEDIA_URL}${blog.image || "/placeholder.png"}`} 
                              alt={blog.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = `${import.meta.env.VITE_BACKEND_MEDIA_URL}/placeholder.png`; }}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 line-clamp-1">{blog.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">/{blog.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                          {blog.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-700">{blog.author || 'Admin'}</div>
                      </td>
                      <td className="p-4 text-center">
                        <PermissionWrapper section="Blogs" action="edit">
                          <label className="relative inline-flex items-center cursor-pointer" title={blog.status === 'published' ? "Save as Draft" : "Publish Now"}>
                            <input
                              type="checkbox"
                              checked={blog.status === 'published'}
                              onChange={() => handleToggleStatus(blog)}
                              disabled={isUpdating}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                          </label>
                        </PermissionWrapper>
                        <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${blog.status === 'published' ? 'text-green-600' : 'text-gray-400'}`}>
                          {blog.status}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a 
                            href={`/blogs/${blog.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100"
                          >
                            <Eye size={16} />
                          </a>
                          <PermissionWrapper section="Blogs" action="edit">
                            <button
                              onClick={() => openEditModal(blog)}
                              className="p-2 text-leafGreen hover:bg-lightGreen/20 rounded-lg transition-colors border border-gray-100"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          </PermissionWrapper>
                          <PermissionWrapper section="Blogs" action="delete">
                            <button
                              onClick={() => {
                                setBlogToDelete(blog);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </PermissionWrapper>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Blog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl mx-auto overflow-hidden shadow-2xl flex flex-col max-h-[85vh] md:max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-lightGreen rounded-lg transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form id="blogForm" onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Post Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen transition-all text-sm"
                        placeholder="Enter blog title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug *</label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen transition-all text-sm"
                        placeholder="blog-post-slug"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Author</label>
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        readOnly
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed outline-none shadow-sm text-sm"
                      />
                      <p className="text-[10px] text-gray-400 mt-1 font-medium italic">* Set automatically</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen transition-all text-sm"
                      >
                        <option value="">Select Category</option>
                        {categoriesData?.data?.filter(cat => cat.status).map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Featured Image</label>
                      <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer">
                          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-leafGreen transition-colors flex items-center justify-center bg-gray-50">
                            {imagePreview ? (
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="w-full h-full object-cover" 
                                onError={(e) => { e.target.src = `${import.meta.env.VITE_BACKEND_MEDIA_URL}/placeholder.png`; }}
                              />
                            ) : (
                              <Plus className="text-gray-400" />
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-gray-500 max-w-[150px]">
                          Recommended: 1200 x 630 pixels. Max size: 2MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editor Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                  <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                    <Editor
                      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                      value={formData.content}
                      onEditorChange={handleEditorChange}
                      init={{
                        height: 400,
                        menubar: true,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | help',
                        content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }',
                        branding: false
                      }}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="blogForm"
                disabled={isCreating || isUpdating}
                className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(isCreating || isUpdating) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingBlog ? "Update Post" : "Create Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Blog Post</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete "<span className="font-semibold text-gray-900">{blogToDelete?.title}</span>"? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {isDeleting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blogs;
