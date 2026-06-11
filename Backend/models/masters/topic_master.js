const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db'); // Adjust path as needed

const TopicMaster = sequelize.define(
  "TopicMaster",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM('accordion', 'video', 'audio', 'general', 'multi-slide'),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: 'tbl_admin', // Assuming the table name is 'admins'
        key: 'id',
      },
    },
    updated_by: {
      type: DataTypes.INTEGER, // admin.id
      allowNull: false,
      references: {
        model: 'tbl_admin', // Assuming the table name is 'admins'
        key: 'id',
      },
    },
  },
  {
    tableName: 'tbl_topic_masters', // Explicitly define the table name
    timestamps: true, // Sequelize manages created_at and updated_at
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

TopicMaster.associate = (models) => {
  // Define the hasMany associations
  TopicMaster.hasMany(models.Accordion, {
    foreignKey: 'topic_master_id',  // Assuming you'll add topic_master_id to Accordion
    as: 'Accordions',
    onDelete: 'CASCADE', // Or 'SET NULL' depending on your needs
    hooks: true
  });

  TopicMaster.hasMany(models.Video, {
    foreignKey: 'topic_master_id',  // Assuming you'll add topic_master_id to Video
    as: 'Videos',
    onDelete: 'CASCADE', // Or 'SET NULL'
    hooks: true
  });

  TopicMaster.hasMany(models.Audio, {
    foreignKey: 'topic_master_id',  // Assuming you'll add topic_master_id to Audio
    as: 'Audios',
    onDelete: 'CASCADE', // Or 'SET NULL'
    hooks: true
  });

  TopicMaster.hasMany(models.GeneralMaterial, {
    foreignKey: 'topic_master_id',  // Assuming you'll add topic_master_id to GeneralMaterial
    as: 'GeneralMaterials',
    onDelete: 'CASCADE', // Or 'SET NULL'
    hooks: true
  });

    TopicMaster.hasMany(models.MultiSlide, {
        foreignKey: 'topic_master_id',  // Assuming you'll add topic_master_id to MultiSlide
        as: 'MultiSlides',
        onDelete: 'CASCADE', // Or 'SET NULL'
        hooks: true
    });
};

module.exports = { TopicMaster };
