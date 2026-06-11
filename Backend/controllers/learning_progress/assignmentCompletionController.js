// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

const { currentLineHeight } = require("pdfkit");
const Assignment = require("../../models/content_management/assignmentsModel");
const FillTheBlanksQuestion = require("../../models/content_management/fillTheBlanks");
const MatchingOption = require("../../models/content_management/matchingOption");
const MatchingQuestion = require("../../models/content_management/matchingQuestion");
const ParagraphWriting = require("../../models/content_management/paragraphwriting");
const TrueFalseQuestion = require("../../models/content_management/trueFalseQuestion");
const studentAccessibleData = require("../../models/enrollment_management/student_accessible_data");
const AssignmentCompletion = require("../../models/learning_progress/assignmentCompletion");
const { getModuleCompletionStatus, getSessionCompletionStatus, getCourseCompletionStatus, checkAndUpdateTopicCompletionStatus } = require("../../progresTracking/newProgressTracking");
const { callProcedure } = require("../../utils/procedure/callProcedure"); // Adjust path accordingly
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge"); // Adjust path accordingly
const Validation = require("../../validations"); // Adjust if needed
const { fn, col } = require("sequelize");

const normalizeText = (text = "") => text.replace(/[^\w\s]/g, "").trim().split(/\s+/);

const stripHtml = (html) => {
    if (!html) return "";
    return html
        .replace(/<[^>]*>/g, " ")   // remove tags
        .replace(/\s+/g, " ")       // normalize spaces
        .trim();
};

const findSpellingErrors = (originalText, userText) => {

    const originalWords = normalizeText(originalText);
    const userWords = normalizeText(userText);

    const errors = [];

    originalWords.forEach((word, index) => {
        if (!userWords[index] || userWords[index] !== word) {
            errors.push({
                index,
                expected: word,
                actual: userWords[index] || ""
            });
        }
    });

    return errors;
};

