const userService = require('../services/userService');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function parseIncludeReservations(req) {
  return req.query.includeReservations === 'true' || req.query.includeReservations === '1';
}

function extractUserPayload(body, overrides = {}, options = {}) {
  const fields = [
    'first_name',
    'last_name',
    'email',
    'phone_number',
    'password',
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

const createUser = asyncHandler(async (req, res) => {
  try {
    const { payload, missingRequired } = extractUserPayload(
      req.body,
      {},
      {
        requiredFields: ['first_name', 'last_name', 'email', 'password'],
        includeNull: false,
      }
    );

    if (missingRequired.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingRequired.join(', ')}`,
      });
    }

    const user = await userService.createUser(payload);
    return res.status(201).json(user);
  } catch (error) {
    console.error('Error in createUser controller:', error);
    return res.status(500).json({
      message: 'Failed to create user',
      error: error.message,
    });
  }
});

const listUsers = asyncHandler(async (req, res) => {
  try {
    const includeReservations = parseIncludeReservations(req);
    const users = await userService.getUsers({ includeReservations });
    return res.json(users);
  } catch (error) {
    console.error('Error in listUsers controller:', error);
    return res.status(500).json({
      message: 'Failed to retrieve users',
      error: error.message,
    });
  }
});

const getUserById = asyncHandler(async (req, res) => {
  try {
    const includeReservations = parseIncludeReservations(req);
    const user = await userService.getUserById(req.params.userId, {
      includeReservations,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error in getUserById controller:', error);
    return res.status(500).json({
      message: 'Failed to retrieve user',
      error: error.message,
    });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  try {
    const { payload } = extractUserPayload(req.body, {}, { includeNull: false });

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        message: 'No valid fields provided for update',
      });
    }

    const user = await userService.updateUser(req.params.userId, payload);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error in updateUser controller:', error);
    return res.status(500).json({
      message: 'Failed to update user',
      error: error.message,
    });
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.userId);

    if (!deleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    return res.status(500).json({
      message: 'Failed to delete user',
      error: error.message,
    });
  }
});

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};

