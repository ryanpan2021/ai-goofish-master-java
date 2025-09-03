package com.example.aigoofish.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AiAnalysisInfoDTO {

    @JsonProperty("is_recommended")
    private Boolean isRecommended;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("status")
    private String status;
}
