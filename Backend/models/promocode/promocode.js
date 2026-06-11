const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust the path to your Sequelize instance
const Batch = require("./batch");

const PromoCode = sequelize.define(
    "PromoCode",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_batches", // Adjust if your table name is different
                key: "id",
            },
            onDelete: "CASCADE",
        },
        course_ids: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "tbl_users", // Adjust if your table name is different
                key: "id",
            },
            onDelete: "SET NULL",
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_users", // Adjust if your table name is different
                key: "id",
            },
            onDelete: "CASCADE",
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "tbl_users", // Adjust if your table name is different
                key: "id",
            },
            onDelete: "SET NULL",
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: true,
            defaultValue: "admin",
        },
    },
    {
        tableName: "tbl_promo_codes",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

Batch.hasMany(PromoCode, {
    foreignKey: "batch_id",
    as: "promoCodes",
});

PromoCode.belongsTo(Batch, {
    foreignKey: "batch_id",
    as: "batch",
});

module.exports = PromoCode;


