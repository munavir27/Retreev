-- SQL restore script in safe dependency order

-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--

-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    lost_user_id uuid NOT NULL,
    found_user_id uuid,
    lost_item_id uuid,
    found_item_id uuid,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.chat_rooms OWNER TO postgres;

--

-- Name: found; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.found (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_name text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    date_found date NOT NULL,
    contact_details text NOT NULL,
    location json NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid,
    status text
);

ALTER TABLE public.found OWNER TO postgres;

--

-- Name: lost; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lost (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    user_id uuid NOT NULL,
    item_name text NOT NULL,
    category text NOT NULL,
    description text,
    date_lost date NOT NULL,
    contact_details text NOT NULL,
    location jsonb NOT NULL,
    status text DEFAULT 'active'::text,
    CONSTRAINT lost_status_check CHECK ((status = ANY (ARRAY['active'::text, 'found'::text, 'closed'::text])))
);

ALTER TABLE public.lost OWNER TO postgres;

--

-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    chat_room_id uuid,
    sender_id uuid,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    metadata jsonb,
    type text DEFAULT 'text'::text NOT NULL
);

ALTER TABLE public.messages OWNER TO postgres;

--

-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    type character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    related_items jsonb NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_related_items CHECK (((jsonb_typeof(related_items) = 'object'::text) AND ((related_items ? 'lost_item_id'::text) OR (related_items ? 'found_item_id'::text))))
);

ALTER TABLE public.notifications OWNER TO postgres;

--

-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);

--

-- Name: found found_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.found
    ADD CONSTRAINT found_pkey PRIMARY KEY (id);

--

-- Name: lost lost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lost
    ADD CONSTRAINT lost_pkey PRIMARY KEY (id);

--

-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

--

-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

--

-- Name: chat_rooms unique_item_pair; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT unique_item_pair UNIQUE (lost_item_id, found_item_id);

--

-- Name: lost_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lost_status_idx ON public.lost USING btree (status);

--

-- Name: lost_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX lost_user_id_idx ON public.lost USING btree (user_id);

--

-- Name: lost update_lost_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_lost_updated_at BEFORE UPDATE ON public.lost FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

--

-- Name: chat_rooms chat_rooms_found_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_found_item_id_fkey FOREIGN KEY (found_item_id) REFERENCES public.found(id);

--

-- Name: chat_rooms chat_rooms_found_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_found_user_id_fkey FOREIGN KEY (found_user_id) REFERENCES auth.users(id);

--

-- Name: chat_rooms chat_rooms_lost_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_lost_item_id_fkey FOREIGN KEY (lost_item_id) REFERENCES public.lost(id);

--

-- Name: chat_rooms chat_rooms_lost_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_lost_user_id_fkey FOREIGN KEY (lost_user_id) REFERENCES auth.users(id);

--

-- Name: found found_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.found
    ADD CONSTRAINT found_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

--

-- Name: lost lost_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lost
    ADD CONSTRAINT lost_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

--

-- Name: messages messages_chat_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_room_id_fkey FOREIGN KEY (chat_room_id) REFERENCES public.chat_rooms(id);

--

-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id);

--

-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

--

-- Name: lost Allow users to create lost items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to create lost items" ON public.lost FOR INSERT TO authenticated WITH CHECK (true);

--

-- Name: lost Allow users to delete own lost items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to delete own lost items" ON public.lost FOR DELETE TO authenticated USING ((user_id = auth.uid()));

--

-- Name: lost Allow users to update own lost items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to update own lost items" ON public.lost FOR UPDATE TO authenticated USING ((user_id = auth.uid()));

--

-- Name: lost Allow users to view own lost items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to view own lost items" ON public.lost FOR SELECT TO authenticated USING ((user_id = auth.uid()));

--

-- Name: notifications Enable insert for authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users" ON public.notifications FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));

--

-- Name: found Found items are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Found items are viewable by everyone" ON public.found FOR SELECT USING (true);

--

-- Name: chat_rooms Users can create chat rooms; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms FOR INSERT WITH CHECK (((auth.uid() = lost_user_id) OR (auth.uid() = found_user_id)));

--

-- Name: found Users can create found items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create found items" ON public.found FOR INSERT TO authenticated WITH CHECK (true);

--

-- Name: lost Users can create lost items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create lost items" ON public.lost FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));

--

-- Name: found Users can delete their own found items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own found items" ON public.found FOR DELETE USING ((auth.uid() = user_id));

--

