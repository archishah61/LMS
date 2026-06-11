const swaggerAutogen = require("swagger-autogen")();
const fs = require("fs");
const path = require("path");

// Step 1: Swagger base info
const doc = {
    info: {
        title: "API Documentation",
        description:
            "Automatically grouped Swagger documentation based on Express route prefixes, with '/api' added before each route.",
        version: "1.0.0",
    },
    host: "localhost:8000",
    schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./index.js", "./routes/index.js", "./routes/*.js"];

(async () => {
    await swaggerAutogen(outputFile, endpointsFiles, doc);
    console.log("✅ Swagger JSON generated.");

    const swaggerPath = path.resolve("./swagger-output.json");
    const routesIndexPath = path.resolve("./routes/index.js");

    // Step 2: Parse router prefixes from routes/index.js
    const routesIndex = fs.readFileSync(routesIndexPath, "utf-8");
    const regex = /router\.use\s*\(\s*['"`]([^'"`]+)['"`]/g;
    const prefixes = new Set();
    let match;

    while ((match = regex.exec(routesIndex)) !== null) {
        const prefix = match[1].trim();
        if (prefix && prefix !== "/") prefixes.add(prefix);
    }

    // Step 3: Load swagger file
    const swagger = JSON.parse(fs.readFileSync(swaggerPath));

    // Step 4: Auto-generate route groups and add `/api` prefix
    const routeGroups = Array.from(prefixes).map((prefix) => {
        const apiPrefix = prefix.startsWith("/api")
            ? prefix
            : `/api${prefix.startsWith("/") ? prefix : `/${prefix}`}`;

        const name = apiPrefix
            .replace(/^\/api\//, "") // remove api/ from start for cleaner tag name
            .replace(/^\//, "")
            .replace(/[-_]/g, " ")
            .split("/")
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" / ");

        return {
            prefix: apiPrefix,
            tag: name || "General",
        };
    });

    // Step 5: Tag assignment logic
    function getTagForPath(path) {
        // Ensure Swagger paths also have /api prefix
        const apiPath = path.startsWith("/api") ? path : `/api${path}`;
        const group = routeGroups.find((g) => apiPath.startsWith(g.prefix));
        return group ? group.tag : "General";
    }

    const updatedPaths = {};
    const tagSet = new Set();

    // Step 6: Update all Swagger paths to include /api and add tags
    for (const originalPath in swagger.paths) {
        const newPath = originalPath.startsWith("/api")
            ? originalPath
            : `/api${originalPath}`;

        const tag = getTagForPath(originalPath);
        updatedPaths[newPath] = swagger.paths[originalPath];

        for (const method in updatedPaths[newPath]) {
            updatedPaths[newPath][method].tags = [tag];
        }

        tagSet.add(tag);
    }

    // Replace old paths with updated /api-prefixed ones
    swagger.paths = updatedPaths;

    // Step 7: Add tag descriptions
    swagger.tags = Array.from(tagSet).map((tag) => ({
        name: tag,
        description: `${tag} related endpoints`,
    }));

    // Step 8: Save updated swagger file
    fs.writeFileSync(swaggerPath, JSON.stringify(swagger, null, 2));
    console.log("✅ Swagger grouping complete with '/api' prefix added!");

    // Optional summary
    console.log("\n📚 Detected route groups:");
    routeGroups.forEach((g) => console.log(`• ${g.prefix} → ${g.tag}`));
})();
