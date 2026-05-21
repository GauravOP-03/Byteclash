import * as path from "path";
import { promises as fs } from "fs";
import { Migration, MigrationProvider, Migrator, sql } from "kysely";
import { db } from "./database";

class SqlFileMigrationProvider implements MigrationProvider {
  constructor(private migrationFolder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};
    const files = await fs.readdir(this.migrationFolder);

    // Sort files to ensure 001 runs before 002
    for (const file of files.sort()) {
      const migrationName = file.replace(".sql", "");

      migrations[migrationName] = {
        up: async (db) => {
          const sqlContent = await fs.readFile(
            path.join(this.migrationFolder, file),
            "utf8",
          );
          await sql.raw(sqlContent).execute(db);
        },
      };
    }
    return migrations;
  }
}

async function migrateToLatest() {
  const migrator = new Migrator({
    db,
    provider: new SqlFileMigrationProvider(path.join(__dirname, "./migration")),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success")
      console.log(` Migration "${it.migrationName}" executed`);
    else if (it.status === "Error")
      console.error(`Migration "${it.migrationName}" failed`);
  });

  if (error) {
    console.log(error);
    console.error("Migration failed");
    process.exit(1);
  }

  await db.destroy();
}

migrateToLatest();
