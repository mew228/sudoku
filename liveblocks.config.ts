import { createClient, LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { Difficulty } from "./lib/logic/sudoku";

export const client = createClient({
    authEndpoint: "/api/liveblocks-auth",
});

// Cursor and cell hover state for real-time presence
export type Presence = {
    cursor: { x: number; y: number } | null;
    hoveredCell: { r: number; c: number } | null;
};

export type PlayerState = {
    name: string;
    progress: number;
    mistakes: number;
    status: "playing" | "won" | "lost";
};

// Shared state for the game board
export type Storage = {
    board: LiveList<number>;
    initialBoard: LiveList<number>;
    solvedBoard: LiveList<number>;
    status: "waiting" | "playing" | "finished";
    difficulty: Difficulty;
    players: LiveMap<string, LiveObject<PlayerState>>;
    winner: string | null;
    cellOwners: LiveMap<string, string>;
    currentTurn: string | null;
};

export type UserMeta = {
    id: string; // The user's UID
    info: {
        name: string;
        avatar?: string;
    };
};

export type RoomEvent =
    | { type: "GAME_STARTED" }
    | { type: "GAME_OVER"; winner: string };

export const {
    suspense: {
        RoomProvider,
        useRoom,
        useMyPresence,
        useUpdateMyPresence,
        useSelf,
        useOthers,
        useOthersMapped,
        useOthersConnectionIds,
        useOther,
        useBroadcastEvent,
        useEventListener,
        useErrorListener,
        useStorage,
        useHistory,
        useUndo,
        useRedo,
        useCanUndo,
        useCanRedo,
        useMutation,
        useStatus,
        useLostConnectionListener,
        useThreads,
        useUser,
        useRoomInfo,
    }
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
