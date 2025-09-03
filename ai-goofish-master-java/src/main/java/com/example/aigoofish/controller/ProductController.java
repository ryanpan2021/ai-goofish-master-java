package com.example.aigoofish.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.aigoofish.dto.ProductDTO;
import com.example.aigoofish.mapper.TaskMapper;
import com.example.aigoofish.model.Task;
import com.example.aigoofish.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/results")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private TaskMapper taskMapper;

    /**
     * Endpoint to get the list of task names for the dropdown filter.
     * Matches the frontend's expectation for the /api/results/files call.
     */
    @GetMapping("/files")
    public Map<String, List<String>> getResultFiles() {
        List<Task> tasks = taskMapper.selectList(null);
        List<String> taskNames = tasks.stream()
                                      .map(Task::getTaskName)
                                      .collect(Collectors.toList());
        return Collections.singletonMap("files", taskNames);
    }

    /**
     * Endpoint to get the actual product results for a given task name.
     * Matches the frontend's expectation for the /api/results/{filename} call.
     */
    @GetMapping("/{taskName}")
    public ResponseEntity<Map<String, Object>> getResultsByTaskName(
            @PathVariable String taskName,
            @RequestParam(defaultValue = "false") boolean recommended_only) {

        // Find the task by its name to get the ID
        QueryWrapper<Task> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("task_name", taskName).last("LIMIT 1");
        Task task = taskMapper.selectOne(queryWrapper);

        if (task == null) {
            return ResponseEntity.notFound().build();
        }

        // Get the DTOs from the service
        List<ProductDTO> productDTOs = productService.getProductsForTask(task.getId());

        // Filter by recommendation if required
        if (recommended_only) {
            productDTOs = productDTOs.stream()
                .filter(p -> p.getAiAnalysis() != null && Boolean.TRUE.equals(p.getAiAnalysis().getIsRecommended()))
                .collect(Collectors.toList());
        }

        // Wrap the results in the format expected by the frontend
        Map<String, Object> response = Collections.singletonMap("items", productDTOs);
        return ResponseEntity.ok(response);
    }
}
