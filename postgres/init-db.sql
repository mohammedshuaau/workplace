-- Create the workplace database
CREATE DATABASE workplace;

-- Create the dendrite database
CREATE DATABASE dendrite;

-- Create a user for both databases
CREATE USER workplace WITH PASSWORD 'password';

-- Grant privileges to the workplace user on both databases
GRANT ALL PRIVILEGES ON DATABASE workplace TO workplace;
GRANT ALL PRIVILEGES ON DATABASE dendrite TO workplace;

-- Allow workplace user to create databases (needed for Prisma shadow DB)
ALTER USER workplace CREATEDB;

-- Connect to workplace database and grant schema privileges
\c workplace;
GRANT ALL ON SCHEMA public TO workplace;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO workplace;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO workplace;

-- Connect to dendrite database and grant schema privileges
\c dendrite;
GRANT ALL ON SCHEMA public TO workplace;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO workplace;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO workplace; 