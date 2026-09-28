package com.washington.plataforma_estudos.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "videos")
@NoArgsConstructor
@AllArgsConstructor
@Data


public class Video {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, length = 500)
    private String UrlYoutube;

    @Column(nullable = false)
    private Integer ordem;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoVideo tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modulo_id")
    private Modulo modulo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trilha_id")
    private Trilha trilha;


}
