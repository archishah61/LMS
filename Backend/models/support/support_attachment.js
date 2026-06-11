const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const SupportTicket = require("./support_ticket");
const SupportReply = require("./support_reply");

const SupportAttachment = sequelize.define("SupportAttachment", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    file_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_type: {
        type: DataTypes.STRING, // image/png, application/pdf, etc.
        allowNull: false
    },
    ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_support_tickets',
            key: 'id'
        },
        onDelete: "CASCADE"
    },
    reply_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tbl_support_replies',
            key: 'id'
        },
        onDelete: "CASCADE"
    },
    uploaded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tbl_support_attachments',
    timestamps: false
});

// Associations
SupportTicket.hasMany(SupportAttachment, { foreignKey: "ticket_id", onDelete: "CASCADE" });
SupportAttachment.belongsTo(SupportTicket, { foreignKey: "ticket_id" });

SupportReply.hasMany(SupportAttachment, { foreignKey: "reply_id", onDelete: "CASCADE" });
SupportAttachment.belongsTo(SupportReply, { foreignKey: "reply_id" });

module.exports = SupportAttachment;
