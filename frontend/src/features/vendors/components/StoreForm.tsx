import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import Card from '../../../shared/components/Card'
import { storeSchema, type StoreInput } from '../schema/storeSchema'
import { useCreateStore } from '../hooks/useCreateStore'

type Props = {
  onCreated?: () => void
}

const StoreForm = ({ onCreated }: Props) => {
  const { mutateAsync, isPending } = useCreateStore()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreInput>({
    resolver: zodResolver(storeSchema),
    defaultValues: { name: '', description: '', address: '' },
  })

  const onSubmit = async (values: StoreInput) => {
    await mutateAsync(values)
    reset()
    onCreated?.()
  }

  return (
    <Card title="Create Store">
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm">
          Store Name
          <input className="mt-1 w-full rounded border p-2" {...register('name')} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </label>
        <label className="block text-sm">
          Description
          <textarea
            className="mt-1 w-full rounded border p-2"
            rows={2}
            {...register('description')}
          />
        </label>
        <label className="block text-sm">
          Address
          <textarea
            className="mt-1 w-full rounded border p-2"
            rows={2}
            {...register('address')}
          />
        </label>
        <div className="flex justify-end">
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? 'Saving…' : 'Create'}
          </button>
        </div>
      </form>
    </Card>
  )
}

export default StoreForm
