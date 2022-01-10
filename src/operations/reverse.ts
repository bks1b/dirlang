import { expressions, statements } from '../core';
import { Fns, LanguageElement } from '../types';
import { resolveFunction } from '../util';

const reverse = (x: any, el: LanguageElement) => resolveFunction(el.reverse! || el.parse, fns, 'attribs')(x[1]);

const fns = <Fns>{
    expr: x => [[x[0], reverse(x, expressions[x[0]])]],
    stmts: (x: any[]) => x.map((x, i) => [i + 1 + '', [[x[0] + '', reverse(x, statements[x[0]])]]]),
    map: (y, x: any[]) => x.map((x, i) => [...(y[3] ? [1] : []), ...y[1]].reverse().reduce((a, b) => b ? [i + 1 + '', a] : [a + '', []], resolveFunction(y[2], fns, 'attribs')(x))),
    array: (x, y: any[]) => y
        .filter(y => y[0] in x)
        .map(y => [y[0] + '', resolveFunction(y[1], fns, 'attribs')(x[y[0]])]),
    default: x => [[x + '', []]],
};

export default fns.stmts;