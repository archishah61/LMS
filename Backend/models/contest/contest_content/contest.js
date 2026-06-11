const { DataTypes } = require("sequelize");
const sequelize = require("../../../config/db");
const Admin = require("../../auth/admin");
const ChallengeCategory = require("../../masters/challengeCategory");
const ContestTemplate = require("./contestTemplate");

const Contest = sequelize.define("Contest", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    template_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "tbl_contest_templates",
            key: "id"
        },
        onDelete: "CASCADE"
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_challenge_categories",
            key: "id"
        },
        onDelete: "CASCADE"
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    enrollment_start: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    enrollment_end: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM("draft", "active", "ended", "cancelled"),
        defaultValue: "draft",
        allowNull: false,
    },
    total_participants: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    is_limites_participants: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // true means max_participants is required
    },
    max_participants: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    enroll_by: {
        type: DataTypes.ENUM("free", "points", "paid"),
        defaultValue: "free", // false means entry fee is required
    },
    enrollment_fee: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    mode: {
        type: DataTypes.ENUM("solo", "team", "mixed"),
        allowNull: false,
    },
    rules: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    banner_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_admin",
            key: "id"
        },
        onDelete: "CASCADE"
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "tbl_admin",
            key: "id"
        },
        onDelete: "SET NULL"
    }
}, {
    tableName: "tbl_contests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

// Associations
Contest.belongsTo(ChallengeCategory, {
    foreignKey: "category_id",
});

ChallengeCategory.hasMany(Contest, {
    foreignKey: "category_id",
});

Contest.belongsTo(ContestTemplate, {
    foreignKey: "template_id",
});

ContestTemplate.hasMany(Contest, {
    foreignKey: "template_id",
});

Contest.belongsTo(Admin, {
    foreignKey: "created_by",
});

Contest.belongsTo(Admin, {
    foreignKey: "updated_by",
});

module.exports = Contest;
