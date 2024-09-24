import "server-only";
import { db } from "./db";
import { auth } from "@clerk/nextjs/server";
import { InsertNFA, nfaTable } from "./db/schema";
import { NFAJson } from "~/simulator/nfa";

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
    } as InsertNFA);

    return insertedNFA;
}