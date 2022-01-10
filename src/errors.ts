import { InterpreterState, Stack } from './types';

const STACK_INDENT = 4;
const STACK_SIZE = 50;

const parse = <Dict>{
    UNKNOWN_EXPR: name => `Unknown expression "${name}"`,
    UNKNOWN_STMT: name => `Unknown statement "${name}"`,
    NO_ATTR: (el: Stack[number], name) => `Expected attribute "${name}" for "${el[1]}" ${el[0]}`,
};
const runtime = <Dict>{
    NO_FN: () => 'Cannot return outside of a function',
    NO_LOOP: () => 'Cannot break outside of a loop',
    UNDEF: name => `Variable "${name}" is not defined`,
};

const makeError = <T>(dict: Dict, getStack: (x: T) => Stack = x => <Stack><unknown>x) =>
    (name: string, data: T, ...str: any[]) => `${dict[name](...str)}\n${
        getStack(data)
            .slice(-STACK_SIZE)
            .reverse()
            .map(x => `${' '.repeat(STACK_INDENT)}at ${x[0]}${x[1] ? `: ${x[1]}` : ''}${x[2] ? ` (${x[2]})` : ''}`)
            .join('\n')
    }`;

export const parseError = makeError(parse);
export const runtimeError = makeError<InterpreterState>(runtime, x => x.stack);

type Dict = Record<string, (...x: any[]) => string>;