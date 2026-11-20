package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.dto.CadastroRequest;
import com.washington.plataforma_estudos.dto.CadastroResponse;
import com.washington.plataforma_estudos.dto.LoginRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import com.washington.plataforma_estudos.service.JwtService;
import com.washington.plataforma_estudos.service.UsuarioService;
import com.washington.plataforma_estudos.service.UsuarioService.EmailJaCadastrado;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
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

    @Value("${app.google.enabled:false}")
    private boolean googleHabilitado;

    public AuthController(UsuarioService usuarioService, JwtService jwtService) {
        this.usuarioService = usuarioService;
        this.jwtService = jwtService;
    }

    @GetMapping("/metodos")
    public Map<String, Boolean> metodos() {
        return Map.of("google", googleHabilitado);
    }

    @PostMapping("/cadastro")
    public CadastroResponse cadastrar(@Valid @RequestBody CadastroRequest dados) {
        Usuario usuario = new Usuario();
        usuario.setNome(dados.nome().trim());
        usuario.setEmail(dados.email().trim());
        usuario.setSenha(dados.senha());
        usuario.setInstituicao(dados.instituicao() == null ? null : dados.instituicao().trim());
        Usuario criado = usuarioService.cadastrar(usuario);
        String token = jwtService.gerarToken(criado.getEmail());
        return new CadastroResponse(criado.getId(), criado.getNome(), criado.getEmail(),
                criado.getPapel(), criado.getInstituicao(), token);
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

    @ExceptionHandler(EmailJaCadastrado.class)
    public ResponseEntity<Map<String, String>> tratarEmailJaCadastrado() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "codigo", "EMAIL_JA_CADASTRADO", "erro", "Este e-mail já possui uma conta."));
    }
}
