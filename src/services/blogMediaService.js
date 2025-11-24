const { BlogMedia } = require('../models');

function sanitizeMedia(mediaInstance) {
  if (!mediaInstance) {
    return null;
  }

  return mediaInstance.get ? mediaInstance.get({ plain: true }) : { ...mediaInstance };
}

async function createMedia(blogId, payload) {
  const media = await BlogMedia.create({
    ...payload,
    blog_id: blogId,
  });

  return sanitizeMedia(media);
}

async function getMediaById(mediaId) {
  const media = await BlogMedia.findByPk(mediaId);
  return sanitizeMedia(media);
}

async function listMediaForBlog(blogId) {
  const media = await BlogMedia.findAll({
    where: { blog_id: blogId },
  });

  return media.map(sanitizeMedia);
}

async function deleteMedia(mediaId) {
  const deletedCount = await BlogMedia.destroy({
    where: { media_id: mediaId },
  });

  return deletedCount > 0;
}

module.exports = {
  createMedia,
  getMediaById,
  listMediaForBlog,
  deleteMedia,
};
