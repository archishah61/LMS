const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // Adjust the path to your Sequelize configuration
const { Accordion } = require('../content_management/accordian');
const { MultiSlide } = require('../content_management/multi_slide');

const ProgressTracking = sequelize.define(
  "ProgressTracking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "tbl_users",
        key: "id",
      },
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_courses",
        key: "id",
      },
    },
    session_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "tbl_session",
        key: "id",
      },
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_modules",
        key: "id",
      },
    },
    topic_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_topics",
        key: "id",
      },
    },
    accordian_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_accordions",
        key: "id",
      },
      onDelete: "CASCADE", // To Keep Entry on Accordian Delete -> "NO ACTION",
    },
    slide_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_multi_slides",
        key: "id",
      },
      onDelete: "CASCADE", // To Keep Entry on Slide Delete -> "NO ACTION",
    },
    completion_status: {
      type: DataTypes.ENUM("not_started", "in_progress", "completed"),
      allowNull: true,
      defaultValue: "not_started",
    },
    topic_timer_time_spent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    student_time_spent: {
      type: DataTypes.INTEGER, // in seconds (more precise than minutes)
      allowNull: false,
      defaultValue: 0,
      comment: 'Total time in seconds the student has spent on this topic',
    },
    first_completion_time_spent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Time in seconds spent during first completion cycle (required duration + optional extra duration)',
    },
    color_dot: {
      type: DataTypes.ENUM('red', 'blue', 'yellow'),
      allowNull: false,
      defaultValue: 'red',
      comment: 'Derived from first_completion_time_spent against required duration',
    },
    first_completion_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'When true, first_completion_time_spent will not change anymore',
    },
    revision_count: {
      // ✅ New field to track how many times the student has revised the topic
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of times the student has revised this topic',
    },
    completed_at: {
      type: DataTypes.DATE,
    },
    created_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: "tbl_users", // Assuming the table name is 'admins'
        key: "id",
      },
    },
    updated_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: "tbl_users", // Assuming the table name is 'admins'
        key: "id",
      },
    },
  },
  {
    tableName: "tbl_progress_tracking",
    timestamps: true, // Set to true if you want Sequelize to manage created_at/updated_at automatically
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Accordion -> ProgressTracking
Accordion.hasMany(ProgressTracking, {
  foreignKey: 'accordian_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

ProgressTracking.belongsTo(Accordion, {
  foreignKey: 'accordian_id',
});

// MultiSlide -> ProgressTracking
MultiSlide.hasMany(ProgressTracking, {
  foreignKey: 'slide_id',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

ProgressTracking.belongsTo(MultiSlide, {
  foreignKey: 'slide_id',
});

module.exports = ProgressTracking;