const { Reservation, User, Provider, ServiceVariant, Service } = require('../models');

const defaultInclude = [
  {
    model: User,
    as: 'user',
  },
  {
    model: Provider,
    as: 'provider',
  },
  {
    model: ServiceVariant,
    as: 'variant',
    include: [
      {
        model: Service,
        as: 'service',
      },
    ],
  },
];

async function createReservation(payload) {
  return Reservation.create(payload);
}

async function getReservationById(reservationId, options = {}) {
  return Reservation.findByPk(reservationId, {
    include: options.includeRelations ? defaultInclude : undefined,
  });
}

async function getReservations(options = {}) {
  return Reservation.findAll({
    include: options.includeRelations ? defaultInclude : undefined,
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updateReservation(reservationId, updates) {
  const reservation = await Reservation.findByPk(reservationId);

  if (!reservation) {
    return null;
  }

  await reservation.update(updates);
  return reservation;
}

async function deleteReservation(reservationId) {
  const deletedCount = await Reservation.destroy({
    where: { reservation_id: reservationId },
  });

  return deletedCount > 0;
}

module.exports = {
  createReservation,
  getReservationById,
  getReservations,
  updateReservation,
  deleteReservation,
  RESERVATION_STATUSES: Reservation.STATUSES,
};

