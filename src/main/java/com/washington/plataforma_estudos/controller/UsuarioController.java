package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.dto.PerfilDTO;
import com.washington.plataforma_estudos.dto.PerfilUpdate;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    private Usuario usuarioLogado(Authentication authentication) {
        return usuarioRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    private PerfilDTO paraDTO(Usuario u) {
        return new PerfilDTO(u.getNome(), u.getEmail(), u.getInstituicao(), u.getPapel().name(), u.getFoto());
    }

    @GetMapping("/me")
    public PerfilDTO meuPerfil(Authentication authentication) {
        return paraDTO(usuarioLogado(authentication));
    }

    @PutMapping("/me")
    public PerfilDTO atualizar(@RequestBody PerfilUpdate dados, Authentication authentication) {
        if (dados.nome() == null || dados.nome().isBlank() || dados.nome().length() > 120) {
            throw new IllegalArgumentException("Nome inválido.");
        }

        Usuario usuario = usuarioLogado(authentication);
        if (dados.instituicao() != null && dados.instituicao().length() > 255) {
            throw new IllegalArgumentException("Instituição inválida.");
        }
        usuario.setNome(dados.nome().trim());
        usuario.setInstituicao(dados.instituicao() == null ? null : dados.instituicao().trim());
        if (dados.foto() != null) {
            usuario.setFoto(dados.foto().isEmpty() ? null : validarFoto(dados.foto()));
        }

        return paraDTO(usuarioRepository.save(usuario));
    }

    private static String validarFoto(String foto) {
        if (foto.length() > 65536) throw new IllegalArgumentException("Foto muito grande.");
        byte[] jpeg = Base64.getDecoder().decode(foto);
        var reader = ImageIO.getImageReadersByFormatName("JPEG").next();
        try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(jpeg))) {
            reader.setInput(input, true, true);
            if (reader.getWidth(0) != 256 || reader.getHeight(0) != 256) {
                throw new IllegalArgumentException("Dimensões inválidas para a foto.");
            }
            reader.read(0);
            return Base64.getEncoder().encodeToString(jpeg);
        } catch (IOException error) {
            throw new IllegalArgumentException("Foto inválida.", error);
        } finally {
            reader.dispose();
        }
    }
}
