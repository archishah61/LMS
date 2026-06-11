const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const ChallengePhase = require("./challenge_phases");

const ChallengeTask = sequelize.define("ChallengeTask", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    challenge_phase_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_challenge_phases',
            key: 'id'
        },
        onDelete: "CASCADE",
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    difficulty_level: {
        type: DataTypes.ENUM('Easy', 'Moderate', 'Hard'),
        allowNull: false,
        defaultValue: 'Moderate',
    },
    order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // Helps in ordering tasks
    },
    is_mandatory: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // By default, all tasks must be completed
    },
    revive_attempt_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    max_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3, // Limit retry attempts per task
    },
    reward_points: {
        type: DataTypes.INTEGER,
        allowNull: true, // Points user earns upon task completion
    },
    is_warning: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    no_of_warning: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    time_limit: {
        type: DataTypes.INTEGER, // Time in minutes (if required)
        allowNull: true,
    },
    qualify_percentage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 70,
    },
    show_answer: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'tbl_challenge_tasks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define Relation (A ChallengePhase has many Tasks)
ChallengePhase.hasMany(ChallengeTask, { foreignKey: "challenge_phase_id", onDelete: "CASCADE" });
ChallengeTask.belongsTo(ChallengePhase, { foreignKey: "challenge_phase_id" });

module.exports = ChallengeTask;
