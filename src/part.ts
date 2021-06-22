import {Operator} from "./functions/binary";

export type Part = Bracket | Const | Extraction | Op | FuncCall;
export type Primitive = 'string' | 'boolean' | 'number' | 'string?' | 'boolean?' | 'number?';
export type PrimitiveType<P extends Primitive> =
  P extends 'string' ? string :
    P extends 'boolean' ? boolean :
      P extends 'number' ? number :
        P extends 'string?' ? string | undefined :
          P extends 'boolean?' ? boolean | undefined :
            P extends 'number?' ? number | undefined :
              never;

export interface Bracket {
  type: 'Bracket';
  content: string;
  parts: Part[];
}
export interface Const {
  type: 'Const';
  content: string;
}
export interface Extraction {
  type: 'Extraction';
  content: string;
  extract: Part[];
}
export interface Op {
  type: 'Op';
  content: string;
  operation: keyof Operator;
}
export interface FuncCall {
  type: 'FuncCall';
  content: string;
  functionName: string;
  parameters: Part[];
}
