import { Statement } from "../frontend/ast.ts";
import { Environment } from "./env.ts";

export interface NumberValue {
  type: "number";
  value: number;
}

export interface BooleanValue {
  type: "boolean";
  value: boolean;
}

export interface NullValue {
  type: "null";
  value: null;
}

export interface ObjectValue {
  type: "object";
  properties: Map<string, RuntimeValue>;
}

export interface FunctionValue {
  type: "function";
  name: string;
  params: string[];
  body: Statement[];
  closure: Environment;
}

export interface NativeFunctionValue {
  type: "native";
  name: string;
  call: (args: RuntimeValue[]) => RuntimeValue;
}

export type RuntimeValue =
  | NumberValue
  | BooleanValue
  | NullValue
  | ObjectValue
  | FunctionValue
  | NativeFunctionValue;

// Helpers

export function makeNumber(num: number): NumberValue {
  return { type: "number", value: num };
}

export function makeBoolean(bool: boolean): BooleanValue {
  return { type: "boolean", value: bool };
}

export function makeNull(): NullValue {
  return { type: "null", value: null };
}


export function makeObject(properties: Map<string, RuntimeValue>): ObjectValue {
  return { type: "object", properties };
}

export function makeNative(
  name: string,
  call: (args: RuntimeValue[]) => RuntimeValue,
): NativeFunctionValue {
  return { type: "native", name, call };
}