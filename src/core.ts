import { runtimeError } from './errors';
import { operators, stdlib } from './stdlib';
import { LanguageElement, Scope } from './types';

export const statements = <Dict>{
    var: {
        parse: [['name', true], ['value', 'expr']],
        interpret: (x, state, fns) => (state.scope.find(y => x.name in y.variables) || state.scope[0]).variables[x.name] = fns.expr(x.value, state),
        compile: ['var ', ['name'], '=', ['value']],
        docs: [
            'Assigns a value to a variable. Variables can be shadowed.',
            ['The variable\'s name', 'The variable\'s value'],
        ],
    },
    if: {
        parse: [['condition', 'expr'], ['commands', 'stmts'], ['else', 'stmts', true]],
        interpret: (x, state, fns) => fns.expr(x.condition, state) ? fns.stmts(x.commands, state) : x.else ? fns.stmts(x.else, state) : null,
        compile: ['if(', ['condition'], '){', ['commands'], '}', ['else', (x: string) => x ? `else{${x}}` : '']],
        block: true,
        docs: [
            'If the given condition is true, it executes the given commands. Otherwise, it executes the "else" block, if given.',
            [
                'The condition',
                'The list of statements to execute if the condition is true',
                'The list of statements to execute if the condition is false',
            ],
        ],
    },
    while: {
        parse: [['condition', 'expr'], ['commands', 'stmts']],
        interpret: (x, state, fns) => {
            while (fns.expr(x.condition, state)) fns.stmts(x.commands, state);
        },
        compile: ['while(', ['condition'], '){', ['commands'], '}'],
        block: true,
        docs: [
            'Executes the given commands while the given condition is true',
            ['The condition', 'The list of statements to execute while the condition is true'],
        ],
    },
    exec: {
        parse: 'expr',
        interpret: 'expr',
        compile: 'expr',
        docs: [
            'Executes an expression. Useful for calling functions when the return value isn\'t needed.',
            'The expression to execute',
        ],
    },
    return: {
        parse: 'expr',
        interpret: (x, state, fns) => {
            const fnScope = state.scope.find(x => x.container === 'fn');
            if (!fnScope) throw runtimeError('NO_FN', state);
            fnScope.stopped = true;
            fnScope.returnValue = fns.expr(x, state);
        },
        compile: ['return ', x => x],
        docs: ['Returns a value from a function', 'The expression to return'],
    },
    break: {
        parse: [],
        interpret: (_, state) => {
            const loopScope = state.scope.find(x => statements[x.container!]?.loop);
            if (!loopScope) throw runtimeError('NO_LOOP', state);
            loopScope.stopped = true;
        },
        compile: ['break'],
        docs: ['Stops executing a loop', []],
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
        docs: [
            'Gets the value of a variable. Since functions are considered variables too, you also have to use this expression when referring to functions.',
            'The variable\'s name',
        ],
    },
    str: {
        parse: true,
        interpret: true,
        compile: (x: string) => `"${x.replace(/"/g, '\\"')}"`,
        docs: ['Refers to a string (with some limitations because of folder names, depending on the OS)', 'The string\'s content'],
    },
    num: {
        parse: true,
        interpret: parseFloat,
        compile: true,
        docs: [
            'Refers to a number',
            'The number\'s value. Use a dot (.) for the decimal place. Spaces are ignored. Scientific notation is supported: `<a>e+<b>` = `a*10^b` and `<a>e-<b>` = `a*10^(-b)`',
        ],
    },
    bool: {
        parse: x => !!x.length,
        reverse: x => x ? [['_']] : [],
        interpret: true,
        compile: true,
        docs: [
            'Refers to a boolean',
            'For `true`, the folder should contain a folder named any placeholder. For `false`, the folder should be empty.',
        ],
    },
    arr: {
        parse: ['map', [], 'expr', true],
        interpret: (x, state, fns) => x.map((x: any) => fns.expr(x, state)),
        compile: ['[', x => x.join(','), ']'],
        docs: ['Refers to an array with no specific length', 'The folder should contain a numbered (indexed) list of expressions'],
    },
    obj: {
        parse: (x, path, fns) => x.map(x => [x[0], fns.expr(x[1], path)]),
        reverse: (x, fns) => x.map((x: any) => [x[0], fns.expr(x[1])]),
        interpret: (x, state, fns) => Object.fromEntries(x.map((x: any[]) => [x[0], fns.expr(x[1], state)])),
        compile: (x: [string, any][], _, inits, fns) => `{${x.map(x => `[${fns.expr(['str', x[0]], null, inits)}]:${fns.expr(x[1], null, inits)}`).join(',')}}`,
        docs: [
            'Refers to a set of key-value pairs',
            'The folder\'s sub-folders are the keys, and the sub-folders\' children are the values (expressions)',
        ],
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
        docs: [
            'Refers to a function. This expression doesn\'t declare a function, it only creates a reference. You have to assign a function to a variable in order to refer to it later.',
            ['The function\'s argument names', 'The commands to execute'],
        ],
    },
    call: {
        parse: [['fn', 'expr'], ['args', ['map', [], 'expr', true], true]],
        interpret: (x, state, fns) => fns.expr(x.fn, state)(...(x.args || []).map((x: any) => fns.expr(x, state))),
        compile: (x, parse, inits, fns) => {
            const op = x.fn[0] === 'var' && operators[x.fn[1]];
            if (op) {
                const args = (x.args || []).map((x: any) => fns.expr(x, null, inits));
                return op.compile
                    ? op.compile(...args)
                    : (x => op.omitBrackets ? x : `(${x})`)((op.operands ? args.slice(0, op.operands) : args).join(op.operator));
            }
            return fns.array(x, parse, inits, [['fn'], '(', ['args', ','], ')']);
        },
        docs: [
            'Calls a function',
            [
                'The function to call. Can be a variable or a function expression (resulting in an IIFE).',
                'A numbered list of expressions to pass to the functions as arguments',
            ],
        ],
    },
};

type Dict = Record<any, LanguageElement>;