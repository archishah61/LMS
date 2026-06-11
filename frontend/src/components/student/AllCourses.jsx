import { useState, useEffect } from 'react';
import { useGetCoursesQuery } from '../../services/Course_Management/courseApi';
import { useGetCourseCategoriesQuery } from '../../services/Course_Management/courseCatagoryApi';
import { Search, Filter, X, ChevronLeft, ChevronUp } from 'lucide-react';
import CourseCard from '../Home/courses/CourseCard';
import { getStudentToken } from '../../services/CookieService';
import PrimaryLoader from '../ui/PrimaryLoader';

const AllCourses = () => {
  const { access_token } = getStudentToken();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch courses and categories
  const { data: courses, isLoading: isLoadingCourses, isError: isCoursesError } = useGetCoursesQuery({
    searchTerm,
    categoryId: selectedCategoryId,
    limit: itemsPerPage,
    offset: itemsPerPage !== "all" ? itemsPerPage * (currentPage - 1) : 0
  });

  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useGetCourseCategoriesQuery({ access_token });

  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Combine loading and error states
  const isLoading = isLoadingCourses || isLoadingCategories;
  const isError = isCoursesError || categoriesError;

  useEffect(() => {
    window.scrollTo(0, 0);

    if (courses?.data && categories) {
      // Get active category IDs (case-insensitive check for safety)
      const activeCategoryIds = categories
        .filter((cat) => cat.status?.toLowerCase() === 'active')
        .map((cat) => cat.id);

      // Filter only published courses with active categories
      const published = courses?.data.filter(
        (course) =>
          course.status?.toLowerCase() === 'published' &&
          activeCategoryIds.includes(course.category_id)
      );

      setAllCourses(published);
      setFilteredCourses(published);
    }
  }, [courses?.data, categories]);

  // Handle search and filtering
  useEffect(() => {
    let result = allCourses;

    // Filter by search term
    if (searchTerm) {
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category ID
    if (selectedCategoryId) {
      result = result.filter(course =>
        course.category_id === selectedCategoryId
      );
    }

    setFilteredCourses(result);
  }, [searchTerm, selectedCategoryId, allCourses]);

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId('');
    setIsFilterOpen(false);
  };

  if (isLoading) {
    return <PrimaryLoader />;
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto text-center text-red-500 text-sm md:text-base">
        Failed to load courses or categories. Please try again later.
      </div>
    );
  }

  const totalPages = Math.ceil(courses?.totalCount / itemsPerPage);

  return (
    <div className="bg-white py-5 md:py-8 lg:py-10">
      <div className="container px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 md:mb-5 lg:mb-6">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-forestGreen mb-1">
            All Courses
          </h1>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-5 md:mb-7 lg:mb-8 relative">
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
            {/* Search Input */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-8 md:pl-9 lg:pl-10 pr-7 md:pr-8 lg:pr-10 py-2 md:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen/50 focus:border-leafGreen text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2 md:left-2.5 lg:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 md:right-2.5 lg:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`px-3 md:px-3.5 lg:px-4 py-2 md:py-2.5 lg:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-leafGreen/50 relative transition-all duration-300 flex items-center justify-center gap-1.5 md:gap-2 min-w-[50px] md:min-w-[60px] lg:min-w-[70px] ${selectedCategoryId
                  ? 'border-leafGreen bg-lightGreen text-forestGreen'
                  : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <Filter size={14} className="text-current" />
                <span className="text-sm font-medium hidden md:inline">Filter</span>
                {selectedCategoryId && (
                  <span className="absolute -top-1.5 -right-1.5 bg-leafGreen text-white rounded-full w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center text-xs">
                    1
                  </span>
                )}
              </button>

              {/* Dropdown Filter */}
              {isFilterOpen && (
                <>
                  {/* Backdrop for mobile */}
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                    onClick={() => setIsFilterOpen(false)}
                  />

                  {/* Filter Dropdown */}
                  <div className="fixed md:absolute z-20 mt-2 w-[calc(100vw-2rem)] md:w-64 lg:w-72 right-0 md:right-[0px] top-1/2 md:top-full left-1/2 md:left-auto transform -translate-x-1/2 md:translate-x-0 -translate-y-1/2 md:translate-y-0 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden max-h-[80vh] md:max-h-56 lg:max-h-60">
                    <div className="p-3 md:p-4">
                      <div className="flex justify-between items-center mb-2.5 md:mb-3 lg:mb-4">
                        <h3 className="text-sm font-semibold text-gray-700">Filter by Category</h3>
                        <div className="flex items-center gap-2">
                          {selectedCategoryId && (
                            <button
                              onClick={clearFilters}
                              className="text-xs text-leafGreen hover:text-forestGreen"
                            >
                              Clear All
                            </button>
                          )}
                          <button
                            onClick={() => setIsFilterOpen(false)}
                            className="md:hidden text-gray-400 hover:text-gray-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[60vh] md:max-h-40 lg:max-h-44 overflow-y-auto">
                        <div
                          className={`py-1.5 md:py-2 px-3 hover:bg-gray-50 cursor-pointer rounded text-sm ${selectedCategoryId === '' ? 'bg-lightGreen text-forestGreen' : ''
                            }`}
                          onClick={() => {
                            setSelectedCategoryId('');
                            setIsFilterOpen(false);
                          }}
                        >
                          All Categories
                        </div>
                        {categories
                          .filter((category) => category.status === 'active')
                          .map((category) => (
                            <div
                              key={category.id}
                              className={`py-1.5 md:py-2 px-3 hover:bg-white cursor-pointer rounded text-sm ${selectedCategoryId === category.id ? 'bg-lightGreen text-forestGreen' : ''
                                }`}
                              onClick={() => {
                                setSelectedCategoryId(category.id);
                                setIsFilterOpen(false);
                              }}
                            >
                              {category.category}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || selectedCategoryId) && (
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-2.5 md:mt-3 lg:mt-4">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 md:px-2.5 lg:px-3 py-1 rounded-full text-xs">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:text-forestGreen"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {selectedCategoryId && (
                <span className="inline-flex items-center gap-1 bg-lightGreen text-forestGreen px-2 md:px-2.5 lg:px-3 py-1 rounded-full text-xs">
                  Category: {categories.find(cat => cat.id === selectedCategoryId)?.category}
                  <button
                    onClick={() => setSelectedCategoryId('')}
                    className="hover:text-forestGreen"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
              {(searchTerm || selectedCategoryId) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-3 md:mb-5 lg:mb-6">
          <p className="text-sm md:text-base text-gray-600">
            {(searchTerm || selectedCategoryId) && (
              <span className="text-gray-400 ml-1">
                {searchTerm && `for "${searchTerm}"`}
                {searchTerm && selectedCategoryId && ' in '}
                {selectedCategoryId && `category: ${categories.find(cat => cat.id === selectedCategoryId)?.category}`}
              </span>
            )}
          </p>
        </div>

        {/* Courses Grid or Empty State */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-10 md:py-12 lg:py-16 bg-white rounded-lg border border-gray-100 shadow-sm">
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-forestGreen mb-1">
              No Courses Found
            </h1>
            <p className="text-gray-600 text-sm md:text-base px-3 md:px-4 lg:px-6">
              {searchTerm || selectedCategoryId
                ? "Try adjusting your search or category filter"
                : "Check back soon for new courses!"
              }
            </p>
            {(searchTerm || selectedCategoryId) && (
              <button
                onClick={clearFilters}
                className="mt-3 md:mt-4 px-3 md:px-4 py-1.5 md:py-2 bg-leafGreen text-white rounded-lg hover:bg-forestGreen transition-colors text-sm md:text-base"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 lg:gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
      {/* Pagination */}
      {courses?.totalCount > itemsPerPage && (
        <Pagination
          pagination={{ totalCount: courses?.totalCount, totalPages: totalPages }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={itemsPerPage}
          setLimit={setItemsPerPage}
        />
      )}
    </div>
  );
};

// Pagination Component
function Pagination({ pagination, currentPage, setCurrentPage, limit, setLimit }) {
  const limitOptions = [10, 20, 50, 100, 500];

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="mt-8 border-b border-gray-100 bg-white">
      <div className="container px-5 sm:px-6 lg:px-8 mx-auto py-6">
        {/* Mobile Pagination */}
        <div className="md:hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 font-medium">
                Page {currentPage} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Show:</label>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm bg-gray-50"
                >
                  {limitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl hover:bg-gray-50 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm"
              >
                <ChevronLeft size={16} />
                <span className="sr-only">Previous</span>
              </button>
              
               <div className="text-sm font-medium text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 min-w-[100px] text-center">
                {currentPage} / {pagination.totalPages}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl hover:bg-gray-50 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm"
              >
                <span className="sr-only">Next</span>
                <ChevronUp size={16} className="rotate-90" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Pagination */}
        <div className="hidden md:flex md:items-center md:justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * limit + 1}</span> to{" "}
            <span className="font-semibold text-gray-900">{Math.min(currentPage * limit, pagination.totalCount)}</span> of{" "}
            <span className="font-semibold text-gray-900">{pagination.totalCount}</span> results
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Per page</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border-none bg-gray-50 rounded-lg text-sm text-gray-700 font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                {limitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 md:mr-1"
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center space-x-1 p-1 bg-gray-50 rounded-lg border border-gray-100">
                {(() => {
                  const getVisiblePages = () => {
                    const total = pagination.totalPages;
                    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

                    if (currentPage <= 4) {
                      return [1, 2, 3, 4, 5, '...', total];
                    }
                    if (currentPage >= total - 3) {
                      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
                    }
                    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total];
                  };

                  return getVisiblePages().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-gray-400">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = currentPage === page;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-md transition-all duration-200 ${isCurrent
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-600 hover:text-primary hover:bg-white"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="w-9 h-9 flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 md:ml-1"
                 title="Next Page"
              >
                <ChevronUp size={18} className="rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllCourses;