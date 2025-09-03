package com.example.aigoofish.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("products")
public class Product {

    @TableId(type = IdType.AUTO)
    private Integer id;

    private Integer taskId;

    private String productId;

    private String title;

    private String price;

    private String link;

    private String location;

    private String sellerNick;

    private String detailFetchStatus;

    private String productData;

    private LocalDateTime createdAt;
}
