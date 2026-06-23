CREATE TABLE admins (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    line1 VARCHAR(255) NOT NULL,
    postal_code VARCHAR(12) NOT NULL,
    city VARCHAR(120) NOT NULL,
    department VARCHAR(120),
    region VARCHAR(120),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    source VARCHAR(120) NOT NULL DEFAULT 'demo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_address_city_postal (city, postal_code),
    FULLTEXT INDEX ft_address (line1, city, department, region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE companies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    siren VARCHAR(9) NOT NULL,
    siret VARCHAR(14) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    legal_category VARCHAR(120),
    activity_code VARCHAR(20),
    address_id BIGINT,
    source VARCHAR(120) NOT NULL DEFAULT 'demo',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_company_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    INDEX idx_company_siren (siren),
    INDEX idx_company_name (name),
    FULLTEXT INDEX ft_company_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE imports (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_name VARCHAR(160) NOT NULL,
    source_url VARCHAR(600),
    format ENUM('CSV','JSON','SQL','DEMO') NOT NULL,
    imported_rows INT NOT NULL DEFAULT 0,
    status ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_id BIGINT,
    action VARCHAR(120) NOT NULL,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE people (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    gender ENUM('F','M','Autre') NOT NULL,
    birth_date DATE NOT NULL,
    address VARCHAR(255),
    postal_code VARCHAR(12),
    city VARCHAR(120) NOT NULL,
    role VARCHAR(160) NOT NULL,
    company VARCHAR(160) NOT NULL,
    source_label VARCHAR(180) NOT NULL DEFAULT 'demo',
    source_type ENUM('DEMO','API','SCRAPING','MANUAL') NOT NULL DEFAULT 'DEMO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_people_name (last_name, first_name),
    INDEX idx_people_address (postal_code, city),
    INDEX idx_people_city (city),
    INDEX idx_people_company (company),
    FULLTEXT INDEX ft_people_search (last_name, first_name, address, postal_code, city, role, company)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE scrape_sources (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL,
    base_url VARCHAR(600) NOT NULL,
    allowed_host VARCHAR(180) NOT NULL,
    source_type ENUM('API','SCRAPING') NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    min_delay_ms INT NOT NULL DEFAULT 3000,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE scrape_jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    source_id BIGINT NOT NULL,
    target_url VARCHAR(800) NOT NULL,
    status ENUM('PENDING','SUCCESS','FAILED','BLOCKED') NOT NULL DEFAULT 'PENDING',
    imported_rows INT NOT NULL DEFAULT 0,
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_scrape_job_source FOREIGN KEY (source_id) REFERENCES scrape_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE person_matches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    left_person_id BIGINT NOT NULL,
    right_person_id BIGINT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    status ENUM('SUGGESTED','MERGED','REJECTED') NOT NULL DEFAULT 'SUGGESTED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_match_left FOREIGN KEY (left_person_id) REFERENCES people(id) ON DELETE CASCADE,
    CONSTRAINT fk_match_right FOREIGN KEY (right_person_id) REFERENCES people(id) ON DELETE CASCADE,
    UNIQUE KEY uk_match_pair (left_person_id, right_person_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO scrape_sources(name, base_url, allowed_host, source_type, enabled, min_delay_ms)
VALUES ('Source demo autorisee', 'https://www.data.gouv.fr/', 'www.data.gouv.fr', 'API', TRUE, 3000);

INSERT INTO admins(username, password_hash)
VALUES ('admin', '$2a$10$V8G9Zi7Gfvib0tY3LG3pOe8LmLbOzIxMxDYXoC5iY1kCDYWyPo2Xi');
