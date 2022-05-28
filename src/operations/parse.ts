import { statements, expressions } from '../core';
import { parseError } from '../errors';
import { Attribs, Dir, Fns } from '../types';
import { resolveFunction, sortDir } from '../util';

const fns = <Fns>{
    expr: (dir: Dir, path) => {
        const expr = expressions[dir[0][0]];
        if (!expr) throw parseError('UNKNOWN_EXPR', path, dir[0][0]);
        return [dir[0][0], resolveFunction(expr.parse, fns, 'attribs')(dir[0][1], [...path, ['expression', dir[0][0]]])];
    },
    stmts: (arr: Dir, path) => sortDir(arr).map((x, i) => {
        const stmt = statements[x[1][0][0]];
        if (!stmt) throw parseError('UNKNOWN_STMT', path, x[1][0][0]);
        return [x[1][0][0], resolveFunction(stmt.parse, fns, 'attribs')(x[1][0][1], [...path, ['statement', x[1][0][0], i + 1]])];
    }),
    array: (dir: Dir, path, attrs: Attribs<any>) => Object.fromEntries(<[string, any]>attrs
        .map(x => {
            const found = dir.find(y => y[0] === x[0]);
            if (found) return [x[0], resolveFunction(x[1], fns)(found[1], [...path, ['attribute', x[0]]])];
            if (!x[2]) throw parseError('NO_ATTR', path, path.slice(-1)[0], x[0]);
        })
        .filter(x => x)),
    default: x => x[0][0],
};

export default (dir: Dir) => fns.stmts(dir, [['top level']]);