const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const User = require('../../auth/user');
const Challenge = require("../challenge_quest/challenges");

const UserChallenge = sequelize.define("UserChallenge", {
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
    challenge_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_challenges",
            key: "id"
        },
        onDelete: "CASCADE"
    },
    is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    points_earned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM("pending", "in_progress", "completed", "failed"),
        defaultValue: "pending"
    },
    progress_percentage: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    }
}, {
    tableName: "tbl_user_challenge",
    timestamps: true,
    createdAt: "assigned_at",
    updatedAt: false
});

// Associations
UserChallenge.belongsTo(User, { foreignKey: "user_id" });
UserChallenge.belongsTo(Challenge, { foreignKey: "challenge_id" });

User.hasMany(UserChallenge, { foreignKey: "user_id" });
Challenge.hasMany(UserChallenge, { foreignKey: "challenge_id" });

module.exports = UserChallenge;
