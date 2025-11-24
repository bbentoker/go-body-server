const express = require('express');
const multer = require('multer');

const blogController = require('../controllers/blogController');
const { authenticateToken, authenticateProvider } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

router.get('/', blogController.listBlogs);
router.get('/:blogId', blogController.getBlogById);

router.post('/', authenticateToken, authenticateProvider, blogController.createBlog);
router.put('/:blogId', authenticateToken, authenticateProvider, blogController.updateBlog);
router.delete('/:blogId', authenticateToken, authenticateProvider, blogController.deleteBlog);

router.post(
  '/:blogId/media',
  authenticateToken,
  authenticateProvider,
  upload.single('file'),
  blogController.uploadMedia
);

module.exports = router;
