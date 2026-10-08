import { Check } from 'lucide-react'
import { DropdownMenu as MenuPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

const DropdownMenu = MenuPrimitive.Root
const DropdownMenuTrigger = MenuPrimitive.Trigger

function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content sideOffset={sideOffset} className={cn('z-50 min-w-44 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg animate-fade-up', className)} {...props} />
    </MenuPrimitive.Portal>
  )
}
function DropdownMenuItem({ className, destructive, ...props }: React.ComponentProps<typeof MenuPrimitive.Item> & { destructive?: boolean }) {
  return (
    <MenuPrimitive.Item
      className={cn('relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground', destructive && 'text-destructive data-[highlighted]:bg-destructive/10 [&_svg]:text-destructive', className)}
      {...props}
    />
  )
}
function DropdownMenuCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem className={cn('relative flex cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2.5 pl-8 text-sm outline-none select-none data-[highlighted]:bg-accent', className)} {...props}>
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <Check className="size-4" />
        </MenuPrimitive.ItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}
const DropdownMenuLabel = ({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Label>) => <MenuPrimitive.Label className={cn('px-2.5 py-1.5 text-xs font-medium text-muted-foreground', className)} {...props} />
const DropdownMenuSeparator = ({ className, ...props }: React.ComponentProps<typeof MenuPrimitive.Separator>) => <MenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />

export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger }
