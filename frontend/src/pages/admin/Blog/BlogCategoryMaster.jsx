import { useState } from "react";
import { Plus, X, Edit2, Trash2, ArrowLeft, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useGetAllBlogCategoriesQuery,
  useCreateBlogCategoryMutation,
  useUpdateBlogCategoryMutation,
  useDeleteBlogCategoryMutation,
} from "../../../services/blogs/blogApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import AdminLoader from "../../../components/admin/AdminLoader";
import PermissionWrapper from "../../../context/PermissionWrapper";

const BlogCategoryMaster = () => {
  const navigate = useNavigate();
  const { access_token } = useSelector((state) => state.auth);
  const { data: categoriesData, isLoading, refetch } = useGetAllBlogCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateBlogCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateBlogCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteBlogCategoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: "", status: true });

  const resetForm = () => {
    setFormData({ name: "", status: true });
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, status: category.status });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for duplication
    const isDuplicate = categories.some(
      (cat) => 
        cat.name.toLowerCase().trim() === formData.name.toLowerCase().trim() && 
        cat.id !== editingCategory?.id
    );

    if (isDuplicate) {
      toast.error("A category with this name already exists");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, categoryData: formData, access_token }).unwrap();
        toast.success("Category updated successfully");
      } else {
        await createCategory({ categoryData: formData, access_token }).unwrap();
        toast.success("Category created successfully");
      }
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCategory({ id: categoryToDelete.id, access_token }).unwrap();
      toast.success("Category deleted successfully");
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete category");
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      await updateCategory({
        id: category.id,
        categoryData: { ...category, status: !category.status },
        access_token,
      }).unwrap();
      toast.success(`Category ${!category.status ? "activated" : "deactivated"} successfully`);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  if (isLoading) return <AdminLoader message="Loading categories..." />;

  const categories = categoriesData?.data || [];

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 md:pl-8 lg:pl-0 border-gray-200">
        <div className="w-full max-w-full p-4 sm:px-6">
          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1"></div>
              <h1 className="text-xl font-bold text-forestGreen text-center absolute left-1/2 -translate-x-1/2">
                Blog Categories
              </h1>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <PermissionWrapper section="Blogs" action="create">
                  <button
                    onClick={openAddModal}
                    className="bg-leafGreen text-white p-2 rounded-lg flex items-center transition-colors font-medium shadow-sm min-w-[30px]"
                  >
                    <Plus size={18} />
                  </button>
                </PermissionWrapper>
                <button
                  onClick={() => navigate("/admin/dashboard/blogs")}
                  className="flex border rounded-md items-center gap-2 text-gray-600 hover:text-gray-900 p-1"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-forestGreen">Blog Category Master</h1>
              <p className="text-gray-600 mt-1">Define and manage categories for your blog posts</p>
            </div>

            <div className="flex items-center gap-3">
              <PermissionWrapper section="Blogs" action="create">
                <button
                  onClick={openAddModal}
                  className="bg-leafGreen text-white px-6 py-2 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm"
                >
                  <Plus size={18} />
                  Add <span className="hidden lg:inline-flex">Category</span>
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate("/admin/dashboard/blogs")}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 shadow-sm"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back to Blogs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* List Header (Desktop) */}
          <div className="bg-lightGreen px-6 py-3 border-b border-gray-200 hidden md:block">
            <div className="grid grid-cols-12 gap-4 text-xs uppercase font-semibold text-gray-700">
              <div className="col-span-7">Category Details</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3 text-center">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers size={24} className="text-gray-400" />
                </div>
                <div className="text-gray-500 text-lg font-medium mb-2">No categories found</div>
                <p className="text-gray-400">Add your first blog category to get started.</p>
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="group px-4 py-4 sm:px-6 hover:bg-lightGreen/20 transition-all duration-200"
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                          <Layers size={16} className="text-leafGreen" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base mb-1">{category.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            category.status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {category.status ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-2">
                        <PermissionWrapper section="Blogs" action="edit">
                          <button
                            onClick={() => openEditModal(category)}
                            className="h-9 w-9 hover:bg-lightGreen/20 rounded-lg flex items-center justify-center text-leafGreen transition-colors border border-gray-200"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                        </PermissionWrapper>
                        <PermissionWrapper section="Blogs" action="delete">
                          <button
                            onClick={() => handleDelete(category)}
                            className="h-9 w-9 hover:bg-red-50 rounded-lg flex items-center justify-center text-red-500 transition-colors border border-gray-200"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </PermissionWrapper>
                        <PermissionWrapper section="Blogs" action="edit">
                          <label className="relative inline-flex items-center cursor-pointer" title={category.status ? "Deactivate" : "Activate"}>
                            <input
                              type="checkbox"
                              checked={category.status}
                              onChange={() => handleToggleStatus(category)}
                              disabled={isUpdating}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                          </label>
                        </PermissionWrapper>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    <div className="col-span-7">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                          <Layers size={18} className="text-leafGreen" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <PermissionWrapper section="Blogs" action="edit">
                        <label className="relative inline-flex items-center cursor-pointer" title={category.status ? "Deactivate" : "Activate"}>
                          <input
                            type="checkbox"
                            checked={category.status}
                            onChange={() => handleToggleStatus(category)}
                            disabled={isUpdating}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                        </label>
                      </PermissionWrapper>
                    </div>

                    <div className="col-span-3">
                      <div className="flex items-center justify-center gap-2">
                        <PermissionWrapper section="Blogs" action="edit">
                          <button
                            onClick={() => openEditModal(category)}
                            className="h-8 w-8 p-0 hover:bg-lightGreen/20 rounded-lg flex items-center justify-center text-leafGreen transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                        </PermissionWrapper>
                        <PermissionWrapper section="Blogs" action="delete">
                          <button
                            onClick={() => handleDelete(category)}
                            className="h-8 w-8 p-0 hover:bg-red-50 rounded-lg flex items-center justify-center text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </PermissionWrapper>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-xs sm:max-w-md mx-2 sm:mx-auto shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh]">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form onSubmit={handleSubmit} id="categoryForm" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    placeholder="Enter category name"
                  />
                </div>
              </form>
            </div>

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
                form="categoryForm"
                disabled={isCreating || isUpdating}
                className="px-6 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(isCreating || isUpdating) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingCategory ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl w-full max-w-xs sm:max-w-sm mx-2 sm:mx-auto shadow-2xl">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete Category</h3>
                  <p className="text-xs sm:text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 text-sm sm:text-base mb-6">
                Are you sure you want to delete "<span className="font-medium">{categoryToDelete?.name}</span>"?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
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

export default BlogCategoryMaster;
