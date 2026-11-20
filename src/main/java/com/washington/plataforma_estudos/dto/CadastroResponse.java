package com.washington.plataforma_estudos.dto;

import com.washington.plataforma_estudos.model.Papel;

public record CadastroResponse(Integer id, String nome, String email, Papel papel, String instituicao, String token) {
}
