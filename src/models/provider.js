const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Provider = sequelize.define(
    'Provider',
    {
      provider_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone_number: {
        type: DataTypes.STRING(50),
      },
      password_hash: {
        type: DataTypes.STRING(255),
      },
      title: {
        type: DataTypes.STRING(100),
      },
      bio: {
        type: DataTypes.TEXT,
      },
      role_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'provider_roles',
          key: 'role_id',
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'providers',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Provider;
};

