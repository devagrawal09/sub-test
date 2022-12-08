import type { Message } from "@prisma/client";

type QueryData = {
  chatroom: {
    output: Message[];
    input: void;
  };
};

export type Queries = keyof QueryData;
export type QueryOutput<Q extends Queries> = QueryData[Q]["output"];
export type QueryInput<Q extends Queries> = QueryData[Q]["input"];
