const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const UserActivityLog = sequelize.define('UserActivityLog', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'tbl_users', key: 'id' },
    onDelete: 'CASCADE'
  },
  user_identifier: {
    type: DataTypes.STRING(191),
    allowNull: true
  },
  event_category: {
    type: DataTypes.STRING(32),
    allowNull: false
  },
  event_action: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  outcome: {
    type: DataTypes.ENUM('success', 'failure', 'n/a'),
    allowNull: false,
    defaultValue: 'n/a'
  },
  entity_type: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'none'
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  session_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(128),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  occurred_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tbl_user_activity_log',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
  // Core composite indexes retained for common filters & sorting
  { fields: ['occurred_at'] }, // global recent ordering / date range scans
  { fields: ['user_id', 'occurred_at'] }, // per-user timeline
  { fields: ['event_category', 'occurred_at'] }, // category drill-down
  // Removed lower-value / redundant indexes: event_action+occurred_at (rare direct search), outcome+occurred_at (small enum selective via category/user index), user_identifier+occurred_at (redundant with user_id), session_token (not searched), entity_type/entity_id composite (low usage for current UI)
  ]
});

module.exports = UserActivityLog;
