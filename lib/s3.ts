import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const TWENTY_FOUR_HOURS = 60 * 60 * 24
const ONE_HOUR = 60 * 60

// A raw title can carry quotes, backslashes, CR/LF, or non-ASCII — any of
// which either breaks the `filename="..."` quoted-string (or injects a
// second header parameter) or isn't legal in a plain HTTP header value.
// So: build an ASCII-safe fallback for `filename=` (ASCII quoted-string,
// unsafe/filesystem-reserved chars and control chars stripped) and a
// percent-encoded RFC 5987 `filename*=UTF-8''...` for full-fidelity
// Unicode — the standard pair browsers expect from a download response.
function contentDisposition(rawFilename: string): string {
  const asciiName = rawFilename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // fold accents: "e-acute" -> "e"
    .replace(/[^\x20-\x7E]/g, '') // drop remaining non-ASCII
    .replace(/["\\/:*?<>|]/g, '') // drop header/filesystem-unsafe chars
    .replace(/[\r\n]/g, '')
    .trim() || 'download'

  const utf8Name = rawFilename.trim() || 'download'
  const encodedUtf8Name = encodeURIComponent(utf8Name).replace(
    /[*'()]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  )

  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedUtf8Name}`
}

export async function presignedDownloadUrl(fileKey: string, filename?: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileKey,
    ...(filename && {
      ResponseContentDisposition: contentDisposition(filename),
    }),
  })
  return getSignedUrl(s3, command, { expiresIn: TWENTY_FOUR_HOURS })
}

export async function presignedUploadUrl(fileKey: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileKey,
    ContentType: contentType,
  })
  return getSignedUrl(s3, command, { expiresIn: ONE_HOUR })
}
