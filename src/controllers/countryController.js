const countryService = require('../services/countryService');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Get all countries (sanitized for public use)
 */
const getCountriesList = asyncHandler(async (req, res) => {
  try {
    const countries = await countryService.getAllCountries();
    
    return res.json({
      count: countries.length,
      countries: countries,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return res.status(500).json({
      error: 'Failed to fetch countries',
    });
  }
});

module.exports = {
  getCountriesList,
};

