import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

const Command = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) => <CommandPrimitive className={cn('flex w-full flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground', className)} {...props} />

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b px-4">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input className={cn('h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground', className)} {...props} />
    </div>
  )
}
const CommandList = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) => <CommandPrimitive.List className={cn('max-h-[min(24rem,60dvh)] overflow-y-auto p-2', className)} {...props} />
const CommandEmpty = (props: React.ComponentProps<typeof CommandPrimitive.Empty>) => <CommandPrimitive.Empty className="py-10 text-center text-sm text-muted-foreground" {...props} />
const CommandGroup = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) => (
  <CommandPrimitive.Group className={cn('overflow-hidden py-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground', className)} {...props} />
)
const CommandItem = ({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) => (
  <CommandPrimitive.Item className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-[selected=true]:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground', className)} {...props} />
)
export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList }
