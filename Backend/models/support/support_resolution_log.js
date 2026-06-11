const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const SupportTicket = require("./support_ticket");

const SupportResolutionLog = sequelize.define("SupportResolutionLog", {
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
        onDelete: "CASCADE"
    },
    resolution_note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    resolved_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tbl_support_resolution_logs',
    timestamps: false
});

// Associations
SupportTicket.hasOne(SupportResolutionLog, { foreignKey: 'ticket_id' });
SupportResolutionLog.belongsTo(SupportTicket, { foreignKey: 'ticket_id' });

module.exports = SupportResolutionLog;
