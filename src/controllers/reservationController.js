const reservationService = require('../services/reservationService');
const serviceService = require('../services/serviceService');
const serviceVariantService = require('../services/serviceVariantService');
const userService = require('../services/userService');
const providerService = require('../services/providerService');
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
    const { start_date, end_date, provider_id, user_id, variant_id, service_id } = req.query;
    
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
    if (variant_id) whereClause.variant_id = variant_id;
    if (service_id) whereClause['$variant.service_id$'] = service_id;
    
    const reservations = await reservationService.getReservations({
      where: whereClause,
      includeRelations: true,
      order: [['start_time', 'ASC']],
    });
    
    // Fetch all services, variants, and users
    const services = await serviceService.getServices({
      includeVariants: true,
      where: { is_active: true },
      order: [['service_id', 'ASC']],
    });

    const variants = await serviceVariantService.getVariants({
      includeService: true,
      where: { is_active: true },
      order: [['service_id', 'ASC']],
    });
    
    const allUsers = await userService.getUsers();
    
    res.json({
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      count: reservations.length,
      reservations,
      services,
      variants,
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
    const { start_date, end_date, provider_id, variant_id, service_id } = req.query;
    
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
    
    // Add optional filters
    if (provider_id) whereClause.provider_id = provider_id;
    if (variant_id) whereClause.variant_id = variant_id;
    if (service_id) whereClause['$variant.service_id$'] = service_id;
    
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
        variant_id: res.variant_id,
        start_time: res.start_time,
        end_time: res.end_time,
        status: res.status,
        provider: res.provider ? {
          provider_id: res.provider.provider_id,
          first_name: res.provider.first_name,
          last_name: res.provider.last_name,
          title: res.provider.title,
        } : null,
        variant: res.variant
          ? {
              variant_id: res.variant.variant_id,
              service_id: res.variant.service_id,
              name: res.variant.name,
              duration_minutes: res.variant.duration_minutes,
              price: res.variant.price,
              service: res.variant.service
                ? {
                    service_id: res.variant.service.service_id,
                    name: res.variant.service.name,
                    description: res.variant.service.description,
                  }
                : null,
            }
          : null,
      };
    });
    
    // Fetch all active services with variants (public info)
    const allServices = await serviceService.getServices({
      includeVariants: true,
      where: { is_active: true },
      order: [['service_id', 'ASC']],
    });
    
    // Sanitize services (remove any internal fields if needed)
    const sanitizedServices = allServices.map(service => {
      const s = service.toJSON ? service.toJSON() : service;
      return {
        service_id: s.service_id,
        name: s.name,
        description: s.description,
        is_active: s.is_active,
        variants: (s.variants || []).map((variant) => ({
          variant_id: variant.variant_id,
          name: variant.name,
          duration_minutes: variant.duration_minutes,
          price: variant.price,
          is_active: variant.is_active,
        })),
      };
    });
    
    // Fetch all providers (public info)
    const allProviders = await providerService.getProviders();
    
    // Sanitize providers (show only public information)
    const sanitizedProviders = allProviders.map(provider => {
      const p = provider.toJSON ? provider.toJSON() : provider;
      return {
        provider_id: p.provider_id,
        first_name: p.first_name,
        last_name: p.last_name,
        title: p.title,
        email: p.email,
        phone: p.phone,
        bio: p.bio,
        profile_image_url: p.profile_image_url,
        is_active: p.is_active,
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
      providers: sanitizedProviders,
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
    const { user_id, provider_id, variant_id, start_time, notes, user_package_item_id } = req.body;

    // Validate required fields
    if (!user_id || !provider_id || !variant_id || !start_time) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, provider_id, variant_id, and start_time are required',
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

    // Get variant details to calculate end time and validate status
    const variant = await serviceVariantService.getVariantById(variant_id, {
      includeService: true,
    });
    if (!variant) {
      return res.status(404).json({ error: 'Service variant not found' });
    }

    if (!variant.is_active || (variant.service && variant.service.is_active === false)) {
      return res.status(400).json({ error: 'Service variant is not currently available' });
    }

    // Calculate end time based on variant duration
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + variant.duration_minutes);

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
      variant_id,
      start_time: startTime,
      end_time: endTime,
      user_package_item_id: user_package_item_id || null,
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
    const { user_id, provider_id, variant_id, service_id, status, limit, offset } = req.query;

    const whereClause = {};
    if (user_id) whereClause.user_id = user_id;
    if (provider_id) whereClause.provider_id = provider_id;
    if (variant_id) whereClause.variant_id = variant_id;
    if (service_id) whereClause['$variant.service_id$'] = service_id;
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
    const { provider_id, variant_id, service_id, status, limit, offset } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Build where clause with user_id and optional filters
    const whereClause = { user_id: userId };
    if (provider_id) whereClause.provider_id = provider_id;
    if (variant_id) whereClause.variant_id = variant_id;
    if (service_id) whereClause['$variant.service_id$'] = service_id;
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
 * Get all reservations for the authenticated user (from token)
 */
async function getMyReservations(req, res) {
  try {
    // Get user_id from authenticated user
    const userId = req.user.id;
    const { provider_id, variant_id, service_id, status, limit, offset } = req.query;

    // Build where clause with user_id and optional filters
    const whereClause = { user_id: userId };
    if (provider_id) whereClause.provider_id = provider_id;
    if (variant_id) whereClause.variant_id = variant_id;
    if (service_id) whereClause['$variant.service_id$'] = service_id;
    if (status) whereClause.status = status;

    const reservations = await reservationService.getReservations({
      where: whereClause,
      includeRelations: true,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [['start_time', 'DESC']], // Most recent first
    });

    res.json({
      count: reservations.length,
      reservations: reservations,
    });
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
    const existingReservation = await reservationService.getReservationById(id, {
      includeRelations: true,
    });
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

      // If variant_id is being updated too, fetch new variant, otherwise use existing
      const variantId = updates.variant_id || existingReservation.variant_id;
      const variant = await serviceVariantService.getVariantById(variantId, {
        includeService: true,
      });
      if (!variant) {
        return res.status(404).json({ error: 'Service variant not found' });
      }

      if (!variant.is_active || (variant.service && variant.service.is_active === false)) {
        return res.status(400).json({ error: 'Service variant is not currently available' });
      }

      // Calculate new end time
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + variant.duration_minutes);

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

      // Update end_time based on new calculations
      updates.end_time = newEndTime;
    }

    // If only variant_id is updated (without start_time)
    if (updates.variant_id && !updates.start_time) {
      const variant = await serviceVariantService.getVariantById(updates.variant_id, {
        includeService: true,
      });
      if (!variant) {
        return res.status(404).json({ error: 'Service variant not found' });
      }

      if (!variant.is_active || (variant.service && variant.service.is_active === false)) {
        return res.status(400).json({ error: 'Service variant is not currently available' });
      }

      // Recalculate end_time based on existing start_time
      const newEndTime = new Date(existingReservation.start_time);
      newEndTime.setMinutes(newEndTime.getMinutes() + variant.duration_minutes);

      // Validate business hours
      const businessHoursCheck = isWithinBusinessHours(
        existingReservation.start_time,
        newEndTime
      );
      if (!businessHoursCheck.valid) {
        return res.status(400).json({ error: businessHoursCheck.message });
      }

      updates.end_time = newEndTime;
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

/**
 * Get pending reservations
 * Optionally filter by provider_id, user_id, variant_id, or service_id
 */
async function getPendingReservations(req, res) {
  try {
    const { provider_id, user_id, variant_id, service_id, limit, offset } = req.query;
    
    // Build where clause for pending reservations
    const whereClause = {
      status: 'pending',
    };
    
    // Add optional filters
    if (provider_id) whereClause.provider_id = provider_id;
    if (user_id) whereClause.user_id = user_id;
    if (variant_id) whereClause.variant_id = variant_id;
    if (service_id) whereClause['$variant.service_id$'] = service_id;
    
    // Get pending reservations
    const pendingReservations = await reservationService.getReservations({
      where: whereClause,
      includeRelations: true,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      order: [['start_time', 'ASC']],
    });
    
    res.json({
      count: pendingReservations.length,
      reservations: pendingReservations,
    });
  } catch (error) {
    console.error('Error fetching pending reservations:', error);
    res.status(500).json({ error: 'Failed to fetch pending reservations' });
  }
}

/**
 * Get pending reservations count
 * Optionally filter by provider_id
 */
async function getPendingReservationsCount(req, res) {
  try {
    const { provider_id, variant_id, service_id } = req.query;
    
    // Build where clause for pending reservations
    const whereClause = {
      status: 'pending',
    };
    
    // Add provider filter if specified
    if (provider_id) {
      whereClause.provider_id = provider_id;
    }
    if (variant_id) {
      whereClause.variant_id = variant_id;
    }
    if (service_id) {
      whereClause['$variant.service_id$'] = service_id;
    }
    
    // Get all pending reservations
    const pendingReservations = await reservationService.getReservations({
      where: whereClause,
      includeRelations: true,
      order: [['start_time', 'ASC']],
    });
    
    // Calculate total count
    const totalCount = pendingReservations.length;
    
    // Group counts by provider if no specific provider is requested
    let countsByProvider = [];
    if (!provider_id) {
      const providerCounts = {};
      
      pendingReservations.forEach(reservation => {
        const pId = reservation.provider_id;
        if (!providerCounts[pId]) {
          providerCounts[pId] = {
            provider_id: pId,
            count: 0,
            provider: reservation.provider ? {
              provider_id: reservation.provider.provider_id,
              first_name: reservation.provider.first_name,
              last_name: reservation.provider.last_name,
              title: reservation.provider.title,
            } : null,
          };
        }
        providerCounts[pId].count++;
      });
      
      countsByProvider = Object.values(providerCounts);
    }
    
    res.json({
      total_count: totalCount,
      provider_id: provider_id ? parseInt(provider_id) : null,
      counts_by_provider: provider_id ? undefined : countsByProvider,
      reservations: pendingReservations,
    });
  } catch (error) {
    console.error('Error fetching pending reservations count:', error);
    res.status(500).json({ error: 'Failed to fetch pending reservations count' });
  }
}

/**
 * Approve a pending reservation (change status to confirmed)
 */
async function approveReservation(req, res) {
  try {
    const { id } = req.params;

    // Fetch existing reservation
    const existingReservation = await reservationService.getReservationById(id);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check if reservation is pending
    if (existingReservation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot approve reservation with status '${existingReservation.status}'. Only pending reservations can be approved.` 
      });
    }

    // Update status to confirmed
    const updatedReservation = await reservationService.updateReservation(id, {
      status: 'confirmed',
    });

    // Fetch complete reservation with relations
    const completeReservation = await reservationService.getReservationById(id, {
      includeRelations: true,
    });

    res.json({
      message: 'Reservation approved successfully',
      reservation: completeReservation,
    });
  } catch (error) {
    console.error('Error approving reservation:', error);
    res.status(500).json({ error: 'Failed to approve reservation', details: error.message });
  }
}

/**
 * Reject a pending reservation (change status to cancelled)
 */
async function rejectReservation(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Fetch existing reservation
    const existingReservation = await reservationService.getReservationById(id);
    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check if reservation is pending
    if (existingReservation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot reject reservation with status '${existingReservation.status}'. Only pending reservations can be rejected.` 
      });
    }

    // Update status to cancelled
    const updateData = {
      status: 'cancelled',
    };

    // Add rejection reason to notes if provided
    if (reason) {
      const rejectionNote = `[REJECTED] ${reason}`;
      updateData.notes = existingReservation.notes 
        ? `${existingReservation.notes}\n${rejectionNote}`
        : rejectionNote;
    }

    const updatedReservation = await reservationService.updateReservation(id, updateData);

    // Fetch complete reservation with relations
    const completeReservation = await reservationService.getReservationById(id, {
      includeRelations: true,
    });

    res.json({
      message: 'Reservation rejected successfully',
      reservation: completeReservation,
    });
  } catch (error) {
    console.error('Error rejecting reservation:', error);
    res.status(500).json({ error: 'Failed to reject reservation', details: error.message });
  }
}

/**
 * Create a reservation request (with pending status)
 * This is for authenticated users to request reservations
 */
async function createReservationRequest(req, res) {
  try {
    const { provider_id, variant_id, start_time, notes, user_package_item_id } = req.body;
    
    // Get user_id from authenticated user
    const user_id = req.user.id;

    // Validate required fields
    if (!provider_id || !variant_id || !start_time) {
      return res.status(400).json({
        error: 'Missing required fields: provider_id, variant_id, and start_time are required',
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

    // Get variant details to calculate end time and validate status
    const variant = await serviceVariantService.getVariantById(variant_id, {
      includeService: true,
    });
    if (!variant) {
      return res.status(404).json({ error: 'Service variant not found' });
    }

    if (!variant.is_active || (variant.service && variant.service.is_active === false)) {
      return res.status(400).json({ error: 'Service variant is not currently available' });
    }

    // Calculate end time based on variant duration
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + variant.duration_minutes);

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

    // Create the reservation with pending status
    const reservation = await reservationService.createReservation({
      user_id,
      provider_id,
      variant_id,
      start_time: startTime,
      end_time: endTime,
      user_package_item_id: user_package_item_id || null,
      notes,
      status: 'pending', // Different from createReservation - this is pending
    });

    // Fetch the complete reservation with relations
    const completeReservation = await reservationService.getReservationById(
      reservation.reservation_id,
      { includeRelations: true }
    );

    res.status(201).json(completeReservation);
  } catch (error) {
    console.error('Error creating reservation request:', error);
    res.status(500).json({ error: 'Failed to create reservation request', details: error.message });
  }
}

module.exports = {
  createReservation,
  getReservations,
  getReservationById,
  getUserReservations,
  getMyReservations,
  getReservationsByDateRange,
  getPublicReservationsByDateRange,
  updateReservation,
  deleteReservation,
  getPendingReservations,
  getPendingReservationsCount,
  approveReservation,
  rejectReservation,
  createReservationRequest,
};

