const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlogMedia = sequelize.define(
    'BlogMedia',
    {
      media_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      blog_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'blogs',
          key: 'blog_id',
        },
      },
      media_type: {
        type: DataTypes.ENUM('image', 'video'),
        allowNull: false,
        defaultValue: 'image',
      },
      object_key: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      alt_text: {
        type: DataTypes.STRING(255),
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'blog_media',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return BlogMedia;
};
