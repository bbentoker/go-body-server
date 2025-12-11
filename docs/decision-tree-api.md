# Decision Tree API Documentation

This document describes the API endpoints for the Decision Tree feature, designed for frontend implementation.

## Overview

The Decision Tree feature allows administrators to create interactive questionnaires that guide users through a series of questions to reach personalized recommendations. Users can navigate through the tree and submit their responses.

---

## Public Endpoints

### Get Latest Decision Tree

Retrieves the currently active decision tree for display to users.

**Endpoint:** `GET /api/public/decision-tree`

**Authentication:** Not required

**Response:**

```json
{
  "tree_id": 1,
  "version": "v1",
  "tree_data": {
    "startNodeId": "node-1",
    "nodes": {
      "node-1": {
        "id": "node-1",
        "type": "start",
        "text": "Start"
      },
      "node-2": {
        "id": "node-2",
        "type": "question",
        "text": "Who is this session for?",
        "question": "Who is this session for?",
        "answers": [
          {
            "id": "answer-1",
            "text": "Myself"
          },
          {
            "id": "answer-2",
            "text": "A family member"
          }
        ]
      },
      "node-3": {
        "id": "node-3",
        "type": "end",
        "text": "Relaxation Therapy"
      }
    },
    "edges": [
      {
        "from": "node-1",
        "to": "node-2"
      },
      {
        "from": "node-2",
        "to": "node-3",
        "answerId": "answer-1"
      }
    ]
  }
}
```

**Error Responses:**
- `404` - No decision tree available

---

### Submit Decision Tree Response

Submits the user's path through the decision tree along with the final result.

