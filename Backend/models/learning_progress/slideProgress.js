const { DataTypes } = require("sequelize");
const ProgressTracking = require("./progressTracking");
const { MultiSlide } = require("../content_management/multi_slide");
const sequelize = require("../../config/db");

const SlideProgress = sequelize.define(
  "SlideProgress",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    progress_tracking_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_progress_tracking", // your ProgressTracking table name
        key: "id",
      },
      onDelete: "CASCADE",
    },
    slide_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_multi_slides", // your MultiSlide table
        key: "id",
      },
      onDelete: "CASCADE",
    },
    time_spent: {
      type: DataTypes.INTEGER, // in seconds
      allowNull: true,
      defaultValue: 0,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "tbl_slide_progress",
    timestamps: true, // manages created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Associations (optional if used)
ProgressTracking.hasMany(SlideProgress, {
  foreignKey: "progress_tracking_id",
  onDelete: "CASCADE",
});
SlideProgress.belongsTo(ProgressTracking, {
  foreignKey: "progress_tracking_id",
});

MultiSlide.hasMany(SlideProgress, {
  foreignKey: "slide_id",
  onDelete: "CASCADE",
});
SlideProgress.belongsTo(MultiSlide, { foreignKey: "slide_id" });

module.exports = SlideProgress;
