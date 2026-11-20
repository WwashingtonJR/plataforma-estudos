package com.washington.plataforma_estudos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowedOrigins(List.of("http://127.0.0.1:5500", "http://localhost:5500"));
        c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(401);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"erro\":\"Autenticação necessária.\"}");
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(403);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"erro\":\"Acesso não autorizado.\"}");
                        }))
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.GET, "/", "/index.html", "/styles.css", "/computador.svg",
                                "/assets/cariby-ideathon.jpg", "/assets/washington-junior.jpg",
                                "/app.js", "/api.js", "/media.js", "/course-sources.js", "/playlist-lessons.json", "/editorial.js", "/health",
                                "/auth/metodos").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/", "/index.html", "/styles.css", "/computador.svg",
                                "/assets/cariby-ideathon.jpg", "/assets/washington-junior.jpg",
                                "/app.js", "/api.js", "/media.js", "/course-sources.js", "/playlist-lessons.json", "/editorial.js", "/health").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/login", "/auth/cadastro").permitAll()
                        .requestMatchers("/admin/**", "/trilhas/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/trilhas", "/trilhas/**", "/modulos", "/modulos/**", "/videos", "/videos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/trilhas/**", "/modulos/**", "/videos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/trilhas/**", "/modulos/**", "/videos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/trilhas/**", "/modulos/**", "/videos/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
