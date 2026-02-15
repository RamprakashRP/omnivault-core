
import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});
const docClient = DynamoDBDocumentClient.from(client);

export async function GET() {
    try {
        const command = new ScanCommand({
            TableName: "OmniVault_Users",
        });

        const response = await docClient.send(command);

        // Filter only "LISTED" items
        const listedAssets = (response.Items || []).filter((item: any) => item.action === "LISTED");

        return NextResponse.json({ success: true, assets: listedAssets });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
