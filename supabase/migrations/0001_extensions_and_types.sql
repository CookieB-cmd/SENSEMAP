create extension if not exists postgis;
create extension if not exists pgcrypto;
create type public.noise_level as enum ('quiet','moderate','loud');
create type public.lighting_level as enum ('soft','normal','strong');
create type public.crowd_level as enum ('few','some','busy');
create type public.moderation_status as enum ('pending','approved','rejected');
create type public.moderation_reason as enum ('incorrect_information','offensive_content','spam','personal_information','place_closed');
