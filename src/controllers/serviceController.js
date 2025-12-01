const serviceService = require('../services/serviceService');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function parseIncludeProviders(req) {
  return req.query.includeProviders === 'true' || req.query.includeProviders === '1';
}

function extractServicePayload(body, overrides = {}, options = {}) {
  const fields = [
    'name',
    'description',
    'duration_minutes',
    'price',
    'is_active',
    'requires_provider',
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
      requiredFields: ['name', 'duration_minutes', 'price'],
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
  const includeProviders = parseIncludeProviders(req);
  const services = await serviceService.getServices({ includeProviders });
  return res.json(services);
});

const getServiceById = asyncHandler(async (req, res) => {
  const includeProviders = parseIncludeProviders(req);
  const service = await serviceService.getServiceById(req.params.serviceId, {
    includeProviders,
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
  const services = await serviceService.getServices({ includeProviders: false });
  const sanitized = services.map((service) => {
    const plain = service?.get ? service.get({ plain: true }) : service;
    const { price, ...rest } = plain || {};
    return rest;
  });

  return res.json(sanitized);
});

module.exports = {
  createService,
  listServices,
  getServiceById,
  updateService,
  deleteService,
  listServicesWithoutPrice,
};

