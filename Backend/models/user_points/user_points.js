const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.js'); // Adjust the path as necessary
const User = require('../auth/user');

const UserPoints = sequelize.define('UserPoints', {
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
        allowNull: false,
        defaultValue: 0
    },
    total_earned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    total_spent: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tbl_user_points',
    timestamps: true,
    createdAt: false, // No created_at column needed
    updatedAt: 'last_updated' // This will track the latest update timestamp
});


UserPoints.belongsTo(User, {
    foreignKey: 'user_id',
});

User.hasOne(UserPoints, {
    foreignKey: 'user_id',
});

module.exports = UserPoints;