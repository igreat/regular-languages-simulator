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

export const nfa = createTable(
  "nfa",
  {
    id: serial("id").primaryKey(), 
    name: varchar("name", { length: 256 }).notNull(), 
    startState: varchar("start_state", { length: 256 }).notNull(), 
    acceptStates: text("accept_states").array().notNull(), 
    table: jsonb("table").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (nfa) => ({
    nameIndex: index("name_idx").on(nfa.name),
    tableGinIndex: index("table_gin_idx").on(sql`USING gin(${nfa.table})`), 
  })
);
