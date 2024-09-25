import "server-only";
import { db } from "./db";
import { auth } from "@clerk/nextjs/server";
import { InsertNFA, nfaTable } from "./db/schema";
import { NFAJson } from "~/simulator/nfa";
import { and, eq } from "drizzle-orm";

export async function getMyPresetNfas() {
    const user = auth();
    if (!user.userId) throw new Error("Unothorized");

    const nfAs = await db.query.nfaTable.findMany({
        where: (model, { eq }) => eq(model.userId, user.userId),
        orderBy: (model, { desc }) => desc(model.lastAccessedAt),
    });

    return nfAs;
}

export async function getMyFirstPresetNfa() {
    const user = auth();
    if (!user.userId) throw new Error("Unauthorized");

    const nfa = await db.query.nfaTable.findFirst({
        where: (model, { eq }) => eq(model.userId, user.userId),
    });

    return nfa;
}

export async function insertNfa(data: NFAJson) {
    const user = auth();
    if (!user.userId) throw new Error("Unauthorized");

    const insertedNFA = await db.insert(nfaTable).values({
        ...data,
        userId: user.userId,
    } as InsertNFA).onConflictDoUpdate({
        target: [nfaTable.userId, nfaTable.title],
        set: data,
    });

    return insertedNFA;
}

export async function deleteNfa(title: string) {
    const user = auth();
    if (!user.userId) throw new Error("Unauthorized");

    const deletedNFA = await db.delete(nfaTable).where(
        and(
            eq(nfaTable.userId, user.userId),
            eq(nfaTable.title, title)
        )
    );

    return deletedNFA;
}