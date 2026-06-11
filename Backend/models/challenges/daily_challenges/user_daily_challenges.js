const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const User = require('../../auth/user');
const DailyChallenge = require("./daily_challenges");

const UserDailyChallenge = sequelize.define("UserDailyChallenge", {
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
            model: "tbl_daily_challenges",
            key: "id"
        },
        onDelete: "CASCADE"
    },
    attempts: {  // Track the number of attempts
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    }
}, {
    tableName: "tbl_user_daily_challenge",
    timestamps: true,
    createdAt: "assigned_at",
    updatedAt: false // No need to update frequently
});

// Associations
UserDailyChallenge.belongsTo(User, { foreignKey: "user_id" });
UserDailyChallenge.belongsTo(DailyChallenge, { foreignKey: "challenge_id" });

User.hasMany(UserDailyChallenge, { foreignKey: "user_id" });
DailyChallenge.hasMany(UserDailyChallenge, { foreignKey: "challenge_id" });

module.exports = UserDailyChallenge;
