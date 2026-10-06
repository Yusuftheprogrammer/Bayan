export enum TokenType {
  // Literal types
  Number,
  Identifier,
  String,

  // Keywords
  Let,
  Const,
  Function,
  Return,

  // Grouping Operators
  RightParen, //)
  LeftParen, //(
  RightBracket, //]
  LeftBracket, //[
  RightBrace, //}
  LeftBrace, //{

  // Arthimetic Operators
  AddingOperator,
  SubtractionOperator,
  MultiplicationOperator,
  DivisionOperator,

  // Comparison Operators
  EqualOperator,

  // Punctuations
  Colon,
  Comma,
  SemiColon,
  Underscore,
  Dot,
  DoubleQuotation,

  // End Of File
  EOF,
}

export interface Token {
  value: string;
  type: TokenType;
}

export const KEYWORD: Record<string, TokenType> = {
  متغير: TokenType.Let,
  ثابت: TokenType.Const,
  دالة: TokenType.Function,
  ارجع: TokenType.Return,
};

const code = "دع س = 12";

// Helper Functions
// 

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
    src !== "؟" ;
  return isLatin || isArabic;
}

export function isNum(src: string) {
  const character = src.charCodeAt(0);
  const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
  return character >= bounds[0] && character <= bounds[1];
}

export function isSkippable(src: string) {
  return (
    src == " " || src == "\n" || src == "\t" || src == "\r"
  );
}

export function tokenize(sourceCode: string): Token[] {
  const tokens = new Array<Token>();
  const src = sourceCode.split("");

  while (src.length > 0) {
    if (src[0] === "(") {
      tokens.push(createToken(src.shift(), TokenType.LeftParen));
    } else if (src[0] === ")") {
      tokens.push(createToken(src.shift(), TokenType.RightParen));
    } else if (src[0] === "{") {
      tokens.push(createToken(src.shift(), TokenType.LeftBrace));
    } else if (src[0] === "}") {
      tokens.push(createToken(src.shift(), TokenType.RightBrace));
    } else if (src[0] === "[") {
      tokens.push(createToken(src.shift(), TokenType.LeftBracket));
    } else if (src[0] === "]") {
      tokens.push(createToken(src.shift(), TokenType.RightBracket));
    } else if (src[0] === "+") {
      tokens.push(createToken(src.shift(), TokenType.AddingOperator));
    } else if (src[0] === "-") {
      tokens.push(createToken(src.shift(), TokenType.SubtractionOperator));
    } else if (src[0] === "*") {
      tokens.push(createToken(src.shift(), TokenType.MultiplicationOperator));
    } else if (src[0] === "/") {
      tokens.push(createToken(src.shift(), TokenType.DivisionOperator));
    } else if (src[0] === "=") {
      tokens.push(createToken(src.shift(), TokenType.EqualOperator));
    } else if (src[0] === "؛") {
      tokens.push(createToken(src.shift(), TokenType.SemiColon));
    } else if (src[0] === ":") {
      tokens.push(createToken(src.shift(), TokenType.Colon));
    } else if (src[0] === "،") {
      tokens.push(createToken(src.shift(), TokenType.Comma));
    } else {
      if (isNum(src[0])) {
        let num = "";
        while (src.length > 0 && isNum(src[0])) {
          num += src.shift();
        }
        tokens.push(createToken(num, TokenType.Number));
      } else if (isAlpha(src[0])) {
        let ident = "";
        while (src.length > 0 && (isAlpha(src[0]) || isNum(src[0]) || src[0] === "_")) {
          ident += src.shift();
        }
        const reserved = KEYWORD[ident];
        if (typeof reserved === "number") {
          tokens.push(createToken(ident, reserved));
        } else {
          tokens.push(createToken(ident, TokenType.Identifier));
        }
      } else if (isSkippable(src[0])) {
        src.shift();
      } else {
        console.log("حرف غير معروف عند: ", src[0]);
        Deno.exit(1);
      }
    }
  }

  tokens.push({ type: TokenType.EOF, value: "نهاية الملف" });
  return tokens;
}

console.log(tokenize(code));
