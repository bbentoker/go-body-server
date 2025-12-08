const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Email = sequelize.define(
    'Email',
    {
      email_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      resend_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Unique ID returned by Resend API',
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        comment: 'Associated user if applicable',
      },
      from_address: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      to_addresses: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: 'Array of recipient email addresses',
      },
      cc_addresses: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Array of CC email addresses',
      },
      bcc_addresses: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Array of BCC email addresses',
      },
      reply_to: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING(998),
        allowNull: false,
      },
      html_content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      text_content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      template_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Email template identifier used',
      },
      template_data: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Data passed to the template',
      },
      tags: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Resend tags for categorization',
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'delivered', 'bounced', 'complained', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error message if sending failed',
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      opened_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      clicked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      bounced_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      complained_at: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: 'emails',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['resend_id'] },
        { fields: ['user_id'] },
        { fields: ['status'] },
        { fields: ['template_name'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return Email;
};

