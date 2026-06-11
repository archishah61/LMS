const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/db');
const { MultiSlide } = require('../multi_slide');
const { Accordion } = require('../accordian');
const Topic = require('../../course_management/topic');

const TopicTag = sequelize.define(
    "TopicTag",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        topic_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_topics", // Foreign key reference to tbl_topics
                key: "id",
            },
        },
        slide_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "tbl_multi_slides", // Foreign key reference to tbl_slides
                key: "id",
            },
        },
        accordionId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "tbl_accordions", // Foreign key reference to tbl_accordions
                key: "id",
            },
        },
        tag_file_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tag_file_path: {
            type: DataTypes.TEXT("long"),
            allowNull: true,
        },
        code_language: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tag: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("draft", "pending", "approved", "published", "rejected"),
            defaultValue: "draft",
            allowNull: false,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
    },
    {
        tableName: "tbl_topics_tag",
        timestamps: true, // Enables created_at & updated_at fields
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

TopicTag.belongsTo(Topic, { foreignKey: "topic_id" });
Topic.hasMany(TopicTag, { foreignKey: "topic_id" })
TopicTag.belongsTo(MultiSlide, { foreignKey: "slide_id", as: "slide" });
TopicTag.belongsTo(Accordion, { foreignKey: "accordionId", as: "accordion" });

module.exports = TopicTag;
