const sequelize = require("../../config/db");

const setupRevenueAndFinancialAnalytics = async () => {
    try {
        console.log("🔄 Setting up RevenueAndFinancialAnalytics procedures...");

        //Get Revenue by course category
        await sequelize.query(`DROP PROCEDURE IF EXISTS getRevenueByCourseCategory`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRevenueByCourseCategory()
            BEGIN
                SELECT 
                    c.category_id,
                    cc.category AS category_name,
                    COUNT(e.id) AS total_enrollments,
                    ROUND(SUM(
                        p.amount
                    ), 2) AS total_revenue
                FROM tbl_enrollments e
                JOIN tbl_courses c ON c.id = e.course_id
                JOIN tbl_course_categories cc ON cc.id = c.category_id
                JOIN tbl_payments p on p.enrollment_id = e.id
                GROUP BY c.category_id, cc.category
                ORDER BY total_revenue DESC;
            END;
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getRevenueByCourseCategoryByAdmin`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRevenueByCourseCategoryByAdmin()
BEGIN
    SELECT 
        c.category_id,
        cc.category AS category_name,
        COUNT(e.id) AS total_enrollments,
        ROUND(SUM(
            p.amount
        ), 2) AS total_revenue
    FROM tbl_enrollments e
    JOIN tbl_courses c ON c.id = e.course_id
    JOIN tbl_course_categories cc ON cc.id = c.category_id
    JOIN tbl_payments p on p.enrollment_id = e.id
    WHERE c.created_by_type = 'admin'
    GROUP BY c.category_id, cc.category
    ORDER BY total_revenue DESC;
END;
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getRevenueByCourseCategoryByPartners`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRevenueByCourseCategoryByPartners()
BEGIN
    SELECT 
        c.category_id,
        cc.category AS category_name,
        COUNT(e.id) AS total_enrollments,
        ROUND(SUM(
            p.amount
        ), 2) AS total_revenue
    FROM tbl_enrollments e
    JOIN tbl_courses c ON c.id = e.course_id
    JOIN tbl_course_categories cc ON cc.id = c.category_id
    JOIN tbl_payments p on p.enrollment_id = e.id
    WHERE c.created_by_type = 'partner'
    GROUP BY c.category_id, cc.category
    ORDER BY total_revenue DESC;
END;
        `);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getRevenueByCourseCategoryForPartner`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getRevenueByCourseCategoryForPartner(IN userId INT)
BEGIN
    SELECT 
        c.category_id,
        cc.category AS category_name,
        COUNT(e.id) AS total_enrollments,
        ROUND(SUM(
            p.amount
        ), 2) AS total_revenue
    FROM tbl_enrollments e
    JOIN tbl_courses c ON c.id = e.course_id
    JOIN tbl_course_categories cc ON cc.id = c.category_id
    JOIN tbl_payments p on p.enrollment_id = e.id
    WHERE c.created_by = userId AND c.created_by_type = 'partner'
    GROUP BY c.category_id, cc.category
    ORDER BY total_revenue DESC;
END;
        `);

        // Get customer lifetime value
        await sequelize.query(`DROP PROCEDURE IF EXISTS getCustomerLifetimeValue`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCustomerLifetimeValue()
BEGIN
    SELECT 
        u.id AS user_id,
        u.full_name,
        u.email,
        SUM(p.amount) AS total_revenue
    FROM tbl_payments p
    JOIN (
        -- 1 Enrollment purchases
        SELECT e.user_id, p1.id AS payment_id
        FROM tbl_enrollments e
        JOIN tbl_payments p1 ON p1.enrollment_id = e.id

        UNION ALL

        -- 2 CheatSheet purchases
        SELECT ucs.user_id, ucs.payment_id
        FROM tbl_user_cheat_sheets ucs

        UNION ALL

        -- 3 Tier / Course generation purchases
        SELECT cgp.user_id, cgp.payment_id
        FROM tbl_course_generation_payments cgp

        UNION ALL

        -- 4 Contest payments
        SELECT ce.user_id, p2.id AS payment_id
        FROM tbl_user_contest_enrollments ce
        JOIN tbl_payments p2 ON p2.contest_id = ce.contest_id
    ) up ON up.payment_id = p.id
    JOIN tbl_users u ON u.id = up.user_id
    WHERE p.status = 'completed'
    GROUP BY u.id, u.full_name, u.email
    ORDER BY total_revenue DESC;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCustomerLifetimeValueByAdmin`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCustomerLifetimeValueByAdmin()
            BEGIN
                            
                SELECT 
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    SUM(p.amount) AS total_revenue
                FROM tbl_payments p
                JOIN (
                    -- 1 Enrollment purchases
                    SELECT e.user_id, p1.id AS payment_id
                    FROM tbl_enrollments e
                    JOIN tbl_courses c ON e.course_id = c.id
                    JOIN tbl_payments p1 ON p1.enrollment_id = e.id
                        WHERE c.created_by_type = 'admin'
                    UNION ALL

                    -- 2 CheatSheet purchases
                    SELECT ucs.user_id, ucs.payment_id
                    FROM tbl_user_cheat_sheets ucs
                    JOIN tbl_cheat_sheets ch ON ucs.cheatsheet_id = ch.id
                        WHERE ch.created_by_type = 'admin'
                    UNION ALL

                    -- 3 Tier / Course generation purchases
                    SELECT cgp.user_id, cgp.payment_id
                    FROM tbl_course_generation_payments cgp

                    UNION ALL

                    -- 4 Contest payments
                    SELECT ce.user_id, p2.id AS payment_id
                    FROM tbl_user_contest_enrollments ce
                    JOIN tbl_payments p2 ON p2.contest_id = ce.contest_id
                ) up ON up.payment_id = p.id
                JOIN tbl_users u ON u.id = up.user_id
                WHERE p.status = 'completed'
                GROUP BY u.id, u.full_name, u.email
                ORDER BY total_revenue DESC;
            END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCustomerLifetimeValueByPartners`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCustomerLifetimeValueByPartners()
            BEGIN
                SELECT 
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    SUM(p.amount) AS total_revenue
                FROM tbl_payments p
                JOIN (
                    -- 1 Enrollment purchases
                    SELECT e.user_id, p1.id AS payment_id
                    FROM tbl_enrollments e
                    JOIN tbl_courses c ON e.course_id = c.id
                    JOIN tbl_payments p1 ON p1.enrollment_id = e.id
                        WHERE c.created_by_type = 'partner'
                    UNION ALL

                    -- 2 CheatSheet purchases
                    SELECT ucs.user_id, ucs.payment_id
                    FROM tbl_user_cheat_sheets ucs
                    JOIN tbl_cheat_sheets ch ON ucs.cheatsheet_id = ch.id
                        WHERE ch.created_by_type = 'partner'
                ) up ON up.payment_id = p.id
                JOIN tbl_users u ON u.id = up.user_id
                WHERE p.status = 'completed'
                GROUP BY u.id, u.full_name, u.email
                ORDER BY total_revenue DESC;
            END`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getCustomerLifetimeValueForPartner`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getCustomerLifetimeValueForPartner(IN userId INT)
            BEGIN

                SELECT 
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    SUM(p.amount) AS total_revenue
                FROM tbl_payments p
                JOIN (
                    -- 1 Enrollment purchases
                    SELECT e.user_id, p1.id AS payment_id
                    FROM tbl_enrollments e
                    JOIN tbl_courses c ON e.course_id = c.id
                    JOIN tbl_payments p1 ON p1.enrollment_id = e.id
                        WHERE c.created_by_type = 'partner' AND c.created_by = userId

                    UNION ALL

                    -- 2 CheatSheet purchases
                    SELECT ucs.user_id, ucs.payment_id
                    FROM tbl_user_cheat_sheets ucs
                    JOIN tbl_cheat_sheets ch ON ucs.cheatsheet_id = ch.id
                        WHERE ch.created_by_type = 'partner' AND ch.createdBy = userId
                ) up ON up.payment_id = p.id
                JOIN tbl_users u ON u.id = up.user_id
                WHERE p.status = 'completed'
                GROUP BY u.id, u.full_name, u.email
                ORDER BY total_revenue DESC;
            END`);

        // today
        await sequelize.query(`DROP PROCEDURE IF EXISTS getTodaysRevenue`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTodaysRevenue()
BEGIN
    SELECT
        hour,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_course_generation_payments cgp ON cgp.payment_id = p.id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_contest_enrollments ce ON ce.contest_id = p.contest_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()
    ) AS combined_revenue
    GROUP BY hour
    ORDER BY hour;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getTodaysRevenueByAdmin`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTodaysRevenueByAdmin()
BEGIN
    SELECT
        hour,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()
          AND c.created_by_type = 'admin'

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_course_generation_payments cgp ON cgp.payment_id = p.id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_contest_enrollments ce ON ce.contest_id = p.contest_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()
          AND cs.created_by_type = 'admin'
    ) AS combined_revenue
    GROUP BY hour
    ORDER BY hour;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getTodaysRevenueByPartners`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTodaysRevenueByPartners()
BEGIN
    SELECT
        hour,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()
          AND c.created_by_type = 'partner'

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()
          AND cs.created_by_type = 'partner'
    ) AS combined_revenue
    GROUP BY hour
    ORDER BY hour;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getTodaysRevenueForPartner`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getTodaysRevenueForPartner(IN userId INT)
BEGIN
    SELECT
        hour,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()
          AND c.created_by = userId
          AND c.created_by_type = 'partner'

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%H:%i') AS hour,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND DATE(p.transaction_date) = CURDATE()
          AND cs.createdBy = userId
          AND cs.created_by_type = 'partner'
    ) AS combined_revenue
    GROUP BY hour
    ORDER BY hour;
END;`);


        // this week
        await sequelize.query(`DROP PROCEDURE IF EXISTS getThisWeeksRevenue`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getThisWeeksRevenue()
BEGIN
    SELECT
        day,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_course_generation_payments cgp ON cgp.payment_id = p.id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_contest_enrollments ce ON ce.contest_id = p.contest_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)
    ) AS combined_revenue
    GROUP BY day
    ORDER BY FIELD(
        day,
        'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday', 'Sunday'
    );
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getThisWeeksRevenueByAdmin`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getThisWeeksRevenueByAdmin()
BEGIN
    SELECT
        day,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)
          AND c.created_by_type = 'admin'

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_course_generation_payments cgp ON cgp.payment_id = p.id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_contest_enrollments ce ON ce.contest_id = p.contest_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)
          AND cs.created_by_type = 'admin'
    ) AS combined_revenue
    GROUP BY day
    ORDER BY FIELD(
        day,
        'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday', 'Sunday'
    );
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getThisWeeksRevenueByPartners`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getThisWeeksRevenueByPartners()
BEGIN
    SELECT
        day,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)
          AND c.created_by_type = 'partner'

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)
          AND cs.created_by_type = 'partner'
    ) AS combined_revenue
    GROUP BY day
    ORDER BY FIELD(
        day,
        'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday', 'Sunday'
    );
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getThisWeeksRevenueForPartner`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getThisWeeksRevenueForPartner(IN userId INT)
BEGIN
    SELECT
        day,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)
          AND c.created_by = userId
          AND c.created_by_type = 'partner'

        UNION ALL

        SELECT
            DATE_FORMAT(p.transaction_date, '%W') AS day,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND YEARWEEK(p.transaction_date, 1) = YEARWEEK(CURDATE(), 1)
          AND cs.createdBy = userId
          AND cs.created_by_type = 'partner'
    ) AS combined_revenue
    GROUP BY day
    ORDER BY FIELD(
        day,
        'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday', 'Sunday'
    );
END;`);


        // selected month
        await sequelize.query(`DROP PROCEDURE IF EXISTS getMonthlyRevenue`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getMonthlyRevenue(IN selectedMonth VARCHAR(10))
            BEGIN
    SELECT
        day_no AS date,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth

        UNION ALL

        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_course_generation_payments cgp ON cgp.payment_id = p.id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth

        UNION ALL

        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_contest_enrollments ce ON ce.contest_id = p.contest_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth

        UNION ALL

        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth
    ) AS combined_revenue
    GROUP BY day_no
    ORDER BY day_no;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getMonthlyRevenueByAdmin`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getMonthlyRevenueByAdmin(IN selectedMonth VARCHAR(10))
BEGIN
    SELECT
        day_no AS date,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth
          AND c.created_by_type = 'admin'

        UNION ALL

        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_course_generation_payments cgp ON cgp.payment_id = p.id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth

        UNION ALL

        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_contest_enrollments ce ON ce.contest_id = p.contest_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth

        UNION ALL

        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth
          AND cs.created_by_type = 'admin'
    ) AS combined_revenue
    GROUP BY day_no
    ORDER BY day_no;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getMonthlyRevenueByPartners`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getMonthlyRevenueByPartners(
    IN selectedMonth VARCHAR(10)
)
BEGIN
    SELECT
        day_no AS date,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth
          AND c.created_by_type = 'partner'

        UNION ALL

        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth
          AND cs.created_by_type = 'partner'
    ) AS combined_revenue
    GROUP BY day_no
    ORDER BY day_no;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getMonthlyRevenueForPartner`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getMonthlyRevenueForPartner(
    IN selectedMonth VARCHAR(10), IN userId INT
)
BEGIN
    SELECT
        day_no AS date,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth
          AND c.created_by = userId
          AND c.created_by_type = 'partner'

        UNION ALL

        SELECT
            DAY(p.transaction_date) AS day_no,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND MONTHNAME(p.transaction_date) = selectedMonth
          AND cs.createdBy = userId
          AND cs.created_by_type = 'partner'
    ) AS combined_revenue
    GROUP BY day_no
    ORDER BY day_no;
END;`);


        // selected year
        await sequelize.query(`DROP PROCEDURE IF EXISTS getYearlyRevenue`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getYearlyRevenue(IN selectedYear INT)
BEGIN
    SELECT
        month,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear

        UNION ALL

        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_course_generation_payments cgp ON cgp.payment_id = p.id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear

        UNION ALL

        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_contest_enrollments ce ON ce.contest_id = p.contest_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear

        UNION ALL

        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear
    ) AS combined_revenue
    GROUP BY month, month_no
    ORDER BY month_no;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getYearlyRevenueForAdmin`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getYearlyRevenueForAdmin(IN selectedYear INT)
BEGIN
    SELECT
        month,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear
          AND c.created_by_type = 'admin'

        UNION ALL

        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_course_generation_payments cgp ON cgp.payment_id = p.id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear

        UNION ALL

        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_contest_enrollments ce ON ce.contest_id = p.contest_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear

        UNION ALL

        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear
          AND cs.created_by_type = 'admin'
    ) AS combined_revenue
    GROUP BY month, month_no
    ORDER BY month_no;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getYearlyRevenueByPartners`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getYearlyRevenueByPartners(IN selectedYear INT)
