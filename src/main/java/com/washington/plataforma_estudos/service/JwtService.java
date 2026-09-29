package com.washington.plataforma_estudos.service;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private static final long EXPIRACAO_MS = 1000 * 60 * 60 * 10;

    private SecretKey getChave(){
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String gerarToken(String email){
        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + EXPIRACAO_MS);

        return Jwts.builder()
                .subject(email)
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(getChave())
                .compact();

    }

    public String extrairEmail(String token){
        return extrairClaim(token, Claims::getSubject);
    }

    public boolean tokenValido(String token, String email){
        String emailDoToken = extrairEmail(token);
        return emailDoToken.equals(email) && !tokenExpirado(token);
    }

    private boolean tokenExpirado(String token) {
        return extrairClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extrairClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
                .verifyWith(getChave())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }






}
