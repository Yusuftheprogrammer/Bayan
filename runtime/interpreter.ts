import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  FunctionDeclaration,
  Identifier,
  MemberExpression,
  NumberLiteral,
  ObjectLiteral,
  Program,
  ReturnStatement,
  Statement,
  VarDeclaration,
} from "../frontend/ast.ts";
import { Environment, RuntimeError } from "./env.ts";
import {
  FunctionValue,
  makeBoolean,
  makeNative,
  makeNull,
  makeNumber,
  makeObject,
  RuntimeValue,
} from "./values.ts";

export class ReturnSignal {
  constructor(public value: RuntimeValue) {}
}

export function createGlobalEnv(): Environment {
  const env = new Environment();
  env.declare("صح", makeBoolean(true), true);
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
    case "boolean":
      return value.value ? "صح" : "خطأ";
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

function evalBinary(node: BinaryExpression, env: Environment): RuntimeValue {
  const left = evaluate(node.left, env);
  const right = evaluate(node.right, env);

  if (left.type !== "number" || right.type !== "number") {
    throw new RuntimeError(
      `لا يمكن تطبيق '${node.operator}' على ${left.type} و ${right.type}`,
    );
  }

  const a = left.value;
  const b = right.value;

  switch (node.operator) {
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
      throw new RuntimeError(`عملية غير معروفة: ${node.operator}`);
  }
}

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
  if (key.type !== "number") {
    throw new RuntimeError("مفتاح الوصول بالأقواس [ ] يجب أن يكون رقماً");
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