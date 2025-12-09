import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select an option',
  error,
  disabled,
  className,
}: SelectProps) {
  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-primary mb-1.5">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={cn(
              'relative w-full py-2.5 pl-4 pr-10 text-left rounded-xl',
              'bg-surface text-primary',
              'shadow-[inset_2px_2px_4px_var(--shadow-dark),inset_-2px_-2px_4px_var(--shadow-light)]',
              'border border-transparent',
              'focus:outline-none focus:border-primary-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-error-500'
            )}
          >
            <span className={cn('block truncate', !selectedOption && 'text-muted')}>
              {selectedOption?.label || placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon className="h-5 w-5 text-muted" />
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
                'absolute z-10 mt-2 w-full py-2 rounded-xl',
                'bg-surface',
                'shadow-[5px_5px_10px_var(--shadow-dark),-5px_-5px_10px_var(--shadow-light)]',
                'max-h-60 overflow-auto scrollbar-thin',
                'focus:outline-none'
              )}
            >
              {options.map(option => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={({ active, selected }) =>
                    cn(
                      'relative cursor-pointer select-none py-2.5 pl-10 pr-4',
                      'transition-colors duration-150',
                      active && 'bg-primary-50 dark:bg-primary-900/20',
                      selected && 'text-primary-600 dark:text-primary-400',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={cn('block truncate', selected && 'font-medium')}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
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
  )
}

export default Select
