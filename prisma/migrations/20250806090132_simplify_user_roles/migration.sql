-- Migration pour simplifier les rôles utilisateur
-- SUPER_ADMIN et ADMIN fusionnent vers ADMIN
-- FRANCHISE_MANAGER et FRANCHISEE fusionnent vers FRANCHISEE

-- Transférer tous les SUPER_ADMIN vers ADMIN
UPDATE users SET role = 'ADMIN' WHERE role = 'SUPER_ADMIN';

-- Transférer tous les FRANCHISE_MANAGER vers FRANCHISEE  
UPDATE users SET role = 'FRANCHISEE' WHERE role = 'FRANCHISE_MANAGER';