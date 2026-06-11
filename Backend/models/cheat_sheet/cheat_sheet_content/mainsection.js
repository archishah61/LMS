const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db'); // Adjust the path as necessary
const CheatSheet = require('../cheatsheet');

const MainSection = sequelize.define(
    "MainSection",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        cheatsheetId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: CheatSheet, // Reference the CheatSheet model
                key: 'id',
            },
        },
        mainTitle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("active", "inactive"),
            allowNull: false,
            defaultValue: "active", // Default to active
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
        updatedBy: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
    },
    {
        tableName: "tbl_cheat_sheets_main_section",
        timestamps: true, // Enables created_at & updated_at fields
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

CheatSheet.hasMany(MainSection, { foreignKey: 'cheatsheetId' });
MainSection.belongsTo(CheatSheet, { foreignKey: 'cheatsheetId' });

module.exports = MainSection;
