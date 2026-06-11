const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const Admin = require("../../auth/admin");
const Contest = require("./contest");

const ContestActivity = sequelize.define("ContestActivity", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    contest_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tbl_contests", key: "id" },
        onDelete: "CASCADE"
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
        type: DataTypes.ENUM("quiz", "coding", "escape_room"),
        allowNull: false,
    },
    difficulty: {
        type: DataTypes.ENUM("easy", "medium", "hard", "expert"),
        allowNull: false,
    },
    points_reward: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
    tableName: "tbl_contest_activities",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

// Associations
ContestActivity.belongsTo(Contest, {
    foreignKey: "contest_id",
});

Contest.hasMany(ContestActivity, {
    foreignKey: "contest_id",
});

ContestActivity.belongsTo(Admin, {
    foreignKey: "created_by",
});

ContestActivity.belongsTo(Admin, {
    foreignKey: "updated_by",
});

module.exports = ContestActivity;
