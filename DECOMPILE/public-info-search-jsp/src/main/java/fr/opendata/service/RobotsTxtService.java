package fr.opendata.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class RobotsTxtService {
    private final HttpClient client = HttpClient.newHttpClient();

    public boolean allowed(URI target) throws IOException, InterruptedException {
        URI robots = URI.create(target.getScheme() + "://" + target.getHost() + "/robots.txt");
        HttpRequest request = HttpRequest.newBuilder(robots).GET().build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) return true;
        String path = target.getPath().isBlank() ? "/" : target.getPath();
        boolean applies = false;
        for (String raw : response.body().split("\\R")) {
            String line = raw.trim();
            if (line.toLowerCase().startsWith("user-agent:")) applies = line.substring(11).trim().equals("*");
            if (applies && line.toLowerCase().startsWith("disallow:")) {
                String disallow = line.substring(9).trim();
                if (!disallow.isEmpty() && path.startsWith(disallow)) return false;
            }
        }
        return true;
    }
}
