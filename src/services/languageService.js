const { Language } = require('../models');

async function createLanguage(payload) {
  return Language.create(payload);
}

async function getLanguageById(languageId) {
  return Language.findByPk(languageId);
}

async function getLanguages(options = {}) {
  return Language.findAll({
    where: options.where,
    order: options.order || [['name', 'ASC']],
  });
}

async function getActiveLanguages() {
  return Language.findAll({
    where: { is_active: true },
    order: [['name', 'ASC']],
  });
}

async function updateLanguage(languageId, updates) {
  const language = await Language.findByPk(languageId);
  if (!language) {
    return null;
  }

  await language.update(updates);
  return language;
}

async function deleteLanguage(languageId) {
  const deletedCount = await Language.destroy({
    where: { language_id: languageId },
  });

  return deletedCount > 0;
}

module.exports = {
  createLanguage,
  getLanguageById,
  getLanguages,
  getActiveLanguages,
  updateLanguage,
  deleteLanguage,
};

