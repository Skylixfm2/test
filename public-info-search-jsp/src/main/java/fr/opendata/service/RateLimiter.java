package fr.opendata.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimiter {
    private final Map<String, Long> lastHit = new ConcurrentHashMap<>();

    public synchronized void waitTurn(String host, long minDelayMs) throws InterruptedException {
        long now = System.currentTimeMillis();
        long last = lastHit.getOrDefault(host, 0L);
        long wait = Math.max(0, minDelayMs - (now - last));
        if (wait > 0) Thread.sleep(wait);
        lastHit.put(host, System.currentTimeMillis());
    }
}
