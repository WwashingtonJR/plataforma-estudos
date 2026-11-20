package com.washington.plataforma_estudos.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "projetos_comunidade")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjetoComunidade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Usuario autor;

    @Column(nullable = false, length = 100)
    private String titulo;

    @Column(nullable = false, length = 400)
    private String descricao;

    @Column(nullable = false, length = 500)
    private String githubUrl;

    @Column(length = 500)
    private String demoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @ColumnDefault("'PENDENTE'")
    private Status status = Status.PENDENTE;

    public ProjetoComunidade(Usuario autor, String titulo, String descricao, String githubUrl, String demoUrl) {
        this.autor = autor;
        this.titulo = titulo;
        this.descricao = descricao;
        this.githubUrl = githubUrl;
        this.demoUrl = demoUrl;
    }

    public enum Status { PENDENTE, APROVADO, RECUSADO }
}
