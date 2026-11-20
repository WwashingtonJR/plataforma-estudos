package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.dto.CadastroRequest;
import com.washington.plataforma_estudos.dto.LoginRequest;
import jakarta.validation.Valid;
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
    public Usuario cadastrar(@Valid @RequestBody CadastroRequest dados) {
        Usuario usuario = new Usuario();
        usuario.setNome(dados.nome().trim());
        usuario.setEmail(dados.email().trim());
        usuario.setSenha(dados.senha());
        usuario.setInstituicao(dados.instituicao() == null ? null : dados.instituicao().trim());
        return usuarioService.cadastrar(usuario);
    }

    @PostMapping("/login")
    public Map<String, String> login(@Valid @RequestBody LoginRequest dados) {
        String email = dados.email().trim();
        String senha = dados.senha();

        Usuario usuario = usuarioService.autenticar(email, senha);
        String token = jwtService.gerarToken(usuario.getEmail());

        return Map.of("token", token, "papel", usuario.getPapel().name());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> tratarErroDeAutenticacao(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("erro", e.getMessage()));
    }
}
