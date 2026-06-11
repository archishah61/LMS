const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust path as needed
const { Accordion } = require("./accordian");

const AccordionAttachment = sequelize.define(
  "AccordionAttachment",
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
        model: "tbl_accordions",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.ENUM("video", "audio", "document", "youtube"),
      allowNull: true,
    },
  },
  {
    tableName: "tbl_accordion_attachments",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ["accordionId", "fileType"],
      },
    ],
  }
);

Accordion.hasMany(AccordionAttachment, {
  foreignKey: "accordionId",
  onDelete: "CASCADE",
});
AccordionAttachment.belongsTo(Accordion, { foreignKey: "accordionId" });

module.exports = { AccordionAttachment };
