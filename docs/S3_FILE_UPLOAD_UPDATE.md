# S3 File Upload & Entity Attachments Update

## Summary

Connected Strapi uploads to **AWS S3**, added **entity attachments** (files tab + chat), and wired CRM/PM detail pages to upload, list, and share files.

## Scope

- **Backend:** `apps/backend` — S3 provider, `entity-attachment` API, chat comment attachments in `crm-activity`
- **Packages:** `@webfudge/utils` (upload helpers), `@webfudge/ui` (`EntityFilesPanel`, chat attachments in `EntityActivityPanel`)
- **CRM:** chat file attach on detail pages; deal **Documents** tab
- **PM:** task/project **Files** tabs; chat file attach

## Backend

### S3 (Strapi upload provider)

- Package: `@strapi/provider-upload-aws-s3@5.33.1`
- Config: `apps/backend/config/plugins.js`
- CSP: `apps/backend/config/middlewares.js` (allows S3/CloudFront images)
- Env: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`, optional `CDN_URL`

### Entity attachments

Content type: `entity-attachment` (`subjectType`, `subjectId`, `file` media, `source`: `files_tab` | `chat`)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/entity-attachments/list?subjectType=&subjectId=` | List files for an entity |
| `GET /api/entity-attachments/count?subjectType=&subjectId=` | Count for tab badges |
| `POST /api/entity-attachments` | Link uploaded file (`fileId`) to entity |
| `DELETE /api/entity-attachments/:id` | Remove link |

### Chat attachments

`POST /api/crm-activities/comments` accepts optional `attachments: [{ id, name, url, mime, size }]`. Comment text **or** at least one attachment is required. Attachments are stored in `meta.attachments` and synced to `entity-attachment` with `source: chat`.

## Frontend

### Shared

- `packages/utils/src/media/upload.js` — `uploadFileToStrapi`, `resolveMediaUrl`, etc.
- `EntityFilesPanel` — upload/list/delete on detail **Files** / **Documents** tabs
- `EntityActivityPanel` — paperclip in chat composer when `uploadFilesFn` is passed

### App helpers

- CRM: `apps/crm/lib/entityMedia.js`, `apps/crm/lib/api/entityAttachmentService.js`
- PM: `apps/pm/lib/entityMedia.js`, `apps/pm/lib/api/entityAttachmentService.js`

## Usage

1. Set AWS env vars on the API service and restart Strapi.
2. Ensure **Authenticated** role has Upload → **upload** in Strapi admin.
3. On entity detail pages: use **Chats** paperclip or **Files** / **Documents** tab **Upload file**.

## Migration notes

- Existing local `/uploads/` files keep working via `resolveMediaUrl` until migrated to S3.
- New uploads go to S3 when provider env is configured.
