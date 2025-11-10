const sequelize = require('../config/database');

const UserModel = require('./user');
const ProviderModel = require('./provider');
const ServiceModel = require('./service');
const ProviderServiceRelationModel = require('./providerServiceRelation');
const ReservationModel = require('./reservation');

const User = UserModel(sequelize);
const Provider = ProviderModel(sequelize);
const Service = ServiceModel(sequelize);
const ProviderServiceRelation = ProviderServiceRelationModel(sequelize);
const Reservation = ReservationModel(sequelize);

User.hasMany(Reservation, {
  foreignKey: 'user_id',
  as: 'reservations',
});
Reservation.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Provider.hasMany(Reservation, {
  foreignKey: 'provider_id',
  as: 'reservations',
});
Reservation.belongsTo(Provider, {
  foreignKey: 'provider_id',
  as: 'provider',
});

Service.hasMany(Reservation, {
  foreignKey: 'service_id',
  as: 'reservations',
});
Reservation.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service',
});

Provider.belongsToMany(Service, {
  through: ProviderServiceRelation,
  foreignKey: 'provider_id',
  otherKey: 'service_id',
  as: 'services',
});
Service.belongsToMany(Provider, {
  through: ProviderServiceRelation,
  foreignKey: 'service_id',
  otherKey: 'provider_id',
  as: 'providers',
});

ProviderServiceRelation.belongsTo(Provider, {
  foreignKey: 'provider_id',
  as: 'provider',
});
ProviderServiceRelation.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service',
});

module.exports = {
  sequelize,
  User,
  Provider,
  Service,
  ProviderServiceRelation,
  Reservation,
};

