export type NodeType =
  // Statements
  | "Program"
  | "VarDeclaration"
  | "FunctionDeclaration"
  | "ReturnStatement"
  // Expressions
  | "AssignmentExpression"
  | "MemberExpression"
  | "CallExpression"
  | "BinaryExpression"
  // Literals and pieces
  | "Property"
  | "ObjectLiteral"
  | "NumberLiteral"
  | "Identifier";

export interface Statement {
  kind: NodeType;
}

export interface Program extends Statement {
  kind: "Program";
  body: Statement[];
}

export interface Expression extends Statement {}

export interface BinaryExpression extends Expression {
  kind: "BinaryExpression";
  left: Expression;
  right: Expression;
  operator: string;
}

export interface Identifier extends Expression {
  kind: "Identifier";
  symbol: string;
}

export interface NumberLiteral extends Expression {
  kind: "NumberLiteral";
  value: number;
}

export interface Property extends Expression {
  kind: "Property";
  key: string;
  value?: Expression;
}

export interface ObjectLiteral extends Expression {
  kind: "ObjectLiteral";
  properties: Property[];
}

export interface VarDeclaration extends Statement {
  kind: "VarDeclaration";
  isConstant: boolean;
  identifier: Identifier;
  value?: Expression;
}

export interface AssignmentExpression extends Expression {
  kind: "AssignmentExpression";
  assignee: Expression;
  value: Expression;
}

export interface MemberExpression extends Expression {
  kind: "MemberExpression";
  object: Expression;
  property: Expression;
  computed: boolean;
}

export interface CallExpression extends Expression {
  kind: "CallExpression";
  args: Expression[];
  caller: Expression;
}

export interface FunctionDeclaration extends Statement {
  kind: "FunctionDeclaration";
  name: string;
  params: string[];
  body: Statement[];
}

export interface ReturnStatement extends Statement {
  kind: "ReturnStatement";
  value: Expression;
}
