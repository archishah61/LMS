const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const bcrypt = require("bcryptjs");
const Role = require("./RoleAndPermission/Role");

const Admin = sequelize.define(
  "Admin",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_roles',
        key: 'id'
      },
      onDelete: "CASCADE"
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "tbl_admin",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

Admin.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Association with Role
Admin.belongsTo(Role, {
  foreignKey: 'roleId',
});

Role.hasMany(Admin, {
  foreignKey: 'roleId',
});

module.exports = Admin;