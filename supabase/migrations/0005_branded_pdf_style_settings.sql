insert into public.site_settings (key, value)
values (
  'pdf_style_settings',
  '{
    "PDF_STYLE_MODE": "branded",
    "template": "branded-living-portfolio",
    "latestFilename": "living-ai-ux-portfolio-latest.pdf"
  }'::jsonb
)
on conflict (key) do update
set
  value = public.site_settings.value || excluded.value,
  updated_at = now();
