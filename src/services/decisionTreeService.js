const { DecisionTree, DecisionTreeSubmission, User } = require('../models');

/**
 * Generate the next version string based on existing trees
 * Returns 'v1', 'v2', etc.
 */
async function generateNextVersion() {
  const latestTree = await DecisionTree.findOne({
    order: [['tree_id', 'DESC']],
  });

  if (!latestTree) {
    return 'v1';
  }

  // Extract number from version string (e.g., 'v3' -> 3)
  const currentVersion = latestTree.version;
  const versionNumber = parseInt(currentVersion.replace('v', ''), 10) || 0;
  return `v${versionNumber + 1}`;
}

/**
 * Create a new decision tree with auto-generated version
 */
async function createDecisionTree(treeData, createdBy) {
  const version = await generateNextVersion();

  // Deactivate all existing trees before creating new one
  await DecisionTree.update(
    { is_active: false },
    { where: { is_active: true } }
  );

  const tree = await DecisionTree.create({
    version,
    tree_data: treeData,
    created_by: createdBy,
    is_active: true,
  });

  return getDecisionTreeById(tree.tree_id);
}

/**
 * Get all decision trees, ordered by creation date (latest first)
 */
async function getDecisionTrees(options = {}) {
  const trees = await DecisionTree.findAll({
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['user_id', 'first_name', 'last_name', 'email'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: options.limit,
    offset: options.offset,
  });

  return trees.map((tree) => tree.get({ plain: true }));
}

/**
 * Get a single decision tree by ID
 */
async function getDecisionTreeById(treeId) {
  const tree = await DecisionTree.findByPk(treeId, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['user_id', 'first_name', 'last_name', 'email'],
      },
    ],
  });

  return tree ? tree.get({ plain: true }) : null;
}

/**
 * Get the latest active decision tree (for public consumption)
 */
async function getLatestActiveTree() {
  const tree = await DecisionTree.findOne({
    where: { is_active: true },
    order: [['created_at', 'DESC']],
  });

  if (!tree) {
    // Fallback to the most recent tree if no active one
    const latestTree = await DecisionTree.findOne({
      order: [['created_at', 'DESC']],
    });
    return latestTree ? latestTree.get({ plain: true }) : null;
  }

  return tree.get({ plain: true });
}

/**
 * Create a submission for a decision tree
 */
async function createSubmission(treeId, userId, path, result) {
  const submission = await DecisionTreeSubmission.create({
    tree_id: treeId,
    user_id: userId,
    path,
    result,
    submitted_at: new Date(),
  });

  return getSubmissionById(submission.submission_id);
}

/**
 * Get a submission by ID
 */
async function getSubmissionById(submissionId) {
  const submission = await DecisionTreeSubmission.findByPk(submissionId, {
    include: [
      {
        model: DecisionTree,
        as: 'tree',
        attributes: ['tree_id', 'version'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['user_id', 'first_name', 'last_name', 'email'],
      },
    ],
  });

  return submission ? submission.get({ plain: true }) : null;
}

/**
 * Get submissions for a specific tree
 */
async function getSubmissionsByTreeId(treeId, options = {}) {
  const submissions = await DecisionTreeSubmission.findAll({
    where: { tree_id: treeId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['user_id', 'first_name', 'last_name', 'email'],
      },
    ],
    order: [['submitted_at', 'DESC']],
    limit: options.limit,
    offset: options.offset,
  });

  return submissions.map((s) => s.get({ plain: true }));
}

/**
 * Get submissions by user ID
 */
async function getSubmissionsByUserId(userId, options = {}) {
  const submissions = await DecisionTreeSubmission.findAll({
    where: { user_id: userId },
    include: [
      {
        model: DecisionTree,
        as: 'tree',
        attributes: ['tree_id', 'version'],
      },
    ],
    order: [['submitted_at', 'DESC']],
    limit: options.limit,
    offset: options.offset,
  });

  return submissions.map((s) => s.get({ plain: true }));
}

module.exports = {
  createDecisionTree,
  getDecisionTrees,
  getDecisionTreeById,
  getLatestActiveTree,
  createSubmission,
  getSubmissionById,
  getSubmissionsByTreeId,
  getSubmissionsByUserId,
};

