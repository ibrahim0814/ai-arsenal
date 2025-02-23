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

const MAX_BACKUPS = 3;

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

async function deleteOldestBackupIfNeeded(supabase: any) {
  try {
    // Get count of backups
    const { count, error: countError } = await supabase
      .from("backups")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    // If we already have MAX_BACKUPS or more, delete the oldest one
    if (count >= MAX_BACKUPS) {
      // Get the ID of the oldest backup
      const { data: oldestBackup, error: selectError } = await supabase
        .from("backups")
        .select("id")
        .order("timestamp", { ascending: true })
        .limit(1)
        .single();

      if (selectError) throw selectError;

      // Delete the oldest backup
      const { error: deleteError } = await supabase
        .from("backups")
        .delete()
        .eq("id", oldestBackup.id);

      if (deleteError) throw deleteError;

      console.log(`Deleted oldest backup with ID: ${oldestBackup.id}`);
    }
  } catch (error) {
    console.error("Error managing old backups:", error);
    throw error;
  }
}

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    console.log("Starting backup process...");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete oldest backup if needed before creating new one
    await deleteOldestBackupIfNeeded(supabase);

    // Backup all tables
    console.log("Starting table backups...");
    const backupResults = await Promise.all(
      TABLES_TO_BACKUP.map((table) => backupTable(supabase, table))
    );

    // Organize results
    const successful = backupResults.filter((result) => result.success);
    const failed = backupResults.filter((result) => !result.success);

    if (failed.length > 0) {
      console.error("Failed backups:", failed);
    }

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
      {
        error: "Backup process failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
