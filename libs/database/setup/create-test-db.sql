-- PostgreSQL

-- Run this script to create the test database. You'll want to
-- create the production database with different user credentials.

create database fieldzoo_test;
create user test_user with encrypted password 'test_pass';
grant all privileges on database fieldzoo_test to test_user;
