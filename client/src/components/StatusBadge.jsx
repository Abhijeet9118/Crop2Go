export default function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    collected: 'bg-gray-100 text-gray-800',
    weighed: 'bg-indigo-100 text-indigo-800',
    graded: 'bg-purple-100 text-purple-800',
    aggregated: 'bg-cyan-100 text-cyan-800',
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    selling: 'bg-orange-100 text-orange-800',
    sold: 'bg-green-100 text-green-800',
    in_transit: 'bg-purple-100 text-purple-800',
    loading: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    dispatched: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    available: 'bg-green-100 text-green-800',
    booked: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800',
    growing: 'bg-green-100 text-green-800',
    harvested: 'bg-yellow-100 text-yellow-800',
  };
  const s = styles[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}
