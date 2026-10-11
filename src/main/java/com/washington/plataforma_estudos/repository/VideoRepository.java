package com.washington.plataforma_estudos.repository;

import com.washington.plataforma_estudos.dto.CreditoDTO;
import com.washington.plataforma_estudos.model.TipoVideo;
import com.washington.plataforma_estudos.model.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VideoRepository extends JpaRepository<Video, Integer> {

    List<Video> findByModuloIdOrderByOrdem(Integer moduloId);

    List<Video> findByTrilhaIdAndTipo(Integer trilhaId, TipoVideo tipo);

    @Query("select new com.washington.plataforma_estudos.dto.CreditoDTO(v.autor, count(v)) from Video v where v.autor is not null group by v.autor order by count(v) desc")
    List<CreditoDTO> contarPorAutor();
}