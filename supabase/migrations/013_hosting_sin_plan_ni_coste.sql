-- El hosting ya no gestiona plan ni coste (la ficha y el formulario solo piden proveedor, fechas y estado).
-- Las columnas `plan` y `coste_anual` de `alojamientos` se mantienen (sin uso) y se vacían los valores que había.
update public.alojamientos set plan = '', coste_anual = 0 where plan <> '' or coste_anual <> 0;
