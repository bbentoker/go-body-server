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
      provider_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'providers',
          key: 'provider_id',
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
      validate: {
        checkTokenOwner() {
          const hasUser = this.user_id !== null && this.user_id !== undefined;
          const hasProvider = this.provider_id !== null && this.provider_id !== undefined;
          
          if ((hasUser && hasProvider) || (!hasUser && !hasProvider)) {
            throw new Error('RefreshToken must belong to either a user or a provider, not both or neither');
          }
        },
      },
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
          name: 'idx_refresh_tokens_provider_id',
          fields: ['provider_id'],
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

