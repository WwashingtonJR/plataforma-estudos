package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.model.Papel;
import com.washington.plataforma_estudos.model.ProjetoComunidade;
import com.washington.plataforma_estudos.model.ProjetoComunidade.Status;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.repository.ProjetoComunidadeRepository;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/projetos")
public class ProjetosController {
    private static final Projeto ACADEMY = new Projeto(null, "Fatecanos Academy",
            "Plataforma de estudos com trilhas de tecnologia, aulas organizadas e progresso salvo para cada aluno.",
            "https://github.com/WwashingtonJR/plataforma-estudos", "/", "Washington Junior", true, Status.APROVADO);
    private static final Pattern REPOSITORIO = Pattern.compile("/[A-Za-z0-9][A-Za-z0-9-]*/[A-Za-z0-9._-]+/?");

    private final ProjetoComunidadeRepository projetos;
    private final UsuarioRepository usuarios;

    public ProjetosController(ProjetoComunidadeRepository projetos, UsuarioRepository usuarios) {
        this.projetos = projetos;
        this.usuarios = usuarios;
    }

    @GetMapping
    public List<Projeto> galeria() {
        var galeria = new ArrayList<Projeto>();
        galeria.add(ACADEMY);
        projetos.findByStatusOrderByIdDesc(Status.APROVADO).forEach(projeto -> galeria.add(Projeto.de(projeto)));
        return galeria;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Projeto enviar(@RequestBody @Valid NovoProjeto dados, Authentication authentication) {
        String github = repositorioGithub(dados.githubUrl());
        String demo = dados.demoUrl() == null || dados.demoUrl().isBlank() ? null : linkHttps(dados.demoUrl()).toASCIIString();
        var autor = usuarioLogado(authentication);
        var projeto = projetos.save(new ProjetoComunidade(autor, dados.titulo().strip(),
                dados.descricao().strip(), github, demo));
        return Projeto.de(projeto);
    }

    @GetMapping("/meus")
    public MeusProjetos meusProjetos(Authentication authentication) {
        var autor = usuarioLogado(authentication);
        var envios = projetos.findByAutorIdOrderByIdDesc(autor.getId()).stream().map(Projeto::de).toList();
        return new MeusProjetos(podeRevisar(autor), envios);
    }

    @GetMapping("/revisao")
    public List<Projeto> filaDeRevisao(Authentication authentication) {
        exigirModerador(authentication);
        return projetos.findByStatusOrderByIdAsc(Status.PENDENTE).stream().map(Projeto::de).toList();
    }

    @PutMapping("/revisao/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revisar(@PathVariable Long id, @RequestBody @Valid Decisao dados, Authentication authentication) {
        exigirModerador(authentication);
        if (dados.status() == Status.PENDENTE) throw new IllegalArgumentException("Decisão inválida.");
        if (projetos.decidir(id, Status.PENDENTE, dados.status()) == 0) {
            var projeto = projetos.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            if (projeto.getStatus() != dados.status()) throw new ResponseStatusException(HttpStatus.CONFLICT);
        }
    }

    private Usuario usuarioLogado(Authentication authentication) {
        return usuarios.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private void exigirModerador(Authentication authentication) {
        if (!podeRevisar(usuarioLogado(authentication))) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    private static boolean podeRevisar(Usuario usuario) {
        return usuario.getPapel() == Papel.ADMIN || usuario.isPodeModerarProjetos();
    }

    private static String repositorioGithub(String link) {
        var uri = linkHttps(link);
        var host = uri.getHost();
        var caminho = uri.getRawPath();
        if ((!host.equalsIgnoreCase("github.com") && !host.equalsIgnoreCase("www.github.com"))
                || uri.getPort() != -1 || !REPOSITORIO.matcher(caminho).matches()) {
            throw new IllegalArgumentException("Informe o link de um repositório do GitHub.");
        }
        if (caminho.endsWith("/")) caminho = caminho.substring(0, caminho.length() - 1);
        var nome = caminho.substring(caminho.lastIndexOf('/') + 1);
        if (nome.equals(".") || nome.equals("..")) {
            throw new IllegalArgumentException("Informe o link de um repositório do GitHub.");
        }
        return "https://github.com" + caminho;
    }

    private static URI linkHttps(String link) {
        var uri = URI.create(link.strip());
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null
                || uri.getPort() > 65535 || uri.toASCIIString().length() > 500) {
            throw new IllegalArgumentException("Informe um link HTTPS válido.");
        }
        return uri;
    }

    public record NovoProjeto(@NotBlank @Size(max = 100) String titulo,
            @NotBlank @Size(max = 400) String descricao,
            @NotBlank @Size(max = 500) String githubUrl, @Size(max = 500) String demoUrl) {}

    public record Decisao(@NotNull Status status) {}

    public record MeusProjetos(boolean podeRevisar, List<Projeto> envios) {}

    public record Projeto(Long id, String titulo, String descricao, String githubUrl, String demoUrl,
            String autor, boolean destaque, Status status) {
        private static Projeto de(ProjetoComunidade projeto) {
            return new Projeto(projeto.getId(), projeto.getTitulo(), projeto.getDescricao(),
                    projeto.getGithubUrl(), projeto.getDemoUrl(), projeto.getAutor().getNome(), false, projeto.getStatus());
        }
    }
}