BEGIN
    SELECT
        month,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear
          AND c.created_by_type = 'partner'

        UNION ALL

        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear
          AND cs.created_by_type = 'partner'
    ) AS combined_revenue
    GROUP BY month, month_no
    ORDER BY month_no;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getYearlyRevenueForPartner`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getYearlyRevenueForPartner(
    IN selectedYear INT,
    IN userId INT
)
BEGIN
    SELECT
        month,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear
          AND c.created_by = userId
          AND c.created_by_type = 'partner'

        UNION ALL

        SELECT
            MONTH(p.transaction_date) AS month_no,
            MONTHNAME(p.transaction_date) AS month,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND YEAR(p.transaction_date) = selectedYear
          AND cs.createdBy = userId
          AND cs.created_by_type = 'partner'
    ) AS combined_revenue
    GROUP BY month, month_no
    ORDER BY month_no;
END;`);


        // overall
        await sequelize.query(`DROP PROCEDURE IF EXISTS getOverallRevenue`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getOverallRevenue()
            BEGIN
                SELECT
                    YEAR(p.transaction_date) AS year,
                    ROUND(SUM(p.amount), 2) AS revenue
                FROM tbl_payments p
                WHERE p.status = 'completed'
                GROUP BY YEAR(p.transaction_date)
                ORDER BY YEAR(p.transaction_date);
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getOverallRevenueByAdmin`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getOverallRevenueByAdmin()
BEGIN
    SELECT
        year,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            YEAR(p.transaction_date) AS year,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND c.created_by_type = 'admin'

        UNION ALL

        SELECT
            YEAR(p.transaction_date) AS year,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_course_generation_payments cgp ON cgp.payment_id = p.id
        WHERE p.status = 'completed'

        UNION ALL

        SELECT
            YEAR(p.transaction_date) AS year,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_contest_enrollments ce ON ce.contest_id = p.contest_id
        WHERE p.status = 'completed'

        UNION ALL

        SELECT
            YEAR(p.transaction_date) AS year,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND cs.created_by_type = 'admin'
    ) AS combined_revenue
    GROUP BY year
    ORDER BY year;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getOverallRevenueByPartners`)
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getOverallRevenueByPartners()
BEGIN
    SELECT
        year,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            YEAR(p.transaction_date) AS year,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND c.created_by_type = 'partner'

        UNION ALL

        SELECT
            YEAR(p.transaction_date) AS year,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND cs.created_by_type = 'partner'
    ) AS combined_revenue
    GROUP BY year
    ORDER BY year;
