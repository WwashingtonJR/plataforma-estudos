package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.dto.CreditoDTO;
import com.washington.plataforma_estudos.repository.VideoRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/creditos")
public class CreditoController {

    private final VideoRepository videoRepository;

    public CreditoController(VideoRepository videoRepository) {
        this.videoRepository = videoRepository;
    }

    @GetMapping
    public List<CreditoDTO> listar() {
        return videoRepository.contarPorAutor();
    }
}