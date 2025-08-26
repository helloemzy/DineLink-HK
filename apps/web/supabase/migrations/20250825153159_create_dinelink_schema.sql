-- Enable PostGIS for location data
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    profile_image_url TEXT,
    language VARCHAR(5) DEFAULT 'en',
    cultural_profile JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Dining Events table
CREATE TABLE public.dining_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    restaurant_name VARCHAR(200),
    restaurant_google_place_id VARCHAR(200),
    location TEXT,
    event_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_cost DECIMAL(10,2),
    max_attendees INTEGER DEFAULT 20,
    status VARCHAR(20) DEFAULT 'planning',
    notes TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.dining_events ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies for dining_events (will be updated after event_members table is created)
CREATE POLICY "Users can create events" ON public.dining_events
    FOR INSERT WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can manage their events" ON public.dining_events
    FOR ALL USING (organizer_id = auth.uid());

-- Event Members table
CREATE TABLE public.event_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.dining_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'invited',
    role VARCHAR(20) DEFAULT 'member',
    dietary_restrictions TEXT[],
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_members
CREATE POLICY "Users can view event members for their events" ON public.event_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        event_id IN (
            SELECT id FROM public.dining_events WHERE organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can join events" ON public.event_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own membership" ON public.event_members
    FOR UPDATE USING (user_id = auth.uid());

-- Restaurants table
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_place_id VARCHAR(200) UNIQUE,
    name VARCHAR(200) NOT NULL,
    name_chinese VARCHAR(200),
    address TEXT NOT NULL,
    phone VARCHAR(20),
    cuisine_types TEXT[],
    price_range INTEGER CHECK (price_range BETWEEN 1 AND 4),
    google_rating DECIMAL(2,1),
    openrice_rating DECIMAL(2,1),
    location POINT,
    opening_hours JSONB,
    features TEXT[],
    photos JSONB,
    menu_url TEXT,
    booking_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public read access for restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view restaurants" ON public.restaurants FOR SELECT USING (true);

-- Restaurant Bookings table
CREATE TABLE public.restaurant_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.dining_events(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES public.restaurants(id),
    booking_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    party_size INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    confirmation_code VARCHAR(50),
    special_requests TEXT,
    booking_method VARCHAR(20),
    external_booking_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.restaurant_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_bookings
CREATE POLICY "Event members can view bookings" ON public.restaurant_bookings
    FOR SELECT USING (
        event_id IN (
            SELECT event_id FROM public.event_members WHERE user_id = auth.uid()
            UNION
            SELECT id FROM public.dining_events WHERE organizer_id = auth.uid()
        )
    );

-- Bills table
CREATE TABLE public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.dining_events(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES public.restaurants(id),
    subtotal DECIMAL(10,2) NOT NULL,
    service_charge DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'HKD',
    receipt_image_url TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bills
CREATE POLICY "Event members can view bills" ON public.bills
    FOR SELECT USING (
        event_id IN (
            SELECT event_id FROM public.event_members WHERE user_id = auth.uid()
            UNION
            SELECT id FROM public.dining_events WHERE organizer_id = auth.uid()
        )
    );

CREATE POLICY "Event members can create bills" ON public.bills
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        event_id IN (
            SELECT event_id FROM public.event_members WHERE user_id = auth.uid()
            UNION
            SELECT id FROM public.dining_events WHERE organizer_id = auth.uid()
        )
    );

-- Bill Items table
CREATE TABLE public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    name_chinese VARCHAR(200),
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    category VARCHAR(50),
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bill_items
CREATE POLICY "Users can view bill items for their events" ON public.bill_items
    FOR SELECT USING (
        bill_id IN (
            SELECT id FROM public.bills WHERE event_id IN (
                SELECT event_id FROM public.event_members WHERE user_id = auth.uid()
                UNION
                SELECT id FROM public.dining_events WHERE organizer_id = auth.uid()
            )
        )
    );

-- Item Assignments table
CREATE TABLE public.item_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_item_id UUID REFERENCES public.bill_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    portion DECIMAL(4,3) DEFAULT 1.0,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bill_item_id, user_id)
);

