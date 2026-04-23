-- Tabela empresas
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  site_url TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read empresas"
ON public.empresas FOR SELECT
USING (true);

CREATE POLICY "Admin insert empresas"
ON public.empresas FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update empresas"
ON public.empresas FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete empresas"
ON public.empresas FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Bucket de logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('empresa-logos', 'empresa-logos', true);

CREATE POLICY "Public read empresa-logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'empresa-logos');

CREATE POLICY "Admin upload empresa-logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'empresa-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update empresa-logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'empresa-logos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete empresa-logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'empresa-logos' AND has_role(auth.uid(), 'admin'::app_role));