-- Khởi tạo database và phân quyền riêng biệt cho từng service theo kiến trúc database-per-service
CREATE DATABASE identity_db;
CREATE USER identity_user WITH ENCRYPTED PASSWORD 'identity_pass';
GRANT ALL PRIVILEGES ON DATABASE identity_db TO identity_user;

CREATE DATABASE catalog_db;
CREATE USER catalog_user WITH ENCRYPTED PASSWORD 'catalog_pass';
GRANT ALL PRIVILEGES ON DATABASE catalog_db TO catalog_user;

CREATE DATABASE inventory_db;
CREATE USER inventory_user WITH ENCRYPTED PASSWORD 'inventory_pass';
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;

CREATE DATABASE order_db;
CREATE USER order_user WITH ENCRYPTED PASSWORD 'order_pass';
GRANT ALL PRIVILEGES ON DATABASE order_db TO order_user;

CREATE DATABASE secondhand_db;
CREATE USER secondhand_user WITH ENCRYPTED PASSWORD 'secondhand_pass';
GRANT ALL PRIVILEGES ON DATABASE secondhand_db TO secondhand_user;

CREATE DATABASE warranty_db;
CREATE USER warranty_user WITH ENCRYPTED PASSWORD 'warranty_pass';
GRANT ALL PRIVILEGES ON DATABASE warranty_db TO warranty_user;
