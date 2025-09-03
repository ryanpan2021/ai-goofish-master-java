package com.example.aigoofish.controller;

import com.example.aigoofish.service.TaskStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @Autowired
    private TaskStatusService taskStatusService;

    @GetMapping("/status")
    public Map<String, Object> getSystemStatus() {
        boolean isRunning = taskStatusService.isAnyTaskRunning();
        return Collections.singletonMap("scraper_running", isRunning);
    }
}
