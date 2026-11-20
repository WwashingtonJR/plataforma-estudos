package com.washington.plataforma_estudos.config;

import com.washington.plataforma_estudos.controller.GoogleLoginController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.NullSecurityContextRepository;

@Configuration
@ConditionalOnProperty(name = "app.google.enabled", havingValue = "true")
public class GoogleLoginConfig {
    @Bean
    @Order(1)
    SecurityFilterChain googleSecurity(HttpSecurity http, GoogleLoginController login,
            @Value("${app.google.client-id}") String clientId,
            @Value("${app.google.client-secret}") String clientSecret,
            @Value("${app.google.redirect-uri}") String redirectUri) throws Exception {
        if (clientId.isBlank() || clientSecret.isBlank()) {
            throw new IllegalStateException("Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.");
        }
        var google = CommonOAuth2Provider.GOOGLE.getBuilder("google")
                .clientId(clientId).clientSecret(clientSecret).redirectUri(redirectUri)
                .scope("openid", "email", "profile").build();
        return http
                .securityMatcher("/oauth2/authorization/google", "/login/oauth2/code/google", "/auth/google/session")
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .securityContext(context -> context.securityContextRepository(new NullSecurityContextRepository()))
                .requestCache(AbstractHttpConfigurer::disable)
                // O POST de troca valida a origem configurada e a sessão de uso único.
                .csrf(AbstractHttpConfigurer::disable)
                .oauth2Login(oauth -> oauth
                        .clientRegistrationRepository(new InMemoryClientRegistrationRepository(google))
                        .authorizedClientRepository(new HttpSessionOAuth2AuthorizedClientRepository())
                        .loginPage("/#/login")
                        .successHandler(login)
                        .failureHandler((request, response, failure) -> login.failed(request, response)))
                .build();
    }
}
