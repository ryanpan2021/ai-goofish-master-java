package com.example.aigoofish.service;

import com.example.aigoofish.mapper.TaskLogMapper;
import com.example.aigoofish.model.TaskLog;
import com.google.gson.Gson;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TaskLogService {

    @Autowired
    private TaskLogMapper taskLogMapper;

    private final Gson gson = new Gson();

    public void log(Integer taskId, String level, String message) {
        log(taskId, level, message, null);
    }

    public void log(Integer taskId, String level, String message, Object details) {
        try {
            TaskLog log = new TaskLog();
            log.setTaskId(taskId);
            log.setLevel(level);
            log.setMessage(message);
            if (details != null) {
                log.setDetails(gson.toJson(details));
            }
            log.setCreatedAt(LocalDateTime.now());
            taskLogMapper.insert(log);
        } catch (Exception e) {
            // Log to console if DB logging fails
            System.err.println("Failed to write log to database: " + e.getMessage());
            System.err.println(String.format("Original Log: [TaskID: %d, Level: %s, Message: %s]", taskId, level, message));
        }
    }
}
