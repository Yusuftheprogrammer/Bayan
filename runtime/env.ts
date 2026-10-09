import { RuntimeValue } from "./values.ts";

export class RuntimeError extends Error {}

export class Environment {
  private variables = new Map<
    string,
    { value: RuntimeValue; isConstant: boolean }
  >();

  constructor(private parent?: Environment) {}

  declare(name: string, value: RuntimeValue, isConstant: boolean) {
    if (this.variables.has(name)) {
      throw new RuntimeError(`المعرف '${name}' معرّف مسبقاً`);
    }
    this.variables.set(name, { value, isConstant });
    return value;
  }

  lookup(name: string): RuntimeValue {
    return this.resolve(name).variables.get(name)!.value;
  }

  assign(name: string, value: RuntimeValue) {
    const record = this.resolve(name).variables.get(name)!;
    if (record.isConstant) {
      throw new RuntimeError(`لا يمكن إسناد قيمة جديدة للثابت '${name}'`);
    }
    record.value = value;
    return value;
  }

  private resolve(name: string): Environment {
    if (this.variables.has(name)) return this;
    if (this.parent) return this.parent.resolve(name);
    throw new RuntimeError(`لا يوجد معرف باسم '${name}'`);
  }

  
}