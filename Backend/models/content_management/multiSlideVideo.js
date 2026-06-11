const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // Adjust path as needed
const { MultiSlide } = require('./multi_slide');

const MultiSlideVideo = sequelize.define(
    "MultiSlideVideo",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        multi_slide_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_multi_slides", // Ensure this matches your Topic model name
                key: "id",
            },
        },
        url: {
            type: DataTypes.STRING, // Or DataTypes.TEXT if URLs can be very long
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("internal", "youtube"),
            allowNull: false,
            defaultValue: "internal",
        },
        duration_minutes: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: false,
        },
        created_by: {
            type: DataTypes.INTEGER, // admin.id
            allowNull: false
        },
        created_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
        updated_by: {
            type: DataTypes.INTEGER, // admin.id
            allowNull: false
        },
        updated_by_type: {
            type: DataTypes.ENUM("admin", "partner"),
            allowNull: false,
            defaultValue: "admin",
        },
    },
    {
        tableName: 'tbl_multi_slides_video', // Explicitly define the table name
        timestamps: true, // Sequelize manages created_at and updated_at
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

MultiSlide.hasMany(MultiSlideVideo, { foreignKey: 'multi_slide_id', onDelete: "CASCADE", });
MultiSlideVideo.belongsTo(MultiSlide, { foreignKey: 'multi_slide_id' });

module.exports = { MultiSlideVideo };