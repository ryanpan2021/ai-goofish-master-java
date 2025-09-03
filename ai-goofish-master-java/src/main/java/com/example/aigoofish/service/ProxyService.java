package com.example.aigoofish.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;

@Service
public class ProxyService {

    @Value("${proxy.enabled:false}")
    private boolean proxyEnabled;

    @Value("${proxy.api.url:}")
    private String proxyApiUrl;

    @Value("${proxy.refresh.interval.seconds:1800}")
    private long refreshIntervalSeconds;

    private String currentProxy;
    private Instant lastFetchTime;

    private final RestTemplate restTemplate = new RestTemplate();

    public synchronized String getProxy() {
        if (!proxyEnabled) {
            return null;
        }

        if (currentProxy == null || isProxyExpired()) {
            fetchNewProxy();
        }

        return currentProxy;
    }

    private boolean isProxyExpired() {
        return lastFetchTime == null || Duration.between(lastFetchTime, Instant.now()).getSeconds() >= refreshIntervalSeconds;
    }

    private void fetchNewProxy() {
        if (proxyApiUrl == null || proxyApiUrl.isEmpty() || proxyApiUrl.equals("YOUR_PROXY_API_URL")) {
            System.err.println("  [Proxy] Proxy is enabled, but Proxy API URL is not configured.");
            this.currentProxy = null;
            return;
        }

        try {
            System.out.println("  [Proxy] Fetching new proxy from: " + proxyApiUrl);
            String response = restTemplate.getForObject(proxyApiUrl, String.class);

            // Assuming the API returns a JSON like {"data": {"proxy_list": ["ip:port"]}}
            JsonObject jsonResponse = JsonParser.parseString(response).getAsJsonObject();
            String proxyAddress = jsonResponse.getAsJsonObject("data")
                                            .getAsJsonArray("proxy_list")
                                            .get(0).getAsString();

            this.currentProxy = proxyAddress;
            this.lastFetchTime = Instant.now();
            System.out.println("  [Proxy] Successfully fetched new proxy: " + this.currentProxy);

        } catch (Exception e) {
            System.err.println("  [Proxy] Failed to fetch new proxy: " + e.getMessage());
            this.currentProxy = null; // Invalidate current proxy on failure
        }
    }
}
