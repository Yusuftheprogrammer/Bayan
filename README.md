# Bayan (بيان)

A small programming language written in **Arabic**, with its lexer, parser and interpreter built from scratch in TypeScript. Keywords, error messages and even the punctuation are Arabic: `متغير`, `إذا`, `طالما`, `؛`, `،`.

```
دالة فيب(ن) {
  إذا (ن < 2) {
    ارجع ن؛
  }
  ارجع فيب(ن - 1) + فيب(ن - 2)؛
}

لكل (متغير ع = 0؛ ع < 10؛ ع = ع + 1) {
  اطبع("فيب(" + ع + ") =", فيب(ع))؛
}
```

Bayan runs on [Deno](https://deno.com), and it also runs in the browser (see [Run it in the browser](#run-it-in-the-browser)).

## Quick start

Install Deno, then run any Bayan file:

```
deno run --allow-read main.ts program.bayan
```

## The language

### Keywords

| Bayan   | Meaning            | Bayan   | Meaning |
| ------- | ------------------ | ------- | ------- |
| `متغير` | `let` (variable)   | `طالما` | `while` |
| `ثابت`  | `const` (constant) | `لكل`   | `for`   |
| `دالة`  | `function`         | `صواب`  | `true`  |
| `ارجع`  | `return`           | `خطأ`   | `false` |
| `إذا`   | `if`               | `فارغ`  | `null`  |
| `وإلا`  | `else`             | `اطبع`  | print   |

### Basics

```
// A comment
متغير س = 5؛          // a variable
ثابت ص = 10؛          // a constant (assigning to it is an error)
س = س + ص * 2؛        // math with the usual precedence
اطبع("النتيجة:", س)؛  // prints: النتيجة: 25
```

- Values: numbers (`3`, `3.14`), strings (`"نص"`), booleans, `فارغ`, objects and functions.
- Operators: `+ - * /` and the comparisons `== != < > <= >=`.
- `+` joins text when either side is a string.
- Statements end with `؛` (or `;`). Arguments and list items are separated by `،` (or `,`).

### Control flow

```
إذا (س > 10) {
  اطبع("كبير")؛
} وإلا إذا (س == 10) {
  اطبع("عشرة")؛
} وإلا {
  اطبع("صغير")؛
}

طالما (س < 100) {
  س = س * 2؛
}

لكل (متغير ع = 0؛ ع < 3؛ ع = ع + 1) {
  اطبع(ع)؛
}
```

Rules to remember:

- Conditions need parentheses and bodies need braces.
- Conditions must be real booleans. `إذا (5)` is an error, which catches `=` written where `==` was meant.
- `إذا`, `طالما`, `لكل` and function declarations do not end with `؛`.
- Every part of the `لكل` header is optional, so `لكل (؛؛) { ... }` loops forever.
- A block `{ ... }` has its own scope: variables declared inside disappear at the closing brace.

### Functions and closures

Functions are values. They can recurse, and they remember the variables around the place where they were declared:

```
دالة عداد() {
  متغير ن = 0؛
  دالة زد() {
    ن = ن + 1؛
    ارجع ن؛
  }
  ارجع زد؛
}

متغير أ = عداد()؛
اطبع(أ()، أ()، أ())؛   // 1 2 3
```

### Objects

```
متغير شخص = { اسم: "علي"، عمر: 20 }؛
شخص.عمر = شخص.عمر + 1؛
اطبع(شخص.اسم، شخص["عمر"])؛   // علي 21
```

The shorthand `{ اسم }` means `{ اسم: اسم }`.

## How it works

Source code goes through three stages:

```
source text  ──►  lexer  ──►  tokens  ──►  parser  ──►  AST  ──►  interpreter  ──►  result
```

1. **Lexer** (`frontend/lexer.ts`) turns characters into tokens: numbers, strings, identifiers, keywords and operators. Arabic letters are treated as letters, so Arabic names work everywhere.
2. **Parser** (`frontend/parser.ts`) is a recursive-descent parser. It builds a tree of nodes (`frontend/ast.ts`). Operator precedence comes from one parsing function per level, from assignment down to primary expressions.
3. **Interpreter** (`runtime/interpreter.ts`) walks the tree. Each node kind has a small case, and children are evaluated before their parent. Variables live in environments (`runtime/environment.ts`) that are chained to their parent scope, which is what makes scope and closures work. `return` is implemented by throwing a special signal that the function call catches.

Runtime values (`runtime/values.ts`) are tagged objects like `{ type: "number", value: 5 }`, so the interpreter can reject nonsense such as adding a number to an object.

Syntax errors and runtime errors are separate error types and are reported in Arabic.

## Project layout

```
frontend/
  ast.ts          node types for the syntax tree
  lexer.ts        source text -> tokens
  parser.ts       tokens -> syntax tree
runtime/
  values.ts       runtime value types
  environment.ts  variables and scopes
  interpreter.ts  walks the tree and runs it
main.ts           command-line entry point (Deno)
web.ts            browser entry point
```

## Run it in the browser

The lexer, parser and interpreter use no Deno-only features, so they work in a browser once bundled into one file:

```
npx esbuild web.ts --bundle --format=esm --outfile=bayan.js
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Re-run the first command after every change to the code. The page imports `run` from `bayan.js` and shows what `اطبع` prints.

## Not supported yet

- Lists, and string length or indexing
- `%` (remainder), `و` / `أو` / `ليس` (and / or / not), unary minus (`-5`), `++` and `+=`
- `break` and `continue`
- Anonymous functions
- Line and column numbers in error messages
- Optional semicolons (every simple statement needs `؛`)

## A note on editors

Most code editors draw right-to-left text with mixed punctuation poorly, so Arabic source can look scrambled (a `؛` jumping to the wrong side, for example). That affects only how the file is displayed. The file itself is stored in logical order and Bayan reads it correctly.
