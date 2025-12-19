import Card from '../../../shared/components/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'

const DUMMY_STORES = [
  { id: 1, name: 'Flagship HQ', type: 'retail', status: 'Active' },
  { id: 2, name: 'Online Storefront', type: 'online', status: 'Active' },
  { id: 3, name: 'Pop-up LA', type: 'popup', status: 'Planning' },
]

const StoreListCard = () => {
  return (
    <Card title="Stores">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DUMMY_STORES.map((store) => (
            <TableRow key={store.id}>
              <TableCell>{store.name}</TableCell>
              <TableCell className="capitalize">{store.type}</TableCell>
              <TableCell>{store.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export default StoreListCard
