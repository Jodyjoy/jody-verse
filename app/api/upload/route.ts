import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

/* ── POST /api/upload  ──────────────────────────────────────────
   Body: FormData with `file` (Blob) and `path` (string)
   Returns: { url: string }
─────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const path = form.get("path") as string | null;

    if (!file || !path) {
      return NextResponse.json({ error: "Missing file or path" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/webp";

    await s3.send(new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         path,
      Body:        buffer,
      ContentType: contentType,
    }));

    return NextResponse.json({ url: `${R2_PUBLIC}/${path}` });
  } catch (err: any) {
    console.error("[upload] R2 error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── DELETE /api/upload  ────────────────────────────────────────
   Body: JSON { prefix: string }   e.g. "manga-1/ch-7/"
   Deletes all objects under that prefix from R2.
─────────────────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  try {
    const { prefix } = await req.json();
    if (!prefix) {
      return NextResponse.json({ error: "Missing prefix" }, { status: 400 });
    }

    // List all objects under the prefix
    const listed = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    }));

    const keys = (listed.Contents ?? []).map((o) => ({ Key: o.Key! }));
    if (keys.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    await s3.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: keys },
    }));

    return NextResponse.json({ deleted: keys.length });
  } catch (err: any) {
    console.error("[upload] R2 delete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
