-- Script completo para crear el esquema ERP colombiano en PostgreSQL
-- Base de datos: erp_saas_colombiano
-- Esquema: compras

BEGIN;

-- Crear tipos ENUM personalizados
CREATE TYPE entry_status_accounting AS ENUM ('DRAFT', 'POSTED', 'REVERSED');
CREATE TYPE purchase_order_status AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'RECEIVED', 'CANCELLED');
CREATE TYPE invoice_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER');

-- 1. Tabla de proveedores (suppliers)
CREATE TABLE IF NOT EXISTS compras.suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Tabla de productos (products)
CREATE TABLE IF NOT EXISTS compras.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Tabla de órdenes de compra (purchase_orders)
CREATE TABLE IF NOT EXISTS compras.purchase_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number varchar(50) UNIQUE NOT NULL,
    supplier_id uuid REFERENCES compras.suppliers(id) NOT NULL,
    order_date date NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date date,
    status purchase_order_status DEFAULT 'DRAFT',
    subtotal numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    discount_amount numeric(12,2) DEFAULT 0,
    total numeric(12,2) DEFAULT 0,
    notes text,
    created_by varchar(255),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Tabla de items de órdenes de compra (purchase_order_items)
CREATE TABLE IF NOT EXISTS compras.purchase_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id uuid REFERENCES compras.purchase_orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES compras.products(id),
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    discount_percentage numeric(5,2) DEFAULT 0,
    line_total numeric(12,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 5. Tabla de facturas de proveedores (supplier_invoices)
CREATE TABLE IF NOT EXISTS compras.supplier_invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number varchar(50) NOT NULL,
    supplier_id uuid REFERENCES compras.suppliers(id) NOT NULL,
    purchase_order_id uuid REFERENCES compras.purchase_orders(id),
    issue_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    status invoice_status DEFAULT 'PENDING',
    subtotal numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    retention_amount numeric(12,2) DEFAULT 0,
    total numeric(12,2) DEFAULT 0,
    paid_amount numeric(12,2) DEFAULT 0,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. Tabla de items de facturas (supplier_invoice_items)
CREATE TABLE IF NOT EXISTS compras.supplier_invoice_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid REFERENCES compras.supplier_invoices(id) ON DELETE CASCADE,
    product_id uuid REFERENCES compras.products(id),
    description varchar(255),
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 7. Tabla de usuarios (users)
CREATE TABLE IF NOT EXISTS compras.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar(50) UNIQUE NOT NULL,
    email varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    first_name varchar(100),
    last_name varchar(100),
    role user_role DEFAULT 'EMPLOYEE',
    status boolean DEFAULT true,
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 8. Tabla de compañías (companies)
CREATE TABLE IF NOT EXISTS compras.companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    nit varchar(20) UNIQUE NOT NULL,
    address text,
    city varchar(100),
    phone varchar(20),
    email varchar(255),
    legal_representative varchar(255),
    logo_url varchar(500),
    status boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 9. Tabla de asientos contables (accounting_entries)
CREATE TABLE IF NOT EXISTS compras.accounting_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES compras.companies(id) NOT NULL,
    entry_number varchar(20) NOT NULL,
    entry_date date NOT NULL,
    description text,
    reference_type varchar(50),
    reference_id uuid,
    total_debit numeric(18,2) NOT NULL,
    total_credit numeric(18,2) NOT NULL,
    status entry_status_accounting DEFAULT 'DRAFT',
    created_by uuid REFERENCES compras.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT accounting_entries_pkey PRIMARY KEY (id),
    CONSTRAINT accounting_entries_company_id_entry_number_key UNIQUE (company_id, entry_number)
);

-- 10. Tabla de cuentas contables (chart_of_accounts)
CREATE TABLE IF NOT EXISTS compras.chart_of_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES compras.companies(id) NOT NULL,
    account_code varchar(20) NOT NULL,
    account_name varchar(255) NOT NULL,
    account_type varchar(50) NOT NULL,
    parent_account_id uuid REFERENCES compras.chart_of_accounts(id),
    level integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT chart_of_accounts_company_id_account_code_key UNIQUE (company_id, account_code)
);

-- 11. Tabla de movimientos contables (accounting_movements)
CREATE TABLE IF NOT EXISTS compras.accounting_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id uuid REFERENCES compras.accounting_entries(id) ON DELETE CASCADE,
    account_id uuid REFERENCES compras.chart_of_accounts(id) NOT NULL,
    description text,
    debit_amount numeric(18,2) DEFAULT 0,
    credit_amount numeric(18,2) DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 12. Tabla de bodegas (warehouses)
