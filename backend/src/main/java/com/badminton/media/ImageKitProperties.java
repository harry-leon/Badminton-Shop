package com.badminton.media;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "imagekit")
public class ImageKitProperties {
    private String publicKey;
    private String privateKey;
    private String urlEndpoint;
}
