const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // Adjust the path to your Sequelize configuration

const StudentStatusHistory = sequelize.define('student_status_history', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_users', // Reference to the students table
            key: 'id',
        },
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    changed_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_admin', // Reference to the admins table
            key: 'id',
        },
    },
    valid_from: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    valid_until: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER, // admin.id
        allowNull: false,
        references: {
            model: 'tbl_admin', // Assuming the table name is 'admins'
            key: 'id',
        },
    },
    updated_by: {
        type: DataTypes.INTEGER, // admin.id
        allowNull: false,
        references: {
            model: 'tbl_admin', // Assuming the table name is 'admins'
            key: 'id',
        },
    },
}, {
    tableName: 'tbl_student_status_history',
    timestamps: true, // Disable created_at and updated_at timestamps
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = StudentStatusHistory;