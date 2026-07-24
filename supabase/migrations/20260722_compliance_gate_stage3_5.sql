-- Stage 3.5: Structured inspection failure reasons
-- Run AFTER 20260722_compliance_gate_stage3.sql

ALTER TABLE public.shipment_inspections
  ADD COLUMN IF NOT EXISTS failure_reason text;
