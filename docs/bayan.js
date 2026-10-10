// frontend/lexer.ts
var LexError = class extends Error {
};
var KEYWORD = {
  \u0645\u062A\u063A\u064A\u0631: "Let" /* Let */,
  \u062B\u0627\u0628\u062A: "Const" /* Const */,
  \u062F\u0627\u0644\u0629: "Function" /* Function */,
  \u0627\u0631\u062C\u0639: "Return" /* Return */,
  \u0625\u0630\u0627: "If" /* If */,
  \u0648\u0625\u0644\u0627: "Else" /* Else */,
  \u0637\u0627\u0644\u0645\u0627: "While" /* While */,
  \u0644\u0643\u0644: "For" /* For */
};
var SINGLE_CHAR = {
  "(": "LeftParen" /* LeftParen */,
  ")": "RightParen" /* RightParen */,
  "[": "LeftBracket" /* LeftBracket */,
  "]": "RightBracket" /* RightBracket */,
  "{": "LeftBrace" /* LeftBrace */,
  "}": "RightBrace" /* RightBrace */,
  "+": "AddingOperator" /* AddingOperator */,
  "-": "SubtractionOperator" /* SubtractionOperator */,
  "*": "MultiplicationOperator" /* MultiplicationOperator */,
  ":": "Colon" /* Colon */,
  ".": "Dot" /* Dot */,
  "\u060C": "Comma" /* Comma */,
  ",": "Comma" /* Comma */,
  "\u061B": "SemiColon" /* SemiColon */,
  ";": "SemiColon" /* SemiColon */
};
var ESCAPES = {
  n: "\n",
  t: "	",
  '"': '"',
  "\\": "\\"
};
function createToken(value = "", type) {
  return { value, type };
}
function isAlpha(src) {
  const code = src.charCodeAt(0);
  const isLatin = src.toUpperCase() != src.toLowerCase();
  const isArabic = code >= 1536 && code <= 1791 && src !== "\u061B" && src !== "\u060C" && src !== "\u061F";
  return isLatin || isArabic;
}
function isNum(src) {
  return src >= "0" && src <= "9";
}
function isSkippable(src) {
  return src === " " || src === "\n" || src === "	" || src === "\r" || src === "\xA0" || src === "\uFEFF" || src === "\u200E" || src === "\u200F";
}
function tokenize(sourceCode) {
  const tokens = new Array();
  const src = Array.from(sourceCode);
  const next = () => src.shift();
  while (src.length > 0) {
    const char = src[0];
    const single = SINGLE_CHAR[char];
    if (single !== void 0) {
      tokens.push(createToken(next(), single));
    } else if (char === "/") {
      if (src[1] === "/") {
        while (src.length > 0 && src[0] !== "\n") src.shift();
      } else {
        tokens.push(createToken(next(), "DivisionOperator" /* DivisionOperator */));
      }
    } else if (char === "=") {
      if (src[1] === "=") {
        next();
        next();
        tokens.push(createToken("==", "Equals" /* Equals */));
      } else {
        tokens.push(createToken(next(), "EqualOperator" /* EqualOperator */));
      }
    } else if (char === "<") {
      if (src[1] === "=") {
        next();
        next();
        tokens.push(createToken("<=", "LessThanOrEqual" /* LessThanOrEqual */));
      } else {
        tokens.push(createToken(next(), "LessThan" /* LessThan */));
      }
    } else if (char === ">") {
      if (src[1] === "=") {
        next();
        next();
        tokens.push(createToken(">=", "GreaterThanOrEqual" /* GreaterThanOrEqual */));
      } else {
        tokens.push(createToken(next(), "GreaterThan" /* GreaterThan */));
      }
    } else if (char === "!") {
      if (src[1] !== "=") {
        throw new LexError("\u062D\u0631\u0641 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639: '!' (\u0647\u0644 \u062A\u0642\u0635\u062F '!=' \u061F)");
      }
      next();
      next();
      tokens.push(createToken("!=", "NotEquals" /* NotEquals */));
    } else if (char === '"') {
      next();
      let text = "";
      while (src.length > 0 && src[0] !== '"') {
        if (src[0] === "\\") {
          next();
          const escaped = next();
          text += ESCAPES[escaped] ?? escaped;
        } else {
          text += next();
        }
      }
      if (src[0] !== '"') {
        throw new LexError('\u0646\u0635 \u063A\u064A\u0631 \u0645\u0646\u062A\u0647\u064A: \u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u0627\u0642\u062A\u0628\u0627\u0633 " \u0627\u0644\u062E\u062A\u0627\u0645\u064A\u0629 \u0645\u0641\u0642\u0648\u062F\u0629');
      }
      next();
      tokens.push(createToken(text, "String" /* String */));
    } else if (isNum(char)) {
      let num = "";
      let seenDot = false;
      while (src.length > 0 && (isNum(src[0]) || src[0] === "." && !seenDot && isNum(src[1] ?? ""))) {
        if (src[0] === ".") seenDot = true;
        num += next();
      }
      tokens.push(createToken(num, "Number" /* Number */));
    } else if (isAlpha(char) || char === "_") {
      let ident = "";
      while (src.length > 0 && (isAlpha(src[0]) || isNum(src[0]) || src[0] === "_")) {
        ident += next();
      }
      if (Object.hasOwn(KEYWORD, ident)) {
        tokens.push(createToken(ident, KEYWORD[ident]));
      } else {
        tokens.push(createToken(ident, "Identifier" /* Identifier */));
      }
    } else if (isSkippable(char)) {
      next();
    } else {
      throw new LexError(`\u062D\u0631\u0641 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641: '${char}'`);
    }
  }
  tokens.push({ type: "EOF" /* EOF */, value: "\u0646\u0647\u0627\u064A\u0629 \u0627\u0644\u0645\u0644\u0641" });
  return tokens;
}

