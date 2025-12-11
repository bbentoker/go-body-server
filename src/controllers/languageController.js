const languageService = require('../services/languageService');
const providerService = require('../services/providerService');

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

/**
 * Update logged-in admin provider's language preference
 */
const updateProviderLanguagePreference = asyncHandler(async (req, res) => {
  try {
    const { language_id } = req.body;
    const providerId = req.user.id;

    if (!language_id) {
      return res.status(400).json({
        error: 'language_id is required',
      });
    }

    // Verify that the language exists
    const language = await languageService.getLanguageById(language_id);
    if (!language) {
      return res.status(404).json({
        error: 'Language not found',
      });
    }

    // Update the provider's language preference
    const updatedProvider = await providerService.updateProvider(providerId, {
      language_id: language_id,
    });

    if (!updatedProvider) {
      return res.status(404).json({
        error: 'Provider not found',
      });
    }

    return res.json({
      message: 'Language preference updated successfully',
      provider: updatedProvider,
    });
  } catch (error) {
    console.error('Error updating provider language preference:', error);
    
    // Handle foreign key constraint violations
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        error: 'Invalid language_id',
      });
    }

    return res.status(500).json({
      error: 'Failed to update language preference',
    });
  }
});

module.exports = {
  getActiveLanguages,
  getAllLanguages,
  updateProviderLanguagePreference,
};

