import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

// We read the secret key from the environment variables
const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_dev_dummy_key_for_build",
});

export async function POST(request: NextRequest) {
    try {
        // In a real application, you would authenticate the user here
        // using Firebase Admin SDK or by passing a token from the client.
        // For simplicity, we'll read the user info from the request body if provided,
        // or generate a random anonymous user.
        const body = await request.json().catch(() => ({}));
        const user = body.user || {
            uid: `anon-${Math.floor(Math.random() * 10000)}`,
            displayName: `Player`,
        };

        // Prepare session for Liveblocks
        const session = liveblocks.prepareSession(user.uid, {
            userInfo: {
                name: user.displayName || "Unknown User",
            },
        });

        // Authorize the user for the requested room
        // The room name is typically passed in the request body by @liveblocks/client
        const { room } = body;
        if (room) {
            session.allow(room, session.FULL_ACCESS);
        }

        // Authorize the session and get the token
        const { status, body: sessionBody } = await session.authorize();

        return new NextResponse(sessionBody, { status });
    } catch (error) {
        console.error("Error in liveblocks auth:", error);
        return new NextResponse("Authentication error", { status: 500 });
    }
}
