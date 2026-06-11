const { DataTypes } = require("sequelize");
const sequelize = require("../../../../config/db");
const ContestActivity = require("../contestActivity");

const ContestCoding = sequelize.define("ContestCoding", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  activity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "tbl_contest_activities",
      key: "id",
    },
    onDelete: "CASCADE",
  },

  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },

  points_reward: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  max_attempts: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  problem_statement: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  constraints: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  sample_inputs_outputs: {
    type: DataTypes.JSON, // [{ input: "2 3", output: "5" }]
    allowNull: true,
  },

  time_limit_seconds: {
    type: DataTypes.INTEGER, // e.g., 2 seconds
    allowNull: true,
  },

  memory_limit_mb: {
    type: DataTypes.INTEGER, // e.g., 256 MB
    allowNull: true,
  },

  difficulty_level: {
    type: DataTypes.ENUM("easy", "medium", "hard"),
    defaultValue: "easy",
  },

  is_warning: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  no_of_warning: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },

  allowed_languages: {
    type: DataTypes.JSON, // ["python", "cpp", "java"]
    allowNull: false,
    defaultValue: [],
  },

  starter_code: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
    // Example: { "python": "def solve():\n    pass", "cpp": "int main() { return 0; }" }
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "tbl_admin",
      key: "id",
    },
    onDelete: "CASCADE",
  },

  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "tbl_admin",
      key: "id",
    },
    onDelete: "SET NULL",
  },
}, {
  tableName: "tbl_contest_coding",
  timestamps: true, // createdAt, updatedAt
});

// Associations (one ContestActivity has one ContestCoding)
ContestCoding.belongsTo(ContestActivity, { foreignKey: "activity_id" });
ContestActivity.hasMany(ContestCoding, { foreignKey: "activity_id" });

module.exports = ContestCoding;
