const sequelize = require('../config/database');

const UserModel = require('./user');
const ProviderModel = require('./provider');
const ServiceModel = require('./service');
const ProviderServiceRelationModel = require('./providerServiceRelation');
const ProviderRoleModel = require('./providerRole');
const ReservationModel = require('./reservation');
const RefreshTokenModel = require('./refreshToken');
const LanguageModel = require('./language');
const BlogModel = require('./blog');
const BlogMediaModel = require('./blogMedia');

const User = UserModel(sequelize);
const Provider = ProviderModel(sequelize);
const Service = ServiceModel(sequelize);
const ProviderServiceRelation = ProviderServiceRelationModel(sequelize);
const ProviderRole = ProviderRoleModel(sequelize);
const Reservation = ReservationModel(sequelize);
const RefreshToken = RefreshTokenModel(sequelize);
const Language = LanguageModel(sequelize);
const Blog = BlogModel(sequelize);
const BlogMedia = BlogMediaModel(sequelize);

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

ProviderRole.hasMany(Provider, {
  foreignKey: 'role_id',
  as: 'providers',
});
Provider.belongsTo(ProviderRole, {
  foreignKey: 'role_id',
  as: 'role',
});

User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
});
RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Provider.hasMany(RefreshToken, {
  foreignKey: 'provider_id',
  as: 'refreshTokens',
});
RefreshToken.belongsTo(Provider, {
  foreignKey: 'provider_id',
  as: 'provider',
});

Language.hasMany(User, {
  foreignKey: 'language_id',
  as: 'users',
});
User.belongsTo(Language, {
  foreignKey: 'language_id',
  as: 'language',
});

Language.hasMany(Provider, {
  foreignKey: 'language_id',
  as: 'providers',
});
Provider.belongsTo(Language, {
  foreignKey: 'language_id',
  as: 'language',
});

Provider.hasMany(Blog, {
  foreignKey: 'provider_id',
  as: 'blogs',
});
Blog.belongsTo(Provider, {
  foreignKey: 'provider_id',
  as: 'provider',
});

Blog.hasMany(BlogMedia, {
  foreignKey: 'blog_id',
  as: 'media',
  onDelete: 'CASCADE',
});
BlogMedia.belongsTo(Blog, {
  foreignKey: 'blog_id',
  as: 'blog',
});

module.exports = {
  sequelize,
  User,
  Provider,
  Service,
  ProviderRole,
  ProviderServiceRelation,
  Reservation,
  RefreshToken,
  Language,
  Blog,
  BlogMedia,
};

