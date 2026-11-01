import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue>({
  open: false,
  onOpenChange: () => {},
})

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  asChild?: boolean
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open: openProp, defaultOpen = false, onOpenChange, asChild = false, children, ...props }, ref) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : uncontrolledOpen

    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        if (!isControlled) {
          setUncontrolledOpen(newOpen)
        }
        onOpenChange?.(newOpen)
      },
      [isControlled, onOpenChange]
    )

    const Comp = asChild ? Slot : "div"

    return (
      <CollapsibleContext.Provider value={{ open: !!open, onOpenChange: handleOpenChange }}>
        <Comp
          ref={ref}
          data-slot="collapsible"
          data-state={open ? "open" : "closed"}
          {...props}
        >
          {children}
        </Comp>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = "Collapsible"

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ asChild = false, onClick, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(CollapsibleContext)
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : "button"}
        data-slot="collapsible-trigger"
        data-state={open ? "open" : "closed"}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(e)
          onOpenChange(!open)
        }}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
CollapsibleTrigger.displayName = "CollapsibleTrigger"

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ asChild = false, children, ...props }, ref) => {
    const { open } = React.useContext(CollapsibleContext)
    if (!open) return null

    const Comp = asChild ? Slot : "div"

    return (
      <Comp
        ref={ref}
        data-slot="collapsible-content"
        data-state={open ? "open" : "closed"}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
