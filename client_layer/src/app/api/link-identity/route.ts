import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const docClient = DynamoDBDocumentClient.from(client);

// POST: Save a new asset link
export async function POST(req: Request) {
  try {
    const { email, walletAddress, fileName, fileType, sha256, action, category, price } = await req.json();

    const command = new PutCommand({
      TableName: "OmniVault_Users",
      Item: {
        email: email,             // Partition Key
        assetId: sha256,          // Sort Key (Unique per file hash)
        walletAddress,
        fileName,
        fileType,
        action,
        category: category || "Uncategorized",
        price: price || "0",
        sha256: sha256,
        timestamp: new Date().toISOString(), // Full Date & Time
      },
    });

    await docClient.send(command);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: Fetch all assets for the user
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  try {
    const command = new QueryCommand({
      TableName: "OmniVault_Users",
      KeyConditionExpression: "email = :e",
      ExpressionAttributeValues: { ":e": email },
      ScanIndexForward: false, // Newest assets appear at the top
    });

    const response = await docClient.send(command);
    return NextResponse.json({ success: true, assets: response.Items || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}