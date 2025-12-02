const sequelize = require('../config/database');

const UserModel = require('./user');
const RoleModel = require('./role');
const ServiceModel = require('./service');
const ServiceVariantModel = require('./serviceVariant');
const ProviderServiceRelationModel = require('./providerServiceRelation');
const ReservationModel = require('./reservation');
const RefreshTokenModel = require('./refreshToken');
const LanguageModel = require('./language');
const BlogModel = require('./blog');
const BlogMediaModel = require('./blogMedia');
const PackageModel = require('./package');
const PackageItemModel = require('./packageItem');

const User = UserModel(sequelize);
const Role = RoleModel(sequelize);
const Service = ServiceModel(sequelize);
const ServiceVariant = ServiceVariantModel(sequelize);
const ProviderServiceRelation = ProviderServiceRelationModel(sequelize);
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

User.hasMany(Reservation, {
  foreignKey: 'provider_id',
  as: 'provider_reservations',
});
Reservation.belongsTo(User, {
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

User.belongsToMany(Service, {
  through: ProviderServiceRelation,
  foreignKey: 'provider_id',
  otherKey: 'service_id',
  as: 'services',
});
Service.belongsToMany(User, {
  through: ProviderServiceRelation,
  foreignKey: 'service_id',
  otherKey: 'provider_id',
  as: 'providers',
});

ProviderServiceRelation.belongsTo(User, {
  foreignKey: 'provider_id',
  as: 'provider',
});
ProviderServiceRelation.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service',
});

Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users',
});
User.belongsTo(Role, {
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

Language.hasMany(User, {
  foreignKey: 'language_id',
  as: 'users',
});
User.belongsTo(Language, {
  foreignKey: 'language_id',
  as: 'language',
});

User.hasMany(Blog, {
  foreignKey: 'provider_id',
  as: 'blogs',
});
Blog.belongsTo(User, {
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

Service.hasMany(PackageItem, {
  foreignKey: 'service_id',
  as: 'packageItems',
  onDelete: 'CASCADE',
});
PackageItem.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service',
});

module.exports = {
  sequelize,
  User,
  Role,
  Service,
  ServiceVariant,
  ProviderServiceRelation,
  Reservation,
  RefreshToken,
  Language,
  Blog,
  BlogMedia,
  Package,
  PackageItem,
};

