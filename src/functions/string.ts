import {FunctionHandler} from "./index";

export class StringFunctions extends FunctionHandler<string>{
  length(): number { return this.item.length; }
  substring(): string {
    const {start, end} = this.evaluator.convertParams({start: 'number', end: 'number?'}, this.parts)
    return this.item.substring(start(), end());
  }
  startsWith(): boolean {
    const {searchString, position} = this.evaluator.convertParams({searchString: 'string', position: "number?"}, this.parts)
    return this.item.startsWith(searchString(), position());
  }
  endsWith(): boolean {
    const {searchString, endPosition} = this.evaluator.convertParams({searchString: 'string', endPosition: "number?"}, this.parts)
    return this.item.endsWith(searchString(), endPosition());
  }
  matches(): boolean {
    const {pattern} = this.evaluator.convertParams({pattern: 'string'}, this.parts)
    return !!this.item.match(pattern());
  }
}
export type StringFunction = keyof StringFunctions
export const stringFunctions = Object.getOwnPropertyNames(StringFunctions.prototype).filter(it => it !== 'constructor') as Array<StringFunction>;
