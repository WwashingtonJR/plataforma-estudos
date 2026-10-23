package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.model.Progresso;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.model.Video;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import com.washington.plataforma_estudos.service.ProgressoService;
import com.washington.plataforma_estudos.service.VideoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    private Usuario usuarioLogado(Authentication authentication) {
        return usuarioRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    @PostMapping("/video/{videoId}/concluir")
    public Progresso marcarConcluido(@PathVariable Integer videoId, Authentication authentication) {
        Video video = videoService.buscarPorId(videoId);
        return progressoService.marcarConcluido(usuarioLogado(authentication), video);
    }

    @GetMapping("/modulo/{moduloId}/contagem")
    public long contarConcluidos(@PathVariable Integer moduloId, Authentication authentication) {
        return progressoService.contarConcluidosNoModulo(usuarioLogado(authentication).getId(), moduloId);
    }

    @GetMapping("/concluidos")
    public List<Integer> concluidos(Authentication authentication) {
        return progressoService.listarIdsConcluidos(usuarioLogado(authentication).getId());
    }
}