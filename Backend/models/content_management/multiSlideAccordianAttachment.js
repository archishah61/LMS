const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust path as needed
const { MultiSlideAccordion } = require("./multiSlideAccordian");

const MultiSlideAccordionAttachment = sequelize.define(
    "MultiSlideAccordionAttachment",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        accordionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_multislide_accordions",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fileType: {
            type: DataTypes.ENUM("video", "audio", "document" , "youtube"),
            allowNull: true,
        },
    },
    {
        tableName: "tbl_multislide_accordion_attachments",
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

MultiSlideAccordion.hasMany(MultiSlideAccordionAttachment, {
    foreignKey: "accordionId",
    onDelete: "CASCADE",
});
MultiSlideAccordionAttachment.belongsTo(MultiSlideAccordion, { foreignKey: "accordionId" });

module.exports = { MultiSlideAccordionAttachment };
