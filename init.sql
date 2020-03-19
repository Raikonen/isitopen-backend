DROP TABLE IF EXISTS Stores CASCADE;
DROP TABLE IF EXISTS OpeningHours;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS Collections CASCADE;
DROP TABLE IF EXISTS Collaborators;
DROP TABLE IF EXISTS StoresInCollection;

CREATE TABLE Stores
(
	sid 			INTEGER GENERATED ALWAYS AS IDENTITY,
	sname			VARCHAR(100),
    /* Extendible for future attributes */
    PRIMARY KEY (sid)
);

CREATE TABLE OpeningHours
(
    sid             INTEGER NOT NULL,   
    day             INTEGER,
    openingTime     TIME,
    closingTime     TIME,
    FOREIGN KEY (sid) REFERENCES Stores
);

CREATE TABLE Users
(
    uid             INTEGER GENERATED ALWAYS AS IDENTITY,
    email           VARCHAR(100) NOT NULL,
    password        TEXT NOT NULL,
    PRIMARY KEY (email)
);

CREATE TABLE Collections
(
    cid             INTEGER GENERATED ALWAYS AS IDENTITY,
    owner           VARCHAR(100) NOT NULL,
    cname           VARCHAR(100),
    /* Extendible for future attributes */
    FOREIGN KEY (owner) REFERENCES Users(email),
    PRIMARY KEY (cid)
);

CREATE TABLE Collaborators
(
    cid             INTEGER,
    email           VARCHAR(100) NOT NULL,
    FOREIGN KEY (email) REFERENCES Users(email),
    FOREIGN KEY (cid) REFERENCES Collections(cid)
);

CREATE TABLE StoresInCollection
(
    cid             INTEGER NOT NULL,
    sid             INTEGER NOT NULL,
    addingEmail     INTEGER NOT NULL,
    /* Extendible for future attributes */
    FOREIGN KEY (cid) REFERENCES Collections(cid),
    FOREIGN KEY (sid) REFERENCES Stores(sid),
    PRIMARY KEY (cid, sid)
);

\copy Stores FROM './assets/stores.csv' DELIMITER ',' CSV HEADER;
\copy OpeningHours FROM './assets/openingHours.csv' DELIMITER ',' CSV HEADER;

-- Update sequence
SELECT setval('Stores_sid_seq', (SELECT MAX(sid) FROM Stores));

-- Create notification triggers
CREATE OR REPLACE FUNCTION notify_collaborators_changes()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'collaborators_changed',
    json_build_object(
      'operation', TG_OP,
      'record', row_to_json(NEW)
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_storesincollection_changes()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'storesincollection_changed',
    json_build_object(
      'operation', TG_OP,
      'record', row_to_json(NEW)
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER collaborators_changed
AFTER INSERT OR DELETE
ON Collaborators
FOR EACH ROW
EXECUTE PROCEDURE notify_collaborators_changes();

CREATE TRIGGER storesincollection_changed
AFTER INSERT OR DELETE
ON StoresInCollection
FOR EACH ROW
EXECUTE PROCEDURE notify_storesincollection_changes();

/*
    Trigger Test
    LISTEN "collaborators_changed";
    INSERT INTO Users(email) VALUES ('abc@gmail.com');
    INSERT INTO Collections(owner, cname) VALUES (1, 'collectionName');
    INSERT INTO Collaborators(cid, uid) VALUES (1,1);
*/
