package com.example.aigoofish.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.example.aigoofish.dto.AiAnalysisInfoDTO;
import com.example.aigoofish.dto.ProductDTO;
import com.example.aigoofish.dto.ProductInfoDTO;
import com.example.aigoofish.mapper.AiAnalysisMapper;
import com.example.aigoofish.mapper.ProductMapper;
import com.example.aigoofish.model.AiAnalysis;
import com.example.aigoofish.model.Product;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private AiAnalysisMapper aiAnalysisMapper;

    @Autowired
    private TaskLogService taskLogService;

    public List<ProductDTO> getProductsForTask(Integer taskId) {
        QueryWrapper<Product> productQuery = new QueryWrapper<>();
        productQuery.eq("task_id", taskId).orderByDesc("created_at");
        List<Product> products = productMapper.selectList(productQuery);

        return products.stream().map(product -> {
            ProductDTO dto = new ProductDTO();
            ProductInfoDTO productInfoDTO = new ProductInfoDTO();
            productInfoDTO.setProductId(product.getProductId());
            productInfoDTO.setTitle(product.getTitle());
            productInfoDTO.setPrice(product.getPrice());
            
            String link = product.getLink();
            if (link != null && link.startsWith("fleamarket://")) {
                link = link.replace("fleamarket://", "https://www.goofish.com/");
            }
            productInfoDTO.setLink(link);

            productInfoDTO.setSellerNick(product.getSellerNick());
            dto.setProductInfo(productInfoDTO);

            QueryWrapper<AiAnalysis> analysisQuery = new QueryWrapper<>();
            analysisQuery.eq("product_id", product.getId()).last("LIMIT 1");
            AiAnalysis analysis = aiAnalysisMapper.selectOne(analysisQuery);

            AiAnalysisInfoDTO aiAnalysisInfoDTO = new AiAnalysisInfoDTO();
            if (analysis != null) {
                aiAnalysisInfoDTO.setIsRecommended(analysis.getIsRecommended());
                aiAnalysisInfoDTO.setReason(analysis.getReason());
                aiAnalysisInfoDTO.setStatus(analysis.getAnalysisStatus());
            } else {
                aiAnalysisInfoDTO.setStatus("PENDING");
            }
            dto.setAiAnalysis(aiAnalysisInfoDTO);
            dto.setDetailFetchStatus(product.getDetailFetchStatus());
            return dto;
        }).collect(Collectors.toList());
    }

    public Product saveProduct(JsonObject searchItem, JsonObject detailJson, int taskId) {
        String productId = null;
        try {
            productId = getJsonStringSafe(searchItem, "data", "item", "main", "exContent", "itemId");
            if (productId == null) {
                taskLogService.log(taskId, "WARNING", "Skipping item with no product ID.", searchItem.toString());
                return null;
            }

            QueryWrapper<Product> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("product_id", productId);
            if (productMapper.selectCount(queryWrapper) > 0) {
                taskLogService.log(taskId, "INFO", "Product " + productId + " already exists. Skipping save.");
                return null;
            }

            Product product = new Product();
            product.setTaskId(taskId);
            product.setProductId(productId);

            product.setTitle(getJsonStringSafe(searchItem, "data", "item", "main", "exContent", "title"));
            
            String productUrl = getJsonStringSafe(searchItem, "data", "item", "main", "targetUrl");
            if (productUrl != null && productUrl.startsWith("fleamarket://")) {
                productUrl = productUrl.replace("fleamarket://", "https://www.goofish.com/");
            }
            product.setLink(productUrl);

            product.setLocation(getJsonStringSafe(searchItem, "data", "item", "main", "exContent", "area"));
            product.setSellerNick(getJsonStringSafe(detailJson, "data", "sellerDO", "sellerNick"));

            JsonArray priceArray = getJsonArraySafe(searchItem, "data", "item", "main", "exContent", "price");
            if (priceArray != null) {
                StringBuilder priceBuilder = new StringBuilder();
                for (JsonElement pricePart : priceArray) {
                    if (pricePart != null && pricePart.isJsonObject()) {
                        JsonObject priceObject = pricePart.getAsJsonObject();
                        if (priceObject.has("text") && priceObject.get("text").isJsonPrimitive()) {
                            priceBuilder.append(priceObject.get("text").getAsString());
                        }
                    }
                }
                product.setPrice(priceBuilder.length() > 0 ? priceBuilder.toString() : "价格未知");
            } else {
                product.setPrice("价格未知");
            }

            product.setDetailFetchStatus("SUCCESS");
            product.setProductData(detailJson != null ? detailJson.toString() : "{}");
            product.setCreatedAt(LocalDateTime.now());

            productMapper.insert(product);
            taskLogService.log(taskId, "INFO", "Successfully saved product: " + product.getTitle());
            return product;

        } catch (Exception e) {
            String errorMsg = "Failed to save product. Check details for full JSON.";
            JsonObject errorDetails = new JsonObject();
            errorDetails.add("searchItemJson", searchItem);
            errorDetails.add("detailJson", detailJson);
            log.error("Critical error in saveProduct for task ID: {}", taskId, e);
            taskLogService.log(taskId, "ERROR", errorMsg, errorDetails);
            return null;
        }
    }

    private String getJsonStringSafe(JsonElement element, String... path) {
        if (element == null || !element.isJsonObject()) return null;
        JsonObject current = element.getAsJsonObject();
        for (int i = 0; i < path.length - 1; i++) {
            if (current == null || !current.has(path[i]) || !current.get(path[i]).isJsonObject()) return null;
            current = current.getAsJsonObject(path[i]);
        }
        if (current == null || !current.has(path[path.length - 1]) || !current.get(path[path.length - 1]).isJsonPrimitive()) return null;
        return current.get(path[path.length - 1]).getAsString();
    }

    private JsonArray getJsonArraySafe(JsonElement element, String... path) {
        if (element == null || !element.isJsonObject()) return null;
        JsonObject current = element.getAsJsonObject();
        for (int i = 0; i < path.length - 1; i++) {
            if (current == null || !current.has(path[i]) || !current.get(path[i]).isJsonObject()) return null;
            current = current.getAsJsonObject(path[i]);
        }
        if (current == null || !current.has(path[path.length - 1]) || !current.get(path[path.length - 1]).isJsonArray()) return null;
        return current.get(path[path.length - 1]).getAsJsonArray();
    }
}
