package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.model.Modulo;
import com.washington.plataforma_estudos.service.ModuloService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/modulos")

public class ModuloController {

    private final ModuloService moduloService;

    public ModuloController(ModuloService moduloService){
        this.moduloService = moduloService;
    }

    @GetMapping("/trilha/{trilhaId}")
    public List<Modulo> listarPorTrilha(@PathVariable Integer trilhaId){
        return moduloService.listarPorTrilha(trilhaId);
    }

    @GetMapping("/{id}")
    public Modulo buscarPorId(@PathVariable Integer id){
        return moduloService.buscarPorId(id);
    }
    @PostMapping
    public Modulo criar(@RequestBody Modulo modulo){
        return moduloService.criar(modulo);
    }


}
