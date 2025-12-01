const sequelize = require('../config/database');

const UserModel = require('./user');
const ProviderModel = require('./provider');
const ServiceModel = require('./service');
const ServiceVariantModel = require('./serviceVariant');
const ProviderServiceRelationModel = require('./providerServiceRelation');
const ProviderRoleModel = require('./providerRole');
const ReservationModel = require('./reservation');
const RefreshTokenModel = require('./refreshToken');
const LanguageModel = require('./language');
const BlogModel = require('./blog');
const BlogMediaModel = require('./blogMedia');
const PackageModel = require('./package');
const PackageItemModel = require('./packageItem');

const User = UserModel(sequelize);
const Provider = ProviderModel(sequelize);
const Service = ServiceModel(sequelize);
const ServiceVariant = ServiceVariantModel(sequelize);
const ProviderServiceRelation = ProviderServiceRelationModel(sequelize);
const ProviderRole = ProviderRoleModel(sequelize);
const Reservation = ReservationModel(sequelize);
const RefreshToken = RefreshTokenModel(sequelize);
const Language = LanguageModel(sequelize);
const Blog = BlogModel(sequelize);
const BlogMedia = BlogMediaModel(sequelize);
const Package = PackageModel(sequelize);
const PackageItem = PackageItemModel(sequelize);

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

Service.hasMany(ServiceVariant, {
  foreignKey: 'service_id',
  as: 'variants',
  onDelete: 'CASCADE',
});
ServiceVariant.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service',
});

ServiceVariant.hasMany(Reservation, {
  foreignKey: 'variant_id',
  as: 'reservations',
});
Reservation.belongsTo(ServiceVariant, {
  foreignKey: 'variant_id',
  as: 'variant',
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

Package.hasMany(PackageItem, {
  foreignKey: 'package_id',
  as: 'items',
  onDelete: 'CASCADE',
});
PackageItem.belongsTo(Package, {
  foreignKey: 'package_id',
  as: 'package',
});

ServiceVariant.hasMany(PackageItem, {
  foreignKey: 'variant_id',
  as: 'packageItems',
});
PackageItem.belongsTo(ServiceVariant, {
  foreignKey: 'variant_id',
  as: 'variant',
});

module.exports = {
  sequelize,
  User,
  Provider,
  Service,
  ServiceVariant,
  ProviderRole,
  ProviderServiceRelation,
  Reservation,
  RefreshToken,
  Language,
  Blog,
  BlogMedia,
  Package,
  PackageItem,
};

