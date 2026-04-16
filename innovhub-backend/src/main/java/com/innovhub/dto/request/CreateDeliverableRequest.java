package com.innovhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDeliverableRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String title;

    private String stage;
}
