import Parser, { ParseError } from "./frontend/parser.ts";
import { RuntimeError } from "./runtime/env.ts";
import {
  createGlobalEnv,
  evaluate,
  ReturnSignal,
} from "./runtime/interpreter.ts";

const file = Deno.args[0];
if (!file) {
  console.error("الاستخدام: deno run --allow-read main.ts <ملف>");
  Deno.exit(1);
}

try {
  const source = Deno.readTextFileSync(file);
  const program = new Parser().produceAST(source);
  evaluate(program, createGlobalEnv());
} catch (error) {
  if (error instanceof ParseError) {
    console.error("خطأ في البناء:", error.message);
    Deno.exit(1);
  }
  if (error instanceof RuntimeError) {
    console.error("خطأ في التنفيذ:", error.message);
    Deno.exit(1);
  }
  if (error instanceof ReturnSignal) {
    console.error("خطأ: لا يمكن استخدام ارجع خارج دالة");
    Deno.exit(1);
  }
  throw error;
}