import { expressions, statements } from '../core';
import { derived, operators, stdlib } from '../stdlib';
import { Fns, InterpreterState } from '../types';
import { resolveFunction } from '../util';

const fns = <Fns>{
    expr: (expr, state: InterpreterState) => resolveFunction(expressions[expr[0]].interpret, fns)(expr[1], { ...state, stack: [...state.stack, ['expression', expr[0]]] }),
    stmts: (arr: any[], state: InterpreterState) => void arr.map((x, i) => {
        if (state.scope.some(x => x.stopped)) return;
        const stmt = statements[x[0]];
        resolveFunction(stmt.interpret, fns)(x[1], { stack: [...state.stack, ['statement', x[0], i + 1]], scope: [...(stmt.block ? [{ variables: {}, container: x[0], index: i + 1 }] : []), ...state.scope] });
    }),
};

const globalScope = { ...Object.fromEntries(Object.entries({ ...operators, ...stdlib }).map(x => [x[0], x[1].interpret])), ...derived };
export default (arr: any[]) => fns.stmts(arr, { stack: [['top level']], scope: [{ variables: { ...globalScope } }] });