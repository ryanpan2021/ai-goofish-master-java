package com.example.aigoofish.service;

import com.example.aigoofish.model.Product;
import com.example.aigoofish.model.Task;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.microsoft.playwright.*;
import com.microsoft.playwright.options.Proxy;
import com.microsoft.playwright.options.WaitUntilState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.Random;
import java.time.LocalDateTime;

@Service
public class SpiderService {

    private static final Logger log = LoggerFactory.getLogger(SpiderService.class);
    private static final String SEARCH_API_PATTERN = "h5api.m.goofish.com/h5/mtop.taobao.idlemtopsearch.pc.search";
    private static final String DETAIL_API_PATTERN = "h5api.m.goofish.com/h5/mtop.taobao.idle.pc.detail";
    private final Random random = new Random();

    @Value("${playwright.timeout.ms:90000}")
    private double playwrightTimeout;

    @Autowired
    private CookieService cookieService;

    @Autowired
    private ProductService productService;

    @Autowired
    private AiAnalysisService aiAnalysisService;

    @Autowired
    private TaskStatusService taskStatusService;

    @Autowired
    private TaskLogService taskLogService;

    @Autowired
    private ProxyService proxyService;

    public void runTask(Task task) {
        Integer taskId = task.getId();
        taskStatusService.addTask(taskId);
        taskLogService.log(taskId, "INFO", "Starting task: " + task.getTaskName());

        try {
            String storageState = cookieService.getAvailableCookieStorageState();
            if (storageState == null) {
                taskLogService.log(taskId, "ERROR", "Task cannot be executed. No available active cookies.");
                return;
            }

            String proxyAddress = proxyService.getProxy();

            try (Playwright playwright = Playwright.create()) {
                Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));
                Browser.NewContextOptions contextOptions = new Browser.NewContextOptions()
                        .setStorageState(storageState)
                        .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36");

                if (proxyAddress != null) {
                    contextOptions.setProxy(new Proxy("http://" + proxyAddress));
                    taskLogService.log(taskId, "INFO", "Using proxy: " + proxyAddress);
                } else {
                    taskLogService.log(taskId, "INFO", "Not using proxy.");
                }

                BrowserContext context = browser.newContext(contextOptions);

                try {
                    int maxPages = task.getMaxPages() != null ? task.getMaxPages() : 1;
                    for (int i = 1; i <= maxPages; i++) {
                        taskLogService.log(taskId, "INFO", "Processing page: " + i + "/" + maxPages);
                        String searchUrl = buildSearchUrl(task, i);

                        Page searchPage = context.newPage();
                        try {
                            Response searchResponse = searchPage.waitForResponse(
                                r -> r.url().contains(SEARCH_API_PATTERN),
                                () -> searchPage.navigate(searchUrl, new Page.NavigateOptions().setTimeout(playwrightTimeout))
                            );

                            if (searchResponse.ok()) {
                                JsonObject jsonResponse = JsonParser.parseString(searchResponse.text()).getAsJsonObject();
                                processListPage(context, jsonResponse, task);
                            } else {
                                taskLogService.log(taskId, "ERROR", "Failed to get a valid search API response. Status: " + searchResponse.status());
                                break;
                            }
                        } catch (TimeoutError e) {
                            String screenshotPath = takeScreenshot(searchPage, "search_page_timeout");
                            taskLogService.log(taskId, "ERROR", "Timeout waiting for search API. Anti-bot page likely detected. Screenshot saved to: " + screenshotPath, e);
                            break;
                        } finally {
                            searchPage.close();
                            randomDelay(15, 30, taskId);
                        }
                    }
                } finally {
                    browser.close();
                }
            }
        } catch (Exception e) {
            log.error("A critical error occurred in runTask for task ID: {}", taskId, e);
            taskLogService.log(taskId, "ERROR", "A critical, unexpected error occurred: " + e.getClass().getName(), e);
        } finally {
            taskStatusService.removeTask(taskId);
            taskLogService.log(taskId, "INFO", "Finished task: " + task.getTaskName());
        }
    }

    private void processListPage(BrowserContext context, JsonObject jsonResponse, Task task) {
        if (jsonResponse == null || !jsonResponse.has("data")) return;
        JsonObject data = jsonResponse.getAsJsonObject("data");
        if (data == null || !data.has("resultList")) return;
        JsonArray resultList = data.getAsJsonArray("resultList");

        taskLogService.log(task.getId(), "INFO", "Found " + resultList.size() + " items on this page.");

        for (JsonElement itemElement : resultList) {
            String productUrl = getJsonString(itemElement, "data", "item", "main", "targetUrl");

            if (productUrl == null || productUrl.isEmpty()) {
                taskLogService.log(task.getId(), "WARNING", "Skipping item with no product URL.", itemElement.toString());
                continue;
            }

            if (productUrl.startsWith("fleamarket://")) {
                productUrl = productUrl.replace("fleamarket://", "https://www.goofish.com/");
                taskLogService.log(task.getId(), "DEBUG", "Converted fleamarket URL to: " + productUrl);
            }

            final String finalProductUrl = productUrl;
            taskLogService.log(task.getId(), "INFO", "Processing product: " + finalProductUrl);
            Page detailPage = context.newPage();
            try {
                Response detailResponse = detailPage.waitForResponse(
                    r -> r.url().contains(DETAIL_API_PATTERN),
                    () -> detailPage.navigate(finalProductUrl, new Page.NavigateOptions()
                                                        .setWaitUntil(WaitUntilState.DOMCONTENTLOADED)
                                                        .setTimeout(playwrightTimeout))
                );

                if (detailResponse.ok()) {
                    JsonObject detailJson = JsonParser.parseString(detailResponse.text()).getAsJsonObject();
                    Product savedProduct = productService.saveProduct(itemElement.getAsJsonObject(), detailJson, task.getId());

                    if (savedProduct != null && task.getAiPromptText() != null && !task.getAiPromptText().trim().isEmpty()) {
                        aiAnalysisService.performAnalysis(savedProduct, task);
                    }

                } else {
                    taskLogService.log(task.getId(), "ERROR", "Failed to get detail page API response. Status: " + detailResponse.status());
                }
            } catch (TimeoutError e) {
                String screenshotPath = takeScreenshot(detailPage, "detail_page_timeout");
                taskLogService.log(task.getId(), "ERROR", "Timeout waiting for detail API on " + finalProductUrl + ". Screenshot saved to: " + screenshotPath, e);
            } catch (Exception e) {
                taskLogService.log(task.getId(), "ERROR", "Error fetching detail page for " + finalProductUrl + ": " + e.getMessage(), e);
            } finally {
                detailPage.close();
                randomDelay(5, 10, task.getId());
            }
        }
    }

    private String getJsonString(JsonElement element, String... path) {
        if (element == null || element.isJsonNull() || !element.isJsonObject()) return null;
        JsonObject current = element.getAsJsonObject();
        for (int i = 0; i < path.length - 1; i++) {
            if (current == null || !current.has(path[i]) || !current.get(path[i]).isJsonObject()) return null;
            current = current.getAsJsonObject(path[i]);
        }
        String lastPathSegment = path[path.length - 1];
        if (current == null || !current.has(lastPathSegment) || !current.get(lastPathSegment).isJsonPrimitive()) return null;
        return current.get(lastPathSegment).getAsString();
    }

    private String takeScreenshot(Page page, String name) {
        try {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String path = "screenshots/" + name + "_" + timestamp + ".png";
            page.screenshot(new Page.ScreenshotOptions().setPath(Paths.get(path)).setFullPage(true));
            return path;
        } catch (Exception e) {
            return "Screenshot failed: " + e.getMessage();
        }
    }

    private String buildSearchUrl(Task task, int page) {
        if (task.getKeyword() == null || task.getKeyword().trim().isEmpty()) {
            throw new IllegalArgumentException("Task keyword cannot be null or empty.");
        }
        try {
            StringBuilder urlBuilder = new StringBuilder("https://www.goofish.com/search?q=");
            urlBuilder.append(URLEncoder.encode(task.getKeyword(), StandardCharsets.UTF_8.name()));

            if (task.getPersonalOnly() != null && task.getPersonalOnly()) {
                urlBuilder.append("&st=1");
            }
            if (task.getMinPrice() != null && !task.getMinPrice().isEmpty()) {
                urlBuilder.append("&price_start=").append(task.getMinPrice());
            }
            if (task.getMaxPrice() != null && !task.getMaxPrice().isEmpty()) {
                urlBuilder.append("&price_end=").append(task.getMaxPrice());
            }
            if (page > 1) {
                urlBuilder.append("&page=").append(page);
            }
            return urlBuilder.toString();
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }

    private void randomDelay(int minSeconds, int maxSeconds, Integer taskId) {
        try {
            int delay = minSeconds + random.nextInt(maxSeconds - minSeconds + 1);
            taskLogService.log(taskId, "DEBUG", "Delaying for " + delay + " seconds");
            Thread.sleep(delay * 1000L);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
