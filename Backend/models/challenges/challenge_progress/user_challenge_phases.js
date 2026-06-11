const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const UserChallenge = require("./user_challenge");
const ChallengePhase = require("../challenge_quest/challenge_phases");

const UserChallengePhase = sequelize.define("UserChallengePhase", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_challenge_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_user_challenge',
            key: 'id'
        },
        onDelete: "CASCADE",
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
    completed_tasks: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    points_earned: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // Points earned in this phase
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true, // Stores when the user completed the phase
    },
    is_lock: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true, // Stores when the user completed the phase
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
    tableName: 'tbl_user_challenge_phases',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define Relations
UserChallenge.hasMany(UserChallengePhase, { foreignKey: "user_challenge_id", onDelete: "CASCADE" });
ChallengePhase.hasMany(UserChallengePhase, { foreignKey: "challenge_phase_id", onDelete: "CASCADE" });
UserChallengePhase.belongsTo(UserChallenge, { foreignKey: "user_challenge_id" });
UserChallengePhase.belongsTo(ChallengePhase, { foreignKey: "challenge_phase_id" });

module.exports = UserChallengePhase;
