# Blogs API Documentation

This document describes all blog endpoints, request/response formats, and authentication requirements.

## Base URL
All blog routes are prefixed with `/blogs`

Example: `GET BASE_URL/blogs`

---

## Table of Contents
- [Public Blog Routes](#public-blog-routes)
  - [List Published Blogs](#1-list-published-blogs)
- [Blog Routes](#blog-routes)
  - [List Blogs](#2-list-blogs)
  - [Get Blog by ID](#3-get-blog-by-id)
  - [Create Blog (provider only)](#4-create-blog-provider-only)
  - [Update Blog (provider only)](#5-update-blog-provider-only)
  - [Delete Blog (provider only)](#6-delete-blog-provider-only)
  - [Upload Blog Media (provider only)](#7-upload-blog-media-provider-only)

---

## Public Blog Routes

### 1. List Published Blogs

Fetch all published blogs (public endpoint). This returns only `is_published = true` and `published_at` not null, ordered by `published_at` desc then `created_at` desc.

**Endpoint:** `GET /public/blogs`

**Query Params:**
- `includeMedia` (optional: `true`|`1`): include media records.

**Sample Request:**
```
GET /public/blogs?includeMedia=true
```

**Sample Response:**
```json
[
  {
    "blog_id": 3,
    "provider_id": 12,
    "title": "Fall Recovery Tips",
    "content": "...",
    "cover_image_url": "https://s3.go-body.co/go-body/blogs/3/images/cover.png",
    "is_published": true,
    "published_at": "2025-11-25T00:00:00.000Z",
    "created_at": "2025-11-25T00:00:00.000Z",
    "updated_at": "2025-11-25T00:00:00.000Z",
    "provider": { "provider_id": 12, "first_name": "Ana", "last_name": "Lopez", "email": "ana@example.com", "role_id": 2, "is_active": true, "is_verified": true, "language_id": 4, "created_at": "2025-11-20T00:00:00.000Z" },
    "media": [
      {
        "media_id": 9,
        "blog_id": 3,
        "media_type": "image",
        "object_key": "blogs/3/images/1700890093-header.png",
        "url": "https://s3.go-body.co/go-body/blogs/3/images/1700890093-header.png",
        "alt_text": "Stretching",
        "created_at": "2025-11-25T00:00:00.000Z",
        "updated_at": "2025-11-25T00:00:00.000Z"
      }
    ]
  }
]
```

---

## Blog Routes

### 2. List Blogs

Fetch all blogs. Public endpoint.

**Endpoint:** `GET /blogs`

**Query Params:**
- `includeMedia` (optional: `true`|`1`): include media records.
- `providerId` (optional, number): filter by provider/author.

**Sample Request:**
```
GET /blogs?includeMedia=true&providerId=12
```

**Sample Response:**
```json
[
  {
    "blog_id": 3,
    "provider_id": 12,
    "title": "Fall Recovery Tips",
    "content": "...",
    "cover_image_url": "https://s3.go-body.co/go-body/blogs/3/images/cover.png",
    "is_published": true,
    "published_at": "2025-11-25T00:00:00.000Z",
    "created_at": "2025-11-25T00:00:00.000Z",
    "updated_at": "2025-11-25T00:00:00.000Z",
    "provider": { "provider_id": 12, "first_name": "Ana", "last_name": "Lopez", "email": "ana@example.com", "role_id": 2, "is_active": true, "is_verified": true, "language_id": 4, "created_at": "2025-11-20T00:00:00.000Z" },
    "media": [
      {
        "media_id": 9,
        "blog_id": 3,
        "media_type": "image",
        "object_key": "blogs/3/images/1700890093-header.png",
        "url": "https://s3.go-body.co/go-body/blogs/3/images/1700890093-header.png",
        "alt_text": "Stretching",
        "created_at": "2025-11-25T00:00:00.000Z",
        "updated_at": "2025-11-25T00:00:00.000Z"
      }
    ]
  }
]
```

---

### 3. Get Blog by ID

Fetch a single blog by ID. Public endpoint.

**Endpoint:** `GET /blogs/:blogId`

**Query Params:**
- `includeMedia` (optional: `true`|`1`): include media records.

**Sample Request:**
```
GET /blogs/3?includeMedia=true
```

**Responses:**
- `200 OK` with blog object.
- `404 Not Found` if blog is missing.

---

### 4. Create Blog (provider only)

Create a new blog post. Requires provider JWT (`Authorization: Bearer <token>`).

**Endpoint:** `POST /blogs`

**Content-Type:** `multipart/form-data`

**Required Fields:**
- `title` (string)
- `content` (string)

**Optional Fields:**
- `cover` (file): image file for the cover; stored under `blogs/{blogId}/images/cover-...`
- `cover_alt_text` (string): alt text for the cover image
- `is_published` (boolean; if true and `published_at` is not supplied, it is set to now)
- `published_at` (ISO timestamp; overrides auto publish time)
- `cover_image_url` (string): alternate way to set cover URL directly (if you don't upload a file)

**Optional Body Fields:**
- N/A (see optional fields above)

**Notes:**
- `provider_id` is taken from the authenticated provider token; client should not send it.
- When `cover` file is provided, it is uploaded to MinIO and saved as the blog's `cover_image_url`. A media record is also created under `blog_media` with `media_type: "image"`.

**Responses:**
- `201 Created` with created blog.
- `400 Bad Request` if required fields are missing.
- `401 Unauthorized` if token is invalid or not a provider.

---

### 5. Update Blog (provider only)

Update an existing blog. Only the owning provider can update.

**Endpoint:** `PUT /blogs/:blogId`

**Content-Type:** `application/json`

**Body (any subset):**
```json
{
  "title": "Updated title",
  "content": "Updated body",
  "cover_image_url": "https://s3.go-body.co/go-body/blogs/3/images/new-cover.png",
  "is_published": true,
  "published_at": "2025-11-26T10:00:00.000Z"
}
```

**Responses:**
- `200 OK` with updated blog.
- `400 Bad Request` if no updatable fields provided.
- `401 Unauthorized` if token is invalid.
- `403 Forbidden` if the blog is not owned by the authenticated provider.
- `404 Not Found` if the blog does not exist.

---

### 6. Delete Blog (provider only)

Delete an existing blog. Only the owning provider can delete.

**Endpoint:** `DELETE /blogs/:blogId`

**Responses:**
- `204 No Content` on success.
- `401 Unauthorized` if token is invalid.
- `403 Forbidden` if the blog is not owned by the authenticated provider.
- `404 Not Found` if the blog does not exist.

---

### 7. Upload Blog Media (provider only)

Upload an image or video and attach it to a blog. Stored in MinIO under `blogs/{blogId}/images/...` or `blogs/{blogId}/videos/...`.

**Endpoint:** `POST /blogs/:blogId/media`

**Headers:**
- `Authorization: Bearer <provider token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `file` (required): binary file up to 20MB.
- `media_type` (optional): `image` or `video`. Defaults to type inferred from MIME (video/* -> `video`, otherwise `image`).
- `alt_text` (optional): short alt text/description.

**Responses:**
- `201 Created` with media record:
```json
{
  "media_id": 11,
  "blog_id": 3,
  "media_type": "image",
  "object_key": "blogs/3/images/1700891000-banner.png",
  "url": "https://s3.go-body.co/go-body/blogs/3/images/1700891000-banner.png",
  "alt_text": "Banner image",
  "created_at": "2025-11-25T00:00:00.000Z",
  "updated_at": "2025-11-25T00:00:00.000Z"
}
```
- `400 Bad Request` if no file is provided.
- `401 Unauthorized` if token is invalid.
- `403 Forbidden` if the blog is not owned by the authenticated provider.
- `404 Not Found` if the blog does not exist.

**Storage details:**
- Bucket: `MINIO_BUCKET_NAME` (see `.env` or docker-compose).
- Access URL base: `MINIO_BUCKET_URL`.
- Object key pattern: `blogs/{blogId}/images/{timestamp-filename}` or `blogs/{blogId}/videos/{timestamp-filename}`.
