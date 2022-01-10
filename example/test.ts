import { compile, interpret, readDir, parse } from '../src';

const dir = readDir('example/fib');
const startP = Date.now();
const parsed = parse(dir);
console.log('Parsing finished in', Date.now() - startP, 'ms');

const startI = Date.now();
interpret(parsed);
console.log('Interpretation finished in', Date.now() - startI, 'ms');

const startC = Date.now();
eval(compile(parsed));
console.log('Compilation finished in', Date.now() - startC, 'ms');