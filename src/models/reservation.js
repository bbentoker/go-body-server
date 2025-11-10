const { DataTypes } = require('sequelize');

const RESERVATION_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];

module.exports = (sequelize) => {
  const Reservation = sequelize.define(
    'Reservation',
    {
      reservation_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      provider_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'providers',
          key: 'provider_id',
        },
      },
      service_id: {
        type: DataTypes.BIGINT,
        references: {
          model: 'services',
          key: 'service_id',
        },
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [RESERVATION_STATUSES],
        },
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      notes: {
        type: DataTypes.TEXT,
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
      tableName: 'reservations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      validate: {
        endAfterStart() {
          if (this.end_time && this.start_time && this.end_time <= this.start_time) {
            throw new Error('Reservation end_time must be after start_time');
          }
        },
      },
    }
  );

  Reservation.STATUSES = RESERVATION_STATUSES;

  return Reservation;
};

