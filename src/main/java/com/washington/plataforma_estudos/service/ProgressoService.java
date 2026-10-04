package com.washington.plataforma_estudos.service;

import com.washington.plataforma_estudos.model.Progresso;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.model.Video;
import com.washington.plataforma_estudos.repository.ProgressoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ProgressoService {

    private final ProgressoRepository progressoRepository;

    public ProgressoService(ProgressoRepository progressoRepository) {
        this.progressoRepository = progressoRepository;
    }

    public Progresso marcarConcluido(Usuario usuario, Video video) {
        Progresso progresso = progressoRepository
                .findByUsuarioIdAndVideoId(usuario.getId(), video.getId())
                .orElse(new Progresso());

        progresso.setUsuario(usuario);
        progresso.setVideo(video);
        progresso.setConcluido(true);
        progresso.setDataConclusao(LocalDateTime.now());

        return progressoRepository.save(progresso);
    }

    public long contarConcluidosNoModulo(Integer usuarioId, Integer moduloId) {
        return progressoRepository.countByUsuarioIdAndVideoModuloIdAndConcluidoTrue(usuarioId, moduloId);
    }
}