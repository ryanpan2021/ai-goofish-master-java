package com.example.aigoofish.controller;

import com.example.aigoofish.mapper.CookieMapper;
import com.example.aigoofish.model.Cookie;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cookies")
public class CookieController {

    @Autowired
    private CookieMapper cookieMapper;

    @Autowired
    private ObjectMapper objectMapper; // Use Spring's default Jackson ObjectMapper

    @GetMapping
    public Map<String, List<Cookie>> getAllCookies() {
        return Collections.singletonMap("cookies", cookieMapper.selectList(null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cookie> getCookieById(@PathVariable("id") Integer id) {
        Cookie cookie = cookieMapper.selectById(id);
        return cookie != null ? ResponseEntity.ok(cookie) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public Map<String, Object> createCookie(@RequestBody Cookie cookie) {
        cookie.setCookieValue(sanitizeCookieValue(cookie.getCookieValue()));
        cookie.setCreatedAt(LocalDateTime.now());
        cookie.setUpdatedAt(LocalDateTime.now());
        cookie.setStatus("active");
        cookieMapper.insert(cookie);
        return Collections.singletonMap("success", true);
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateCookie(@PathVariable("id") Integer id, @RequestBody Cookie cookie) {
        cookie.setCookieValue(sanitizeCookieValue(cookie.getCookieValue()));
        cookie.setId(id);
        cookie.setUpdatedAt(LocalDateTime.now());
        cookieMapper.updateById(cookie);
        return Collections.singletonMap("success", true);
    }

    private String sanitizeCookieValue(String originalValue) {
        if (originalValue == null || originalValue.trim().isEmpty()) {
            return originalValue;
        }

        String jsonString = originalValue.trim();
        boolean isRawArray = jsonString.startsWith("[");

        try {
            List<Map<String, Object>> cookies;
            if (isRawArray) {
                // If it's a raw array, parse it as such
                cookies = objectMapper.readValue(jsonString, new TypeReference<List<Map<String, Object>>>(){});
            } else {
                // If it's an object, parse it and get the 'cookies' array
                Map<String, Object> storageState = objectMapper.readValue(jsonString, new TypeReference<Map<String, Object>>(){});
                cookies = (List<Map<String, Object>>) storageState.get("cookies");
            }

            if (cookies != null) {
                for (Map<String, Object> cookie : cookies) {
                    if (cookie.containsKey("sameSite")) {
                        String sameSite = (String) cookie.get("sameSite");
                        if ("no_restriction".equalsIgnoreCase(sameSite)) {
                            cookie.put("sameSite", "None");
                        }
                    } else {
                        // If sameSite is missing (which is also invalid), add a safe default.
                        cookie.put("sameSite", "Lax");
                    }
                }
            }

            // Re-serialize the cleaned data back into the required StorageState format
            return objectMapper.writeValueAsString(Collections.singletonMap("cookies", cookies));

        } catch (Exception e) {
            System.err.println("Could not sanitize cookie JSON with Jackson, returning original value. Error: " + e.getMessage());
            return originalValue; // Fallback to original value on parsing error
        }
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> deleteCookie(@PathVariable("id") Integer id) {
        cookieMapper.deleteById(id);
        return Collections.singletonMap("success", true);
    }

    @PostMapping("/{id}/test")
    public Map<String, Object> testCookie(@PathVariable("id") Integer id) {
        Cookie cookie = cookieMapper.selectById(id);
        return Collections.singletonMap("success", cookie != null);
    }

    @PostMapping("/migrate")
    public Map<String, Object> migrateCookies() {
        return Collections.singletonMap("success", false);
    }
}
