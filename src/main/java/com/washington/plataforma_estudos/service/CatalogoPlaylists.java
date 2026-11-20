package com.washington.plataforma_estudos.service;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Component
public class CatalogoPlaylists {
    private static final Set<String> HOSTS = Set.of(
            "youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com");
    private final Map<String, Playlist> playlists;

    public CatalogoPlaylists() throws IOException {
        try (var input = new ClassPathResource("static/playlist-lessons.json").getInputStream()) {
            playlists = JsonMapper.builder().build().readValue(input, new TypeReference<>() {});
        }
    }

    public Playlist buscar(String url) {
        var uri = URI.create(url);
        var host = uri.getHost();
        if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null
                || !HOSTS.contains(host.toLowerCase(Locale.ROOT)) || uri.getUserInfo() != null || uri.getPort() != -1) {
            throw new IllegalArgumentException("Playlist indisponível.");
        }

        String id = UriComponentsBuilder.fromUri(uri).build().getQueryParams().getFirst("list");
        var playlist = playlists.get(id);
        if (playlist == null) throw new IllegalArgumentException("Playlist indisponível.");
        return playlist;
    }

    public record Playlist(List<Aula> lessons, boolean complete) {
        public List<String> ids() {
            return lessons.stream().map(Aula::id).toList();
        }
    }

    public record Aula(String id, String title) {}
}
