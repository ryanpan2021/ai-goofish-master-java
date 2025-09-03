package com.example.aigoofish.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ProductInfoDTO {

    @JsonProperty("商品ID")
    private String productId;

    @JsonProperty("商品标题")
    private String title;

    @JsonProperty("当前售价")
    private String price;

    @JsonProperty("商品链接")
    private String link;

    @JsonProperty("卖家昵称")
    private String sellerNick;
}
