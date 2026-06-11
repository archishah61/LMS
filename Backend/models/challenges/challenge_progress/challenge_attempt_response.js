// models/quiz-attempt.js
const { DataTypes, Op } = require("sequelize");
const sequelize = require("../../../config/db"); // Adjust path as needed
const UserDailyChallenge = require("../daily_challenges/user_daily_challenges"); // Adjust path as needed
const UserChallengeTask = require("./user_challenge_tasks"); // Adjust path as needed

const ChallengeAttemptResponse = sequelize.define("ChallengeAttemptResponse", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_challenge_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Can be null if it's a challenge task quiz
        references: {
            model: 'tbl_user_daily_challenge',
            key: 'id'
        },
        onDelete: "CASCADE"
    },
    user_challenge_task_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Can be null if it's a daily challenge quiz
        references: {
            model: 'tbl_user_challenge_tasks',
            key: 'id'
        },
        onDelete: "CASCADE"
    },
    attempt_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    total_questions: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    total_correct: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    total_reward_points: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    time_used_seconds: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    is_passed: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    results_details: {
        type: DataTypes.TEXT, // Store as JSON string
        allowNull: false,
        get() {
            const rawValue = this.getDataValue('results_details');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('results_details', JSON.stringify(value));
        }
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tbl_challenge_response',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['user_challenge_id', 'attempt_number'],
            where: {
                user_challenge_id: {
                    [Op.ne]: null // Apply unique constraint only if user_challenge_id is not null
                }
            }
        },
        {
            unique: true,
            fields: ['user_challenge_task_id', 'attempt_number'],
            where: {
                user_challenge_task_id: {
                    [Op.ne]: null // Apply unique constraint only if user_challenge_task_id is not null
                }
            }
        }
    ],
    validate: {
        oneChallengeType() {
            if ((this.user_challenge_id === null && this.user_challenge_task_id === null) ||
                (this.user_challenge_id !== null && this.user_challenge_task_id !== null)) {
                throw new Error('Either user_challenge_id or user_challenge_task_id must be set, but not both.');
            }
        }
    }
});

// Define Relations
UserDailyChallenge.hasMany(ChallengeAttemptResponse, { foreignKey: "user_challenge_id", onDelete: "CASCADE" });
ChallengeAttemptResponse.belongsTo(UserDailyChallenge, { foreignKey: "user_challenge_id" });

UserChallengeTask.hasMany(ChallengeAttemptResponse, { foreignKey: "user_challenge_task_id", onDelete: "CASCADE" });
ChallengeAttemptResponse.belongsTo(UserChallengeTask, { foreignKey: "user_challenge_task_id" });

module.exports = ChallengeAttemptResponse;