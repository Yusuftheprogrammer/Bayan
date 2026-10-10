import {
  AssignmentExpression,
  Expression,
  FunctionDeclaration,
  Identifier,
  ReturnStatement,
  Statement,
  VarDeclaration,
  BinaryExpression,
  MemberExpression,
  CallExpression,
  Program,
  Property,
  ObjectLiteral,
  NumberLiteral,
  BlockStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  StringLiteral,
} from "./ast.ts";
import { Token, tokenize, TokenType } from "./lexer.ts";

export class ParseError extends Error {}

export default class Parser {
  /*  Order of precedence (lowest binds loosest, highest binds tightest)
      Assignment            =
      Additive              +  -
      Multiplicative        *  /
      Call / Member         f()  a.b  a[i]
      Primary               number, name, ( ... ), { ... }
  */

  private tokens: Token[] = [];
  private pos = 0;

  // Helper Functions

  private notEOF() {
    return this.at().type !== TokenType.EOF;
  }

  private at() {
    return this.tokens[this.pos];
  }

  private eat() {
    const token = this.tokens[this.pos];
    if (token.type !== TokenType.EOF) this.pos++;
    return token;
  }

  private expect(type: TokenType, message: string) {
    const token = this.at();
    if (token.type !== type) {
      throw new ParseError(
        `${message}\n  وُجد: ${token.type} ("${token.value}")`,
      );
    }
    return this.eat();
  }

  private parseCommaList<T>(close: TokenType, parseItem: () => T): T[] {
    const items: T[] = [];
    while (this.at().type !== close) {
      items.push(parseItem());
      if (this.at().type !== close) {
        this.expect(TokenType.Comma, "كان من المتوقع علامة الفاصلة");
      }
    }
    return items;
  }

  // ---------- Statements ----------

  private parseStatement(): Statement {
    switch (this.at().type) {
      case TokenType.Let:
      case TokenType.Const:
        return this.parseVarDeclaration();
      case TokenType.Function:
        return this.parseFunctionDeclaration();
      case TokenType.Return:
        return this.parseReturnStatement();
      case TokenType.If:
        return this.parseIfStatement();
      case TokenType.While:
        return this.parseWhileStatement();
      case TokenType.For:
        return this.parseForStatement();
      default: {
        const expression = this.parseExpression();
        this.expect(TokenType.SemiColon, "يجب انهاء الجملة بعلامة ؛");
        return expression;
      }
    }
  }

