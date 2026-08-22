-- ============================================================
-- FASHIONCOMPANY FASHION — ENTERPRISE DATABASE INDEXING & TRIGGERS (V2)
-- ============================================================

-- 1. Create Indexes on Common Columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_deleted_at ON product_variants(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON order_items(sku);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_order_id ON shipment_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_tracking_number ON shipment_tracking(tracking_number);

CREATE INDEX IF NOT EXISTS idx_shipment_status_history_shipment_id ON shipment_status_history(shipment_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at);

-- 2. General Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind Updated At Triggers to Tables
DO $$
DECLARE
    t TEXT;
    tables_to_trigger TEXT[] := ARRAY[
        'roles', 'permissions', 'users', 'user_profiles', 'user_addresses', 
        'user_payment_methods', 'categories', 'brands', 'products', 
        'product_images', 'product_videos', 'product_tags', 'product_seo', 
        'product_specifications', 'product_attributes', 'attribute_values', 
        'product_variants', 'warehouses', 'warehouse_locations', 'inventory', 
        'suppliers', 'coupons', 'gift_cards', 'orders', 'payments', 
        'shipping_providers', 'shipping_methods', 'delivery_zones', 
        'shipment_tracking', 'cart', 'cart_items', 'reviews', 'homepage_banners', 
        'hero_slider', 'collections', 'blog_posts', 'cms_pages', 'faqs', 
        'admin_users', 'api_keys'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_trigger LOOP
        EXECUTE FORMAT('
            CREATE TRIGGER trigger_update_timestamp
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t);
    END LOOP;
END;
$$;
