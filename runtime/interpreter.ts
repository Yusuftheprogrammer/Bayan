import {
  AssignmentExpression,
  BinaryExpression,
  BlockStatement,
  CallExpression,
  Expression,
  ForStatement,
  FunctionDeclaration,
  Identifier,
  IfStatement,
  MemberExpression,
  NumberLiteral,
  ObjectLiteral,
  Program,
  ReturnStatement,
  Statement,
  StringLiteral,
  VarDeclaration,
  WhileStatement,
} from "../frontend/ast.ts";
import { Environment, RuntimeError } from "./env.ts";
import {
  FunctionValue,
  makeBoolean,
  makeNative,
  makeNull,
  makeNumber,
  makeObject,
  makeString,
  RuntimeValue,
} from "./values.ts";

export class ReturnSignal {
  constructor(public value: RuntimeValue) {}
}

export function createGlobalEnv(): Environment {
  const env = new Environment();
  env.declare("صواب", makeBoolean(true), true);
  env.declare("خطأ", makeBoolean(false), true);
  env.declare("فارغ", makeNull(), true);
  env.declare(
    "اطبع",
    makeNative("اطبع", (args) => {
      console.log(args.map(formatValue).join(" "));
      return makeNull();
    }),
    true,
  );
  return env;
}

export function formatValue(value: RuntimeValue): string {
  switch (value.type) {
    case "number":
      return String(value.value);
    case "string":
      return value.value;
    case "boolean":
      return value.value ? "صواب" : "خطأ";
    case "null":
      return "فارغ";
    case "object": {
      const parts = [...value.properties].map(
        ([key, v]) => `${key}: ${formatValue(v)}`,
      );
      return `{ ${parts.join("، ")} }`;
    }
    case "function":
    case "native":
      return `<دالة ${value.name}>`;
  }
}

export function evaluate(node: Statement, env: Environment): RuntimeValue {
  switch (node.kind) {
    case "NumberLiteral":
      return makeNumber((node as NumberLiteral).value);
    case "StringLiteral":
      return makeString((node as StringLiteral).value);
    case "Identifier":
      return env.lookup((node as Identifier).symbol);
    case "BinaryExpression":
      return evalBinary(node as BinaryExpression, env);
    case "AssignmentExpression":
      return evalAssignment(node as AssignmentExpression, env);
    case "ObjectLiteral":
      return evalObject(node as ObjectLiteral, env);
    case "MemberExpression":
      return evalMember(node as MemberExpression, env);
    case "CallExpression":
      return evalCall(node as CallExpression, env);
    case "VarDeclaration":
      return evalVarDeclaration(node as VarDeclaration, env);
    case "FunctionDeclaration":
      return evalFunctionDeclaration(node as FunctionDeclaration, env);
    case "ReturnStatement":
      throw new ReturnSignal(evaluate((node as ReturnStatement).value, env));
    case "BlockStatement":
      return evalBlock(node as BlockStatement, env);
    case "IfStatement":
      return evalIf(node as IfStatement, env);
    case "WhileStatement":
      return evalWhile(node as WhileStatement, env);
    case "ForStatement":
      return evalFor(node as ForStatement, env);
    case "Program":
      return evalProgram(node as Program, env);
    default:
      throw new RuntimeError(`نوع غير معروف في الشجرة: ${node.kind}`);
  }
}

function evalProgram(program: Program, env: Environment): RuntimeValue {
  let last: RuntimeValue = makeNull();
  for (const statement of program.body) {
    last = evaluate(statement, env);
  }
  return last;
}

// ---------- Control flow ----------

function evalCondition(node: Expression, env: Environment): boolean {
  const value = evaluate(node, env);
  if (value.type !== "boolean") {
    throw new RuntimeError(
      `الشرط يجب أن يكون صواب أو خطأ، لكن وُجد ${value.type}`,
    );
  }
  return value.value;
}

function evalBlock(block: BlockStatement, env: Environment): RuntimeValue {
  const scope = new Environment(env);
  for (const statement of block.body) {
    evaluate(statement, scope);
  }
  return makeNull();
}

function evalIf(node: IfStatement, env: Environment): RuntimeValue {
  if (evalCondition(node.condition, env)) {
    return evaluate(node.consequent, env);
  }
  if (node.alternate) {
    return evaluate(node.alternate, env);
  }
  return makeNull();
}

function evalWhile(node: WhileStatement, env: Environment): RuntimeValue {
  while (evalCondition(node.condition, env)) {
    evaluate(node.body, env);
  }
  return makeNull();
}

function evalFor(node: ForStatement, env: Environment): RuntimeValue {
  const scope = new Environment(env);

  if (node.init) evaluate(node.init, scope);

  while (node.condition === undefined || evalCondition(node.condition, scope)) {
    evaluate(node.body, scope);
    if (node.update) evaluate(node.update, scope);
  }
  return makeNull();
}

// ---------- Operators ----------

function valuesEqual(a: RuntimeValue, b: RuntimeValue): boolean {
  if (a.type === "number" && b.type === "number") return a.value === b.value;
  if (a.type === "string" && b.type === "string") return a.value === b.value;
  if (a.type === "boolean" && b.type === "boolean") return a.value === b.value;
  if (a.type === "null" && b.type === "null") return true;
  return a === b;
}

