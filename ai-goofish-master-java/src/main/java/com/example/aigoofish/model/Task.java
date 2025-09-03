package com.example.aigoofish.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("tasks")
public class Task {

    @TableId(type = IdType.AUTO)
    private Integer id;

    private String taskName;

    private String keyword;

    private Boolean enabled;

    private Integer maxPages;

    private Boolean personalOnly;

    private String minPrice;

    private String maxPrice;

    private String aiPromptText;

    private String emailAddress;

    private Boolean emailEnabled;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
