package com.washington.plataforma_estudos.service;


import com.washington.plataforma_estudos.model.Papel;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder){

        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }
// nao tem IA em é tudo na mao kkkk

    public Usuario cadastrar(Usuario usuario){
        if (usuarioRepository.existsByEmail(usuario.getEmail())){
            throw new IllegalArgumentException("Já existe um usuário cadastrado com este email.");
        }

        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        usuario.setPapel(Papel.ALUNO);

        return usuarioRepository.save(usuario);
    }

    public Usuario autenticar(String email, String senha){
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email ou senha inválidos."));


        if (!passwordEncoder.matches(senha,usuario.getSenha())){
            throw new IllegalArgumentException("Email ou senha inválidos.");
        }

        return usuario;




    }



}
