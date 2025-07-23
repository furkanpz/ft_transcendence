interface TokenBucket {
	tokens: number;
	lastRefill: number;
}

const buckets = new Map<number, TokenBucket>();

const MAX_TOKENS = 5;
const REFILL_INTERVAL = 10_000;
const REFILL_AMOUNT = 5;

export default function chatLimiter(userId: number): boolean {
	const now = Date.now();
	const bucket = buckets.get(userId) || { tokens: MAX_TOKENS, lastRefill: now };
	const timePassed = now - bucket.lastRefill;
	if (timePassed > REFILL_INTERVAL)
	{
		const refillTimes = Math.floor(timePassed / REFILL_INTERVAL);
		bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refillTimes * REFILL_AMOUNT);
		bucket.lastRefill = now;
	}
	if (bucket.tokens > 0)
	{
		bucket.tokens -= 1;
		buckets.set(userId, bucket);
		return true;
	}
	else
	{
		bucket.lastRefill = now;
	}
	return false;
}
