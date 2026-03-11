package com.innovhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class InnovHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(InnovHubApplication.class, args);
    }
}
