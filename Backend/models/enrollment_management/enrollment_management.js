const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Course = require('../course_management/course');
const User = require("../../models/auth/user");
const Contest = require('../contest/contest_content/contest');

const enrollments = sequelize.define(
  "enrollments",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_users", // Adjust this if your user model is named differently
        key: "id",
      },
      onDelete: "CASCADE",
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "tbl_courses", // Adjust this if your course model is named differently
        key: "id",
      },
    },
    user_hash: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    enrollment_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    certificate_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    total_time_spent: {
      type: DataTypes.INTEGER, // in minutes
      defaultValue: 0
    },
    completion_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isEnrolledByPromoCode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM("active", "completed"),
      allowNull: false,
      defaultValue: "active", // Optional: set a default value
    },
    created_by: {
      type: DataTypes.INTEGER, // Or DataTypes.UUID if your user IDs are UUIDs
      allowNull: true, // Or false, depending on your requirements
      references: {
        model: "tbl_users", // Adjust if your user model is named differently
        key: "id",
      },
    },
    updated_by: {
      type: DataTypes.INTEGER, // Or DataTypes.UUID if your user IDs are UUIDs
      allowNull: true,
      references: {
        model: "tbl_users", // Adjust if your user model is named differently
        key: "id",
      },
    },
  },
  {
    tableName: "tbl_enrollments",
    timestamps: true, // Set to true if you want Sequelize to manage created_at/updated_at fields automatically
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// ✅ Define Association Here
enrollments.belongsTo(Course, { foreignKey: "course_id", as: "course" });
Course.hasMany(enrollments, { foreignKey: "course_id", as: "enrollments" });

enrollments.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(enrollments, { foreignKey: "user_id", as: "enrollments" });

const payments = sequelize.define('payments', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contest_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_contests',
      key: 'id',
    },
    onDelete: "SET NULL",
  },
  enrollment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_enrollments',
      key: 'id',
    },
    onDelete: "CASCADE",
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payment_gateway: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gateway_response: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  reference_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    allowNull: false,
  },
  transaction_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_users',
      key: 'id',
    },
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tbl_users',
      key: 'id',
    },
  },
}, {
  tableName: 'tbl_payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

payments.belongsTo(enrollments, { foreignKey: "enrollment_id", as: "enrollment" });
enrollments.hasMany(payments, { foreignKey: "enrollment_id", as: "payments" });

payments.belongsTo(Contest, { foreignKey: "contest_id" });
Contest.hasMany(payments, { foreignKey: "contest_id" });

module.exports = { enrollments, payments };
