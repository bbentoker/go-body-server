const packageService = require('../services/packageService');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function parseBooleanFlag(value) {
  return value === 'true' || value === '1';
}

function isClientError(error) {
  return Boolean(
    error?.message &&
      (error.message.toLowerCase().includes('variant') ||
        error.message.toLowerCase().includes('item') ||
        error.message.toLowerCase().includes('required'))
  );
}

const createPackage = asyncHandler(async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ message: 'Package name is required' });
  }

  try {
    const pkg = await packageService.createPackage(req.body);
    return res.status(201).json(pkg);
  } catch (error) {
    if (isClientError(error)) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error creating package:', error);
    return res.status(500).json({ message: 'Failed to create package' });
  }
});

const listPackages = asyncHandler(async (req, res) => {
  const includeItems =
    typeof req.query.includeItems === 'undefined'
      ? true
      : parseBooleanFlag(req.query.includeItems);

  const packages = await packageService.getPackages({ includeItems });
  return res.json(packages);
});

const getPackageById = asyncHandler(async (req, res) => {
  const includeItems =
    typeof req.query.includeItems === 'undefined'
      ? true
      : parseBooleanFlag(req.query.includeItems);

  const pkg = await packageService.getPackageById(req.params.packageId, {
    includeItems,
  });

  if (!pkg) {
    return res.status(404).json({ message: 'Package not found' });
  }

  return res.json(pkg);
});

const updatePackage = asyncHandler(async (req, res) => {
  const hasUpdatableField = ['name', 'description', 'price', 'notes', 'is_active', 'items', 'total_duration'].some(
    (field) => Object.prototype.hasOwnProperty.call(req.body, field)
  );

  if (!hasUpdatableField) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  try {
    const pkg = await packageService.updatePackage(req.params.packageId, req.body);

    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    return res.json(pkg);
  } catch (error) {
    if (isClientError(error)) {
      return res.status(400).json({ message: error.message });
    }

    console.error('Error updating package:', error);
    return res.status(500).json({ message: 'Failed to update package' });
  }
});

const deletePackage = asyncHandler(async (req, res) => {
  const deleted = await packageService.deletePackage(req.params.packageId);

  if (!deleted) {
    return res.status(404).json({ message: 'Package not found' });
  }

  return res.status(204).send();
});

module.exports = {
  createPackage,
  listPackages,
  getPackageById,
  updatePackage,
  deletePackage,
};
