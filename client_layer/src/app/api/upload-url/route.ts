// client_layer/src/app/api/upload-url/route.ts
import { s3Client } from "@/lib/s3-engine";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileName, fileType } = await req.json();

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    // Create a unique name for the cloud file
    const fileKey = `vault-${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    // Generate a URL valid for 60 seconds
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({ url: signedUrl, fileKey });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}