ALTER TABLE public.item_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_assignments
CREATE POLICY "Users can view item assignments for their events" ON public.item_assignments
    FOR SELECT USING (
        bill_item_id IN (
            SELECT bi.id FROM public.bill_items bi
            JOIN public.bills b ON bi.bill_id = b.id
            WHERE b.event_id IN (
                SELECT event_id FROM public.event_members WHERE user_id = auth.uid()
                UNION
                SELECT id FROM public.dining_events WHERE organizer_id = auth.uid()
            )
        )
    );

-- Payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    payer_id UUID REFERENCES public.users(id),
    recipient_id UUID REFERENCES public.users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'HKD',
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(200),
    external_payment_id VARCHAR(200),
    payment_reference TEXT,
    payment_proof_url TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view their payments" ON public.payments
    FOR SELECT USING (payer_id = auth.uid() OR recipient_id = auth.uid());

-- Chat Messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.dining_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Event members can view chat messages" ON public.chat_messages
    FOR SELECT USING (
        event_id IN (
            SELECT event_id FROM public.event_members WHERE user_id = auth.uid()
            UNION
            SELECT id FROM public.dining_events WHERE organizer_id = auth.uid()
        )
    );

CREATE POLICY "Event members can send chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        event_id IN (
            SELECT event_id FROM public.event_members WHERE user_id = auth.uid()
            UNION
            SELECT id FROM public.dining_events WHERE organizer_id = auth.uid()
        )
    );

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_dining_events_organizer ON public.dining_events(organizer_id);
CREATE INDEX idx_dining_events_datetime ON public.dining_events(event_datetime);
CREATE INDEX idx_dining_events_status ON public.dining_events(status);
CREATE INDEX idx_event_members_event ON public.event_members(event_id);
CREATE INDEX idx_event_members_user ON public.event_members(user_id);
CREATE INDEX idx_restaurants_location ON public.restaurants USING GIST(location);
CREATE INDEX idx_restaurants_google_place_id ON public.restaurants(google_place_id);
CREATE INDEX idx_restaurants_cuisine ON public.restaurants USING GIN(cuisine_types);
CREATE INDEX idx_bills_event ON public.bills(event_id);
CREATE INDEX idx_bills_status ON public.bills(status);
CREATE INDEX idx_payments_bill ON public.payments(bill_id);
CREATE INDEX idx_payments_payer ON public.payments(payer_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);

-- Functions for geo queries
CREATE OR REPLACE FUNCTION nearby_restaurants(lat FLOAT, lng FLOAT, radius_km FLOAT DEFAULT 5.0)
RETURNS SETOF public.restaurants AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.restaurants
    WHERE ST_DWithin(
        location::geography,
        ST_MakePoint(lng, lat)::geography,
        radius_km * 1000
    )
    ORDER BY ST_Distance(location::geography, ST_MakePoint(lng, lat)::geography);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger as $$
BEGIN
  INSERT INTO public.users (id, phone, name, language)
  VALUES (
    new.id,
    COALESCE(new.phone, ''),
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.raw_user_meta_data->>'language', 'en')
  );
  return new;
END;
$$ language plpgsql security definer;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT on auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update dining_events RLS policies now that event_members table exists
DROP POLICY IF EXISTS "Organizers can manage their events" ON public.dining_events;

CREATE POLICY "Users can view events they're involved in" ON public.dining_events
    FOR SELECT USING (
        organizer_id = auth.uid() OR 
        id IN (
            SELECT event_id FROM public.event_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organizers can update their events" ON public.dining_events
    FOR UPDATE USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can delete their events" ON public.dining_events
    FOR DELETE USING (organizer_id = auth.uid());