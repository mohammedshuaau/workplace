-- Create the workplace and mattermost databases
CREATE DATABASE workplace;
CREATE DATABASE mattermost;

-- Create a user for both databases
CREATE USER workplace WITH PASSWORD 'password';

-- Grant privileges to the workplace user on both databases
GRANT ALL PRIVILEGES ON DATABASE workplace TO workplace;
GRANT ALL PRIVILEGES ON DATABASE mattermost TO workplace;

-- Allow workplace user to create databases (needed for Prisma shadow DB)
ALTER USER workplace CREATEDB;

-- Connect to workplace database and grant schema privileges
\c workplace
GRANT ALL ON SCHEMA public TO workplace;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO workplace;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO workplace;

-- Connect to mattermost database and grant schema privileges
\c mattermost
GRANT ALL ON SCHEMA public TO workplace;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO workplace;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO workplace;