CREATE TABLE IF NOT EXISTS compras.warehouses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) UNIQUE NOT NULL,
    name varchar(255) NOT NULL,
    address text,
    city varchar(100),
    manager varchar(255),
    status boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 13. Tabla de entradas de bodega (warehouse_entries)
CREATE TABLE IF NOT EXISTS compras.warehouse_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number varchar(50) UNIQUE NOT NULL,
    warehouse_id uuid REFERENCES compras.warehouses(id) NOT NULL,
    supplier_id uuid REFERENCES compras.suppliers(id),
    purchase_order_id uuid REFERENCES compras.purchase_orders(id),
    entry_date date NOT NULL DEFAULT CURRENT_DATE,
    entry_type varchar(20) DEFAULT 'PURCHASE',
    notes text,
    created_by uuid REFERENCES compras.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 14. Tabla de items de entrada de bodega (warehouse_entry_items)
CREATE TABLE IF NOT EXISTS compras.warehouse_entry_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id uuid REFERENCES compras.warehouse_entries(id) ON DELETE CASCADE,
    product_id uuid REFERENCES compras.products(id) NOT NULL,
    quantity integer NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    total_cost numeric(12,2) NOT NULL,
    expiry_date date,
    batch_number varchar(50),
    created_at timestamptz DEFAULT now()
);

-- 15. Tabla de solicitudes de devolución (return_requests)
CREATE TABLE IF NOT EXISTS compras.return_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number varchar(50) UNIQUE NOT NULL,
    supplier_id uuid REFERENCES compras.suppliers(id) NOT NULL,
    purchase_order_id uuid REFERENCES compras.purchase_orders(id),
    request_date date NOT NULL DEFAULT CURRENT_DATE,
    reason text NOT NULL,
    status varchar(20) DEFAULT 'PENDING',
    created_by uuid REFERENCES compras.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 16. Tabla de items de solicitudes de devolución (return_request_items)
CREATE TABLE IF NOT EXISTS compras.return_request_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    return_request_id uuid REFERENCES compras.return_requests(id) ON DELETE CASCADE,
    product_id uuid REFERENCES compras.products(id) NOT NULL,
    quantity integer NOT NULL,
    reason text,
    created_at timestamptz DEFAULT now()
);

-- 17. Tabla de archivos adjuntos (document_attachments)
CREATE TABLE IF NOT EXISTS compras.document_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_type varchar(50) NOT NULL,
    reference_id uuid NOT NULL,
    file_name varchar(255) NOT NULL,
    file_path varchar(500) NOT NULL,
    file_size integer,
    mime_type varchar(100),
    uploaded_by uuid REFERENCES compras.users(id),
    created_at timestamptz DEFAULT now()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_suppliers_nit ON compras.suppliers(nit);
CREATE INDEX IF NOT EXISTS idx_products_code ON compras.products(code);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON compras.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON compras.purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier ON compras.supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_date ON compras.supplier_invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_company ON compras.accounting_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_date ON compras.accounting_entries(entry_date);

-- Insertar datos de ejemplo para proveedores
INSERT INTO compras.suppliers (name, nit, email, phone, address, city, department, contact_person, status) VALUES
('DISTRIBUIDORA COLOMBIANA SAS', '900123456-7', 'ventas@distcol.com', '+57 1 234-5678', 'Calle 100 # 15-20', 'Bogotá', 'Cundinamarca', 'María González', true),
('FERRETERÍA NACIONAL LTDA', '800987654-3', 'compras@ferrenacional.com', '+57 4 987-6543', 'Carrera 50 # 25-15', 'Medellín', 'Antioquia', 'Carlos Ramírez', true),
('SUMINISTROS INDUSTRIALES SA', '700456789-1', 'info@sumindustriales.com', '+57 2 456-7890', 'Avenida 3N # 12-45', 'Cali', 'Valle del Cauca', 'Ana Rodríguez', true);

-- Insertar productos de ejemplo
INSERT INTO compras.products (code, name, description, category, unit_of_measure, cost_price, sale_price, stock_quantity, minimum_stock) VALUES
('PROD001', 'Tornillo Phillips 1/2"', 'Tornillo cabeza Phillips acero inoxidable', 'Ferretería', 'UNIDAD', 150.00, 250.00, 500, 50),
('PROD002', 'Cable Eléctrico 12AWG', 'Cable eléctrico calibre 12 AWG por metro', 'Eléctrico', 'METRO', 2500.00, 3500.00, 100, 20),
('PROD003', 'Pintura Vinilo Blanco', 'Pintura vinilo interior blanco galón', 'Pinturas', 'GALÓN', 35000.00, 45000.00, 25, 5);

COMMIT;

-- Verificar que las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'compras' 
ORDER BY table_name;