exports.evaluateAssignment = async (req, res, next) => {
    try {
        const { assignmentId, userAnswers } = req.body;

        const userId = req.user?.id;

        if (!assignmentId) {
            return res.status(400).json({
                success: false,
                message: 'Assignment ID is required'
            });
        }

        const assignment = await Assignment.findByPk(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        const attemptCount = await AssignmentCompletion.count({
            where: {
                assignmentId,
                userId,
                status: 'Completed'
            }
        });

        if (assignment.max_attempt <= attemptCount) {
            return res.status(409).json({
                success: false,
                message: 'Max Attempt Reached For Assignment'
            });
        }

        if (assignment.category !== 'regular' && !userAnswers) {
            return res.status(400).json({
                success: false,
                message: 'Answers are required'
            });
        }

        if (assignment.category === 'true_false') {
            const trueFalseQuestions = await TrueFalseQuestion.findAll({
                where: {
                    assignment_id: assignmentId
                },
            });

            if (!trueFalseQuestions.length) {
                return res.status(404).json({
                    success: false,
                    message: 'No questions found for this assignment'
                });
            }
            const detailedResults = [];

            const questionMarks = assignment.max_score / trueFalseQuestions.length;
            let correctAnswerCount = 0;

            for (const question of trueFalseQuestions) {
                let questionIsCorrect = false;
                let userAnswer = userAnswers[question.id];
                let correctAnswer = question.correct_answer;

                if (userAnswer === correctAnswer) {
                    correctAnswerCount += 1;
                    questionIsCorrect = true;
                }

                detailedResults.push({
                    id: question.id,
                    type: assignment.category,
                    marks: questionMarks,
                    isCorrect: questionIsCorrect,
                    userAnswer: userAnswer,
                    correctAnswer: correctAnswer
                });
            }

            const finalScore = Math.min(correctAnswerCount * questionMarks, assignment.max_score);

            return res.status(200).json({
                success: true,
                data: {
                    score: Math.max(0, Math.round(finalScore)),
                    totalMarks: assignment.max_score,
                    correctAnswers: correctAnswerCount,
                    totalQuestions: trueFalseQuestions.length,
                    hasPassed: finalScore >= assignment.passing_score,
                    detailedResults: detailedResults,
                },
                message: 'Assignment evaluated successfully'
            });
        } else if (assignment.category === 'fill_in_the_blanks') {
            const fillTheBlanksQuestions = await FillTheBlanksQuestion.findAll({
                where: {
                    assignment_id: assignmentId
                },
            });

            if (!fillTheBlanksQuestions.length) {
                return res.status(404).json({
                    success: false,
                    message: 'No questions found for this assignment'
                });
            }
            const detailedResults = [];

            const questionMarks = assignment.max_score / fillTheBlanksQuestions.length;
            let correctAnswerCount = 0;

            for (const question of fillTheBlanksQuestions) {
                let questionIsCorrect = true;
                let userAnswer = userAnswers[question.id];
                let correctAnswers = question.answers;

                correctAnswers.forEach((blankedWord, index) => {
                    const userBlankAnswer = userAnswer[`${index}`];
                    if (!userBlankAnswer ||
                        userBlankAnswer.trim().toLowerCase() !== blankedWord.trim().toLowerCase()) {
                        questionIsCorrect = false;
                    }
                });

                if (questionIsCorrect) {
                    correctAnswerCount += 1;
                }

                detailedResults.push({
                    id: question.id,
                    type: assignment.category,
                    marks: questionMarks,
                    isCorrect: questionIsCorrect,
                    userAnswer: userAnswer,
                    correctAnswer: correctAnswers
                });
            }

            const finalScore = Math.min(correctAnswerCount * questionMarks, assignment.max_score);

            return res.status(200).json({
                success: true,
                data: {
                    score: Math.max(0, Math.round(finalScore)),
                    totalMarks: assignment.max_score,
                    correctAnswers: correctAnswerCount,
                    totalQuestions: fillTheBlanksQuestions.length,
                    hasPassed: finalScore >= assignment.passing_score,
                    detailedResults: detailedResults,
                },
                message: 'Assignment evaluated successfully'
            });
        } else if (assignment.category === 'matching') {
            const matchingQuestions = await MatchingQuestion.findAll({
                where: {
                    assignment_id: assignmentId
                },
                include: [{
                    model: MatchingOption,
                    as: 'MatchingOptions',
                    required: false
                }]
            });

            if (!matchingQuestions.length) {
                return res.status(404).json({
                    success: false,
                    message: 'No questions found for this assignment'
                });
            }

            const totalMatchings = matchingQuestions.reduce(
                (sum, q) => sum + q.MatchingOptions.length,
                0
            );

            const marksPerMatch = assignment.max_score / totalMatchings;

            const detailedResults = [];
            let totalCorrectMatches = 0;

            for (const question of matchingQuestions) {
                const userAnswer = userAnswers[question.id] || {};
                let questionCorrectMatches = 0;

                const optionResults = [];

                for (const option of question.MatchingOptions) {
                    const userMatchedValue = userAnswer[option.option_text];
                    const correctValue = option.match_text;

                    const isCorrect =
                        userMatchedValue &&
                        userMatchedValue.toLowerCase() === correctValue.toLowerCase();

                    if (isCorrect) {
                        totalCorrectMatches += 1;
                        questionCorrectMatches += 1;
                    }

                    optionResults.push({
                        option: option.option_text,
                        userAnswer: userMatchedValue || null,
                        correctAnswer: correctValue,
                        isCorrect,
                        marks: isCorrect ? marksPerMatch : 0
                    });
                }

                detailedResults.push({
                    questionId: question.id,
                    type: assignment.category,
                    totalOptions: question.MatchingOptions.length,
                    correctMatches: questionCorrectMatches,
                    optionResults
                });
            }

            const finalScore = Math.min(totalCorrectMatches * marksPerMatch, assignment.max_score);

            return res.status(200).json({
                success: true,
                data: {
                    score: Math.max(0, Math.round(finalScore)),
                    totalMarks: assignment.max_score,
                    correctMatches: totalCorrectMatches,
                    totalMatchings,
                    hasPassed: finalScore >= assignment.passing_score,
                    detailedResults
                },
                message: "Assignment evaluated successfully"
            });
        } else if (assignment.category === 'paragraph_writing') {
            const paragraphWriting = await ParagraphWriting.findAll({
                where: {
                    assignment_id: assignmentId
                },
            });

            const paragraph = paragraphWriting[0];

            if (!paragraph) {
                return res.status(404).json({
                    success: false,
                    message: "Paragraph question not found"
                });
            }

            // ✅ Strip HTML from original paragraph
            const cleanParagraph = stripHtml(paragraph.paragraph);

            const paragraphId = paragraph.id;
            const userParagraph = userAnswers[paragraphId] || "";
            const backspaceCount = userAnswers.backspaceCount || 0;

            const maxScore = assignment.max_score;

            // Find spelling errors
            const errors = findSpellingErrors(cleanParagraph, userParagraph);

            // Word-based scoring
            const originalWords = normalizeText(cleanParagraph);
            const totalWords = originalWords.length;
            const scorePerWord = maxScore / totalWords;

            // Penalties
            const wrongWordPenalty = errors.length * scorePerWord;
            const penaltyPerBackspace = Math.max(scorePerWord / 5, 0.2);
            const backspacePenalty = backspaceCount * penaltyPerBackspace;

            // Final score
            const rawScore = maxScore - wrongWordPenalty - backspacePenalty;
            const finalScore = Math.max(0, Math.round(rawScore));

            const detailedResults = {
                paragraphId,
                totalWords,
                wrongWords: errors.length,
                backspaceCount,
                scorePerWord: Number(scorePerWord.toFixed(2)),
                wrongWordPenalty: Number(wrongWordPenalty.toFixed(2)),
                backspacePenalty: Number(backspacePenalty.toFixed(2)),
                finalScore,
                errors
            };

            return res.status(200).json({
                success: true,
                data: {
                    score: finalScore,
                    totalMarks: maxScore,
                    hasPassed: finalScore >= assignment.passing_score,
                    detailedResults
                },
                message: "Assignment evaluated successfully"
            });
        } else if (assignment.category === 'regular') {
            return res.status(200).json({
                success: true,
                data: {
                    score: assignment.max_score,
                    totalMarks: assignment.max_score,
                    hasPassed: true
                },
                message: "Assignment evaluated successfully"
            });
        }

        res.status(200).json({ assignment });

    } catch (error) {
        next(error);
    }
};

// Create or Update Assignment Completion Record
exports.createAssignmentCompletion = async (req, res, next) => {
    try {
        const { userId, assignmentId, isCompleted, status, score, tried_attempts, updated_by, created_by, courseId, moduleId } = req.body;

        // ===== VALIDATIONS START =====
        Validation.isInteger(userId, "Invalid userId.");
        Validation.isInteger(assignmentId, "Invalid assignmentId.");
        Validation.isBoolean(isCompleted, "isCompleted must be a boolean.");
        Validation.isString(status, { min: 2, max: 50 }, "Status must be a valid string.");
        Validation.isNumber(score, { min: 0 }, "Score must be a valid number >= 0.");
        Validation.isInteger(tried_attempts, "tried_attempts must be an integer.");
        if (updated_by) Validation.isInteger(updated_by, "Invalid updated_by.");
        if (created_by) Validation.isInteger(created_by, "Invalid created_by.");
        // ===== VALIDATIONS END =====

        if (isCompleted) {
            const accessibleData = await studentAccessibleData.findOne({
                where: {
                    user_id: userId,
                    course_id: courseId
                },
                attributes: ['id', 'topic_ids', 'quiz_ids', 'assignment_ids'],
                raw: true
            });

            if (!accessibleData) {
                return res.status(404).json({
                    success: false,
                    message: "No accessible data found for this user"
                });
            }

            let updatedData = { ...accessibleData };

            const assignmentIds = Array.isArray(accessibleData.assignment_ids)
                ? accessibleData.assignment_ids
                : [];

            updatedData.assignment_ids = assignmentIds.map(assignment => {
                if (assignment.id === assignmentId) {
                    return { ...assignment, isCompleted: true };
                }
                return assignment;
            });

            await studentAccessibleData.update(
                { assignment_ids: updatedData.assignment_ids },
                {
                    where: { id: accessibleData.id },
                    returning: true
                }
            );
        }

        // Update the course completion percentage
        await callProcedure("calculateCourseCompletionFromAccessData", [userId, courseId]);

        // Update topic completion status based on assignment
        await checkAndUpdateTopicCompletionStatus(userId, courseId, 'assignment', assignmentId);

        // 🔥 Call module completion check here
        let moduleCompletionStatus = null;
        let sessionCompletionStatus = null;
        let courseCompletionStatus = null;
        if (moduleId && courseId && userId) {
            moduleCompletionStatus = await getModuleCompletionStatus(userId, courseId, moduleId);

            // 🔥 If module completed, check session completion too
            if (moduleCompletionStatus.isModuleCompleted === true && moduleCompletionStatus.sessionId) {
                sessionCompletionStatus = await getSessionCompletionStatus(userId, courseId, moduleCompletionStatus.sessionId);
                if (sessionCompletionStatus.sessionCompleted === true) {
                    courseCompletionStatus = await getCourseCompletionStatus(userId, courseId)
                }
            }
        }

        // First, check if there's an existing completion record for this user and assignment
        const existingResult = await callProcedure("findAssignmentCompletionByUserAndAssignment", [
            userId,
            assignmentId
        ]);

        if (existingResult.success && existingResult.data && existingResult.data.length > 0 && !Boolean(existingResult.data[0].isCompleted)) {
            // If exists, update it with incremented tried_attempts
            const existingCompletion = existingResult.data[0];
            const newAttempts = existingCompletion.tried_attempts + 1;

            const updateResult = await callProcedure("updateAssignmentCompletion", [
                existingCompletion.id,
                userId,
                assignmentId,
                isCompleted,
                status,
                score,
                newAttempts, // Increment the attempt count
                updated_by
            ]);

            if (!updateResult.success) {
                return res.status(400).json({ error: updateResult.error });
            }

            res.status(200).json({
                ...updateResult.data[0],
                message: "Assignment completion updated successfully",
                moduleCompletionStatus,
                sessionCompletionStatus,
                courseCompletionStatus
            });
        } else {
            // If exists, update it with incremented tried_attempts
            const existingCompletion = existingResult.data[0];
            const newAttempts = (existingCompletion?.tried_attempts || 0) + 1;

            // If no existing record, create a new one
            const { success, data, error } = await callProcedure("createAssignmentCompletion", [
                userId,
                assignmentId,
                isCompleted,
                status,
                score,
                newAttempts || 1,
                existingCompletion?.due_date || null,
                updated_by,
                created_by
            ]);

            if (!success && error) return next(error);

            if (!success) {
                return res.status(400).json({ error });
            }

            res.status(200).json({
                id: data[0].id,
                message: "Assignment completion added successfully",
                moduleCompletionStatus,
                sessionCompletionStatus,
                courseCompletionStatus
            });

            // res.status(201).json(data[0]); // Return the inserted record with id
        }
    } catch (error) {
        next(error);
    }
};

exports.getAssignmentCompletionByStudentId = async (req, res, next) => {
    const { studentId } = req.params;
    try {

        const { success, data, error } = await callProcedure("getAssignmentCompletionByStudentId", [studentId]);

        if (!success && error) return next(error);

        if (!success) {
            return res.status(400).json({ error });
        }

        if (!data.length) {
            return res.status(404).json({ error: "No assignment completions found for this student" });
        }

        // Format the response to match the expected structure
        const formattedData = data.map(completion => {
            return {
                id: completion.completionId,
                userId: completion.userId,
                assignmentId: completion.assignmentId,
                isCompleted: completion.isCompleted,
                status: completion.status,
                score: completion.score,
                due_date: completion.due_date,
                tried_attempts: completion.tried_attempts,
                last_attempt_time: completion.last_attempt_time,
                created_by: completion.created_by,
                updated_by: completion.updated_by,
                created_at: completion.created_at,
                updated_at: completion.updated_at,
                Assignment: {
                    id: completion.assignmentId,
                    module_id: completion.module_id,
                    title: completion.title,
                    description: completion.description,
                    file: completion.file,
                    due_date: completion.due_date,
                    max_score: completion.max_score,
                    max_attempt: completion.max_attempt,
                    status: completion.assignmentStatus,
                    category: completion.category,
                    created_by: completion.assignmentCreatedBy,
                    created_by_type: completion.assignmentCreatedByType,
                    updated_by: completion.assignmentUpdatedBy,
                    updated_by_type: completion.assignmentUpdatedByType,
                    created_at: completion.assignmentCreatedAt,
                    updated_at: completion.assignmentUpdatedAt,
                    MatchingQuestions: completion.MatchingQuestions || [],
                    TrueFalseQuestions: completion.TrueFalseQuestions || [],
                    FillTheBlanksQuestions: completion.FillTheBlanksQuestions || [],
                    ParagraphWritings: completion.ParagraphWritings || [],
                },
                AssignmentResponses: completion.AssignmentResponses || [],
            };
        });

        res.status(200).json(formattedData);
    } catch (error) {
        next(error);
    }
};

// Update Assignment Completion
exports.updateAssignmentCompletion = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { userId, assignmentId, isCompleted, status, score, tried_attempts = 1, updated_by } = req.body;

        const result = await callProcedure("updateAssignmentCompletion", [
            id,
            userId,
            assignmentId,
            isCompleted,
            status,
            score,
            tried_attempts,
            updated_by
        ]);

        if (!result.success && result.error) {
            return next(result.error);
        }

        if (!result.success) {
            return res.status(404).json({ message: "Assignment completion not found" });
        }

        res.status(200).json(result.data[0]); // Return the updated record
    } catch (error) {
        next(error);
    }
};

