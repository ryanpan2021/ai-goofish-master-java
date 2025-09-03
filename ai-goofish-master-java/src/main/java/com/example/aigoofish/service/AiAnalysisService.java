package com.example.aigoofish.service;

import com.example.aigoofish.mapper.AiAnalysisMapper;
import com.example.aigoofish.model.AiAnalysis;
import com.example.aigoofish.model.Product;
import com.example.aigoofish.model.Task;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AiAnalysisService {

    @Autowired(required = false)
    private OpenAiService openAiService;

    @Autowired
    private AiAnalysisMapper aiAnalysisMapper;

    @Autowired
    private EmailService emailService;

    @Value("${openai.model.name}")
    private String modelName;

    private final Gson gson = new Gson();

    public void performAnalysis(Product product, Task task) {
        if (openAiService == null) {
            System.err.println("AI Service is not configured. Skipping analysis.");
            return;
        }

        String promptText = task.getAiPromptText();
        if (promptText == null || promptText.trim().isEmpty()) {
            System.out.println("No AI prompt configured for task '" + task.getTaskName() + "'. Skipping analysis.");
            return;
        }

        System.out.println("  [AI] Performing analysis for product: " + product.getTitle());
        AiAnalysis aiAnalysis = null;

        try {
            // Construct the prompt, ensuring it requests a JSON object.
            String systemPrompt = promptText + "\n\nIMPORTANT: Your response MUST be a valid JSON object and nothing else. Do not include any text before or after the JSON.";
            String userPrompt = "Please analyze the following product data based on the instructions provided:\n\n```json\n" +
                                product.getProductData() + "\n```";

            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), userPrompt));

            ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                    .model(modelName)
                    .messages(messages)
                    .build();

            String responseJson = openAiService.createChatCompletion(completionRequest).getChoices().get(0).getMessage().getContent();
            JsonObject analysisJson = gson.fromJson(responseJson, JsonObject.class);

            aiAnalysis = new AiAnalysis();
            aiAnalysis.setTaskId(task.getId());
            aiAnalysis.setProductId(product.getId());
            aiAnalysis.setAnalysisStatus("SUCCESS");
            aiAnalysis.setIsRecommended(analysisJson.has("is_recommended") && analysisJson.get("is_recommended").getAsBoolean());
            aiAnalysis.setReason(analysisJson.has("reason") ? analysisJson.get("reason").getAsString() : "");
            aiAnalysis.setFullResponse(responseJson);
            aiAnalysis.setCreatedAt(LocalDateTime.now());

            aiAnalysisMapper.insert(aiAnalysis);
            System.out.println("  [AI] Analysis successful and saved to database.");

            // Check if email notification should be sent
            if (task.getEmailEnabled() != null && task.getEmailEnabled() && aiAnalysis.getIsRecommended()) {
                emailService.sendProductNotification(product, aiAnalysis, task);
            }

        } catch (Exception e) {
            System.err.println("  [AI] Error during AI analysis: " + e.getMessage());
            AiAnalysis errorAnalysis = new AiAnalysis();
            errorAnalysis.setTaskId(task.getId());
            errorAnalysis.setProductId(product.getId());
            errorAnalysis.setAnalysisStatus("FAILED");
            errorAnalysis.setReason("AI analysis failed: " + e.getMessage());
            errorAnalysis.setCreatedAt(LocalDateTime.now());
            aiAnalysisMapper.insert(errorAnalysis);
        }
    }
}
