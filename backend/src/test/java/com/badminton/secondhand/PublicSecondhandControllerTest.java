package com.badminton.secondhand;

import com.badminton.common.exception.GlobalExceptionHandler;
import com.badminton.secondhand.api.PublicSecondhandController;
import com.badminton.secondhand.application.SecondhandService;
import com.badminton.secondhand.domain.SecondhandUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicSecondhandController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PublicSecondhandControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SecondhandService secondhandService;

    @Test
    @DisplayName("GET /api/v1/public/secondhand/units - Trả về 200 và danh sách vợt cũ đã ẩn số serial")
    void getPublicUnits_returnsOkWithMaskedSerial() throws Exception {
        SecondhandUnit unit1 = SecondhandUnit.builder()
                .id("SH-001")
                .buybackCaseId("BB-001")
                .serialNumber("SN-88DP-2025-010")
                .modelName("Yonex Astrox 88D Pro")
                .grade("A")
                .branchId("BR_HCM_01")
                .resalePrice(3100000L)
                .warrantyDays(60)
                .conditionNotes("Ngoại hình 98%")
                .status("APPROVED_FOR_SALE")
                .createdAt(Instant.now())
                .build();

        SecondhandUnit unit2 = SecondhandUnit.builder()
                .id("SH-002")
                .buybackCaseId("BB-002")
                .serialNumber("SN-NF800P-2025-088")
                .modelName("Yonex Nanoflare 800 Pro")
                .grade("B")
                .branchId("BR_HN_01")
                .resalePrice(2650000L)
                .warrantyDays(30)
                .status("APPROVED_FOR_SALE")
                .createdAt(Instant.now())
                .build();

        when(secondhandService.getApprovedUnits(eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(unit1, unit2)));

        mockMvc.perform(get("/api/v1/public/secondhand/units"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("SECONDHAND_UNITS_RETRIEVED"))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].id").value("SH-001"))
                .andExpect(jsonPath("$.data.content[0].modelName").value("Yonex Astrox 88D Pro"))
                .andExpect(jsonPath("$.data.content[0].serialNumber").value("SN-88DP-***-010"))
                .andExpect(jsonPath("$.data.content[1].id").value("SH-002"))
                .andExpect(jsonPath("$.data.content[1].serialNumber").value("SN-NF800P-***-088"));

        verify(secondhandService).getApprovedUnits(eq(null), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/v1/public/secondhand/units - Ẩn serial cho mã 8 ký tự Yonex cone, 7 ký tự shaft, 2 đoạn và mã đã ẩn")
    void getPublicUnits_masksDiverseSerialFormats() throws Exception {
        SecondhandUnit unitCone = SecondhandUnit.builder()
                .id("SH-CONE")
                .serialNumber("120484JP") // 8 ký tự Yonex cone serial
                .modelName("Yonex Astrox 100ZZ")
                .status("APPROVED_FOR_SALE")
                .build();

        SecondhandUnit unitShaft = SecondhandUnit.builder()
                .id("SH-SHAFT")
                .serialNumber("9823412") // 7 ký tự shaft serial
                .modelName("Yonex Nanoflare 700")
                .status("APPROVED_FOR_SALE")
                .build();

        SecondhandUnit unitPremasked = SecondhandUnit.builder()
                .id("SH-MASKED")
                .serialNumber("SN-***-099")
                .modelName("Victor Ryuga")
                .status("APPROVED_FOR_SALE")
                .build();

        SecondhandUnit unitTwoPart = SecondhandUnit.builder()
                .id("SH-TWO")
                .serialNumber("YONEX-88DPRO")
                .modelName("Yonex Astrox 88D Pro")
                .status("APPROVED_FOR_SALE")
                .build();

        when(secondhandService.getApprovedUnits(eq("BR_HCM_01"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(unitCone, unitShaft, unitPremasked, unitTwoPart)));

        mockMvc.perform(get("/api/v1/public/secondhand/units?branchId=BR_HCM_01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].serialNumber").value("120-***-JP"))
                .andExpect(jsonPath("$.data.content[1].serialNumber").value("982-***-12"))
                .andExpect(jsonPath("$.data.content[2].serialNumber").value("SN-***-099"))
                .andExpect(jsonPath("$.data.content[3].serialNumber").value("YONEX-***"));
    }
}
