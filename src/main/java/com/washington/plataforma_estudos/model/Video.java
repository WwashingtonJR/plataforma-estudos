package com.washington.plataforma_estudos.model;

import com.fasterxml.jackson.annotation.JsonProperty; // NOVO
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "videos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, length = 500)
    private String urlYoutube;

    @Column(nullable = false)
    private Integer ordem;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoVideo tipo;

    @Column(length = 150)
    private String autor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modulo_id")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Modulo modulo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trilha_id")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Trilha trilha;
}