const blogService = require('../services/blogService');
const blogMediaService = require('../services/blogMediaService');
const storageService = require('../services/storageService');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function parseIncludeMedia(req) {
  return req.query.includeMedia === 'true' || req.query.includeMedia === '1';
}

function getAuthenticatedProviderId(req) {
  const providerId = parseInt(req.user?.id, 10);
  return Number.isNaN(providerId) ? null : providerId;
}

function extractBlogPayload(body, overrides = {}, options = {}) {
  const fields = [
    'title',
    'content',
    'cover_image_url',
    'is_published',
    'published_at',
    'provider_id',
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

const createBlog = asyncHandler(async (req, res) => {
  const providerId = getAuthenticatedProviderId(req);
  if (providerId === null) {
    return res.status(401).json({ message: 'Invalid provider credentials' });
  }

  const { payload, missingRequired } = extractBlogPayload(
    req.body,
    { provider_id: providerId },
    {
      requiredFields: ['title', 'content', 'provider_id'],
      includeNull: false,
    }
  );

  if (missingRequired.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingRequired.join(', ')}`,
    });
  }

  const blog = await blogService.createBlog(payload);
  return res.status(201).json(blog);
});

const listBlogs = asyncHandler(async (req, res) => {
  const includeMedia = parseIncludeMedia(req);
  const where = {};

  if (req.query.providerId) {
    where.provider_id = req.query.providerId;
  }

  const blogs = await blogService.getBlogs({ includeMedia, where });
  return res.json(blogs);
});

const getBlogById = asyncHandler(async (req, res) => {
  const includeMedia = parseIncludeMedia(req);
  const blog = await blogService.getBlogById(req.params.blogId, { includeMedia });

  if (!blog) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  return res.json(blog);
});

const updateBlog = asyncHandler(async (req, res) => {
  const providerId = getAuthenticatedProviderId(req);
  if (providerId === null) {
    return res.status(401).json({ message: 'Invalid provider credentials' });
  }
  const blogId = req.params.blogId;

  const existing = await blogService.getBlogById(blogId, { includeMedia: false });
  if (!existing) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  const blogOwnerId = parseInt(existing.provider_id, 10);
  if (blogOwnerId !== providerId) {
    return res.status(403).json({ message: 'You can only update your own blogs' });
  }

  const { payload } = extractBlogPayload(req.body, {}, { includeNull: false });

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const updated = await blogService.updateBlog(blogId, payload);
  return res.json(updated);
});

const deleteBlog = asyncHandler(async (req, res) => {
  const providerId = getAuthenticatedProviderId(req);
  if (providerId === null) {
    return res.status(401).json({ message: 'Invalid provider credentials' });
  }
  const blogId = req.params.blogId;

  const existing = await blogService.getBlogById(blogId, { includeMedia: false });
  if (!existing) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  const blogOwnerId = parseInt(existing.provider_id, 10);
  if (blogOwnerId !== providerId) {
    return res.status(403).json({ message: 'You can only delete your own blogs' });
  }

  const deleted = await blogService.deleteBlog(blogId);

  if (!deleted) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  return res.status(204).send();
});

const uploadMedia = asyncHandler(async (req, res) => {
  const providerId = getAuthenticatedProviderId(req);
  if (providerId === null) {
    return res.status(401).json({ message: 'Invalid provider credentials' });
  }
  const blogId = req.params.blogId;
  const { file } = req;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const blog = await blogService.getBlogById(blogId, { includeMedia: false });
  if (!blog) {
    return res.status(404).json({ message: 'Blog not found' });
  }

  const blogOwnerId = parseInt(blog.provider_id, 10);
  if (blogOwnerId !== providerId) {
    return res.status(403).json({ message: 'You can only add media to your own blogs' });
  }

  const explicitType = typeof req.body.media_type === 'string'
    ? req.body.media_type.toLowerCase()
    : undefined;
  const derivedType = file.mimetype?.startsWith('video/') ? 'video' : 'image';
  const mediaType = explicitType === 'video' || explicitType === 'image'
    ? explicitType
    : derivedType;

  const folder = mediaType === 'video' ? 'videos' : 'images';
  const safeName = file.originalname
    ? file.originalname.replace(/[^\w.-]+/g, '-')
    : `${mediaType}-${Date.now()}`;
  const objectKey = `blogs/${blogId}/${folder}/${Date.now()}-${safeName}`;

  const uploadResult = await storageService.uploadBuffer(objectKey, file.buffer, {
    'Content-Type': file.mimetype,
    'Content-Length': file.size,
  });

  const mediaRecord = await blogMediaService.createMedia(blogId, {
    media_type: mediaType,
    object_key: uploadResult.objectKey,
    url: uploadResult.url,
    alt_text: req.body.alt_text,
  });

  return res.status(201).json(mediaRecord);
});

module.exports = {
  createBlog,
  listBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  uploadMedia,
};
