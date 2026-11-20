package com.washington.plataforma_estudos.model;

import com.fasterxml.jackson.annotation.JsonProperty; // NOVO
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Papel papel;

    private String instituicao;

    @Column(nullable = false)
    @ColumnDefault("false")
    @JsonIgnore
    private boolean podeModerarProjetos;

    @Column(length = 65536)
    @JsonIgnore
    private String foto;

    @Column(unique = true, length = 255)
    @JsonIgnore
    private String googleSubject;
}
