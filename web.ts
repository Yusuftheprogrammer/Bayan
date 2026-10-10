import Parser from "./frontend/parser.ts";
import { createGlobalEnv, evaluate } from "./runtime/interpreter.ts";


export function run(source: string) {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.join(" "));
  try {
      evaluate(new Parser().produceAST(source), createGlobalEnv());
    } catch (e) {
      lines.push("خطأ: " + (e as Error).message);
    } finally {
      console.log = original;
    }
    return lines.join("\n");
}