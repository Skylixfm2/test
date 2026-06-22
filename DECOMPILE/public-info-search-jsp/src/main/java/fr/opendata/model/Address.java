package fr.opendata.model;

import java.math.BigDecimal;

public record Address(
        long id,
        String line1,
        String postalCode,
        String city,
        String department,
        String region,
        BigDecimal latitude,
        BigDecimal longitude,
        String source
) {
}
