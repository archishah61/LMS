/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
import { ChevronDown, Search, BookOpen, Flame } from "lucide-react"
import { useState, useEffect } from "react"
import sidebarData from "../../data/sidebarData"

export default function LeftSidebar({ setSelectedEndpoint, selectedEndpoint }) {
  // State for open/close of sections and dropdowns
  const [openSections, setOpenSections] = useState({
    "admin-auth": true,
  });

  // State for search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(sidebarData);

  const handleSectionToggle = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(sidebarData);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();

    // Filter the sidebar data based on search term
    const filtered = sidebarData.map(section => {
      // For tab sections, check if title matches
      if (section.type === "tab") {
        if (section.title.toLowerCase().includes(searchTermLower)) {
          return section;
        }
        return null;
      }

      // For regular sections, check children and endpoints
      if (section.type === "section") {
        // Deep clone the section to avoid mutating original data
        const newSection = { ...section };

        if (newSection.title.toLowerCase().includes(searchTermLower)) {
          return newSection; // Return if section title matches
        }

        if (newSection.children) {
          newSection.children = newSection.children.map(dropdown => {
            const newDropdown = { ...dropdown };

            if (newDropdown.title.toLowerCase().includes(searchTermLower)) {
              return newDropdown; // Return if dropdown title matches
            }

            if (newDropdown.endpoints) {
              // Filter endpoints
              newDropdown.endpoints = newDropdown.endpoints.filter(endpoint =>
                endpoint.name.toLowerCase().includes(searchTermLower) ||
                endpoint.method.toLowerCase().includes(searchTermLower)
              );

              // If there are matching endpoints, return the dropdown
              if (newDropdown.endpoints.length > 0) {
                return newDropdown;
              }
            }

            return null;
          }).filter(Boolean); // Remove null values

          // If there are matching children, return the section
          if (newSection.children.length > 0) {
            return newSection;
          }
        }
      }

      return null;
    }).filter(Boolean); // Remove null values

    setFilteredData(filtered);
  }, [searchTerm]);

  return (
    <div className="w-72 h-full flex flex-col overflow-hidden bg-white shadow-lg rounded-2xl border border-gray-200">
      {/* Header with premium styling */}
      <div className="p-5 border-b border-gray-100 bg-white rounded-t-2xl">
        <div className="flex items-center">
          <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-md mr-3">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
            API Reference
          </h2>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-1">Queekies E-Learning Platform</p>
      </div>

      {/* Search with improved styling */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400" />
          <input
            type="text"
            placeholder="Search APIs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all duration-200"
          />
        </div>
      </div>

      {/* Sidebar content with improved styling and invisible scrollbar */}
      <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',  /* Firefox */
          msOverflowStyle: 'none',  /* IE and Edge */
        }}>
        {/* Custom CSS for WebKit browsers (Chrome, Safari, etc.) */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {filteredData.map((section) => {
          if (section.type === "tab") {
            return (
              <button
                key={section.id}
                onClick={() => setSelectedEndpoint(null)}
                className={`flex items-center w-full px-4 py-3 text-left font-bold text-base rounded-lg transition-all duration-200 mb-2 ${selectedEndpoint === null
                    ? "bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 shadow-sm"
                    : "bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
              >
                <Flame className="h-4 w-4 mr-2" />
                {section.title}
              </button>
            )
          }
          if (section.type === "section") {
            // Auto-open sections when searching
            const shouldOpenSection = searchTerm && !openSections[section.id];
            if (shouldOpenSection) {
              // This will open the section if it contains search results
              openSections[section.id] = true;
            }

            return (
              <div className="mb-3" key={section.id}>
                <button
                  onClick={() => handleSectionToggle(section.id)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-left font-bold text-base rounded-lg transition-all duration-200 ${openSections[section.id]
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                >
                  {section.title}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${openSections[section.id] ? "rotate-180 text-indigo-700" : "text-gray-400"
                      }`}
                  />
                </button>
                {openSections[section.id] && section.children && section.children.map((dropdown) => {
                  // Auto-open dropdowns when searching
                  const shouldOpenDropdown = searchTerm && !openSections[dropdown.id];
                  if (shouldOpenDropdown) {
                    // This will open the dropdown if it contains search results
                    openSections[dropdown.id] = true;
                  }

                  return (
                    <div className="ml-2 p-1 mt-2" key={dropdown.id}>
                      <button
                        onClick={() => handleSectionToggle(dropdown.id)}
                        className={`flex items-center justify-between w-full px-4 py-2 text-left font-medium text-sm rounded-lg transition-all duration-200 ${openSections[dropdown.id]
                            ? "bg-indigo-50 text-indigo-800"
                            : "bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                          }`}
                      >
                        {dropdown.title}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-300 ${openSections[dropdown.id] ? "rotate-180 text-indigo-600" : "text-gray-400"
                            }`}
                        />
                      </button>
                      {openSections[dropdown.id] && dropdown.endpoints && (
                        <div className="mt-1 mb-3 mx-1 pl-3">
                          {dropdown.endpoints.map((endpoint) => {
                            const highlightMatch = searchTerm &&
                              endpoint.name.toLowerCase().includes(searchTerm.toLowerCase());

                            return (
                              <div
                                key={endpoint.id}
                                className={`flex items-center transition-all duration-200 cursor-pointer my-1.5 rounded-lg overflow-hidden ${selectedEndpoint === endpoint.id
                                    ? "bg-white shadow-md border-l-4 border-indigo-500"
                                    : highlightMatch
                                      ? "bg-indigo-50 border-l-2 border-indigo-300"
                                      : "bg-white hover:bg-gray-50 border-l border-transparent hover:border-l-2 hover:border-indigo-300"
                                  }`}
                              >
                                <span
                                  className={`ml-2 px-2 py-1 text-xs font-semibold w-14 text-center rounded-md ${endpoint.method === "GET"
                                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                                      : endpoint.method === "POST"
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : endpoint.method === "PUT"
                                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                          : endpoint.method === "DELETE"
                                            ? "bg-red-100 text-red-700 border border-red-200"
                                            : "bg-gray-100 text-gray-700 border border-gray-200"
                                    }`}
                                >
                                  {endpoint.method}
                                </span>
                                <button
                                  onClick={() => setSelectedEndpoint(endpoint.id)}
                                  className={`flex-1 py-2 px-3 text-sm text-left transition-colors duration-200 ${selectedEndpoint === endpoint.id
                                      ? "text-indigo-700 font-semibold"
                                      : highlightMatch
                                        ? "text-indigo-700 font-medium"
                                        : "text-gray-700"
                                    }`}
                                >
                                  {endpoint.name}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }
          return null;
        })}

        {/* Empty state when no search results */}
        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-full mb-3">
              <Search className="h-6 w-6 text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">No results found</h3>
            <p className="text-sm text-gray-500">
              Try adjusting your search term or browse the menu instead
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition-colors"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Bottom tooltip/hint */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center text-xs text-gray-500">
          <div className="flex-shrink-0 mr-2 p-1 bg-indigo-100 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <span>Tip: Use search to quickly find endpoints</span>
        </div>
      </div>
    </div>
  );
}