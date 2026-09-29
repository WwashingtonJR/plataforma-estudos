package com.washington.plataforma_estudos.repository;

import com.washington.plataforma_estudos.model.Modulo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ModuloRepository extends JpaRepository<Modulo, Integer> {

    List<Modulo> findByTrilhaIdOrderByOrdem(Integer trilhaId);

}
