import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { sqliteTable, real, text } from "drizzle-orm/sqlite-core";

const sqlite = new Database("gestao.db");
const db = drizzle(sqlite);

const caixaConfig = sqliteTable("caixa_config", {
  id: text("id").primaryKey(),
  caixaBase: real("caixaBase").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

await db.update(caixaConfig).set({ caixaBase: 50000 }).where(eq(caixaConfig.id, "default"));
const r = await db.select().from(caixaConfig).where(eq(caixaConfig.id, "default"));
console.log("Caixa:", r[0].caixaBase);
process.exit(0);
