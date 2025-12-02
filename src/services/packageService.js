const { Package, PackageItem, Service, sequelize } = require('../models');

const serviceInclude = {
  model: Service,
  as: 'service',
};

const packageItemInclude = {
  model: PackageItem,
  as: 'items',
  include: [serviceInclude],
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
    const serviceId = Number(item.service_id);
    const quantity = Number(item.quantity ?? 1);

    if (!serviceId || Number.isNaN(serviceId)) {
      throw new Error(`items[${index}].service_id must be a valid number`);
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`items[${index}].quantity must be a positive integer`);
    }

    aggregated.set(serviceId, (aggregated.get(serviceId) || 0) + quantity);
  });

  return Array.from(aggregated.entries()).map(([service_id, quantity]) => ({
    service_id,
    quantity,
  }));
}

async function assertServicesExist(serviceIds, transaction) {
  const services = await Service.findAll({
    where: { service_id: serviceIds },
    transaction,
  });

  if (services.length !== serviceIds.length) {
    const foundIds = services.map((s) => Number(s.service_id));
    const missing = serviceIds.filter((id) => !foundIds.includes(Number(id)));
    throw new Error(`Invalid service_id(s): ${missing.join(', ')}`);
  }

  return services.reduce((acc, service) => {
    acc[service.service_id] = service;
    return acc;
  }, {});
}

async function createPackage(payload) {
  const normalizedItems = normalizeItems(payload.items || []);
  if (normalizedItems.length === 0) {
    throw new Error('At least one package item is required');
  }

  return sequelize.transaction(async (transaction) => {
    const serviceIds = normalizedItems.map((item) => item.service_id);
    await assertServicesExist(serviceIds, transaction);

    const pkg = await Package.create(
      {
        name: payload.name,
        description: payload.description,
        price: payload.price,
        price_visible:
          typeof payload.price_visible === 'boolean' ? payload.price_visible : false,
        notes: payload.notes,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        total_duration: payload.total_duration ?? null,
      },
      { transaction }
    );

    await PackageItem.bulkCreate(
      normalizedItems.map((item) => ({
        package_id: pkg.package_id,
        service_id: item.service_id,
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
      price_visible:
        typeof payload.price_visible === 'boolean'
          ? payload.price_visible
          : pkg.price_visible,
      notes: payload.notes ?? pkg.notes,
      is_active:
        typeof payload.is_active === 'boolean' ? payload.is_active : pkg.is_active,
    };

    let normalizedItems;
    let totalDuration =
      payload.total_duration !== undefined ? payload.total_duration : pkg.total_duration;

    if (payload.items) {
      normalizedItems = normalizeItems(payload.items);
      if (normalizedItems.length === 0) {
        throw new Error('At least one package item is required');
      }

      const serviceIds = normalizedItems.map((item) => item.service_id);
      await assertServicesExist(serviceIds, transaction);
      updateData.total_duration = totalDuration;
    } else if (payload.total_duration !== undefined) {
      updateData.total_duration = payload.total_duration;
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
          service_id: item.service_id,
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
