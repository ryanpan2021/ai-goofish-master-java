package com.example.aigoofish.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.aigoofish.model.Product;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProductMapper extends BaseMapper<Product> {
}
