import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, onWheel, ...props }: React.ComponentProps<"input">) {
  const esNumero = type === "number"

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      // La rueda del mouse sobre un campo numérico enfocado le cambia el valor
      // en silencio. Al desplazarse por un formulario largo eso pisaba precios
      // y cantidades sin que nadie lo notara: se le saca el foco y la página
      // sigue scrolleando normal.
      onWheel={
        esNumero
          ? (e) => {
              e.currentTarget.blur()
              onWheel?.(e)
            }
          : onWheel
      }
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        // Las flechitas de incremento son un blanco chico al lado del texto:
        // un click apenas corrido restaba un paso a la cantidad.
        esNumero &&
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className
      )}
      {...props}
    />
  )
}

export { Input }
