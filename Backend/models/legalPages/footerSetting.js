const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const FooterSetting = sequelize.define(
    "FooterSetting",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        timing: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        headerLogo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        footerLogo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        updatedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "tbl_footer_settings",
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

module.exports = FooterSetting;
