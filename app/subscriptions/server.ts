import type { Message } from "@prisma/client";
import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { type Queries } from "~/queries";
import { prisma } from "../db";
import type { MsgQuery, ServerIO, ServerSocket } from "./shared";

type MsgSubscription = {
  query: MsgQuery;
  callback: (msgs: Message[]) => void;
};

const msgSubs: MsgSubscription[] = [];

export const createMsgSubscription = (sub: MsgSubscription) =>
  msgSubs.push(sub);

prisma.$use(async (params, next) => {
  const result = await next(params);

  msgSubs.forEach((sub) => {
    if (params.model === "Message" && params.action === "create") {
      const msg = result as Message;
      const query = sub.query as MsgQuery;
      if (msg.roomId === query?.where?.roomId) {
        setTimeout(
          async () => sub.callback(await prisma.message.findMany(sub.query)),
          0
        );
      }
    }
  });

  return result;
});

export const registerSocket = (app: HttpServer) => {
  const io: ServerIO = new Server(app);

  io.on("connection", (socket) => {
    console.log("connected");

    socket.on("message", async (text) => {
      const roomId = await getRoomUserIsIn(1);
      console.log("message", roomId, text);
      await prisma.message.create({ data: { text, roomId } });
    });

    socket.on("subscribeToQuery", async (query, input) => {
      console.log("subscribeToQuery", query, input);

      const handler = QueryHandlers[query];
      if (!handler) {
        throw new Error(`No handler for query ${query}`);
      }

      await handler({ userId: 1, socket });
    });

    socket.on("disconnect", () => {
      console.log("disconnected");
    });
  });
};

const QueryHandlers: Record<
  Queries,
  (ctx: { userId: number; socket: ServerSocket }) => Promise<void>
> = {
  chatroom: async ({ userId, socket }) => {
    const roomId = await getRoomUserIsIn(userId);

    const query = { where: { roomId } } as const;

    createMsgSubscription({
      query,
      callback: (newMessages) => socket.emit("query", "chatroom", newMessages),
    });

    const messages = await prisma.message.findMany(query);
    socket.emit("query", "chatroom", messages);
  },
};

const getRoomUserIsIn = async (userId: number) => 1;
