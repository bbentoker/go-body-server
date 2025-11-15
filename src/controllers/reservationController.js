const reservationService = require('../services/reservationService');
const serviceService = require('../services/serviceService');
const userService = require('../services/userService');
const { Op } = require('sequelize');

/**
 * Validates if the time is on the hour or half-hour (e.g., 9:00 or 9:30)
 */
function isValidTimeSlot(date) {
  const minutes = date.getMinutes();
  return minutes === 0 || minutes === 30;
}

/**
 * Validates if the reservation time is within business hours (9 AM - 9 PM)
 */
function isWithinBusinessHours(startTime, endTime) {
  const startHour = startTime.getHours();
  const startMinutes = startTime.getMinutes();
  const endHour = endTime.getHours();
  const endMinutes = endTime.getMinutes();

  // Check if start time is at or after 9:00 AM
  if (startHour < 9) {
    return { valid: false, message: 'Reservations must start at 9:00 AM or later' };
  }

  // Check if end time is at or before 9:00 PM (21:00)
  if (endHour > 21 || (endHour === 21 && endMinutes > 0)) {
    return { valid: false, message: 'Reservations must end by 9:00 PM' };
  }

  return { valid: true };
}

/**
 * Checks if there's at least 1 hour gap between reservations
 */
async function hasOneHourGap(providerId, startTime, endTime, excludeReservationId = null) {
  const oneHourBefore = new Date(startTime);
  oneHourBefore.setHours(oneHourBefore.getHours() - 1);

  const oneHourAfter = new Date(endTime);
  oneHourAfter.setHours(oneHourAfter.getHours() + 1);

  const whereClause = {
    provider_id: providerId,
    status: {
      [Op.notIn]: ['cancelled', 'no_show'],
    },
    [Op.or]: [
      {
        // Reservation before ours that's too close
        // Ends after (our start - 1 hour) and ends on or before our start
        // Example: if we start at 11:30, existing must not end after 10:30
        [Op.and]: [
          { end_time: { [Op.gt]: oneHourBefore } },
          { end_time: { [Op.lte]: startTime } },
        ],
      },
      {
        // Reservation after ours that's too close
        // Starts before (our end + 1 hour) and starts on or after our end
        // Example: if we end at 13:00, existing must not start before 14:00
        [Op.and]: [
          { start_time: { [Op.lt]: oneHourAfter } },
          { start_time: { [Op.gte]: endTime } },
        ],
      },
      {
        // Overlapping reservation
        // Existing starts before our end and ends after our start
        [Op.and]: [
          { start_time: { [Op.lt]: endTime } },
          { end_time: { [Op.gt]: startTime } },
        ],
      },
    ],
  };

  // If updating an existing reservation, exclude it from the check
  if (excludeReservationId) {
    whereClause.reservation_id = { [Op.ne]: excludeReservationId };
  }

  const conflictingReservations = await reservationService.getReservations({
    where: whereClause,
  });

  return conflictingReservations.length === 0;
}

/**
 * Gets the start and end of the current week (Monday to Sunday)
 */
function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate offset to get to Monday (if today is Sunday, go back 6 days)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  // Get Monday of current week at 00:00:00
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  
  // Get Sunday of current week at 23:59:59
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

/**
 * Get reservations by date range (index route)
 */
