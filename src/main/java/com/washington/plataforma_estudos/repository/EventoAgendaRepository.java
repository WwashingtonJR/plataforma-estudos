package com.washington.plataforma_estudos.repository;

import com.washington.plataforma_estudos.model.EventoAgenda;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface EventoAgendaRepository extends JpaRepository<EventoAgenda, Long> {
    List<EventoAgenda> findByUsuarioIdOrderByDataAscIdAsc(Integer usuarioId);

    @Transactional
    @Modifying
    @Query("delete from EventoAgenda e where e.id = :eventoId and e.usuario.id = :usuarioId")
    int excluirDoUsuario(Long eventoId, Integer usuarioId);
}
