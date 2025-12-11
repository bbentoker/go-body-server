const decisionTreeService = require('../services/decisionTreeService');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Create a new decision tree (Admin only)
 * POST /api/admin/decision-trees
 */
const createDecisionTree = asyncHandler(async (req, res) => {
  const { tree_data, treeData } = req.body;
  const data = tree_data || treeData;

  if (!data) {
    return res.status(400).json({
      message: 'Missing required field: tree_data or treeData',
    });
  }

  // Validate tree structure
  if (!data.startNodeId || !data.nodes || !data.edges) {
    return res.status(400).json({
      message: 'Invalid tree structure. Required: startNodeId, nodes, edges',
    });
  }

  const createdBy = parseInt(req.user?.id, 10);
  if (isNaN(createdBy)) {
    return res.status(401).json({ message: 'Invalid user credentials' });
  }

  const tree = await decisionTreeService.createDecisionTree(data, createdBy);
  return res.status(201).json(tree);
});

/**
 * List all decision trees (Admin only)
 * GET /api/admin/decision-trees
 */
const listDecisionTrees = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || undefined;
  const offset = parseInt(req.query.offset, 10) || undefined;

  const trees = await decisionTreeService.getDecisionTrees({ limit, offset });
  return res.json(trees);
});

/**
 * Get a decision tree by ID (Admin only)
 * GET /api/admin/decision-trees/:treeId
 */
const getDecisionTreeById = asyncHandler(async (req, res) => {
  const treeId = parseInt(req.params.treeId, 10);
  if (isNaN(treeId)) {
    return res.status(400).json({ message: 'Invalid tree ID' });
  }

  const tree = await decisionTreeService.getDecisionTreeById(treeId);
  if (!tree) {
    return res.status(404).json({ message: 'Decision tree not found' });
  }

  return res.json(tree);
});

/**
 * Get the latest active decision tree (Public)
 * GET /api/public/decision-tree
 */
const getLatestDecisionTree = asyncHandler(async (req, res) => {
  const tree = await decisionTreeService.getLatestActiveTree();

  if (!tree) {
    return res.status(404).json({ message: 'No decision tree available' });
  }

  // Return only the necessary data for public consumption
  return res.json({
    tree_id: tree.tree_id,
    version: tree.version,
    tree_data: tree.tree_data,
  });
});

/**
 * Submit answers to a decision tree (Authenticated users)
 * POST /api/public/decision-tree-submission
 */
const createSubmission = asyncHandler(async (req, res) => {
  const { tree_id, treeId, path, result } = req.body;
  const resolvedTreeId = tree_id || treeId;

  // Validate required fields
  if (!resolvedTreeId) {
    return res.status(400).json({ message: 'Missing required field: tree_id' });
  }
  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ message: 'Missing or invalid field: path (must be an array)' });
  }
  if (!result || typeof result !== 'object') {
    return res.status(400).json({ message: 'Missing or invalid field: result (must be an object)' });
  }

  // Validate path structure
  for (const step of path) {
    if (typeof step.stepIndex !== 'number' || !step.nodeId || !step.selectedAnswerId) {
      return res.status(400).json({
        message: 'Invalid path step structure. Required: stepIndex, nodeId, selectedAnswerId',
      });
    }
  }

  // Validate result structure
  if (!result.nodeId || !result.type) {
    return res.status(400).json({
      message: 'Invalid result structure. Required: nodeId, type',
    });
  }

  const userId = parseInt(req.user?.id, 10);
  if (isNaN(userId)) {
    return res.status(401).json({ message: 'Invalid user credentials' });
  }

  // Verify tree exists
  const tree = await decisionTreeService.getDecisionTreeById(resolvedTreeId);
  if (!tree) {
    return res.status(404).json({ message: 'Decision tree not found' });
  }

  const submission = await decisionTreeService.createSubmission(
    resolvedTreeId,
    userId,
    path,
    result
  );

  return res.status(201).json(submission);
});

/**
 * Get submissions for a specific tree (Admin only)
 * GET /api/admin/decision-trees/:treeId/submissions
 */
const getTreeSubmissions = asyncHandler(async (req, res) => {
  const treeId = parseInt(req.params.treeId, 10);
  if (isNaN(treeId)) {
    return res.status(400).json({ message: 'Invalid tree ID' });
  }

  const limit = parseInt(req.query.limit, 10) || undefined;
  const offset = parseInt(req.query.offset, 10) || undefined;

  const submissions = await decisionTreeService.getSubmissionsByTreeId(treeId, { limit, offset });
  return res.json(submissions);
});

/**
 * Get logged-in user's own submissions (Authenticated users)
 * GET /api/public/my-decision-tree-submissions
 */
const getMySubmissions = asyncHandler(async (req, res) => {
  const userId = parseInt(req.user?.id, 10);
  if (isNaN(userId)) {
    return res.status(401).json({ message: 'Invalid user credentials' });
  }

  const limit = parseInt(req.query.limit, 10) || undefined;
  const offset = parseInt(req.query.offset, 10) || undefined;

  const submissions = await decisionTreeService.getSubmissionsByUserId(userId, { limit, offset });
  return res.json(submissions);
});

module.exports = {
  createDecisionTree,
  listDecisionTrees,
  getDecisionTreeById,
  getLatestDecisionTree,
  createSubmission,
  getTreeSubmissions,
  getMySubmissions,
};

