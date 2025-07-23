-- Script simplificado para crear el esquema ERP colombiano en PostgreSQL
-- Sin dependencias de extensiones especiales

-- Crear tipos ENUM personalizados
DO $$ BEGIN
    CREATE TYPE entry_status_accounting AS ENUM ('DRAFT', 'POSTED', 'REVERSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE purchase_order_status AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'RECEIVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Tabla de proveedores (suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    nit varchar(20) UNIQUE NOT NULL,
    email varchar(255),
    phone varchar(20),
    address text,
    city varchar(100),
    department varchar(100),
    contact_person varchar(255),
    tax_regime varchar(50),
    retention_percentage numeric(5,2) DEFAULT 0,
    status boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 2. Tabla de productos (products)
CREATE TABLE IF NOT EXISTS products (
    id serial PRIMARY KEY,
    code varchar(50) UNIQUE NOT NULL,
    name varchar(255) NOT NULL,
    description text,
    category varchar(100),
    unit_of_measure varchar(20) DEFAULT 'UNIT',
    cost_price numeric(12,2) DEFAULT 0,
    sale_price numeric(12,2) DEFAULT 0,
    stock_quantity integer DEFAULT 0,
    minimum_stock integer DEFAULT 0,
    status boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 3. Tabla de órdenes de compra (purchase_orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id serial PRIMARY KEY,
    order_number varchar(50) UNIQUE NOT NULL,
    supplier_id integer REFERENCES suppliers(id) NOT NULL,
    order_date date NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date date,
    status purchase_order_status DEFAULT 'DRAFT',
    subtotal numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    discount_amount numeric(12,2) DEFAULT 0,
    total numeric(12,2) DEFAULT 0,
    notes text,
    created_by varchar(255),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 4. Tabla de items de órdenes de compra (purchase_order_items)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id serial PRIMARY KEY,
    purchase_order_id integer REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id integer REFERENCES products(id),
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0,
    line_total numeric(12,2) NOT NULL,
    created_at timestamp DEFAULT now()
);

-- 5. Tabla de facturas de proveedores (supplier_invoices)
CREATE TABLE IF NOT EXISTS supplier_invoices (
    id serial PRIMARY KEY,
    invoice_number varchar(50) NOT NULL,
    supplier_id integer REFERENCES suppliers(id) NOT NULL,
    purchase_order_id integer REFERENCES purchase_orders(id),
    issue_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    status invoice_status DEFAULT 'PENDING',
    subtotal numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    retention_amount numeric(12,2) DEFAULT 0,
    total numeric(12,2) DEFAULT 0,
    paid_amount numeric(12,2) DEFAULT 0,
    notes text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 6. Tabla de items de facturas (supplier_invoice_items)
CREATE TABLE IF NOT EXISTS supplier_invoice_items (
    id serial PRIMARY KEY,
    invoice_id integer REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    product_id integer REFERENCES products(id),
    description varchar(255),
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    created_at timestamp DEFAULT now()
);

-- 7. Tabla de usuarios (users)
CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    username varchar(50) UNIQUE NOT NULL,
    email varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    first_name varchar(100),
    last_name varchar(100),
    role user_role DEFAULT 'EMPLOYEE',
    status boolean DEFAULT true,
    last_login timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 8. Tabla de compañías (companies)
CREATE TABLE IF NOT EXISTS companies (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    nit varchar(20) UNIQUE NOT NULL,
    address text,
    city varchar(100),
    phone varchar(20),
    email varchar(255),
    legal_representative varchar(255),
    logo_url varchar(500),
    status boolean DEFAULT true,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_suppliers_nit ON suppliers(nit);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_date ON supplier_invoices(issue_date);

-- Insertar datos de ejemplo para proveedores
INSERT INTO suppliers (name, nit, email, phone, address, city, department, contact_person, status) VALUES
('DISTRIBUIDORA COLOMBIANA SAS', '900123456-7', 'ventas@distcol.com', '+57 1 234-5678', 'Calle 100 # 15-20', 'Bogotá', 'Cundinamarca', 'María González', true),
('FERRETERÍA NACIONAL LTDA', '800987654-3', 'compras@ferrenacional.com', '+57 4 987-6543', 'Carrera 50 # 25-15', 'Medellín', 'Antioquia', 'Carlos Ramírez', true),
('SUMINISTROS INDUSTRIALES SA', '700456789-1', 'info@sumindustriales.com', '+57 2 456-7890', 'Avenida 3N # 12-45', 'Cali', 'Valle del Cauca', 'Ana Rodríguez', true)
ON CONFLICT (nit) DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO products (code, name, description, category, unit_of_measure, cost_price, sale_price, stock_quantity, minimum_stock) VALUES
('PROD001', 'Tornillo Phillips 1/2"', 'Tornillo cabeza Phillips acero inoxidable', 'Ferretería', 'UNIDAD', 150.00, 250.00, 500, 50),
('PROD002', 'Cable Eléctrico 12AWG', 'Cable eléctrico calibre 12 AWG por metro', 'Eléctrico', 'METRO', 2500.00, 3500.00, 100, 20),
('PROD003', 'Pintura Vinilo Blanco', 'Pintura vinilo interior blanco galón', 'Pinturas', 'GALÓN', 35000.00, 45000.00, 25, 5)
ON CONFLICT (code) DO NOTHING;

-- Verificar que las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'compras' 
ORDER BY table_name;