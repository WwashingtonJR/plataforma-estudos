package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.model.Video;
import com.washington.plataforma_estudos.service.VideoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/videos")
public class VideoController {

    private final VideoService videoService;

    public VideoController(VideoService videoService) {
        this.videoService = videoService;
    }

    @GetMapping("/modulo/{moduloId}")
    public List<Video> listarPorModulo(@PathVariable Integer moduloId) {
        return videoService.listarPorModulo(moduloId);
    }

    @GetMapping("/trilha/{trilhaId}/introducao")
    public List<Video> listarIntroducaoDaTrilha(@PathVariable Integer trilhaId) {
        return videoService.listarIntroducaoDaTrilha(trilhaId);
    }

    @GetMapping("/{id}")
    public Video buscarPorId(@PathVariable Integer id) {
        return videoService.buscarPorId(id);
    }

    @PostMapping
    public Video criar(@RequestBody Video video) {
        return videoService.criar(video);
    }
}