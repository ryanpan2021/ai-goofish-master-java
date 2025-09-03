package com.example.aigoofish.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("ai_analysis")
public class AiAnalysis {

    @TableId(type = IdType.AUTO)
    private Integer id;

    private Integer taskId;

    private Integer productId;

    private String analysisStatus;

    private Boolean isRecommended;

    private String reason;

    private String fullResponse;

    private LocalDateTime createdAt;
}
