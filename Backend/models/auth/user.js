// user.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db"); // Adjust the path to your Sequelize instance
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobile_no: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isNumeric: true,
        len: [10, 15],
      },
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_countries",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_states",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    city_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tbl_cities",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    device_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    device_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    app_platform: {
      type: DataTypes.ENUM('android', 'ios', 'web'),
      allowNull: true,
    },
    login_type: {
      type: DataTypes.ENUM('normal', 'social'),
      allowNull: true,
    },
    access_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    token_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    session_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    isPromoCodeGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  },
  {
    tableName: "tbl_users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

// Hash password before creating a new user
User.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Hash password before updating (only if it's changed)
User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});



module.exports = User;