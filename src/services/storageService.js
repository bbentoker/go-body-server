const { Client } = require('minio');

const {
  MINIO_BUCKET_URL,
  MINIO_ADMIN_USER,
  MINIO_ADMIN_PASSWORD,
  MINIO_BUCKET_NAME,
} = process.env;

let minioClient;
let bucketChecked = false;

function getClient() {
  if (minioClient) {
    return minioClient;
  }

  if (!MINIO_BUCKET_URL || !MINIO_ADMIN_USER || !MINIO_ADMIN_PASSWORD) {
    throw new Error('Missing MinIO configuration. Check MINIO_BUCKET_URL, MINIO_ADMIN_USER, and MINIO_ADMIN_PASSWORD.');
  }

  const endpoint = new URL(MINIO_BUCKET_URL);
  const port = endpoint.port
    ? parseInt(endpoint.port, 10)
    : endpoint.protocol === 'https:'
      ? 443
      : 80;

  minioClient = new Client({
    endPoint: endpoint.hostname,
    port,
    useSSL: endpoint.protocol === 'https:',
    accessKey: MINIO_ADMIN_USER,
    secretKey: MINIO_ADMIN_PASSWORD,
  });

  return minioClient;
}

async function ensureBucketExists(bucketName = MINIO_BUCKET_NAME) {
  const client = getClient();
  if (bucketChecked) {
    return;
  }

  const exists = await client.bucketExists(bucketName);
  if (!exists) {
    await client.makeBucket(bucketName);
  }

  bucketChecked = true;
}

function buildObjectUrl(objectKey, bucketName = MINIO_BUCKET_NAME) {
  const base = (MINIO_BUCKET_URL || '').replace(/\/$/, '');
  return `${base}/${bucketName}/${objectKey}`;
}

async function uploadBuffer(objectKey, buffer, metadata = {}, bucketName = MINIO_BUCKET_NAME) {
  if (!bucketName) {
    throw new Error('Bucket name is required to upload objects.');
  }

  const client = getClient();
  await ensureBucketExists(bucketName);

  await client.putObject(bucketName, objectKey, buffer, buffer.length, metadata);

  return {
    objectKey,
    url: buildObjectUrl(objectKey, bucketName),
  };
}

module.exports = {
  uploadBuffer,
  buildObjectUrl,
};
