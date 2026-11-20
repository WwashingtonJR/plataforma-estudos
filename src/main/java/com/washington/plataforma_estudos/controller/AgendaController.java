package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.model.EventoAgenda;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.repository.EventoAgendaRepository;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/agenda")
public class AgendaController {
    private final EventoAgendaRepository eventos;
    private final UsuarioRepository usuarios;

    public AgendaController(EventoAgendaRepository eventos, UsuarioRepository usuarios) {
        this.eventos = eventos;
        this.usuarios = usuarios;
    }

    @GetMapping
    public List<Evento> listar(Authentication authentication) {
        return eventos.findByUsuarioIdOrderByDataAscIdAsc(usuarioLogado(authentication).getId())
                .stream().map(Evento::de).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Evento adicionar(@RequestBody NovoEvento dados, Authentication authentication) {
        if (dados.data() == null || dados.data().getYear() < 1 || dados.data().getYear() > 9999
                || dados.titulo() == null || dados.titulo().isBlank() || dados.titulo().length() > 120
                || dados.tipo() == null) {
            throw new IllegalArgumentException("Data, título ou tipo de evento inválido.");
        }

        return Evento.de(eventos.save(new EventoAgenda(
                usuarioLogado(authentication), dados.data(), dados.titulo().strip(), dados.tipo())));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id, Authentication authentication) {
        if (eventos.excluirDoUsuario(id, usuarioLogado(authentication).getId()) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    private Usuario usuarioLogado(Authentication authentication) {
        return usuarios.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    public record NovoEvento(LocalDate data, String titulo, EventoAgenda.Tipo tipo) {}

    public record Evento(Long id, LocalDate data, String titulo, EventoAgenda.Tipo tipo) {
        private static Evento de(EventoAgenda evento) {
            return new Evento(evento.getId(), evento.getData(), evento.getTitulo(), evento.getTipo());
        }
    }
}
