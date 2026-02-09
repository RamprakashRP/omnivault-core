import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileKey, trainingScript } = await req.json();

    const lambdaClient = new LambdaClient({
      region: process.env.AWS_REGION, // Uses the ap-south-2 from your env
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const payload = JSON.stringify({
      s3Key: fileKey,
      script: trainingScript,
      bucket: process.env.AWS_S3_BUCKET_NAME,
    });

    const command = new InvokeCommand({
      FunctionName: "OmniVault-Clean-Room",
      // AWS SDK v3 requires the payload as a Uint8Array
      Payload: new TextEncoder().encode(payload), 
    });

    const response = await lambdaClient.send(command);
    
    // Decode the response from the Python Lambda
    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    return NextResponse.json({ success: true, results: result });
  } catch (error: any) {
    console.error("❌ Lambda Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}