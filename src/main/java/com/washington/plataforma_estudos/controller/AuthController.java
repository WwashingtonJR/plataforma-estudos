package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.service.JwtService;
import com.washington.plataforma_estudos.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UsuarioService usuarioService;
    private final JwtService jwtService;

    public AuthController(UsuarioService usuarioService, JwtService jwtService) {
        this.usuarioService = usuarioService;
        this.jwtService = jwtService;
    }

    @PostMapping("/cadastro")
    public Usuario cadastrar(@RequestBody Usuario usuario) {
        return usuarioService.cadastrar(usuario);
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> dados) {
        String email = dados.get("email");
        String senha = dados.get("senha");

        Usuario usuario = usuarioService.autenticar(email, senha);
        String token = jwtService.gerarToken(usuario.getEmail());

        return Map.of("token", token, "papel", usuario.getPapel().name());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> tratarErroDeAutenticacao(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("erro", e.getMessage()));
    }
}