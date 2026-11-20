package com.washington.plataforma_estudos.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    @GetMapping("/health")
    public Map<String, String> health() {
        // Liveness sem expor versões, conexões ou credenciais.
        return Map.of("status", "UP");
    }
}
