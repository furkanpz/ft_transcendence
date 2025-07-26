const canvas = document.getElementById("Game") as HTMLCanvasElement
const ctx = canvas.getContext("2d");

class Vector2
{
    x: number;
    y: number;
    constructor()
    {
        this.x = 0;
        this.y = 0;
    }
}

function drawBall(ctx: CanvasRenderingContext2D, position: Vector2, radius: number, style: string | CanvasGradient | CanvasPattern)
{
    ctx.fillStyle = style;
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawRod(ctx: CanvasRenderingContext2D, position: Vector2, length: number, width: number, style: string | CanvasGradient | CanvasPattern)
{
    ctx.fillStyle = style;
    ctx.fillRect(position.x, position.y, width, length);
}

function main()
{
    const keyboard = new KeyboardEvent("EVENT"); 
    if (ctx == null)
        throw Error("Failed to get canvas context.");
    ctx.fillStyle = "black";
    ctx?.fillRect(0, 0, 1200, 900);
    ctx.fillStyle = "red";
    ctx?.fillRect(400, 500, 300, 200);
    drawBall(ctx, {x:300, y:200}, 30, "blue");
    drawRod(ctx, {x: 0, y: 200}, 100, 25, "red");
}

main();