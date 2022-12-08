import type { prisma } from "../db";
import type { Message } from "@prisma/client";
import type { Server, Socket as SSocket } from "socket.io";
import type { Socket as CSocket } from "socket.io-client";
import type { Queries, QueryOutput, QueryInput } from "~/queries";

export type MsgQuery = Parameters<typeof prisma.message.findMany>[0];

export interface ServerToClientEvents {
  message: (messages: Message) => void;
  messages: (messages: Message[]) => void;

  query: <Q extends Queries>(query: Queries, data: QueryOutput<Q>) => void;
}

export interface ClientToServerEvents {
  subscribeToMessages: (query: MsgQuery) => void;
  message: (text: string) => void;

  subscribeToQuery: <Q extends Queries>(
    query: Q,
    input?: QueryInput<Q>
  ) => void;
}

export type ClientSocket = CSocket<ServerToClientEvents, ClientToServerEvents>;
export type ServerIO = Server<ClientToServerEvents, ServerToClientEvents>;
export type ServerSocket = SSocket<ClientToServerEvents, ServerToClientEvents>;
