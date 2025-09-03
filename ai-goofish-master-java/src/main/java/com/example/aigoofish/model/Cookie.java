package com.example.aigoofish.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("cookies")
public class Cookie {

    @TableId(type = IdType.AUTO)
    private Integer id;

    private String name;

    private String cookieValue;

    private String status;

    private LocalDateTime lastUsed;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
