const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const ChallengeCategory = require("../../masters/challengeCategory");

const Challenge = sequelize.define("Challenge", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
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
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        allowNull: false
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_challenge_categories',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    reward_points: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    rules: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'tbl_challenges',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

Challenge.belongsTo(ChallengeCategory, {
    foreignKey: "category_id",
});

ChallengeCategory.hasMany(Challenge, {
    foreignKey: "category_id",
});

module.exports = Challenge;
