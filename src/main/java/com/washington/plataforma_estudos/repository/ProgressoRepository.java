package com.washington.plataforma_estudos.repository;

import com.washington.plataforma_estudos.model.Progresso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProgressoRepository extends JpaRepository<Progresso, Integer> {

        Optional<Progresso> findByUsuarioIdAndVideoId(Integer usuarioId, Integer videoId);
    long countByUsuarioIdAndVideoModuloIdAndConcluidoTrue(Integer usuarioId, Integer moduloId);
}