-- Name: lost Users can delete their own lost items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own lost items" ON public.lost FOR DELETE TO authenticated USING ((auth.uid() = user_id));

--

-- Name: messages Users can delete their own messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own messages" ON public.messages FOR DELETE USING ((auth.uid() = sender_id));

--

-- Name: notifications Users can delete their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING ((auth.uid() = user_id));

--

-- Name: notifications Users can read their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));

--

-- Name: messages Users can send messages to their chat rooms; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can send messages to their chat rooms" ON public.messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.chat_rooms
  WHERE ((chat_rooms.id = messages.chat_room_id) AND ((auth.uid() = chat_rooms.lost_user_id) OR (auth.uid() = chat_rooms.found_user_id))))));

--

-- Name: found Users can update their own found items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own found items" ON public.found FOR UPDATE USING ((auth.uid() = user_id));

--

-- Name: lost Users can update their own lost items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own lost items" ON public.lost FOR UPDATE TO authenticated USING ((auth.uid() = user_id));

--

-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));

--

-- Name: lost Users can view all lost items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view all lost items" ON public.lost FOR SELECT TO authenticated USING (true);

--

-- Name: messages Users can view messages in their chat rooms; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view messages in their chat rooms" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_rooms
  WHERE ((chat_rooms.id = messages.chat_room_id) AND ((auth.uid() = chat_rooms.lost_user_id) OR (auth.uid() = chat_rooms.found_user_id))))));

--

-- Name: chat_rooms Users can view their own chat rooms; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own chat rooms" ON public.chat_rooms FOR SELECT USING (((auth.uid() = lost_user_id) OR (auth.uid() = found_user_id)));

--

-- Name: chat_rooms; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

--

-- Name: found; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.found ENABLE ROW LEVEL SECURITY;

--

-- Name: lost; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.lost ENABLE ROW LEVEL SECURITY;

--

-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--

-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--

-- Name: supabase_realtime messages; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.messages;

--

-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;

--

-- Name: TABLE chat_rooms; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.chat_rooms TO anon;
GRANT ALL ON TABLE public.chat_rooms TO authenticated;
GRANT ALL ON TABLE public.chat_rooms TO service_role;

--

-- Name: TABLE found; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.found TO anon;
GRANT ALL ON TABLE public.found TO authenticated;
GRANT ALL ON TABLE public.found TO service_role;

--

-- Name: TABLE lost; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.lost TO anon;
GRANT ALL ON TABLE public.lost TO authenticated;
GRANT ALL ON TABLE public.lost TO service_role;

--

-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO anon;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;

--

-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

--

-- ==========================================
-- AUTH USER DATA DEPENDENCIES (inserted first)
-- ==========================================

-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES
    ('00000000-0000-0000-0000-000000000000', '6fac3adb-61b9-458b-822e-6a5aac576146', 'authenticated', 'authenticated', 'jayadevsekhar.c.o@gmail.com', '$2a$10$.qI.DK7uvZpyfaBF44bZtOPgXRpWNoCf53grkFuWw2sXn1biLkP0G', '2025-04-03 08:50:56.775109+00', NULL, '', '2025-04-03 08:50:33.682026+00', '', NULL, '', '', NULL, '2025-04-03 08:50:59.171059+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "6fac3adb-61b9-458b-822e-6a5aac576146", "email": "jayadevsekhar.c.o@gmail.com", "created_at": "2025-04-03T08:50:32.490Z", "display_name": "Jayadev", "email_verified": true, "phone_verified": false}', NULL, '2025-04-03 08:50:33.671924+00', '2025-04-03 08:50:59.172826+00', NULL, NULL, '', '', NULL, '', '0', NULL, '', NULL, 'f', NULL, 'f'),
    ('00000000-0000-0000-0000-000000000000', 'eb1bf4f8-e068-4db4-8408-167b2c563374', 'authenticated', 'authenticated', 'ashputhusseri@gmail.com', '$2a$10$kLw9rzTxNBHgbTxbuiR4k.n.l1sjOhO6dPDJ6Kp1gV2dMyBbXZ9jO', '2025-03-26 04:00:18.439827+00', NULL, '', '2025-03-26 03:59:04.725091+00', '', '2025-04-03 08:03:26.50277+00', '', '', NULL, '2025-04-03 08:10:56.714237+00', '{"provider": "email", "providers": ["email"]}', '{"bio": "", "sub": "eb1bf4f8-e068-4db4-8408-167b2c563374", "email": "ashputhusseri@gmail.com", "phone": "", "location": "", "created_at": "2025-03-26T03:59:04.393Z", "updated_at": "2025-04-03T08:35:18.601Z", "display_name": "Aaashbin", "email_verified": true, "phone_verified": false}', NULL, '2025-03-26 03:59:04.711296+00', '2025-04-03 08:35:19.707603+00', NULL, NULL, '', '', NULL, '', '0', NULL, '', NULL, 'f', NULL, 'f'),
    ('00000000-0000-0000-0000-000000000000', '32f265ce-959c-4b16-bb9f-8c622a9285ff', 'authenticated', 'authenticated', 'karthikasuresh.v2@gmail.com', '$2a$10$TDz0H/IMCOhqgfq6LgA.CuW9WJzhkwsMUnX.NFBoEY3DmvYE6y8H2', '2025-03-01 16:09:21.697551+00', NULL, '', '2025-03-01 16:08:44.564087+00', '', NULL, '', '', NULL, '2025-04-03 08:06:40.234528+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "32f265ce-959c-4b16-bb9f-8c622a9285ff", "email": "karthikasuresh.v2@gmail.com", "created_at": "2025-03-01T16:08:44.620Z", "display_name": "Karthika", "email_verified": true, "phone_verified": false}', NULL, '2025-03-01 16:08:44.529611+00', '2025-04-03 08:06:40.236278+00', NULL, NULL, '', '', NULL, '', '0', NULL, '', NULL, 'f', NULL, 'f');


