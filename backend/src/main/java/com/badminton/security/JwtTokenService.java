package com.badminton.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class JwtTokenService {

    private final byte[] secretBytes;
    private final long expirationSeconds;
    private final String issuer;

    public JwtTokenService(
            @Value("${jwt.secret:}") String secret,
            @Value("${jwt.expiration-seconds:86400}") long expirationSeconds,
            @Value("${jwt.issuer:smash-court}") String issuer
    ) {
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationSeconds = expirationSeconds;
        this.issuer = issuer;
    }

    public String generateToken(UUID userId, String username, String role, String branchId, List<String> permissions) {
        if (secretBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be configured via environment variable JWT_SECRET and be at least 256 bits (32 bytes)");
        }
        try {
            Instant now = Instant.now();
            Instant expiry = now.plusSeconds(expirationSeconds);

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .issuer(issuer)
                    .subject(userId.toString())
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(expiry))
                    .claim("username", username)
                    .claim("role", role)
                    .claim("branch_id", branchId != null ? branchId : "ALL")
                    .claim("authorities", permissions)
                    .build();

            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claimsSet);
            JWSSigner signer = new MACSigner(secretBytes);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (Exception e) {
            log.error("Failed to generate JWT token", e);
            throw new RuntimeException("Could not create JWT token", e);
        }
    }
}
