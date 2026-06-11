const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const UserChallengePhase = require("./user_challenge_phases");
const ChallengeTask = require("../challenge_quest/challenge_tasks");

const UserChallengeTask = sequelize.define("UserChallengeTask", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_challenge_phase_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_user_challenge_phases',
            key: 'id'
        },
        onDelete: "CASCADE",
    },
    challenge_task_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_challenge_tasks',
            key: 'id'
        },
        onDelete: "CASCADE",
    },
    is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    revive_attempt_at: {
        type: DataTypes.DATE, // Exact timestamp when attempts are revived
        allowNull: true,
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // Number of attempts taken by the user
    },
    points_earned: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // Points earned for this task
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true, // Stores when the user completed the task
    },
    progress_percentage: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'tbl_user_challenge_tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define Relations
UserChallengePhase.hasMany(UserChallengeTask, { foreignKey: "user_challenge_phase_id", onDelete: "CASCADE" });
ChallengeTask.hasMany(UserChallengeTask, { foreignKey: "challenge_task_id", onDelete: "CASCADE" });
UserChallengeTask.belongsTo(UserChallengePhase, { foreignKey: "user_challenge_phase_id" });
UserChallengeTask.belongsTo(ChallengeTask, { foreignKey: "challenge_task_id" });

module.exports = UserChallengeTask;
