package com.example.aigoofish.service;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TaskStatusService {

    private final Set<Integer> runningTasks = Collections.newSetFromMap(new ConcurrentHashMap<>());

    public void addTask(Integer taskId) {
        runningTasks.add(taskId);
    }

    public void removeTask(Integer taskId) {
        runningTasks.remove(taskId);
    }

    public boolean isAnyTaskRunning() {
        return !runningTasks.isEmpty();
    }

    public Set<Integer> getRunningTasks() {
        return Collections.unmodifiableSet(runningTasks);
    }
}
