const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("../auth/user");
const SupportTicket = require("./support_ticket");
const Admin = require("../auth/admin");

const SupportReply = sequelize.define("SupportReply", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_support_tickets',
            key: 'id'
        },
        onDelete: "CASCADE",
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_users',
            key: 'id'
        },
        onDelete: "CASCADE",
    },
    admin_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_admin',
            key: 'id'
        },
        onDelete: "CASCADE",
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: 'tbl_support_replies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Associations
SupportTicket.hasMany(SupportReply, { foreignKey: "ticket_id", onDelete: "CASCADE" });
SupportReply.belongsTo(SupportTicket, { foreignKey: "ticket_id" });

User.hasMany(SupportReply, { foreignKey: "user_id" });
SupportReply.belongsTo(User, { foreignKey: "user_id" });

Admin.hasMany(SupportReply, { foreignKey: "admin_id" });
SupportReply.belongsTo(Admin, { foreignKey: "admin_id" });

module.exports = SupportReply;
