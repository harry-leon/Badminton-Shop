package com.badminton.media.api;

import com.badminton.common.exception.BusinessException;
import com.badminton.common.exception.ErrorCode;
import com.badminton.common.response.ApiResponse;
import com.badminton.media.ImageKitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Tag(name = "Media Storage", description = "Upload và lưu trữ hình ảnh qua ImageKit")
public class MediaController {

    private final ImageKitService imageKitService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('STAFF') or hasAuthority('banners:manage')")
    @Operation(summary = "Upload hình ảnh lên ImageKit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "/banners") String folder
    ) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "File tải lên không được rỗng");
        }
        try {
            Map<String, Object> result = imageKitService.uploadFile(file, folder);
            return ResponseEntity.ok(ApiResponse.success("MEDIA_UPLOADED", "Upload ảnh thành công", result));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Lỗi khi upload ảnh: " + e.getMessage());
        }
    }
}
