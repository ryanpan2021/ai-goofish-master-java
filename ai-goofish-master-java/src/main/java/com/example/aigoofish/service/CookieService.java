package com.example.aigoofish.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.aigoofish.mapper.CookieMapper;
import com.example.aigoofish.model.Cookie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class CookieService {

    @Autowired
    private CookieMapper cookieMapper;

    /**
     * Fetches a random, active cookie from the database.
     * @return The storage state JSON string of a random active cookie, or null if none are found.
     */
    public String getAvailableCookieStorageState() {
        QueryWrapper<Cookie> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("status", "active");
        List<Cookie> activeCookies = cookieMapper.selectList(queryWrapper);

        if (activeCookies == null || activeCookies.isEmpty()) {
            System.err.println("No active cookies found in the database.");
            return null;
        }

        // Pick a random cookie from the active list
        Random random = new Random();
        Cookie selectedCookie = activeCookies.get(random.nextInt(activeCookies.size()));

        System.out.println("Using cookie: " + selectedCookie.getName());
        return selectedCookie.getCookieValue();
    }
}
