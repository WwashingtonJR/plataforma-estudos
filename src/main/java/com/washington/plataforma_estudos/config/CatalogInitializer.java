package com.washington.plataforma_estudos.config;

import com.washington.plataforma_estudos.model.*;
import com.washington.plataforma_estudos.repository.*;
import java.io.InputStream;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Component
@ConditionalOnProperty(name = "app.catalog.initialize", havingValue = "true")
public class CatalogInitializer implements CommandLineRunner {
    private final TrilhaRepository trilhas;
    private final ModuloRepository modulos;
    private final VideoRepository videos;

    public CatalogInitializer(TrilhaRepository trilhas, ModuloRepository modulos, VideoRepository videos) {
        this.trilhas = trilhas;
        this.modulos = modulos;
        this.videos = videos;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Não altera catálogos nem contas existentes. Toda a carga é uma transação.
        if (trilhas.count() != 0 || modulos.count() != 0 || videos.count() != 0) return;
        Catalog catalog;
        try (InputStream input = new ClassPathResource("catalog/catalogo-jornadas.json").getInputStream()) {
            catalog = JsonMapper.builder().build().readValue(input, Catalog.class);
        }
        for (Track track : catalog.tracks()) {
            Trilha trilha = new Trilha();
            trilha.setNome(track.name());
            trilha.setDescricao("Jornada de " + track.name() + ". Referência: Jornada Dev Herói, de DevArthur.");
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

    public record Catalog(String source, String collectedAt, List<Track> tracks) {}
    public record Track(String id, String name, int order, List<Course> courses) {}
    public record Course(String id, int order, String topic, String title, String author, String url) {}
}
