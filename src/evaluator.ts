import {
  ArrayFunction,
  ArrayFunctions,
  arrayFunctions,
  StringFunction,
  StringFunctions,
  stringFunctions
} from "./functions";
import {BinaryFunction, binaryOperations, Operator} from "./functions/binary";
import {Const, Extraction, FuncCall, Op, Part, Primitive, PrimitiveType} from "./part";

export class Evaluator<T> {
  
  constructor(private readonly content: T) {}
  
  private evaluateExtract(item: unknown, extraction: Extraction): unknown {
    return extraction.extract.reduce(({subItem, optional}, extract, index) => {
      const funcName = extract.type === 'FuncCall' ? extract.functionName : undefined;
      let key = funcName ?? (extract.content.startsWith('$') ? extract.content.substring(1) : extract.content);
      if(key.startsWith('(')) {
        const value = this.evaluatePart(extract);
        if(index === 0) { return { subItem: value, optional}}
        key = value as any;
      }
      if(subItem === undefined) {
        if(optional) return { subItem, optional };
        throw new Error(`Key ${key} in item ${item} was not optionally chained and was undefined`);
      }
      const nextOptional = key.endsWith('?');
      if(funcName) {
        const result = this.evaluatePartOn(extract, subItem);
        return { subItem: result , optional: nextOptional };
      }
      const value = Evaluator.evaluateValue(subItem, nextOptional ? key.substring(0, key.length - 1) : key);
      return {subItem: value, optional: nextOptional };
    }, {subItem: item, optional: false}).subItem;
  }
  
  private static evaluateValue(item: unknown, key: string): unknown | undefined {
    if(typeof item === 'object') return (item as Record<string, unknown>)[key];
    throw new Error(`Cannot index (${item}) with key ${key}`);
  }
  
  private evaluateFunction(func: FuncCall, item: unknown): unknown {
    if(typeof item === 'string') {
      if(stringFunctions.includes(func.functionName as StringFunction)) {
        return (new StringFunctions(this, item, func.parameters) as unknown as Record<string, () => unknown>)[func.functionName]()
      } else {
        throw new Error(`${func.functionName} is not a valid string function try one of [${stringFunctions.join(', ')}]`)
      }
    } else if(typeof item === 'object') {
      if(Array.isArray(item)) {
        if(arrayFunctions.includes(func.functionName as ArrayFunction)) {
          return (new ArrayFunctions(this, item, func.parameters) as unknown as Record<string, () => unknown>)[func.functionName]()
        } else {
          throw new Error(`${func.functionName} is not a valid array function try one of [${arrayFunctions.join(', ')}]`)
        }
      }
    }
    throw new Error('Could not interpret function named ' + func.functionName)
  }
  
  private static evaluateConst(constant: Const): unknown {
    const value = constant.content;
    if(value.startsWith('"') || value.startsWith("'")) {
      return value.substring(1, value.length - 1);
    }
    if(value === 'true') return true;
    if(value === 'false') return false;
    if(value === 'null') return null;
    if(value === 'undefined') return undefined;
    return Number.parseFloat(value);
  }
  
  private evaluatePartOn(part: Part, item: unknown): unknown {
    switch(part.type) {
      case 'FuncCall': {
        return this.evaluateFunction(part, item);
      }
      case 'Const': return Evaluator.evaluateConst(part);
      case 'Extraction': return this.evaluateExtract(item, part);
      case 'Bracket': return this.evaluateOn(part.parts, item);
    }
    throw new Error('Could not make part of type ' + part.type + ' a value')
  }
  
  private operateOn(left: unknown, operator: Part, right: Part): unknown {
    if((operator as Op).operation) {
      const op = (operator as Op);
      if(binaryOperations.includes(op.operation as BinaryFunction)) {
        return (new Operator(this, [left, right]) as unknown as Record<string, () => unknown>)[op.operation as BinaryFunction]()
      } else {
        throw new Error(`${op.operation as string} is not a valid binary operation try one of [${binaryOperations.join(', ')}]`)
      }
    }
    throw new Error('Could not use ' + operator + ' as operator');
  }
  
  private evaluateOn(parts: Part[], item: unknown): unknown {
    if(parts.length === 1) return this.evaluatePartOn(parts[0], item);
    if(parts.length % 2 !== 1) throw new Error('Invalid amounts of operators to values');
    let start = this.operateOn(this.evaluatePart(parts[0]), parts[1], parts[2]);
    if(parts.length > 3) {
      const rest = parts.slice(3);
      const operators = rest.filter((it, index) => index % 2 === 0);
      const values = rest.filter((it, index) => index % 2 === 1);
      operators.forEach((operator, index) => {
        start = this.operateOn(start, operator, values[index]);
      })
    }
    return start;
  }
  
  evaluate(parts: Part[]): unknown {
    return this.evaluateOn(parts, this.content);
  }
  
  evaluatePart(part: Part): unknown {
    return this.evaluatePartOn(part, this.content);
  }
  
  public convertParams<T extends Record<string, Primitive>>(params: T, parts: Part[]): { [K in keyof T]: () => PrimitiveType<T[K]> } {
    return Object.keys(params).reduce((ret, key, index) => ({...ret, [key]: () => {
        const type = params[key];
        const optional = type.endsWith('?');
        if(!optional && parts.length <= index) throw new Error(`Required argument ${key} was not found`)
        const result = parts.length <= index ? undefined : this.evaluatePart(parts[index]);
        if(result === undefined && !optional) throw new Error(`Required argument ${key} was undefined`);
        const expectedType = optional ? type.substring(0, type.length - 1) : type;
        if(result != undefined && typeof result != expectedType) throw new Error(`Type of ${key} (${typeof result}) was expected to be ${expectedType}`)
        return result;
      }}), {} as { [K in keyof T]: () => PrimitiveType<T[K]> })
  }
  
  static from<T>(content: T): Evaluator<T> {
    return new Evaluator<T>(content);
  }
}
