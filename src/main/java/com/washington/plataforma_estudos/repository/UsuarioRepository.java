package com.washington.plataforma_estudos.repository;


import com.washington.plataforma_estudos.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {


    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);
}
