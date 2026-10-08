import * as React from 'react'
import { cn } from '@/lib/utils'

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}
const TableHeader = ({ className, ...props }: React.ComponentProps<'thead'>) => <thead className={cn('border-b bg-muted/40 [&_tr]:border-b-0', className)} {...props} />
const TableBody = ({ className, ...props }: React.ComponentProps<'tbody'>) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
const TableRow = ({ className, ...props }: React.ComponentProps<'tr'>) => <tr className={cn('border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted', className)} {...props} />
const TableHead = ({ className, ...props }: React.ComponentProps<'th'>) => (
  <th className={cn('h-10 px-3 text-left align-middle text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase', className)} {...props} />
)
const TableCell = ({ className, ...props }: React.ComponentProps<'td'>) => <td className={cn('px-3 py-3 align-middle', className)} {...props} />

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
