const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmailEvent = sequelize.define(
    'EmailEvent',
    {
      event_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      email_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'emails',
          key: 'email_id',
        },
        comment: 'Reference to our emails table',
      },
      resend_email_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Email ID from Resend webhook payload',
      },
      event_type: {
        type: DataTypes.ENUM(
          'email.sent',
          'email.delivered',
          'email.delivery_delayed',
          'email.complained',
          'email.bounced',
          'email.opened',
          'email.clicked'
        ),
        allowNull: false,
      },
      webhook_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Webhook event ID from Resend',
      },
      recipient_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      // Bounce-specific fields
      bounce_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Type of bounce (e.g., hard, soft)',
      },
      bounce_classification: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Bounce classification from Resend',
      },
      // Click-specific fields
      click_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL that was clicked',
      },
      // User agent and location data
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      // Raw payload for debugging and future needs
      raw_payload: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Full webhook payload from Resend',
      },
      occurred_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'When the event occurred according to Resend',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'email_events',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        { fields: ['email_id'] },
        { fields: ['resend_email_id'] },
        { fields: ['event_type'] },
        { fields: ['occurred_at'] },
        { fields: ['webhook_id'], unique: true },
      ],
    }
  );

  return EmailEvent;
};

