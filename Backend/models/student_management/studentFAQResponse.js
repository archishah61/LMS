const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const Course = require("../course_management/course"); // Import Course model
const CourseFAQ = require("../course_management/courseFAQs"); // Import CourseFAQ model
const CourseFAQOption = require("./../course_management/courseFAQOption"); // Import FAQ options model
const User = require("../auth/user"); // Import User model (assuming enrolled students are stored here)

const StudentFAQResponse = sequelize.define(
    "StudentFAQResponse",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_users", // Reference to Users table
                key: "id",
            },
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_courses", // Reference to Courses table
                key: "id",
            },
        },
        faq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_course_faqs", // Reference to CourseFAQ table
                key: "id",
            },
        },
        selected_option_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // User might not select an option immediately
            references: {
                model: "tbl_course_faq_options", // Reference to options table
                key: "id",
            },
        },
        created_by: {
            type: DataTypes.INTEGER, // ID of the user who answered
            allowNull: false,
            references: {
                model: "tbl_users", // Reference to Users table
                key: "id",
            },
        },
        updated_by: {
            type: DataTypes.INTEGER, // ID of the user/admin updating the response
            allowNull: true,
            references: {
                model: "tbl_users", // Reference to Users table
                key: "id",
            },
        },
    },
    {
        tableName: "tbl_student_faq_responses",
        timestamps: true, // Enables created_at & updated_at fields
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

// Define Relationships
StudentFAQResponse.belongsTo(User, { foreignKey: "user_id", as: "user" });
StudentFAQResponse.belongsTo(Course, { foreignKey: "course_id", as: "course" });
StudentFAQResponse.belongsTo(CourseFAQ, { foreignKey: "faq_id", as: "faq" });
StudentFAQResponse.belongsTo(CourseFAQOption, { foreignKey: "selected_option_id", as: "selectedOption" });

User.hasMany(StudentFAQResponse, { foreignKey: "user_id", as: "faqResponses" });
Course.hasMany(StudentFAQResponse, { foreignKey: "course_id", as: "faqResponses" });
CourseFAQ.hasMany(StudentFAQResponse, { foreignKey: "faq_id", as: "responses" });
CourseFAQOption.hasMany(StudentFAQResponse, { foreignKey: "selected_option_id", as: "optionResponses" });

module.exports = StudentFAQResponse;
