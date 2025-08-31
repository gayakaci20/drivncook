-- Créer un utilisateur admin
INSERT INTO users (id, email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'admin-1',
  'gaya.kaci2002@hotmail.fr',
  '$2a$12$LQv3c1yqBWVHxkd0LQ4YNu.VhVpqhpOvLuP1X2Z3X1X1X1X1X1X1X',
  'Admin',
  'System',
  'ADMIN',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Créer quelques catégories de base
INSERT INTO product_categories (id, name, description, "isActive", "createdAt", "updatedAt")
VALUES 
  ('cat-viandes', 'Viandes', 'Produits carnés', true, NOW(), NOW()),
  ('cat-legumes', 'Légumes', 'Légumes frais', true, NOW(), NOW()),
  ('cat-epices', 'Épices', 'Épices et condiments', true, NOW(), NOW()),
  ('cat-boissons', 'Boissons', 'Boissons diverses', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
