const sequelize = require("../../config/db");

const setupInterviewAnalytics = async () => {
    try {
        console.log("🔄 Setting up Interview Analytics procedures...");

        // Create procedure for getting overall performance metrics
        await sequelize.query(`
          CREATE PROCEDURE IF NOT EXISTS getOverallPerformanceMetrics(IN threshold FLOAT)
BEGIN
    -- Declare variables to store passCount and failCount
    DECLARE v_passCount INT;
    DECLARE v_failCount INT;
    DECLARE v_totalInterviews INT;
    DECLARE v_averageScore FLOAT;
    DECLARE v_passRate FLOAT;

    -- Calculate total interviews
    SELECT COUNT(*) INTO v_totalInterviews FROM tbl_interview_evaluations;

    -- Calculate average overall score
    SELECT AVG(overallScore) INTO v_averageScore FROM tbl_interview_evaluation_results;

    -- Calculate pass/fail counts
    SELECT COUNT(*) INTO v_passCount FROM tbl_interview_evaluation_results WHERE overallScore >= threshold;
    SELECT COUNT(*) INTO v_failCount FROM tbl_interview_evaluation_results WHERE overallScore < threshold;

    -- Calculate pass rate
    SET v_passRate = IF(v_totalInterviews > 0, (v_passCount / v_totalInterviews) * 100, 0);

    -- Create a temporary table to store histogram data
    DROP TEMPORARY TABLE IF EXISTS temp_score_histogram;
    CREATE TEMPORARY TABLE temp_score_histogram (
        score_range VARCHAR(10),
        count INT
    );

    -- Insert histogram data into the temporary table
    INSERT INTO temp_score_histogram (score_range, count)
    VALUES
        ('0-9', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 0 AND 9)),
        ('10-19', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 10 AND 19)),
        ('20-29', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 20 AND 29)),
        ('30-39', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 30 AND 39)),
        ('40-49', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 40 AND 49)),
        ('50-59', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 50 AND 59)),
        ('60-69', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 60 AND 69)),
        ('70-79', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 70 AND 79)),
        ('80-89', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 80 AND 89)),
        ('90-99', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore BETWEEN 90 AND 99)),
        ('100', (SELECT COUNT(*) FROM tbl_interview_evaluation_results WHERE overallScore = 100));

    -- Return the results in a single result set
    SELECT
        v_totalInterviews AS totalInterviews,
        v_averageScore AS averageScore,
        v_passCount AS passCount,
        v_failCount AS failCount,
        v_passRate AS passRate,
        (SELECT JSON_ARRAYAGG(count) FROM temp_score_histogram ORDER BY FIELD(score_range, '0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99', '100')) AS scoreHistogram;

    -- Drop the temporary table
    DROP TEMPORARY TABLE temp_score_histogram;
END;
        `);

        console.log("✅ Interview Analytics procedures created!");
    } catch (error) {
        console.error("❌ Error setting up Interview Analytics procedures:", error);
        throw error;
    }
};

module.exports = setupInterviewAnalytics;
