/**
 * S3-compatible object store adapter (infra — like app/db.ts).
 * Talks to RustFS / MinIO / AWS via the AWS SDK; no domain rules.
 */
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'

export type PutObjectInput = {
  key: string
  body: Readable | Buffer | Uint8Array | string
  contentType: string
  contentLength?: number
}

export type ObjectStore = {
  putObject: (input: PutObjectInput) => Promise<void>
  getObjectText: (key: string) => Promise<string>
  getObjectBytes: (key: string) => Promise<Uint8Array>
  ensureBucket: () => Promise<void>
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for object store`)
  return value
}

export function createObjectStoreFromEnv(): ObjectStore {
  const endpoint = requiredEnv('S3_ENDPOINT')
  const region = process.env.S3_REGION?.trim() || 'us-east-1'
  const accessKeyId = requiredEnv('S3_ACCESS_KEY_ID')
  const secretAccessKey = requiredEnv('S3_SECRET_ACCESS_KEY')
  const bucket = requiredEnv('S3_BUCKET')

  const client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    // Avoid aws-chunked + flexible checksums that break RustFS/MinIO stream puts.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })

  let bucketReady: Promise<void> | null = null

  async function ensureBucket() {
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }))
      return
    } catch {
      // create below
    }
    try {
      await client.send(new CreateBucketCommand({ Bucket: bucket }))
    } catch (err) {
      const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : ''
      // Race / already exists on S3-compatible stores
      if (name === 'BucketAlreadyOwnedByYou' || name === 'BucketAlreadyExists') return
      throw err
    }
  }

  async function ensureBucketOnce() {
    if (!bucketReady) bucketReady = ensureBucket()
    await bucketReady
  }

  return {
    ensureBucket: ensureBucketOnce,
    async putObject(input) {
      await ensureBucketOnce()
      const contentLength =
        input.contentLength ??
        (Buffer.isBuffer(input.body)
          ? input.body.length
          : typeof input.body === 'string'
            ? Buffer.byteLength(input.body)
            : input.body instanceof Uint8Array
              ? input.body.byteLength
              : undefined)
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          ...(contentLength !== undefined ? { ContentLength: contentLength } : {}),
        }),
      )
    },
    async getObjectText(key) {
      await ensureBucketOnce()
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      if (!response.Body) throw new Error(`Empty object body for key ${key}`)
      return response.Body.transformToString()
    },
    async getObjectBytes(key) {
      await ensureBucketOnce()
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      if (!response.Body) throw new Error(`Empty object body for key ${key}`)
      return response.Body.transformToByteArray()
    },
  }
}

let singleton: ObjectStore | null = null

export function getObjectStore(): ObjectStore {
  if (!singleton) singleton = createObjectStoreFromEnv()
  return singleton
}

/** Tests only — swap or clear the process singleton. */
export function setObjectStoreForTests(store: ObjectStore | null) {
  singleton = store
}
