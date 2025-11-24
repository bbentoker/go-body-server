const { Blog, BlogMedia, Provider } = require('../models');

const defaultBlogInclude = [
  {
    model: Provider,
    as: 'provider',
    attributes: { exclude: ['password_hash'] },
  },
  {
    model: BlogMedia,
    as: 'media',
  },
];

function sanitizeBlog(blogInstance) {
  if (!blogInstance) {
    return null;
  }

  const blog = blogInstance.get ? blogInstance.get({ plain: true }) : { ...blogInstance };

  if (blog.provider && blog.provider.password_hash) {
    delete blog.provider.password_hash;
  }

  return blog;
}

function applyPublicationMetadata(payload, existingBlog) {
  const data = { ...payload };

  if (Object.prototype.hasOwnProperty.call(payload, 'is_published')) {
    const isPublished = payload.is_published;
    if (isPublished && !data.published_at && (!existingBlog || !existingBlog.published_at)) {
      data.published_at = new Date();
    }

    if (!isPublished) {
      data.published_at = null;
    }
  }

  return data;
}

async function createBlog(payload) {
  const preparedPayload = applyPublicationMetadata(payload);
  const blog = await Blog.create(preparedPayload);
  const createdBlog = await Blog.findByPk(blog.blog_id, { include: defaultBlogInclude });
  return sanitizeBlog(createdBlog);
}

async function getBlogs(options = {}) {
  const blogs = await Blog.findAll({
    include: options.includeMedia ? defaultBlogInclude : defaultBlogInclude.slice(0, 1),
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });

  return blogs.map(sanitizeBlog);
}

async function getBlogById(blogId, options = {}) {
  const blog = await Blog.findByPk(blogId, {
    include: options.includeMedia ? defaultBlogInclude : defaultBlogInclude.slice(0, 1),
  });

  return sanitizeBlog(blog);
}

async function updateBlog(blogId, updates) {
  const blog = await Blog.findByPk(blogId);
  if (!blog) {
    return null;
  }

  const preparedUpdates = applyPublicationMetadata(updates, blog);
  await blog.update(preparedUpdates);
  const updatedBlog = await Blog.findByPk(blogId, { include: defaultBlogInclude });
  return sanitizeBlog(updatedBlog);
}

async function deleteBlog(blogId) {
  const deletedCount = await Blog.destroy({
    where: { blog_id: blogId },
  });

  return deletedCount > 0;
}

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
};
