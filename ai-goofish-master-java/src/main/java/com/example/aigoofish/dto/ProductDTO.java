package com.example.aigoofish.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ProductDTO {

    @JsonProperty("商品信息")
    private ProductInfoDTO productInfo;

    @JsonProperty("ai_analysis")
    private AiAnalysisInfoDTO aiAnalysis;

    @JsonProperty("详情获取状态")
    private String detailFetchStatus;
}
