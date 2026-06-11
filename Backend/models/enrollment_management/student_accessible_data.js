const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const studentAccessibleData = sequelize.define(
    "student_accessible_data",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_users", // Adjust if your user model name differs
                key: "id",
            },
            onDelete: "CASCADE",
        },
        enrollment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_enrollments",
                key: "id",
            },
            onDelete: "CASCADE",
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "tbl_courses", // Adjust if needed
                key: "id",
            },
            onDelete: "CASCADE",
        },
        session_ids: {
            type: DataTypes.JSON, // stores array of {id: number, isAccessible: boolean}
            allowNull: true,
            defaultValue: [],
            validate: {
                isValidFormat(value) {
                    if (!Array.isArray(value)) throw new Error('session_ids must be an array');
                    value.forEach(item => {
                        if (!item.id || typeof item.isAccessible !== 'boolean') {
                            throw new Error('Each session must have an id and isAccessible flag');
                        }
                    });
                }
            }
        },
        module_ids: {
            type: DataTypes.JSON, // stores array of {id: number, isAccessible: boolean, session_id: number}
            allowNull: true,
            defaultValue: [],
            validate: {
                isValidFormat(value) {
                    if (!Array.isArray(value)) throw new Error('module_ids must be an array');
                    value.forEach(item => {
                        if (!item.id || typeof item.isAccessible !== 'boolean' || !item.session_id) {
                            throw new Error('Each module must have an id, isAccessible flag, and session_id');
                        }
                    });
                }
            }
        },
        topic_ids: {
            type: DataTypes.JSON, // stores array of {id: number, isAccessible: boolean, module_id: number}
            allowNull: true,
            defaultValue: [],
            validate: {
                isValidFormat(value) {
                    if (!Array.isArray(value)) throw new Error('topic_ids must be an array');
                    value.forEach(item => {
                        if (!item.id || typeof item.isAccessible !== 'boolean' || !item.module_id) {
                            throw new Error('Each topic must have an id, isAccessible flag, and module_id');
                        }
                    });
                }
            }
        },
        quiz_ids: {
            type: DataTypes.JSON, // stores array of {id: number, isAccessible: boolean, module_id: number}
            allowNull: true,
            defaultValue: [],
            validate: {
                isValidFormat(value) {
                    if (!Array.isArray(value)) throw new Error('quiz_ids must be an array');
                    value.forEach(item => {
                        if (!item.id || (typeof item.isAccessible !== 'boolean' && item.isAccessible !== 0 && item.isAccessible !== 1) || !item.module_id) {
                            throw new Error('Each quiz must have an id, isAccessible flag, and module_id');
                        }
                    });
                }
            }
        },
        assignment_ids: {
            type: DataTypes.JSON, // stores array of {id: number, isAccessible: boolean, module_id: number}
            allowNull: true,
            defaultValue: [],
            validate: {
                isValidFormat(value) {
                    if (!Array.isArray(value)) throw new Error('assignment_ids must be an array');
                    value.forEach(item => {
                        if (!item.id || (typeof item.isAccessible !== 'boolean' && item.isAccessible !== 0 && item.isAccessible !== 1) || !item.module_id) {
                            throw new Error('Each assignment must have an id, isAccessible flag, and module_id');
                        }
                    });
                }
            }
        },
    },
    {
        tableName: "tbl_student_accessible_data",
        timestamps: true, // Sequelize manages created_at & updated_at
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = studentAccessibleData;
