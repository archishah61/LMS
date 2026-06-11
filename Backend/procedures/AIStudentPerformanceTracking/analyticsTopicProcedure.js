const sequelize = require("../../config/db");

const setupAnalyticsTopicProcedures = async () => {
    try {
        console.log("🔄 Setting up Analytics Topic procedures...");

        // Drop existing procedure if exists
        await sequelize.query(`DROP PROCEDURE IF EXISTS getTopicsByModuleIdForAnalytics`);

        // Create the procedure
        await sequelize.query(`
            CREATE PROCEDURE getTopicsByModuleIdForAnalytics(IN moduleId INT)
            BEGIN
                SELECT 
                    id, 
                    title, 
                    description
                FROM tbl_topics
                WHERE module_id = moduleId
                    AND status = 'active'
                ORDER BY sequence_no ASC;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getTopicContentByModuleAndTopics`);

        // Create the procedure
        await sequelize.query(`
            CREATE PROCEDURE getTopicContentByModuleAndTopics(IN moduleId INT, IN topicIdsCsv TEXT)
            BEGIN
                SET @sql = CONCAT(
                    'SELECT topic_id, quiz_id, assignment_id FROM tbl_topic_content ',
                    'WHERE module_id = ? ',
                    'AND topic_id IN (', topicIdsCsv, ') ',
                    'AND (quiz_id IS NOT NULL OR assignment_id IS NOT NULL) ',
                    'ORDER BY topic_id ASC'
                );
                PREPARE stmt FROM @sql;
                SET @moduleId = moduleId;
                EXECUTE stmt USING @moduleId;
                DEALLOCATE PREPARE stmt;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getQuizCompletionsByUserModuleTopics`);

        // Create the procedure
        await sequelize.query(`
            CREATE PROCEDURE getQuizCompletionsByUserModuleTopics(IN userId INT, IN moduleId INT, IN topicIdsCsv TEXT)
            BEGIN
                SET @sql = CONCAT(
                    'SELECT quizId, topic_id, score FROM tbl_quiz_completion ',
                    'WHERE userId = ? ',
                    'AND module_id = ? ',
                    'AND topic_id IN (', topicIdsCsv, ') ',
                    'AND quizId IS NOT NULL ',
                    'ORDER BY created_at DESC'
                );
                PREPARE stmt FROM @sql;
                SET @userId = userId;
                SET @moduleId = moduleId;
                EXECUTE stmt USING @userId, @moduleId;
                DEALLOCATE PREPARE stmt;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAssignmentCompletionsByUserAssignments`);

        // Create the procedure
        await sequelize.query(`
            CREATE PROCEDURE getAssignmentCompletionsByUserAssignments(IN userId INT, IN assignmentIdsCsv TEXT)
            BEGIN
                SET @sql = CONCAT(
                    'SELECT assignmentId, score, isCompleted, status FROM tbl_assignment_completion ',
                    'WHERE userId = ? ',
                    'AND assignmentId IN (', assignmentIdsCsv, ') ',
                    'ORDER BY created_at DESC'
                );
                PREPARE stmt FROM @sql;
                SET @userId = userId;
                EXECUTE stmt USING @userId;
                DEALLOCATE PREPARE stmt;
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getQuizzesByModuleId`);

        // Create the procedure
        await sequelize.query(`
            CREATE PROCEDURE getQuizzesByModuleId(IN moduleId INT)
                BEGIN
                    SELECT id 
                    FROM tbl_quiz 
                    WHERE module_id = moduleId 
                        AND status = 'active';
                END;
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getAssignmentsByModuleIdForAnalytics`);

        // Create the procedure
        await sequelize.query(`
            CREATE PROCEDURE getAssignmentsByModuleIdForAnalytics(IN moduleId INT)
            BEGIN
                SELECT id, title, category, max_score FROM tbl_assignments WHERE module_id = moduleId AND status = 'active';
            END
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getQuizQuestionsByQuizIdsAndType`);

        // Create the procedure
        await sequelize.query(`
            CREATE PROCEDURE getQuizQuestionsByQuizIdsAndType(
                IN quizIdsCsv TEXT,
                IN typeValue VARCHAR(50),
                IN questionColumn VARCHAR(100)
            )
            BEGIN
                SET @sql = CONCAT(
                    'SELECT id, quiz_id, ', questionColumn, ' FROM tbl_quiz_questions ',
                    'WHERE quiz_id IN (', quizIdsCsv, ') ',
                    'AND type = ?',
                    'AND status = "active"'
                );
                PREPARE stmt FROM @sql;
                SET @typeValue = typeValue;
                EXECUTE stmt USING @typeValue;
                DEALLOCATE PREPARE stmt;
            END
        `);

        // Drop existing procedure if exists
        await sequelize.query(`DROP PROCEDURE IF EXISTS getPreDefinedQuestionsByQuizIds`);

        // Create the procedure
        await sequelize.query(`
            CREATE PROCEDURE getPreDefinedQuestionsByQuizIds(
                IN quizIdsCsv TEXT
            )
            BEGIN
                SET @sql = CONCAT(
                    'SELECT qp.id, qp.quiz_id, qp.pre_defined_question_id, pq.question_text ',
                    'FROM tbl_quiz_predefined_questions qp ',
                    'JOIN tbl_predefined_questions pq ON qp.pre_defined_question_id = pq.id ',
                    'WHERE qp.quiz_id IN (', quizIdsCsv, ')',
                    'AND status = "active"'
                );
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END
        `);

        // Drop existing procedure if exists
        await sequelize.query(`DROP PROCEDURE IF EXISTS getRealWordQuestionsByQuizIds`);

        // Create the procedure
        await sequelize.query(`
            CREATE PROCEDURE getRealWordQuestionsByQuizIds(
                IN quizIdsCsv TEXT
            )
            BEGIN
                SET @sql = CONCAT(
                    'SELECT id, quiz_id, realword_words FROM tbl_quiz_questions ',
                    'WHERE quiz_id IN (', quizIdsCsv, ') ',
                    'AND type = "realword"',
                    'AND status = "active"'
                );
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END
        `);

        console.log("✅ Analytics Topic procedures created successfully!");
    } catch (error) {
        console.error("❌ Error setting up Analytics Topic procedures:", error);
        throw new Error(`Failed to set up Analytics Topic procedures: ${error.message}`);
    }
};


module.exports = {
    setupAnalyticsTopicProcedures,
};

