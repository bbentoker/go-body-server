const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      token_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      revoked_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'refresh_tokens',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        {
          name: 'idx_refresh_tokens_token_hash',
          fields: ['token_hash'],
        },
        {
          name: 'idx_refresh_tokens_user_id',
          fields: ['user_id'],
        },
        {
          name: 'idx_refresh_tokens_expires_at',
          fields: ['expires_at'],
        },
      ],
    }
  );

  return RefreshToken;
};

