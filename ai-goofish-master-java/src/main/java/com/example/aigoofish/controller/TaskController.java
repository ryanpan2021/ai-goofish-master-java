package com.example.aigoofish.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.aigoofish.mapper.TaskMapper;
import com.example.aigoofish.model.Task;
import com.example.aigoofish.service.SpiderService;
import com.example.aigoofish.service.TaskStatusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskMapper taskMapper;

    @Autowired
    private SpiderService spiderService;

    @Autowired
    private TaskStatusService taskStatusService;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskMapper.selectList(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable("id") Integer id) {
        Task task = taskMapper.selectById(id);
        return task != null ? ResponseEntity.ok(task) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        taskMapper.insert(task);
        return task;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTask(@PathVariable("id") Integer id) {
        taskMapper.deleteById(id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Task deleted successfully"));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTask(@PathVariable("id") Integer id, @RequestBody Map<String, Object> updates) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            return ResponseEntity.notFound().build();
        }

        // Manually map fields to handle partial updates from the frontend
        if (updates.containsKey("task_name")) {
            task.setTaskName((String) updates.get("task_name"));
        }
        if (updates.containsKey("keyword")) {
            task.setKeyword((String) updates.get("keyword"));
        }
        if (updates.containsKey("enabled")) {
            task.setEnabled((Boolean) updates.get("enabled"));
        }
        if (updates.containsKey("max_pages")) {
            task.setMaxPages(Integer.parseInt(String.valueOf(updates.get("max_pages"))));
        }
        if (updates.containsKey("personal_only")) {
            task.setPersonalOnly((Boolean) updates.get("personal_only"));
        }
        if (updates.containsKey("min_price")) {
            task.setMinPrice((String) updates.get("min_price"));
        }
        if (updates.containsKey("max_price")) {
            task.setMaxPrice((String) updates.get("max_price"));
        }
        if (updates.containsKey("email_address")) {
            task.setEmailAddress((String) updates.get("email_address"));
        }
        if (updates.containsKey("email_enabled")) {
            task.setEmailEnabled((Boolean) updates.get("email_enabled"));
        }

        task.setUpdatedAt(LocalDateTime.now());
        taskMapper.updateById(task);
        return ResponseEntity.ok(Collections.singletonMap("message", "Task updated successfully"));
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<String> runTask(@PathVariable("id") Integer id) {
        Task task = taskMapper.selectById(id);
        if (task != null) {
            new Thread(() -> spiderService.runTask(task)).start();
            return ResponseEntity.ok("Task " + id + " started.");
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/start-all")
    public ResponseEntity<Map<String, Object>> startAllTasks() {
        QueryWrapper<Task> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("enabled", true);
        List<Task> enabledTasks = taskMapper.selectList(queryWrapper);

        int count = 0;
        for (Task task : enabledTasks) {
            if (!taskStatusService.getRunningTasks().contains(task.getId())) {
                new Thread(() -> spiderService.runTask(task)).start();
                count++;
            }
        }
        return ResponseEntity.ok(Collections.singletonMap("message", count + " tasks started."));
    }

    @PostMapping("/stop-all")
    public ResponseEntity<Map<String, Object>> stopAllTasks() {
        // This is a simplified implementation. It clears the status but doesn't gracefully stop the threads.
        taskStatusService.getRunningTasks().clear();
        return ResponseEntity.ok(Collections.singletonMap("message", "All running tasks have been cleared from status."));
    }
}
