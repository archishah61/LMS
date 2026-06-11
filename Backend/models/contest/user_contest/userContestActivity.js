const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const ContestActivity = require("../contest_content/contestActivity");
const User = require("../../auth/user");
const Contest = require("../contest_content/contest");

const UserContestActivity = sequelize.define("UserContestActivity", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tbl_users", key: "id" },
        onDelete: "CASCADE"
    },
    contest_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tbl_contests", key: "id" },
        onDelete: "CASCADE"
    },
    activity_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tbl_contest_activities", key: "id" },
        onDelete: "CASCADE"
    },
    score: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    is_winner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // time_taken_seconds: {
    //     type: DataTypes.INTEGER
    // },
    status: {
        type: DataTypes.ENUM("pending", "completed", "skipped"),
        defaultValue: "pending"
    },
    submitted_at: {
        type: DataTypes.DATE
    },
    meta: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: "tbl_user_contest_activities",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
        {
            unique: true,
            fields: ["user_id", "contest_id", "activity_id"]
        }
    ]
});

// Associations
UserContestActivity.belongsTo(User, { foreignKey: "user_id" });
UserContestActivity.belongsTo(Contest, { foreignKey: "contest_id" });
UserContestActivity.belongsTo(ContestActivity, { foreignKey: "activity_id" });

module.exports = UserContestActivity;
