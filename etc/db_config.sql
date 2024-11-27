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

CREATE TABLE anomaly_data (
    sensor_data_id INTEGER PRIMARY KEY,
    anomaly_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (sensor_data_id) REFERENCES sensor_data(id)
);