-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) VALUES
    ('32f265ce-959c-4b16-bb9f-8c622a9285ff', '32f265ce-959c-4b16-bb9f-8c622a9285ff', '{"sub": "32f265ce-959c-4b16-bb9f-8c622a9285ff", "email": "karthikasuresh.v2@gmail.com", "created_at": "2025-03-01T16:08:44.620Z", "display_name": "Karthika", "email_verified": true, "phone_verified": false}', 'email', '2025-03-01 16:08:44.553795+00', '2025-03-01 16:08:44.553859+00', '2025-03-01 16:08:44.553859+00', '28740f57-cfe6-4b18-8d67-cfaf6a9d91ac'),
    ('eb1bf4f8-e068-4db4-8408-167b2c563374', 'eb1bf4f8-e068-4db4-8408-167b2c563374', '{"sub": "eb1bf4f8-e068-4db4-8408-167b2c563374", "email": "ashputhusseri@gmail.com", "created_at": "2025-03-26T03:59:04.393Z", "display_name": "Aaashbin", "email_verified": true, "phone_verified": false}', 'email', '2025-03-26 03:59:04.720546+00', '2025-03-26 03:59:04.720599+00', '2025-03-26 03:59:04.720599+00', '9d8b3342-37a9-4918-a3b1-f916fb1775b8'),
    ('6fac3adb-61b9-458b-822e-6a5aac576146', '6fac3adb-61b9-458b-822e-6a5aac576146', '{"sub": "6fac3adb-61b9-458b-822e-6a5aac576146", "email": "jayadevsekhar.c.o@gmail.com", "created_at": "2025-04-03T08:50:32.490Z", "display_name": "Jayadev", "email_verified": true, "phone_verified": false}', 'email', '2025-04-03 08:50:33.677063+00', '2025-04-03 08:50:33.677114+00', '2025-04-03 08:50:33.677114+00', 'aaf7a6f0-ce38-46b2-aa17-3087b98e8480');

-- ==========================================
-- PUBLIC SCHEMA DATA ENTRIES (inserted last)
-- ==========================================

-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO public.chat_rooms (id, lost_user_id, found_user_id, lost_item_id, found_item_id, created_at) VALUES
    ('6484b56d-3776-4fcf-a956-91fd5c9a0d33', '32f265ce-959c-4b16-bb9f-8c622a9285ff', '6fac3adb-61b9-458b-822e-6a5aac576146', '2ad02a5e-3825-471d-8a95-e6cc75b92811', '0a86e21e-a7f3-421b-80fb-2965d4558f14', '2025-04-03 08:55:30.187978+00');

-- Data for Name: found; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO public.found (id, item_name, category, description, date_found, contact_details, location, created_at, user_id, status) VALUES
    ('0a86e21e-a7f3-421b-80fb-2965d4558f14', 'Bottle ', 'Gadgets', 'Green', '2025-04-03', '8086235666', '{"latitude":10.049264,"longitude":76.3310983}', '2025-04-03 08:55:16.685731+00', '6fac3adb-61b9-458b-822e-6a5aac576146', 'active');

