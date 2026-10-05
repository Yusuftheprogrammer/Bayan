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
  RightParenthes, //)
  LeftParenthes, //(
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


  // End Of File
  EOF
  
  
}