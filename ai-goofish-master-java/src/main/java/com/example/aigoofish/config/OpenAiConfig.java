package com.example.aigoofish.config;

import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class OpenAiConfig {

    @Value("${openai.api.key}")
    private String openAiApiKey;

    @Bean
    public OpenAiService openAiService() {
        if (openAiApiKey == null || openAiApiKey.equals("YOUR_OPENAI_API_KEY") || openAiApiKey.isEmpty()) {
            System.err.println("********************************************************************************");
            System.err.println("WARNING: OpenAI API Key is not configured in application.properties.");
            System.err.println("AI features will be disabled.");
            System.err.println("********************************************************************************");
            // Return a null or dummy service if you want the app to run without AI.
            // For this case, we let it proceed, but it will fail if used.
        }
        return new OpenAiService(openAiApiKey, Duration.ofSeconds(60));
    }
}
