const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db'); // Adjust the path as necessary
const MainSection = require('./mainsection');

const Section = sequelize.define(
    "Section",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        contentType: {
            type: DataTypes.ENUM('text', 'image'),
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        sectionImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        mainSectionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: MainSection, // Reference the MainSection model
                key: 'id',
            },
        },
    },
    {
        tableName: "tbl_cheat_sheet_sections",
        timestamps: true, // Enables created_at & updated_at fields
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

MainSection.hasMany(Section, { foreignKey: 'mainSectionId' });
Section.belongsTo(MainSection, { foreignKey: 'mainSectionId' });

module.exports = Section;
