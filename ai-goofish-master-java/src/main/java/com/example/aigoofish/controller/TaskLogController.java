package com.example.aigoofish.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.aigoofish.mapper.TaskLogMapper;
import com.example.aigoofish.model.TaskLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
public class TaskLogController {

    @Autowired
    private TaskLogMapper taskLogMapper;

    @GetMapping
    public Map<String, Object> getLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) Integer taskId,
            @RequestParam(required = false) String level) {

        Page<TaskLog> pager = new Page<>(page, limit);
        QueryWrapper<TaskLog> queryWrapper = new QueryWrapper<>();

        if (taskId != null) {
            queryWrapper.eq("task_id", taskId);
        }
        if (level != null && !level.isEmpty()) {
            queryWrapper.eq("level", level);
        }

        queryWrapper.orderByDesc("created_at");

        Page<TaskLog> resultPage = taskLogMapper.selectPage(pager, queryWrapper);

        Map<String, Object> response = new HashMap<>();
        response.put("logs", resultPage.getRecords());
        response.put("current_page", resultPage.getCurrent());
        response.put("has_more", resultPage.hasNext());

        return response;
    }
}
