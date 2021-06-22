import {Evaluator} from "../evaluator";
import {Part} from "../part";

export abstract class FunctionHandler<T> {
  constructor(protected readonly evaluator: Evaluator<unknown>, protected readonly item: T, protected readonly parts: Part[]) {}
}

export * from './array';
export * from './string';
