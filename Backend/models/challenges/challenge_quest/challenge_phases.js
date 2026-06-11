const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const Challenge = require("./challenges"); // Import Challenge model

const ChallengePhase = sequelize.define("ChallengePhase", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    challenge_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_challenges',
            key: 'id'
        },
        onDelete: "CASCADE",
    },
    phase_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    tasks_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    bonus_reward: {
        type: DataTypes.INTEGER, // Extra reward if completed successfully
        allowNull: true,
    },
    phase_type: {
        type: DataTypes.ENUM('Easy', 'Moderate', 'Hard'),
        allowNull: false,
        defaultValue: 'Moderate',
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'tbl_challenge_phases',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Define Relation (A Challenge has many Phases)
Challenge.hasMany(ChallengePhase, { foreignKey: "challenge_id", onDelete: "CASCADE" });
ChallengePhase.belongsTo(Challenge, { foreignKey: "challenge_id" });

module.exports = ChallengePhase;
