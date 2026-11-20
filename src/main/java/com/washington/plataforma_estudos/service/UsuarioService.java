package com.washington.plataforma_estudos.service;


import com.washington.plataforma_estudos.model.Papel;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
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
        if (usuario.getId() != null) {
            throw new IllegalArgumentException("Cadastro inválido.");
        }
        if (usuario.getSenha() == null || usuario.getSenha().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Senha inválida.");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(usuario.getEmail())) {
            throw new EmailJaCadastrado();
        }

        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        usuario.setPapel(Papel.ALUNO);

        try {
            return usuarioRepository.save(usuario);
        } catch (DataIntegrityViolationException conflito) {
            if (usuarioRepository.existsByEmailIgnoreCase(usuario.getEmail())) {
                throw new EmailJaCadastrado();
            }
            throw conflito;
        }
    }

    public static class EmailJaCadastrado extends RuntimeException {
    }

    public Usuario entrarComGoogle(String subject, String email, String nome) {
        var existente = usuarioRepository.findByGoogleSubject(subject);
        if (existente.isPresent()) {
            return existente.get();
        }

        String endereco = email.trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByEmailIgnoreCase(endereco)) {
            throw new ContaGoogleJaCadastrada();
        }
        Usuario usuario = new Usuario();
        usuario.setGoogleSubject(subject);
        usuario.setEmail(endereco);
        usuario.setNome(nome == null || nome.isBlank() ? "Estudante" : nome.strip());
        usuario.setSenha(passwordEncoder.encode(UUID.randomUUID().toString()));
        usuario.setPapel(Papel.ALUNO);
        try {
            return usuarioRepository.saveAndFlush(usuario);
        } catch (DataIntegrityViolationException conflito) {
            return usuarioRepository.findByGoogleSubject(subject).orElseThrow(() -> {
                if (usuarioRepository.existsByEmailIgnoreCase(endereco)) {
                    return new ContaGoogleJaCadastrada();
                }
                return conflito;
            });
        }
    }

    public static class ContaGoogleJaCadastrada extends RuntimeException {
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
