const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const Admin = require("../../auth/admin");

const ContestTemplate = sequelize.define("ContestTemplate", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    type: {
        type: DataTypes.ENUM("recurring", "on-demand"),
        allowNull: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    recurrence_pattern: {
        type: DataTypes.ENUM("day", "week", "month", "year"),
        allowNull: true,
    },
    recurrence_interval: {
        type: DataTypes.INTEGER, // e.g., every X days/weeks/months
        allowNull: true,
    },
    recurrence_days_of_week: {
        type: DataTypes.JSON, // e.g., ["Monday", "Wednesday"]
        allowNull: true,
    },
    banner_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_admin",
            key: "id"
        },
        onDelete: "CASCADE"
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "tbl_admin",
            key: "id"
        },
        onDelete: "SET NULL"
    }
}, {
    tableName: "tbl_contest_templates",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

// Associations

ContestTemplate.belongsTo(Admin, {
    foreignKey: "created_by",
});

ContestTemplate.belongsTo(Admin, {
    foreignKey: "updated_by",
});

module.exports = ContestTemplate;
