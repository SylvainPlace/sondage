PRAGMA foreign_keys = ON;

INSERT INTO taxonomy_category (id, kind, parent_id, code, label, sort_order) VALUES
  ('domain_product', 'domain', NULL, 'product', 'Produit', 10),
  ('domain_project', 'domain', NULL, 'project_management', 'Gestion de projet', 20),
  ('domain_software', 'domain', NULL, 'software_engineering', 'Ingénierie logicielle', 30),
  ('domain_data_ai', 'domain', NULL, 'data_ai', 'Données et IA', 40),
  ('domain_infra_ops', 'domain', NULL, 'infrastructure_operations', 'Infrastructure et opérations', 50),
  ('domain_cyber', 'domain', NULL, 'cybersecurity', 'Cybersécurité', 60),
  ('domain_consulting', 'domain', NULL, 'consulting_integration', 'Conseil et intégration', 70),
  ('domain_research', 'domain', NULL, 'research', 'Recherche', 80),
  ('domain_sales', 'domain', NULL, 'sales_customer_relations', 'Commerce et relation client', 90),
  ('domain_other', 'domain', NULL, 'other', 'Autre', 999);

INSERT INTO taxonomy_category (id, kind, parent_id, code, label, sort_order) VALUES
  ('occupation_product_manager', 'occupation', 'domain_product', 'product_manager', 'Product Manager', 10),
  ('occupation_product_owner', 'occupation', 'domain_product', 'product_owner', 'Product Owner', 20),
  ('occupation_product_designer', 'occupation', 'domain_product', 'product_designer', 'Product Designer', 30),
  ('occupation_project_manager', 'occupation', 'domain_project', 'project_manager', 'Chef de projet', 10),
  ('occupation_program_manager', 'occupation', 'domain_project', 'program_manager', 'Responsable de programme', 20),
  ('occupation_scrum_master', 'occupation', 'domain_project', 'scrum_master', 'Scrum Master', 30),
  ('occupation_software_engineer', 'occupation', 'domain_software', 'software_engineer', 'Ingénieur logiciel', 10),
  ('occupation_frontend', 'occupation', 'domain_software', 'frontend_engineer', 'Développeur frontend', 20),
  ('occupation_backend', 'occupation', 'domain_software', 'backend_engineer', 'Développeur backend', 30),
  ('occupation_mobile', 'occupation', 'domain_software', 'mobile_engineer', 'Développeur mobile', 40),
  ('occupation_qa', 'occupation', 'domain_software', 'quality_engineer', 'Ingénieur qualité logicielle', 50),
  ('occupation_data_analyst', 'occupation', 'domain_data_ai', 'data_analyst', 'Data Analyst', 10),
  ('occupation_data_engineer', 'occupation', 'domain_data_ai', 'data_engineer', 'Data Engineer', 20),
  ('occupation_data_scientist', 'occupation', 'domain_data_ai', 'data_scientist', 'Data Scientist', 30),
  ('occupation_ml_engineer', 'occupation', 'domain_data_ai', 'machine_learning_engineer', 'Machine Learning Engineer', 40),
  ('occupation_devops', 'occupation', 'domain_infra_ops', 'devops_engineer', 'Ingénieur DevOps', 10),
  ('occupation_sre', 'occupation', 'domain_infra_ops', 'site_reliability_engineer', 'Site Reliability Engineer', 20),
  ('occupation_systems', 'occupation', 'domain_infra_ops', 'systems_engineer', 'Ingénieur systèmes', 30),
  ('occupation_network', 'occupation', 'domain_infra_ops', 'network_engineer', 'Ingénieur réseaux', 40),
  ('occupation_security_engineer', 'occupation', 'domain_cyber', 'security_engineer', 'Ingénieur cybersécurité', 10),
  ('occupation_security_analyst', 'occupation', 'domain_cyber', 'security_analyst', 'Analyste cybersécurité', 20),
  ('occupation_security_consultant', 'occupation', 'domain_cyber', 'security_consultant', 'Consultant cybersécurité', 30),
  ('occupation_consultant', 'occupation', 'domain_consulting', 'consultant', 'Consultant', 10),
  ('occupation_solution_architect', 'occupation', 'domain_consulting', 'solution_architect', 'Architecte solution', 20),
  ('occupation_integration_engineer', 'occupation', 'domain_consulting', 'integration_engineer', 'Ingénieur intégration', 30),
  ('occupation_research_engineer', 'occupation', 'domain_research', 'research_engineer', 'Ingénieur de recherche', 10),
  ('occupation_researcher', 'occupation', 'domain_research', 'researcher', 'Chercheur', 20),
  ('occupation_sales', 'occupation', 'domain_sales', 'sales', 'Commercial', 10),
  ('occupation_account_manager', 'occupation', 'domain_sales', 'account_manager', 'Account Manager', 20),
  ('occupation_customer_success', 'occupation', 'domain_sales', 'customer_success', 'Customer Success Manager', 30),
  ('occupation_other', 'occupation', 'domain_other', 'other', 'Autre', 999);

