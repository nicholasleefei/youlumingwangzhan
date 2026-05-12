with src as (
  select distinct on (lower(trim(i.email)))
    lower(trim(i.email)) as email,
    nullif(trim(i.company_name), '') as company_name,
    nullif(trim(i.contact_name), '') as contact_name,
    nullif(trim(i.whatsapp), '') as whatsapp,
    nullif(trim(i.country_region), '') as country_region,
    i.created_at as last_inquiry_at,
    'inquiry_form' as source
  from public.inquiries i
  where i.email is not null and trim(i.email) <> ''
  order by lower(trim(i.email)), i.created_at desc
)
insert into public.customers (email, company_name, contact_name, whatsapp, country_region, last_inquiry_at, source)
select email, company_name, contact_name, whatsapp, country_region, last_inquiry_at, source
from src
on conflict (email_norm) do update
set
  company_name = coalesce(excluded.company_name, customers.company_name),
  contact_name = coalesce(excluded.contact_name, customers.contact_name),
  whatsapp = coalesce(excluded.whatsapp, customers.whatsapp),
  country_region = coalesce(excluded.country_region, customers.country_region),
  last_inquiry_at = greatest(customers.last_inquiry_at, excluded.last_inquiry_at),
  updated_at = now();

update public.inquiries i
set customer_id = c.id
from public.customers c
where i.customer_id is null
  and i.email is not null
  and lower(trim(i.email)) = c.email_norm;
