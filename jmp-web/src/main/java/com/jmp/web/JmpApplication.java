package com.jmp.web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application entry point for Jitsi Management Platform.
 * Per specification §1.1, §3.1
 */
@SpringBootApplication(scanBasePackages = "com.jmp")
@EnableJpaRepositories(basePackages = "com.jmp.domain.repository")
@EntityScan(basePackages = "com.jmp.domain.entity")
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class JmpApplication {

    public static void main(String[] args) {
        SpringApplication.run(JmpApplication.class, args);
    }
}
