-- Retreev App - Minimal Database Setup

-- ============================================
-- 1. TABLES
-- ============================================

-- Lost items table
CREATE TABLE public.lost (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    updated_at timestamp with time zone DEFAULT timezone('utc', now()),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    item_name text NOT NULL,
    category text NOT NULL,
    description text,
    date_lost date NOT NULL,
    contact_details text NOT NULL,
    location jsonb NOT NULL,
    status text DEFAULT 'active',
    CONSTRAINT lost_pkey PRIMARY KEY (id),
    CONSTRAINT lost_status_check CHECK (status IN ('active', 'found', 'closed'))
);

-- Found items table
CREATE TABLE public.found (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_name text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    date_found date NOT NULL,
    contact_details text NOT NULL,
    location json NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    status text,
    CONSTRAINT found_pkey PRIMARY KEY (id)
);

-- Chat rooms table
CREATE TABLE public.chat_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lost_user_id uuid NOT NULL REFERENCES auth.users(id),
    found_user_id uuid REFERENCES auth.users(id),
    lost_item_id uuid REFERENCES public.lost(id),
    found_item_id uuid REFERENCES public.found(id),
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    CONSTRAINT chat_rooms_pkey PRIMARY KEY (id),
    CONSTRAINT unique_item_pair UNIQUE (lost_item_id, found_item_id)
);

-- Messages table
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chat_room_id uuid REFERENCES public.chat_rooms(id),
    sender_id uuid REFERENCES auth.users(id),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    metadata jsonb,
    type text DEFAULT 'text' NOT NULL,
    CONSTRAINT messages_pkey PRIMARY KEY (id)
);

-- Notifications table
CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    type character varying NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    related_items jsonb NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT valid_related_items CHECK (
        jsonb_typeof(related_items) = 'object'
        AND (related_items ? 'lost_item_id' OR related_items ? 'found_item_id')
    )
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX lost_status_idx ON public.lost USING btree (status);
CREATE INDEX lost_user_id_idx ON public.lost USING btree (user_id);

-- ============================================
-- 3. FUNCTION & TRIGGER (auto-update timestamps)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_lost_updated_at
    BEFORE UPDATE ON public.lost
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.lost ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.found ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- LOST policies
CREATE POLICY "Users can view all lost items" ON public.lost
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create lost items" ON public.lost
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lost items" ON public.lost
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lost items" ON public.lost
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FOUND policies
CREATE POLICY "Found items are viewable by everyone" ON public.found
    FOR SELECT USING (true);

CREATE POLICY "Users can create found items" ON public.found
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own found items" ON public.found
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own found items" ON public.found
    FOR DELETE USING (auth.uid() = user_id);

-- CHAT ROOMS policies
CREATE POLICY "Users can view their own chat rooms" ON public.chat_rooms
    FOR SELECT USING (auth.uid() = lost_user_id OR auth.uid() = found_user_id);

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
    FOR INSERT WITH CHECK (auth.uid() = lost_user_id OR auth.uid() = found_user_id);

-- MESSAGES policies
CREATE POLICY "Users can view messages in their chat rooms" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms
            WHERE chat_rooms.id = messages.chat_room_id
            AND (auth.uid() = chat_rooms.lost_user_id OR auth.uid() = chat_rooms.found_user_id)
        )
    );

CREATE POLICY "Users can send messages to their chat rooms" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_rooms
            WHERE chat_rooms.id = messages.chat_room_id
            AND (auth.uid() = chat_rooms.lost_user_id OR auth.uid() = chat_rooms.found_user_id)
        )
    );

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (auth.uid() = sender_id);

-- NOTIFICATIONS policies
CREATE POLICY "Users can read their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. TABLE GRANTS
-- ============================================

GRANT ALL ON TABLE public.lost TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.found TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.chat_rooms TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon, authenticated, service_role;

-- ============================================
-- 7. REALTIME (for live chat)
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.messages;

-- ============================================
-- DONE! Your database is ready.
-- Now sign up users through the app and start using it.
-- ============================================
