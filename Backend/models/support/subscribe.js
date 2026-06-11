const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const Subscribe = sequelize.define(
    "Subscribe",
    {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        status: {
            type: DataTypes.ENUM("active", "inactive"),
            defaultValue: "active",
            allowNull: false,
        },
    },
    {
        tableName: "tbl_subscribe",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Subscribe;
