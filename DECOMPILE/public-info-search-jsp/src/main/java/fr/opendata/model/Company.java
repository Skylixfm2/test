package fr.opendata.model;

public record Company(
        long id,
        String siren,
        String siret,
        String name,
        String legalCategory,
        String activityCode,
        Address address,
        String source
) {
}