INSERT INTO taxonomy_category (id, kind, parent_id, code, label, sort_order) VALUES
  ('sector_technology', 'sector', NULL, 'technology', 'Technologies et numérique', 10),
  ('sector_industry', 'sector', NULL, 'industry', 'Industrie', 20),
  ('sector_energy', 'sector', NULL, 'energy_environment', 'Énergie et environnement', 30),
  ('sector_construction', 'sector', NULL, 'construction_real_estate', 'Construction et immobilier', 40),
  ('sector_transport', 'sector', NULL, 'transport_logistics', 'Transport et logistique', 50),
  ('sector_finance', 'sector', NULL, 'finance_insurance', 'Finance et assurance', 60),
  ('sector_health', 'sector', NULL, 'health', 'Santé', 70),
  ('sector_education', 'sector', NULL, 'education_research', 'Éducation et recherche', 80),
  ('sector_public', 'sector', NULL, 'public_services', 'Services publics', 90),
  ('sector_commerce', 'sector', NULL, 'commerce_consumer', 'Commerce et biens de consommation', 100),
  ('sector_media', 'sector', NULL, 'media_communication', 'Médias et communication', 110),
  ('sector_business_services', 'sector', NULL, 'business_services', 'Services aux entreprises', 120),
  ('sector_non_profit', 'sector', NULL, 'non_profit_social', 'Économie sociale et associations', 130),
  ('sector_other', 'sector', NULL, 'other', 'Autre', 999),
  ('sector_health_hospital', 'sector', 'sector_health', 'hospital', 'Hôpital et soins', 10),
  ('sector_health_pharma', 'sector', 'sector_health', 'pharma', 'Pharmacie et biotechnologies', 20),
  ('sector_public_administration', 'sector', 'sector_public', 'public_administration', 'Administration publique', 10),
  ('sector_public_local', 'sector', 'sector_public', 'local_government', 'Collectivités territoriales', 20),
  ('sector_education_higher', 'sector', 'sector_education', 'higher_education', 'Enseignement supérieur', 10),
  ('sector_education_research', 'sector', 'sector_education', 'research', 'Recherche', 20);

INSERT INTO taxonomy_category
  (id, kind, parent_id, code, label, value_type, default_unit, sort_order)
VALUES
  ('benefit_remote', 'benefit', NULL, 'remote_work', 'Télétravail', 'count', 'days_per_week', 10),
  ('benefit_meal', 'benefit', NULL, 'meal_voucher', 'Tickets restaurant', 'amount', 'currency_per_day', 20),
  ('benefit_car', 'benefit', NULL, 'company_car', 'Voiture de fonction', 'boolean', NULL, 30),
  ('benefit_leave', 'benefit', NULL, 'extra_leave', 'RTT et congés supplémentaires', 'count', 'days_per_year', 40),
  ('benefit_profit', 'benefit', NULL, 'profit_sharing', 'Intéressement et participation', 'amount', 'currency_per_year', 50),
  ('benefit_other', 'benefit', NULL, 'other', 'Autre', 'text', NULL, 999);

INSERT INTO taxonomy_alias
  (id, category_id, kind, normalized_value, match_mode, created_at)
VALUES
  ('alias_ticket_resto', 'benefit_meal', 'benefit', 'ticket resto', 'exact', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('alias_carte_resto', 'benefit_meal', 'benefit', 'carte resto', 'exact', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('alias_rtt', 'benefit_leave', 'benefit', 'rtt', 'exact', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('alias_interessement', 'benefit_profit', 'benefit', 'interessement', 'suggestion', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('alias_participation', 'benefit_profit', 'benefit', 'participation', 'suggestion', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('alias_hopital', 'sector_health_hospital', 'sector', 'hopital', 'suggestion', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
