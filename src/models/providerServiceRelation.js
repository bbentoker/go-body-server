const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProviderServiceRelation = sequelize.define(
    'ProviderServiceRelation',
    {
      provider_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        references: {
          model: 'providers',
          key: 'provider_id',
        },
        onDelete: 'CASCADE',
      },
      service_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        references: {
          model: 'services',
          key: 'service_id',
        },
        onDelete: 'CASCADE',
      },
    },
    {
      tableName: 'provider_services',
      timestamps: false,
    }
  );

  return ProviderServiceRelation;
};