exports.getAssignmentCompletionByAssignmentId = async (req, res, next) => {
    try {
        const { assignmentId, userId } = req.params;
        const { success, data, error } = await callProcedureChallenge("getAssignmentCompletionByAssignmentId", [assignmentId, userId]);
        if (!success && error) return next(error);
        if (!success) return res.status(400).json({ message: "Error fetching assignment completion" });
        res.status(200).json(data);
    } catch (error) {
        next(error);
    }
};

exports.createAssignmentDueDate = async (req, res, next) => {
    try {
        const { user_id, assignment_id, due_date, status } = req.body;
        // Normalize ISO 8601 to MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
        let mysqlDueDate = due_date;
        if (due_date) {
            if (typeof due_date === 'string') {
                // Handle values like 2025-09-18T10:39:43.254Z or 2025-09-18T10:39:43Z
                const cleaned = due_date.replace('T', ' ').replace('Z', '');
                // Trim fractional seconds to seconds precision
                mysqlDueDate = cleaned.split('.')[0];
            } else {
                // Date object or timestamp
                const d = new Date(due_date);
                mysqlDueDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 19)
                    .replace('T', ' ');
            }
        }

        const result = await callProcedure("createAssignmentDueDate", [user_id, assignment_id, mysqlDueDate, status]);
        if (!result.success && result.error) return next(result.error);
        if (!result.success || !result.data || !result.data[0]) {
            return res.status(400).json({ message: "Failed to create assignment due date" });
        }
        res.status(201).json(result.data[0]);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createAssignmentCompletion: exports.createAssignmentCompletion,
    getAssignmentCompletions: exports.getAssignmentCompletions,
    getAssignmentCompletionByStudentId: exports.getAssignmentCompletionByStudentId,
    updateAssignmentCompletion: exports.updateAssignmentCompletion,
    deleteAssignmentCompletion: exports.deleteAssignmentCompletion,
    getAssignmentCompletionByAssignmentId: exports.getAssignmentCompletionByAssignmentId,
    createAssignmentDueDate: exports.createAssignmentDueDate,
    evaluateAssignment: exports.evaluateAssignment
};