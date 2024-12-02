CREATE TABLE sensor_data (
    id SERIAL PRIMARY KEY,
    reading_time TIMESTAMP NOT NULL,
    position VARCHAR(20),
    meter_type VARCHAR(10),
    meter_serial_number INTEGER,
    active_energy_import INTEGER,
    active_energy_export INTEGER,
    reactive_energy_import INTEGER,
    reactive_energy_export INTEGER,
    apparent_energy_import INTEGER,
    apparent_energy_export INTEGER
);

CREATE TABLE hours_usage (
    id SERIAL PRIMARY KEY,
    reading_time TIMESTAMP NOT NULL,
    position VARCHAR(20),
    meter_type VARCHAR(10),
    meter_serial_number INTEGER,
    active_energy_import FLOAT,
    active_energy_export FLOAT,
    reactive_energy_import FLOAT,
    reactive_energy_export FLOAT,
    apparent_energy_import FLOAT,
    apparent_energy_export FLOAT
);


CREATE TABLE anomaly_data (
    hours_usage_id INTEGER PRIMARY KEY,
    anomaly_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (hours_usage_id) REFERENCES hours_usage(id),
    predicted_energy FLOAT
);

CREATE TABLE user_token (
    token TEXT NOT NULL,
    init_time TIMESTAMP NOT NULL
);