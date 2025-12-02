const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define(
    'Role',
    {
      role_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      role_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      role_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      is_provider: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: 'roles',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Role;
};
