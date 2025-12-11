const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      provider_id: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue('user_id');
        },
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
      role_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'roles',
          key: 'role_id',
        },
      },
      title: {
        type: DataTypes.STRING(100),
      },
      bio: {
        type: DataTypes.TEXT,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      language_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4, // Turkish (tr) as default
        references: {
          model: 'languages',
          key: 'language_id',
        },
      },
      country_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'countries',
          key: 'id',
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return User;
};

