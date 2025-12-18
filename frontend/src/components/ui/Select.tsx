import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { cn } from "@/utils";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = "Select an option",
  error,
  disabled,
  className,
}: SelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={cn(
              "relative w-full py-2 pl-3 pr-10 text-left rounded-lg",
              "bg-background text-foreground",
              "border border-input shadow-sm backdrop-blur-sm",
              "transition-all duration-200",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-accent/5",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              error &&
                "border-destructive focus:border-destructive focus:ring-destructive/20"
            )}
          >
            <span
              className={cn(
                "block truncate",
                !selectedOption && "text-muted-foreground"
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className={cn(
                "absolute z-10 mt-1 w-full py-1 rounded-lg",
                "bg-popover border border-border backdrop-blur-xl",
                "shadow-xl shadow-black/20",
                "max-h-60 overflow-auto scrollbar-thin",
                "focus:outline-none"
              )}
            >
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={({ active, selected }) =>
                    cn(
                      "relative cursor-pointer select-none py-2 pl-10 pr-4 mx-1 rounded-md",
                      "transition-colors duration-150 text-muted-foreground",
                      active && "bg-accent text-foreground",
                      selected &&
                        "text-muted-foreground bg-primary/10 font-medium",
                      option.disabled && "opacity-50 cursor-not-allowed"
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={cn(
                          "block truncate",
                          selected && "font-medium"
                        )}
                      >
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                          <CheckIcon className="h-5 w-5" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      {error && <p className="mt-1.5 text-sm text-error-500">{error}</p>}
    </div>
  );
}

export default Select;
