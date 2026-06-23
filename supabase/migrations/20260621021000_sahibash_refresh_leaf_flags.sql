-- Sahibash V8.1: refresh category leaf flags after deep real-estate seed

begin;

select public.refresh_category_leaf_flags();

commit;