function relational(op: string, cmp: number): RuntimeValue {
  switch (op) {
    case "<":
      return makeBoolean(cmp < 0);
    case ">":
      return makeBoolean(cmp > 0);
    case "<=":
      return makeBoolean(cmp <= 0);
    case ">=":
      return makeBoolean(cmp >= 0);
    default:
      throw new RuntimeError(`عملية مقارنة غير معروفة: ${op}`);
  }
}

function evalBinary(node: BinaryExpression, env: Environment): RuntimeValue {
  const left = evaluate(node.left, env);
  const right = evaluate(node.right, env);
  const op = node.operator;

  if (op === "==") return makeBoolean(valuesEqual(left, right));
  if (op === "!=") return makeBoolean(!valuesEqual(left, right));

  if (op === "+" && (left.type === "string" || right.type === "string")) {
    return makeString(formatValue(left) + formatValue(right));
  }

  if (op === "<" || op === ">" || op === "<=" || op === ">=") {
    if (left.type === "number" && right.type === "number") {
      const cmp =
        left.value < right.value ? -1 : left.value > right.value ? 1 : 0;
      return relational(op, cmp);
    }
    if (left.type === "string" && right.type === "string") {
      const cmp =
        left.value < right.value ? -1 : left.value > right.value ? 1 : 0;
      return relational(op, cmp);
    }
    throw new RuntimeError(
      `لا يمكن مقارنة ${left.type} مع ${right.type} باستخدام '${op}'`,
    );
  }

  if (left.type !== "number" || right.type !== "number") {
    throw new RuntimeError(
      `لا يمكن تطبيق '${op}' على ${left.type} و ${right.type}`,
    );
  }

  const a = left.value;
  const b = right.value;

  switch (op) {
    case "+":
      return makeNumber(a + b);
    case "-":
      return makeNumber(a - b);
    case "*":
      return makeNumber(a * b);
    case "/":
      if (b === 0) throw new RuntimeError("لا يمكن القسمة على صفر");
      return makeNumber(a / b);
    default:
      throw new RuntimeError(`عملية غير معروفة: ${op}`);
  }
}

// ---------- Declarations, assignment, objects ----------

function evalVarDeclaration(
  node: VarDeclaration,
  env: Environment,
): RuntimeValue {
  const value = node.value ? evaluate(node.value, env) : makeNull();
  return env.declare(node.identifier.symbol, value, node.isConstant);
}

function evalFunctionDeclaration(
  node: FunctionDeclaration,
  env: Environment,
): RuntimeValue {
  const fn: FunctionValue = {
    type: "function",
    name: node.name,
    params: node.params,
    body: node.body,
    closure: env,
  };
  return env.declare(node.name, fn, true);
}

function evalAssignment(
  node: AssignmentExpression,
  env: Environment,
): RuntimeValue {
  const value = evaluate(node.value, env);
  const target = node.assignee;

  if (target.kind === "Identifier") {
    return env.assign((target as Identifier).symbol, value);
  }

  if (target.kind === "MemberExpression") {
    const member = target as MemberExpression;
    const object = evaluate(member.object, env);
    if (object.type !== "object") {
      throw new RuntimeError("لا يمكن تعيين خاصية على قيمة ليست كائناً");
    }
    object.properties.set(memberKey(member, env), value);
    return value;
  }

  throw new RuntimeError("هدف التعيين غير صالح");
}

function evalObject(node: ObjectLiteral, env: Environment): RuntimeValue {
  const properties = new Map<string, RuntimeValue>();
  for (const prop of node.properties) {
    const value = prop.value ? evaluate(prop.value, env) : env.lookup(prop.key);
    properties.set(prop.key, value);
  }
  return makeObject(properties);
}

function memberKey(member: MemberExpression, env: Environment): string {
  if (!member.computed) return (member.property as Identifier).symbol;

  const key = evaluate(member.property, env);
  if (key.type !== "number" && key.type !== "string") {
    throw new RuntimeError(
      "مفتاح الوصول بالأقواس [ ] يجب أن يكون رقماً أو نصاً",
    );
  }
  return String(key.value);
}

function evalMember(node: MemberExpression, env: Environment): RuntimeValue {
  const object = evaluate(node.object, env);
  if (object.type !== "object") {
    throw new RuntimeError("لا يمكن قراءة خاصية من قيمة ليست كائناً");
  }
  return object.properties.get(memberKey(node, env)) ?? makeNull();
}

// ---------- Calls ----------

function evalCall(node: CallExpression, env: Environment): RuntimeValue {
  const callee = evaluate(node.caller, env);
  const args = node.args.map((arg) => evaluate(arg, env));

  if (callee.type === "native") return callee.call(args);

  if (callee.type !== "function") {
    throw new RuntimeError("لا يمكن استدعاء قيمة ليست دالة");
  }

  if (args.length !== callee.params.length) {
    throw new RuntimeError(
      `الدالة '${callee.name}' تتوقع ${callee.params.length} معاملات لكن أُعطيت ${args.length}`,
    );
  }

  const scope = new Environment(callee.closure);
  callee.params.forEach((param, i) => scope.declare(param, args[i], false));

  try {
    for (const statement of callee.body) {
      evaluate(statement, scope);
    }
  } catch (error) {
    if (error instanceof ReturnSignal) return error.value;
    throw error;
  }

  return makeNull();
}