async function getReservationsByDateRange(req, res) {
  try {
    const { start_date, end_date, provider_id, user_id } = req.query;
    
    let startDate, endDate;
    
    if (start_date && end_date) {
      // Parse provided dates
      startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0); // Start of day
      
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      if (startDate > endDate) {
        return res.status(400).json({ error: 'start_date must be before or equal to end_date' });
      }
    } else {
      // Default to current week (Monday to Sunday)
      const weekRange = getCurrentWeekRange();
      startDate = weekRange.start;
      endDate = weekRange.end;
    }
    
    // Build where clause
    const whereClause = {
      start_time: {
        [Op.between]: [startDate, endDate],
      },
    };
    
    // Add optional filters
    if (provider_id) whereClause.provider_id = provider_id;
    if (user_id) whereClause.user_id = user_id;
    
    const reservations = await reservationService.getReservations({
      where: whereClause,
      includeRelations: true,
      order: [['start_time', 'ASC']],
    });
    
    // Fetch all services and users
    const allServices = await serviceService.getServices({
      where: { is_active: true },
    });
    
    const allUsers = await userService.getUsers();
    
    res.json({
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      count: reservations.length,
      reservations,
      services: allServices,
      users: allUsers,
    });
  } catch (error) {
    console.error('Error fetching reservations by date range:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
}

/**
 * Get reservations by date range (public route - sanitized data)
 */
async function getPublicReservationsByDateRange(req, res) {
  try {
    const { start_date, end_date, provider_id } = req.query;
    
    let startDate, endDate;
    
    if (start_date && end_date) {
      // Parse provided dates
      startDate = new Date(start_date);
      startDate.setHours(0, 0, 0, 0); // Start of day
      
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      if (startDate > endDate) {
        return res.status(400).json({ error: 'start_date must be before or equal to end_date' });
      }
    } else {
      // Default to current week (Monday to Sunday)
      const weekRange = getCurrentWeekRange();
      startDate = weekRange.start;
      endDate = weekRange.end;
    }
    
    // Build where clause - only confirmed/completed reservations for public view
    const whereClause = {
      start_time: {
        [Op.between]: [startDate, endDate],
      },
      status: {
        [Op.in]: ['confirmed', 'completed'],
      },
    };
    
    // Add optional filter for provider
    if (provider_id) whereClause.provider_id = provider_id;
    
    const reservations = await reservationService.getReservations({
      where: whereClause,
      includeRelations: true,
      order: [['start_time', 'ASC']],
    });
    
    // Sanitize reservation data - remove sensitive information
    const sanitizedReservations = reservations.map(reservation => {
      const res = reservation.toJSON ? reservation.toJSON() : reservation;
      
      return {
        reservation_id: res.reservation_id,
        provider_id: res.provider_id,
        service_id: res.service_id,
        start_time: res.start_time,
        end_time: res.end_time,
        status: res.status,
        provider: res.provider ? {
          provider_id: res.provider.provider_id,
          first_name: res.provider.first_name,
          last_name: res.provider.last_name,
          title: res.provider.title,
        } : null,
        service: res.service ? {
          service_id: res.service.service_id,
          name: res.service.name,
          description: res.service.description,
          duration_minutes: res.service.duration_minutes,
          price: res.service.price,
        } : null,
      };
    });
    
    // Fetch all active services (public info)
    const allServices = await serviceService.getServices({
      where: { is_active: true },
    });
    
    // Sanitize services (remove any internal fields if needed)
    const sanitizedServices = allServices.map(service => {
      const s = service.toJSON ? service.toJSON() : service;
      return {
        service_id: s.service_id,
        name: s.name,
        description: s.description,
        duration_minutes: s.duration_minutes,
        price: s.price,
      };
    });
    
    res.json({
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      count: sanitizedReservations.length,
      reservations: sanitizedReservations,
      services: sanitizedServices,
    });
  } catch (error) {
    console.error('Error fetching public reservations by date range:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
}

/**
 * Create a new reservation
 */
async function createReservation(req, res) {
  try {
    const { user_id, provider_id, service_id, start_time, notes } = req.body;

    // Validate required fields
    if (!user_id || !provider_id || !service_id || !start_time) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, provider_id, service_id, and start_time are required',
      });
    }

    // Parse start time
    const startTime = new Date(start_time);

    // Validate if the date is valid
    if (isNaN(startTime.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format for start_time',
      });
    }

    // Validate that reservation is not in the past
    const now = new Date();
    if (startTime < now) {
      return res.status(400).json({
        error: 'Cannot create reservations for past dates or times',
      });
    }

    // Validate if time is on the hour or half-hour
    if (!isValidTimeSlot(startTime)) {
      return res.status(400).json({
        error: 'Reservation time must be on the hour (e.g., 9:00) or half-hour (e.g., 9:30)',
      });
    }

    // Get service details to calculate end time and price
    const service = await serviceService.getServiceById(service_id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (!service.is_active) {
      return res.status(400).json({ error: 'Service is not currently available' });
    }

    // Calculate end time based on service duration
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + service.duration_minutes);

    // Validate business hours
    const businessHoursCheck = isWithinBusinessHours(startTime, endTime);
    if (!businessHoursCheck.valid) {
      return res.status(400).json({ error: businessHoursCheck.message });
    }

    // Check for 1-hour gap between reservations
    const hasGap = await hasOneHourGap(provider_id, startTime, endTime);
    if (!hasGap) {
      return res.status(400).json({
        error: 'There must be at least 1 hour gap between reservations for this provider',
      });
    }

    // Create the reservation
    const reservation = await reservationService.createReservation({
      user_id,
      provider_id,
      service_id,
      start_time: startTime,
      end_time: endTime,
      total_price: service.price,
      notes,
      status: 'confirmed',
    });

    // Fetch the complete reservation with relations
    const completeReservation = await reservationService.getReservationById(
      reservation.reservation_id,
      { includeRelations: true }
    );

    res.status(201).json(completeReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation', details: error.message });
  }
}