  private parseBlock(): BlockStatement {
    this.expect(TokenType.LeftBrace, "كان من المتوقع '{'");
    const body: Statement[] = [];
    while (this.notEOF() && this.at().type !== TokenType.RightBrace) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RightBrace, "كان من المتوقع '}'");
    return { kind: "BlockStatement", body };
  }

  private parseVarDeclaration(): VarDeclaration {
    const isConstant = this.eat().type === TokenType.Const;
    const name = this.expect(
      TokenType.Identifier,
      "يجب تحديد اسم المتغير",
    ).value;
    const identifier: Identifier = { kind: "Identifier", symbol: name };
    let value: Expression | undefined;
    if (this.at().type === TokenType.EqualOperator) {
      this.eat();
      value = this.parseExpression();
    } else if (isConstant) {
      throw new ParseError(`الثابت '${name}' يجب أن تُعيّن له قيمة`);
    }
    this.expect(TokenType.SemiColon, "يجب إنهاء الجملة بالعلامة '؛'");
    return { kind: "VarDeclaration", isConstant, identifier, value };
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    this.eat();

    const name = this.expect(
      TokenType.Identifier,
      "يجب تحديد اسم للدالة",
    ).value;
    this.expect(TokenType.LeftParen, "كان من المتوقع '('");
    const params = this.parseCommaList(
      TokenType.RightParen,
      () =>
        this.expect(TokenType.Identifier, "كان من المتوقع اسم المعامل").value,
    );
    this.expect(TokenType.RightParen, "كان من المتوقع ')'");

    this.expect(TokenType.LeftBrace, "كان من المتوقع '{'");
    const body: Statement[] = [];
    while (this.notEOF() && this.at().type !== TokenType.RightBrace) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RightBrace, "كان من المتوقع '}'");

    return { kind: "FunctionDeclaration", name, params, body };
  }

  private parseReturnStatement(): ReturnStatement {
    this.eat();
    const value = this.parseExpression();
    this.expect(TokenType.SemiColon, "يجب إنهاء الجملة بالعلامة '؛'");
    return { kind: "ReturnStatement", value };
  }

  private parseIfStatement(): IfStatement {
    this.eat();
    this.expect(TokenType.LeftParen, "كان من المتوقع '(' بعد إذا");
    const condition = this.parseExpression();
    this.expect(TokenType.RightParen, "كان من المتوقع ')' بعد الشرط");
    const consequent = this.parseBlock();

    let alternate: IfStatement | BlockStatement | undefined;
    if (this.at().type === TokenType.Else) {
      this.eat();
      alternate =
        this.at().type === TokenType.If
          ? this.parseIfStatement()
          : this.parseBlock();
    }
    return { kind: "IfStatement", condition, consequent, alternate };
  }

  private parseWhileStatement(): WhileStatement {
    this.eat();
    this.expect(TokenType.LeftParen, "كان من المتوقع '(' بعد طالما");
    const condition = this.parseExpression();
    this.expect(TokenType.RightParen, "كان من المتوقع ')' بعد الشرط");
    const body = this.parseBlock();
    return { kind: "WhileStatement", condition, body };
  }

  private parseForStatement(): ForStatement {
    this.eat();
    this.expect(TokenType.LeftParen, "كان من المتوقع '(' بعد لكل");

    let init: Statement | undefined;
    if (this.at().type === TokenType.SemiColon) {
      this.eat();
    } else if (
      this.at().type === TokenType.Let ||
      this.at().type === TokenType.Const
    ) {
      init = this.parseVarDeclaration();
    } else {
      init = this.parseExpression();
      this.expect(TokenType.SemiColon, "كان من المتوقع '؛' بعد جزء البداية");
    }

    let condition: Expression | undefined;
    if (this.at().type !== TokenType.SemiColon) {
      condition = this.parseExpression();
    }
    this.expect(TokenType.SemiColon, "كان من المتوقع '؛' بعد الشرط");

    let update: Expression | undefined;
    if (this.at().type !== TokenType.RightParen) {
      update = this.parseExpression();
    }
    this.expect(TokenType.RightParen, "كان من المتوقع ')' بعد رأس الحلقة");

    const body = this.parseBlock();
    return { kind: "ForStatement", init, condition, update, body };
  }

  // ---------- Expressions ----------

  private parseExpression(): Expression {
    return this.parseAssignment();
  }

  private parseAssignment(): Expression {
    const left = this.parseEquality();

    if (this.at().type === TokenType.EqualOperator) {
      if (left.kind !== "Identifier" && left.kind !== "MemberExpression") {
        throw new ParseError(
          "الطرف الأيسر من التعيين يجب أن يكون متغيراً أو خاصية",
        );
      }
      this.eat();

      const value = this.parseAssignment();
      const node: AssignmentExpression = {
        kind: "AssignmentExpression",
        assignee: left,
        value,
      };
      return node;
    }

    return left;
  }

  private parseBinary(
    parseOperand: () => Expression,
    operators: TokenType[],
  ): Expression {
    let left = parseOperand();

    while (operators.includes(this.at().type)) {
      const operator = this.eat().value;
      const right = parseOperand();
      const node: BinaryExpression = {
        kind: "BinaryExpression",
        left,
        right,
        operator,
      };
      left = node;
    }

    return left;
  }

  private parseEquality(): Expression {
    return this.parseBinary(() => this.parseRelational(), [TokenType.Equals, TokenType.NotEquals]);
  }

  private parseRelational(): Expression {
    return this.parseBinary(
      () => this.parseAddtiveAndSubtractive(),
      [
        TokenType.LessThan,
        TokenType.GreaterThan,
        TokenType.LessThanOrEqual,
        TokenType.GreaterThanOrEqual,
      ],
    );
  }

  private parseAddtiveAndSubtractive(): Expression {
    return this.parseBinary(
      () => this.parseMultiplactiveAndDivison(),
      [TokenType.AddingOperator, TokenType.SubtractionOperator],
    );
  }

  private parseMultiplactiveAndDivison(): Expression {
    return this.parseBinary(
      () => this.parseCallMember(),
      [TokenType.MultiplicationOperator, TokenType.DivisionOperator],
    );
  }

  private parseCallMember(): Expression {
    let expression = this.parsePrimary();

    while (true) {
      const type = this.at().type;
      if (type === TokenType.Dot) {
        this.eat();
        const name = this.expect(
          TokenType.Identifier,
          "كان من المتوقع اسم الخاصية بعد '.'",
        ).value;
        const property: Identifier = {
          kind: "Identifier",
          symbol: name,
        };
        const node: MemberExpression = {
          kind: "MemberExpression",
          object: expression,
          property,
          computed: false,
        };
        expression = node;
      } else if (type === TokenType.LeftBracket) {
        this.eat();
        const property = this.parseExpression();
        this.expect(TokenType.RightBracket, "كان من المتوقع ']'");
        const node: MemberExpression = {
          kind: "MemberExpression",
          object: expression,
          property,
          computed: true,
        };
        expression = node;
      } else if (type === TokenType.LeftParen) {
        this.eat();
        const args = this.parseCommaList(TokenType.RightParen, () =>
          this.parseExpression(),
        );
        this.expect(TokenType.RightParen, "كان من المتوقع ')'");
        const node: CallExpression = {
          kind: "CallExpression",
          caller: expression,
          args,
        };
        expression = node;
      } else {
        break;
      }
    }
    return expression;
  }

  private parsePrimary(): Expression {
    const token = this.at();

    switch (token.type) {
      case TokenType.Identifier: {
        this.eat();
        const node: Identifier = { kind: "Identifier", symbol: token.value };
        return node;
      }
      case TokenType.Number: {
        this.eat();
        const node: NumberLiteral = {
          kind: "NumberLiteral",
          value: parseFloat(token.value),
        };
        return node;
      }
      case TokenType.String: {
        this.eat();
        const node: StringLiteral = {
          kind: "StringLiteral",
          value: token.value,
        };
        return node;
      }
      case TokenType.LeftParen: {
        this.eat();
        const inner = this.parseExpression();
        this.expect(TokenType.RightParen, "قوس الإغلاق ')' مفقود");
        return inner;
      }
      case TokenType.LeftBrace:
        return this.parseObjectLiteral();
      default:
        throw new ParseError(
          `رمز غير متوقع أثناء التحليل: ${token.type} ("${token.value}")`,
        );
    }
  }

  // ---------- Objects ----------

  private parseObjectLiteral(): ObjectLiteral {
    this.expect(TokenType.LeftBrace, "كان من المتوقع '{'");
    const properties = this.parseCommaList(TokenType.RightBrace, () =>
      this.parseProperty(),
    );
    this.expect(TokenType.RightBrace, "كان من المتوقع '}'");
    return { kind: "ObjectLiteral", properties };
  }

  private parseProperty(): Property {
    const key = this.expect(
      TokenType.Identifier,
      "يجب تحديد اسم الخاصية",
    ).value;

    // Shorthand: { key } or { key, other: 1 }
    if (
      this.at().type === TokenType.Comma ||
      this.at().type === TokenType.RightBrace
    ) {
      return { kind: "Property", key };
    }

    this.expect(TokenType.Colon, `يجب وضع ':' بعد اسم الخاصية '${key}'`);
    return { kind: "Property", key, value: this.parseExpression() };
  }

  // ---------- Entry point ----------

  public produceAST(sourceCode: string): Program {
    this.tokens = tokenize(sourceCode);
    this.pos = 0;

    const body: Statement[] = [];
    while (this.notEOF()) {
      body.push(this.parseStatement());
    }

    return { kind: "Program", body };
  }
}
