const { DataTypes } = require("sequelize");
const sequelize = require("../../../../config/db");
const ContestCoding = require("./contestCoding");

const ContestCodingTestCase = sequelize.define("ContestCodingTestCase", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    coding_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_contest_coding",
            key: "id",
        },
        onDelete: "CASCADE",
    },

    input: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    expected_output: {
        type: DataTypes.TEXT,
        allowNull: false,
    },

    is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // false = hidden test case
    },

    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // order of execution
    },


    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },

    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "tbl_admin",
            key: "id",
        },
        onDelete: "CASCADE",
    },

    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "tbl_admin",
            key: "id",
        },
        onDelete: "SET NULL",
    }
}, {
    tableName: "tbl_contest_coding_testcases",
    timestamps: true,
});

// Associations
ContestCoding.hasMany(ContestCodingTestCase, {
    foreignKey: "coding_id",
});
ContestCodingTestCase.belongsTo(ContestCoding, {
    foreignKey: "coding_id",
});

module.exports = ContestCodingTestCase;