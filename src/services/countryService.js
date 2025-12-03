const { Country } = require('../models');

/**
 * Get all countries (sanitized for public use)
 * Returns only essential fields: id, iso_code_2, name, iso_code_3, phone_code
 */
async function getAllCountries() {
  const countries = await Country.findAll({
    attributes: ['id', 'iso_code_2', 'name', 'iso_code_3', 'phone_code'],
    order: [['name', 'ASC']],
  });
  
  return countries;
}

/**
 * Get country by ID
 */
async function getCountryById(countryId) {
  return Country.findByPk(countryId);
}

/**
 * Get country by ISO code (2-letter)
 */
async function getCountryByIsoCode2(isoCode) {
  return Country.findOne({
    where: { iso_code_2: isoCode.toUpperCase() },
  });
}

module.exports = {
  getAllCountries,
  getCountryById,
  getCountryByIsoCode2,
};

