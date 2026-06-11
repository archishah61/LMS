const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const PromoCode = require("./promocode");

const Batch = sequelize.define(
    "Batch",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        batch_number: {
            type: DataTypes.STRING(6), // Important: store as STRING so 000001 stays as 000001
            allowNull: false,
            unique: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        updated_by: {
            type: DataTypes.INTEGER,
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
        }
    },
    {
        tableName: "tbl_batches",  // FIXED
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Batch;
