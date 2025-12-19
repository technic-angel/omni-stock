import { Link } from 'react-router-dom'

import Card from '../../../shared/components/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { useVendorStores } from '../hooks/useVendorStores'

const StoreListCard = () => {
  const { data, isLoading, error } = useVendorStores()
  const stores =
    data?.filter((store) => store.name.trim().toLowerCase() !== 'default store'.toLowerCase()) ??
    []

  return (
    <Card title="Stores">
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading stores…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load stores.</p>
      ) : stores.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow key={store.id}>
                <TableCell>{store.name}</TableCell>
                <TableCell className="capitalize">{store.type ?? 'N/A'}</TableCell>
              <TableCell>{store.is_active ? 'Active' : 'Inactive'}</TableCell>
              <TableCell className="text-right">
                <Link
                  to={`/stores/${store.id}`}
                  className="text-sm font-semibold text-brand-primary hover:underline"
                >
                  Manage
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      ) : (
        <p className="text-sm text-gray-500">No stores yet.</p>
      )}
    </Card>
  )
}

export default StoreListCard
