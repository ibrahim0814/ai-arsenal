import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Vercel KV for storing backup metadata (optional but recommended)
// import { kv } from '@vercel/kv';

const TABLES_TO_BACKUP = [
  "tools",
  "prompts",
  "media_items",
  "notes",
  "profiles",
];

export const runtime = "edge";

async function backupTable(supabase: any, tableName: string) {
  try {
    const { data, error } = await supabase.from(tableName).select("*");

    if (error) {
      throw error;
    }

    return {
      success: true,
      tableName,
      data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error backing up table ${tableName}:`, error);
    return {
      success: false,
      tableName,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Using service role key for full access
    );

    // Backup all tables
    const backupResults = await Promise.all(
      TABLES_TO_BACKUP.map((table) => backupTable(supabase, table))
    );

    // Organize results
    const successful = backupResults.filter((result) => result.success);
    const failed = backupResults.filter((result) => !result.success);

    // Create summary
    const summary = {
      timestamp: new Date().toISOString(),
      successful: successful.map((s) => s.tableName),
      failed: failed.map((f) => ({ table: f.tableName, error: f.error })),
      totalRecords: successful.reduce((acc, curr) => acc + curr.data.length, 0),
    };

    // Store backup data in Supabase
    const { error: storageError } = await supabase.from("backups").insert({
      timestamp: new Date().toISOString(),
      summary: summary,
      data: successful.reduce((acc, curr) => {
        acc[curr.tableName] = curr.data;
        return acc;
      }, {} as Record<string, any>),
    });

    if (storageError) {
      throw storageError;
    }

    return NextResponse.json({
      message: "Backup completed",
      summary,
    });
  } catch (error) {
    console.error("Backup process failed:", error);
    return NextResponse.json(
      { error: "Backup process failed" },
      { status: 500 }
    );
  }
}
