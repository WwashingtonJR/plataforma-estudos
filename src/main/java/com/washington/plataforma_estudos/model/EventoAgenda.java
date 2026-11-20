package com.washington.plataforma_estudos.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "eventos_agenda", indexes = @Index(columnList = "usuario_id, data"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EventoAgenda {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Usuario usuario;

    @Column(nullable = false)
    private LocalDate data;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Tipo tipo;

    public EventoAgenda(Usuario usuario, LocalDate data, String titulo, Tipo tipo) {
        this.usuario = usuario;
        this.data = data;
        this.titulo = titulo;
        this.tipo = tipo;
    }

    public enum Tipo { PROVA, TRABALHO, OUTRO }
}
