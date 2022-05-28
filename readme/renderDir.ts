import { createCanvas } from 'canvas';
import { Dir } from '../src';

const INDENT = 20;
const LEVEL_LINE = 10;
const FONT_SIZE = 20;
const PADDING = 10;
const TEXT_OFFSET = 0.75;
const FONT = 'Arial';
const SEPERATOR = '/';
const FONT_COLOR = '#000000';
const BACKGROUND = '#ffffff';
const OTHER_COLOR = '#aaaaaa';

const getRenderData = (ctx: CanvasRenderingContext2D, data: RenderData, dir: [string, Dir], level = 0, xOffset = 0) => {
    ctx.font = `${FONT_SIZE}px ${FONT}`;
    const separatorW = ctx.measureText(SEPERATOR).width;
    const nameW = ctx.measureText(dir[0]).width;
    const nameX = xOffset || level * INDENT;
    const { height } = data;
    data.ops.push(() => {
        ctx.font = `${FONT_SIZE}px ${FONT}`;
        ctx.fillStyle = OTHER_COLOR;
        ctx.fillText(SEPERATOR, nameX, height);
        ctx.fillStyle = FONT_COLOR;
        ctx.fillText(dir[0], nameX + separatorW, height);
    });
    data.widths.push(nameX + nameW + separatorW);
    if (dir[1]?.length === 1) getRenderData(ctx, data, dir[1][0], level, nameX + nameW + separatorW);
    else {
        data.height += FONT_SIZE;
        if (dir[1]) for (const sub of dir[1]) getRenderData(ctx, data, sub, level + 1);
        const newH = data.height;
        data.ops.push(() => {
            ctx.beginPath();
            ctx.strokeStyle = OTHER_COLOR;
            ctx.moveTo(level * INDENT + LEVEL_LINE, height);
            ctx.lineTo(level * INDENT + LEVEL_LINE, newH - FONT_SIZE);
            ctx.stroke();
        });
    }
};

export default (dir: [string, Dir]) => {
    const canvas = createCanvas(0, 0);
    const ctx = canvas.getContext('2d');
    const data = <RenderData>{ widths: [], ops: [], height: 0 };
    getRenderData(ctx, data, dir);
    canvas.width = Math.max(...data.widths) + PADDING * 2;
    canvas.height = data.height - FONT_SIZE + PADDING * 2 + FONT_SIZE * TEXT_OFFSET;
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(PADDING, PADDING + FONT_SIZE * TEXT_OFFSET);
    for (const f of data.ops) f();
    return canvas.toBuffer();
};

type RenderData = {
    widths: number[];
    ops: (() => any)[];
    height: number;
};