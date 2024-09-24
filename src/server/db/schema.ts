import { sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  serial,
  varchar,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `regular-language-simulator_${name}`);

export const nfaTable = createTable(
  "nfa",
  {
    id: serial("id").primaryKey(), 
    title: varchar("title", { length: 256 }).unique().notNull(),
    startState: varchar("start_state", { length: 256 }).notNull(), 
    acceptStates: text("accept_states").array().notNull(), 
    table: jsonb("table").notNull(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true })
  },
  (nfa) => ({
    nameIndex: index("name_idx").on(nfa.title),
    tableGinIndex: index("table_gin_idx").on(sql`USING gin(${nfa.table})`), 
  })
);

export type InsertNFA = typeof nfaTable.$inferInsert;
export type SelectNFA = typeof nfaTable.$inferSelect;