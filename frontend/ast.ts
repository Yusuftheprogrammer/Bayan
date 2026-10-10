export type NodeType =
  // Statements
  | "Program"
  | "VarDeclaration"
  | "FunctionDeclaration"
  | "ReturnStatement"
  | "BlockStatement"
  | "IfStatement"
  | "WhileStatement"
  | "ForStatement"
  // Expressions
  | "AssignmentExpression"
  | "MemberExpression"
  | "CallExpression"
  | "BinaryExpression"
  // Literals and pieces
  | "Property"
  | "ObjectLiteral"
  | "NumberLiteral"
  | "Identifier"
  | "StringLiteral";

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

export interface StringLiteral extends Expression {
  kind: "StringLiteral";
  value: string;
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

export interface BlockStatement extends Statement {
  kind: "BlockStatement";
  body: Statement[];
}

export interface IfStatement extends Statement {
  kind: "IfStatement";
  condition: Expression;
  consequent: BlockStatement;
  alternate?: BlockStatement | IfStatement;
}

export interface WhileStatement extends Statement {
  kind: "WhileStatement";
  condition: Expression;
  body: BlockStatement;
}

export interface ForStatement extends Statement {
  kind: "ForStatement";
  init?: Statement;
  condition?: Expression;
  update?: Expression;
  body: BlockStatement;
}

