const sequelize = require('../config/database');

const UserModel = require('./user');
const RoleModel = require('./role');
const ServiceModel = require('./service');
const ServiceCategoryModel = require('./serviceCategory');
const ServiceVariantModel = require('./serviceVariant');
const ProviderServiceRelationModel = require('./providerServiceRelation');
const ReservationModel = require('./reservation');
const RefreshTokenModel = require('./refreshToken');
const LanguageModel = require('./language');
const CountryModel = require('./country');
const BlogModel = require('./blog');
const BlogMediaModel = require('./blogMedia');
const PackageModel = require('./package');
const PackageItemModel = require('./packageItem');
const EmailModel = require('./email');
const EmailEventModel = require('./emailEvent');
const PasswordResetTokenModel = require('./passwordResetToken');
const DecisionTreeModel = require('./decisionTree');
const DecisionTreeSubmissionModel = require('./decisionTreeSubmission');

const User = UserModel(sequelize);
const Role = RoleModel(sequelize);
const Service = ServiceModel(sequelize);
const ServiceCategory = ServiceCategoryModel(sequelize);
const ServiceVariant = ServiceVariantModel(sequelize);
const ProviderServiceRelation = ProviderServiceRelationModel(sequelize);
const Reservation = ReservationModel(sequelize);
const RefreshToken = RefreshTokenModel(sequelize);
const Language = LanguageModel(sequelize);
const Country = CountryModel(sequelize);
const Blog = BlogModel(sequelize);
const BlogMedia = BlogMediaModel(sequelize);
const Package = PackageModel(sequelize);
const PackageItem = PackageItemModel(sequelize);
const Email = EmailModel(sequelize);
const EmailEvent = EmailEventModel(sequelize);
const PasswordResetToken = PasswordResetTokenModel(sequelize);
const DecisionTree = DecisionTreeModel(sequelize);
const DecisionTreeSubmission = DecisionTreeSubmissionModel(sequelize);

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

ServiceCategory.hasMany(Service, {
  foreignKey: 'service_category_id',
  as: 'services',
  onDelete: 'SET NULL',
});
Service.belongsTo(ServiceCategory, {
  foreignKey: 'service_category_id',
  as: 'category',
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

Country.hasMany(User, {
  foreignKey: 'country_id',
  as: 'users',
});
User.belongsTo(Country, {
  foreignKey: 'country_id',
  as: 'country',
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

// Email associations
User.hasMany(Email, {
  foreignKey: 'user_id',
  as: 'emails',
});
Email.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

Email.hasMany(EmailEvent, {
  foreignKey: 'email_id',
  as: 'events',
  onDelete: 'CASCADE',
});
EmailEvent.belongsTo(Email, {
  foreignKey: 'email_id',
  as: 'email',
});

// Password reset token associations
User.hasMany(PasswordResetToken, {
  foreignKey: 'user_id',
  as: 'passwordResetTokens',
});
PasswordResetToken.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Decision tree associations
User.hasMany(DecisionTree, {
  foreignKey: 'created_by',
  as: 'decisionTrees',
});
DecisionTree.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

DecisionTree.hasMany(DecisionTreeSubmission, {
  foreignKey: 'tree_id',
  as: 'submissions',
  onDelete: 'CASCADE',
});
DecisionTreeSubmission.belongsTo(DecisionTree, {
  foreignKey: 'tree_id',
  as: 'tree',
});

User.hasMany(DecisionTreeSubmission, {
  foreignKey: 'user_id',
  as: 'decisionTreeSubmissions',
});
DecisionTreeSubmission.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = {
  sequelize,
  User,
  Role,
  Service,
  ServiceCategory,
  ServiceVariant,
  ProviderServiceRelation,
  Reservation,
  RefreshToken,
  Language,
  Country,
  Blog,
  BlogMedia,
  Package,
  PackageItem,
  Email,
  EmailEvent,
  PasswordResetToken,
  DecisionTree,
  DecisionTreeSubmission,
};
