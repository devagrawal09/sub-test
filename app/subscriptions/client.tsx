import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { io } from "socket.io-client";
import type { Queries, QueryInput, QueryOutput } from "~/queries";
import type { ClientSocket } from "./shared";

type SubContext = {
  socket?: ClientSocket;
};

const subContext = createContext<SubContext | null>(null);

export const SubProvider = (props: PropsWithChildren) => {
  const [socket, setSocket] = useState<ClientSocket>();

  useEffect(() => {
    const socket = io();
    setSocket(socket);

    socket.on("connect", () => console.log("connected"));

    return () => {
      socket.close();
    };
  }, []);

  return (
    <subContext.Provider value={{ socket }}>
      {props.children}
    </subContext.Provider>
  );
};

export const useLiveQuery = <Q extends Queries>(
  q: Q,
  input?: QueryInput<Q>
) => {
  const ctx = useContext(subContext);
  if (!ctx) throw new Error("SubProvider not found");

  const { socket } = ctx;

  const [data, setData] = useState<QueryOutput<Q>>();

  useEffect(() => {
    socket?.emit("subscribeToQuery", q, input).on("query", (query, data) => {
      if (query === q) setData(data);
    });

    return () => {
      socket?.off("query");
    };
  }, [input, q, socket]);

  return data;
};

export const useSendMessage = () => {
  const ctx = useContext(subContext);
  if (!ctx) throw new Error("SubProvider not found");

  const { socket } = ctx;

  return (text: string) => {
    console.log("send message", text);
    socket?.emit("message", text);
  };
};
