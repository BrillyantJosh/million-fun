-- Insert default app_settings if none exist
INSERT INTO public.app_settings (financing_inspirations, enhancing_current_system)
SELECT 10000, 5000
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);