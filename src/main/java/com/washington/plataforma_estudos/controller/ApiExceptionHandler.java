package com.washington.plataforma_estudos.controller;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class,
            HttpMessageNotReadableException.class})
    public ResponseEntity<Map<String, String>> dadosInvalidos(Exception exception) {
        return ResponseEntity.badRequest().body(Map.of("erro", "Confira os dados informados."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> conflito(DataIntegrityViolationException exception) {
        return ResponseEntity.status(409).body(Map.of("erro", "Os dados conflitam com um registro existente."));
    }
}
