package com.washington.plataforma_estudos.controller;


import com.washington.plataforma_estudos.model.Trilha;
import com.washington.plataforma_estudos.service.TrilhaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trilhas")
public class TrilhaController {

    private final TrilhaService trilhaService;

    public TrilhaController(TrilhaService trilhaService){
        this.trilhaService = trilhaService;
    }

    @GetMapping
    public List<Trilha> listarTodas(){
        return trilhaService.listarTodas();
    }

    @GetMapping("/{id}")
    public Trilha buscarPorId(@PathVariable Integer id){
        return trilhaService.buscarPorId(id);
    }

    @PostMapping
    public Trilha criar(@RequestBody Trilha trilha){
        return trilhaService.criar(trilha);

    }

    @GetMapping("/admin/teste")
    public String testeAdmin() {
        return "Acesso de admin liberado!";
    }
}