/**
 * Get all reservations (with optional filters)
 */
async function getReservations(req, res) {
  try {
    const { user_id, provider_id, service_id, status, limit, offset } = req.query;

    const whereClause = {};
    if (user_id) whereClause.user_id = user_id;
    if (provider_id) whereClause.provider_id = provider_id;
    if (service_id) whereClause.service_id = service_id;
    if (status) whereClause.status = status;

    const reservations = await reservationService.getReservations({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      includeRelations: true,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [['start_time', 'ASC']],
    });

    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
}

/**
 * Get all reservations for a specific user
 */
async function getUserReservations(req, res) {
  try {
    const { userId } = req.params;
    const { provider_id, service_id, status, limit, offset } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Build where clause with user_id and optional filters
    const whereClause = { user_id: userId };
    if (provider_id) whereClause.provider_id = provider_id;
    if (service_id) whereClause.service_id = service_id;
    if (status) whereClause.status = status;

    const reservations = await reservationService.getReservations({
      where: whereClause,
      includeRelations: true,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [['start_time', 'DESC']], // Most recent first
    });

    res.json(reservations);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ error: 'Failed to fetch user reservations' });
  }
}

/**
 * Get a single reservation by ID
 */
async function getReservationById(req, res) {
  try {
    const { id } = req.params;

    const reservation = await reservationService.getReservationById(id, {
      includeRelations: true,
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
}

/**
 * Update a reservation
 */
async function updateReservation(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Fetch existing reservation
    const existingReservation = await reservationService.getReservationById(id);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // If updating start_time, validate it
    if (updates.start_time) {
      const newStartTime = new Date(updates.start_time);

      // Validate if the date is valid
      if (isNaN(newStartTime.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format for start_time',
        });
      }

      // Validate that reservation is not in the past
      const now = new Date();
      if (newStartTime < now) {
        return res.status(400).json({
          error: 'Cannot update reservation to a past date or time',
        });
      }

      // Validate if time is on the hour or half-hour
      if (!isValidTimeSlot(newStartTime)) {
        return res.status(400).json({
          error: 'Reservation time must be on the hour (e.g., 9:00) or half-hour (e.g., 9:30)',
        });
      }

      // If service_id is being updated too, fetch new service, otherwise use existing
      const serviceId = updates.service_id || existingReservation.service_id;
      const service = await serviceService.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Calculate new end time
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + service.duration_minutes);

      // Validate business hours
      const businessHoursCheck = isWithinBusinessHours(newStartTime, newEndTime);
      if (!businessHoursCheck.valid) {
        return res.status(400).json({ error: businessHoursCheck.message });
      }

      // Check for 1-hour gap (excluding this reservation)
      const providerId = updates.provider_id || existingReservation.provider_id;
      const hasGap = await hasOneHourGap(providerId, newStartTime, newEndTime, id);
      if (!hasGap) {
        return res.status(400).json({
          error: 'There must be at least 1 hour gap between reservations for this provider',
        });
      }

      // Update end_time and total_price based on new calculations
      updates.end_time = newEndTime;
      updates.total_price = service.price;
    }

    // If only service_id is updated (without start_time)
    if (updates.service_id && !updates.start_time) {
      const service = await serviceService.getServiceById(updates.service_id);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Recalculate end_time based on existing start_time
      const newEndTime = new Date(existingReservation.start_time);
      newEndTime.setMinutes(newEndTime.getMinutes() + service.duration_minutes);

      // Validate business hours
      const businessHoursCheck = isWithinBusinessHours(
        existingReservation.start_time,
        newEndTime
      );
      if (!businessHoursCheck.valid) {
        return res.status(400).json({ error: businessHoursCheck.message });
      }

      updates.end_time = newEndTime;
      updates.total_price = service.price;
    }

    const updatedReservation = await reservationService.updateReservation(id, updates);

    // Fetch complete reservation with relations
    const completeReservation = await reservationService.getReservationById(id, {
      includeRelations: true,
    });

    res.json(completeReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Failed to update reservation', details: error.message });
  }
}

/**
 * Delete a reservation
 */
async function deleteReservation(req, res) {
  try {
    const { id } = req.params;

    const deleted = await reservationService.deleteReservation(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
}

module.exports = {
  createReservation,
  getReservations,
  getReservationById,
  getUserReservations,
  getReservationsByDateRange,
  getPublicReservationsByDateRange,
  updateReservation,
  deleteReservation,
};

