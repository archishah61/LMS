// socket.js
const { Server } = require("socket.io");
let io;
const activeSessions = {}; // { userId: socketId }
const activeAdminSessions = {};
const activePartnerSessions = {};
const courseProgressSessions = {}; // Track course generation progress by userId
const path = require("path")
const codeDir = path.join(__dirname, '/../virtual_lab/code');
const executeDir = path.join(__dirname, '/../virtual_lab/execute');
const fs = require('fs-extra');
const { exec } = require('child_process');

function getFileExtension(language) {
    const extensions = {
        'javascript': 'js',
        'typescript': 'ts',
        'python': 'py',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'php': 'php',
        'html': 'html',
        'css': 'css',
        'csharp': 'cs',
        'go': 'go',
        'dart': 'dart'
    };

    return extensions[language.toLowerCase()] || 'txt';
}

function compareOutputs(actual, expected) {
    // Normalize both strings (trim whitespace, remove extra spaces)
    const normalize = (str) => {
        return str.toString()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\r\n/g, '\n')
            .trim();
    };

    return normalize(actual) === normalize(expected);
}

// Execute code based on language
function executeCode(language, filePath, socket) {
    let command;

    switch (language.toLowerCase()) {
        case 'javascript':
            command = `node ${filePath}`;
            break;
        case 'typescript':
            command = `npx ts-node ${filePath}`;
            break;
        case 'python':
            command = `python ${filePath}`;
            break;
        case 'java':
            const className = path.basename(filePath, '.java');
            command = `javac ${filePath} && java -cp ${path.dirname(filePath)} ${className}`;
            break;
        case 'c':
            const outputC = path.join(path.dirname(filePath), path.basename(filePath, '.c'));
            command = `gcc ${filePath} -o ${outputC} && ${outputC}`;
            break;
        case 'cpp':
            const outputCpp = path.join(path.dirname(filePath), path.basename(filePath, '.cpp'));
            command = `g++ ${filePath} -o ${outputCpp} && ${outputCpp}`;
            break;
        case 'php':
            command = `php ${filePath}`;
            break;
        case 'csharp':
            const outputCs = path.join(path.dirname(filePath), path.basename(filePath, '.cs'));
            // Try to use dotnet if available, fall back to mono
            command = `dotnet build ${filePath} -o ${outputCs} || mcs ${filePath} -out:${outputCs}.exe && (dotnet ${outputCs}.dll || mono ${outputCs}.exe)`;
            break;
        case 'go':
            command = `go run ${filePath}`;
            break;
        case 'dart':
            command = `dart ${filePath}`;
            break;
        case 'html':
            // For HTML, we don't execute but return the content
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    socket.emit('execution-error', { error: err.message });
                } else {
                    socket.emit('execution-result', {
                        result: 'HTML content ready for preview',
                        output: data,
                        type: 'html'
                    });
                }
            });
            return;
        case 'css':
            // For CSS, we don't execute but return the content
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    socket.emit('execution-error', { error: err.message });
                } else {
                    socket.emit('execution-result', {
                        result: 'CSS content ready for styling',
                        output: data,
                        type: 'css'
                    });
                }
            });
            return;
        default:
            socket.emit('execution-error', { error: `Unsupported language: ${language}` });
            return;
    }

    // Execute command with improved error handling
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error: ${error.message}`);
            console.error(`Stderr: ${stderr}`);
            socket.emit('execution-error', {
                error: error.message,
                stderr: stderr
            });
            return;
        }

        socket.emit('execution-result', {
            result: 'Execution completed',
            output: stdout || 'Command executed successfully (no output)',
            type: 'text'
        });
    });
}

// Execute code with specific input
function executeWithInput(language, filePath, input, timestamp, index) {
    return new Promise((resolve) => {
        let command;
        const inputFile = path.join(executeDir, `input_${timestamp}_${index}.txt`);

        // Write input to file
        fs.writeFileSync(inputFile, input || '');

        // Build command based on language
        switch (language.toLowerCase()) {
            case 'python':
                command = `python ${filePath} < ${inputFile}`;
                break;
            case 'javascript':
                command = `node ${filePath} < ${inputFile}`;
                break;
            case 'java':
                // Compile first
                const className = path.basename(filePath, '.java');
                const compileCmd = `javac "${filePath}"`;
                exec(compileCmd, (compileError) => {
                    if (compileError) {
                        resolve({
                            output: '',
                            error: `Compilation error: ${compileError.message}`
                        });
                        return;
                    }
                    // Run with input
                    const runCmd = `java -cp "${path.dirname(filePath)}" ${className} < "${inputFile}"`;
                    exec(runCmd, { timeout: 5000 }, (runError, stdout, stderr) => {
                        // Clean up input file
                        fs.removeSync(inputFile);

                        if (runError) {
                            resolve({
                                output: stdout,
                                error: stderr || runError.message
                            });
                        } else {
                            resolve({
                                output: stdout,
                                error: stderr
                            });
                        }
                    });
                });
                return; // Early return because we're async
            case 'cpp':
                const outputFile = path.join(executeDir, `program_${timestamp}_${index}`);
                command = `g++ ${filePath} -o ${outputFile} && ${outputFile} < ${inputFile}`;
                break;
            case 'c':
                const outputC = path.join(executeDir, `program_${timestamp}_${index}`);
                command = `gcc ${filePath} -o ${outputC} && ${outputC} < ${inputFile}`;
                break;
            default:
                resolve({
                    output: '',
                    error: `Unsupported language: ${language}`
                });
                return;
        }

        // Execute command (for non-Java languages)
        if (command) {
            exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
                // Clean up input file
                try {
                    fs.removeSync(inputFile);
                } catch (error) {
                    console.error("Error Removing Input File: ", error);
                }

                if (error) {
                    resolve({
                        output: stdout,
                        error: stderr || error.message
                    });
                } else {
                    resolve({
                        output: stdout,
                        error: stderr
                    });
                }
            });
        }
    });
}

function initSocket(server) {
    io = new Server(server, {
        cors: { origin: process.env.FRONTEND_URL }, // adjust for frontend
    });

    io.on("connection", (socket) => {

        socket.on("register-session", ({ userId, userRole = "student" }) => {
            const oldSocketId = userRole === "admin" ?
                activeAdminSessions[userId] : userRole === "student" ?
                    activeSessions[userId] : activePartnerSessions[userId];

            // If there’s already a session → notify and disconnect it
            if (oldSocketId && oldSocketId !== socket.id) {
                io.to(oldSocketId).emit("force-logout", {
                    message: "You have been logged out because you logged in on another device",
                    userRole
                });

                // Optionally force disconnect old socket
                io.sockets.sockets.get(oldSocketId)?.disconnect(true);
            }

            // Save only the new session
            if (userRole === "student") {
                activeSessions[userId] = socket.id;
            } else if (userRole === "admin") {
                activeAdminSessions[userId] = socket.id;
            } else {
                activePartnerSessions[userId] = socket.id;
            }

            socket.userId = userId;

        });

        // New event: Register for course progress updates
        socket.on("register-course-progress", ({ userId, courseId }) => {
            courseProgressSessions[userId] = {
                socketId: socket.id,
                courseId: courseId
            };
        });

        socket.on("disconnect", () => {
            // Clean up session if user disconnected
            if (socket.userId) {
                if (activeSessions[socket.userId] === socket.id) {
                    delete activeSessions[socket.userId];
                }
                if (activeAdminSessions[socket.userId] === socket.id) {
                    delete activeAdminSessions[socket.userId];
                }
                if (activePartnerSessions[socket.userId] === socket.id) {
                    delete activePartnerSessions[socket.userId];
                }
                if (courseProgressSessions[socket.userId]?.socketId === socket.id) {
                    delete courseProgressSessions[socket.userId];
                }
            }
        });

        socket.on('execute', async (data) => {
            const { code, language, filename } = data;
            try {
                // For Java, extract class name from code and ensure filename matches
                let tempFilePath;
                if (language.toLowerCase() === 'java') {
                    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
                    if (classNameMatch && classNameMatch[1]) {
                        const className = classNameMatch[1];
                        tempFilePath = path.join(codeDir, `${className}.java`);
                    } else {
                        // If no public class found, use default filename
                        tempFilePath = path.join(codeDir, filename || `temp_${Date.now()}.java`);
                    }
                } else if (language.toLowerCase() === 'csharp') {
                    // For C#, extract class name if possible
                    const classNameMatch = code.match(/namespace\s+(\w+)/);
                    if (classNameMatch && classNameMatch[1]) {
                        const namespace = classNameMatch[1];
                        tempFilePath = path.join(codeDir, `${namespace}.cs`);
                    } else {
                        tempFilePath = path.join(codeDir, filename || `temp_${Date.now()}.cs`);
                    }
                } else {
                    tempFilePath = path.join(codeDir, filename || `temp_${Date.now()}.${getFileExtension(language)}`);
                }

                // Save code to file
                await fs.writeFile(tempFilePath, code);

                // Execute based on language
                executeCode(language, tempFilePath, socket);
            } catch (error) {
                console.error("error", error)
                socket.emit('execution-error', { error: error.message });
            }
        });

        socket.on('execute-code', async (data) => {
            const { code, language, testCases, isSampleRun = false, isSubmission = false } = data;
            // Create directory if it does not exist
            if (!fs.existsSync(executeDir)) {
                fs.mkdirSync(executeDir, { recursive: true });
            }

            try {
                const timestamp = Date.now();
                const fileName = `code_${timestamp}.${getFileExtension(language)}`;

                let tempFilePath;
                if (language.toLowerCase() === 'java') {
                    const classNameMatch = code.match(/public\s+class\s+(\w+)/);
                    if (classNameMatch && classNameMatch[1]) {
                        const className = classNameMatch[1];
                        tempFilePath = path.join(executeDir, `${className}.java`);
                    } else {
                        // If no public class found, use default fileName
                        tempFilePath = path.join(executeDir, fileName || `temp_${Date.now()}.java`);
                    }
                } else if (language.toLowerCase() === 'csharp') {
                    // For C#, extract class name if possible
                    const classNameMatch = code.match(/namespace\s+(\w+)/);
                    if (classNameMatch && classNameMatch[1]) {
                        const namespace = classNameMatch[1];
                        tempFilePath = path.join(executeDir, `${namespace}.cs`);
                    } else {
                        tempFilePath = path.join(executeDir, fileName || `temp_${Date.now()}.cs`);
                    }
                } else {
                    tempFilePath = path.join(executeDir, fileName || `temp_${Date.now()}.${getFileExtension(language)}`);
                }

                // Save the code
                await fs.writeFile(tempFilePath, code);

                // Run each test case separately (standard approach)
                const results = [];

                for (let i = 0; i < testCases.length; i++) {
                    const testCase = testCases[i];

                    // Execute with this test case's input
                    const result = await executeWithInput(
                        language,
                        tempFilePath,
                        testCase.input,
                        timestamp,
                        i
                    );

                    // Compare output with expected
                    const passed = compareOutputs(result.output, testCase.expected_output);

                    results.push({
                        passed,
                        input: testCase.input,
                        expected: testCase.expected_output,
                        actual: result.output,
                        error: result.error,
                        isPublic: testCase?.is_public === 1
                    });
                }

                // Clean up file (optional - you might want to keep for debugging)
                await fs.remove(tempFilePath);

                // Send results back
                socket.emit('execution-results', {
                    success: true,
                    results,
                    isSample: isSampleRun,
                    isSubmission,
                    allPassed: results.every(r => r.passed)
                });

            } catch (error) {
                console.error("Execution error:", error);
                socket.emit('execution-error', {
                    error: error.message
                });
            }
        });
    });
}

/** 🔹 Notify user about assignment reminder */
function notifyAssignmentReminder(userId, assignment) {
    const socketId = activeSessions[userId];
    if (socketId) {
        io.to(socketId).emit("assignment-reminder", {
            assignmentId: assignment.id,
            title: assignment.title,
            dueDate: assignment.due_date,
            message: `Reminder: Your assignment "${assignment.title}" is due on ${assignment.due_date}`,
        });
    }
}

function disconnectUserSocket(userId, role) {
    const socketId =
        role === "student"
            ? activeSessions[userId]
            : role === "admin"
                ? activeAdminSessions[userId]
                : activePartnerSessions[userId];

    if (socketId) {
        const socket = io.sockets.sockets.get(socketId);

        if (socket) {
            socket.emit("force-logout", {
                message: "Logged out successfully",
                userRole: role
            });

            socket.disconnect(true);
        }

        // Clean mapping
        if (role === "student") {
            delete activeSessions[userId];
            delete courseProgressSessions[userId];
        } else if (role === "admin") {
            delete activeAdminSessions[userId];
        } else {
            delete activePartnerSessions[userId];
        }
    }
}

function notifyForceLogout(userId) {
    const socketId = activeSessions[userId];
    if (socketId) {
        io.to(socketId).emit("force-logout", {
            message: "You have been logged out because you logged in on another device",
        });

        // Also disconnect the socket (optional)
        io.sockets.sockets.get(socketId)?.disconnect(true);

        // Remove from sessions
        delete activeSessions[userId];
    }
}

/** 🔹 Send course generation progress update */
function notifyCourseProgress(userId, step, message, data = null) {
    const session = courseProgressSessions[userId];
    if (session && session.socketId) {
        io.to(session.socketId).emit("course-progress", {
            step,
            message,
            data,
            timestamp: new Date().toISOString(),
            courseId: session.courseId
        });
    }
}

module.exports = { initSocket, notifyForceLogout, notifyAssignmentReminder, disconnectUserSocket, notifyCourseProgress };
