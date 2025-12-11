const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DecisionTree = sequelize.define(
    'DecisionTree',
    {
      tree_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      version: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      tree_data: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'user_id',
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
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'decision_trees',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return DecisionTree;
};

