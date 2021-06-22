import {binaryOperations} from "./functions/binary";
import {Bracket, Extraction, FuncCall, Op, Part} from "./part";

export class Parser {
  
  private static flipFlopQuotes(character: string, startedSingle: boolean, startedDouble: boolean, escaped: boolean): { startedSingle: boolean; startedDouble: boolean } {
    const inString = startedSingle || startedDouble;
    if(!escaped) {
      if(inString) {
        if(character === "'" && startedSingle) { return {startedDouble, startedSingle: false }; }
        if(character === '"' && startedDouble) { return { startedSingle, startedDouble: false }; }
      } else {
        if(character === "'") { return {startedDouble, startedSingle: true }; }
        if(character === '"') { return { startedSingle, startedDouble: true }; }
      }
    }
    return { startedSingle, startedDouble };
  }
  
  private static findFirst(predicate: (character: string) => boolean, inPart: string, ignore: string[] = []): {index: number; character: string} | undefined {
    let brackets = 0;
    let index = 0;
    let escaped = false;
    let startedSingle = false;
    let startedDouble = false;
    const characters = [...inPart];
    for(const character of characters) {
      const inString = (startedSingle || startedDouble)
      if(inString) {
        if(character === '\\') { escaped = true }
      } else if(!ignore.includes(character)){
        if(character === '(') { brackets++ }
        if(character === ')') { brackets-- }
      }
      if(brackets < 0) throw new Error('Invalid Brackets, found too many right parentheses `)`')
      const flipFlop = this.flipFlopQuotes(character, startedSingle, startedDouble, escaped);
      startedSingle = flipFlop.startedSingle;
      startedDouble = flipFlop.startedDouble;
      if(brackets === 0 && predicate(character)) {
        return { index, character };
      }
      index ++
      escaped = false;
    }
    return undefined;
  }
  
  private static getBracketed(part: string): { inside: string; rest: string } {
    const finding = this.findFirst(() => true, part);
    if(!finding) throw new Error('Could not find end of brackets in ' + part);
    return { inside: part.substring(1, finding.index), rest: part.substring(finding.index + 1).trim() };
  }
  
  private static consumeFirstBracket(part: string): { part: Bracket; rest: string} {
    const bracketed = this.getBracketed(part);
    return { part: { type: 'Bracket', content: `(${bracketed.inside})`, parts: this.parse(bracketed.inside) }, rest: bracketed.rest}
  }
  
  private static consumeFirstFunction(part: string, bracketIndex: number): { part: FuncCall; rest: string} {
    const functionName = part.substring(0, bracketIndex);
    const bracketed = this.consumeFirstBracket(part.substring(bracketIndex));
    return { part: { type: 'FuncCall', content: functionName + bracketed.part.content, functionName: functionName as any, parameters: bracketed.part.parts}, rest: bracketed.rest }
  }
  
  private static consumeDotted(part: string): Part {
    let next = part;
    let dot = this.findFirst(c => c === '.', next);
    const parts = new Array<Part>();
    while(dot) {
      const nextPart = next.substring(0, dot.index);
      const bracket = this.findFirst(c => c === '(', nextPart, ['(']);
      if(bracket) {
        if(bracket.index === 0) {
          const brackets = this.consumeFirstBracket(next);
          parts.push(brackets.part);
          next = brackets.rest.substring(1);
        } else {
          const func = this.consumeFirstFunction(next, bracket.index);
          parts.push(func.part);
          next = func.rest.substring(1);
        }
      } else {
        parts.push({type: 'Const', content: nextPart})
        next = next.substring(dot.index + 1);
      }
      dot = this.findFirst(c => c === '.', next);
    }
    const bracket = this.findFirst(c => c === '(', next, ['(']);
    if(bracket) {
      if(bracket.index === 0) {
        parts.push(this.consumeFirstBracket(next).part);
      } else {
        parts.push(this.consumeFirstFunction(next, bracket.index).part);
      }
    } else {
      if(binaryOperations.includes(next as any)) {
        const operator: Op = { type: 'Op', content: next, operation: next as any };
        parts.push(operator);
      } else {
        parts.push({type: 'Const', content: next});
      }
    }
    if(parts.length === 1) return parts[0];
    return <Extraction>{ type: 'Extraction', content: part, extract: parts };
  }
  
  private static consumeStaticPart(part: string, length: number): { part: Part; rest: string} {
    const content = part.substring(0, length).trim();
    const rest = part.substring(length).trim();
    const extraction = this.consumeDotted(content);
    return { part: extraction, rest };
  }
  
  private static consumeFirstPart(query: string): {part: Part; rest: string} {
    const firstSeparator = this.findFirst(c => c === ' ' || c === ',', query);
    return {part: this.consumeStaticPart(query, firstSeparator?.index ?? query.length).part, rest: firstSeparator ? query.substring(firstSeparator.index + 1).trim() : ''};
  }
  
  static parse(query: string): Part[] {
    const parts = new Array<Part>();
    let rest = query;
    while(rest !== '') {
      const next = this.consumeFirstPart(rest);
      parts.push(next.part);
      rest = next.rest;
    }
    return parts;
  }
}
