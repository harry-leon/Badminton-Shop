package com.badminton.banner;

import com.badminton.common.exception.GlobalExceptionHandler;
import com.badminton.media.ImageKitService;
import com.badminton.media.api.MediaController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MediaController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class MediaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ImageKitService imageKitService;

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("POST /api/v1/media/upload - Upload file thành công trả về URL")
    void uploadImage_validFile_returnsOk() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "banner.png",
                "image/png",
                "fake image content".getBytes()
        );

        when(imageKitService.uploadFile(any(), eq("/banners"))).thenReturn(Map.of(
                "url", "https://ik.imagekit.io/htqhun/banners/banner.png",
                "fileId", "file_12345",
                "thumbnailUrl", "https://ik.imagekit.io/htqhun/banners/tr:w-300/banner.png"
        ));

        mockMvc.perform(multipart("/api/v1/media/upload")
                        .file(file)
                        .param("folder", "/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("MEDIA_UPLOADED"))
                .andExpect(jsonPath("$.data.url").value("https://ik.imagekit.io/htqhun/banners/banner.png"))
                .andExpect(jsonPath("$.data.fileId").value("file_12345"));

        verify(imageKitService).uploadFile(any(), eq("/banners"));
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("POST /api/v1/media/upload - Upload file rỗng trả về lỗi 400")
    void uploadImage_emptyFile_returns400() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        mockMvc.perform(multipart("/api/v1/media/upload")
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("POST /api/v1/media/upload - Lỗi mạng/ImageKit trả về lỗi 500")
    void uploadImage_ioException_returns500() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "error.png",
                "image/png",
                "content".getBytes()
        );

        when(imageKitService.uploadFile(any(), any()))
                .thenThrow(new IOException("ImageKit upload timeout"));

        mockMvc.perform(multipart("/api/v1/media/upload")
                        .file(file))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"));
    }
}
