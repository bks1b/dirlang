import { isDeepStrictEqual } from 'util';
import { minifyFn } from './util';

export const operators = <Record<string, {
    interpret: (...x: any[]) => any;
    operator?: string;
    operands?: number;
    compile?: (...x: string[]) => string;
    omitBrackets?: true;
}>>{
    greaterThan: {
        interpret: (a, b) => a > b,
        operator: '>',
        operands: 2,
    },
    lessThan: {
        interpret: (a, b) => a < b,
        operator: '<',
        operands: 2,
    },
    equalsLoose: {
        interpret: (a, b) => a == b,
        operator: '==',
        operands: 2,
    },
    equals: {
        interpret: (a, b) => a === b,
        operator: '===',
        operands: 2,
    },
    equalsDeep: {
        interpret: isDeepStrictEqual,
        compile: (a, b) => `require("util").isDeepStrictEqual(${a},${b})`,
        omitBrackets: true,
    },
    greaterEquals: {
        interpret: (a, b) => a >= b,
        operator: '>=',
        operands: 2,
    },
    lessEqual: {
        interpret: (a, b) => a <= b,
        operator: '<=',
        operands: 2,
    },
    add: {
        interpret: (...x) => x.reduce((a, b) => a + b, 0),
        operator: '+',
    },
    subtract: {
        interpret: (a, b) => a - b,
        operator: '-',
        operands: 2,
    },
    multiply: {
        interpret: (...x) => x.reduce((a, b) => a * b, 1),
        operator: '*',
    },
    divide: {
        interpret: (a, b) => a / b,
        operator: '/',
        operands: 2,
    },
    remainder: {
        interpret: (a, b) => a % b,
        operator: '%',
        operands: 2,
    },
    power: {
        interpret: (a, b) => a ** b,
        operator: '**',
        operands: 2,
    },
    root: {
        interpret: (a, b = 2) => a ** (1 / b),
        compile: (a, b = '2') => `${a}**(1/${b})`,
    },
    concat: {
        interpret: (...x) => x.reduce((a, b) => a + b, ''),
        operator: '+',
    },
    or: {
        interpret: (...x) => x.reduce((a, b) => a || b, false),
        operator: '||',
    },
    and: {
        interpret: (...x) => x.reduce((a, b) => a && b, true),
        operator: '&&',
    },
    not: {
        interpret: x => !x,
        compile: x => '!' + x,
        omitBrackets: true,
    },
    access: {
        interpret: (x, ...k) => k.reduce((a, b) => a[b], x),
        compile: (x, ...k) => x + k.map(x => `[${x}]`).join(''),
        omitBrackets: true,
    },
    set: {
        interpret: (x, val, ...k) => k.slice(0, -1).reduce((a, b) => a[b], x)[k.slice(-1)[0]] = val,
        compile: (x, val, ...k) => `${operators.access.compile!(x, ...k)}=${val}`,
    },
    delete: {
        interpret: (x, k) => delete x[k],
        compile: (x, k) => `delete ${x}[${k}]`,
        omitBrackets: true,
    },
    type: {
        interpret: x => typeof x,
        compile: x => 'typeof ' + x,
    },
    has: {
        interpret: (k, x) => k in x,
        operator: ' in ',
        operands: 2,
    },
};

const dateFn = (ts: number) => {
    const date = new Date(ts);
    return {
        ts: date.getTime(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekday: date.getDay(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        milliseconds: date.getMilliseconds(),
    };
};
export const stdlib = <Record<string, {
    interpret: any;
    compile: string;
    init?: string;
}>>{
    print: {
        interpret: console.log,
        compile: 'console.log',
    },
    date: {
        interpret: dateFn,
        init: `var date=${minifyFn(dateFn)};`,
        compile: 'date',
    },
    math: {
        interpret: Math,
        compile: 'Math',
    },
};

export const derived = { parseInt, parseFloat, isNaN, undefined, null: null, true: true, false: false, NaN };