import React, { useEffect, useState, useMemo } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerLayout() {
    const [swaggerData, setSwaggerData] = useState(null);
    const [activeTag, setActiveTag] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetch("http://localhost:8000/swagger-output.json")
            .then((res) => res.json())
            .then((data) => setSwaggerData(data))
            .catch((err) => console.error("Failed to load Swagger JSON", err));
    }, []);

    // 🧠 Filter Swagger JSON by activeTag
    const filteredSpec = useMemo(() => {
        if (!swaggerData || !activeTag) return swaggerData;

        const filteredPaths = {};
        for (const [path, methods] of Object.entries(swaggerData.paths)) {
            const filteredMethods = {};
            for (const [method, details] of Object.entries(methods)) {
                if (details.tags?.includes(activeTag)) {
                    filteredMethods[method] = details;
                }
            }
            if (Object.keys(filteredMethods).length > 0) {
                filteredPaths[path] = filteredMethods;
            }
        }

        return {
            ...swaggerData,
            paths: filteredPaths,
            tags: swaggerData.tags?.filter((t) => t.name === activeTag),
        };
    }, [swaggerData, activeTag]);

    // 🔍 Filter tags based on search term
    const filteredTags = useMemo(() => {
        if (!swaggerData?.tags) return [];
        return swaggerData.tags.filter((tag) =>
            tag.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [swaggerData, searchTerm]);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
                {/* Fixed Header */}
                <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">📘 API Reference</h2>
                    <input
                        type="text"
                        placeholder="Search tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Scrollable Tag List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {!swaggerData ? (
                        <p className="text-gray-500">Loading...</p>
                    ) : filteredTags.length > 0 ? (
                        <ul className="space-y-2">
                            {filteredTags.map((tag) => (
                                <li key={tag.name}>
                                    <button
                                        onClick={() => setActiveTag(tag.name)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${activeTag === tag.name
                                                ? "bg-blue-500 text-white shadow-md"
                                                : "hover:bg-blue-50 text-gray-700"
                                            }`}
                                    >
                                        {tag.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-sm">No tags found.</p>
                    )}
                </div>
            </aside>

            {/* Swagger UI Main Section */}
            <main className="flex-1 overflow-y-auto p-4">
                {!swaggerData ? (
                    <p className="text-gray-500">Loading Swagger Documentation...</p>
                ) : activeTag ? (
                    <SwaggerUI
                        spec={filteredSpec}
                        docExpansion="none"
                        defaultModelExpandDepth={0}
                        defaultModelsExpandDepth={-1}
                        deepLinking={true}
                        supportedSubmitMethods={["get", "post", "put", "delete", "patch"]}
                        requestInterceptor={(req) => {
                            req.headers["x-swagger-client"] = "true"; // ✅ mark requests from Swagger
                            return req;
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <h3 className="text-lg font-semibold mb-2">Select a tag from the sidebar</h3>
                        <p className="text-sm">Only APIs under that tag will be displayed here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
