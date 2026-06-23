package fr.opendata.model;

public record PersonMatch(long id, long leftPersonId, long rightPersonId, double score, String status) {
}
