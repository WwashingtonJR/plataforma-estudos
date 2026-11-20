package com.washington.plataforma_estudos.repository;

import com.washington.plataforma_estudos.model.ProjetoComunidade;
import com.washington.plataforma_estudos.model.ProjetoComunidade.Status;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface ProjetoComunidadeRepository extends JpaRepository<ProjetoComunidade, Long> {
    @EntityGraph(attributePaths = "autor")
    List<ProjetoComunidade> findByStatusOrderByIdDesc(Status status);

    @EntityGraph(attributePaths = "autor")
    List<ProjetoComunidade> findByStatusOrderByIdAsc(Status status);

    @EntityGraph(attributePaths = "autor")
    List<ProjetoComunidade> findByAutorIdOrderByIdDesc(Integer autorId);

    @Modifying
    @Transactional
    @Query("update ProjetoComunidade p set p.status = :decisao where p.id = :id and p.status = :esperado")
    int decidir(Long id, Status esperado, Status decisao);
}
