const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // Adjust the path
const User = require('../auth/user');

const Review = sequelize.define(
    "Review",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_courses", // Reference Course table
                key: "id",
            },
            onDelete: "CASCADE",
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_users", // Reference User table
                key: "id",
            },
            onDelete: "CASCADE",
        },
        review: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        created_by: {
            type: DataTypes.INTEGER, // References tbl_users
            allowNull: false,
            references: {
                model: "tbl_users",
                key: "id",
            },
        },
        updated_by: {
            type: DataTypes.INTEGER, // References tbl_users
            allowNull: false,
            references: {
                model: "tbl_users",
                key: "id",
            },
        },
    },
    {
        tableName: "tbl_reviews",
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

// Define association: A Review belongs to a User
Review.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Now, User has many Reviews (Optional, if needed elsewhere)
User.hasMany(Review, { foreignKey: "user_id", as: "reviews" });

module.exports = Review;
