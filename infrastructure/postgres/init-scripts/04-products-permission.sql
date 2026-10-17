INSERT INTO permissions (id, name, category, description, code, module)
VALUES 
  ('products:view', 'Xem danh muc san pham', 'PRODUCTS', 'Xem danh sach san pham va thong tin chi nhanh', 'PERM_PRODUCTS_VIEW', 'PRODUCTS'),
  ('products:manage', 'Quan ly san pham chi nhanh', 'PRODUCTS', 'Them, sua thong tin san pham va ton kho theo chi nhanh', 'PERM_PRODUCTS_MANAGE', 'PRODUCTS')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description, code = EXCLUDED.code, module = EXCLUDED.module;

INSERT INTO role_permissions (role_id, permission_id)
VALUES 
  ('ADMIN', 'products:view'),
  ('ADMIN', 'products:manage'),
  ('BRANCH_MANAGER', 'products:view'),
  ('BRANCH_MANAGER', 'products:manage'),
  ('STAFF', 'products:view')
ON CONFLICT DO NOTHING;
