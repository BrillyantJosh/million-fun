CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: is_admin(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin(check_nostr_hex_id text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE nostr_hex_id = check_nostr_hex_id
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nostr_hex_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    financing_inspirations numeric(10,2) DEFAULT 0 NOT NULL,
    enhancing_current_system numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admins admins_nostr_hex_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_nostr_hex_id_key UNIQUE (nostr_hex_id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: app_settings update_app_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admins Anyone can view admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view admins" ON public.admins FOR SELECT USING (true);


--
-- Name: app_settings Anyone can view app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view app settings" ON public.app_settings FOR SELECT USING (true);


--
-- Name: admins Only admins can delete admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete admins" ON public.admins FOR DELETE USING (public.is_admin(nostr_hex_id));


--
-- Name: admins Only admins can insert admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert admins" ON public.admins FOR INSERT WITH CHECK (public.is_admin(nostr_hex_id));


--
-- Name: app_settings Only admins can insert app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert app settings" ON public.app_settings FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.admins
 LIMIT 1)));


--
-- Name: app_settings Only admins can update app settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update app settings" ON public.app_settings FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.admins
 LIMIT 1)));


--
-- Name: admins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


