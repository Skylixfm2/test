INSERT INTO addresses(line1, postal_code, city, department, region, latitude, longitude, source) VALUES
('10 rue de Rivoli', '75004', 'Paris', 'Paris', 'Ile-de-France', 48.8552500, 2.3609800, 'demo'),
('20 avenue Tony Garnier', '69007', 'Lyon', 'Rhone', 'Auvergne-Rhone-Alpes', 45.7295000, 4.8313000, 'demo'),
('1 place de la Bourse', '33000', 'Bordeaux', 'Gironde', 'Nouvelle-Aquitaine', 44.8412000, -0.5699000, 'demo'),
('2 boulevard Paul Peytral', '13006', 'Marseille', 'Bouches-du-Rhone', 'Provence-Alpes-Cote d''Azur', 43.2919000, 5.3795000, 'demo');

INSERT INTO companies(siren, siret, name, legal_category, activity_code, address_id, source) VALUES
('552100554', '55210055400013', 'Open Demo Paris Services', 'SAS', '6201Z', 1, 'demo'),
('130025265', '13002526500013', 'Atelier Public Lyon Donnees', 'Association', '9499Z', 2, 'demo'),
('356000000', '35600000000044', 'Bordeaux Data Cooperative', 'SCOP', '6311Z', 3, 'demo'),
('442116703', '44211670300022', 'Marseille Cartographie Ouverte', 'SARL', '7112B', 4, 'demo');

INSERT INTO imports(source_name, format, imported_rows, status, message)
VALUES ('Jeu de demonstration', 'DEMO', 8, 'SUCCESS', 'Donnees publiques fictives generees pour tester l''application.');

INSERT INTO people(last_name, first_name, gender, birth_date, address, postal_code, city, role, company, source_label, source_type) VALUES
('Morel', 'Camille', 'F', '1994-03-18', '12 rue des Erables', '44000', 'Nantes', 'Chargee de projet', 'Atelier Vert', 'demo', 'DEMO'),
('Bernard', 'Nicolas', 'M', '1988-11-02', '8 avenue Pasteur', '69003', 'Lyon', 'Analyste donnees', 'Data Rhone', 'demo', 'DEMO'),
('Lemoine', 'Sarah', 'F', '1999-07-24', '5 place Victor Hugo', '31000', 'Toulouse', 'Designer produit', 'Studio Garonne', 'demo', 'DEMO'),
('Diallo', 'Mamadou', 'M', '1991-01-09', '21 boulevard Carnot', '59000', 'Lille', 'Responsable support', 'Nord Services', 'demo', 'DEMO'),
('Roux', 'Aline', 'F', '1985-05-30', '3 rue Nationale', '33000', 'Bordeaux', 'Consultante RH', 'Cap Atlantique', 'demo', 'DEMO'),
('Petit', 'Hugo', 'M', '1996-09-12', '17 rue de la Republique', '13002', 'Marseille', 'Developpeur web', 'Mediterranee Tech', 'demo', 'DEMO'),
('Garnier', 'Lea', 'F', '1993-12-04', '44 chemin du Parc', '35000', 'Rennes', 'Coordinatrice', 'Ouest Impact', 'demo', 'DEMO'),
('Faure', 'Mathis', 'M', '1990-06-21', '9 rue Lafayette', '75010', 'Paris', 'Chef de produit', 'Hexa Logic', 'demo', 'DEMO'),
('Faure', 'Matthis', 'M', '1990-06-21', '9 rue La Fayette', '75010', 'Paris', 'Product manager', 'Hexa Logic', 'demo-duplicate', 'DEMO');
