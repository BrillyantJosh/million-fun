-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create app_settings table
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  financing_inspirations DECIMAL(10,2) NOT NULL DEFAULT 0,
  enhancing_current_system DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view app settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

-- Only admins can update settings
CREATE POLICY "Only admins can update app settings" 
ON public.app_settings 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.admins LIMIT 1));

-- Only admins can insert settings
CREATE POLICY "Only admins can insert app settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.admins LIMIT 1));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.app_settings (financing_inspirations, enhancing_current_system)
VALUES (10000, 5000);