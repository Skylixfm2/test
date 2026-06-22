package fr.opendata.model;

import java.time.LocalDateTime;

public record ImportLog(
        long id,
        String sourceName,
        String sourceUrl,
        String format,
        int importedRows,
        String status,
        String message,
        LocalDateTime createdAt
) {
}
