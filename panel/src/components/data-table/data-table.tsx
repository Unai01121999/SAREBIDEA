'use client'

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3, Download, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableProps<T> {
  columns: Col<T>[]
  data: T[] | undefined
  loading?: boolean
  /** Texto en el que busca el cuadro de búsqueda. */
  searchText: (row: T) => string
  searchPlaceholder?: string
  /** Filtros propios (selects, pestañas…) a la derecha de la búsqueda. */
  toolbar?: ReactNode
  onRowClick?: (row: T) => void
  /** Si se indica, aparece el botón "Exportar" con las filas filtradas y ordenadas. */
  onExport?: (rows: T[]) => void
  initialSort?: SortingState
  /** Texto con el que arranca la búsqueda (p. ej. desde la búsqueda global). */
  initialSearch?: string
  pageSize?: number
  emptyTitle?: string
  emptyText?: string
  emptyAction?: ReactNode
  rowClassName?: (row: T) => string | undefined
}

/**
 * Tabla avanzada: búsqueda, ordenación, columnas visibles, paginación y exportación.
 * Trabaja en el cliente (válido hasta varios miles de filas). Para volúmenes mayores, cambiar a modo servidor con
 * `manualPagination/manualSorting/manualFiltering` y pasar los parámetros a la API (ver README).
 */
export function DataTable<T>({ columns, data, loading, searchText, searchPlaceholder = 'Buscar…', toolbar, onRowClick, onExport, initialSort = [], initialSearch = '', pageSize = 10, emptyTitle = 'Sin resultados', emptyText = 'Prueba a cambiar la búsqueda o los filtros.', emptyAction, rowClassName }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSort)
  const [globalFilter, setGlobalFilter] = useState(initialSearch)
  const [visibility, setVisibility] = useState<VisibilityState>({})
  const rows = useMemo(() => data ?? [], [data])

  const table = useReactTable<T>({
    data: rows,
    columns,
    state: { sorting, globalFilter, columnVisibility: visibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setVisibility,
    globalFilterFn: (row, _id, value: string) => searchText(row.original).toLowerCase().includes(value.toLowerCase().trim()),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const filteredCount = table.getPrePaginationRowModel().rows.length
  const { pageIndex, pageSize: size } = table.getState().pagination
  const from = filteredCount ? pageIndex * size + 1 : 0
  const to = Math.min(filteredCount, (pageIndex + 1) * size)
  const hideable = table.getAllLeafColumns().filter((c) => c.getCanHide() && typeof c.columnDef.header === 'string')

  return (
    <div className="rounded-xl border bg-card shadow-xs">
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder} className="pl-9" aria-label="Buscar" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {toolbar}
          {hideable.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 /> Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
                {hideable.map((c) => (
                  <DropdownMenuCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(!!v)} onSelect={(e) => e.preventDefault()}>
                    {c.columnDef.header as string}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(table.getPrePaginationRowModel().rows.map((r) => r.original))} disabled={!filteredCount}>
              <Download /> Exportar
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((h) => {
                const sortable = h.column.getCanSort()
                const dir = h.column.getIsSorted()
                return (
                  <TableHead key={h.id} aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : undefined}>
                    {h.isPlaceholder ? null : sortable ? (
                      <button type="button" onClick={h.column.getToggleSortingHandler()} className="-ml-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 uppercase transition-colors hover:text-foreground">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {dir === 'asc' ? <ArrowUp className="size-3" /> : dir === 'desc' ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {table.getVisibleLeafColumns().map((c) => (
                  <TableCell key={c.id}>
                    <Skeleton className="h-5 w-full max-w-40" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onKeyDown={onRowClick ? (e) => (e.key === 'Enter' && e.target === e.currentTarget ? onRowClick(row.original) : undefined) : undefined}
                className={cn(onRowClick && 'cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none', rowClassName?.(row.original))}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={table.getVisibleLeafColumns().length} className="py-16 text-center">
                <p className="font-medium">{emptyTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{emptyText}</p>
                {emptyAction && <div className="mt-4">{emptyAction}</div>}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-2 border-t px-4 py-3 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="tabular">{filteredCount ? `${from}–${to} de ${filteredCount}` : '0 resultados'}</span>
        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-2 sm:flex">
            Filas
            <Select value={String(size)} onValueChange={(v) => table.setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[4.5rem]" aria-label="Filas por página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Página anterior">
              <ChevronLeft />
            </Button>
            <span className="min-w-16 text-center tabular">
              {filteredCount ? pageIndex + 1 : 0} / {Math.max(1, table.getPageCount())}
            </span>
            <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Página siguiente">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Definición de columna con tipado cómodo (TanStack Table exige `any` en el valor para mezclar columnas de distinto tipo). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Col<T> = ColumnDef<T, any>