-- Data for Name: lost; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO public.lost (id, created_at, updated_at, user_id, item_name, category, description, date_lost, contact_details, location, status) VALUES
    ('2ad02a5e-3825-471d-8a95-e6cc75b92811', '2025-04-03 08:51:41.796305+00', '2025-04-03 08:51:41.796305+00', '32f265ce-959c-4b16-bb9f-8c622a9285ff', 'Bottle', 'Gadgets', 'Green bottles', '2025-04-03', '7012245311', '{"latitude": 10.04916, "longitude": 76.3309184}', 'active'),
    ('793c544c-5b4d-4e06-b123-3b0971657c51', '2025-04-03 08:53:42.705999+00', '2025-04-03 08:53:42.705999+00', '6fac3adb-61b9-458b-822e-6a5aac576146', 'Bottle', 'Gadgets', 'Green', '2025-04-03', '8086235666', '{"latitude": 10.049326, "longitude": 76.3310217}', 'active');

-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO public.messages (id, chat_room_id, sender_id, content, created_at, metadata, type) VALUES
    ('1935326d-b711-43ef-8143-f3e1ab3f8758', '6484b56d-3776-4fcf-a956-91fd5c9a0d33', '6fac3adb-61b9-458b-822e-6a5aac576146', 'Hello', '2025-04-03 08:55:34.353404+00', '{}', 'text'),
    ('1ca9578f-4251-4242-99a2-e4dd7fc95b3f', '6484b56d-3776-4fcf-a956-91fd5c9a0d33', '6fac3adb-61b9-458b-822e-6a5aac576146', 'Hello', '2025-04-03 08:55:41.866502+00', '{}', 'text'),
    ('291a00b9-5b93-4d51-ba5c-95e6494484a0', '6484b56d-3776-4fcf-a956-91fd5c9a0d33', '32f265ce-959c-4b16-bb9f-8c622a9285ff', 'Mine', '2025-04-03 08:55:44.3987+00', '{}', 'text'),
    ('ec487215-dd78-4182-af9f-87591af09dcc', '6484b56d-3776-4fcf-a956-91fd5c9a0d33', '32f265ce-959c-4b16-bb9f-8c622a9285ff', 'https://hkilethxdlkwxtqxgpic.supabase.co/storage/v1/object/public/chat-images/32f265ce-959c-4b16-bb9f-8c622a9285ff/1743670561056.jpeg', '2025-04-03 08:56:01.602443+00', '{"width": 3120, "height": 2340}', 'image');

-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
INSERT INTO public.notifications (id, user_id, type, title, message, related_items, read, created_at) VALUES
    ('d2cb25ac-6f23-46dd-9ddc-5a5c3ce2ad30', '32f265ce-959c-4b16-bb9f-8c622a9285ff', 'match', 'Potential Match Found', 'Someone found an item that matches your lost Bottle!', '{"lost_item_id": "2ad02a5e-3825-471d-8a95-e6cc75b92811", "found_item_id": "0a86e21e-a7f3-421b-80fb-2965d4558f14"}', 'f', '2025-04-03 08:55:15.824+00'),
    ('1621cba2-7cd0-4661-8b2b-bfcb91bf9f6b', '6fac3adb-61b9-458b-822e-6a5aac576146', 'match', 'Match with Lost Item', 'Your found item matches with someone''s lost Bottle!', '{"lost_item_id": "2ad02a5e-3825-471d-8a95-e6cc75b92811", "found_item_id": "0a86e21e-a7f3-421b-80fb-2965d4558f14"}', 'f', '2025-04-03 08:55:15.824+00'),
    ('6f03bc43-c979-4ec4-b83a-f913e4fd574a', '6fac3adb-61b9-458b-822e-6a5aac576146', 'match', 'Potential Match Found', 'Someone found an item that matches your lost Bottle!', '{"lost_item_id": "793c544c-5b4d-4e06-b123-3b0971657c51", "found_item_id": "0a86e21e-a7f3-421b-80fb-2965d4558f14"}', 'f', '2025-04-03 08:55:15.824+00'),
    ('0d291182-8fc4-4fbd-8af1-d2f17b31d760', '6fac3adb-61b9-458b-822e-6a5aac576146', 'match', 'Match with Lost Item', 'Your found item matches with someone''s lost Bottle!', '{"lost_item_id": "793c544c-5b4d-4e06-b123-3b0971657c51", "found_item_id": "0a86e21e-a7f3-421b-80fb-2965d4558f14"}', 'f', '2025-04-03 08:55:15.824+00');