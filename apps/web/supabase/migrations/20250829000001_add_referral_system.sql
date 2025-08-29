-- Add referral system tables for viral growth

-- User referral codes
CREATE TABLE user_referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    code VARCHAR(8) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(user_id, code)
);

-- Referrals tracking
CREATE TABLE referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referral_code VARCHAR(8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    signup_reward_amount NUMERIC(10, 2) DEFAULT 0,
    total_rewards_earned NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT referrals_no_self_referral CHECK (referrer_id != referee_id)
);

-- Referral rewards tracking
CREATE TABLE referral_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_id UUID REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('signup', 'first_event', 'first_bill_split', 'activity_bonus')),
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Viral events tracking
CREATE TABLE viral_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Viral shares tracking
CREATE TABLE viral_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'event', 'restaurant', 'referral'
    content_id VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL, -- 'whatsapp', 'social', 'link'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restaurant favorites for viral discovery
CREATE TABLE restaurant_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, restaurant_id)
);

-- Restaurant viral metrics
CREATE TABLE restaurant_viral_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
    shares_count INTEGER DEFAULT 0,
    events_created_from_shares INTEGER DEFAULT 0,
    viral_discovery_rate NUMERIC(5, 4) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(restaurant_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_referral_codes_user_id ON user_referral_codes(user_id);
CREATE INDEX idx_user_referral_codes_code ON user_referral_codes(code);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_type ON referral_rewards(reward_type);
CREATE INDEX idx_viral_events_user_id ON viral_events(user_id);
CREATE INDEX idx_viral_events_type ON viral_events(event_type);
CREATE INDEX idx_viral_shares_user_id ON viral_shares(user_id);
CREATE INDEX idx_viral_shares_content ON viral_shares(content_type, content_id);
CREATE INDEX idx_viral_shares_channel ON viral_shares(channel);
CREATE INDEX idx_restaurant_favorites_user_id ON restaurant_favorites(user_id);
CREATE INDEX idx_restaurant_favorites_restaurant_id ON restaurant_favorites(restaurant_id);

-- Row Level Security policies

-- User referral codes - users can only see their own codes
ALTER TABLE user_referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral codes" ON user_referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own referral codes" ON user_referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals - users can see referrals they're involved in
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals they're involved in" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can insert referrals" ON referrals
    FOR INSERT WITH CHECK (true); -- Allow system to create referrals

-- Referral rewards - users can see their own rewards
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral rewards" ON referral_rewards
    FOR SELECT USING (auth.uid() = user_id);

-- Viral events - users can see their own events
ALTER TABLE viral_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own viral events" ON viral_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own viral events" ON viral_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Viral shares - users can see their own shares
ALTER TABLE viral_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own viral shares" ON viral_shares
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own viral shares" ON viral_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Restaurant favorites - users can manage their own favorites
ALTER TABLE restaurant_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON restaurant_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON restaurant_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON restaurant_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Restaurant viral metrics - readable by all users
ALTER TABLE restaurant_viral_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view restaurant viral metrics" ON restaurant_viral_metrics
    FOR SELECT USING (true);

-- Function to update restaurant viral metrics
CREATE OR REPLACE FUNCTION update_restaurant_viral_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.content_type = 'restaurant' THEN
        INSERT INTO restaurant_viral_metrics (restaurant_id, shares_count, updated_at)
        VALUES (NEW.content_id::UUID, 1, NOW())
        ON CONFLICT (restaurant_id) 
        DO UPDATE SET 
            shares_count = restaurant_viral_metrics.shares_count + 1,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;