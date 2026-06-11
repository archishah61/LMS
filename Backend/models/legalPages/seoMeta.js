const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const SeoMeta = sequelize.define(
    "SeoMeta",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        // ------------------------ OG (Open Graph) ------------------------
        og_image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        og_alt: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        og_title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        og_description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        og_keywords: {
            type: DataTypes.TEXT, // comma-separated keywords
            allowNull: true,
        },

        // ------------------------ SEO ------------------------
        seo_image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        seo_alt: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        seo_title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        seo_description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        seo_keywords: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        canonical_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        page_type: {
            type: DataTypes.ENUM("home", "about", "contact-us", "default"),
            allowNull: false,
            defaultValue: "default",
        },

        // Created & updated by admin
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_admin",
                key: "id",
            },
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_admin",
                key: "id",
            },
        },

        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "tbl_seo_meta",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = SeoMeta;
