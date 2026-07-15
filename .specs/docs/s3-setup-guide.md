# Guía de Configuración AWS S3 para Centro de Reportes

Esta guía detalla los pasos exactos para configurar un bucket de Amazon S3 diseñado para almacenar las Cartolas Mensuales (PDFs inmutables) generadas por el Worker.

## Paso 1: Crear el Bucket en AWS S3
1. Inicia sesión en la consola de AWS (https://aws.amazon.com/es/console/).
2. Busca el servicio **S3** y haz clic en **Create bucket**.
3. **Bucket name:** Elige un nombre único y descriptivo, por ejemplo: `zuriapp-reportes-cartolas-prod`.
4. **AWS Region:** Selecciona la región más cercana a tus usuarios (ej. `sa-east-1` São Paulo o `us-east-1` N. Virginia).
5. **Object Ownership:** Deja "ACLs disabled (recommended)".
6. **Block Public Access settings:**
   - **IMPORTANTE:** Deja marcada la opción **"Block all public access"**. 
   - *Razón:* Las cartolas contienen información sensible. El backend será el único autorizado para generar URLs firmadas (Signed URLs) temporales para que el usuario las descargue.
7. Haz clic en **Create bucket**.

## Paso 2: Crear un Usuario IAM (Credenciales para el Backend)
No debes usar las credenciales root de tu cuenta AWS. Crearemos un usuario exclusivo para el backend.
1. Ve al servicio **IAM** (Identity and Access Management).
2. En el menú izquierdo, ve a **Users** y haz clic en **Create user**.
3. **User name:** Ponle algo como `zuriapp-backend-s3`. (No marques acceso a la consola, es solo programático).
4. En la sección "Set permissions", selecciona **"Attach policies directly"**.
5. Haz clic en **Create policy** (se abrirá otra pestaña).
6. Selecciona el tab **JSON** y pega lo siguiente (reemplaza `TU_BUCKET_NAME` por el nombre de tu bucket):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PermisosBackendS3",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::TU_BUCKET_NAME/*"
        }
    ]
}
```
7. Dale un nombre a la política, ej. `ZuriApp-S3-Backend-Policy` y créala.
8. Vuelve a la pestaña de creación del usuario, refresca la lista de políticas, busca la que acabas de crear y selecciónala.
9. Finaliza la creación del usuario.

## Paso 3: Obtener las Access Keys
1. Haz clic en el usuario recién creado (`zuriapp-backend-s3`).
2. Ve a la pestaña **Security credentials**.
3. Baja hasta **Access keys** y haz clic en **Create access key**.
4. Selecciona **Application running outside AWS** o **Other**.
5. Copia el **Access key ID** y el **Secret access key**. 
   - *¡Guárdalos muy bien! El Secret no se volverá a mostrar.*

## Paso 4: Configurar el Backend (Node.js)
En el archivo `.env` de tu backend de NestJS/Express, deberás agregar estas variables:

```env
# AWS S3 (Credenciales)
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET_NAME=zuriapp-reportes-cartolas-prod

# Configuración Agnóstica (Para MinIO en Desarrollo Local)
# IMPORTANTE: En producción (AWS real), simplemente omite/borra esta variable.
AWS_ENDPOINT=http://localhost:9000
```

*Nota de Arquitectura:* Al utilizar `AWS_ENDPOINT` apuntando a MinIO, el SDK de AWS redirige el tráfico hacia el entorno local de manera gratuita. En producción, la ausencia de esta variable hace que el SDK de Amazon enrute de manera nativa hacia la nube.

### Flujo de Subida y Descarga
1. **Subida (Worker):** El Worker usará el SDK de AWS (`@aws-sdk/client-s3`) para hacer un `PutObjectCommand` subiendo el buffer del PDF generado por Puppeteer. Guardará en base de datos la clave del archivo (ej. `reportes/2026/06/servicio_x.pdf`).
2. **Descarga (Frontend):** Cuando el usuario haga clic en "Descargar PDF", el backend no devolverá el archivo pesado. Hará un `getSignedUrl` con el SDK de AWS que genera un link temporal (que caduca en 5 minutos) y el frontend abrirá esa URL. ¡Máxima seguridad y cero carga al servidor!
