const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require('../auth/user');

const UserStreak = sequelize.define("UserStreak", {
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
    current_streak: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    longest_streak: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    last_completed_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    missed_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: "tbl_user_streaks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

UserStreak.belongsTo(User, { foreignKey: "user_id" });
User.hasOne(UserStreak, { foreignKey: "user_id" });

module.exports = UserStreak;
