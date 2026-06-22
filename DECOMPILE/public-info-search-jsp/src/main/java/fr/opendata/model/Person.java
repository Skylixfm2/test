package fr.opendata.model;

import java.time.LocalDate;

public record Person(
        long id,
        String lastName,
        String firstName,
        String gender,
        LocalDate birthDate,
        String address,
        String postalCode,
        String city,
        String role,
        String company,
        String sourceLabel,
        String sourceType
) {
    public String displayName() {
        return firstName + " " + lastName;
    }
}
