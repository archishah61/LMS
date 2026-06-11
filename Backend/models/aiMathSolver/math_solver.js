const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // adjust path
const User = require('../auth/user');

const MathSolverLog = sequelize.define('MathSolverLog', {
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

    input_type: {
        type: DataTypes.ENUM('text', 'image'),
        defaultValue: 'text'
    },

    image_url: {
        type: DataTypes.STRING(500),
        allowNull: true
    },

    dict_of_vars: {
        type: DataTypes.JSON,
        allowNull: true
    },

    language: {
        type: DataTypes.STRING(50),
        defaultValue: 'english'
    },

    custom_prompt: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    solution: {
        type: DataTypes.JSON,
        allowNull: true
    }

}, {
    tableName: 'tbl_math_solver_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

MathSolverLog.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(MathSolverLog, { foreignKey: "user_id" });

module.exports = MathSolverLog;