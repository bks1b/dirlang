import { readFileSync, writeFileSync } from 'fs';
import { core, LanguageElement, Attribs, FunctionResolvable } from '../src';
import renderDir from './renderDir';

const resolveType = (x: FunctionResolvable<any, 'attribs'>): string => x === 'stmts'
    ? 'statement list'
    : x === 'expr'
        ? 'expression'
        : x === true
            ? 'raw'
            : Array.isArray(x) && x[0] === 'map'
                ? resolveType(<FunctionResolvable<any, 'attribs'>>x[2]) + ' list'
                : 'other';

const renderDocs = (obj: Record<string, LanguageElement>) => Object.entries(obj)
    .flatMap(([key, { parse: _parse, docs }]) => {
        const parse = <Attribs<any>>_parse;
        return [
            `### \`${key}\``,
            `- ${docs[0]}`,
            ...typeof docs[1] === 'string'
                ? ['- Parameter: ' + docs[1]]
                : Array.isArray(docs[1]) && docs[1].length
                    ? [
                        '- Parameters',
                        ...docs[1].map((x, i) => `  - \`${parse[i][0]}\` (${resolveType(parse[i][1])}): ${x}`),
                    ]
                    : [],
        ];
    })
    .join('\n');

writeFileSync('./readme/example.png', renderDir(['fib_example', JSON.parse(readFileSync('test/programs/fib_example.json', 'utf8'))]));
writeFileSync('./README.md', `${readFileSync('./readme/README.md', 'utf8')}
## Statements
Statement lists, including the root directory, are expected to consist of numbered folders containing the actual statements, as seen in the example above.
${renderDocs(core.statements)}

## Expressions
${renderDocs(core.expressions)}`);