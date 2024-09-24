import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { InsertNFA, nfaTable } from '~/server/db/schema';

export async function POST(request: Request) {
    try {
        const data: InsertNFA = await request.json();

        // TODO: implement an actual NFA validator here
        if (!data.name || !data.startState || !data.acceptStates || !data.table) {
            return NextResponse.json({ error: "Invalid NFA" }, { status: 400 });
        }

        const insertedNFA = await db.insert(nfaTable).values(data);

        return NextResponse.json(insertedNFA, { status: 201 });
    } catch (error) {
        console.error('Error inserting NFA:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}