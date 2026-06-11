const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust the path

const Wishlist = sequelize.define(
    "Wishlist",
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
        created_by: {
            type: DataTypes.INTEGER, // References tbl_users
            allowNull: false
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
        updated_by: {
            type: DataTypes.INTEGER, // References tbl_users
            allowNull: false
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
    },
    {
        tableName: "tbl_wishlist",
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

module.exports = Wishlist;
