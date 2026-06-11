const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const ExceptionLog = sequelize.define("ExceptionLog", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    error_status_code: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    exception_type: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    exception_msg: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    exception_trace: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    exception_source: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    web_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status_flag: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        default: true
    },
    CreateUser: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    UpdateUser: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "tbl_exception_log",
    timestamps: true,
    createdAt: 'CreateDate',
    updatedAt: 'UpdateDate'
});

module.exports = ExceptionLog;
