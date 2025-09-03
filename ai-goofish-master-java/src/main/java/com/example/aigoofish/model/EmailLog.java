package com.example.aigoofish.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("email_logs")
public class EmailLog {

    @TableId(type = IdType.AUTO)
    private Integer id;

    private Integer taskId;

    private Integer productId;

    private String emailAddress;

    private String subject;

    private String status;

    private String errorMessage;

    private LocalDateTime sentAt;
}
