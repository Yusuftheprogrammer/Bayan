# Bayan (بيان)

This is tiny programming language which is written in Arabic, it contains lexer, parser and interpeter and all of them built in vanilla TypeScript.

```
دالة العزيمدالة العزيمة(){

متغير العدو = 6000000000؛
متغير العقبات = 2؛
متغير الوحدة = 1؛
إذا (الوحدة == 1){
   اطبع("فهل نبالي بمن يخذلنا؟")؛
} وإلا {
   اطبع("لا ناصر لناان تفرقنا.")؛
}
}

العزيمة()؛
```

I used [Deno](https://deno.com) here becuase it's easier in reading files and fs opreations more than node js (I hate nodejs), also I made browser editor because traditional code editors sucks [Run it in the browser](#run-it-in-the-browser)

## How To Use

Of course, Install Deno, then run this command to any file:

```
deno run --allow-read main.ts program.bayan
```

## The language
I made this table just for non-arab guys.

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


### Objects

```
متغير شخص = { اسم: "علي"، عمر: 20 }؛
شخص.عمر = شخص.عمر + 1؛
اطبع(شخص.اسم، شخص["عمر"])؛   // علي 21
```

The shorthand `{ اسم }` means `{ اسم: اسم }`.

## How it works

Well, Source code moves into stages:

```
source text  ──►  lexer  ──►  tokens  ──►  parser  ──►  AST  ──►  interpreter  ──►  result
```

1. **Lexer** (`frontend/lexer.ts`) it turns characters into tokens like numbers, strings, identifiers, keywords and operators.
2. **Parser** (`frontend/parser.ts`) it is a recursive-descent parser. It builds a tree of nodes (`frontend/ast.ts`). Operator precedence comes from one parsing function per level, from assignment down to primary expressions.
3. **Interpreter** (`runtime/interpreter.ts`) walks the tree. Each node kind has a small case, and children are evaluated before their parent. Variables live in environments (`runtime/environment.ts`) that are chained to their parent scope, which is what makes scope and closures work. `return` is implemented by throwing a special signal that the function call catches.

Runtime values (`runtime/values.ts`) are tagged objects like `{ type: "number", value: 5 }`, so the interpreter can reject nonsense such as adding a number to an object.

Syntax errors and runtime errors are separate error types and are reported in Arabic.


## Run it in the browser

You will just bundle the web.ts code with this command:

```
npx esbuild web.ts --bundle --format=esm --outfile=bayan.js
python3 -m http.server 8000
```

Then you will open `http://localhost:8000`. Re-run the first command after every change to the code. The page imports `run` from `bayan.js` and shows what `اطبع` prints.
