import { sql } from "drizzle-orm";
import {
    index,
    pgTableCreator,
    serial,
    varchar,
    text,
    jsonb,
    timestamp,
    unique,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `regular-language-simulator_${name}`);

export const nfaTable = createTable(
    "nfa",
    {
        id: serial("id").primaryKey(),
        title: varchar("title", { length: 256 }).notNull(),
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
        userIdIndex: index("user_id_idx").on(nfa.userId),
        uniqueUserTitle: unique().on(nfa.userId, nfa.title),
    })
);

export type InsertNFA = typeof nfaTable.$inferInsert;
export type SelectNFA = typeof nfaTable.$inferSelect;