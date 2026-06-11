const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db.js');
const Module = require('./module.js');
const Topic = require('./topic.js');
const Assignment = require('../content_management/assignmentsModel.js');
const { Quizzes } = require('../content_management/quizzesModel.js');

const TopicContent = sequelize.define(
  "TopicContent",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_modules",
        key: "id",
      },
    },
    topic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_topics",
        key: "id",
      },
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_assignments",
        key: "id",
      },
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_quiz",
        key: "id",
      },
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_topic_content",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Define associations
Module.hasMany(TopicContent, { foreignKey: 'module_id' });
TopicContent.belongsTo(Module, { foreignKey: 'module_id' });

Topic.hasMany(TopicContent, { foreignKey: 'topic_id' });
TopicContent.belongsTo(Topic, { foreignKey: 'topic_id' });

Assignment.hasMany(TopicContent, { foreignKey: 'assignment_id' });
TopicContent.belongsTo(Assignment, { foreignKey: 'assignment_id' });

Quizzes.hasMany(TopicContent, { foreignKey: 'quiz_id' });
TopicContent.belongsTo(Quizzes, { foreignKey: 'quiz_id' });

module.exports = TopicContent;