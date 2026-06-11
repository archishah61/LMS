const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const certificate_templates = sequelize.define('certificate_templates', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_courses', // Adjust if your course model is named differently
            key: 'id',
        },
    },
    template_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    template_html: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_admin', // Adjust if your admin model is named differently
            key: 'id',
        },
    },
   updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true, // Make nullable if not always updated
        references: {
            model: 'tbl_admin', // Adjust if your admin model is named differently
            key: 'id',
        },
    }
}, {
    tableName: 'tbl_certificate_templates',
    timestamps: true, // Set to true if you want Sequelize to manage created_at/updated_at automatically
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

const issued_certificates = sequelize.define('issued_certificates', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    enrollment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_enrollments', // Adjust if your enrollment model is named differently
            key: 'id',
        },
    },
    template_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_certificate_templates', // This should match the name of the certificate_templates model
            key: 'id',
        },
    },
    issue_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    certificate_number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING, // You may want to define a specific ENUM for statuses
        allowNull: false,
    },
   created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'tbl_admin', // Adjust if your admin model is named differently
            key: 'id',
        },
    },
   updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true, // Make nullable if not always updated
        references: {
            model: 'tbl_admin', // Adjust if your admin model is named differently
            key: 'id',
        },
    },
    
}, {
    tableName: 'tbl_issued_certificates',
    timestamps: true, // Set to true if you want Sequelize to manage created_at/updated_at automatically
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = {certificate_templates, issued_certificates};
    