// frontend/parser.ts
var ParseError = class extends Error {
};
var Parser = class {
  /*  Order of precedence (lowest binds loosest, highest binds tightest)
      Assignment            =
      Additive              +  -
      Multiplicative        *  /
      Call / Member         f()  a.b  a[i]
      Primary               number, name, ( ... ), { ... }
  */
  tokens = [];
  pos = 0;
  // Helper Functions
  notEOF() {
    return this.at().type !== "EOF" /* EOF */;
  }
  at() {
    return this.tokens[this.pos];
  }
  eat() {
    const token = this.tokens[this.pos];
    if (token.type !== "EOF" /* EOF */) this.pos++;
    return token;
  }
  expect(type, message) {
    const token = this.at();
    if (token.type !== type) {
      throw new ParseError(
        `${message}
  \u0648\u064F\u062C\u062F: ${token.type} ("${token.value}")`
      );
    }
    return this.eat();
  }
  parseCommaList(close, parseItem) {
    const items = [];
    while (this.at().type !== close) {
      items.push(parseItem());
      if (this.at().type !== close) {
        this.expect("Comma" /* Comma */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 \u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u0641\u0627\u0635\u0644\u0629");
      }
    }
    return items;
  }
  // ---------- Statements ----------
  parseStatement() {
    switch (this.at().type) {
      case "Let" /* Let */:
      case "Const" /* Const */:
        return this.parseVarDeclaration();
      case "Function" /* Function */:
        return this.parseFunctionDeclaration();
      case "Return" /* Return */:
        return this.parseReturnStatement();
      case "If" /* If */:
        return this.parseIfStatement();
      case "While" /* While */:
        return this.parseWhileStatement();
      case "For" /* For */:
        return this.parseForStatement();
      default: {
        const expression = this.parseExpression();
        this.expect("SemiColon" /* SemiColon */, "\u064A\u062C\u0628 \u0627\u0646\u0647\u0627\u0621 \u0627\u0644\u062C\u0645\u0644\u0629 \u0628\u0639\u0644\u0627\u0645\u0629 \u061B");
        return expression;
      }
    }
  }
  parseBlock() {
    this.expect("LeftBrace" /* LeftBrace */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '{'");
    const body = [];
    while (this.notEOF() && this.at().type !== "RightBrace" /* RightBrace */) {
      body.push(this.parseStatement());
    }
    this.expect("RightBrace" /* RightBrace */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '}'");
    return { kind: "BlockStatement", body };
  }
  parseVarDeclaration() {
    const isConstant = this.eat().type === "Const" /* Const */;
    const name = this.expect(
      "Identifier" /* Identifier */,
      "\u064A\u062C\u0628 \u062A\u062D\u062F\u064A\u062F \u0627\u0633\u0645 \u0627\u0644\u0645\u062A\u063A\u064A\u0631"
    ).value;
    const identifier = { kind: "Identifier", symbol: name };
    let value;
    if (this.at().type === "EqualOperator" /* EqualOperator */) {
      this.eat();
      value = this.parseExpression();
    } else if (isConstant) {
      throw new ParseError(`\u0627\u0644\u062B\u0627\u0628\u062A '${name}' \u064A\u062C\u0628 \u0623\u0646 \u062A\u064F\u0639\u064A\u0651\u0646 \u0644\u0647 \u0642\u064A\u0645\u0629`);
    }
    this.expect("SemiColon" /* SemiColon */, "\u064A\u062C\u0628 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u062C\u0645\u0644\u0629 \u0628\u0627\u0644\u0639\u0644\u0627\u0645\u0629 '\u061B'");
    return { kind: "VarDeclaration", isConstant, identifier, value };
  }
  parseFunctionDeclaration() {
    this.eat();
    const name = this.expect(
      "Identifier" /* Identifier */,
      "\u064A\u062C\u0628 \u062A\u062D\u062F\u064A\u062F \u0627\u0633\u0645 \u0644\u0644\u062F\u0627\u0644\u0629"
    ).value;
    this.expect("LeftParen" /* LeftParen */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '('");
    const params = this.parseCommaList(
      "RightParen" /* RightParen */,
      () => this.expect("Identifier" /* Identifier */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 \u0627\u0633\u0645 \u0627\u0644\u0645\u0639\u0627\u0645\u0644").value
    );
    this.expect("RightParen" /* RightParen */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 ')'");
    this.expect("LeftBrace" /* LeftBrace */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '{'");
    const body = [];
    while (this.notEOF() && this.at().type !== "RightBrace" /* RightBrace */) {
      body.push(this.parseStatement());
    }
    this.expect("RightBrace" /* RightBrace */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '}'");
    return { kind: "FunctionDeclaration", name, params, body };
  }
  parseReturnStatement() {
    this.eat();
    const value = this.parseExpression();
    this.expect("SemiColon" /* SemiColon */, "\u064A\u062C\u0628 \u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u062C\u0645\u0644\u0629 \u0628\u0627\u0644\u0639\u0644\u0627\u0645\u0629 '\u061B'");
    return { kind: "ReturnStatement", value };
  }
  parseIfStatement() {
    this.eat();
    this.expect("LeftParen" /* LeftParen */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '(' \u0628\u0639\u062F \u0625\u0630\u0627");
    const condition = this.parseExpression();
    this.expect("RightParen" /* RightParen */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 ')' \u0628\u0639\u062F \u0627\u0644\u0634\u0631\u0637");
    const consequent = this.parseBlock();
    let alternate;
    if (this.at().type === "Else" /* Else */) {
      this.eat();
      alternate = this.at().type === "If" /* If */ ? this.parseIfStatement() : this.parseBlock();
    }
    return { kind: "IfStatement", condition, consequent, alternate };
  }
  parseWhileStatement() {
    this.eat();
    this.expect("LeftParen" /* LeftParen */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '(' \u0628\u0639\u062F \u0637\u0627\u0644\u0645\u0627");
    const condition = this.parseExpression();
    this.expect("RightParen" /* RightParen */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 ')' \u0628\u0639\u062F \u0627\u0644\u0634\u0631\u0637");
    const body = this.parseBlock();
    return { kind: "WhileStatement", condition, body };
  }
  parseForStatement() {
    this.eat();
    this.expect("LeftParen" /* LeftParen */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '(' \u0628\u0639\u062F \u0644\u0643\u0644");
    let init;
    if (this.at().type === "SemiColon" /* SemiColon */) {
      this.eat();
    } else if (this.at().type === "Let" /* Let */ || this.at().type === "Const" /* Const */) {
      init = this.parseVarDeclaration();
    } else {
      init = this.parseExpression();
      this.expect("SemiColon" /* SemiColon */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '\u061B' \u0628\u0639\u062F \u062C\u0632\u0621 \u0627\u0644\u0628\u062F\u0627\u064A\u0629");
    }
    let condition;
    if (this.at().type !== "SemiColon" /* SemiColon */) {
      condition = this.parseExpression();
    }
    this.expect("SemiColon" /* SemiColon */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '\u061B' \u0628\u0639\u062F \u0627\u0644\u0634\u0631\u0637");
    let update;
    if (this.at().type !== "RightParen" /* RightParen */) {
      update = this.parseExpression();
    }
    this.expect("RightParen" /* RightParen */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 ')' \u0628\u0639\u062F \u0631\u0623\u0633 \u0627\u0644\u062D\u0644\u0642\u0629");
    const body = this.parseBlock();
    return { kind: "ForStatement", init, condition, update, body };
  }
  // ---------- Expressions ----------
  parseExpression() {
    return this.parseAssignment();
  }
  parseAssignment() {
    const left = this.parseEquality();
    if (this.at().type === "EqualOperator" /* EqualOperator */) {
      if (left.kind !== "Identifier" && left.kind !== "MemberExpression") {
        throw new ParseError(
          "\u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u064A\u0633\u0631 \u0645\u0646 \u0627\u0644\u062A\u0639\u064A\u064A\u0646 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0645\u062A\u063A\u064A\u0631\u0627\u064B \u0623\u0648 \u062E\u0627\u0635\u064A\u0629"
        );
      }
      this.eat();
      const value = this.parseAssignment();
      const node = {
        kind: "AssignmentExpression",
        assignee: left,
        value
      };
      return node;
    }
    return left;
  }
  parseBinary(parseOperand, operators) {
    let left = parseOperand();
    while (operators.includes(this.at().type)) {
      const operator = this.eat().value;
      const right = parseOperand();
      const node = {
        kind: "BinaryExpression",
        left,
        right,
        operator
      };
      left = node;
    }
    return left;
  }
  parseEquality() {
    return this.parseBinary(() => this.parseRelational(), ["Equals" /* Equals */, "NotEquals" /* NotEquals */]);
  }
  parseRelational() {
    return this.parseBinary(
      () => this.parseAddtiveAndSubtractive(),
      [
        "LessThan" /* LessThan */,
        "GreaterThan" /* GreaterThan */,
        "LessThanOrEqual" /* LessThanOrEqual */,
        "GreaterThanOrEqual" /* GreaterThanOrEqual */
      ]
    );
  }
  parseAddtiveAndSubtractive() {
    return this.parseBinary(
      () => this.parseMultiplactiveAndDivison(),
      ["AddingOperator" /* AddingOperator */, "SubtractionOperator" /* SubtractionOperator */]
    );
  }
  parseMultiplactiveAndDivison() {
    return this.parseBinary(
      () => this.parseCallMember(),
      ["MultiplicationOperator" /* MultiplicationOperator */, "DivisionOperator" /* DivisionOperator */]
    );
  }
  parseCallMember() {
    let expression = this.parsePrimary();
    while (true) {
      const type = this.at().type;
      if (type === "Dot" /* Dot */) {
        this.eat();
        const name = this.expect(
          "Identifier" /* Identifier */,
          "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 \u0627\u0633\u0645 \u0627\u0644\u062E\u0627\u0635\u064A\u0629 \u0628\u0639\u062F '.'"
        ).value;
        const property = {
          kind: "Identifier",
          symbol: name
        };
        const node = {
          kind: "MemberExpression",
          object: expression,
          property,
          computed: false
        };
        expression = node;
      } else if (type === "LeftBracket" /* LeftBracket */) {
        this.eat();
        const property = this.parseExpression();
        this.expect("RightBracket" /* RightBracket */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 ']'");
        const node = {
          kind: "MemberExpression",
          object: expression,
          property,
          computed: true
        };
        expression = node;
      } else if (type === "LeftParen" /* LeftParen */) {
        this.eat();
        const args = this.parseCommaList(
          "RightParen" /* RightParen */,
          () => this.parseExpression()
        );
        this.expect("RightParen" /* RightParen */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 ')'");
        const node = {
          kind: "CallExpression",
          caller: expression,
          args
        };
        expression = node;
      } else {
        break;
      }
    }
    return expression;
  }
  parsePrimary() {
    const token = this.at();
    switch (token.type) {
      case "Identifier" /* Identifier */: {
        this.eat();
        const node = { kind: "Identifier", symbol: token.value };
        return node;
      }
      case "Number" /* Number */: {
        this.eat();
        const node = {
          kind: "NumberLiteral",
          value: parseFloat(token.value)
        };
        return node;
      }
      case "String" /* String */: {
        this.eat();
        const node = {
          kind: "StringLiteral",
          value: token.value
        };
        return node;
      }
      case "LeftParen" /* LeftParen */: {
        this.eat();
        const inner = this.parseExpression();
        this.expect("RightParen" /* RightParen */, "\u0642\u0648\u0633 \u0627\u0644\u0625\u063A\u0644\u0627\u0642 ')' \u0645\u0641\u0642\u0648\u062F");
        return inner;
      }
      case "LeftBrace" /* LeftBrace */:
        return this.parseObjectLiteral();
      default:
        throw new ParseError(
          `\u0631\u0645\u0632 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u062D\u0644\u064A\u0644: ${token.type} ("${token.value}")`
        );
    }
  }
  // ---------- Objects ----------
  parseObjectLiteral() {
    this.expect("LeftBrace" /* LeftBrace */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '{'");
    const properties = this.parseCommaList(
      "RightBrace" /* RightBrace */,
      () => this.parseProperty()
    );
    this.expect("RightBrace" /* RightBrace */, "\u0643\u0627\u0646 \u0645\u0646 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 '}'");
    return { kind: "ObjectLiteral", properties };
  }
  parseProperty() {
    const key = this.expect(
      "Identifier" /* Identifier */,
      "\u064A\u062C\u0628 \u062A\u062D\u062F\u064A\u062F \u0627\u0633\u0645 \u0627\u0644\u062E\u0627\u0635\u064A\u0629"
    ).value;
    if (this.at().type === "Comma" /* Comma */ || this.at().type === "RightBrace" /* RightBrace */) {
      return { kind: "Property", key };
    }
    this.expect("Colon" /* Colon */, `\u064A\u062C\u0628 \u0648\u0636\u0639 ':' \u0628\u0639\u062F \u0627\u0633\u0645 \u0627\u0644\u062E\u0627\u0635\u064A\u0629 '${key}'`);
    return { kind: "Property", key, value: this.parseExpression() };
  }
  // ---------- Entry point ----------
  produceAST(sourceCode) {
    this.tokens = tokenize(sourceCode);
    this.pos = 0;
    const body = [];
    while (this.notEOF()) {
      body.push(this.parseStatement());
    }
    return { kind: "Program", body };
  }
};

// runtime/env.ts
var RuntimeError = class extends Error {
};
var Environment = class {
  constructor(parent) {
    this.parent = parent;
  }
  parent;
  variables = /* @__PURE__ */ new Map();
  declare(name, value, isConstant) {
    if (this.variables.has(name)) {
      throw new RuntimeError(`\u0627\u0644\u0645\u0639\u0631\u0641 '${name}' \u0645\u0639\u0631\u0651\u0641 \u0645\u0633\u0628\u0642\u0627\u064B`);
    }
    this.variables.set(name, { value, isConstant });
    return value;
  }
  lookup(name) {
    return this.resolve(name).variables.get(name).value;
  }
  assign(name, value) {
    const record = this.resolve(name).variables.get(name);
    if (record.isConstant) {
      throw new RuntimeError(`\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0633\u0646\u0627\u062F \u0642\u064A\u0645\u0629 \u062C\u062F\u064A\u062F\u0629 \u0644\u0644\u062B\u0627\u0628\u062A '${name}'`);
    }
    record.value = value;
    return value;
  }
  resolve(name) {
    if (this.variables.has(name)) return this;
    if (this.parent) return this.parent.resolve(name);
    throw new RuntimeError(`\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0639\u0631\u0641 \u0628\u0627\u0633\u0645 '${name}'`);
  }
};

// runtime/values.ts
function makeNumber(num) {
  return { type: "number", value: num };
}
function makeString(text) {
  return { type: "string", value: text };
}
function makeBoolean(bool) {
  return { type: "boolean", value: bool };
}
function makeNull() {
  return { type: "null", value: null };
}
function makeObject(properties) {
  return { type: "object", properties };
}
function makeNative(name, call) {
  return { type: "native", name, call };
}

// runtime/interpreter.ts
var ReturnSignal = class {
  constructor(value) {
    this.value = value;
  }
  value;
};
function createGlobalEnv() {
  const env = new Environment();
  env.declare("\u0635\u0648\u0627\u0628", makeBoolean(true), true);
  env.declare("\u062E\u0637\u0623", makeBoolean(false), true);
  env.declare("\u0641\u0627\u0631\u063A", makeNull(), true);
  env.declare(
    "\u0627\u0637\u0628\u0639",
    makeNative("\u0627\u0637\u0628\u0639", (args) => {
      console.log(args.map(formatValue).join(" "));
      return makeNull();
    }),
    true
  );
  return env;
}
function formatValue(value) {
  switch (value.type) {
    case "number":
      return String(value.value);
    case "string":
      return value.value;
    case "boolean":
      return value.value ? "\u0635\u0648\u0627\u0628" : "\u062E\u0637\u0623";
    case "null":
      return "\u0641\u0627\u0631\u063A";
    case "object": {
      const parts = [...value.properties].map(
        ([key, v]) => `${key}: ${formatValue(v)}`
      );
      return `{ ${parts.join("\u060C ")} }`;
    }
    case "function":
    case "native":
      return `<\u062F\u0627\u0644\u0629 ${value.name}>`;
  }
}
function evaluate(node, env) {
  switch (node.kind) {
    case "NumberLiteral":
      return makeNumber(node.value);
    case "StringLiteral":
      return makeString(node.value);
    case "Identifier":
      return env.lookup(node.symbol);
    case "BinaryExpression":
      return evalBinary(node, env);
    case "AssignmentExpression":
      return evalAssignment(node, env);
    case "ObjectLiteral":
      return evalObject(node, env);
    case "MemberExpression":
      return evalMember(node, env);
    case "CallExpression":
      return evalCall(node, env);
    case "VarDeclaration":
      return evalVarDeclaration(node, env);
    case "FunctionDeclaration":
      return evalFunctionDeclaration(node, env);
    case "ReturnStatement":
      throw new ReturnSignal(evaluate(node.value, env));
    case "BlockStatement":
      return evalBlock(node, env);
    case "IfStatement":
      return evalIf(node, env);
    case "WhileStatement":
      return evalWhile(node, env);
    case "ForStatement":
      return evalFor(node, env);
    case "Program":
      return evalProgram(node, env);
    default:
      throw new RuntimeError(`\u0646\u0648\u0639 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641 \u0641\u064A \u0627\u0644\u0634\u062C\u0631\u0629: ${node.kind}`);
  }
}
function evalProgram(program, env) {
  let last = makeNull();
  for (const statement of program.body) {
    last = evaluate(statement, env);
  }
  return last;
}
function evalCondition(node, env) {
  const value = evaluate(node, env);
  if (value.type !== "boolean") {
    throw new RuntimeError(
      `\u0627\u0644\u0634\u0631\u0637 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0635\u0648\u0627\u0628 \u0623\u0648 \u062E\u0637\u0623\u060C \u0644\u0643\u0646 \u0648\u064F\u062C\u062F ${value.type}`
    );
  }
  return value.value;
}
function evalBlock(block, env) {
  const scope = new Environment(env);
  for (const statement of block.body) {
    evaluate(statement, scope);
  }
  return makeNull();
}
function evalIf(node, env) {
  if (evalCondition(node.condition, env)) {
    return evaluate(node.consequent, env);
  }
  if (node.alternate) {
    return evaluate(node.alternate, env);
  }
  return makeNull();
}
function evalWhile(node, env) {
  while (evalCondition(node.condition, env)) {
    evaluate(node.body, env);
  }
  return makeNull();
}
function evalFor(node, env) {
  const scope = new Environment(env);
  if (node.init) evaluate(node.init, scope);
  while (node.condition === void 0 || evalCondition(node.condition, scope)) {
    evaluate(node.body, scope);
    if (node.update) evaluate(node.update, scope);
  }
  return makeNull();
}
function valuesEqual(a, b) {
  if (a.type === "number" && b.type === "number") return a.value === b.value;
  if (a.type === "string" && b.type === "string") return a.value === b.value;
  if (a.type === "boolean" && b.type === "boolean") return a.value === b.value;
  if (a.type === "null" && b.type === "null") return true;
  return a === b;
}
function relational(op, cmp) {
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
      throw new RuntimeError(`\u0639\u0645\u0644\u064A\u0629 \u0645\u0642\u0627\u0631\u0646\u0629 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641\u0629: ${op}`);
  }
}
function evalBinary(node, env) {
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
      const cmp = left.value < right.value ? -1 : left.value > right.value ? 1 : 0;
      return relational(op, cmp);
    }
    if (left.type === "string" && right.type === "string") {
      const cmp = left.value < right.value ? -1 : left.value > right.value ? 1 : 0;
      return relational(op, cmp);
    }
    throw new RuntimeError(
      `\u0644\u0627 \u064A\u0645\u0643\u0646 \u0645\u0642\u0627\u0631\u0646\u0629 ${left.type} \u0645\u0639 ${right.type} \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 '${op}'`
    );
  }
  if (left.type !== "number" || right.type !== "number") {
    throw new RuntimeError(
      `\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0637\u0628\u064A\u0642 '${op}' \u0639\u0644\u0649 ${left.type} \u0648 ${right.type}`
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
      if (b === 0) throw new RuntimeError("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0642\u0633\u0645\u0629 \u0639\u0644\u0649 \u0635\u0641\u0631");
      return makeNumber(a / b);
    default:
      throw new RuntimeError(`\u0639\u0645\u0644\u064A\u0629 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641\u0629: ${op}`);
  }
}
function evalVarDeclaration(node, env) {
  const value = node.value ? evaluate(node.value, env) : makeNull();
  return env.declare(node.identifier.symbol, value, node.isConstant);
}
function evalFunctionDeclaration(node, env) {
  const fn = {
    type: "function",
    name: node.name,
    params: node.params,
    body: node.body,
    closure: env
  };
  return env.declare(node.name, fn, true);
}
function evalAssignment(node, env) {
  const value = evaluate(node.value, env);
  const target = node.assignee;
  if (target.kind === "Identifier") {
    return env.assign(target.symbol, value);
  }
  if (target.kind === "MemberExpression") {
    const member = target;
    const object = evaluate(member.object, env);
    if (object.type !== "object") {
      throw new RuntimeError("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u064A\u064A\u0646 \u062E\u0627\u0635\u064A\u0629 \u0639\u0644\u0649 \u0642\u064A\u0645\u0629 \u0644\u064A\u0633\u062A \u0643\u0627\u0626\u0646\u0627\u064B");
    }
    object.properties.set(memberKey(member, env), value);
    return value;
  }
  throw new RuntimeError("\u0647\u062F\u0641 \u0627\u0644\u062A\u0639\u064A\u064A\u0646 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D");
}
function evalObject(node, env) {
  const properties = /* @__PURE__ */ new Map();
  for (const prop of node.properties) {
    const value = prop.value ? evaluate(prop.value, env) : env.lookup(prop.key);
    properties.set(prop.key, value);
  }
  return makeObject(properties);
}
function memberKey(member, env) {
  if (!member.computed) return member.property.symbol;
  const key = evaluate(member.property, env);
  if (key.type !== "number" && key.type !== "string") {
    throw new RuntimeError(
      "\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u0648\u0635\u0648\u0644 \u0628\u0627\u0644\u0623\u0642\u0648\u0627\u0633 [ ] \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0631\u0642\u0645\u0627\u064B \u0623\u0648 \u0646\u0635\u0627\u064B"
    );
  }
  return String(key.value);
}
function evalMember(node, env) {
  const object = evaluate(node.object, env);
  if (object.type !== "object") {
    throw new RuntimeError("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0642\u0631\u0627\u0621\u0629 \u062E\u0627\u0635\u064A\u0629 \u0645\u0646 \u0642\u064A\u0645\u0629 \u0644\u064A\u0633\u062A \u0643\u0627\u0626\u0646\u0627\u064B");
  }
  return object.properties.get(memberKey(node, env)) ?? makeNull();
}
function evalCall(node, env) {
  const callee = evaluate(node.caller, env);
  const args = node.args.map((arg) => evaluate(arg, env));
  if (callee.type === "native") return callee.call(args);
  if (callee.type !== "function") {
    throw new RuntimeError("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0633\u062A\u062F\u0639\u0627\u0621 \u0642\u064A\u0645\u0629 \u0644\u064A\u0633\u062A \u062F\u0627\u0644\u0629");
  }
  if (args.length !== callee.params.length) {
    throw new RuntimeError(
      `\u0627\u0644\u062F\u0627\u0644\u0629 '${callee.name}' \u062A\u062A\u0648\u0642\u0639 ${callee.params.length} \u0645\u0639\u0627\u0645\u0644\u0627\u062A \u0644\u0643\u0646 \u0623\u064F\u0639\u0637\u064A\u062A ${args.length}`
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

// web.ts
function run(source) {
  const lines = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.join(" "));
  try {
    evaluate(new Parser().produceAST(source), createGlobalEnv());
  } catch (e) {
    lines.push("\u062E\u0637\u0623: " + e.message);
  } finally {
    console.log = original;
  }
  return lines.join("\n");
}
export {
  run
};