**Endpoint:** `POST /api/public/decision-tree-submission`

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "tree_id": 1,
  "path": [
    {
      "stepIndex": 0,
      "nodeId": "node-2",
      "questionText": "Who is this session for?",
      "selectedAnswerId": "answer-1",
      "selectedAnswerText": "Myself"
    },
    {
      "stepIndex": 1,
      "nodeId": "node-4",
      "questionText": "What type of session are you looking for?",
      "selectedAnswerId": "answer-5",
      "selectedAnswerText": "Relaxation"
    }
  ],
  "result": {
    "nodeId": "node-6",
    "title": "Relaxation Therapy",
    "type": "end"
  }
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tree_id` | integer | Yes | The ID of the decision tree being answered |
| `path` | array | Yes | Array of steps taken through the tree |
| `path[].stepIndex` | integer | Yes | Zero-based index of the step |
| `path[].nodeId` | string | Yes | ID of the question node |
| `path[].questionText` | string | No | Text of the question (for record-keeping) |
| `path[].selectedAnswerId` | string | Yes | ID of the selected answer |
| `path[].selectedAnswerText` | string | No | Text of the selected answer |
| `result` | object | Yes | The final endpoint node reached |
| `result.nodeId` | string | Yes | ID of the end node |
| `result.title` | string | No | Title/text of the end node |
| `result.type` | string | Yes | Node type (should be "end") |

**Success Response (201):**

```json
{
  "submission_id": 42,
  "tree_id": 1,
  "user_id": 123,
  "path": [...],
  "result": {...},
  "submitted_at": "2025-12-11T14:30:00.000Z",
  "tree": {
    "tree_id": 1,
    "version": "v1"
  },
  "user": {
    "user_id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Invalid request body (missing required fields or invalid structure)
- `401` - Authentication required
- `404` - Decision tree not found

---

### Get My Submissions

Retrieves the logged-in user's own decision tree submissions.

**Endpoint:** `GET /api/public/my-decision-tree-submissions`

**Authentication:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Maximum number of results |
| `offset` | integer | Number of results to skip |

**Success Response (200):**

```json
[
  {
    "submission_id": 42,
    "tree_id": 1,
    "user_id": 123,
    "path": [
      {
        "stepIndex": 0,
        "nodeId": "node-2",
        "questionText": "Who is this session for?",
        "selectedAnswerId": "answer-1",
        "selectedAnswerText": "Myself"
      }
    ],
    "result": {
      "nodeId": "node-6",
      "title": "Relaxation Therapy",
      "type": "end"
    },
    "submitted_at": "2025-12-11T14:30:00.000Z",
    "tree": {
      "tree_id": 1,
      "version": "v1"
    }
  }
]
```

**Error Responses:**
- `401` - Authentication required

---

## Admin Endpoints

All admin endpoints require admin authentication.

### Create Decision Tree

Creates a new decision tree with auto-generated version.

**Endpoint:** `POST /api/admin/decision-trees`

**Authentication:** Admin required

**Request Body:**

```json
{
  "tree_data": {
    "startNodeId": "node-1",
    "nodes": {
      "node-1": {
        "id": "node-1",
        "type": "start",
        "text": "Start"
      },
      "node-2": {
        "id": "node-2",
        "type": "question",
        "text": "Sample question?",
        "question": "Sample question?",
        "answers": [
          { "id": "answer-1", "text": "Option A" },
          { "id": "answer-2", "text": "Option B" }
        ]
      },
      "node-3": {
        "id": "node-3",
        "type": "end",
        "text": "Result A"
      },
      "node-4": {
        "id": "node-4",
        "type": "end",
        "text": "Result B"
      }
    },
    "edges": [
      { "from": "node-1", "to": "node-2" },
      { "from": "node-2", "to": "node-3", "answerId": "answer-1" },
      { "from": "node-2", "to": "node-4", "answerId": "answer-2" }
    ]
  }
}
```

**Success Response (201):**

```json
{
  "tree_id": 2,
  "version": "v2",
  "tree_data": {...},
  "created_by": 1,
  "is_active": true,
  "created_at": "2025-12-11T14:30:00.000Z",
  "updated_at": "2025-12-11T14:30:00.000Z",
  "creator": {
    "user_id": 1,
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@example.com"
  }
}
```

**Notes:**
- Version is auto-generated as "v1", "v2", etc.
- Creating a new tree automatically sets it as the active tree and deactivates previous ones

---

### List Decision Trees

Retrieves all decision trees, ordered by creation date (latest first).

**Endpoint:** `GET /api/admin/decision-trees`

**Authentication:** Admin required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Maximum number of results |
| `offset` | integer | Number of results to skip |

**Success Response (200):**

```json
[
  {
    "tree_id": 2,
    "version": "v2",
    "tree_data": {...},
    "created_by": 1,
    "is_active": true,
    "created_at": "2025-12-11T14:30:00.000Z",
    "updated_at": "2025-12-11T14:30:00.000Z",
    "creator": {
      "user_id": 1,
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@example.com"
    }
  },
  {
    "tree_id": 1,
    "version": "v1",
    "tree_data": {...},
    "created_by": 1,
    "is_active": false,
    "created_at": "2025-12-10T10:00:00.000Z",
    "updated_at": "2025-12-11T14:30:00.000Z",
    "creator": {...}
  }
]
```

---

### Get Decision Tree by ID

Retrieves a specific decision tree by its ID.

**Endpoint:** `GET /api/admin/decision-trees/:treeId`

**Authentication:** Admin required

**Success Response (200):**

```json
{
  "tree_id": 1,
  "version": "v1",
  "tree_data": {...},
  "created_by": 1,
  "is_active": false,
  "created_at": "2025-12-10T10:00:00.000Z",
  "updated_at": "2025-12-11T14:30:00.000Z",
  "creator": {...}
}
```

**Error Responses:**
- `400` - Invalid tree ID
- `404` - Decision tree not found

---

### Get Tree Submissions

Retrieves all submissions for a specific decision tree.

**Endpoint:** `GET /api/admin/decision-trees/:treeId/submissions`

**Authentication:** Admin required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Maximum number of results |
| `offset` | integer | Number of results to skip |

**Success Response (200):**

```json
[
  {
    "submission_id": 42,
    "tree_id": 1,
    "user_id": 123,
    "path": [
      {
        "stepIndex": 0,
        "nodeId": "node-2",
        "questionText": "Who is this session for?",
        "selectedAnswerId": "answer-1",
        "selectedAnswerText": "Myself"
      }
    ],
    "result": {
      "nodeId": "node-6",
      "title": "Relaxation Therapy",
      "type": "end"
    },
    "submitted_at": "2025-12-11T14:30:00.000Z",
    "user": {
      "user_id": 123,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    }
  }
]
```

---

## Tree Data Structure

### Node Types

| Type | Description |
|------|-------------|
| `start` | Entry point of the tree (exactly one per tree) |
| `question` | A question with multiple answer options |
| `end` | Terminal node representing a recommendation/result |

### Node Object (Question Type)

```json
{
  "id": "node-2",
  "type": "question",
  "text": "Display text for the node",
  "question": "The question to ask the user",
  "answers": [
    {
      "id": "answer-unique-id",
      "text": "Answer option text"
    }
  ]
}
```

### Edge Object

```json
{
  "from": "source-node-id",
  "to": "target-node-id",
  "answerId": "answer-id-that-triggers-this-edge"
}
```

**Notes:**
- Edges from `start` nodes don't require `answerId`
- Edges from `question` nodes must have `answerId` to specify which answer leads to which node

---

## Frontend Implementation Guide

### 1. Loading the Tree

```javascript
async function loadDecisionTree() {
  const response = await fetch('/api/public/decision-tree');
  if (!response.ok) {
    throw new Error('No decision tree available');
  }
  return response.json();
}
```

### 2. Navigation Logic

```javascript
function findNextNode(tree, currentNodeId, selectedAnswerId) {
  const { edges } = tree.tree_data;
  
  // Find the edge that matches the current node and selected answer
  const edge = edges.find(e => 
    e.from === currentNodeId && 
    (e.answerId === selectedAnswerId || !e.answerId)
  );
  
  if (!edge) return null;
  
  return tree.tree_data.nodes[edge.to];
}
```

### 3. Tracking the Path

```javascript
const path = [];

function recordStep(stepIndex, node, selectedAnswer) {
  path.push({
    stepIndex,
    nodeId: node.id,
    questionText: node.question || node.text,
    selectedAnswerId: selectedAnswer.id,
    selectedAnswerText: selectedAnswer.text
  });
}
```

### 4. Submitting Results

```javascript
async function submitDecisionTreeResult(treeId, path, endNode, token) {
  const response = await fetch('/api/public/decision-tree-submission', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tree_id: treeId,
      path: path,
      result: {
        nodeId: endNode.id,
        title: endNode.text,
        type: endNode.type
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}
```

### 5. Complete Flow Example

```javascript
class DecisionTreeNavigator {
  constructor() {
    this.tree = null;
    this.currentNode = null;
    this.path = [];
    this.stepIndex = 0;
  }

  async initialize() {
    this.tree = await loadDecisionTree();
    const startNodeId = this.tree.tree_data.startNodeId;
    this.currentNode = this.tree.tree_data.nodes[startNodeId];
    
    // Auto-advance past the start node
    this.advanceFromStart();
  }

  advanceFromStart() {
    if (this.currentNode.type === 'start') {
      this.currentNode = findNextNode(this.tree, this.currentNode.id, null);
    }
  }

  selectAnswer(answer) {
    // Record the step
    recordStep(this.stepIndex, this.currentNode, answer);
    this.stepIndex++;
    
    // Find next node
    const nextNode = findNextNode(this.tree, this.currentNode.id, answer.id);
    this.currentNode = nextNode;
    
    // Check if we've reached an end node
    if (nextNode.type === 'end') {
      return { completed: true, result: nextNode };
    }
    
    return { completed: false, nextQuestion: nextNode };
  }

  async submit(token) {
    return submitDecisionTreeResult(
      this.tree.tree_id,
      this.path,
      this.currentNode,
      token
    );
  }
}
```

---

## Database Schema

For reference, here are the database tables used:

```sql
CREATE TABLE decision_trees (
    tree_id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE,
    tree_data JSONB NOT NULL,
    created_by INTEGER REFERENCES users(user_id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE decision_tree_submissions (
    submission_id SERIAL PRIMARY KEY,
    tree_id INTEGER NOT NULL REFERENCES decision_trees(tree_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id),
    path JSONB NOT NULL,
    result JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

