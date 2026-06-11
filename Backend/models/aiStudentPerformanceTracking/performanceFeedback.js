const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('../auth/user');
const Course = require('../course_management/course');
const Module = require('../course_management/module');

const PerformanceFeedback = sequelize.define('PerformanceFeedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id'
    }
  },
  module_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Module,
      key: 'id'
    }
  },
  feedback_data: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Complete feedback data including all analysis and recommendations'
  },
  feedback_summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Short summary of the feedback'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Version number for tracking regenerated feedback'
  },
  is_current: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Flag to identify the most recent feedback version'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "tbl_performance_feedbacks",
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
PerformanceFeedback.belongsTo(User, { foreignKey: 'user_id' });
PerformanceFeedback.belongsTo(Course, { foreignKey: 'course_id' });
PerformanceFeedback.belongsTo(Module, { foreignKey: 'module_id' });

module.exports = PerformanceFeedback;
