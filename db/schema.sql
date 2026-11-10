-- Outpatient Rescheduling MVP - Database Schema
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS waitlist_offers CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS appointment_types CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

CREATE TABLE patients (
    patient_id VARCHAR(32) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    access_code_hash VARCHAR(128) NOT NULL,
    consented BOOLEAN DEFAULT FALSE,
    consented_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    location_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    facility_address VARCHAR(256) NOT NULL,
    city VARCHAR(64) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL
);

CREATE TABLE providers (
    provider_id VARCHAR(32) PRIMARY KEY,
    full_name VARCHAR(128) NOT NULL,
    specialty VARCHAR(64) NOT NULL,
    location_id VARCHAR(32) REFERENCES locations(location_id) ON DELETE RESTRICT
);

CREATE TABLE appointment_types (
    type_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30
);

CREATE TABLE slots (
    slot_id VARCHAR(32) PRIMARY KEY,
    provider_id VARCHAR(32) REFERENCES providers(provider_id) ON DELETE CASCADE,
    location_id VARCHAR(32) REFERENCES locations(location_id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_unique_active_slot ON slots (slot_id) WHERE status = 'Booked';

CREATE TABLE appointments (
    appt_id VARCHAR(32) PRIMARY KEY,
    patient_id VARCHAR(32) REFERENCES patients(patient_id) ON DELETE CASCADE,
    provider_id VARCHAR(32) REFERENCES providers(provider_id) ON DELETE CASCADE,
    location_id VARCHAR(32) REFERENCES locations(location_id) ON DELETE CASCADE,
    type_id VARCHAR(32) REFERENCES appointment_types(type_id) ON DELETE CASCADE,
    slot_id VARCHAR(32) REFERENCES slots(slot_id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'Scheduled',
    reschedule_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_slots_provider_start ON slots(provider_id, start_time);

CREATE TABLE waitlist_offers (
    offer_id VARCHAR(32) PRIMARY KEY,
    patient_id VARCHAR(32) REFERENCES patients(patient_id) ON DELETE CASCADE,
    provider_id VARCHAR(32) REFERENCES providers(provider_id) ON DELETE CASCADE,
    slot_id VARCHAR(32) REFERENCES slots(slot_id) ON DELETE CASCADE,
    offered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(16) DEFAULT 'Pending'
);

CREATE TABLE reminders (
    reminder_id VARCHAR(32) PRIMARY KEY,
    appt_id VARCHAR(32) REFERENCES appointments(appt_id) ON DELETE CASCADE,
    reminder_type VARCHAR(16) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_content TEXT NOT NULL
);

CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    actor VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_id VARCHAR(32) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);