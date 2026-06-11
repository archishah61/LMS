const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('../auth/user');

const UserPointTransaction = sequelize.define('UserPointTransaction', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    points: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('earn', 'spend'),
        allowNull: false
    },
    source: {
        type: DataTypes.STRING, // e.g., 'quiz_reward', 'referral_bonus', 'purchase', 'admin_adjustment'
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT, // Explain why user earned/spent points
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tbl_user_point_transactions',
    timestamps: false
});

UserPointTransaction.belongsTo(User, {
    foreignKey: 'user_id'
});

User.hasMany(UserPointTransaction, {
    foreignKey: 'user_id'
});

module.exports = UserPointTransaction;
