package com.washington.plataforma_estudos.service;


import com.washington.plataforma_estudos.model.Trilha;
import com.washington.plataforma_estudos.repository.TrilhaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TrilhaService {

    private final TrilhaRepository trilhaRepository;

    public TrilhaService(TrilhaRepository trilhaRepository) {
        this.trilhaRepository = trilhaRepository;
    }

    public List<Trilha> listarTodas() {
        return trilhaRepository.findAll();
    }

    public Trilha buscarPorId(Integer id){
        return trilhaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trilha não encontrada."));
    }

    public Trilha criar(Trilha trilha){
        return trilhaRepository.save(trilha);
    }


}
