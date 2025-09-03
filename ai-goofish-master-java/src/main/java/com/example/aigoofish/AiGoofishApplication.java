package com.example.aigoofish;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
@MapperScan("com.example.aigoofish.mapper")
public class AiGoofishApplication implements CommandLineRunner {

    @Autowired
    private Environment environment;

    public static void main(String[] args) {
        SpringApplication.run(AiGoofishApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("\n\n--- DIAGNOSTIC CHECK ---");
        String namingStrategy = environment.getProperty("spring.jackson.property-naming-strategy");
        if (namingStrategy != null && !namingStrategy.isEmpty()) {
            System.out.println("SUCCESS: Global JSON naming strategy is set to: " + namingStrategy);
        } else {
            System.out.println("ERROR: Global JSON naming strategy is NOT set. This is the cause of the problem.");
        }
        System.out.println("------------------------\n\n");
    }
}
