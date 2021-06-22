import {Evaluator} from "../evaluator";
import {Part} from "../part";

export class Operator {
  constructor(protected readonly evaluator: Evaluator<unknown>, protected readonly parts: [unknown, Part]) {}
  
  private left(): unknown {
    return this.parts[0];
  }
  private right(): unknown {
    return this.evaluator.evaluatePart(this.parts[1]);
  }
  
  and(): boolean {
    if(this.left()) return !!this.right();
    return false;
  }
  or(): boolean {
    if(!this.left()) return !!this.right();
    return true;
  }
  '+'(): unknown {
    const left = this.left();
    const right = this.right();
    return (left as any) + (right as any);
  }
}
export type BinaryFunction = keyof Operator
export const binaryOperations = Object.getOwnPropertyNames(Operator.prototype).filter(it => it !== 'constructor' && it !== 'left' && it !== 'right') as Array<BinaryFunction>;
