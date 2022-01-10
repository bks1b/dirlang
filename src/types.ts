export type LanguageElement = {
    parse: FunctionResolvable<[Dir, Stack], 'attribs'>;
    reverse?: FunctionResolvable<[any], 'attribs'>;
    interpret: FunctionResolvable<[any, InterpreterState]>;
    compile: FunctionResolvable<[any, LanguageElement['parse'], Record<string, string>], 'compile'>;
    block?: boolean;
    loop?: boolean;
};
export type Dir = [string, Dir][];
export type Fns = Record<'expr' | 'stmts' | 'array', (...x: any[]) => any> & { [k in 'map' | 'default']?: (...x: any[]) => any; };
export type Scope = {
    variables: Record<any, any>;
    index?: number;
    container?: string;
    stopped?: boolean;
    returnValue?: any;
};
export type Stack = ['expression' | 'statement' | 'attribute' | 'top level', string?, number?][];
export type InterpreterState = { scope: Scope[]; stack: Stack; };
export type Attribs<T extends any[]> = [string, FunctionResolvable<T, 'attribs'>, true?][];
export type CompileData = (
    string
        | ((x: any, fns: Fns) => string)
        | [string, string | ((x: any, fns: Fns) => string)]
)[];
export type FunctionResolvable<T extends any[], U extends 'attribs' | 'compile' | void = void> = 
    keyof Fns
        | ['map', any[], FunctionResolvable<T, U>, true?]
        | (U extends 'attribs' ? Attribs<T> : U extends 'compile' ? CompileData : never)
        | ((...x: [...T, Fns]) => any)
        | true;