const languageService = require('../services/languageService');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Get all active languages
 */
const getActiveLanguages = asyncHandler(async (req, res) => {
  try {
    const languages = await languageService.getActiveLanguages();
    
    return res.json({
      count: languages.length,
      languages: languages,
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return res.status(500).json({
      error: 'Failed to fetch languages',
    });
  }
});

/**
 * Get all languages (including inactive)
 */
const getAllLanguages = asyncHandler(async (req, res) => {
  try {
    const languages = await languageService.getLanguages();
    
    return res.json({
      count: languages.length,
      languages: languages,
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return res.status(500).json({
      error: 'Failed to fetch languages',
    });
  }
});

module.exports = {
  getActiveLanguages,
  getAllLanguages,
};

