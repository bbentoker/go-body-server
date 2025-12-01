const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PackageItem = sequelize.define(
    'PackageItem',
    {
      item_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      package_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'packages',
          key: 'package_id',
        },
        onDelete: 'CASCADE',
      },
      variant_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'service_variants',
          key: 'variant_id',
        },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
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
      tableName: 'package_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return PackageItem;
};
