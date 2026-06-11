const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");
const { FeatureStatus } = require("../masters/featureStatus");
const User = require("../auth/user");

const FeatureInterest = sequelize.define("FeatureInterest", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "tbl_users",
            key: "id",
        },
        onDelete: "CASCADE",
    },

    feature_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_feature_status",
            key: "id",
        },
        onDelete: "CASCADE",
    },

    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },

}, {
    tableName: "tbl_feature_interest",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    // ✅ Add composite unique constraint
    indexes: [
        {
            unique: true,
            fields: ["email", "feature_id"]
        }
    ]
});

module.exports = { FeatureInterest };

User.hasMany(FeatureInterest, { foreignKey: "user_id" });
FeatureStatus.hasMany(FeatureInterest, { foreignKey: "feature_id" });

FeatureInterest.belongsTo(User, { foreignKey: "user_id" });
FeatureInterest.belongsTo(FeatureStatus, { foreignKey: "feature_id" });
