import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { InsertNFA, nfaTable } from '~/server/db/schema';

export async function GET(_request: Request) {
    try {
        // Fetch all NFAs from the database
        const nfAs = await db.query.nfaTable.findMany({
            orderBy: (model, { desc }) => desc(model.lastAccessedAt),
        });

        // Return the NFAs as JSON
        return NextResponse.json(nfAs, { status: 200 });
    } catch (error) {
        console.error('Error fetching NFAs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data: InsertNFA = await request.json();

        // TODO: implement an actual NFA validator here
        if (!data.title || !data.startState || !data.acceptStates || !data.table) {
            return NextResponse.json({ error: "Invalid NFA" }, { status: 400 });
        }

        const insertedNFA = await db.insert(nfaTable).values(data);

        return NextResponse.json(insertedNFA, { status: 201 });
    } catch (error) {
        console.error('Error inserting NFA:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}