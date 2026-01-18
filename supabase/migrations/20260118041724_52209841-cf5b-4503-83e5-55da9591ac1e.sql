-- Create sales table for consolidated results
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  sale_date DATE NOT NULL,
  month_year VARCHAR(10) NOT NULL,
  registered_by VARCHAR(100),
  patient_name VARCHAR(255) NOT NULL,
  patient_email VARCHAR(255),
  patient_cpf VARCHAR(20),
  medical_record VARCHAR(50),
  service_type VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  baldness_grade VARCHAR(10),
  branch VARCHAR(100),
  consulted_by VARCHAR(100),
  sold_by VARCHAR(100),
  patient_origin VARCHAR(100),
  origin_observation TEXT,
  vgv_initial DECIMAL(12,2) DEFAULT 0,
  deposit_paid DECIMAL(12,2) DEFAULT 0,
  exchange_value DECIMAL(12,2) DEFAULT 0,
  contract_status VARCHAR(100),
  distract_date DATE,
  in_clickup BOOLEAN DEFAULT false,
  in_conta_azul BOOLEAN DEFAULT false,
  in_surgery_schedule BOOLEAN DEFAULT false,
  in_feegow BOOLEAN DEFAULT false,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Admins can see all sales
CREATE POLICY "Admins can view all sales" 
ON public.sales 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert sales
CREATE POLICY "Admins can insert sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update sales
CREATE POLICY "Admins can update sales" 
ON public.sales 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete sales
CREATE POLICY "Admins can delete sales" 
ON public.sales 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Licensees can view their own sales
CREATE POLICY "Licensees can view own sales" 
ON public.sales 
FOR SELECT 
USING (auth.uid() = user_id);

-- Licensees can insert their own sales
CREATE POLICY "Licensees can insert own sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Licensees can update their own sales
CREATE POLICY "Licensees can update own sales" 
ON public.sales 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_month_year ON public.sales(month_year);
CREATE INDEX idx_sales_service_type ON public.sales(service_type);