import { Fns, FunctionResolvable, Dir } from './types';

export const minifyFn = (fn: (...x: any[]) => any) => {
    let str = fn.toString().replace(/\s{2,}/, '');
    while (str !== (str = str.replace(/((\w)\s(\W)|(\W)\s(\w)|(\W)\s(\W))/g, (...x) => x.slice(2, -2).filter(x => x).join(''))));
    return str;
};

export const resolveFunction = <T extends any[], U extends 'attribs' | 'compile' | void = void>(x: FunctionResolvable<T, U>, fns: Fns, _?: U, indices = true): (...args: T) => any => <string>x in fns
    ? fns[<keyof Fns>x]!
    : typeof x === 'function'
        ? (...args) => x(...args, fns)
        : x instanceof Array
            ? x[0] === 'map'
                ? fns.map ? (...y) => fns.map!(x, ...y) : (y, ...args) => y.map((y: any) => resolveFunction(<any>x[2], fns)(indices ? [...x[3] ? [1] : [], ...<any[]>x[1]].reduce((a, b) => a[b], y) : y, ...args))
                : (...y) => fns.array(...y, x)
            : fns.default || (x => x);

export const sortDir = (dir: Dir) => dir.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));