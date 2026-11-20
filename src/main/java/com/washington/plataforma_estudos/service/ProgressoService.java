package com.washington.plataforma_estudos.service;

import com.washington.plataforma_estudos.dto.CursoEmAndamento;
import com.washington.plataforma_estudos.dto.ProgressoPlaylist;
import com.washington.plataforma_estudos.model.Progresso;
import com.washington.plataforma_estudos.model.TipoVideo;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.model.Video;
import com.washington.plataforma_estudos.repository.ProgressoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProgressoService {

    private final ProgressoRepository progressoRepository;
    private final EntityManager entityManager;
    private final CatalogoPlaylists catalogoPlaylists;

    public ProgressoService(ProgressoRepository progressoRepository, EntityManager entityManager,
            CatalogoPlaylists catalogoPlaylists) {
        this.progressoRepository = progressoRepository;
        this.entityManager = entityManager;
        this.catalogoPlaylists = catalogoPlaylists;
    }

    @Transactional
    public void registrarAcesso(Usuario usuario, Video video) {
        var progresso = obterProgresso(usuario, video);
        progresso.setUltimoAcesso(Instant.now());
        progressoRepository.save(progresso);
    }

    @Transactional
    public Progresso marcarConcluido(Usuario usuario, Video video) {
        var progresso = obterProgresso(usuario, video);
        progresso.setConcluido(true);
        progresso.setDataConclusao(LocalDateTime.now());
        return progressoRepository.save(progresso);
    }

    @Transactional(readOnly = true)
    public ProgressoPlaylist progressoPlaylist(Integer usuarioId, Video video) {
        var ids = catalogoPlaylists.buscar(video.getUrlYoutube()).ids();
        return progressoRepository.findByUsuarioIdAndVideoId(usuarioId, video.getId())
                .map(progresso -> paraPlaylist(progresso, ids))
                .orElseGet(() -> new ProgressoPlaylist(List.of(), false));
    }

    @Transactional
    public ProgressoPlaylist concluirAula(Usuario usuario, Video video, String aulaId) {
        var playlist = catalogoPlaylists.buscar(video.getUrlYoutube());
        var ids = playlist.ids();
        if (!ids.contains(aulaId)) throw new IllegalArgumentException("Aula indisponível nesta playlist.");

        var progresso = obterProgresso(usuario, video);
        if (!progresso.getConcluido() && progresso.getAulasConcluidas().add(aulaId)) {
            progresso.setUltimoAcesso(Instant.now());
            if (playlist.complete() && progresso.getAulasConcluidas().containsAll(ids)) {
                progresso.setConcluido(true);
                progresso.setDataConclusao(LocalDateTime.now());
            }
            progressoRepository.save(progresso);
        }
        return paraPlaylist(progresso, ids);
    }

    private ProgressoPlaylist paraPlaylist(Progresso progresso, List<String> ids) {
        return new ProgressoPlaylist(progresso.getConcluido() ? ids
                : ids.stream().filter(progresso.getAulasConcluidas()::contains).toList(), progresso.getConcluido());
    }

    private Progresso obterProgresso(Usuario usuario, Video video) {
        // Serializa a abertura e a conclusão disparadas pela mesma conta.
        var usuarioGerenciado = entityManager.find(Usuario.class, usuario.getId(), LockModeType.PESSIMISTIC_WRITE);
        return progressoRepository
                .findByUsuarioIdAndVideoId(usuario.getId(), video.getId())
                .orElseGet(() -> {
                    var progresso = new Progresso();
                    progresso.setUsuario(usuarioGerenciado);
                    progresso.setVideo(video);
                    return progresso;
                });
    }

    @Transactional(readOnly = true)
    public List<CursoEmAndamento> listarEmAndamento(Integer usuarioId) {
        var cursos = new ArrayList<CursoEmAndamento>();
        for (var progresso : progressoRepository
                .findByUsuarioIdAndConcluidoFalseAndUltimoAcessoIsNotNullOrderByUltimoAcessoDescIdDesc(usuarioId)) {
            var video = progresso.getVideo();
            boolean introducao = video.getTipo() == TipoVideo.INTRODUTORIO;
            var modulo = video.getModulo();
            if (!introducao && modulo == null) continue;
            var trilha = introducao ? video.getTrilha() : modulo.getTrilha();
            if (trilha == null) continue;
            cursos.add(new CursoEmAndamento(video.getId(), trilha.getId(), introducao ? null : modulo.getId(),
                    video.getTitulo(), trilha.getNome()));
        }
        return cursos;
    }

    public long contarConcluidosNoModulo(Integer usuarioId, Integer moduloId) {
        return progressoRepository.countByUsuarioIdAndVideoModuloIdAndConcluidoTrue(usuarioId, moduloId);
    }

    public List<Integer> listarIdsConcluidos(Integer usuarioId) {
        return progressoRepository.findByUsuarioIdAndConcluidoTrue(usuarioId)
                .stream()
                .map(p -> p.getVideo().getId())
                .toList();
    }
}
