package com.washington.plataforma_estudos.service;


import com.washington.plataforma_estudos.model.Modulo;
import com.washington.plataforma_estudos.repository.ModuloRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModuloService {


    private final ModuloRepository moduloRepository;

    public ModuloService(ModuloRepository moduloRepository){
        this.moduloRepository = moduloRepository;
    }

    public List<Modulo> listarPorTrilha(Integer trilhaId){
        return moduloRepository.findByTrilhaIdOrderByOrdem(trilhaId);
    }

    public Modulo buscarPorId(Integer id){
        return moduloRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Modulo não encontrado."));
    }

    public Modulo criar(Modulo modulo){
        return moduloRepository.save(modulo);
    }
}
