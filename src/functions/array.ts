import {FunctionHandler} from "./index";

export class ArrayFunctions extends FunctionHandler<unknown[]>{
  length(): number {
    return this.item.length;
  }
}
export type ArrayFunction = keyof ArrayFunctions
export const arrayFunctions = Object.getOwnPropertyNames(ArrayFunctions.prototype).filter(it => it !== 'constructor') as Array<ArrayFunction>;
