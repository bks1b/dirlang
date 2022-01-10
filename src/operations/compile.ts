import { expressions, statements } from '../core';
import { Attribs, CompileData, Dir, Fns } from '../types';
import { resolveFunction } from '../util';

const fns = <Fns>{
    expr: (x, _, inits) => resolveFunction(expressions[x[0]].compile, fns, 'compile', false)(x[1], expressions[x[0]].parse, inits),
    stmts: (x: any[], _, inits) => x.map(x => resolveFunction(statements[x[0]].compile, fns, 'compile', false)(x[1], statements[x[0]].parse, inits) + ';').join(''),
    array: (x, parse, inits, y: CompileData) => y
        .map(y => typeof y === 'string'
            ? y
            : typeof y === 'function'
                ? y(resolveFunction(parse, fns, 'compile', false)(x, parse, inits), fns)
                : (typeof y[1] === 'string'
                    ? (x: string[]) => x.join(<string>y[1])
                    : typeof y[1] === 'function'
                        ? y[1]
                        : (x: any) => x
                )(
                    y[0] in x
                        ? Array.isArray(parse) && parse[0] !== 'map'
                            ? (found => found && resolveFunction(found, fns, 'compile', false)(x[y[0]]))((<Attribs<[Dir]>>parse).find(x => x[0] === y[0])?.[1])
                            : resolveFunction(parse, fns, 'compile', false)(x[y[0]])
                        : '',
                    fns,
                ),
        )
        .join(''),
};

export default (x: any[]) => {
    const inits = {};
    const str = fns.stmts(x, true, inits);
    return Object.values(inits).join('') + str;
};