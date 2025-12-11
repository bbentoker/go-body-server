const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PasswordResetToken = sequelize.define(
    'PasswordResetToken',
    {
      token_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      used_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'password_reset_tokens',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        {
          name: 'idx_password_reset_tokens_token_hash',
          fields: ['token_hash'],
        },
        {
          name: 'idx_password_reset_tokens_user_id',
          fields: ['user_id'],
        },
        {
          name: 'idx_password_reset_tokens_expires_at',
          fields: ['expires_at'],
        },
      ],
    }
  );

  return PasswordResetToken;
};

