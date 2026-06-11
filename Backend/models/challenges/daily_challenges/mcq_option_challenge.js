const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db.js");
const MCQChallenge = require("./mcq_challenge.js");

const MCQOptionChallenge = sequelize.define(
  "MCQOptionChallenge",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    mcq_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_mcq_challenge",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    option_text: {
      type: DataTypes.STRING, // Stores text or image path
      allowNull: false,
    },
    option_type: {
      type: DataTypes.ENUM("text", "image"), // Indicates whether option_text is a text or image
      allowNull: false,
      defaultValue: "text",
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    tableName: "tbl_mcq_option_challenge",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

MCQOptionChallenge.belongsTo(MCQChallenge, {
  foreignKey: 'mcq_id',
});

MCQChallenge.hasMany(MCQOptionChallenge, {
  foreignKey: 'mcq_id',
});

module.exports = MCQOptionChallenge;
