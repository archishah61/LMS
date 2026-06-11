const ExceptionLog = require('../models/error_log/exception_log');

const errorMiddleware = async (err, req, res, next) => {
    const error_msg = err.original?.sqlMessage?.includes('|') ? err.original.sqlMessage.split('|')[2].trim() : (err.original?.sqlMessage || err.message);
    const error_type = err.original?.sqlMessage?.includes('|') ? err.original.sqlMessage.split('|')[1].trim() : err.name;

    console.error(err);
    
    // Log the error details into the ExceptionLog model
    if (err?.original?.sqlMessage?.startsWith('E')) {
        await ExceptionLog.create({
            error_status_code: err.original?.sqlMessage?.includes('|') ? err.original.sqlMessage.split('|')[0].trim() : (err.original?.errno || res.statusCode != 200 ? res.statusCode : 500),
            exception_msg: error_msg,
            exception_type: error_type,
            exception_trace: err.stack, // Stack trace
            exception_source: err.stack?.split('\n')[1]?.trim() || 'unknown', // The line where the error occurred
            web_url: req.originalUrl, // URL where the error happened
            status_flag: false, // Set status flag as false for errors
            CreateUser: req.user?.id || 'System', // User ID if available, or 'System' if not
            UpdateUser: req.user?.id || 'System' // Same for updating user
        });
        if (error_msg) {
            return res.status(400).json({ success: false, error: error_msg, message: error_msg });
        }
    }

    // Handle Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
        return res.status(400).json({ success: false, errors: err.errors.map(e => e.message) });
    }

    // Handle unique constraint errors (duplicate entries)
    if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ success: false, error: "Duplicate entry detected." });
    }

    // Handle foreign key constraint errors
    if (err.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({ success: false, error: "Invalid foreign key reference." });
    }

    // Handle database errors (e.g., SQL syntax issues)
    if (err.name === "SequelizeDatabaseError") {
        if (err.parent && err.parent.code === "ER_SIGNAL_EXCEPTION") {
            return res.status(400).json({ success: false, error: err.parent.sqlMessage });
        }
        return res.status(500).json({ success: false, error: err.parent.sqlMessage || "Database error occurred." });
    }

    // Handle connection errors to the database
    if (err.name === "SequelizeConnectionError") {
        return res.status(503).json({ success: false, error: "Database connection failed." });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
        return res.status(400).json({ success: false, error: error_msg, message: error_msg });
    }

    // Handle JWT token errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, error: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, error: "Token has expired." });
    }

    // Handle file upload errors (Multer)
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "File size is too large." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, error: "Too many files uploaded." });
    }

    // Handle JSON parsing errors (Malformed JSON in request body)
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ success: false, error: "Invalid JSON format in request body." });
    }

    // Handle missing parameter or required field errors
    if (err.name === "TypeError" && err.message.includes("Cannot destructure property")) {
        return res.status(400).json({ success: false, error: "Missing required fields in the request." });
    }

    // Handle network or timeouts errors
    if (err.code === "ECONNREFUSED") {
        return res.status(503).json({ success: false, error: "Service unavailable, connection refused." });
    }
    if (err.code === "ETIMEDOUT") {
        return res.status(504).json({ success: false, error: "Request timed out." });
    }

    // Handle general application errors
    if (err.message) {
        return res.status(400).json({ success: false, error: err.message });
    }

    // Default error response if no specific message is available
    res.status(500).json({ success: false, error: "Internal Server Error." });
};

module.exports = errorMiddleware;
