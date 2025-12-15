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
        <label className="block text-sm font-medium text-primary mb-1.5">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={cn(
              "relative w-full py-2 pl-3 pr-10 text-left rounded-lg",
              "bg-white/5 text-white",
              "border border-white/10 shadow-sm backdrop-blur-sm",
              "transition-all duration-200",
              "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              error &&
                "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            )}
          >
            <span
              className={cn(
                "block truncate",
                !selectedOption && "text-gray-400"
              )}
            >
              {selectedOption?.label || placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
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
                "bg-[#0a0a0f]/95 border border-white/10 backdrop-blur-xl",
                "shadow-xl shadow-black/50",
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
                      "transition-colors duration-150 text-gray-300",
                      active && "bg-white/10 text-white",
                      selected && "text-blue-400 bg-blue-500/10 font-medium",
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
