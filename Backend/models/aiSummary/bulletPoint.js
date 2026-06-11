const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const Summary = require("./summary");

const BulletPoint = sequelize.define(
  "BulletPoint",
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
    bullet_point: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_bullet_points",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

Summary.hasMany(BulletPoint, {
  foreignKey: "summary_id",
  as: "bullet_points", // match controller usage
  onDelete: "CASCADE"
});

BulletPoint.belongsTo(Summary, {
  foreignKey: "summary_id",
  as: "summary"
});


module.exports = BulletPoint;
