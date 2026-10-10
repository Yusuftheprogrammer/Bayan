export enum TokenType {
  // Literal types
  Number = "Number",
  Identifier = "Identifier",
  String = "String",

  // Keywords
  Let = "Let",
  Const = "Const",
  Function = "Function",
  Return = "Return",
  If = "If",
  Else = "Else",
  While = "While",
  For = "For",

  // Grouping Operators
  LeftParen = "LeftParen", // (
  RightParen = "RightParen", // )
  LeftBracket = "LeftBracket", // [
  RightBracket = "RightBracket", // ]
  LeftBrace = "LeftBrace", // {
  RightBrace = "RightBrace", // }

  // Arithmetic Operators
  AddingOperator = "AddingOperator", // +
  SubtractionOperator = "SubtractionOperator", // -
  MultiplicationOperator = "MultiplicationOperator", // *
  DivisionOperator = "DivisionOperator", // /

  // Assignment
  EqualOperator = "EqualOperator", // =

  // Comparison Operators
  Equals = "Equals", // ==
  NotEquals = "NotEquals", // !=
  LessThan = "LessThan", // <
  GreaterThan = "GreaterThan", // >
  LessThanOrEqual = "LessThanOrEqual", // <=
  GreaterThanOrEqual = "GreaterThanOrEqual", // >=

  // Punctuation
  Colon = "Colon", // :
  Comma = "Comma", // ، or ,
  SemiColon = "SemiColon", // ؛ or ;
  Dot = "Dot", // .

  // End Of File
  EOF = "EOF",
}

export interface Token {
  value: string;
  type: TokenType;
}

export class LexError extends Error {}

export const KEYWORD: Record<string, TokenType> = {
  متغير: TokenType.Let,
  ثابت: TokenType.Const,
  دالة: TokenType.Function,
  ارجع: TokenType.Return,
  إذا: TokenType.If,
  وإلا: TokenType.Else,
  طالما: TokenType.While,
  لكل: TokenType.For,
};

const SINGLE_CHAR: Record<string, TokenType> = {
  "(": TokenType.LeftParen,
  ")": TokenType.RightParen,
  "[": TokenType.LeftBracket,
  "]": TokenType.RightBracket,
  "{": TokenType.LeftBrace,
  "}": TokenType.RightBrace,
  "+": TokenType.AddingOperator,
  "-": TokenType.SubtractionOperator,
  "*": TokenType.MultiplicationOperator,
  ":": TokenType.Colon,
  ".": TokenType.Dot,
  "،": TokenType.Comma,
  ",": TokenType.Comma,
  "؛": TokenType.SemiColon,
  ";": TokenType.SemiColon,
};

const ESCAPES: Record<string, string> = {
  n: "\n",
  t: "\t",
  '"': '"',
  "\\": "\\",
};

// Helper Functions

export function createToken(value = "", type: TokenType): Token {
  return { value, type };
}

export function isAlpha(src: string) {
  const code = src.charCodeAt(0);
  const isLatin = src.toUpperCase() != src.toLowerCase();
  const isArabic =
    code >= 0x0600 &&
    code <= 0x06ff &&
    src !== "؛" &&
    src !== "،" &&
    src !== "؟";
  return isLatin || isArabic;
}

export function isNum(src: string) {
  return src >= "0" && src <= "9";
}

export function isSkippable(src: string) {
  return (
    src === " " ||
    src === "\n" ||
    src === "\t" ||
    src === "\r" ||
    src === "\u00A0" ||
    src === "\uFEFF" ||
    src === "\u200E" ||
    src === "\u200F"
  );
}

export function tokenize(sourceCode: string): Token[] {
  const tokens = new Array<Token>();
  const src = Array.from(sourceCode);
  const next = () => src.shift() as string;

  while (src.length > 0) {
    const char = src[0];
    const single = SINGLE_CHAR[char];

    if (single !== undefined) {
      tokens.push(createToken(next(), single));
    } else if (char === "/") {
      if (src[1] === "/") {
        while (src.length > 0 && src[0] !== "\n") src.shift();
      } else {
        tokens.push(createToken(next(), TokenType.DivisionOperator));
      }
    } else if (char === "=") {
      if (src[1] === "=") {
        next();
        next();
        tokens.push(createToken("==", TokenType.Equals));
      } else {
        tokens.push(createToken(next(), TokenType.EqualOperator));
      }
    } else if (char === "<") {
      if (src[1] === "=") {
        next();
        next();
        tokens.push(createToken("<=", TokenType.LessThanOrEqual));
      } else {
        tokens.push(createToken(next(), TokenType.LessThan));
      }
    } else if (char === ">") {
      if (src[1] === "=") {
        next();
        next();
        tokens.push(createToken(">=", TokenType.GreaterThanOrEqual));
      } else {
        tokens.push(createToken(next(), TokenType.GreaterThan));
      }
    } else if (char === "!") {
      if (src[1] !== "=") {
        throw new LexError("حرف غير متوقع: '!' (هل تقصد '!=' ؟)");
      }
      next();
      next();
      tokens.push(createToken("!=", TokenType.NotEquals));
    } else if (char === '"') {
      next(); // opening quote
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
        throw new LexError('نص غير منتهي: علامة الاقتباس " الختامية مفقودة');
      }
      next();
      tokens.push(createToken(text, TokenType.String));
    } else if (isNum(char)) {
      let num = "";
      let seenDot = false;
      while (
        src.length > 0 &&
        (isNum(src[0]) || (src[0] === "." && !seenDot && isNum(src[1] ?? "")))
      ) {
        if (src[0] === ".") seenDot = true;
        num += next();
      }
      tokens.push(createToken(num, TokenType.Number));
    } else if (isAlpha(char) || char === "_") {
      let ident = "";
      while (
        src.length > 0 &&
        (isAlpha(src[0]) || isNum(src[0]) || src[0] === "_")
      ) {
        ident += next();
      }
      if (Object.hasOwn(KEYWORD, ident)) {
        tokens.push(createToken(ident, KEYWORD[ident]));
      } else {
        tokens.push(createToken(ident, TokenType.Identifier));
      }
    } else if (isSkippable(char)) {
      next();
    } else {
      throw new LexError(`حرف غير معروف: '${char}'`);
    }
  }

  tokens.push({ type: TokenType.EOF, value: "نهاية الملف" });
  return tokens;
}
