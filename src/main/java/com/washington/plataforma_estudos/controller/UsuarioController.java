package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.dto.PerfilDTO;
import com.washington.plataforma_estudos.dto.PerfilUpdate;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    private Usuario usuarioLogado(Authentication authentication) {
        return usuarioRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    private PerfilDTO paraDTO(Usuario u) {
        return new PerfilDTO(u.getNome(), u.getEmail(), u.getInstituicao(), u.getPapel().name());
    }

    @GetMapping("/me")
    public PerfilDTO meuPerfil(Authentication authentication) {
        return paraDTO(usuarioLogado(authentication));
    }

    @PutMapping("/me")
    public PerfilDTO atualizar(@RequestBody PerfilUpdate dados, Authentication authentication) {
        if (dados.nome() == null || dados.nome().isBlank() || dados.nome().length() > 120) {
            throw new IllegalArgumentException("Nome inválido.");
        }

        Usuario usuario = usuarioLogado(authentication);
        usuario.setNome(dados.nome().trim());
        usuario.setInstituicao(dados.instituicao() == null ? null : dados.instituicao().trim());

        return paraDTO(usuarioRepository.save(usuario));
    }
}