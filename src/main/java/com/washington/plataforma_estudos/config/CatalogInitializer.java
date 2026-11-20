package com.washington.plataforma_estudos.config;

import com.washington.plataforma_estudos.model.*;
import com.washington.plataforma_estudos.repository.*;
import java.io.InputStream;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Component
public class CatalogInitializer implements CommandLineRunner {
    private final TrilhaRepository trilhas;
    private final ModuloRepository modulos;
    private final VideoRepository videos;
    private final boolean initialize;

    public CatalogInitializer(TrilhaRepository trilhas, ModuloRepository modulos, VideoRepository videos,
            @Value("${app.catalog.initialize:false}") boolean initialize) {
        this.trilhas = trilhas;
        this.modulos = modulos;
        this.videos = videos;
        this.initialize = initialize;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        var existentes = trilhas.findAll();
        if (existentes.isEmpty() && (!initialize || modulos.count() != 0 || videos.count() != 0)) return;
        if (!existentes.isEmpty() && existentes.stream().noneMatch(CatalogInitializer::descricaoAntiga)) return;
        Catalog catalog;
        try (InputStream input = new ClassPathResource("catalog/catalogo-jornadas.json").getInputStream()) {
            catalog = JsonMapper.builder().build().readValue(input, Catalog.class);
        }
        if (!existentes.isEmpty()) {
            var porNome = catalog.tracks().stream().collect(Collectors.toMap(Track::name, Function.identity()));
            for (Trilha trilha : existentes) {
                Track track = porNome.get(trilha.getNome());
                if (track != null && descricaoAntiga(trilha)) {
                    trilha.setDescricao(track.description());
                }
            }
            return;
        }
        for (Track track : catalog.tracks()) {
            Trilha trilha = new Trilha();
            trilha.setNome(track.name());
            trilha.setDescricao(track.description());
            trilha = trilhas.save(trilha);
            for (Course course : track.courses()) {
                Modulo modulo = new Modulo();
                modulo.setNome(course.topic());
                modulo.setOrdem(course.order());
                modulo.setTrilha(trilha);
                modulo = modulos.save(modulo);
                Video video = new Video();
                video.setTitulo(course.title());
                video.setAutor(course.author());
                video.setUrlYoutube(course.url());
                video.setOrdem(1);
                video.setTipo(TipoVideo.MODULO);
                video.setModulo(modulo);
                video.setTrilha(trilha);
                videos.save(video);
            }
        }
    }

    private static boolean descricaoAntiga(Trilha trilha) {
        return ("Jornada de " + trilha.getNome() + ". Referência: Jornada Dev Herói, de DevArthur.")
                .equals(trilha.getDescricao());
    }

    public record Catalog(String source, String collectedAt, List<Track> tracks) {}
    public record Track(String id, String name, String description, int order, List<Course> courses) {}
    public record Course(String id, int order, String topic, String title, String author, String url) {}
}
