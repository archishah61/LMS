const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const Role = require("./Role");
const Permission = require("./Permission");

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_roles',
        key: 'id'
      },
      onDelete: 'CASCADE' // Consistent with the belongsToMany association
    },
    permissionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tbl_permissions',
        key: 'id'
      },
      onDelete: 'CASCADE' // Consistent with the belongsToMany association
    }
  },
  {
    tableName: "tbl_role_permissions",
    timestamps: true, 
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);


RolePermission.belongsTo(Role, { foreignKey: 'roleId' });
RolePermission.belongsTo(Permission, { foreignKey: 'permissionId' });

Role.hasMany(RolePermission, { foreignKey: 'roleId' });
Permission.hasMany(RolePermission, { foreignKey: 'permissionId' });

module.exports = RolePermission;