const { Package, PackageItem, ServiceVariant, Service, sequelize } = require('../models');

const variantInclude = {
  model: ServiceVariant,
  as: 'variant',
  include: [
    {
      model: Service,
      as: 'service',
    },
  ],
};

const packageItemInclude = {
  model: PackageItem,
  as: 'items',
  include: [variantInclude],
};

function buildInclude(options = {}) {
  const include = [];

  if (options.includeItems !== false) {
    include.push(packageItemInclude);
  }

  return include.length > 0 ? include : undefined;
}

function normalizeItems(items = []) {
  if (!Array.isArray(items)) {
    throw new Error('items must be an array');
  }

  const aggregated = new Map();

  items.forEach((item, index) => {
    const variantId = Number(item.variant_id);
    const quantity = Number(item.quantity ?? 1);

    if (!variantId || Number.isNaN(variantId)) {
      throw new Error(`items[${index}].variant_id must be a valid number`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`items[${index}].quantity must be a positive integer`);
    }

    aggregated.set(variantId, (aggregated.get(variantId) || 0) + quantity);
  });

  return Array.from(aggregated.entries()).map(([variant_id, quantity]) => ({
    variant_id,
    quantity,
  }));
}

async function assertVariantsExist(variantIds, transaction) {
  const variants = await ServiceVariant.findAll({
    where: { variant_id: variantIds },
    transaction,
  });

  if (variants.length !== variantIds.length) {
    const foundIds = variants.map((v) => Number(v.variant_id));
    const missing = variantIds.filter((id) => !foundIds.includes(Number(id)));
    throw new Error(`Invalid variant_id(s): ${missing.join(', ')}`);
  }

  return variants.reduce((acc, variant) => {
    acc[variant.variant_id] = variant;
    return acc;
  }, {});
}

async function calculateTotalDuration(items, variantMap) {
  return items.reduce(
    (sum, item) =>
      sum + item.quantity * Number(variantMap[item.variant_id].duration_minutes || 0),
    0
  );
}

async function createPackage(payload) {
  const normalizedItems = normalizeItems(payload.items || []);
  if (normalizedItems.length === 0) {
    throw new Error('At least one package item is required');
  }

  return sequelize.transaction(async (transaction) => {
    const variantIds = normalizedItems.map((item) => item.variant_id);
    const variantMap = await assertVariantsExist(variantIds, transaction);
    const totalDuration = await calculateTotalDuration(normalizedItems, variantMap);

    const pkg = await Package.create(
      {
        name: payload.name,
        description: payload.description,
        price: payload.price,
        notes: payload.notes,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        total_duration: payload.total_duration ?? totalDuration,
      },
      { transaction }
    );

    await PackageItem.bulkCreate(
      normalizedItems.map((item) => ({
        package_id: pkg.package_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      })),
      { transaction }
    );

    return getPackageById(pkg.package_id, { transaction });
  });
}

async function getPackageById(packageId, options = {}) {
  return Package.findByPk(packageId, {
    include: buildInclude(options),
    transaction: options.transaction,
  });
}

async function getPackages(options = {}) {
  return Package.findAll({
    include: buildInclude(options),
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updatePackage(packageId, payload) {
  return sequelize.transaction(async (transaction) => {
    const pkg = await Package.findByPk(packageId, { transaction });
    if (!pkg) {
      return null;
    }

    const updateData = {
      name: payload.name ?? pkg.name,
      description: payload.description ?? pkg.description,
      price: payload.price ?? pkg.price,
      notes: payload.notes ?? pkg.notes,
      is_active:
        typeof payload.is_active === 'boolean' ? payload.is_active : pkg.is_active,
    };

    let normalizedItems;
    let variantMap;
    let totalDuration = payload.total_duration ?? pkg.total_duration;

    if (payload.items) {
      normalizedItems = normalizeItems(payload.items);
      if (normalizedItems.length === 0) {
        throw new Error('At least one package item is required');
      }

      const variantIds = normalizedItems.map((item) => item.variant_id);
      variantMap = await assertVariantsExist(variantIds, transaction);
      totalDuration = await calculateTotalDuration(normalizedItems, variantMap);
      updateData.total_duration = totalDuration;
    }

    await pkg.update(updateData, { transaction });

    if (normalizedItems) {
      await PackageItem.destroy({
        where: { package_id: packageId },
        transaction,
      });

      await PackageItem.bulkCreate(
        normalizedItems.map((item) => ({
          package_id: packageId,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        { transaction }
      );
    }

    return getPackageById(packageId, { transaction });
  });
}

async function deletePackage(packageId) {
  const deletedCount = await Package.destroy({
    where: { package_id: packageId },
  });

  return deletedCount > 0;
}

module.exports = {
  createPackage,
  getPackageById,
  getPackages,
  updatePackage,
  deletePackage,
};
