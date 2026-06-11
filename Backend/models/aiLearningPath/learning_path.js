const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('../auth/user');

const LearningPath = sequelize.define('LearningPath', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_users",
            key: "id"
        },
        onDelete: "CASCADE"
    },

    goal: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    status: {
        type: DataTypes.ENUM('initialized', 'in_progress', 'completed', 'failed'),
        defaultValue: 'initialized'
    },

    current_step: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },

    // 🔹 Step 1 Output
    goal_analysis: {
        type: DataTypes.JSON,
        allowNull: true
    },

    // 🔹 All Questions (Step 1 + Step 2)
    questions: {
        type: DataTypes.JSON,
        allowNull: true
    },

    // 🔹 Step 2 Output
    preliminary_insights: {
        type: DataTypes.JSON,
        allowNull: true
    },

    // 🔹 Final Output
    roadmap_pdf_url: {
        type: DataTypes.STRING,
        allowNull: true
    },

    started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },

    completed_at: {
        type: DataTypes.DATE
    }

}, {
    tableName: 'tbl_learning_paths',
    timestamps: true
});

LearningPath.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(LearningPath, { foreignKey: "user_id" });

module.exports = LearningPath;
