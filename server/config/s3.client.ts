import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3Client agnóstico: compatible con MinIO (desarrollo) y AWS S3 (producción).
 * Si AWS_ENDPOINT está definido en .env → usa MinIO local con forcePathStyle.
 * Si no → usa AWS S3 real directamente.
 * ponytail: inyección por variable de entorno — cero if/else en código de negocio.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'sa-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  ...(process.env.AWS_ENDPOINT
    ? {
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true, // Requerido por MinIO para compatibilidad con SDK de AWS
      }
    : {}),
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'zuriapp-reportes';

/**
 * Sube un buffer a S3/MinIO.
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string = 'application/pdf',
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

/**
 * Genera una URL firmada temporal para descarga directa desde S3/MinIO.
 * @param key - Clave del objeto (ej: "reportes/2026/06/servicio_xyz.pdf")
 * @param expiresIn - Segundos de validez (default: 5 min = 300s)
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 300,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export default s3Client;
