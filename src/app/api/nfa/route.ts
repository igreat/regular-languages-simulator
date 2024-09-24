import { NextResponse } from 'next/server';
import { getMyPresetNfas, insertNfa } from '~/server/queries';
import { NFAJson } from '~/simulator/nfa';

export async function GET(_request: Request) {
    try {
        // Fetch all NFAs from the database
        const nfAs = await getMyPresetNfas();

        // Return the NFAs as JSON
        return NextResponse.json(nfAs, { status: 200 });
    } catch (error) {
        console.error('Error fetching NFAs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data: { title: string } & NFAJson = await request.json();

        // TODO: implement an actual NFA validator here
        if (!data.title || !data.startState || !data.acceptStates || !data.table) {
            return NextResponse.json({ error: "Invalid NFA" }, { status: 400 });
        }

        const insertedNFA = await insertNfa(data);

        return NextResponse.json(insertedNFA, { status: 201 });
    } catch (error) {
        console.error('Error inserting NFA:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}