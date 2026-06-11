const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const Summary = require("./summary");

const FlashCard = sequelize.define(
  "FlashCard",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    summary_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Summary,
        key: "id",
      },
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_flash_cards",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Summary.hasMany(FlashCard, {
  foreignKey: "summary_id",
  as: "flash_cards", // match controller usage
  onDelete: "CASCADE"
});

FlashCard.belongsTo(Summary, {
  foreignKey: "summary_id",
  as: "summary"
});

module.exports = FlashCard;
