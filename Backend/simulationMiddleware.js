// middlewares/simulationMiddleware.js
module.exports = (req, res, next) => {
    const simulationMethods = ["POST", "PUT", "DELETE"];
    const excludedPaths = ["/api/auth/login", "/api/auth/signup"];

    // ✅ Skip if not simulation mode or method not write
    if (process.env.SIMULATION_MODE !== "true" || !simulationMethods.includes(req.method)) {
        return next();
    }

    // ✅ Skip excluded paths
    if (excludedPaths.includes(req.originalUrl)) return next();

    // ✅ Detect Swagger requests via custom header
    const fromSwagger = req.headers["x-swagger-client"] === "true";

    console.log("fromSwagger", fromSwagger)
    if (fromSwagger) {
        console.log(`🧩 Simulation Mode Active (Swagger) → ${req.method} ${req.originalUrl}`);

        return res.status(200).json({
            success: true,
            message: `Simulation mode: ${req.method} ${req.originalUrl} handled successfully (Swagger mock response).`,
            data: req.body || {},
        });
    }

    // ✅ Allow real DB ops from frontend or others
    next();
};
