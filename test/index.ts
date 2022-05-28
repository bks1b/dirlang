import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { compile, interpret, parse } from '../src';

try { mkdirSync('test/res'); } catch {}

const programs = readdirSync('test/programs');

for (let i = 0; i < programs.length; i++) {
    const name = programs[i].split('.')[0];
    try { mkdirSync('test/res/' + name); } catch {}
    console.log('Testing', name, '\n');

    const startP = Date.now();
    const parsed = parse(JSON.parse(readFileSync('test/programs/' + programs[i], 'utf8')));
    console.log('Parsing finished in', Date.now() - startP, 'ms\n');
    writeFileSync(`./test/res/${name}/parsed.json`, JSON.stringify(parsed, undefined, 4));

    const startI = Date.now();
    interpret(parsed);
    console.log('\nInterpretation finished in', Date.now() - startI, 'ms');

    const startC = Date.now();
    const compiled = compile(parsed);
    console.log('Compilation finished in', Date.now() - startC, 'ms\n');
    writeFileSync(`./test/res/${name}/compiled.js`, compiled);

    const startE = Date.now();
    eval(compiled);
    console.log('\nEvaluation of compiled code finished in', Date.now() - startE, 'ms');

    if (i < programs.length - 1) console.log('\n======\n');
}