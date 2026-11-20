package com.washington.plataforma_estudos.controller;

import com.washington.plataforma_estudos.service.JwtService;
import com.washington.plataforma_estudos.service.UsuarioService;
import com.washington.plataforma_estudos.service.UsuarioService.ContaGoogleJaCadastrada;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

@RestController
@ConditionalOnProperty(name = "app.google.enabled", havingValue = "true")
public class GoogleLoginController implements AuthenticationSuccessHandler {
    private static final String PENDING_LOGIN = GoogleLoginController.class.getName() + ".pending";
    private final UsuarioService usuarios;
    private final JwtService tokens;
    private final String origin;

    public GoogleLoginController(UsuarioService usuarios, JwtService tokens,
            @Value("${app.google.redirect-uri}") String redirectUri) {
        this.usuarios = usuarios;
        this.tokens = tokens;
        this.origin = callbackOrigin(redirectUri);
    }

    private static String callbackOrigin(String redirectUri) {
        URI callback = URI.create(redirectUri);
        String scheme = callback.getScheme();
        String host = callback.getHost();
        boolean loopback = host != null && Set.of("localhost", "127.0.0.1", "[::1]").contains(host);
        if (host == null || !("https".equals(scheme) || ("http".equals(scheme) && loopback))
                || !"/login/oauth2/code/google".equals(callback.getPath()) || callback.getUserInfo() != null
                || callback.getRawQuery() != null || callback.getRawFragment() != null) {
            throw new IllegalStateException("GOOGLE_REDIRECT_URI deve ser o endereço completo do callback do Google.");
        }
        int port = callback.getPort();
        boolean defaultPort = port == -1 || ("https".equals(scheme) && port == 443) || ("http".equals(scheme) && port == 80);
        return scheme + "://" + host.toLowerCase(java.util.Locale.ROOT) + (defaultPort ? "" : ":" + port);
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        if (!(authentication instanceof OAuth2AuthenticationToken token)
                || !"google".equals(token.getAuthorizedClientRegistrationId())
                || !(token.getPrincipal() instanceof OidcUser google)
                || !Boolean.TRUE.equals(google.getEmailVerified())
                || google.getEmail() == null || google.getEmail().isBlank() || google.getEmail().length() > 254
                || google.getSubject() == null || google.getSubject().isBlank() || google.getSubject().length() > 255) {
            failed(request, response);
            return;
        }

        invalidate(request);
        try {
            var usuario = usuarios.entrarComGoogle(google.getSubject(), google.getEmail(), google.getFullName());
            HttpSession session = request.getSession(true);
            session.setMaxInactiveInterval(120);
            session.setAttribute(PENDING_LOGIN, new PendingLogin(usuario.getEmail(), usuario.getPapel().name()));
            response.sendRedirect("/#/google");
        } catch (ContaGoogleJaCadastrada conflict) {
            response.sendRedirect("/#/google/conta-existente");
        }
    }

    public void failed(HttpServletRequest request, HttpServletResponse response) throws IOException {
        invalidate(request);
        response.sendRedirect("/#/google/erro");
    }

    @PostMapping(path = "/auth/google/session", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> exchange(HttpServletRequest request) {
        if (!origin.equals(request.getHeader("Origin"))) {
            return ResponseEntity.status(403).build();
        }
        HttpSession session = request.getSession(false);
        if (session == null) {
            return ResponseEntity.status(401).build();
        }

        PendingLogin login;
        synchronized (WebUtils.getSessionMutex(session)) {
            try {
                login = (PendingLogin) session.getAttribute(PENDING_LOGIN);
                if (login == null) {
                    return ResponseEntity.status(401).build();
                }
                session.invalidate();
            } catch (IllegalStateException expired) {
                return ResponseEntity.status(401).build();
            }
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(Map.of(
                "token", tokens.gerarToken(login.email()), "papel", login.papel()));
    }

    private static void invalidate(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    private record PendingLogin(String email, String papel) {
    }
}
