const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Country = sequelize.define(
    'Country',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      iso_code_2: {
        type: DataTypes.CHAR(2),
        allowNull: false,
      },
      official_name: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      iso_code_3: {
        type: DataTypes.CHAR(3),
        allowNull: true,
      },
      numeric_code: {
        type: DataTypes.SMALLINT,
        allowNull: true,
      },
      phone_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'countries',
      timestamps: false,
    }
  );

  return Country;
};

