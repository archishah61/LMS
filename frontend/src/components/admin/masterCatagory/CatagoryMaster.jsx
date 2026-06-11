"use client";

import { useState, useEffect } from "react";
import AdminLoader from "../AdminLoader";
import { useSelector } from "react-redux";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Filter,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useCreateCourseCategoryMutation,
  useGetCourseCategoriesQuery,
  useUpdateCourseCategoryMutation,
  useUpdateCourseCategoryStatusMutation,
} from "../../../services/Course_Management/courseCatagoryApi";
import { getAdminToken } from "../../../services/CookieService";
import toast from "react-hot-toast";
import PermissionWrapper from "../../../context/PermissionWrapper";

const CategoryMaster = () => {
  const { id } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { access_token } = getAdminToken();
  const [sortBy, setSortBy] = useState("created_at");
  const [filterStatus, setFilterStatus] = useState("all");

  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useGetCourseCategoriesQuery({ access_token, status: filterStatus, sort: sortBy });

  const [createCategory] = useCreateCourseCategoryMutation();
  const [updateCategory] = useUpdateCourseCategoryMutation();
  const [updateCategoryStatus] = useUpdateCourseCategoryStatusMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    categoryId: null,
    categoryName: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    category: "",
  });

  useEffect(() => {
    if (!id) {
      navigate("/admin/dashboard");
      return;
    }
  }, [id, navigate]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      category: "",
    });
    setShowForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      category: category.category,
    });
    setShowForm(true);
  };

  const handleDeleteCategory = (category) => {
    setDeleteConfirmation({
      show: true,
      categoryId: category.id,
      categoryName: category.category,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      toast.error("Delete functionality not implemented in API");
      setDeleteConfirmation({
        show: false,
        categoryId: null,
        categoryName: "",
      });
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error(
        error?.data?.error ||
        error?.data?.message ||
        "Failed to delete category. Please try again."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          category: formData.category,
          updated_by: id,
          access_token,
        }).unwrap();
        toast.success("Category Updated Successfully");
      } else {
        await createCategory({
          category: formData.category,
          created_by: id,
          access_token,
        }).unwrap();
        toast.success("Category Created Successfully");
      }
      setShowForm(false);
      refetch();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error(
        error?.data?.error ||
        error?.data?.message ||
        "Failed to save category. Please try again."
      );
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleStatus = async (categoryId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateCategoryStatus({
        id: categoryId,
        status: newStatus,
        updated_by: id,
        access_token,
      }).unwrap();
      refetch();
      toast.success(
        `Category ${newStatus === "active" ? "activated" : "deactivated"
        } successfully!`
      );
    } catch (error) {
      console.error("Failed to toggle category status:", error);
      toast.error(
        error?.data?.error ||
        error?.data?.message ||
        "Failed to update category status. Please try again."
      );
    }
  };

  const filteredCategories = (categories || [])
  // .filter((category) => {
  //   if (filterStatus !== "all" && category.status !== filterStatus)
  //     return false;
  //   return true;
  // })
  // .sort((a, b) => {
  //   if (sortBy === "created_at")
  //     return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  //   if (sortBy === "name") return a.category.localeCompare(b.category);
  //   if (sortBy === "status")
  //     return a.status === b.status ? 0 : a.status === "active" ? -1 : 1;
  //   return 0;
  // }
  // );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const isAnyFilterApplied = () => {
    return filterStatus !== "all" || sortBy !== "created_at";
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return <AdminLoader message="Loading categories..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X size={48} className="mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">Failed to load categories</p>
          <button
            onClick={() => refetch()}
            className="bg-leafGreen   text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
                Course Categories
              </h1>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <PermissionWrapper section="Course Category" action="create">
                  <button
                    onClick={handleAddCategory}
                    className="bg-leafGreen   text-white p-2 rounded-lg flex items-center transition-colors font-medium shadow-sm min-w-[30px]"
                  >
                    <Plus size={18} />
                  </button>
                </PermissionWrapper>
                <button
                  onClick={() => navigate("/admin/dashboard")}
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
              <h1 className="text-2xl font-bold text-forestGreen">
                Course Categories
              </h1>
              <p className="text-gray-600 mt-1">
                Manage course categories for your platform
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
              >
                <Filter size={18} />
                <span className="font-medium">Filters</span>
                {showFilters ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              <PermissionWrapper section="Course Category" action="create">
                <button
                  onClick={handleAddCategory}
                  className="bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm"
                >
                  <Plus size={18} />
                  Add <span className="hidden lg:inline-flex">Category</span>
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 shadow-sm"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <div className="md:hidden flex justify-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors w-full max-w-xs justify-center"
            >
              <Filter size={16} />
              <span className="font-medium text-sm">Filters</span>
              {showFilters ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          </div>

          {/* Filters */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? "mt-3 max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
          >
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="created_at">Newest First</option>
                    <option value="name">By Name</option>
                    <option value="status">By Status</option>
                  </select>
                </div>

                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {isAnyFilterApplied() && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setFilterStatus("all")
                      setSortBy("created_at")
                    }}
                    className="text-sm text-leafGreen hover:text-forestGreen font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop List Header */}
          <div className="bg-lightGreen px-6 py-3 border-b border-gray-200 hidden md:block">
            <div className="grid grid-cols-12 gap-4 text-xs uppercase font-semibold text-gray-700">
              <div className="col-span-9">Category Details</div>
              <div className="col-span-3 text-center">Actions</div>
            </div>
          </div>

          {/* List Items */}
          <div className="bg-white divide-y divide-gray-200">
            {paginatedCategories.map((category) => (
              <div
                key={category.id}
                className="group px-4 py-4 sm:px-6 hover:bg-lightGreen/20 transition-all duration-200"
              >
                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                        <BookOpen size={16} className="text-leafGreen" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                          {category.category}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(category.status)}`}
                          >
                            {category.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                      <PermissionWrapper section="Course Category" action="edit">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="h-9 w-9 hover:bg-lightGreen/20 rounded-lg flex items-center justify-center text-leafGreen transition-colors border border-gray-200"
                          title="Edit Category"
                        >
                          <Edit2 size={14} />
                        </button>
                      </PermissionWrapper>

                      <PermissionWrapper section="Course Category" action="toggle">
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          title={
                            category.status === "active"
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={category.status === "active"}
                            onChange={() =>
                              handleToggleStatus(category.id, category.status)
                            }
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
                  <div className="col-span-9">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-lightGreen/20 rounded-lg flex items-center justify-center">
                        <BookOpen size={18} className="text-leafGreen" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {category.category}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div className="flex items-center justify-center gap-2 transition-opacity">
                      <PermissionWrapper section="Course Category" action="edit">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="h-8 w-8 p-0 hover:bg-lightGreen/20 rounded-lg flex items-center justify-center text-leafGreen transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 size={14} />
                        </button>
                      </PermissionWrapper>

                      <PermissionWrapper section="Course Category" action="toggle">
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          title={
                            category.status === "active"
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={category.status === "active"}
                            onChange={() =>
                              handleToggleStatus(category.id, category.status)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                          <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                        </label>
                      </PermissionWrapper>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCategories.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-gray-400" />
              </div>
              <div className="text-gray-500 text-lg font-medium mb-2">
                No categories found
              </div>
              <p className="text-gray-400">
                Try adjusting your filters or add a new category.
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredCategories.length > 0 && totalPages > 1 && (
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
              {/* Mobile Pagination */}
              <div className="md:hidden">
                <div className="flex flex-col items-center space-y-3">
                  <div className="text-sm text-gray-600 text-center">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center justify-between w-full max-w-xs">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length}
                  </div>
                </div>
              </div>

              {/* Desktop Pagination */}
              <div className="hidden md:flex md:items-center md:justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredCategories.length)} of{" "}
                  {filteredCategories.length} categories
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                            ? "bg-leafGreen text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal - Optimized for Mobile */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl w-full max-w-xs sm:max-w-sm mx-2 sm:mx-auto shadow-2xl">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={16} className="sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    Delete Category
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6">
                Are you sure you want to delete "
                <span className="font-medium">
                  {deleteConfirmation.categoryName}
                </span>
                "?
              </p>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() =>
                    setDeleteConfirmation({
                      show: false,
                      categoryId: null,
                      categoryName: "",
                    })
                  }
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white text-xs sm:text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal - Optimized for Mobile */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-xs sm:max-w-md mx-2 sm:mx-auto shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh]">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form
                onSubmit={handleSubmit}
                id="categoryForm"
                className="space-y-3 sm:space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent"
                    placeholder="Enter category name"
                  />
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="categoryForm"
                className="px-6 py-2.5 text-sm flex gap-1 whitespace-nowrap font-medium text-white bg-leafGreen rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCategory ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMaster;