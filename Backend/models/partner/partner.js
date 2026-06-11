const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const User = require('../auth/user');

const Partner = sequelize.define('Partner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
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
  partner_type: {
    type: DataTypes.ENUM('Individual', 'Organization'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: ''// Will be set by backend
  },
  // Fields for Organization partners
  organization_type: {
    type: DataTypes.ENUM('Institute', 'College', 'School', 'Company', 'NGO', 'Other'),
    allowNull: true // Only required when partner_type is Organization
  },
  contact_person_name: {
    type: DataTypes.STRING(255),
    allowNull: true // Only required when partner_type is Organization
  },
  contact_person_email: {
    type: DataTypes.STRING(255),
    allowNull: true, // Only required when partner_type is Organization
    validate: {
      isEmail: true
    }
  },
  contact_person_phone: {
    type: DataTypes.STRING(20),
    allowNull: true // Only required when partner_type is Organization
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending'
  },
  session_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // true on first login
  }

}, {
  tableName: 'tbl_partners',
  timestamps: true, // Since we're using created_at explicitly
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Partner.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasOne(Partner, { foreignKey: "user_id", as: "partner" });

module.exports = { Partner };
