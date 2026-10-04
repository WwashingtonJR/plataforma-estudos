package com.washington.plataforma_estudos.service;

import com.washington.plataforma_estudos.model.TipoVideo;
import com.washington.plataforma_estudos.model.Video;
import com.washington.plataforma_estudos.repository.VideoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VideoService {

    private final VideoRepository videoRepository;

    public VideoService(VideoRepository videoRepository){
        this.videoRepository = videoRepository;
    }
    public List<Video> listarPorModulo(Integer moduloId) {
        return videoRepository.findByModuloIdOrderByOrdem(moduloId);
    }
    public List<Video> listarIntroducaoDaTrilha(Integer trilhaId) {
        return videoRepository.findByTrilhaIdAndTipo(trilhaId, TipoVideo.INTRODUTORIO);
    }
    public Video buscarPorId(Integer id){
        return videoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vídeo não encontrado."));
    }
    public Video criar(Video video){
        return videoRepository.save(video);
    }


}
