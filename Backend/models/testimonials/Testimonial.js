const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // Adjust path
const CompanyLogo = require('./CompanyLogo');

const Testimonial = sequelize.define(
    "Testimonial",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        author_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        author_image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        author_role: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        testimonial_text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5,
            validate: {
                min: 1,
                max: 5
            }
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "tbl_company_logos",
                key: "id",
            },
            onDelete: "SET NULL",
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        tableName: "tbl_testimonials",
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

// Define Association
Testimonial.belongsTo(CompanyLogo, { foreignKey: 'company_id', as: 'company' });
CompanyLogo.hasMany(Testimonial, { foreignKey: 'company_id', as: 'testimonials' });

module.exports = Testimonial;
