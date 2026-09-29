package com.washington.plataforma_estudos.repository;

import com.washington.plataforma_estudos.model.TipoVideo;
import com.washington.plataforma_estudos.model.Video;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VideoRepository extends JpaRepository<Video, Integer> {

    List<Video> findByModuloIdOrderByOrdem(Integer moduloId);
    List<Video> findByTrilhaIdAndTipo(Integer trilhaId, TipoVideo tipo);
}
