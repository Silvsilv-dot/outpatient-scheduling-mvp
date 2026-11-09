CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'patient'
);

CREATE TABLE IF NOT EXISTS clinicians (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id),
    clinician_id INTEGER NOT NULL REFERENCES clinicians(id),
    appointment_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    estimated_wait_time VARCHAR(50) DEFAULT '15 mins',
    notes TEXT
);
