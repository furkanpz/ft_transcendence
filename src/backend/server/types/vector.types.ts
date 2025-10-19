class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    add(other: Vector2): Vector2 {
        return new Vector2(this.x + other.x, this.y + other.y);
    }
    sub(other: Vector2): Vector2 {
        return new Vector2(this.x - other.x, this.y - other.y);
    }
    mul(scaler: number): Vector2 {
        return new Vector2(this.x * scaler, this.y * scaler);
    }
    div(scaler: number): Vector2 {
        if (scaler == 0)
            return Vector2.Zero();
        return new Vector2(this.x / scaler, this.y / scaler);
    }
    dot(other: Vector2): number {
        return (this.x * other.x) + (this.y * other.y);
    }
    lenght(): number {
        return Math.sqrt(this.dot(this));
    }
    norm(): Vector2 {
        return this.div(this.lenght());
    }
    static Zero(): Vector2 {
        return new Vector2(0, 0);
    }
    static I(): Vector2 {
        return new Vector2(1, 0);
    }
    static J(): Vector2 {
        return new Vector2(0, 1);
    }
}

export { Vector2 };