END;`);

        await sequelize.query(`DROP PROCEDURE IF EXISTS getOverallRevenueForPartner`);
        await sequelize.query(`CREATE PROCEDURE IF NOT EXISTS getOverallRevenueForPartner(IN userId INT)
BEGIN
    SELECT
        year,
        ROUND(SUM(revenue), 2) AS revenue
    FROM (
        SELECT
            YEAR(p.transaction_date) AS year,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_enrollments e ON e.id = p.enrollment_id
        INNER JOIN tbl_courses c ON c.id = e.course_id
        WHERE p.status = 'completed'
          AND c.created_by_type = 'partner'
          AND c.created_by = userId

        UNION ALL

        SELECT
            YEAR(p.transaction_date) AS year,
            p.amount AS revenue
        FROM tbl_payments p
        INNER JOIN tbl_user_cheat_sheets ucs ON ucs.payment_id = p.id
        INNER JOIN tbl_cheat_sheets cs ON cs.id = ucs.cheatsheet_id
        WHERE p.status = 'completed'
          AND cs.created_by_type = 'partner'
          AND cs.createdBy = userId
    ) AS combined_revenue
    GROUP BY year
    ORDER BY year;
END;`);

        console.log("✅ RevenueAndFinancialAnalytics procedures created!");
    } catch (error) {
        console.error("❌ Error setting up RevenueAndFinancialAnalytics procedures:", error);
        throw error;
    }
};

module.exports = setupRevenueAndFinancialAnalytics;