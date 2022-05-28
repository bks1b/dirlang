import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { Dir } from './types';
import parse from './operations/parse';
import interpret from './operations/interpret';
import compile from './operations/compile';
import reverse from './operations/reverse';
import { sortDir } from './util';

const readDir = (path: string): Dir => sortDir(readdirSync(path)
    .filter(x => statSync(join(path, x)).isDirectory())
    .map(x => [decodeURIComponent(x), readDir(join(path, x))]));

export { readDir, parse, interpret, compile, reverse };
export const parseDir = (path: string) => parse(readDir(path));
export const interpretDir = (path: string) => interpret(parseDir(path));
export const compileDir = (path: string) => compile(parseDir(path));

export * as core from './core';
export * as stdlib from './stdlib';
export * from './types';