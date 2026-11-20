package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.dto.CursoEmAndamento;
import com.washington.plataforma_estudos.dto.ProgressoPlaylist;
import com.washington.plataforma_estudos.model.Progresso;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.model.Video;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import com.washington.plataforma_estudos.service.ProgressoService;
import com.washington.plataforma_estudos.service.VideoService;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/video/{videoId}/iniciar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void iniciar(@PathVariable Integer videoId, Authentication authentication) {
        Video video = videoService.buscarPorId(videoId);
        progressoService.registrarAcesso(usuarioLogado(authentication), video);
    }

    @GetMapping("/em-andamento")
    public List<CursoEmAndamento> emAndamento(Authentication authentication) {
        return progressoService.listarEmAndamento(usuarioLogado(authentication).getId());
    }

    @GetMapping("/video/{videoId}/aulas")
    public ProgressoPlaylist progressoPlaylist(@PathVariable Integer videoId, Authentication authentication) {
        return progressoService.progressoPlaylist(usuarioLogado(authentication).getId(), videoService.buscarPorId(videoId));
    }

    @PutMapping("/video/{videoId}/aulas/{aulaId}")
    public ProgressoPlaylist concluirAula(@PathVariable Integer videoId, @PathVariable String aulaId,
            Authentication authentication) {
        return progressoService.concluirAula(usuarioLogado(authentication), videoService.buscarPorId(videoId), aulaId);
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
