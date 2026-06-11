// Get Top Enrolled Courses using stored procedure
const { callProcedure } = require("../../utils/procedure/callProcedure");

// Get Top Enrolled Courses using stored procedure
exports.getTopEnrolledCourses = async (req, res) => {
    try {

        const role = req.user.role
        const userId = req.user.id


        let result;

        const { user_type, partner_id } = req.query;

        if (role == "partner") {
            result = await callProcedure("getTopEnrolledCoursesForPartner", [
                userId
            ]);
        } else {
            if (user_type == "all") {
                result = await callProcedure("getTopEnrolledCourses");
            } else if (user_type == "admin") {
                result = await callProcedure("getTopEnrolledCoursesByAdmin");
            } else if (user_type == "partner" && partner_id == "all") {
                result = await callProcedure("getTopEnrolledCoursesByPartners");
            } else if (user_type == "partner" && partner_id != "all") {
                result = await callProcedure("getTopEnrolledCoursesForPartner", [
                    partner_id
                ]);
            } else {
                result = await callProcedure("getTopEnrolledCourses");
            }
        }

        const { success, data, error } = result

        if (!success) {
            return res.status(500).json({ success: false, error });
        }

        const rows = Array.isArray(data) ? data : [];

        const formattedResults = rows.map((entry) => ({
            course_id: entry.course_id,
            title: entry.title,
            thumbnail: entry.thumbnail,
            price: entry.price,
            category_id: entry.category_id,
            enrollmentCount: parseInt(entry.enrollmentCount, 10),
        }));

        return res.status(200).json({
            success: true,
            data: formattedResults
        });
    } catch (error) {
        console.error("Error fetching top enrolled courses:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

//Get Top rated courses
exports.getTopRatedCourses = async (req, res) => {
    try {

        const role = req.user.role
        const userId = req.user.id

        let result;
        const { user_type, partner_id } = req.query;


        if (role == "partner") {
            result = await callProcedure("getTopRatedCoursesForPartner", [
                userId
            ]);
        } else {
            if (user_type == "all") {
                result = await callProcedure("getTopRatedCourses");
            } else if (user_type == "admin") {
                result = await callProcedure("getTopRatedCoursesByAdmin");
                
            } else if (user_type == "partner" && partner_id == "all") {
                result = await callProcedure("getTopRatedCoursesByPartners");
                
            } else if (user_type == "partner" && partner_id != "all") {
                result = await callProcedure("getTopRatedCoursesForPartner", [
                    partner_id
                ]);
            } else {
                result = await callProcedure("getTopRatedCourses");
            }
        }
        // Call the stored procedure to fetch top rated courses
        const { success, data, error } = result;

        if (!success) {
            return res.status(500).json({ success: false, error });
        }

        // Ensure the data is an array
        const rows = Array.isArray(data) ? data : [];

        // Format the results
        const formattedResults = rows.map((entry) => {
            const averageRating = parseFloat(entry.averageRating).toFixed(1); // Round to one decimal place
            return {
                course_id: entry.course_id,
                title: entry.title,
                thumbnail: entry.thumbnail,
                price: entry.price,
                category_id: entry.category_id,
                averageRating: parseFloat(averageRating), // Convert back to a number after rounding
                reviewCount: parseInt(entry.reviewCount, 10),
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedResults,
        });
    } catch (error) {
        console.error("Error fetching top rated courses:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

//Course categories with most enrollments
exports.getCategoriesWithMostEnrollments = async (req, res) => {
    try {

        const role = req.user.role
        const userId = req.user.id

        let result;
        const { user_type, partner_id } = req.query;


        if (role == "partner") {
            result = await callProcedure("getCategoriesWithMostEnrollmentsForPartner", [
                userId
            ]);
        } else {
            if (user_type == "all") {
                result = await callProcedure("getCategoriesWithMostEnrollments");
            } else if (user_type == "admin") {
                result = await callProcedure("getCategoriesWithMostEnrollmentsByAdmin");
                
            } else if (user_type == "partner" && partner_id == "all") {
                result = await callProcedure("getCategoriesWithMostEnrollmentsByPartners");
                
            } else if (user_type == "partner" && partner_id != "all") {
                result = await callProcedure("getCategoriesWithMostEnrollmentsForPartner", [
                    partner_id
                ]);
            } else {
                result = await callProcedure("getCategoriesWithMostEnrollments");
            }
        }
        // Call the stored procedure to fetch top rated courses
        const { success, data, error } = result;

        if (!success) {
            return res.status(500).json({ success: false, error });
        }

        const rows = Array.isArray(data) ? data : [];

        const formatted = rows.map(row => ({
            category_id: row.category_id,
            category_name: row.category_name,
            enrollmentCount: parseInt(row.enrollmentCount, 10),
        }));

        return res.status(200).json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error("Error fetching category analytics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// 🚀 Controller: Average Completion Time Per Course Analytics (Stored Procedure)
exports.getAverageTimeToCompleteCourse = async (req, res) => {
    try {

        const role = req.user.role
        const userId = req.user.id

        let result;
        const { user_type, partner_id } = req.query;


        if (role == "partner") {
            result = await callProcedure("getAverageTimeToCompleteCourseForPartner", [
                userId
            ]);
        } else {
            if (user_type == "all") {
                result = await callProcedure("getAverageTimeToCompleteCourse");
            } else if (user_type == "admin") {
                result = await callProcedure("getAverageTimeToCompleteCourseByAdmin");
                
            } else if (user_type == "partner" && partner_id == "all") {
                result = await callProcedure("getAverageTimeToCompleteCourseByPartners");
                
            } else if (user_type == "partner" && partner_id != "all") {
                result = await callProcedure("getAverageTimeToCompleteCourseForPartner", [
                    partner_id
                ]);
            } else {
                result = await callProcedure("getAverageTimeToCompleteCourse");
            }
        }
        // Call the stored procedure to fetch top rated courses
        const { success, data, error } = result;

        if (!success) {
            return res.status(500).json({ success: false, error });
        }

        const rows = Array.isArray(data) ? data : [];

        const formattedResults = rows.map((entry) => ({
            course_id: entry.course_id,
            title: entry.title,
            thumbnail: entry.thumbnail,
            averageTimeSpent: parseFloat(entry.averageTimeSpent).toFixed(2), // Round to two decimal places
            completedUsersCount: parseInt(entry.completedUsersCount, 10), // Count of completed users
        }));

        return res.status(200).json({
            success: true,
            data: formattedResults
        });
    } catch (error) {
        console.error("Error fetching average time to complete courses:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
