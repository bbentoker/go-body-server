const serviceService = require('../services/serviceService');
const serviceVariantService = require('../services/serviceVariantService');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function parseBooleanFlag(value) {
  return value === 'true' || value === '1';
}

function extractServicePayload(body, overrides = {}, options = {}) {
  const fields = [
    'name',
    'description',
    'is_active',
    'notes',
  ];

  const {
    requiredFields = [],
    includeNull = true,
  } = options;

  const raw = { ...body, ...overrides };
  const payload = {};

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(raw, field)) {
      const value = raw[field];
      if (typeof value !== 'undefined' && (includeNull || value !== null)) {
        payload[field] = value;
      }
    }
  });

  const missingRequired = requiredFields.filter(
    (field) =>
      !Object.prototype.hasOwnProperty.call(payload, field) ||
      typeof payload[field] === 'undefined'
  );

  return { payload, missingRequired };
}

const createService = asyncHandler(async (req, res) => {
  const { payload, missingRequired } = extractServicePayload(
    req.body,
    {},
    {
      requiredFields: ['name'],
      includeNull: false,
    }
  );

  if (missingRequired.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingRequired.join(', ')}`,
    });
  }

  const service = await serviceService.createService(payload);
  return res.status(201).json(service);
});

const listServices = asyncHandler(async (req, res) => {
  const includeProviders = parseBooleanFlag(req.query.includeProviders);
  const includeVariants = parseBooleanFlag(req.query.includeVariants);
  const services = await serviceService.getServices({ includeProviders, includeVariants });
  return res.json(services);
});

const getServiceById = asyncHandler(async (req, res) => {
  const includeProviders = parseBooleanFlag(req.query.includeProviders);
  const includeVariants = parseBooleanFlag(req.query.includeVariants);
  const service = await serviceService.getServiceById(req.params.serviceId, {
    includeProviders,
    includeVariants,
  });

  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  return res.json(service);
});

const updateService = asyncHandler(async (req, res) => {
  const { payload } = extractServicePayload(req.body, {}, { includeNull: false });

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const service = await serviceService.updateService(req.params.serviceId, payload);

  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  return res.json(service);
});

const deleteService = asyncHandler(async (req, res) => {
  const deleted = await serviceService.deleteService(req.params.serviceId);

  if (!deleted) {
    return res.status(404).json({ message: 'Service not found' });
  }

  return res.status(204).send();
});

const listServicesWithoutPrice = asyncHandler(async (req, res) => {
  const services = await serviceService.getServices({
    includeProviders: false,
    includeVariants: true,
  });

  const sanitized = services.map((service) => {
    const plain = service?.get ? service.get({ plain: true }) : service;
    const variants = (plain?.variants || []).map((variant) => {
      const { price, ...variantRest } = variant;
      return variantRest;
    });
    return { ...plain, variants };
  });

  return res.json(sanitized);
});

function extractVariantPayload(body, overrides = {}, options = {}) {
  const fields = ['name', 'duration_minutes', 'price', 'is_active'];
  const { requiredFields = [], includeNull = true } = options;

  const raw = { ...body, ...overrides };
  const payload = {};

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(raw, field)) {
      const value = raw[field];
      if (typeof value !== 'undefined' && (includeNull || value !== null)) {
        payload[field] = value;
      }
    }
  });

  const missingRequired = requiredFields.filter(
    (field) =>
      !Object.prototype.hasOwnProperty.call(payload, field) ||
      typeof payload[field] === 'undefined'
  );

  return { payload, missingRequired };
}

const createServiceVariant = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const parentService = await serviceService.getServiceById(serviceId);

  if (!parentService) {
    return res.status(404).json({ message: 'Service not found' });
  }

  const { payload, missingRequired } = extractVariantPayload(
    req.body,
    {},
    {
      requiredFields: ['duration_minutes', 'price'],
      includeNull: false,
    }
  );

  // Default variant name to parent service name when not provided or blank
  if (!payload.name || (typeof payload.name === 'string' && payload.name.trim() === '')) {
    payload.name = parentService.name;
  }

  if (missingRequired.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingRequired.join(', ')}`,
    });
  }

  const variant = await serviceVariantService.createVariant(serviceId, payload);
  return res.status(201).json(variant);
});

const listServiceVariants = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const includeService = parseBooleanFlag(req.query.includeService);

  const parentService = await serviceService.getServiceById(serviceId);
  if (!parentService) {
    return res.status(404).json({ message: 'Service not found' });
  }

  const variants = await serviceVariantService.getVariantsByService(serviceId, {
    includeService,
  });

  return res.json(variants);
});

const getServiceVariantById = asyncHandler(async (req, res) => {
  const includeService = parseBooleanFlag(req.query.includeService);

  const variant = await serviceVariantService.getVariantById(req.params.variantId, {
    includeService,
  });

  if (!variant) {
    return res.status(404).json({ message: 'Service variant not found' });
  }

  return res.json(variant);
});

const updateServiceVariant = asyncHandler(async (req, res) => {
  const { payload } = extractVariantPayload(req.body, {}, { includeNull: false });

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const variant = await serviceVariantService.updateVariant(req.params.variantId, payload);

  if (!variant) {
    return res.status(404).json({ message: 'Service variant not found' });
  }

  const withRelations = await serviceVariantService.getVariantById(req.params.variantId, {
    includeService: true,
  });

  return res.json(withRelations);
});

const deleteServiceVariant = asyncHandler(async (req, res) => {
  const deleted = await serviceVariantService.deleteVariant(req.params.variantId);

  if (!deleted) {
    return res.status(404).json({ message: 'Service variant not found' });
  }

  return res.status(204).send();
});

module.exports = {
  createService,
  listServices,
  getServiceById,
  updateService,
  deleteService,
  listServicesWithoutPrice,
  createServiceVariant,
  listServiceVariants,
  getServiceVariantById,
  updateServiceVariant,
  deleteServiceVariant,
};

