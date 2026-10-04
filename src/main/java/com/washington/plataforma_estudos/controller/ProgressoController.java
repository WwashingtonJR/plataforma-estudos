package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.model.Progresso;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.model.Video;
import com.washington.plataforma_estudos.service.ProgressoService;
import com.washington.plataforma_estudos.service.VideoService;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/progresso")
public class ProgressoController {

    private final ProgressoService progressoService;
    private final VideoService videoService;
    private final UsuarioRepository usuarioRepository;

    public ProgressoController(ProgressoService progressoService, VideoService videoService, UsuarioRepository usuarioRepository) {
        this.progressoService = progressoService;
        this.videoService = videoService;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/video/{videoId}/concluir")
    public Progresso marcarConcluido(@PathVariable Integer videoId, Authentication authentication) {
        String email = authentication.getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        Video video = videoService.buscarPorId(videoId);

        return progressoService.marcarConcluido(usuario, video);
    }

    @GetMapping("/modulo/{moduloId}/contagem")
    public long contarConcluidos(@PathVariable Integer moduloId, Authentication authentication) {
        String email = authentication.getName();
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        return progressoService.contarConcluidosNoModulo(usuario.getId(), moduloId);
    }
}