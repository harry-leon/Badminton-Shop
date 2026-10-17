package com.badminton.media;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
public class ImageKitService {

    private final ImageKitProperties properties;
    private final RestClient restClient;

    public ImageKitService(ImageKitProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder().build();
    }

    private String getAuthHeader() {
        String token = Base64.getEncoder().encodeToString(
                (properties.getPrivateKey() + ":").getBytes(StandardCharsets.UTF_8)
        );
        return "Basic " + token;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> uploadFile(MultipartFile file, String folder) throws IOException {
        String cleanFolder = (folder == null || folder.isBlank()) ? "/products" : folder;
        if (!cleanFolder.startsWith("/")) {
            cleanFolder = "/" + cleanFolder;
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.png";
            }
        });
        body.add("fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.png");
        body.add("folder", cleanFolder);
        body.add("useUniqueFileName", "true");

        return restClient.post()
                .uri("https://upload.imagekit.io/api/v1/files/upload")
                .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(Map.class);
    }
}
