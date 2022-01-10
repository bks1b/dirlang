import { runtimeError } from './errors';
import { operators, stdlib } from './stdlib';
import { LanguageElement, Scope } from './types';

export const statements = <Dict>{
    var: {
        parse: [['name', true], ['value', 'expr']],
        interpret: (x, state, fns) => (state.scope.find(y => x.name in y.variables) || state.scope[0]).variables[x.name] = fns.expr(x.value, state),
        compile: ['var ', ['name'], '=', ['value']],
    },
    if: {
        parse: [['condition', 'expr'], ['commands', 'stmts'], ['else', 'stmts', true]],
        interpret: (x, state, fns) => fns.expr(x.condition, state) ? fns.stmts(x.commands, state) : x.else ? fns.stmts(x.else, state) : null,
        compile: ['if(', ['condition'], '){', ['commands'], '}', ['else', x => x ? `else{${x}}` : '']],
        block: true,
    },
    while: {
        parse: [['condition', 'expr'], ['commands', 'stmts']],
        interpret: (x, state, fns) => {
            while (fns.expr(x.condition, state)) fns.stmts(x.commands, state);
        },
        compile: ['while(', ['condition'], '){', ['commands'], '}'],
        block: true,
    },
    exec: { parse: 'expr', interpret: 'expr', compile: 'expr' },
    return: {
        parse: 'expr',
        interpret: (x, state, fns) => {
            const fnScope = state.scope.find(x => x.container === 'fn');
            if (!fnScope) throw runtimeError('NO_FN', state);
            fnScope.stopped = true;
            fnScope.returnValue = fns.expr(x, state);
        },
        compile: ['return ', x => x],
    },
    break: {
        parse: [],
        interpret: (_, state) => {
            const loopScope = state.scope.find(x => statements[x.container!]?.loop);
            if (!loopScope) throw runtimeError('NO_LOOP', state);
            loopScope.stopped = true;
        },
        compile: ['break'],
    },
};

export const expressions = <Dict>{
    var: {
        parse: true,
        interpret: (x, state) => {
            const found = state.scope.find(y => x in y.variables);
            if (!found) throw runtimeError('UNDEF', state, x);
            return found.variables[x];
        },
        compile: (x, _, inits) => {
            const stdVal = stdlib[x];
            if (stdVal) {
                if (stdVal.init) inits[x] = stdVal.init;
                return stdVal.compile;
            }
            return x;
        },
    },
    str: { parse: true, interpret: true, compile: (x: string) => `"${x.replace(/"/g, '\\"')}"` },
    num: { parse: true, interpret: parseFloat, compile: true },
    bool: {
        parse: x => !!x.length,
        reverse: x => x ? [['_']] : [],
        interpret: true,
        compile: true,
    },
    arr: {
        parse: ['map', [], 'expr', true],
        interpret: (x, state, fns) => x.map((x: any) => fns.expr(x, state)),
        compile: ['[', x => x.join(','), ']'],
    },
    obj: {
        parse: (x, path, fns) => x.map(x => [x[0], fns.expr(x[1], path)]),
        reverse: (x, fns) => x.map((x: any) => [x[0], fns.expr(x[1])]),
        interpret: (x, state, fns) => Object.fromEntries(x.map((x: any[]) => [x[0], fns.expr(x[1], state)])),
        compile: ['{', (x: [string, any][], fns) => x.map(x => `[${fns.expr(['string', x[0]])}]:${fns.expr(x[1])}`).join(','), '}'],
    },
    fn: {
        parse: [['args', ['map', [], true, true]], ['commands', 'stmts']],
        interpret: (x, state, fns) => (...args: any[]) => {
            const local = <Scope>{
                variables: Object.fromEntries((<string[]>x.args).map((x, i) => [x, args[i]])),
                container: 'fn',
            };
            fns.stmts(x.commands, { ...state, scope: [local, ...state.scope] });
            return local.returnValue;
        },
        compile: ['function(', ['args', ','], '){', ['commands'], '}'],
    },
    call: {
        parse: [['fn', 'expr'], ['args', ['map', [], 'expr', true]]],
        interpret: (x, state, fns) => fns.expr(x.fn, state)(...x.args.map((x: any) => fns.expr(x, state))),
        compile: (x, parse, inits, fns) => {
            const op = x.fn[0] === 'var' && operators[x.fn[1]];
            if (op) {
                const args = x.args.map((x: any) => fns.expr(x));
                return op.compile
                    ? op.compile(...args)
                    : (x => op.omitBrackets ? x : `(${x})`)((op.operands ? args.slice(0, op.operands) : args).join(op.operator));
            }
            return fns.array(x, parse, inits, [['fn'], '(', ['args', ','], ')']);
        },
    },
};

type Dict = Record<any, LanguageElement>;