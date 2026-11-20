package com.washington.plataforma_estudos;

import com.washington.plataforma_estudos.controller.GoogleLoginController;
import com.washington.plataforma_estudos.model.Usuario;
import com.washington.plataforma_estudos.repository.UsuarioRepository;
import com.washington.plataforma_estudos.service.UsuarioService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:google_login_test;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.catalog.initialize=false",
        "jwt.secret=google-test-fixture-only-0123456789-abcdefghijklmnop",
        "app.google.enabled=true",
        "app.google.client-id=local-test-client",
        "app.google.client-secret=local-test-secret",
        "app.google.redirect-uri=http://127.0.0.1:18085/login/oauth2/code/google"
})
class GoogleLoginTests {
    @Autowired GoogleLoginController google;
    @Autowired UsuarioService usuarios;
    @Autowired UsuarioRepository repository;
    @Autowired WebApplicationContext context;

    @Test
    void googleRedirectAndOneTimeExchange() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var provider = mvc.perform(get("/oauth2/authorization/google"))
                .andExpect(status().is3xxRedirection()).andReturn().getResponse();
        assertThat(provider.getRedirectedUrl()).startsWith("https://accounts.google.com/")
                .contains("state=", "nonce=", "response_type=code");
        mvc.perform(get("/login/oauth2/code/google").param("code", "test-without-state"))
                .andExpect(status().is3xxRedirection());

        var callback = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        google.onAuthenticationSuccess(callback, response, identity("google-subject-1", "aluno@example.test", true));
        assertThat(response.getRedirectedUrl()).isEqualTo("/#/google");
        assertThat(repository.findByGoogleSubject("google-subject-1")).hasValueSatisfying(usuario ->
                assertThat(usuario.getPapel().name()).isEqualTo("ALUNO"));

        var session = (MockHttpSession) callback.getSession(false);
        mvc.perform(post("/auth/google/session").session(session).header("Origin", "https://other.example.test")
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
        var exchange = mvc.perform(post("/auth/google/session").session(session).header("Origin", "http://127.0.0.1:18085")
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isOk()).andReturn();
        assertThat(session.isInvalid()).isTrue();
        String token = JsonMapper.builder().build().readTree(exchange.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(get("/usuarios/me").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        mvc.perform(post("/auth/google/session").header("Origin", "http://127.0.0.1:18085")
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());

        var returning = new MockHttpServletResponse();
        google.onAuthenticationSuccess(new MockHttpServletRequest(), returning,
                identity("google-subject-1", "outro-email@example.test", true));
        assertThat(returning.getRedirectedUrl()).isEqualTo("/#/google");
        assertThat(repository.findByEmail("outro-email@example.test")).isEmpty();
    }

    @Test
    void googleDoesNotClaimExistingOrUnverifiedEmail() throws Exception {
        var local = new Usuario();
        local.setNome("Aluno com senha");
        local.setEmail("conta@example.test");
        local.setSenha("somente-teste-123");
        usuarios.cadastrar(local);
        var conflict = new MockHttpServletResponse();
        google.onAuthenticationSuccess(new MockHttpServletRequest(), conflict,
                identity("other-subject", "CONTA@example.test", true));
        assertThat(conflict.getRedirectedUrl()).isEqualTo("/#/google/conta-existente");
        assertThat(repository.findByGoogleSubject("other-subject")).isEmpty();

        var unverified = new MockHttpServletResponse();
        google.onAuthenticationSuccess(new MockHttpServletRequest(), unverified,
                identity("subject-unverified", "unverified@example.test", false));
        assertThat(unverified.getRedirectedUrl()).isEqualTo("/#/google/erro");
        assertThat(repository.findByEmail("unverified@example.test")).isEmpty();
    }

    private static OAuth2AuthenticationToken identity(String subject, String email, boolean verified) {
        Instant now = Instant.now();
        var token = new OidcIdToken("test-token", now, now.plusSeconds(60), Map.of(
                "sub", subject, "email", email, "email_verified", verified, "name", "Estudante de teste"));
        var user = new DefaultOidcUser(List.of(new SimpleGrantedAuthority("OIDC_USER")), token);
        return new OAuth2AuthenticationToken(user, user.getAuthorities(), "google");
    }
}
