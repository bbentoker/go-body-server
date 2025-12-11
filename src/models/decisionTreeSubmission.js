const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DecisionTreeSubmission = sequelize.define(
    'DecisionTreeSubmission',
    {
      submission_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tree_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'decision_trees',
          key: 'tree_id',
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      path: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      result: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'decision_tree_submissions',
      timestamps: false,
    }
  );

  return DecisionTreeSubmission;
};

