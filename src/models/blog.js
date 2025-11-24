const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Blog = sequelize.define(
    'Blog',
    {
      blog_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      provider_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'providers',
          key: 'provider_id',
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      cover_image_url: {
        type: DataTypes.TEXT,
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      published_at: {
        type: DataTypes.DATE,
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
      tableName: 'blogs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Blog;
};
